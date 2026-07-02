import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormError } from "@/components/ui/form-error";
import { Label } from "@/components/ui/input";
import { ScaleSelect } from "@/components/ui/scale-select";
import { saveEveningCheckout } from "@/lib/checkin/actions";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/time/today";

interface Goal {
  id: string;
  text: string;
  difficulty: "low" | "medium" | "high";
  achieved: boolean | null;
}

export default async function CheckoutPage({
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
    .select("goals, energy, focus")
    .eq("user_id", user.id)
    .eq("day", day)
    .maybeSingle();

  if (!checkin) redirect("/check-in");

  const goals = (checkin.goals ?? []) as Goal[];

  return (
    <div className="mx-auto max-w-sm space-y-6 px-4 py-10">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Evening check-out</h1>
        <p className="text-sm text-muted-foreground">
          Mark what you actually finished.
        </p>
      </div>

      <FormError message={error} />

      <form action={saveEveningCheckout} className="space-y-6">
        <div className="space-y-2">
          {goals.map((goal) => (
            <label
              key={goal.id}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
            >
              <Checkbox
                name={`achieved_${goal.id}`}
                defaultChecked={goal.achieved ?? false}
              />
              <span className="flex-1 text-sm">{goal.text}</span>
              <span className="text-xs uppercase text-muted-foreground">
                {goal.difficulty}
              </span>
            </label>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Energy</Label>
          <ScaleSelect name="energy" defaultValue={checkin.energy ?? 3} />
        </div>
        <div className="space-y-2">
          <Label>Focus</Label>
          <ScaleSelect name="focus" defaultValue={checkin.focus ?? 3} />
        </div>

        <Button type="submit" className="w-full">
          Finish today
        </Button>
      </form>

      <Link
        href="/dashboard"
        className="block text-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
