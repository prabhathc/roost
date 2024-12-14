'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type Payment = Database['public']['Tables']['payments']['Row'] & {
  lease: Database['public']['Tables']['leases']['Row'] & {
    property: Database['public']['Tables']['properties']['Row'];
    tenant: Database['public']['Tables']['profiles']['Row'];
  };
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'tenant' | 'landlord' | null>(null);
  const [totalPending, setTotalPending] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  useEffect(() => {
    async function loadPayments() {
      try {
        const supabase = createClient();
        
        // Get user data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const role = user.user_metadata.role as 'tenant' | 'landlord';
        setUserRole(role);

        // Fetch payments with lease, property, and tenant details
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            lease:leases(
              *,
              property:properties(*),
              tenant:profiles(*)
            )
          `)
          .eq(role === 'landlord' ? 'landlord_id' : 'tenant_id', user.id)
          .order('due_date', { ascending: false });

        if (error) throw error;
        setPayments(data || []);

        // Calculate totals
        const pending = data?.filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + p.amount, 0) || 0;
        const completed = data?.filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0) || 0;

        setTotalPending(pending);
        setTotalCompleted(completed);
      } catch (error) {
        console.error('Error loading payments:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <h1 className="h-8 w-48 bg-gray-200 rounded mb-8"></h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
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
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        {userRole === 'landlord' ? 'Payment Management' : 'My Payments'}
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending Payments</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${totalPending.toLocaleString()}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">
            {userRole === 'landlord' ? 'Total Collected' : 'Total Paid'}
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${totalCompleted.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No payments</h3>
          <p className="mt-1 text-sm text-gray-500">
            {userRole === 'landlord' 
              ? 'No payments have been recorded yet.'
              : 'You don\'t have any payments recorded.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {userRole === 'landlord' ? 'Tenant' : 'Due Date'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.lease.property.address}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.lease.property.city}, {payment.lease.property.state}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {userRole === 'landlord' ? (
                      <div className="text-sm text-gray-900">
                        {payment.lease.tenant.first_name} {payment.lease.tenant.last_name}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900">
                        {new Date(payment.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${payment.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={classNames(
                      payment.status === 'pending' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                      payment.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                      'bg-red-50 text-red-700 ring-red-600/20',
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                    )}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
} 