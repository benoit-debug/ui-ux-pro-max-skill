export function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={
            n <= step
              ? "h-1 w-8 rounded-full bg-foreground"
              : "h-1 w-8 rounded-full bg-border"
          }
        />
      ))}
    </div>
  );
}
