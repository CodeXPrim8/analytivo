# Analytivo

Video-link analytics platform. Paste a video URL, get a branded trackable short link, share it, and measure clicks.

## Stack

- Next.js 16 (App Router)
- Better Auth (email/password)
- Prisma + SQLite
- Tailwind CSS 4

## Setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000

Copy `.env.example` to `.env` and set `BETTER_AUTH_SECRET` before production.

## Core flows

1. Sign up / sign in
2. Create a link at `/dashboard/links`
3. Share `http://localhost:3000/l/<alias>`
4. Clicks are recorded and shown on Overview / Analytics
5. Campaigns, QR codes, team, reports, billing plan selection, and AI insights use live DB data

## Notes

- Short links live at `/l/[alias]`
- Billing plan switching is account-level (payment provider not wired yet)
- Password-reset email delivery needs SMTP configuration
