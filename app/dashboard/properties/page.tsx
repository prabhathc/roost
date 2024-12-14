'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type Property = Database['public']['Tables']['properties']['Row'];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      try {
        const supabase = createClientComponentClient();
        
        // Get user data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get landlord profile
        const { data: landlord } = await supabase
          .from('landlords')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!landlord) {
          console.error('No landlord profile found');
          return;
        }

        // Fetch properties
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('landlord_id', landlord.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <h1 className="h-8 w-48 bg-gray-200 rounded"></h1>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Properties</h1>
        <Link
          href="/dashboard/properties/new"
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No properties</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first property.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/properties/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add Property
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/dashboard/properties/${property.id}`}
              className="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-200"
            >
              <div className="aspect-[16/9] bg-gray-200 sm:aspect-[2/1] lg:aspect-[3/2]">
                <div className="h-full w-full object-cover bg-gradient-to-br from-indigo-100 to-white" />
              </div>
              <div className="flex flex-1 flex-col justify-between p-6">
                <div className="flex-1">
                  <div className="flex items-center gap-x-3">
                    <span className={classNames(
                      property.status === 'available' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                      property.status === 'rented' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                      'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                    )}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </span>
                    <p className="text-sm text-gray-500">{property.property_type}</p>
                  </div>
                  <div className="mt-2 block">
                    <p className="text-xl font-semibold text-gray-900">{property.address}</p>
                    <p className="mt-1 text-sm text-gray-500">{property.city}, {property.state} {property.zip_code}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-x-4 text-sm">
                    <div className="text-gray-700">
                      {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
                    </div>
                    <div className="text-gray-700">
                      {property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}
                    </div>
                    {property.square_feet && (
                      <div className="text-gray-700">
                        {property.square_feet.toLocaleString()} sqft
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-lg font-semibold text-gray-900">
                    ${property.monthly_rent.toLocaleString()}/month
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
} 