import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "../db/client";
import { attempts, questions, reviewCards } from "../db/schema";

export async function getDueReviewCards(now: Date) {
  return db
    .select({
      id: reviewCards.id,
      questionId: reviewCards.questionId,
      subtopic: questions.subtopic,
      kind: reviewCards.kind,
      stage: reviewCards.stage,
      dueAt: reviewCards.dueAt,
      state: reviewCards.state,
      lastReviewedAt: reviewCards.lastReviewedAt,
      missedCount: sql<number>`
        count(*) filter (
          where ${attempts.selectedIdx} is not null
          and ${attempts.selectedIdx} <> ${questions.correctIdx}
        )
      `,
    })
    .from(reviewCards)
    .innerJoin(questions, eq(reviewCards.questionId, questions.id))
    .leftJoin(attempts, eq(attempts.questionId, questions.id))
    .where(
      and(
        eq(reviewCards.state, "active"),
        lte(reviewCards.dueAt, now),
      ),
    )
    .groupBy(
      reviewCards.id,
      reviewCards.questionId,
      questions.subtopic,
      reviewCards.kind,
      reviewCards.stage,
      reviewCards.dueAt,
      reviewCards.state,
      reviewCards.lastReviewedAt,
    );
}