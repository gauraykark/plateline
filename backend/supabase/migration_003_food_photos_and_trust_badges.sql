-- ==========================================================
-- Feed Ferry — Migration 003
-- Food Photos Storage Bucket & Verified Trust Badges (FSSAI / NGO Darpan)
-- ==========================================================

-- 1. Extend PROFILES with verified trust badge fields
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS registration_number TEXT;

-- 2. Extend DONATIONS with image_url and proof_image_url columns
ALTER TABLE donations 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS proof_image_url TEXT;

-- 3. Configure 'food-photos' public storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-photos', 'food-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Food Photos Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public Food Photos Access" ON storage.objects FOR SELECT USING (bucket_id = 'food-photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload food photos' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Authenticated users can upload food photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'food-photos' AND auth.role() = 'authenticated');
  END IF;
END $$;
