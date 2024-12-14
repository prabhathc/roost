'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type Tenant = Database['public']['Tables']['profiles']['Row'] & {
  leases: (Database['public']['Tables']['leases']['Row'] & {
    property: Database['public']['Tables']['properties']['Row'];
  })[];
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTenants() {
      try {
        const supabase = createClient();
        
        // Get user data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // First, get all leases for this landlord
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select(`
            *,
            property:properties(*),
            tenant:profiles(*)
          `)
          .eq('landlord_id', user.id);

        if (leasesError) throw leasesError;

        // Group leases by tenant
        const tenantMap = new Map<string, Tenant>();
        leases?.forEach(lease => {
          const tenant = lease.tenant;
          const existingTenant = tenantMap.get(tenant.id);
          if (existingTenant) {
            existingTenant.leases.push({
              ...lease,
              property: lease.property
            });
          } else {
            tenantMap.set(tenant.id, {
              ...tenant,
              leases: [{
                ...lease,
                property: lease.property
              }]
            });
          }
        });

        setTenants(Array.from(tenantMap.values()));
      } catch (error) {
        console.error('Error loading tenants:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTenants();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <h1 className="h-8 w-48 bg-gray-200 rounded mb-8"></h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Tenants</h1>

      {tenants.length === 0 ? (
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No tenants</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any tenants yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tenant.first_name} {tenant.last_name}
                    </h3>
                    <div className="mt-1 flex items-center gap-x-2 text-sm text-gray-500">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>{tenant.email}</span>
                    </div>
                    {tenant.phone && (
                      <div className="mt-1 flex items-center gap-x-2 text-sm text-gray-500">
                        <PhoneIcon className="h-4 w-4" />
                        <span>{tenant.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-3">
                <h4 className="text-sm font-medium text-gray-500">Leased Properties</h4>
                <div className="mt-2 space-y-2">
                  {tenant.leases.map((lease) => (
                    <div key={lease.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {lease.property.address}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={classNames(
                        lease.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                        lease.status === 'expired' ? 'bg-gray-50 text-gray-700 ring-gray-600/20' :
                        'bg-red-50 text-red-700 ring-red-600/20',
                        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                      )}>
                        {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-3">
                <Link
                  href={`/dashboard/tenants/${tenant.id}`}
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