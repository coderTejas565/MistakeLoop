import { createReviewCardsForTest } from "../services/review-card-service";

async function main() {
  const cards = await createReviewCardsForTest(1);

  console.log("Review cards:", cards.length);

  console.table(
    cards.map((card) => ({
      questionId: card.questionId,
      subtopic: card.subtopic,
      kind: card.kind,
      missedCount: card.missedCount,
      dueAt: card.dueAt,
    })),
  );
}

main().catch((error) => {
  console.error("Review card generation failed:", error);
  process.exit(1);
});