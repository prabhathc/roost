'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        const supabase = createClient();
        
        // Get hash parameters from URL
        const hash = window.location.hash.substring(1);
        const isSignup = hash.includes('signup=true');
        
        // Get the user data
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error('No user found');
        }

        if (isSignup) {
          // Create profile record if it doesn't exist
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              first_name: user.user_metadata.first_name,
              last_name: user.user_metadata.last_name,
              phone: user.user_metadata.phone,
              role: user.user_metadata.role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            throw profileError;
          }

          // Create role-specific record
          const role = user.user_metadata.role;
          if (role === 'landlord') {
            const { error: landlordError } = await supabase
              .from('landlords')
              .upsert({
                id: user.id,
                company_name: user.user_metadata.company || null,
                verification_status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'id'
              });

            if (landlordError) {
              throw landlordError;
            }
          } else if (role === 'tenant') {
            const { error: tenantError } = await supabase
              .from('tenants')
              .upsert({
                id: user.id,
                background_check_status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'id'
              });

            if (tenantError) {
              throw tenantError;
            }
          }
        }

        setStatus('success');
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('Auth confirmation error:', error);
        setStatus('error');
        setError(error instanceof Error ? error.message : 'Failed to confirm authentication');
      }
    }

    handleAuth();
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Setting up your account...</h2>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error || 'Something went wrong.'}</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Success! </strong>
        <span className="block sm:inline">Your account has been verified.</span>
      </div>
      <p className="mt-4 text-gray-600">Redirecting you to your dashboard...</p>
    </div>
  );
} 