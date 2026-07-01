import { StepIndicator } from "@/components/onboarding/step-indicator";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { completeOnboarding } from "@/lib/auth/actions";

function GoalRow({ index, required }: { index: number; required: boolean }) {
  return (
    <div className="flex gap-2">
      <Input
        name={`goal${index}`}
        placeholder={required ? "Today's top priority" : "Optional"}
        required={required}
        className="flex-1"
      />
      <Select name={`difficulty${index}`} defaultValue="medium" className="w-28">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </Select>
    </div>
  );
}

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

        <FormError message={error} />

        <form action={completeOnboarding} className="space-y-3">
          <Label>Goal 1</Label>
          <GoalRow index={1} required />
          <Label>Goal 2</Label>
          <GoalRow index={2} required={false} />
          <Label>Goal 3</Label>
          <GoalRow index={3} required={false} />

          <Button type="submit" className="w-full">
            Start tracking
          </Button>
        </form>
      </div>
    </div>
  );
}
