-- =============================================
--  Feed Ferry — Supabase Database Schema
--  Enterprise Food Rescue Platform
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- Streamlined 2-Role Architecture: 'donor' (Commercial Food Donor) & 'ngo' (Verified Non-Profit)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  role                TEXT NOT NULL CHECK (role IN ('donor', 'ngo', 'volunteer')), -- Primary roles: donor, ngo
  city                TEXT,
  district            TEXT,
  state               TEXT,
  location            TEXT,  -- legacy compat field (= city)
  phone               TEXT,
  organization_type   TEXT,  -- restaurant, supermarket, caterer, shelter, foodbank
  is_verified         BOOLEAN DEFAULT true,
  registration_number TEXT,  -- FSSAI License Number (Donors) or NGO Darpan ID (NGOs)
  verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('verified', 'pending', 'unverified')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DONATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS donations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id            UUID REFERENCES profiles(id) ON DELETE CASCADE,
  donor_name          TEXT,
  donor_location      TEXT,
  food_name           TEXT NOT NULL,
  food_category       TEXT, -- cooked, raw, bakery, packaged, fruits, dairy
  veg_type            TEXT, -- veg, non-veg, mixed
  quantity            NUMERIC NOT NULL,
  unit                TEXT DEFAULT 'kg',
  expiry_at           TIMESTAMPTZ,
  pickup_state        TEXT,
  pickup_district     TEXT,
  pickup_city         TEXT,
  pickup_address_line TEXT,
  description         TEXT,
  image_url           TEXT, -- public Supabase storage URL
  pickup_otp          VARCHAR(6), -- 6-digit secure handover verification OTP
  verified_at         TIMESTAMPTZ, -- timestamp when handover OTP was verified
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','collected','in-transit','delivered','completed')),
  accepted_by         UUID REFERENCES profiles(id),
  accepted_at         TIMESTAMPTZ,
  collected_at        TIMESTAMPTZ,
  in_transit_at       TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  proof_image_url     TEXT, -- drop-off photo proof URL
  assigned_to         UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MESSAGES (Real-time Peer Communication)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_key TEXT NOT NULL,
  sender_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sender_name      TEXT,
  receiver_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message          TEXT NOT NULL,
  read             BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast conversation loading
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_key);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);

-- =============================================
-- NOTIFICATIONS (In-app Dispatch & Status Alerts)
-- =============================================
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

-- =============================================
-- CONTACTS (Landing page contact form)
-- =============================================
CREATE TABLE IF NOT EXISTS contacts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT,
  email      TEXT,
  message    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts      ENABLE ROW LEVEL SECURITY;

-- PROFILES: Authenticated users can view profiles, users update their own
CREATE POLICY "Profiles readable by authenticated" ON profiles 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- DONATIONS: Readable by authenticated, insert by donors, update by participants
CREATE POLICY "Donations readable by authenticated" ON donations 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Donors can insert" ON donations 
  FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "NGOs and donors can update" ON donations 
  FOR UPDATE USING (
    auth.uid() = donor_id OR auth.uid() = accepted_by OR auth.uid() = assigned_to OR accepted_by IS NULL
  );

-- MESSAGES: Only participants can read and send
CREATE POLICY "Messages readable by participants" ON messages 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated users can send messages" ON messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Participants can update message status" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- NOTIFICATIONS: Users can read and update their own notifications
CREATE POLICY "Users can read own notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can create notifications" ON notifications 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- CONTACTS: Public insert
CREATE POLICY "Anyone can submit contact" ON contacts 
  FOR INSERT WITH CHECK (true);

-- =============================================
-- STORAGE BUCKET CONFIGURATION (food-photos & donation-photos)
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-photos', 'food-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('donation-photos', 'donation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies
CREATE POLICY "Public Food Photos Access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('food-photos', 'donation-photos'));

CREATE POLICY "Authenticated users can upload food photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('food-photos', 'donation-photos') AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own uploaded donation images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'donation-photos' AND auth.uid() = owner
  );

-- =============================================
-- REALTIME PUBLICATIONS
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE donations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
