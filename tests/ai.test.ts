import "dotenv/config";

import { describe, expect, it } from "vitest";
import { GeminiProvider } from "../src/server/ai/gemini-provider";

describe("GeminiProvider", () => {
  it("generates a mistake explanation", async () => {
    const provider = new GeminiProvider();

    console.log("Starting explanation request...");

    const result = await provider.explainMistake({
      question: "What is 25% of 200?",
      options: ["25", "40", "50", "75"],
      correctAnswer: "50",
      userAnswer: "40",
    });

    console.log("Explanation received:", result);

    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  }, 30000);

  it("generates a valid similar question", async () => {
    const provider = new GeminiProvider();

    const result = await provider.generateSimilarQuestion({
      question: "What is 25% of 200?",
      options: ["25", "40", "50", "75"],
      correctAnswer: "50",
      userAnswer: "40",
    });

    console.log("\nGemini similar question:\n", result);

    expect(result.question).toBeTruthy();
    expect(result.options).toHaveLength(4);
    expect(result.correctIdx).toBeGreaterThanOrEqual(0);
    expect(result.correctIdx).toBeLessThanOrEqual(3);
    expect(result.explanation).toBeTruthy();
  }, 10000);
});
