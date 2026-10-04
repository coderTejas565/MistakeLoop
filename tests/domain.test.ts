import { describe, expect, it } from 'vitest';
import {
  applyResult,
  cardsFromMock,
  computeWeakness,
  evidenceFor,
  normalizedPriority,
  pickSession,
  scoreTest,
  subtopicProgress,
  type Card,
  type MockAttempt,
  type QuestionLite,
} from '../src/domain';
import mock from '../data/mock-1.json';

const NOW = new Date('2026-10-05T00:00:00Z');
const DAY = 86_400_000;

function q(id: number, subtopic: string, correctIdx = 0, keyStatus: QuestionLite['keyStatus'] = 'unverified'): QuestionLite {
  return { id, subject: 'maths', subtopic, correctIdx, keyStatus };
}
function att(questionId: number, testId: number, selectedIdx: number | null, confidence: MockAttempt['confidence'] = null): MockAttempt {
  return { questionId, testId, testOrder: testId, selectedIdx, confidence };
}
const qmap = (...qs: QuestionLite[]) => new Map(qs.map((x) => [x.id, x]));

describe('real Mock 1 data', () => {
  const questions = new Map<number, QuestionLite>();
  const attempts: MockAttempt[] = [];
  for (const m of mock.questions) {
    questions.set(m.n, { id: m.n, subject: m.subject, subtopic: m.subtopic, correctIdx: m.correctIdx!, keyStatus: m.keyStatus as QuestionLite['keyStatus'] });
    attempts.push({ questionId: m.n, testId: 1, testOrder: 0, selectedIdx: m.selectedIdx, confidence: m.confidence as MockAttempt['confidence'] });
  }
  it('scores the current Mock 1 correctly', () => {
    const s = scoreTest(attempts, questions);
    expect(s).toMatchObject({
    total: 30,
    attempted: 30,
    correct: 18,
    wrong: 12,
    skipped: 0,
    percent: 60,
    shakyCorrect: 1,
    disputed: 0,
  });
  });
  it('per-subject correct counts match the manual tally', () => {
    const by = (subj: string) => scoreTest(attempts.filter((a) => questions.get(a.questionId)!.subject === subj), questions).correct;
    expect([by('marathi'), by('maths'), by('reasoning'), by('gk')]).toEqual([3, 7, 4, 4]);
  });
});

describe('weakness engine', () => {
  it('one test never yields "repeated"', () => {
    const stats = computeWeakness([att(1, 1, 1), att(2, 1, 1)], qmap(q(1, 'pct'), q(2, 'pct')));
    expect(stats[0].label).toBe('weak');
    expect(evidenceFor(stats[0])).toContain('not yet a pattern');
  });
  it('same subtopic wrong in two tests is "repeated" with evidence', () => {
    const stats = computeWeakness(
      [att(1, 1, 1), att(2, 2, 1)],
      qmap(q(1, 'pct'), q(2, 'pct')),
    );
    expect(stats[0].label).toBe('repeated');
    expect(evidenceFor(stats[0])).toContain('Missed in 2 of 2 tests');
  });
  it('2/2 wrong ranks well above 2/20 wrong', () => {
    const qs = [q(1, 'a'), q(2, 'a')];
    const as_: MockAttempt[] = [att(1, 1, 1), att(2, 1, 1)];
    for (let i = 0; i < 20; i++) {
      qs.push(q(100 + i, 'b'));
      as_.push(att(100 + i, 1, i < 2 ? 1 : 0));
    }
    const stats = computeWeakness(as_, qmap(...qs));
    const a = stats.find((s) => s.subtopic === 'a')!;
    const b = stats.find((s) => s.subtopic === 'b')!;
    expect(a.err).toBeGreaterThan(b.err * 3);
    expect(a.priority).toBeGreaterThan(b.priority * 3);
  });
  it('correct-but-guessed counts as half a mistake', () => {
    const stats = computeWeakness([att(1, 1, 0, 'guessed'), att(2, 1, 0)], qmap(q(1, 'x'), q(2, 'x')));
    expect(stats[0].missValueSum).toBeCloseTo(0.5);
    expect(stats[0].label).toBe('watch');
  });
  it('disputed keys are excluded', () => {
    const stats = computeWeakness([att(1, 1, 1), att(2, 1, 1)], qmap(q(1, 'x', 0, 'disputed'), q(2, 'x', 0, 'disputed')));
    expect(stats).toHaveLength(0);
  });
});

