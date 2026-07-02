# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Repository layout

This repository hosts two independent things:

```
/                                   # Whoop-style productivity SaaS (Next.js + Supabase)
packages/ui-ux-pro-max-skill/       # Original "Antigravity Kit" design-intelligence skill/CLI (unchanged, still publishable standalone)
.claude/skills/                     # Claude Code skills available in this repo (ui-ux-pro-max symlinks into packages/ui-ux-pro-max-skill/)
```

The `packages/ui-ux-pro-max-skill/` package is untouched in behavior — see `packages/ui-ux-pro-max-skill/CLAUDE.md` for its own instructions (search command, sync rules, architecture). Do not edit it as part of SaaS feature work unless explicitly asked.

## SaaS project overview

**Vitals** ("The vitals of your workday") — a dashboard that turns real work activity into productivity scores (Whoop-style), with a personal analytics view and a group view with a weekly leaderboard. Target users: solopreneurs, freelancers, small tech teams.

Stack: Next.js (App Router, TypeScript strict), Supabase (Postgres, Auth, RLS everywhere), Tailwind CSS, Recharts. Local Supabase dev via Supabase CLI/Docker — no hosted project during MVP development.

For UI styling, color palettes, typography, and component conventions, use the `ui-ux-pro-max` skill (available in this repo) rather than reinventing patterns — it is invocable via the Skill tool or directly:

```bash
python3 packages/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py "<query>" --stack nextjs
```

## Scoring engine

The scoring logic lives in `lib/scoring/` and must stay isolated from UI code, with unit tests covering the key cases (difficult goal vs. several easy goals, no-calendar fallback, consistency vs. single-day overwork). Weight constants for the composite score live at the top of the module.

## Out of scope for the MVP

AI coaching, integrations beyond Google Calendar, native mobile app, payments/subscriptions, push notifications, multi-language support. English-only UI.

## Git Workflow

Never push directly to `main`. Always:

1. Create a new branch: `git checkout -b feat/...` or `fix/...`
2. Commit changes
3. Push branch: `git push -u origin <branch>`
4. Create PR: `gh pr create`
