import { StepIndicator } from "@/components/onboarding/step-indicator";
import { TimezoneInput } from "@/components/onboarding/timezone-input";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { saveProfileBasics } from "@/lib/auth/actions";

export default function OnboardingWelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <StepIndicator step={1} />

        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Welcome to Vitals
          </h1>
          <p className="text-sm text-muted-foreground">
            Two 15-second check-ins a day. We measure your focus, your output,
            and your consistency — never raw busywork.
          </p>
        </div>

        <form action={saveProfileBasics} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Your name</Label>
            <Input id="full_name" name="full_name" autoComplete="name" required />
          </div>
          <TimezoneInput />
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
