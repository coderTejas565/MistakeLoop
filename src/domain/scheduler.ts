import type { Card } from './types';

export const INTERVALS_DAYS = [1, 3, 7];
const DAY_MS = 86_400_000;

export interface CardUpdate {
  stage: number;
  dueAt: Date;
  state: 'active' | 'fixed';
  lastReviewedAt: Date;
}

/**
 * Correct at stage s < 3: stage s+1, due in INTERVALS[s] days.
 * Correct at stage 3 (the 7-day check): fixed.
 * Wrong: back to stage 0, due tomorrow.
 */
export function applyResult(card: Pick<Card, 'stage'>, correct: boolean, now: Date): CardUpdate {
  if (!correct) {
    return { stage: 0, dueAt: new Date(now.getTime() + DAY_MS), state: 'active', lastReviewedAt: now };
  }
  if (card.stage >= 3) {
    return { stage: 3, dueAt: now, state: 'fixed', lastReviewedAt: now };
  }
  return {
    stage: card.stage + 1,
    dueAt: new Date(now.getTime() + INTERVALS_DAYS[card.stage] * DAY_MS),
    state: 'active',
    lastReviewedAt: now,
  };
}
