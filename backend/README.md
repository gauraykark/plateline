# Plateline — Enterprise Backend (Supabase)

Plateline leverages Supabase (PostgreSQL 15+, Auth, Storage, and Realtime Postgres Change Subscriptions) for zero-latency surplus dispatch logistics.

## Database & Storage Setup

### 1. Execute SQL Migrations
In your Supabase Dashboard SQL Editor, run:
- **For fresh setups**: Run `supabase/schema.sql` (Creates all tables, RLS policies, Storage buckets, and Realtime publications).
- **For existing databases**: Run `supabase/migration_002_photo_otp_notifications.sql` (Safely adds photo storage, OTP columns, and notification channels without data loss).

### 2. Supabase Storage Bucket (`donation-photos`)
Feed Ferry includes photo attachment capability for food donations.
1. Bucket Name: `donation-photos`
2. Access: **Public**
3. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
4. Max File Size: `5 MB`

*Note: Storage policies are automatically created when running `schema.sql` or `migration_002_photo_otp_notifications.sql`.*

### 3. Environment Variables
Copy `.env.example` to `frontend/.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Realtime Publications
The schema enables Realtime for the following tables:
- `donations` (Live status changes & dispatch updates)
- `messages` (Real-time peer chat between donors and NGOs)
- `notifications` (In-app alerts for donation acceptance & handover confirmations)
