import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import {
  createInviteLink,
  leaveGroup,
  toggleRanking,
} from "@/lib/groups/actions";
import { getLeaderboard } from "@/lib/groups/queries";
import { LeaderboardList } from "@/components/groups/leaderboard-list";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/time/today";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, owner_id")
    .eq("id", id)
    .maybeSingle();

  // RLS returns nothing if the caller isn't a member/owner.
  if (!group) redirect("/groups");

  const { data: membership } = await supabase
    .from("group_members")
    .select("participates_in_ranking")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  const today = todayInTimezone(profile?.timezone ?? "UTC");

  const leaderboard = await getLeaderboard(supabase, id, today);

  const { data: invite } = await supabase
    .from("group_invites")
    .select("token")
    .eq("group_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const inviteUrl = invite ? `${protocol}://${host}/join/${invite.token}` : null;

  const participates = membership?.participates_in_ranking ?? false;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{group.name}</h1>
        <Link
          href="/groups"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          All groups
        </Link>
      </div>

      <FormError message={error} />

      <Card>
        <CardHeader>
          <CardTitle>This week&apos;s leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardList rows={leaderboard} currentUserId={user.id} />
          {!participates && (
            <p className="mt-3 text-xs text-muted-foreground">
              You&apos;ve opted out of ranking, so you don&apos;t appear above.
              Your personal analytics are unaffected.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inviteUrl ? (
            <Input readOnly value={inviteUrl} className="text-xs" />
          ) : (
            <p className="text-sm text-muted-foreground">No invite link yet.</p>
          )}
          <form action={createInviteLink}>
            <input type="hidden" name="group_id" value={id} />
            <Button type="submit" variant="secondary">
              {inviteUrl ? "Generate new link" : "Create invite link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ranking participation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {participates
              ? "You appear on this group's leaderboard."
              : "You're hidden from this group's leaderboard."}
          </p>
          <form action={toggleRanking}>
            <input type="hidden" name="group_id" value={id} />
            <input type="hidden" name="participate" value={(!participates).toString()} />
            <Button type="submit" variant="secondary">
              {participates ? "Opt out" : "Opt in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <form action={leaveGroup}>
        <input type="hidden" name="group_id" value={id} />
        <Button type="submit" variant="ghost" className="text-destructive">
          Leave group
        </Button>
      </form>
    </div>
  );
}
