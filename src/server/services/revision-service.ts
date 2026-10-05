import { getDueReviewCards } from "../repositories/review-card-repository";
import { getTestForAnalysis } from "../repositories/analysis-repository";
import {
  computeWeakness,
  normalizedPriority,
} from "../../domain/weakness";
import { pickSession } from "../../domain/selection";
import type {
  Card,
  MockAttempt,
  QuestionLite,
} from "../../domain/types";

export async function getTodaysRevision(
  testId: number,
  now = new Date(),
) {
  const [rows, analysis] = await Promise.all([
    getDueReviewCards(now),
    getTestForAnalysis(testId),
  ]);

  // Convert DB rows into domain Cards.
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

  // Build question lookup for the weakness engine.
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

  // Convert DB attempts into domain attempts.
  const attempts: MockAttempt[] = analysis.attempts.map(
    (row, index) => ({
      questionId: row.questionId,
      testId,
      testOrder: analysis.attempts.length - index,
      selectedIdx: row.selectedIdx,
      confidence: row.confidence,
    }),
  );

  // Calculate weakness priorities.
  const weakness = computeWeakness(attempts, questions);
  const normPriority = normalizedPriority(weakness);

  // Select the cards for today's revision.
  const selected = pickSession(cards, normPriority, now);

  // Keep the full question data for the selected cards.
  const selectedIds = new Set(
    selected.map((card) => card.id),
  );

  return rows
    .filter((row) => selectedIds.has(row.id))
    .map((row) => ({
      cardId: row.id,
      questionId: row.questionId,
      text: row.text,
      options: row.options,
      subject: row.subject,
      subtopic: row.subtopic,
      kind: row.kind,
      stage: row.stage,
      missedCount: Number(row.missedCount),
    }));
}