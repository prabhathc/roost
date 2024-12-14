import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('Auth callback route executing...');
  
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const error_description = requestUrl.searchParams.get('error_description');
    const role = requestUrl.searchParams.get('role') || 'tenant';

    console.log('Auth callback params:', { code: !!code, error, error_description, role });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error_description || error)}`, request.url)
      );
    }

    if (!code) {
      console.error('No code provided');
      return NextResponse.redirect(
        new URL('/login?error=missing_code', request.url)
      );
    }

    console.log('Creating Supabase client...');
    const supabase = await createClient();

    // Exchange the code for a session
    console.log('Exchanging code for session...');
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(sessionError.message)}`, request.url)
      );
    }

    if (!session?.user) {
      console.error('No user in session');
      return NextResponse.redirect(
        new URL('/login?error=no_user', request.url)
      );
    }

    console.log('Session established for user:', session.user.id);

    // Create or update profile
    console.log('Updating user profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        role,
        first_name: session.user.user_metadata?.first_name,
        last_name: session.user.user_metadata?.last_name,
        phone: session.user.user_metadata?.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(profileError.message)}`, request.url)
      );
    }

    // Create role-specific record
    console.log('Creating role-specific record...');
    const tableName = role === 'landlord' ? 'landlords' : 'tenants';
    const roleRecord = role === 'landlord'
      ? {
          id: session.user.id,
          company_name: session.user.user_metadata?.company || null,
          verification_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      : {
          id: session.user.id,
          background_check_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

    const { error: roleError } = await supabase
      .from(tableName)
      .upsert(roleRecord, {
        onConflict: 'id'
      });

    if (roleError) {
      console.error('Role record error:', roleError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(roleError.message)}`, request.url)
      );
    }

    console.log('Auth callback completed successfully, redirecting to dashboard...');
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Ensure cookies are properly set in the response
    const authCookies = response.cookies.getAll();
    console.log('Auth cookies being set:', authCookies.map(c => ({ name: c.name, options: c })));
    
    return response;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=callback_failed', request.url)
    );
  }
} 