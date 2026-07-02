import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type Difficulty = "low" | "medium" | "high";

export interface GoalDefault {
  text: string;
  difficulty: Difficulty;
}

function GoalRow({
  index,
  required,
  defaultValue,
}: {
  index: number;
  required: boolean;
  defaultValue?: GoalDefault;
}) {
  return (
    <div className="flex gap-2">
      <Input
        name={`goal${index}`}
        placeholder={required ? "Today's top priority" : "Optional"}
        required={required}
        defaultValue={defaultValue?.text}
        className="flex-1"
      />
      <Select
        name={`difficulty${index}`}
        defaultValue={defaultValue?.difficulty ?? "medium"}
        className="w-28"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </Select>
    </div>
  );
}

export function GoalsForm({
  action,
  error,
  redirectTo,
  completeOnboarding,
  defaultGoals = [],
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  redirectTo?: string;
  completeOnboarding?: boolean;
  defaultGoals?: GoalDefault[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-3">
      <FormError message={error} />
      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}
      {completeOnboarding && (
        <input type="hidden" name="complete_onboarding" value="true" />
      )}
      <Label>Goal 1</Label>
      <GoalRow index={1} required defaultValue={defaultGoals[0]} />
      <Label>Goal 2</Label>
      <GoalRow index={2} required={false} defaultValue={defaultGoals[1]} />
      <Label>Goal 3</Label>
      <GoalRow index={3} required={false} defaultValue={defaultGoals[2]} />
      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
