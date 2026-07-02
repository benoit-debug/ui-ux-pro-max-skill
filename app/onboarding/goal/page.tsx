import { StepIndicator } from "@/components/onboarding/step-indicator";
import { GoalsForm } from "@/components/checkin/goal-form";
import { saveMorningCheckin } from "@/lib/checkin/actions";

export default async function OnboardingGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <StepIndicator step={3} />

        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Set today&apos;s goals
          </h1>
          <p className="text-sm text-muted-foreground">
            1 to 3 priorities, ranked by difficulty. Finishing one hard goal
            outweighs three easy ones.
          </p>
        </div>

        <GoalsForm
          action={saveMorningCheckin}
          error={error}
          redirectTo="/dashboard"
          completeOnboarding
          submitLabel="Start tracking"
        />
      </div>
    </div>
  );
}
