import type { AttemptStatus, MockAttempt, QuestionLite } from "./types";

export function attemptStatus(
  selectedIdx: number | null,
  correctIdx: number,
): AttemptStatus {
  if (selectedIdx === null) return "skipped";
  return selectedIdx === correctIdx ? "correct" : "wrong";
}

export interface TestScore {
  total: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  percent: number;
  /** correct answers that were flagged guessed or unsure */
  shakyCorrect: number;
  /** attempts whose answer key is disputed (still scored, flagged in UI) */
  disputed: number;
}

export function scoreTest(
  attempts: MockAttempt[],
  questions: Map<number, QuestionLite>,
): TestScore {
  let correct = 0,
    wrong = 0,
    skipped = 0,
    shakyCorrect = 0,
    disputed = 0;
  for (const a of attempts) {
    const q = questions.get(a.questionId);
    if (!q) continue;
    if (q.keyStatus === "disputed") disputed++;
    const s = attemptStatus(a.selectedIdx, q.correctIdx);
    if (s === "correct") {
      correct++;
      if (a.confidence === "guessed" || a.confidence === "unsure")
        shakyCorrect++;
    } else if (s === "wrong") wrong++;
    else skipped++;
  }
  const total = attempts.length;
  return {
    total,
    attempted: correct + wrong,
    correct,
    wrong,
    skipped,
    percent: total === 0 ? 0 : Math.round((correct / total) * 100),
    shakyCorrect,
    disputed,
  };
}
