import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { attempts, questions, reviewCards } from "../db/schema";
import { attemptStatus } from "../../domain/scoring";

interface SubmitRevisionInput {
  cardId: number;
  questionId: number;
  selectedIdx: number;
}

const DAY_MS = 86_400_000;

function getNextSchedule(
  currentStage: number,
  correct: boolean,
  now: Date,
) {
  if (!correct) {
    return {
      stage: 0,
      dueAt: new Date(now.getTime() + DAY_MS),
      state: "active" as const,
    };
  }

  if (currentStage === 0) {
    return {
      stage: 1,
      dueAt: new Date(now.getTime() + 3 * DAY_MS),
      state: "active" as const,
    };
  }

  if (currentStage === 1) {
    return {
      stage: 2,
      dueAt: new Date(now.getTime() + 7 * DAY_MS),
      state: "active" as const,
    };
  }

  if (currentStage === 2) {
    return {
      stage: 3,
      dueAt: new Date(now.getTime() + 14 * DAY_MS),
      state: "active" as const,
    };
  }

  return {
    stage: 3,
    dueAt: now,
    state: "fixed" as const,
  };
}

export async function submitRevisionAnswer(
  input: SubmitRevisionInput,
) {
  const now = new Date();

  return db.transaction(async (tx) => {
    const [question] = await tx
      .select({
        id: questions.id,
        correctIdx: questions.correctIdx,
      })
      .from(questions)
      .where(eq(questions.id, input.questionId))
      .limit(1);

    if (!question) {
      throw new Error("Question not found");
    }

    const [card] = await tx
      .select({
        id: reviewCards.id,
        questionId: reviewCards.questionId,
        stage: reviewCards.stage,
        state: reviewCards.state,
      })
      .from(reviewCards)
      .where(eq(reviewCards.id, input.cardId))
      .limit(1);

    if (!card) {
      throw new Error("Review card not found");
    }

    if (card.questionId !== question.id) {
      throw new Error("Card does not belong to question");
    }

    if (card.state === "fixed") {
      throw new Error("Review card is already fixed");
    }

    const status = attemptStatus(
      input.selectedIdx,
      question.correctIdx,
    );

    if (status === "skipped") {
      throw new Error("An answer must be selected");
    }

    const correct = status === "correct";

    await tx.insert(attempts).values({
      questionId: question.id,
      context: "similar",
      selectedIdx: input.selectedIdx,
    });

    const schedule = getNextSchedule(
      card.stage,
      correct,
      now,
    );

    await tx
      .update(reviewCards)
      .set({
        stage: schedule.stage,
        dueAt: schedule.dueAt,
        state: schedule.state,
        lastReviewedAt: now,
      })
      .where(eq(reviewCards.id, card.id));

    return {
      cardId: card.id,
      questionId: question.id,
      selectedIdx: input.selectedIdx,
      correctIdx: question.correctIdx,
      correct,
      stage: schedule.stage,
      dueAt: schedule.dueAt,
      state: schedule.state,
    };
  });
}