import "server-only";
import type { createClient } from "@/lib/supabase/server";

export interface LeaderboardRow {
  userId: string;
  name: string;
  avatarUrl: string | null;
  currentScore: number | null;
  // Percentage change vs. last week; null when there's no prior-week baseline.
  progressionPct: number | null;
  rank: number;
}

interface RawLeaderboardRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  current_avg: number | null;
  previous_avg: number | null;
}

export async function getLeaderboard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  today: string,
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("group_leaderboard", {
    p_group_id: groupId,
    p_today: today,
  });
  if (error || !data) return [];

  const rows = (data as RawLeaderboardRow[]).map((r) => {
    const current = r.current_avg != null ? Math.round(Number(r.current_avg)) : null;
    const previous = r.previous_avg != null ? Number(r.previous_avg) : null;
    const progressionPct =
      current != null && previous != null && previous > 0
        ? Math.round(((current - previous) / previous) * 100)
        : null;
    return {
      userId: r.user_id,
      name: r.full_name ?? "Member",
      avatarUrl: r.avatar_url,
      currentScore: current,
      progressionPct,
    };
  });

  // Rank by this week's average; members with no score this week sink to the
  // bottom (the weekly reset means everyone starts from nothing each Monday).
  rows.sort((a, b) => (b.currentScore ?? -1) - (a.currentScore ?? -1));

  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
