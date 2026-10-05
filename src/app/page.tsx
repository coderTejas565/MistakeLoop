"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type RevisionCard = {
  cardId: number;
  questionId: number;
  text: string;
  options: string[];
  subject: string;
  subtopic: string;
  kind: "wrong" | "shaky";
  stage: number;
  missedCount: number;
};

type AnswerState = {
  selectedIdx: number | null;
  submitted: boolean;
};

type SubmissionResult = {
  correct: boolean;
  correctIdx: number;
};

export default function Home() {
  const [cards, setCards] = useState<RevisionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answer, setAnswer] = useState<AnswerState>({
    selectedIdx: null,
    submitted: false,
  });

  const [result, setResult] = useState<SubmissionResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRevision() {
      try {
        const response = await fetch("/api/revision/today");

        if (!response.ok) {
          throw new Error("Failed to load today's revision");
        }

        const data = await response.json();

        setCards(data.cards);
      } catch (error) {
        console.error(error);
        setError("Could not load today's revision.");
      } finally {
        setLoading(false);
      }
    }

    loadRevision();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Loading today's revision...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (cards.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No revision due today</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground">
              You are caught up. Come back when new mistakes are ready for
              revision.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const currentCard = cards[currentIndex];

  async function submitAnswer() {
    if (answer.selectedIdx === null || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/revision/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardId: currentCard.cardId,
          questionId: currentCard.questionId,
          selectedIdx: answer.selectedIdx,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      const data: SubmissionResult = await response.json();

      setResult({
        correct: data.correct,
        correctIdx: data.correctIdx,
      });

      setAnswer((previous) => ({
        ...previous,
        submitted: true,
      }));
    } catch (error) {
      console.error(error);
      setError("Could not submit your answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    if (currentIndex >= cards.length - 1) {
      return;
    }

    setCurrentIndex((previous) => previous + 1);

    setAnswer({
      selectedIdx: null,
      submitted: false,
    });

    setResult(null);
    setError(null);
  }

  const progress =
    ((currentIndex + (answer.submitted ? 1 : 0)) / cards.length) * 100;

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                MistakeLoop
              </h1>

              <p className="text-sm text-muted-foreground">
                Today&apos;s Revision
              </p>
            </div>

            <Badge variant="secondary">
              {currentIndex + 1} / {cards.length}
            </Badge>
          </div>

          <Progress value={progress} />
        </header>

        {/* Question */}
        <Card className="flex-1">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{currentCard.subject}</Badge>

              <Badge variant="secondary">
                {currentCard.subtopic.replaceAll("_", " ")}
              </Badge>

              {currentCard.kind === "wrong" && (
                <Badge variant="destructive">Previous mistake</Badge>
              )}
            </div>

            <CardTitle className="text-xl leading-relaxed sm:text-2xl">
              {currentCard.text}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Options */}
            <RadioGroup
              value={
                answer.selectedIdx === null
                  ? undefined
                  : String(answer.selectedIdx)
              }
              onValueChange={(value: string) => {
                if (answer.submitted) {
                  return;
                }

                setAnswer({
                  selectedIdx: Number(value),
                  submitted: false,
                });
              }}
              className="space-y-3"
            >
              {currentCard.options.map((option, index) => {
                const selected = answer.selectedIdx === index;

                const correct =
                  answer.submitted &&
                  result !== null &&
                  index === result.correctIdx;

                const wrong =
                  answer.submitted &&
                  result !== null &&
                  selected &&
                  index !== result.correctIdx;

                return (
                  <label
                    key={index}
                    className={`flex items-center gap-3 rounded-lg border p-4 transition ${
                      correct
                        ? "border-green-500 bg-green-50"
                        : wrong
                          ? "border-destructive bg-destructive/5"
                          : selected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                    } ${
                      answer.submitted ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <RadioGroupItem
                      value={String(index)}
                      disabled={answer.submitted}
                    />

                    <span className="flex-1 text-sm leading-relaxed sm:text-base">
                      {option}
                    </span>

                    {correct && (
                      <span className="text-sm font-medium text-green-700">
                        Correct
                      </span>
                    )}

                    {wrong && (
                      <span className="text-sm font-medium text-destructive">
                        Wrong
                      </span>
                    )}
                  </label>
                );
              })}
            </RadioGroup>

            {/* Result */}
            {answer.submitted && result && (
              <div
                className={`rounded-lg border p-4 ${
                  result.correct
                    ? "border-green-500 bg-green-50"
                    : "border-destructive bg-destructive/5"
                }`}
              >
                <p className="font-semibold">
                  {result.correct ? "Correct!" : "Incorrect"}
                </p>

                {!result.correct && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Correct answer:{" "}
                    <span className="font-medium text-foreground">
                      {currentCard.options[result.correctIdx]}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Action */}
            <div className="flex justify-end">
              {!answer.submitted ? (
                <Button
                  size="lg"
                  disabled={answer.selectedIdx === null || submitting}
                  onClick={submitAnswer}
                >
                  {submitting ? "Submitting..." : "Submit Answer"}
                </Button>
              ) : currentIndex < cards.length - 1 ? (
                <Button size="lg" onClick={nextQuestion}>
                  Next Question
                </Button>
              ) : (
                <Button size="lg" disabled>
                  Revision Complete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Focus on your mistakes. Not more material.
        </p>
      </div>
    </main>
  );
}
