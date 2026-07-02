export type Difficulty = "low" | "medium" | "high";

export interface ScoredGoal {
  difficulty: Difficulty;
  achieved: boolean | null;
}

export interface CalendarDayMetrics {
  meetingMinutes: number;
  deepWorkSlots: number;
  transitions: number;
}

export interface ScoreResult {
  score: number | null;
  explanation: string;
  components: Record<string, unknown>;
}
