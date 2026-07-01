import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

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

  const today = new Date().toISOString().slice(0, 10);
  const { data: checkin } = user
    ? await supabase
        .from("daily_checkins")
        .select("goals")
        .eq("user_id", user.id)
        .eq("day", today)
        .maybeSingle()
    : { data: null };

  const goals = (checkin?.goals ?? []) as {
    id: string;
    text: string;
    difficulty: string;
  }[];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Timezone: {profile?.timezone ?? "UTC"}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>

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
                  <span>{goal.text}</span>
                  <span className="text-xs uppercase text-muted-foreground">
                    {goal.difficulty}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        The full scoring dashboard (Focus / Output / Consistency, trends,
        history) lands in a later build step.
      </p>
    </div>
  );
}
