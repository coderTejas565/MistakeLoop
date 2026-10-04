import { db } from "../db/client";
import { attempts, questions, tests } from "../db/schema";
import { mock1 } from "../../data/mock-1";

export async function importMock1() {
  return db.transaction(async (tx) => {
    // 1. Create the test
    const [test] = await tx
      .insert(tests)
      .values({
        name: mock1.test.name,
        source: mock1.test.source,
      })
      .returning({ id: tests.id });

    // 2. Insert questions
    const insertedQuestions = await tx
      .insert(questions)
      .values(
        mock1.questions.map((question) => ({
          text: question.text,
          options: [...question.options],
          correctIdx: question.correctIdx,
          subject: question.subject,
          subtopic: question.subtopic,
          origin: "mock" as const,
          sourceLabel: question.sourceLabel,
          keyStatus: question.keyStatus,
        })),
      )
      .returning({
        id: questions.id,
      });

    // 3. Insert attempts
    await tx.insert(attempts).values(
      mock1.questions.map((question, index) => ({
        questionId: insertedQuestions[index].id,
        testId: test.id,
        context: "mock" as const,
        selectedIdx: question.selectedIdx,
        confidence: question.confidence,
      })),
    );

    return {
      testId: test.id,
      questionCount: insertedQuestions.length,
      attemptCount: mock1.questions.length,
    };
  });
}
