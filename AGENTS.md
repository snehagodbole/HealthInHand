# HealthInHand Agent Instructions

## Project Snapshot

HealthInHand is a Next.js web app for intermittent fasting tracking. It lets users sign up, choose a fasting plan, start and end fasts, track streaks, log weight measurements, view charts, and create shared fasts with invite emails.

This is a general wellness app only. Do not present features, copy, or recommendations as medical advice.

## Tech Stack

- Next.js App Router with React 19 and TypeScript
- Tailwind CSS with project tokens in `tailwind.config.ts`
- Supabase Auth and Postgres via `@supabase/ssr`
- Recharts for progress and weight charts
- Resend for shared fast invite emails
- Lucide React for icons

## Common Commands

Run these from the repo root:

```bash
npm run dev
npm run lint
npm run build
```

Use `npm run lint` and `npm run build` before declaring a code change complete unless the task is docs-only or the user explicitly asks not to run validation. If validation cannot run because of missing env vars or sandbox limits, say exactly what was not run and why.

## Important Paths

- `app/` - App Router routes, layouts, loading/error UI, route handlers
- `components/` - reusable client and server UI components
- `lib/supabaseConfig.ts` - Supabase public env validation
- `lib/supabaseClient.ts` - browser Supabase client
- `lib/supabaseServer.ts` - server Supabase client with cookies
- `lib/fastingUtils.ts`, `lib/streakUtils.ts`, `lib/fastingMilestones.ts` - core fasting calculations
- `lib/email.ts` - Resend invite email helpers
- `supabase/schema.sql` - database schema, RLS policies, triggers, and RPC functions
- `types/database.ts` - typed Supabase database contract
- `app/globals.css` - Tailwind component classes and global styling
- `tailwind.config.ts` - design tokens: `moss`, `coral`, `ink`, `oat`, and `shadow-soft`

## Environment Rules

Expected local env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be a public browser-safe key. Never put a Supabase secret/service-role key in a `NEXT_PUBLIC_*` variable. This repo intentionally rejects keys that start with `sb_secret_`.

`RESEND_API_KEY` and `RESEND_FROM_EMAIL` are server-only concerns used by invite email routes. Do not expose them in client components.

If Supabase reports a missing table, schema cache issue, or auth failure, first verify that `supabase/schema.sql` has been run against the same Supabase project referenced by `.env.local`.

## Data Model Rules

The schema currently includes:

- `profiles`
- `fasting_sessions`
- `shared_fasts`
- `shared_fast_participants`
- `shared_fast_invites`
- `weight_measurements`

There is a partial unique index that allows only one active fast per user. Preserve that behavior when touching fast start/end logic.

RLS policies are part of the feature, not incidental plumbing. When changing tables, RPC functions, or ownership rules, update `supabase/schema.sql` and keep `types/database.ts` in sync.

Shared fast behavior depends on RPC functions in `types/database.ts` and `supabase/schema.sql`:

- `create_shared_fast`
- `accept_shared_fast_invite`
- `get_shared_fast_invite`
- `is_shared_fast_member`

Do not replace these with broad client-side table access unless the schema and RLS design are intentionally changed.

## Auth And Routing

Protected app routes are enforced in `middleware.ts`:

- `/dashboard`
- `/history`
- `/progress`
- `/onboarding`
- `/together`

Public auth routes:

- `/login`
- `/signup`
- `/auth`

When changing auth or onboarding, verify logged-out redirects, logged-in access, and auth callback behavior. Preserve the `redirectedFrom` query behavior unless the task explicitly changes navigation.

## UI And Styling

Prefer existing Tailwind component classes from `app/globals.css`:

- `page-shell`
- `card`
- `button-primary`
- `button-secondary`
- `input`
- `hero-glass`
- `section-fancy`
- `page-header-fancy`
- `auth-panel-fancy`

Use Tailwind tokens from `tailwind.config.ts` instead of inventing one-off colors where possible. The main palette is moss, coral, ink, and oat.

Keep the app mobile-friendly. Buttons, links, and selects should remain usable on touch devices; global CSS already sets a 44px minimum touch target for coarse pointers.

Use Lucide React icons when an icon is needed. Avoid introducing another icon library unless there is a clear project reason.

## Implementation Preferences

- Read the existing component and helper patterns before editing.
- Keep changes scoped to the requested feature or bug.
- Prefer typed Supabase calls using `Database` from `types/database.ts`.
- Keep server-only code in route handlers, server components, or server helpers.
- Mark client components with `"use client"` only when they need browser state, effects, events, or client-side Supabase.
- Do not move Supabase or Resend secrets into client code.
- Do not add medical claims, diagnosis language, or prescriptive health advice.
- Add comments only where they clarify non-obvious business, auth, RLS, or timing behavior.

## Validation Checklist

For most code changes, run:

```bash
npm run lint
npm run build
```

For auth, fasting, shared fasts, or database changes, also reason through or manually test:

- User can sign up and log in.
- Logged-out user cannot access protected routes.
- User can choose a fasting plan.
- User can start one active fast.
- User cannot create two active fasts.
- Timer survives refresh because it is calculated from `start_time`.
- User can end a fast and see it in history.
- Dashboard streak still renders.
- Progress page shows fasting and weight charts.
- User can create a shared fast.
- Invite recipient can open the invite link, log in, and join.

## When Asking The User For Context

Ask only when needed, but do not guess on:

- Which Supabase project/schema the user is using
- Whether SQL has already been run
- Whether invite email sending should be tested against real recipients
- Whether a change should alter wellness copy or just mechanics
- Whether a data migration is acceptable

If the user reports a runtime error, ask for or inspect the exact route, env state, and Supabase table/function involved before making broad changes.
