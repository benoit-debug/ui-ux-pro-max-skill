"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GOOGLE_CALENDAR_SCOPE } from "@/lib/auth/google";

async function getOrigin() {
  const h = await headers();
  return (
    h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  );
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/onboarding");
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/onboarding`,
      scopes: GOOGLE_CALENDAR_SCOPE,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`);
  }
  redirect(data.url);
}

// Lets an already-authenticated user (e.g. signed up via email/password)
// separately grant Calendar read access without changing their primary
// sign-in method.
export async function connectGoogleCalendar() {
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/onboarding/goal`,
      scopes: GOOGLE_CALENDAR_SCOPE,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) {
    // Identity already linked (e.g. the user originally signed up with
    // Google, which already requested calendar access) - treat as connected.
    if (
      error.code === "identity_already_exists" ||
      error.message?.toLowerCase().includes("already")
    ) {
      redirect("/onboarding/goal");
    }
    redirect(`/onboarding/calendar?error=${encodeURIComponent(error.message)}`);
  }

  if (!data?.url) {
    redirect("/onboarding/goal");
  }
  redirect(data.url);
}

export async function saveProfileBasics(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "UTC");

  await supabase
    .from("profiles")
    .update({ full_name: fullName || null, timezone })
    .eq("id", user.id);

  redirect("/onboarding/calendar");
}

type Difficulty = "low" | "medium" | "high";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
      `/onboarding/goal?error=${encodeURIComponent("Add at least one goal to get started")}`,
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const { error: checkinError } = await supabase
    .from("daily_checkins")
    .upsert({ user_id: user.id, day: today, goals }, { onConflict: "user_id,day" });
  if (checkinError) {
    redirect(`/onboarding/goal?error=${encodeURIComponent(checkinError.message)}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (profileError) {
    redirect(`/onboarding/goal?error=${encodeURIComponent(profileError.message)}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
