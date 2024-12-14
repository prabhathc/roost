'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type Lease = Database['public']['Tables']['leases']['Row'] & {
  property: Database['public']['Tables']['properties']['Row'];
  tenant: Database['public']['Tables']['profiles']['Row'];
};

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'tenant' | 'landlord' | null>(null);

  useEffect(() => {
    async function loadLeases() {
      try {
        const supabase = createClient();
        
        // Get user data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const role = user.user_metadata.role as 'tenant' | 'landlord';
        setUserRole(role);

        // Fetch leases with property and tenant details
        const { data, error } = await supabase
          .from('leases')
          .select(`
            *,
            property:properties(*),
            tenant:profiles(*)
          `)
          .eq(role === 'landlord' ? 'landlord_id' : 'tenant_id', user.id)
          .order('start_date', { ascending: false });

        if (error) throw error;
        setLeases(data || []);
      } catch (error) {
        console.error('Error loading leases:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLeases();
  }, []);

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
          {userRole === 'landlord' ? 'Lease Agreements' : 'My Lease'}
        </h1>
        {userRole === 'landlord' && (
          <Link
            href="/dashboard/leases/new"
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Create Lease
          </Link>
        )}
      </div>

      {leases.length === 0 ? (
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No leases</h3>
          <p className="mt-1 text-sm text-gray-500">
            {userRole === 'landlord' 
              ? 'Get started by creating a new lease agreement.'
              : 'You don\'t have any active lease agreements.'}
          </p>
          {userRole === 'landlord' && (
            <div className="mt-6">
              <Link
                href="/dashboard/leases/new"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Create Lease
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {leases.map((lease) => (
            <div
              key={lease.id}
              className="bg-white shadow rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {lease.property.address}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {lease.property.city}, {lease.property.state} {lease.property.zip}
                  </p>
                </div>
                <div>
                  <span className={classNames(
                    lease.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                    lease.status === 'expired' ? 'bg-gray-50 text-gray-700 ring-gray-600/20' :
                    'bg-red-50 text-red-700 ring-red-600/20',
                    'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                  )}>
                    {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Tenant</p>
                  <p className="font-medium text-gray-900">
                    {lease.tenant.first_name} {lease.tenant.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Contact</p>
                  <p className="font-medium text-gray-900">{lease.tenant.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lease Term</p>
                  <p className="font-medium text-gray-900">
                    {new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Monthly Rent</p>
                  <p className="font-medium text-gray-900">${lease.rent_amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  href={`/dashboard/leases/${lease.id}`}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  View Details
                </Link>
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