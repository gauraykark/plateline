-- ==========================================================
-- Feed Ferry — Migration 002
-- Photo Uploads, Handover OTP Verification, and Real-time Notifications
-- Safe to run on an existing database — does NOT drop any data.
-- ==========================================================

-- 1. Extend PROFILES table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS organization_type TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';

-- 2. Extend DONATIONS table
ALTER TABLE donations 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS pickup_otp VARCHAR(6),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 3. Extend MESSAGES table
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- 4. Create NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'action')),
  read       BOOLEAN DEFAULT false,
  link_tab   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- 5. Set up RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can create notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Authenticated can create notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Configure Storage Bucket for Donation Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('donation-photos', 'donation-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Donation Images Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public Donation Images Access" ON storage.objects FOR SELECT USING (bucket_id = 'donation-photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload donation images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Authenticated users can upload donation images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'donation-photos' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- 7. Add notifications to Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
