'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

type Application = Database['public']['Tables']['applications']['Row'] & {
  property: Database['public']['Tables']['properties']['Row'];
  tenant: Database['public']['Tables']['profiles']['Row'];
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'tenant' | 'landlord' | null>(null);

  useEffect(() => {
    async function loadApplications() {
      try {
        const supabase = createClient();
        
        // Get user data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const role = user.user_metadata.role as 'tenant' | 'landlord';
        setUserRole(role);

        // Fetch applications with property and tenant details
        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            property:properties(*),
            tenant:profiles(*)
          `)
          .eq(role === 'landlord' ? 'landlord_id' : 'tenant_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setApplications(data || []);
      } catch (error) {
        console.error('Error loading applications:', error);
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  const handleStatusChange = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <h1 className="h-8 w-48 bg-gray-200 rounded mb-8"></h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        {userRole === 'landlord' ? 'Rental Applications' : 'My Applications'}
      </h1>

      {applications.length === 0 ? (
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No applications</h3>
          <p className="mt-1 text-sm text-gray-500">
            {userRole === 'landlord' 
              ? 'You haven\'t received any rental applications yet.'
              : 'You haven\'t submitted any rental applications yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="bg-white shadow rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {application.property.address}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {application.property.city}, {application.property.state} {application.property.zip}
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  {application.status === 'pending' ? (
                    <>
                      <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                        <ClockIcon className="mr-1 h-4 w-4" />
                        Pending
                      </span>
                      {userRole === 'landlord' && (
                        <div className="flex gap-x-2">
                          <button
                            onClick={() => handleStatusChange(application.id, 'approved')}
                            className="rounded-md bg-green-50 px-2.5 py-1.5 text-sm font-semibold text-green-600 shadow-sm hover:bg-green-100"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(application.id, 'rejected')}
                            className="rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </>
                  ) : application.status === 'approved' ? (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      <CheckCircleIcon className="mr-1 h-4 w-4" />
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                      <XCircleIcon className="mr-1 h-4 w-4" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Applicant</p>
                  <p className="font-medium text-gray-900">
                    {application.tenant.first_name} {application.tenant.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Contact</p>
                  <p className="font-medium text-gray-900">{application.tenant.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Annual Income</p>
                  <p className="font-medium text-gray-900">${application.income.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Credit Score</p>
                  <p className="font-medium text-gray-900">{application.credit_score}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 