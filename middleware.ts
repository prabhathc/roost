import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

// Routes that don't require authentication
const publicRoutes = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/auth/callback',
  '/verify-email',
]);

// Routes that should redirect to dashboard if authenticated
const authRoutes = new Set(['/login', '/signup']);

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createClient(request, response);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Auth session error:', sessionError);
      throw sessionError;
    }

    const { pathname } = request.nextUrl;

    // Allow public routes
    if (publicRoutes.has(pathname)) {
      // If user is logged in and trying to access auth routes, redirect to dashboard
      if (session && authRoutes.has(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return response;
    }

    // Protected routes - require authentication
    if (!session) {
      const redirectTo = new URLSearchParams({ redirectTo: pathname });
      return NextResponse.redirect(new URL(`/login?${redirectTo}`, request.url));
    }

    // User is authenticated, allow access to protected routes
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Clear any existing auth cookies on error
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/public).*)',
  ],
}; 