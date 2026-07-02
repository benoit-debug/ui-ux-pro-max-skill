import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { createGroup } from "@/lib/groups/actions";
import { createClient } from "@/lib/supabase/server";

interface MembershipRow {
  group_id: string;
  participates_in_ranking: boolean;
  groups: { id: string; name: string; owner_id: string } | null;
}

export default async function GroupsPage({
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

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, participates_in_ranking, groups(id, name, owner_id)")
    .eq("user_id", user.id);

  const groups = ((memberships ?? []) as unknown as MembershipRow[])
    .filter((m) => m.groups !== null)
    .map((m) => ({
      id: m.groups!.id,
      name: m.groups!.name,
      isOwner: m.groups!.owner_id === user.id,
      participates: m.participates_in_ranking,
    }));

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Groups</h1>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Back to dashboard
        </Link>
      </div>

      <FormError message={error} />

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You&apos;re not in any groups yet. Create one below, or open an invite
          link a teammate shared with you.
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <Link key={g.id} href={`/groups/${g.id}`}>
              <Card className="transition-colors hover:bg-muted">
                <CardContent className="flex items-center justify-between p-4">
                  <span className="text-sm font-medium">{g.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {g.isOwner ? "Owner" : "Member"}
                    {!g.participates && " · not ranked"}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <form action={createGroup} className="flex gap-2">
            <Input name="name" placeholder="New group name" required className="flex-1" />
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
