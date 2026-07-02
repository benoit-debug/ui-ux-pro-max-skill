// Whoop-style circular gauge for the composite score. Single-hue arc on a
// recessive track; the number is the hero. Server component (pure SVG, no
// interactivity needed).
export function ScoreRing({
  score,
  size = 168,
  strokeWidth = 12,
}: {
  score: number | null;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score ?? 0;
  const dash = (pct / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
        />
        {score !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-semibold tabular-nums text-foreground">
          {score ?? "—"}
        </span>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Composite
        </span>
      </div>
    </div>
  );
}
