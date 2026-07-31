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
- `RESEND_API_KEY` — optional; sends team invitations by email (invite links can be copied manually without it)
- `EMAIL_FROM` — sender for invite emails, e.g. `Analytivo <invites@analytivo.net>`

Auth also trusts these hosts by default: `analytivo.net`, `analytivo.xyz`, `analytivo.com.ng`, `analytivo.top` (and `www` variants), plus `analytivo.vercel.app`.

Then redeploy.

## Core flows

1. Sign up / sign in
2. Create a link at `/dashboard/links`
3. Share `https://your-domain/l/<alias>`
4. Clicks appear on Overview / Analytics

## Teams and roles

Every account owns one workspace. All links, campaigns, QR codes, reports, and
analytics belong to the workspace owner, and invited teammates read and write
that same data according to their role.

| Role | Can do |
| --- | --- |
| Owner | Everything, including billing and removing the workspace |
| Admin | Everything except billing; invites and manages teammates |
| Editor | Creates and deletes links, campaigns, QR codes, and reports |
| Viewer | Read-only access to analytics and links |

Invite flow:

1. An owner or admin invites someone from `/dashboard/team`
2. Analytivo emails the invite when `RESEND_API_KEY` is set; otherwise the page
   shows a copyable `/invite/<token>` link to share manually
3. The invitee signs up (or signs in) with the invited email address and accepts
4. They can switch between their own workspace and any they've joined using the
   workspace switcher in the sidebar

Roles are enforced on the server in every action, not just hidden in the UI.
