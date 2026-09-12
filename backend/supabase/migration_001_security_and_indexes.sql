-- =============================================
-- Feed Ferry — Migration 001
-- Fixes: profiles table is readable by anonymous (unauthenticated) visitors,
-- which exposes every user's email address to the public internet via the
-- anon key. Also adds indexes the app's filter/sort queries rely on.
-- Safe to run on an existing database — does NOT drop any tables or data.
-- =============================================

-- 1) Tighten profiles SELECT policy: authenticated users only (not anon/public).
--    The app never needs to show profiles to logged-out visitors.
DROP POLICY IF EXISTS "Public profiles readable" ON profiles;
CREATE POLICY "Profiles readable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2) Indexes to speed up the queries ListingsTab/DonationsTab/TrackingTab run.
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_accepted_by ON donations(accepted_by);
CREATE INDEX IF NOT EXISTS idx_donations_pickup_location ON donations(pickup_state, pickup_district, pickup_city);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 3) contacts table currently has no SELECT policy at all, meaning nobody
--    (not even the submitter) can read it back — that's fine for a
--    write-only contact form, but admins have no way to review messages
--    through the API. If you want an admin role to read them later, add a
--    policy such as:
--    CREATE POLICY "Admins can read contacts" ON contacts FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
--    Skipped here since there is no admin role in the app yet.
