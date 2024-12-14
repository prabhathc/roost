'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';
import {
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface ReportStats {
  totalProperties: number;
  totalTenants: number;
  totalRentCollected: number;
  occupancyRate: number;
  maintenanceCosts: number;
  averageRent: number;
}

interface MonthlyData {
  month: string;
  rent: number;
  maintenance: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats>({
    totalProperties: 0,
    totalTenants: 0,
    totalRentCollected: 0,
    occupancyRate: 0,
    maintenanceCosts: 0,
    averageRent: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const supabase = createClient();
        
        // Get user data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get all properties
        const { data: properties } = await supabase
          .from('properties')
          .select('*')
          .eq('landlord_id', user.id);

        // Get all active leases
        const { data: leases } = await supabase
          .from('leases')
          .select('*')
          .eq('landlord_id', user.id)
          .eq('status', 'active');

        // Get all payments from the last 12 months
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('landlord_id', user.id)
          .eq('status', 'completed')
          .gte('payment_date', new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString());

        // Get all maintenance requests
        const { data: maintenance } = await supabase
          .from('maintenance_requests')
          .select('*')
          .eq('landlord_id', user.id);

        // Calculate stats
        const totalProperties = properties?.length || 0;
        const totalTenants = leases?.length || 0;
        const totalRentCollected = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const occupancyRate = totalProperties > 0 ? (totalTenants / totalProperties) * 100 : 0;
        const maintenanceCosts = maintenance?.length || 0; // This would need to be updated with actual costs
        const averageRent = totalTenants > 0 ? (leases?.reduce((sum, l) => sum + l.rent_amount, 0) || 0) / totalTenants : 0;

        setStats({
          totalProperties,
          totalTenants,
          totalRentCollected,
          occupancyRate,
          maintenanceCosts,
          averageRent,
        });

        // Calculate monthly data
        const monthlyStats = new Map<string, { rent: number; maintenance: number }>();
        const last12Months = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return date.toISOString().substring(0, 7); // YYYY-MM format
        }).reverse();

        last12Months.forEach(month => {
          monthlyStats.set(month, { rent: 0, maintenance: 0 });
        });

        payments?.forEach(payment => {
          const month = payment.payment_date?.substring(0, 7);
          if (month && monthlyStats.has(month)) {
            const current = monthlyStats.get(month)!;
            monthlyStats.set(month, {
              ...current,
              rent: current.rent + payment.amount,
            });
          }
        });

        setMonthlyData(Array.from(monthlyStats.entries()).map(([month, data]) => ({
          month,
          ...data,
        })));

      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <h1 className="h-8 w-48 bg-gray-200 rounded mb-8"></h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Reports & Analytics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Properties</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.totalProperties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Tenants</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.totalTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Rent Collected</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                ${stats.totalRentCollected.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Occupancy Rate</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {stats.occupancyRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <WrenchScrewdriverIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Maintenance Requests</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.maintenanceCosts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Average Monthly Rent</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                ${stats.averageRent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
        <div className="h-80">
          <div className="relative h-full">
            <div className="absolute inset-0">
              <div className="flex h-full items-end">
                {monthlyData.map((data, i) => (
                  <div
                    key={data.month}
                    className="group relative flex h-full w-full flex-col justify-end"
                  >
                    <div className="relative w-full">
                      <div
                        className="absolute bottom-0 w-full transform bg-indigo-500"
                        style={{
                          height: `${(data.rent / Math.max(...monthlyData.map(d => d.rent))) * 100}%`,
                        }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                          ${data.rent.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 -rotate-45 origin-top-left">
                      {new Date(data.month).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 