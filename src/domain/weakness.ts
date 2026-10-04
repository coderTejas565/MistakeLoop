import { attemptStatus } from './scoring';
import type { AttemptStatus, Confidence, MockAttempt, QuestionLite } from './types';

export const LAMBDA = 0.7; // each test back counts 70% as much
export const ALPHA = 2; // prior strength: pseudo-attempts at the global error rate
export const FALLBACK_ERROR_RATE = 0.4;

export type WeaknessLabel = 'repeated' | 'weak' | 'watch' | 'thin' | 'solid';

export interface SubtopicStat {
  subject: string;
  subtopic: string;
  attempts: number;
  wrong: number;
  shakyCorrect: number;
  testsSeen: number;
  testsMissed: number;
  missValueSum: number;
  err: number; // smoothed, recency-weighted error rate
  label: WeaknessLabel;
  priority: number;
}

export function missValue(status: AttemptStatus, confidence: Confidence): number {
  if (status === 'wrong') return 1;
  if (status === 'correct' && confidence === 'guessed') return 0.5;
  if (status === 'correct' && confidence === 'unsure') return 0.3;
  return 0;
}

export function computeWeakness(
  attempts: MockAttempt[],
  questions: Map<number, QuestionLite>,
): SubtopicStat[] {
  const latest = attempts.reduce((m, a) => Math.max(m, a.testOrder), 0);

  const usable: { a: MockAttempt; q: QuestionLite; status: AttemptStatus; w: number }[] = [];
  for (const a of attempts) {
    const q = questions.get(a.questionId);
    if (!q || q.keyStatus === 'disputed' || q.subtopic === 'unclassified') continue;
    const status = attemptStatus(a.selectedIdx, q.correctIdx);
    if (status === 'skipped') continue;
    usable.push({ a, q, status, w: LAMBDA ** (latest - a.testOrder) });
  }

  let A = 0, W = 0;
  for (const u of usable) {
    A += u.w;
    if (u.status === 'wrong') W += u.w;
  }
  const globalRate = A > 0 ? W / A : FALLBACK_ERROR_RATE;

  const groups = new Map<string, typeof usable>();
  for (const u of usable) {
    const list = groups.get(u.q.subtopic) ?? [];
    list.push(u);
    groups.set(u.q.subtopic, list);
  }

  const stats: SubtopicStat[] = [];
  for (const [subtopic, items] of groups) {
    let Aw = 0, Ww = 0, V = 0, wrong = 0, shaky = 0;
    const seen = new Set<number>();
    const missed = new Set<number>();
    for (const u of items) {
      Aw += u.w;
      V += u.w * missValue(u.status, u.a.confidence);
      seen.add(u.a.testId);
      if (u.status === 'wrong') {
        Ww += u.w;
        wrong++;
        missed.add(u.a.testId);
      } else if (u.a.confidence === 'guessed' || u.a.confidence === 'unsure') {
        shaky++;
      }
    }
    const err = (Ww + ALPHA * globalRate) / (Aw + ALPHA);
    const n = items.length;
    const label: WeaknessLabel =
      n < 2 ? 'thin' : missed.size >= 2 ? 'repeated' : err >= 0.5 ? 'weak' : V > 0 ? 'watch' : 'solid';
    stats.push({
      subject: items[0].q.subject,
      subtopic,
      attempts: n,
      wrong,
      shakyCorrect: shaky,
      testsSeen: seen.size,
      testsMissed: missed.size,
      missValueSum: V,
      err,
      label,
      priority: V * err * (label === 'repeated' ? 1.5 : 1),
    });
  }
  return stats.sort((x, y) => y.priority - x.priority);
}

/** priority scaled to 0..1 across subtopics, for card selection */
export function normalizedPriority(stats: SubtopicStat[]): Map<string, number> {
  const max = stats.reduce((m, s) => Math.max(m, s.priority), 0);
  return new Map(stats.map((s) => [s.subtopic, max > 0 ? s.priority / max : 0]));
}
