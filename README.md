# Analytivo

Video-link analytics platform built with Next.js, Better Auth, Prisma, and Supabase Postgres.

## Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Open **Project Settings → Database** and copy:
   - **Transaction pooler** connection string → `DATABASE_URL` (port `6543`, add `?pgbouncer=true`)
   - **Session / direct** connection string → `DIRECT_URL` (port `5432`)
3. Copy env file and fill values:

```bash
cp .env.example .env
```

4. Install and migrate:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000

## Vercel

Set these Environment Variables (Production + Preview):

- `DATABASE_URL` — Supabase pooler URI (`6543` + `pgbouncer=true`)
- `DIRECT_URL` — Supabase session/direct URI (`5432`)
- `BETTER_AUTH_SECRET` — long random string
- `BETTER_AUTH_URL` — primary domain, e.g. `https://analytivo.net`
- `NEXT_PUBLIC_APP_URL` — same primary domain (used for short links)
- `OPENAI_API_KEY` — optional; enables GPT-powered AI Insights (falls back to smart rules without it)

Auth also trusts these hosts by default: `analytivo.net`, `analytivo.xyz`, `analytivo.com.ng`, `analytivo.top` (and `www` variants), plus `analytivo.vercel.app`.

Then redeploy.

## Core flows

1. Sign up / sign in
2. Create a link at `/dashboard/links`
3. Share `https://your-domain/l/<alias>`
4. Clicks appear on Overview / Analytics