describe('cards + selection', () => {
  it('creates wrong and shaky cards, skips disputed and skipped', () => {
    const cards = cardsFromMock(
      [att(1, 1, 1), att(2, 1, 0, 'guessed'), att(3, 1, null), att(4, 1, 1), att(5, 1, 0)],
      qmap(q(1, 'a'), q(2, 'a'), q(3, 'a'), q(4, 'a', 0, 'disputed'), q(5, 'a')),
      NOW,
    );
    expect(cards.map((c) => [c.questionId, c.kind])).toEqual([[1, 'wrong'], [2, 'shaky']]);
  });
  const mk = (id: number, subtopic: string, over: Partial<Card> = {}): Card => ({
    id, questionId: id, subtopic, kind: 'wrong', stage: 0, dueAt: NOW, state: 'active', lastReviewedAt: null, missedCount: 1, ...over,
  });
  it('23 cards over 8 subtopics -> 10 cards, max 3 per subtopic, no adjacent repeats', () => {
    const cards = Array.from({ length: 23 }, (_, i) => mk(i + 1, `s${i % 8}`));
    const picked = pickSession(cards, new Map(), NOW);
    expect(picked).toHaveLength(10);
    const counts = new Map<string, number>();
    picked.forEach((c) => counts.set(c.subtopic, (counts.get(c.subtopic) ?? 0) + 1));
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(3);
    for (let i = 1; i < picked.length; i++) expect(picked[i].subtopic).not.toBe(picked[i - 1].subtopic);
  });
  it('a due review outranks a fresh mistake; future reviews are not pulled forward', () => {
    const due = mk(1, 'a', { stage: 1, lastReviewedAt: new Date(NOW.getTime() - 4 * DAY), dueAt: new Date(NOW.getTime() - 3 * DAY) });
    const fresh = mk(2, 'b');
    const future = mk(3, 'c', { stage: 1, lastReviewedAt: NOW, dueAt: new Date(NOW.getTime() + DAY) });
    const picked = pickSession([fresh, future, due], new Map(), NOW, { n: 1 });
    expect(picked.map((c) => c.id)).toEqual([1]);
    expect(pickSession([future], new Map(), NOW)).toHaveLength(0);
  });
  it('weak subtopics get more slots, not forced equal subject mix', () => {
    const cards = [...Array.from({ length: 6 }, (_, i) => mk(i, 'hot')), ...Array.from({ length: 6 }, (_, i) => mk(10 + i, 'cold'))];
    const prio = normalizedPriority([
      { subject: 'm', subtopic: 'hot', priority: 5 } as never,
      { subject: 'm', subtopic: 'cold', priority: 0 } as never,
    ]);
    const picked = pickSession(cards, prio, NOW, { n: 4, cap: 3 });
    expect(picked.filter((c) => c.subtopic === 'hot').length).toBeGreaterThan(picked.filter((c) => c.subtopic === 'cold').length);
  });
});

describe('scheduler + progress', () => {
  it('correct advances stage and due; wrong resets to stage 0 due tomorrow', () => {
    const ok = applyResult({ stage: 0 }, true, NOW);
    expect(ok.stage).toBe(1);
    expect(ok.dueAt.getTime() - NOW.getTime()).toBe(1 * DAY);
    expect(applyResult({ stage: 1 }, true, NOW).dueAt.getTime() - NOW.getTime()).toBe(3 * DAY);
    expect(applyResult({ stage: 2 }, true, NOW).dueAt.getTime() - NOW.getTime()).toBe(7 * DAY);
    const bad = applyResult({ stage: 2 }, false, NOW);
    expect(bad.stage).toBe(0);
    expect(bad.dueAt.getTime() - NOW.getTime()).toBe(DAY);
  });
  it('stage 3 correct -> fixed', () => {
    expect(applyResult({ stage: 3 }, true, NOW).state).toBe('fixed');
  });
  it('progress states', () => {
    const c = (o: Partial<Pick<Card, 'stage' | 'state' | 'lastReviewedAt'>>) => ({ stage: 0, state: 'active' as const, lastReviewedAt: null, ...o });
    expect(subtopicProgress([])).toBeNull();
    expect(subtopicProgress([c({})])).toBe('weak');
    expect(subtopicProgress([c({ lastReviewedAt: NOW })])).toBe('practicing');
    expect(subtopicProgress([c({ stage: 1, lastReviewedAt: NOW }), c({})])).toBe('improving');
    expect(subtopicProgress([c({ state: 'fixed', stage: 3, lastReviewedAt: NOW })])).toBe('fixed');
  });
});
