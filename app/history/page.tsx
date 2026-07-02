import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/time/today";

interface Goal {
  id: string;
  text: string;
  difficulty: string;
  achieved: boolean | null;
}

function formatDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function HistoryPage() {
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
  const today = todayInTimezone(profile?.timezone ?? "UTC");

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("day, goals, energy, focus, checked_out_at")
    .eq("user_id", user.id)
    .lte("day", today)
    .order("day", { ascending: false })
    .limit(60);

  const { data: scores } = await supabase
    .from("daily_scores")
    .select("day, composite_score")
    .eq("user_id", user.id)
    .lte("day", today);

  const compositeByDay = new Map(
    (scores ?? []).map((s) => [s.day as string, s.composite_score as number | null]),
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-lg font-semibold">Check-in history</h1>

      {!checkins || checkins.length === 0 ? (
        <p className="text-sm text-muted-foreground">No check-ins yet.</p>
      ) : (
        <div className="space-y-4">
          {checkins.map((c) => {
            const goals = (c.goals ?? []) as Goal[];
            const composite = compositeByDay.get(c.day as string);
            return (
              <Card key={c.day as string}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-foreground">{formatDay(c.day as string)}</CardTitle>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {composite != null ? `${composite}/100` : "-"}
                  </span>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {goals.map((goal) => (
                      <li
                        key={goal.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span
                          className={
                            goal.achieved ? "line-through text-muted-foreground" : ""
                          }
                        >
                          {goal.text}
                        </span>
                        <span className="text-xs uppercase text-muted-foreground">
                          {goal.difficulty}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {c.checked_out_at && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Energy {c.energy}/5, focus {c.focus}/5
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </main>
    </>
  );
}
