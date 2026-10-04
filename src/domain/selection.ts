import type { Card } from './types';

const DAY_MS = 86_400_000;

export interface SelectionOptions {
  n?: number;
  cap?: number;
}

/**
 * Scheduled reviews that have come due (lastReviewedAt set) outrank fresh mistakes.
 * Cards not yet due are never pulled forward.
 */
export function cardScore(card: Card, normPriority: number, now: Date): number {
  const reviewed = card.lastReviewedAt !== null;
  const daysOverdue = Math.max(0, Math.floor((now.getTime() - card.dueAt.getTime()) / DAY_MS));
  let s = 0;
  if (reviewed) s += 10 + Math.min(daysOverdue, 5);
  else if (card.kind === 'wrong') s += 5;
  if (card.kind === 'shaky') s += 2.5;
  s += 3 * normPriority;
  if (card.missedCount >= 2) s += 4;
  return s;
}

function interleave(items: Card[]): Card[] {
  const rest = [...items];
  const out: Card[] = [];
  while (rest.length) {
    const prev = out[out.length - 1]?.subtopic;
    let i = rest.findIndex((c) => c.subtopic !== prev);
    if (i === -1) i = 0;
    out.push(rest.splice(i, 1)[0]);
  }
  return out;
}

export function pickSession(
  cards: Card[],
  normPriority: Map<string, number>,
  now: Date,
  opts: SelectionOptions = {},
): Card[] {
  const n = opts.n ?? 10;
  const cap = opts.cap ?? 3;
  const eligible = cards
    .filter((c) => c.state === 'active' && c.dueAt.getTime() <= now.getTime())
    .map((c) => ({ c, score: cardScore(c, normPriority.get(c.subtopic) ?? 0, now) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);

  const chosen: Card[] = [];
  const counts = new Map<string, number>();
  for (const limit of [cap, cap + 1]) {
    for (const c of eligible) {
      if (chosen.length >= n) break;
      if (chosen.includes(c)) continue;
      if ((counts.get(c.subtopic) ?? 0) >= limit) continue;
      chosen.push(c);
      counts.set(c.subtopic, (counts.get(c.subtopic) ?? 0) + 1);
    }
  }
  return interleave(chosen);
}
