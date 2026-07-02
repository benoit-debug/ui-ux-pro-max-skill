"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryDay } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

// Dark categorical slots (blue/aqua/yellow/violet), validated against the
// dashboard's card surface #0e1223 via the dataviz palette validator.
const SERIES = [
  { key: "composite", label: "Composite", color: "#3987e5" },
  { key: "focus", label: "Focus", color: "#199e70" },
  { key: "output", label: "Output", color: "#c98500" },
  { key: "consistency", label: "Consistency", color: "#9085e9" },
] as const;

const INK_MUTED = "#94a3b8";
const GRID = "#262b3d";

function formatDay(day: string): string {
  const [, m, d] = day.split("-");
  return `${Number(m)}/${Number(d)}`;
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number | null;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-foreground">{label && formatDay(label)}</p>
      {SERIES.map((s) => {
        const entry = payload.find((p) => p.dataKey === s.key);
        return (
          <p key={s.key} className="flex items-center gap-2 text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}: {entry?.value ?? "-"}
          </p>
        );
      })}
    </div>
  );
}

export function TrendChart({ history }: { history: HistoryDay[] }) {
  const [range, setRange] = useState<7 | 30>(30);
  const data = history.slice(-range);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
        <div className="flex gap-1 text-xs">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                range === r
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={formatDay}
            tick={{ fill: INK_MUTED, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: INK_MUTED, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: INK_MUTED }} />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
