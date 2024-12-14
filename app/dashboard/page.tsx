import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // Get data based on user role
  let dashboardData;
  if (profile?.role === 'landlord') {
    const { data: properties } = await supabase
      .from('properties')
      .select(`
        *,
        applications (count),
        leases (count),
        maintenance_requests (count)
      `)
      .eq('landlord_id', session.user.id);
    
    dashboardData = {
      properties: properties || [],
    };
  } else {
    const { data: applications } = await supabase
      .from('applications')
      .select('*, property:properties(*)')
      .eq('tenant_id', session.user.id);

    const { data: lease } = await supabase
      .from('leases')
      .select('*, property:properties(*)')
      .eq('tenant_id', session.user.id)
      .eq('status', 'active')
      .single();

    const { data: maintenanceRequests } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('tenant_id', session.user.id)
      .order('created_at', { ascending: false });

    dashboardData = {
      applications: applications || [],
      lease,
      maintenanceRequests: maintenanceRequests || [],
    };
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome back, {profile?.first_name}
      </h1>
      
      <div className="mt-6">
        {profile?.role === 'landlord' ? (
          // Landlord Dashboard
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardData.properties.map((property: any) => (
              <div key={property.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">{property.address}</h3>
                  <dl className="mt-2 divide-y divide-gray-200">
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Applications</dt>
                      <dd className="text-sm text-gray-900">{property.applications?.count || 0}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Active Leases</dt>
                      <dd className="text-sm text-gray-900">{property.leases?.count || 0}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Maintenance Requests</dt>
                      <dd className="text-sm text-gray-900">{property.maintenance_requests?.count || 0}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Tenant Dashboard
          <div className="space-y-6">
            {/* Active Lease */}
            {dashboardData.lease && (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">Current Lease</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{dashboardData.lease.property.address}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(dashboardData.lease.start_date).toLocaleDateString()} - 
                      {new Date(dashboardData.lease.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Applications */}
            {dashboardData.applications.length > 0 && (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
                  <ul className="mt-2 divide-y divide-gray-200">
                    {dashboardData.applications.map((application: any) => (
                      <li key={application.id} className="py-3">
                        <p className="text-sm text-gray-900">{application.property.address}</p>
                        <p className="text-sm text-gray-500">Status: {application.status}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Maintenance Requests */}
            {dashboardData.maintenanceRequests.length > 0 && (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">Recent Maintenance Requests</h3>
                  <ul className="mt-2 divide-y divide-gray-200">
                    {dashboardData.maintenanceRequests.map((request: any) => (
                      <li key={request.id} className="py-3">
                        <p className="text-sm text-gray-900">{request.title}</p>
                        <p className="text-sm text-gray-500">Status: {request.status}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 