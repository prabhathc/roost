-- Create profiles table (base user info)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  phone text,
  role text check (role in ('tenant', 'landlord')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create landlords table
create table landlords (
  id uuid references profiles(id) on delete cascade primary key,
  company_name text,
  business_address text,
  tax_id text,
  payment_info jsonb,
  verification_status text default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tenants table
create table tenants (
  id uuid references profiles(id) on delete cascade primary key,
  date_of_birth date,
  ssn_last_4 text,
  employment_status text,
  annual_income numeric,
  credit_score integer,
  background_check_status text default 'pending' check (background_check_status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create properties table
create table properties (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references landlords(id) on delete cascade,
  address text not null,
  unit_number text,
  city text not null,
  state text not null,
  zip_code text not null,
  property_type text not null check (property_type in ('apartment', 'house', 'condo', 'townhouse')),
  bedrooms integer not null,
  bathrooms numeric not null,
  square_feet numeric,
  monthly_rent numeric not null,
  deposit_amount numeric not null,
  available_date date,
  status text default 'available' check (status in ('available', 'rented', 'maintenance', 'offline')),
  amenities jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create leases table
create table leases (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete restrict,
  tenant_id uuid references tenants(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  rent_amount numeric not null,
  deposit_amount numeric not null,
  status text default 'active' check (status in ('pending', 'active', 'terminated', 'expired')),
  documents jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create maintenance_requests table
create table maintenance_requests (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete set null,
  title text not null,
  description text not null,
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'emergency')),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  images jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create payments table
create table payments (
  id uuid primary key default uuid_generate_v4(),
  lease_id uuid references leases(id) on delete restrict,
  amount numeric not null,
  payment_type text not null check (payment_type in ('rent', 'deposit', 'fee')),
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  due_date date not null,
  paid_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table landlords enable row level security;
alter table tenants enable row level security;
alter table properties enable row level security;
alter table leases enable row level security;
alter table maintenance_requests enable row level security;
alter table payments enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Policies for landlords
create policy "Landlords are viewable by everyone."
  on landlords for select
  using ( true );

create policy "Users can insert their own landlord profile."
  on landlords for insert
  with check ( auth.uid() = id );

create policy "Users can update own landlord profile."
  on landlords for update
  using ( auth.uid() = id );

-- Policies for tenants
create policy "Tenants are viewable by themselves and their landlords."
  on tenants for select
  using ( 
    auth.uid() = id or 
    exists (
      select 1 from leases l
      join properties p on l.property_id = p.id
      where l.tenant_id = tenants.id and p.landlord_id = auth.uid()
    )
  );

create policy "Users can insert their own tenant profile."
  on tenants for insert
  with check ( auth.uid() = id );

create policy "Users can update own tenant profile."
  on tenants for update
  using ( auth.uid() = id );

-- Policies for properties
create policy "Properties are viewable by everyone."
  on properties for select
  using ( true );

create policy "Landlords can insert their own properties."
  on properties for insert
  with check ( landlord_id = auth.uid() );

create policy "Landlords can update their own properties."
  on properties for update
  using ( landlord_id = auth.uid() );

create policy "Landlords can delete their own properties."
  on properties for delete
  using ( landlord_id = auth.uid() );

-- Create indexes for better performance
create index idx_properties_landlord on properties(landlord_id);
create index idx_leases_property on leases(property_id);
create index idx_leases_tenant on leases(tenant_id);
create index idx_maintenance_property on maintenance_requests(property_id);
create index idx_maintenance_tenant on maintenance_requests(tenant_id);
create index idx_payments_lease on payments(lease_id); 