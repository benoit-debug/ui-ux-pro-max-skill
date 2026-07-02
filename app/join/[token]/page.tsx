import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { joinGroup } from "@/lib/groups/actions";
import { createClient } from "@/lib/supabase/server";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  // Protected by middleware: an unauthenticated visitor is sent to /login
  // first (they can then reopen the invite link once signed in).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Join group</h1>
          <p className="text-sm text-muted-foreground">
            You&apos;ve been invited to a group. Members see each other&apos;s
            composite scores and weekly progression only — never your goals or
            task details.
          </p>
        </div>

        <FormError message={error} />

        <form action={joinGroup}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" className="w-full">
            Join group
          </Button>
        </form>
      </div>
    </div>
  );
}
