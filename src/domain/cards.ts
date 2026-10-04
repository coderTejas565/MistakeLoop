import { attemptStatus } from "./scoring";
import type { CardKind, MockAttempt, QuestionLite } from "./types";

export interface NewCard {
  questionId: number;
  subtopic: string;
  kind: CardKind;
  missedCount: number;
  dueAt: Date;
}

/**
 * One card per question. Latest mock attempt decides the kind:
 * wrong -> 'wrong'; correct but guessed/unsure -> 'shaky'; otherwise no card.
 * Disputed keys, unclassified questions and skipped answers never create cards.
 */
export function cardsFromMock(
  attempts: MockAttempt[],
  questions: Map<number, QuestionLite>,
  now: Date,
): NewCard[] {
  const byQuestion = new Map<number, MockAttempt[]>();
  for (const a of attempts) {
    const list = byQuestion.get(a.questionId) ?? [];
    list.push(a);
    byQuestion.set(a.questionId, list);
  }
  const out: NewCard[] = [];
  for (const [questionId, list] of byQuestion) {
    const q = questions.get(questionId);
    if (!q || q.keyStatus === "disputed" || q.subtopic === "unclassified")
      continue;
    list.sort((a, b) => a.testOrder - b.testOrder);
    const missedCount = list.filter(
      (a) => attemptStatus(a.selectedIdx, q.correctIdx) === "wrong",
    ).length;
    const last = list[list.length - 1];
    const status = attemptStatus(last.selectedIdx, q.correctIdx);
    let kind: CardKind | null = null;
    if (status === "wrong") kind = "wrong";
    else if (
      status === "correct" &&
      (last.confidence === "guessed" || last.confidence === "unsure")
    )
      kind = "shaky";
    if (kind)
      out.push({
        questionId,
        subtopic: q.subtopic,
        kind,
        missedCount,
        dueAt: now,
      });
  }
  return out;
}
