import { getTestForAnalysis } from "../repositories/analysis-repository";
import { scoreTest } from "../../domain/scoring";
import { computeWeakness } from "../../domain/weakness";
import type { MockAttempt, QuestionLite } from "../../domain/types";

export async function analyzeTest(testId: number) {
  const result = await getTestForAnalysis(testId);

  const questions = new Map<number, QuestionLite>(
    result.attempts.map((row) => [
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

  const attempts: MockAttempt[] = result.attempts.map((row, index) => ({
    questionId: row.questionId,
    testId,
    testOrder: result.attempts.length - index,
    selectedIdx: row.selectedIdx,
    confidence: row.confidence,
  }));

  const score = scoreTest(attempts, questions);

  const weakness = computeWeakness(attempts, questions);

  return {
    test: result.test,
    score,
    weakness,
  };
}
