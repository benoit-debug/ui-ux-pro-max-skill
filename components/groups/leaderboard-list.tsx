import type { LeaderboardRow } from "@/lib/groups/queries";
import { cn } from "@/lib/utils";

function Progression({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs text-muted-foreground">new this week</span>;
  }
  const positive = pct >= 0;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        positive ? "text-accent" : "text-destructive",
      )}
    >
      {positive ? "+" : ""}
      {pct}% vs last week
    </span>
  );
}

export function LeaderboardList({
  rows,
  currentUserId,
}: {
  rows: LeaderboardRow[];
  currentUserId: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No ranked members with scores this week yet.
      </p>
    );
  }

  return (
    <ol className="space-y-1">
      {rows.map((row) => (
        <li
          key={row.userId}
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2 text-sm",
            row.userId === currentUserId ? "bg-muted" : "",
          )}
        >
          <span className="flex items-center gap-3">
            <span className="w-5 tabular-nums text-muted-foreground">{row.rank}</span>
            <span>
              {row.name}
              {row.userId === currentUserId && " (you)"}
            </span>
          </span>
          <span className="flex items-center gap-3">
            <Progression pct={row.progressionPct} />
            <span className="w-10 text-right font-medium tabular-nums">
              {row.currentScore ?? "-"}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
