import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormError } from "@/components/ui/form-error";
import { AppHeader } from "@/components/app-header";
import { deleteAccount } from "@/lib/account/actions";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage({
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
    .select("full_name, timezone")
    .eq("id", user.id)
    .single();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-lg font-semibold">Account</h1>

      <FormError message={error} />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{profile?.full_name ?? "No name set"}</p>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="text-muted-foreground">Timezone: {profile?.timezone ?? "UTC"}</p>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Delete account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            This permanently deletes your account and all associated data —
            check-ins, calendar data, scores, and any groups you own. This
            cannot be undone.
          </p>
          <form action={deleteAccount} className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="confirm" />
              I understand this is permanent.
            </label>
            <Button type="submit" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete my account
            </Button>
          </form>
        </CardContent>
      </Card>
      </main>
    </>
  );
}
