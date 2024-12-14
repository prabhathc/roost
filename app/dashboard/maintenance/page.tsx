'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type MaintenanceRequest = Database['public']['Tables']['maintenance_requests']['Row'] & {
  property: Database['public']['Tables']['properties']['Row'];
  tenant: Database['public']['Tables']['profiles']['Row'];
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'tenant' | 'landlord' | null>(null);

  useEffect(() => {
    async function loadRequests() {
      try {
        const supabase = createClient();
        
        // Get user data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const role = user.user_metadata.role as 'tenant' | 'landlord';
        setUserRole(role);

        // Fetch maintenance requests with property and tenant details
        const { data, error } = await supabase
          .from('maintenance_requests')
          .select(`
            *,
            property:properties(*),
            tenant:profiles(*)
          `)
          .eq(role === 'landlord' ? 'landlord_id' : 'tenant_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (error) {
        console.error('Error loading maintenance requests:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  const handleStatusChange = async (requestId: string, newStatus: 'in_progress' | 'completed') => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
    } catch (error) {
      console.error('Error updating maintenance request status:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <h1 className="h-8 w-48 bg-gray-200 rounded"></h1>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {userRole === 'landlord' ? 'Maintenance Requests' : 'My Maintenance Requests'}
        </h1>
        {userRole === 'tenant' && (
          <Link
            href="/dashboard/maintenance/new"
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            New Request
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No maintenance requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            {userRole === 'landlord' 
              ? 'No maintenance requests have been submitted.'
              : 'Get started by submitting a new maintenance request.'}
          </p>
          {userRole === 'tenant' && (
            <div className="mt-6">
              <Link
                href="/dashboard/maintenance/new"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                New Request
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white shadow rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {request.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {request.property.address}, {request.property.city}
                  </p>
                </div>
                <div className="flex items-center gap-x-4">
                  <span className={classNames(
                    request.priority === 'high' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                    request.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                    'bg-blue-50 text-blue-700 ring-blue-600/20',
                    'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                  )}>
                    {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                  </span>
                  <span className={classNames(
                    request.status === 'pending' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                    request.status === 'in_progress' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                    'bg-green-50 text-green-700 ring-green-600/20',
                    'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                  )}>
                    {request.status === 'in_progress' ? 'In Progress' : 
                     request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">{request.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <span>Submitted by {request.tenant.first_name} {request.tenant.last_name}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
                {userRole === 'landlord' && request.status !== 'completed' && (
                  <div className="flex gap-x-3">
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(request.id, 'in_progress')}
                        className="rounded-md bg-blue-50 px-2.5 py-1.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-100"
                      >
                        Start Work
                      </button>
                    )}
                    {request.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange(request.id, 'completed')}
                        className="rounded-md bg-green-50 px-2.5 py-1.5 text-sm font-semibold text-green-600 shadow-sm hover:bg-green-100"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
} 