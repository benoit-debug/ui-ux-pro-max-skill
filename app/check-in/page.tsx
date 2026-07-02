import Link from "next/link";
import { redirect } from "next/navigation";
import { GoalsForm, type Difficulty } from "@/components/checkin/goal-form";
import { saveMorningCheckin } from "@/lib/checkin/actions";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/time/today";

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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
  const timezone = profile?.timezone ?? "UTC";
  const day = todayInTimezone(timezone);

  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("goals")
    .eq("user_id", user.id)
    .eq("day", day)
    .maybeSingle();

  const defaultGoals = (checkin?.goals ?? []) as {
    text: string;
    difficulty: Difficulty;
  }[];

  return (
    <div className="mx-auto max-w-sm space-y-6 px-4 py-10">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Morning check-in</h1>
        <p className="text-sm text-muted-foreground">
          1 to 3 priorities for today, ranked by difficulty.
        </p>
      </div>

      <GoalsForm
        action={saveMorningCheckin}
        error={error}
        redirectTo="/dashboard"
        defaultGoals={defaultGoals}
        submitLabel={checkin ? "Update goals" : "Save goals"}
      />

      <Link
        href="/dashboard"
        className="block text-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
