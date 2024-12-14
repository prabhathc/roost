import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from './layout';

export default async function DashboardLayoutServer({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    redirect('/login');
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    redirect('/login');
  }

  return (
    <DashboardLayout
      user={{
        email: session.user.email!,
        role: profile.role,
      }}
    >
      {children}
    </DashboardLayout>
  );
} 