# HealthInHand

HealthInHand is a Next.js web app for intermittent fasting tracking. Users can sign up, choose a fasting plan, start and end fasts, view a live timer, review streaks, log weight measurements, and inspect fasting and weight progress charts.

This app is for general wellness tracking only and does not provide medical advice.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- Recharts

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-public-key
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL="HealthInHand <invites@yourdomain.com>"
```

`RESEND_FROM_EMAIL` must use a sender that is allowed in your Resend account. For real friend invites, verify a domain in Resend and use an address on that domain.

3. Run the SQL in [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor.

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Supabase Notes

The schema creates:

- `profiles` for each authenticated user and selected fasting plan.
- `fasting_sessions` for active and completed fasts.
- `shared_fasts`, `shared_fast_participants`, and `shared_fast_invites` for fasting with friends.
- `weight_measurements` for tracking weight changes over time.
- A partial unique index that allows only one active fast per user.
- Row-level security policies so users can only access their own profile, sessions, and measurements.
- An auth trigger that creates a profile row when a user signs up.

## Testing Checklist

- User can sign up.
- User can log in.
- User can choose fasting plan.
- User can start a fast.
- Timer keeps working after refresh because it is calculated from `start_time`.
- User can end fast.
- Completed fast appears in history.
- Dashboard shows streak.
- Progress page shows weekly hours.
- Progress page allows weight logging and shows weight fluctuation.
- User cannot start two active fasts.
- User can create a shared fast and send invite emails.
- Invite recipients can open the link, log in, and join the shared fast.
- Logged-out user cannot access dashboard, history, progress, or onboarding.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
