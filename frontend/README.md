# Feed Ferry — React + Tailwind + Supabase

## Setup

1. Create a Supabase project at https://supabase.com
2. Run the SQL migrations in `supabase/schema.sql`
3. Copy `.env.example` to `.env.local` and fill in your keys
4. `npm install && npm run dev`

## Deploy to Vercel
- Connect GitHub repo to Vercel
- Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Deploy!
