import { NextResponse } from "next/server";
import { submitRevisionAnswer } from "@/server/services/revision-submit-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const cardId = Number(body.cardId);
    const questionId = Number(body.questionId);
    const selectedIdx = Number(body.selectedIdx);

    if (
      !Number.isInteger(cardId) ||
      !Number.isInteger(questionId) ||
      !Number.isInteger(selectedIdx)
    ) {
      return NextResponse.json(
        { error: "Invalid submission" },
        { status: 400 },
      );
    }

    const result = await submitRevisionAnswer({
      cardId,
      questionId,
      selectedIdx,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to submit revision answer:", error);

    return NextResponse.json(
      { error: "Failed to submit revision answer" },
      { status: 500 },
    );
  }
}