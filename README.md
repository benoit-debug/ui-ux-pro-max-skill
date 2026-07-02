# Productivity Score (MVP)

A dashboard that turns real work activity into performance scores (Whoop-style, for professional productivity), with a personal analytics view and a group view with a weekly leaderboard.

> Status: feature-complete MVP — auth, onboarding, daily check-in/check-out, Google Calendar data capture, the scoring engine, the personal dashboard (today's score, 7/30-day trends, a correlation insight, check-in history), and groups with a weekly leaderboard. Account deletion (GDPR) is the remaining finishing task — see `CLAUDE.md`.

## Repository layout

- `/` — the Next.js + Supabase SaaS app (this project)
- `packages/ui-ux-pro-max-skill/` — a separate, pre-existing design-intelligence skill/CLI bundled in this repo. See its own [README](packages/ui-ux-pro-max-skill/README.md). Not part of the SaaS app.

## Setup

Requires Node 20+, Docker (for local Supabase), and the Supabase CLI (used here via `npx`, no global install needed).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start local Supabase (Postgres, Auth, Studio) and apply migrations:
   ```bash
   npx supabase start
   ```
   This prints an API URL and an `anon key` — copy them into `.env.local` (see below).
3. Copy the env template and fill in the local Supabase values:
   ```bash
   cp .env.example .env.local
   ```
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: from the `supabase start` output.
   - Google OAuth (`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `_SECRET`): only needed to test "Continue with Google" or the Calendar connect step. Create an OAuth client in Google Cloud Console with authorized redirect URI `http://127.0.0.1:54321/auth/v1/callback`. Email/password sign-up works without this.
4. Run the app:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — you'll land on `/login`. Signing up walks you through the 3-screen onboarding (name/timezone → optional Calendar connect → first goals) before reaching `/dashboard`. From there, `/check-in` (morning goals) and `/checkout` (mark goals done, rate energy/focus) are the two daily touchpoints; each also silently syncs Calendar data and recomputes today's score.
5. Supabase Studio (inspect tables, RLS, auth users) is at http://127.0.0.1:54323 while `supabase start` is running.

Run the scoring engine's unit tests (no Supabase needed - pure functions):
```bash
npm test
```

To reset the local database (re-applies all migrations from scratch):
```bash
npx supabase db reset
```

### Demo data

To populate a demo account with ~3 weeks of check-ins, calendar data, and scores
(so the dashboard and history are filled without waiting for real data):
```bash
SUPABASE_SERVICE_ROLE_KEY=<service_role key from `npx supabase status`> npm run seed
```
Then log in with **demo@example.com / password123**. Scores are computed through
the real `lib/scoring` engine, so seeded data matches live check-ins. Re-running
the command resets the demo account.

## What's mocked / simplified so far

- Calendar sync and score computation are opportunistic (run on check-in/check-out page loads), not a background job — there's no scheduled infra in this MVP.
- Deep-work slots and fragmentation are derived from a fixed 8am-7pm working-hours window, not the user's actual work schedule.
- Day boundaries for "today" use the offset at local midnight, which can be off by the DST amount on a transition day.
- Consistency is measured over a fixed 7-day window regardless of account age, so a brand-new account can't score above (days since sign-up)/7 yet.
- The dashboard's "Pattern" insight tests a small fixed set of hypotheses (meetings vs. output/focus, energy vs. output), not an open-ended search.
- The group leaderboard resets every Monday (ISO week). Members see each other's composite score and week-over-week progression only — never sub-scores, explanations, or goal content (enforced via a `SECURITY DEFINER` function that emits only composite aggregates; `daily_scores` stays owner-only and `daily_checkins` is never exposed).
- Accepting a group invite requires being logged in first: an unauthenticated visitor opening an invite link is sent to `/login`, then reopens the link once signed in (no post-login redirect chaining yet).
- Invite links are shareable and reusable (not single-use or time-limited).
