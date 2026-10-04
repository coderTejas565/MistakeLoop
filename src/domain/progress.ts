import type { Card } from "./types";

export type ProgressState = "weak" | "practicing" | "improving" | "fixed";

/** Derived from cards only, never stored. null = no cards for this subtopic. */
export function subtopicProgress(
  cards: Pick<Card, "stage" | "state" | "lastReviewedAt">[],
): ProgressState | null {
  if (cards.length === 0) return null;
  if (cards.every((c) => c.state === "fixed")) return "fixed";
  if (cards.every((c) => c.lastReviewedAt === null)) return "weak";
  if (cards.some((c) => c.state === "fixed" || c.stage >= 1))
    return "improving";
  return "practicing";
}
