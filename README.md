# Productivity Score (MVP)

A dashboard that turns real work activity into performance scores (Whoop-style, for professional productivity), with a personal analytics view and a group view with a weekly leaderboard.

> Status: auth, onboarding, daily check-in/check-out, Google Calendar data capture, and the scoring engine are in place. The full dashboard (trends, history, correlations) and groups land in later build steps — see `CLAUDE.md`.

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

## What's mocked / simplified so far

- The dashboard shows today's score and goals but not yet trends, history, or correlations — that's the next build step.
- Calendar sync and score computation are opportunistic (run on check-in/check-out page loads), not a background job — there's no scheduled infra in this MVP.
- Deep-work slots and fragmentation are derived from a fixed 8am-7pm working-hours window, not the user's actual work schedule.
- Day boundaries for "today" use the offset at local midnight, which can be off by the DST amount on a transition day.
- Consistency is measured over a fixed 7-day window regardless of account age, so a brand-new account can't score above (days since sign-up)/7 yet.
- No demo/seed dataset yet (`supabase/seed.sql` is a stub) — added once groups exist.
