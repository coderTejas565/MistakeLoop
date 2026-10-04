import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { attempts, questions, reviewCards } from "../db/schema";
import { cardsFromMock } from "../../domain/cards";
import type { MockAttempt, QuestionLite } from "../../domain/types";

export async function createReviewCardsForTest(
  testId: number,
  now = new Date(),
) {
  const rows = await db
    .select({
      questionId: questions.id,
      subject: questions.subject,
      subtopic: questions.subtopic,
      correctIdx: questions.correctIdx,
      keyStatus: questions.keyStatus,
      selectedIdx: attempts.selectedIdx,
      confidence: attempts.confidence,
    })
    .from(attempts)
    .innerJoin(questions, eq(attempts.questionId, questions.id))
    .where(eq(attempts.testId, testId));

  const questionsMap = new Map<number, QuestionLite>(
    rows.map((row) => [
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

  const mockAttempts: MockAttempt[] = rows.map((row, index) => ({
    questionId: row.questionId,
    testId,
    testOrder: rows.length - index,
    selectedIdx: row.selectedIdx,
    confidence: row.confidence,
  }));

  const cards = cardsFromMock(mockAttempts, questionsMap, now);

  if (cards.length === 0) {
    return [];
  }

  await db
    .insert(reviewCards)
    .values(
      cards.map((card) => ({
        questionId: card.questionId,
        kind: card.kind,
        stage: 0,
        dueAt: card.dueAt,
        state: "active" as const,
      })),
    )
    .onConflictDoNothing({
      target: reviewCards.questionId,
    });

  return cards;
}