import { StepIndicator } from "@/components/onboarding/step-indicator";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { LinkButton } from "@/components/ui/link-button";
import { connectGoogleCalendar } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: connection } = user
    ? await supabase
        .from("calendar_connections")
        .select("connected_at")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <StepIndicator step={2} />

        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Connect Google Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Optional. Read-only access to today&apos;s events lets us measure
            deep-work time and meeting fragmentation automatically. Skip it
            and your Focus score will use your evening self-rating instead.
          </p>
        </div>

        <FormError message={error} />

        {connection ? (
          <div className="space-y-4">
            <div className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-center text-sm text-accent">
              Google Calendar connected
            </div>
            <LinkButton href="/onboarding/goal" className="w-full">
              Continue
            </LinkButton>
          </div>
        ) : (
          <div className="space-y-3">
            <form action={connectGoogleCalendar}>
              <Button type="submit" className="w-full">
                Connect Google Calendar
              </Button>
            </form>
            <LinkButton href="/onboarding/goal" variant="secondary" className="w-full">
              Skip for now
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}
