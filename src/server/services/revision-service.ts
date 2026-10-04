import { getDueReviewCards } from "../repositories/review-card-repository";
import { getTestForAnalysis } from "../repositories/analysis-repository";
import { computeWeakness, normalizedPriority } from "../../domain/weakness";
import { pickSession } from "../../domain/selection";
import type { Card, MockAttempt, QuestionLite } from "../../domain/types";

export async function getTodaysRevision(testId: number, now = new Date()) {
  const [rows, analysis] = await Promise.all([
    getDueReviewCards(now),
    getTestForAnalysis(testId),
  ]);

  const cards: Card[] = rows.map((row) => ({
    id: row.id,
    questionId: row.questionId,
    subtopic: row.subtopic,
    kind: row.kind,
    stage: row.stage,
    dueAt: row.dueAt,
    state: row.state,
    lastReviewedAt: row.lastReviewedAt,
    missedCount: Number(row.missedCount),
  }));

  const questions = new Map<number, QuestionLite>(
    analysis.attempts.map((row) => [
      row.questionId,
      {
        id: row.questionId,
        subject: row.subject,
        subtopic: row.subtopic,
        correctIdx: row.correctIdx,
        keyStatus: row.keyStatus,
      },
    ]),
  );

  const attempts: MockAttempt[] = analysis.attempts.map((row, index) => ({
    questionId: row.questionId,
    testId,
    testOrder: analysis.attempts.length - index,
    selectedIdx: row.selectedIdx,
    confidence: row.confidence,
  }));

  const weakness = computeWeakness(attempts, questions);
  const normPriority = normalizedPriority(weakness);

  return pickSession(cards, normPriority, now);
}
