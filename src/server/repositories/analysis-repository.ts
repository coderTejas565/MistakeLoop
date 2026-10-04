import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { attempts, questions, tests } from "../db/schema";

export async function getTestForAnalysis(testId: number) {
  const test = await db
    .select({
      id: tests.id,
      name: tests.name,
      takenAt: tests.takenAt,
    })
    .from(tests)
    .where(eq(tests.id, testId))
    .limit(1);

  if (test.length === 0) {
    throw new Error(`Test ${testId} not found`);
  }

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
    .where(eq(attempts.testId, testId))
    .orderBy(desc(attempts.id));

  return {
    test: test[0],
    attempts: rows,
  };
}