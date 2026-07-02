/**
 * Seeds a demo account with ~3 weeks of check-ins, calendar data, and scores
 * so the dashboard and history are populated immediately.
 *
 * Scores are computed through the real lib/scoring engine (not reimplemented
 * in SQL), so seeded data always matches what a live check-in would produce.
 *
 * Run against a local Supabase stack:
 *   npx supabase start
 *   SUPABASE_SERVICE_ROLE_KEY=<key from `npx supabase status`> npm run seed
 *
 * Demo login: demo@example.com / password123
 */
import { createClient } from "@supabase/supabase-js";
import { computeDailyScore } from "../lib/scoring/index";
import { computeGoalCompletionRatio } from "../lib/scoring/output";
import type { Difficulty } from "../lib/scoring/types";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "password123";
const DAYS = 21;

if (!SERVICE_ROLE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is required. Get it from `npx supabase status`.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const GOAL_TEXTS = [
  "Ship the priority feature",
  "Review open pull requests",
  "Clear the admin backlog",
];

interface DayPlan {
  day: string;
  skipped: boolean;
  goals: { id: string; text: string; difficulty: Difficulty; achieved: boolean }[];
  meetingMinutes: number;
  deepWorkSlots: number;
  transitions: number;
  energy: number;
  focus: number;
}

// Deterministic pattern with a deliberate inverse meetings-vs-output
// relationship, so the dashboard's "Pattern" insight has something real to
// surface. Weekends (every 7th/8th slot) are skipped to make consistency and
// the no-check-in gaps realistic.
function planDay(i: number): DayPlan {
  const day = isoDaysAgo(DAYS - 1 - i);
  const weekdayIndex = i % 7;
  const skipped = weekdayIndex === 5 || weekdayIndex === 6;

  const meetingMinutes = [45, 90, 210, 60, 150, 0, 0][weekdayIndex] + (i % 3) * 15;

  // More meetings -> fewer goals achieved (by weight), driving the correlation.
  const difficulties: Difficulty[] = ["high", "medium", "low"];
  let achievedFlags: boolean[];
  if (meetingMinutes < 60) achievedFlags = [true, true, true];
  else if (meetingMinutes < 150) achievedFlags = [true, true, false];
  else if (meetingMinutes < 240) achievedFlags = [false, true, true];
  else achievedFlags = [false, false, true];

  const goals = difficulties.map((difficulty, g) => ({
    id: `${day}-${g}`,
    text: GOAL_TEXTS[g],
    difficulty,
    achieved: achievedFlags[g],
  }));

  return {
    day,
    skipped,
    goals,
    meetingMinutes,
    deepWorkSlots: Math.max(0, Math.min(3, Math.floor((300 - meetingMinutes) / 120))),
    transitions: 2 + Math.floor(meetingMinutes / 60),
    energy: Math.max(1, Math.min(5, 5 - Math.floor(meetingMinutes / 80))),
    focus: Math.max(1, Math.min(5, 5 - Math.floor(meetingMinutes / 90))),
  };
}

async function resetDemoUser(): Promise<string> {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users.find((u) => u.email === DEMO_EMAIL);
  if (existing) {
    // Cascades to profiles/check-ins/scores/calendar via FK on delete cascade.
    await supabase.auth.admin.deleteUser(existing.id);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo User" },
  });
  if (error || !data.user) throw error ?? new Error("Failed to create demo user");
  return data.user.id;
}

async function main() {
  const userId = await resetDemoUser();

  await supabase
    .from("profiles")
    .update({
      full_name: "Demo User",
      timezone: "Europe/Paris",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userId);

  const plans = Array.from({ length: DAYS }, (_, i) => planDay(i));
  const ratioByDay = new Map<string, number | null>();

  for (const plan of plans) {
    if (plan.skipped) {
      ratioByDay.set(plan.day, null);
      continue;
    }
    ratioByDay.set(plan.day, computeGoalCompletionRatio(plan.goals));
  }

  for (const plan of plans) {
    if (plan.skipped) continue;

    await supabase.from("daily_checkins").insert({
      user_id: userId,
      day: plan.day,
      goals: plan.goals,
      energy: plan.energy,
      focus: plan.focus,
      checked_out_at: new Date(`${plan.day}T18:00:00.000Z`).toISOString(),
    });

    await supabase.from("calendar_data").insert({
      user_id: userId,
      day: plan.day,
      meeting_minutes: plan.meetingMinutes,
      deep_work_slots: plan.deepWorkSlots,
      transitions: plan.transitions,
    });

    const last7Days = Array.from({ length: 7 }, (_, k) => {
      const d = new Date(`${plan.day}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() - (6 - k));
      const key = d.toISOString().slice(0, 10);
      return { day: key, ratio: ratioByDay.get(key) ?? null };
    });

    const result = computeDailyScore({
      goals: plan.goals,
      calendar: {
        meetingMinutes: plan.meetingMinutes,
        deepWorkSlots: plan.deepWorkSlots,
        transitions: plan.transitions,
      },
      selfRatedFocus: plan.focus,
      last7Days,
    });

    await supabase.from("daily_scores").insert({
      user_id: userId,
      day: plan.day,
      focus_score: result.focus.score,
      output_score: result.output.score,
      consistency_score: result.consistency.score,
      composite_score: result.composite,
      focus_explanation: result.focus.explanation,
      output_explanation: result.output.explanation,
      consistency_explanation: result.consistency.explanation,
      components: {
        focus: result.focus.components,
        output: result.output.components,
        consistency: result.consistency.components,
      },
    });
  }

  console.log(`Seeded ${plans.filter((p) => !p.skipped).length} days for ${DEMO_EMAIL}`);
  console.log(`Log in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
