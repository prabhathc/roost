-- Add photos column to properties table
ALTER TABLE properties ADD COLUMN photos jsonb;

-- Create storage bucket for property photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the property-photos bucket
CREATE POLICY "Allow authenticated users to upload property photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-photos' AND
  auth.role() = 'authenticated'
); 