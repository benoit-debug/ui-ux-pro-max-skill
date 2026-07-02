// Surfaces one plain-language correlation for the dashboard, in the spirit of
// "your best output days have under 2h of meetings". Deliberately simple: we
// test a small set of pre-defined hypotheses (not an open-ended search), rank
// by absolute Pearson r over the days where both values exist, and return the
// single strongest one that clears a minimum sample size and strength bar.

export interface InsightDay {
  outputScore: number | null;
  focusScore: number | null;
  compositeScore: number | null;
  meetingMinutes: number | null;
  energy: number | null;
}

export interface Insight {
  text: string;
  correlation: number;
  sampleSize: number;
}

const MIN_SAMPLE = 5;
const MIN_STRENGTH = 0.4;

export function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  if (varX === 0 || varY === 0) return null;
  return cov / Math.sqrt(varX * varY);
}

interface Hypothesis {
  x: (d: InsightDay) => number | null;
  y: (d: InsightDay) => number | null;
  // Rendered from the sign of the correlation, so the sentence always matches
  // the data instead of assuming a direction.
  positive: string;
  negative: string;
}

const HYPOTHESES: Hypothesis[] = [
  {
    x: (d) => d.meetingMinutes,
    y: (d) => d.outputScore,
    positive: "Your output tends to be higher on days with more meeting time.",
    negative:
      "Your best output days tend to have less time in meetings.",
  },
  {
    x: (d) => d.energy,
    y: (d) => d.outputScore,
    positive: "Higher self-rated energy tracks with higher output.",
    negative: "Your output tends to be higher on lower-energy days.",
  },
  {
    x: (d) => d.meetingMinutes,
    y: (d) => d.focusScore,
    positive: "More meeting time tracks with a higher focus score.",
    negative: "Your focus score tends to drop on heavier meeting days.",
  },
];

export function findTopInsight(days: InsightDay[]): Insight | null {
  let best: Insight | null = null;

  for (const h of HYPOTHESES) {
    const pairs = days
      .map((d) => ({ x: h.x(d), y: h.y(d) }))
      .filter((p): p is { x: number; y: number } => p.x !== null && p.y !== null);

    if (pairs.length < MIN_SAMPLE) continue;

    const r = pearson(
      pairs.map((p) => p.x),
      pairs.map((p) => p.y),
    );
    if (r === null || Math.abs(r) < MIN_STRENGTH) continue;

    if (!best || Math.abs(r) > Math.abs(best.correlation)) {
      best = {
        text: r >= 0 ? h.positive : h.negative,
        correlation: r,
        sampleSize: pairs.length,
      };
    }
  }

  return best;
}
