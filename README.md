# Youth Blossom Dashboard

Youth Blossom is a Vite, React, TypeScript, shadcn-ui, and Tailwind CSS dashboard for youth ministry records, attendance, programs, and reporting.

## Local Development

```sh
git clone https://github.com/BiusMichaelJoseph/youth-blossom-dashboard.git
cd youth-blossom-dashboard
npm i
npm run dev
```

## Production Backend

The production backend is Supabase:

- Supabase Auth protects the dashboard when Supabase env vars are configured.
- Supabase Postgres stores youth records, programs, attendance records, and profiles.
- Row Level Security is enabled so only authenticated users can access the data.
- The frontend talks to Supabase through the public REST API using the publishable/anon key.

The schema is tracked in `supabase/migrations/202605050001_create_youth_blossom_core_tables.sql` and has already been applied to the Supabase project `gqbexgzripypojpvgsbu`.

## Vercel Environment Variables

Add these to the Vercel project for Production, Preview, and Development as needed:

```env
VITE_SUPABASE_URL=https://gqbexgzripypojpvgsbu.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Use a Supabase publishable key or legacy anon key. Do not put the Supabase `service_role` key in Vercel frontend environment variables.

## First Admin/User Login

Create the first dashboard user in Supabase:

1. Open Supabase Dashboard.
2. Go to Authentication > Users.
3. Add a user with email and password.
4. Use that email/password on the Youth Blossom sign-in screen.

The current MVP policies allow any authenticated dashboard user to read and maintain core records. Tighten role-specific policies before adding a larger team.

## Current Data Sync

The directory and attendance persistence layer still supports local fallback for development. When Supabase is configured and a user is signed in, it hydrates from Supabase and syncs changes back to Postgres.

## Legacy Express API

A scaffolded Express API remains under `backend/` for future custom server work. It uses in-memory demo data and hardcoded demo credentials, so it should not be deployed as the production backend without replacing that storage/auth layer.

Useful scripts:

```bash
npm run api:dev
npm run api:test
```
