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
- `RESEND_API_KEY` — optional; sends team invitations and scheduled reports by email (invite links can be copied manually and reports exported without it)
- `EMAIL_FROM` — sender for invite and report emails, e.g. `Analytivo <invites@analytivo.net>`
- `CRON_SECRET` — long random string; required for scheduled report delivery

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

## Plans and limits

`lib/plans.ts` is the single source of truth for what each plan may do, and
`PLAN_CAPABILITIES` is what the server actually enforces.

| | Free | Pro | Business |
| --- | --- | --- | --- |
| New links per month | 25 | unlimited | unlimited |
| Team seats (including the owner) | 1 | 5 | 25 |
| Campaigns | — | yes | yes |
| AI insights | — | yes | yes |
| Report export, email and scheduling | — | yes | yes |

Entitlements follow the **workspace owner's** plan, so an invited member of a Pro
workspace gets Pro features regardless of their own account. Limits are checked
in the server actions rather than only hidden in the UI, and the scheduled
report cron re-checks entitlement so a downgrade stops delivery.

Everything not listed stays available on Free: links, QR codes, analytics,
notifications, and reading reports.

## Billing

Payments run through [Paystack](https://paystack.com) hosted checkout, so card
details never reach this app.

The rule the whole design rests on: **only the webhook may grant a paid plan.**
`startCheckoutAction` creates a Paystack transaction and returns a redirect URL
without touching the database, because reaching that code proves nothing about
whether money moved. Paystack then calls `/api/webhooks/paystack`, and that
handler is the only caller of `applyPlanChange`. Setting the plan on the success
redirect instead would both miss customers who close the tab after paying and
let anyone upgrade by visiting a URL.

Prices live in the Paystack dashboard, not in this repo. Checkout reads the plan
amount and currency from Paystack at the moment it starts, so a customer can
only ever be charged what the dashboard says.

Three defences on the webhook itself: the payload is rejected unless its
`x-paystack-signature` matches an HMAC SHA512 of the **raw** body under the
secret key; each handled body is recorded in `ProcessedWebhook` by hash so
Paystack's retries cannot apply twice; and rather than trusting an event's
contents, the handler re-fetches the subscription from Paystack so out-of-order
deliveries do not matter.

Access outlives payment problems. A failed renewal or a cancellation sets the
status but keeps the plan until `currentPeriodEnd`, and the daily sweep at
`/api/cron/billing` is what finally drops the workspace to Free. That means a
card declining on renewal day does not lock anyone out mid-month.

Downgrading reconciles seats. Because the seat limit is only checked when
inviting, a workspace that drops to a smaller plan would otherwise keep every
member it already had. `applyPlanChange` suspends the newest members over the
allowance — longest-standing members and accepted invites keep their seats —
and upgrading restores them automatically. Suspended invites cannot be accepted
or reshared.

Setting up Paystack:

1. Create a plan per paid tier under **Dashboard → Plans**, then copy each plan
   code into `PAYSTACK_PLAN_CODE_PRO` and `PAYSTACK_PLAN_CODE_BUSINESS`.
2. Copy the secret key from **Settings → API Keys & Webhooks** into
   `PAYSTACK_SECRET_KEY`. Use `sk_test_...` until you are ready to charge.
3. Set the webhook URL on that same page to
   `https://your-domain/api/webhooks/paystack`.

Without these variables the app runs normally with everyone on Free and the
checkout buttons disabled. In local development only, the billing page shows
buttons that set the plan directly so the gates can be exercised without a card;
they are unreachable on any deployment because `NODE_ENV` is `production` there.

`npx tsx scripts/verify-billing.ts` exercises the parts that are easy to break
and hard to notice: signature verification against forged and tampered bodies,
replay protection, the grace-period rules, and seat suspension and restoration.
It creates a throwaway workspace and deletes it afterwards.

## Reports

A report is a saved view of the workspace analytics: a type, a rolling period, a
set of links, and an optional delivery schedule. Opening one at
`/dashboard/reports/<id>` builds it fresh from current click data — nothing is
cached, so the numbers always reflect the last N days ending today.

| Type | Contains |
| --- | --- |
| Performance | Clicks per day, top links, traffic sources |
| Audience | Devices, browsers, operating systems, countries, languages |
| Conversion | Link engagement and repeat-visit rate per source |
| Custom | All of the above in one document |

Every report shows headline metrics compared against the immediately preceding
period of the same length, and can be exported as CSV or printed to PDF.

A report either covers every link in the workspace or a chosen subset, picked
when it is created. The scope is stored as a comma-separated `Report.linkIds`,
where an empty value means all links — so reports created before scoping existed
keep covering everything. Ownership is re-checked on every build, and a scope
whose links have since been deleted reports zero rather than widening back to
the whole workspace.

Scheduled delivery runs from a single daily Vercel cron at 08:00 UTC
(`/api/cron/reports`). It sends each report whose weekly or monthly interval has
elapsed, so `lastSentAt` — not the cron time — decides when a report goes out.
The endpoint rejects any request without `Authorization: Bearer $CRON_SECRET`.
