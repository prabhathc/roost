export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Role = 'tenant' | 'landlord';
export type PropertyType = 'apartment' | 'house' | 'condo' | 'townhouse';
export type PropertyStatus = 'available' | 'rented' | 'maintenance' | 'offline';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type LeaseStatus = 'pending' | 'active' | 'terminated' | 'expired';
export type MaintenanceRequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          role: Role
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role: Role
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: Role
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          landlord_id: string
          address: string
          unit_number: string | null
          city: string
          state: string
          zip_code: string
          property_type: PropertyType
          bedrooms: number
          bathrooms: number
          square_feet: number | null
          monthly_rent: number
          deposit_amount: number
          available_date: string | null
          amenities: Json | null
          photos: Json | null
          status: PropertyStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          landlord_id: string
          address: string
          unit_number?: string | null
          city: string
          state: string
          zip_code: string
          property_type: PropertyType
          bedrooms: number
          bathrooms: number
          square_feet?: number | null
          monthly_rent: number
          deposit_amount: number
          available_date?: string | null
          amenities?: Json | null
          photos?: Json | null
          status?: PropertyStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          landlord_id?: string
          address?: string
          unit_number?: string | null
          city?: string
          state?: string
          zip_code?: string
          property_type?: PropertyType
          bedrooms?: number
          bathrooms?: number
          square_feet?: number | null
          monthly_rent?: number
          deposit_amount?: number
          available_date?: string | null
          amenities?: Json | null
          photos?: Json | null
          status?: PropertyStatus
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          landlord_id: string
          status: ApplicationStatus
          income: number
          credit_score: number
          employment_info: Json
          references: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          landlord_id: string
          status?: ApplicationStatus
          income: number
          credit_score: number
          employment_info?: Json
          references?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          property_id?: string
          tenant_id?: string
          landlord_id?: string
          status?: ApplicationStatus
          income?: number
          credit_score?: number
          employment_info?: Json
          references?: Json
          created_at?: string
          updated_at?: string
        }
      }
      leases: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          landlord_id: string
          start_date: string
          end_date: string
          rent_amount: number
          deposit_amount: number
          status: LeaseStatus
          terms: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          landlord_id: string
          start_date: string
          end_date: string
          rent_amount: number
          deposit_amount: number
          status?: LeaseStatus
          terms?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          property_id?: string
          tenant_id?: string
          landlord_id?: string
          start_date?: string
          end_date?: string
          rent_amount?: number
          deposit_amount?: number
          status?: LeaseStatus
          terms?: Json
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_requests: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          landlord_id: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high'
          status: MaintenanceRequestStatus
          images: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          landlord_id: string
          title: string
          description: string
          priority?: 'low' | 'medium' | 'high'
          status?: MaintenanceRequestStatus
          images?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          property_id?: string
          tenant_id?: string
          landlord_id?: string
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high'
          status?: MaintenanceRequestStatus
          images?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          lease_id: string
          tenant_id: string
          landlord_id: string
          amount: number
          due_date: string
          payment_date: string | null
          status: PaymentStatus
          payment_method: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lease_id: string
          tenant_id: string
          landlord_id: string
          amount: number
          due_date: string
          payment_date?: string | null
          status?: PaymentStatus
          payment_method?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          lease_id?: string
          tenant_id?: string
          landlord_id?: string
          amount?: number
          due_date?: string
          payment_date?: string | null
          status?: PaymentStatus
          payment_method?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
} 