"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncCalendarForDay } from "@/lib/calendar/sync";
import { todayInTimezone } from "@/lib/time/today";

type Difficulty = "low" | "medium" | "high";

async function getUserAndTimezone() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  return { supabase, user, timezone: profile?.timezone ?? "UTC" };
}

// Morning check-in: 1-3 goals with difficulty. Also used by the onboarding
// wizard's last step (via the `complete_onboarding` hidden field), since
// setting the first day's goals is exactly this same operation.
export async function saveMorningCheckin(formData: FormData) {
  const { supabase, user, timezone } = await getUserAndTimezone();
  const redirectTo = String(formData.get("redirect_to") || "/dashboard");

  const goals = [1, 2, 3]
    .map((n) => ({
      text: String(formData.get(`goal${n}`) ?? "").trim(),
      difficulty: (formData.get(`difficulty${n}`) ?? "medium") as Difficulty,
    }))
    .filter((g) => g.text.length > 0)
    .map((g, i) => ({
      id: `${Date.now()}-${i}`,
      text: g.text,
      difficulty: g.difficulty,
      achieved: null as boolean | null,
    }));

  if (goals.length === 0) {
    redirect(
      `${redirectTo === "/dashboard" ? "/check-in" : redirectTo}?error=${encodeURIComponent(
        "Add at least one goal to get started",
      )}`,
    );
  }

  const day = todayInTimezone(timezone);

  const { error: checkinError } = await supabase
    .from("daily_checkins")
    .upsert({ user_id: user.id, day, goals }, { onConflict: "user_id,day" });
  if (checkinError) {
    redirect(`/check-in?error=${encodeURIComponent(checkinError.message)}`);
  }

  if (formData.get("complete_onboarding") === "true") {
    await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  await syncCalendarForDay(supabase, user.id, day, timezone);

  redirect(redirectTo);
}

export async function saveEveningCheckout(formData: FormData) {
  const { supabase, user, timezone } = await getUserAndTimezone();
  const day = todayInTimezone(timezone);

  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("goals")
    .eq("user_id", user.id)
    .eq("day", day)
    .maybeSingle();

  if (!checkin) redirect("/check-in");

  const goals = (
    checkin.goals as { id: string; text: string; difficulty: Difficulty }[]
  ).map((goal) => ({
    ...goal,
    achieved: formData.get(`achieved_${goal.id}`) === "on",
  }));

  const energy = Math.min(5, Math.max(1, Number(formData.get("energy")) || 3));
  const focus = Math.min(5, Math.max(1, Number(formData.get("focus")) || 3));

  const { error } = await supabase
    .from("daily_checkins")
    .update({ goals, energy, focus, checked_out_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("day", day);

  if (error) {
    redirect(`/checkout?error=${encodeURIComponent(error.message)}`);
  }

  await syncCalendarForDay(supabase, user.id, day, timezone);

  redirect("/dashboard");
}
