// A 1-5 self-rating control. Discrete tap targets are faster than dragging
// a slider, which matters for a check-in meant to take 15 seconds.
export function ScaleSelect({
  name,
  defaultValue = 3,
}: {
  name: string;
  defaultValue?: number;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="flex-1">
          <input
            type="radio"
            name={name}
            value={n}
            defaultChecked={n === defaultValue}
            className="peer sr-only"
          />
          <div className="cursor-pointer rounded-md border border-border py-2 text-center text-sm text-muted-foreground transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
            {n}
          </div>
        </label>
      ))}
    </div>
  );
}
