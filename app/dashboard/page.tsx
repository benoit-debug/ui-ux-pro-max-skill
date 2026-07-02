import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { AppHeader } from "@/components/app-header";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { createClient } from "@/lib/supabase/server";
import { getScoreHistory } from "@/lib/dashboard/queries";
import { findTopInsight } from "@/lib/insights/correlation";
import { todayInTimezone } from "@/lib/time/today";

interface Goal {
  id: string;
  text: string;
  difficulty: string;
  achieved: boolean | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, timezone")
        .eq("id", user.id)
        .single()
    : { data: null };

  const timezone = profile?.timezone ?? "UTC";
  const today = todayInTimezone(timezone);

  const { data: checkin } = user
    ? await supabase
        .from("daily_checkins")
        .select("goals, energy, focus, checked_out_at")
        .eq("user_id", user.id)
        .eq("day", today)
        .maybeSingle()
    : { data: null };

  const { data: calendarData } = user
    ? await supabase
        .from("calendar_data")
        .select("meeting_minutes, deep_work_slots, transitions")
        .eq("user_id", user.id)
        .eq("day", today)
        .maybeSingle()
    : { data: null };

  const { data: calendarConnection } = user
    ? await supabase
        .from("calendar_connections")
        .select("connected_at, revoked_at")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: score } = user
    ? await supabase
        .from("daily_scores")
        .select(
          "composite_score, focus_score, output_score, consistency_score, focus_explanation, output_explanation, consistency_explanation",
        )
        .eq("user_id", user.id)
        .eq("day", today)
        .maybeSingle()
    : { data: null };

  const history = user ? await getScoreHistory(supabase, user.id, today, 30) : [];
  const insight = findTopInsight(
    history.map((h) => ({
      outputScore: h.output,
      focusScore: h.focus,
      compositeScore: h.composite,
      meetingMinutes: h.meetingMinutes,
      energy: h.energy,
    })),
  );
  const hasTrendData = history.some((h) => h.composite !== null);

  const goals = (checkin?.goals ?? []) as Goal[];

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <LinkButton href="/check-in" variant="secondary" className="flex-1">
          {checkin ? "Edit morning check-in" : "Morning check-in"}
        </LinkButton>
        <LinkButton href="/checkout" variant="secondary" className="flex-1">
          Evening check-out
        </LinkButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s score</CardTitle>
        </CardHeader>
        <CardContent>
          {score ? (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <ScoreRing score={score.composite_score} />
              <dl className="flex-1 space-y-3 text-sm">
                <div>
                  <dt className="font-medium">Focus {score.focus_score ?? "—"}/100</dt>
                  <dd className="text-muted-foreground">{score.focus_explanation}</dd>
                </div>
                <div>
                  <dt className="font-medium">Output {score.output_score ?? "—"}/100</dt>
                  <dd className="text-muted-foreground">{score.output_explanation}</dd>
                </div>
                <div>
                  <dt className="font-medium">
                    Consistency {score.consistency_score ?? "—"}/100
                  </dt>
                  <dd className="text-muted-foreground">{score.consistency_explanation}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Scores appear after your first morning check-in.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {hasTrendData ? (
            <TrendChart history={history} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Trends appear once you have a few days of scores.
            </p>
          )}
        </CardContent>
      </Card>

      {insight && (
        <Card>
          <CardHeader>
            <CardTitle>Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{insight.text}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on {insight.sampleSize} days of data.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s goals</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No goals set for today yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {goals.map((goal) => (
                <li key={goal.id} className="flex items-center justify-between text-sm">
                  <span className={goal.achieved ? "line-through text-muted-foreground" : ""}>
                    {goal.text}
                  </span>
                  <span className="text-xs uppercase text-muted-foreground">
                    {goal.difficulty}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {checkin?.checked_out_at && (
            <p className="mt-3 text-xs text-muted-foreground">
              Checked out - energy {checkin.energy}/5, focus {checkin.focus}/5
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          {!calendarConnection || calendarConnection.revoked_at ? (
            <p className="text-sm text-muted-foreground">
              Not connected. Focus score will use your evening self-rating instead.
            </p>
          ) : calendarData ? (
            <p className="text-sm text-muted-foreground">
              {calendarData.meeting_minutes} min in meetings today,{" "}
              {calendarData.deep_work_slots} deep-work slot(s) of 90+ min,{" "}
              {calendarData.transitions} transitions.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connected - synced at your next check-in or check-out.
            </p>
          )}
        </CardContent>
      </Card>

      </main>
    </>
  );
}
