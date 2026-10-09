import { GoogleGenAI } from "@google/genai";
import type {
  AIProvider,
  ExplainMistakeInput,
  SimilarQuestion,
} from "./ai-provider";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
});

const MODEL = "gemini-3.1-flash-lite";

async function generateWithRetry(
  contents: string,
  config: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  },
) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Gemini request attempt ${attempt}...`);

      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config,
      });

      console.log("Gemini response received.");

      return response;
    } catch (error) {
      console.error(`Gemini attempt ${attempt} failed:`, error);

      if (attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 1000),
      );
    }
  }

  throw new Error("Gemini request failed");
}

export class GeminiProvider implements AIProvider {
  async explainMistake(input: ExplainMistakeInput): Promise<string> {
    const response = await generateWithRetry(
      `
A police exam aspirant answered a multiple-choice question incorrectly.

Question:
${input.question}

Options:
${input.options.map((option, index) => `${index}. ${option}`).join("\n")}

Their answer:
${input.userAnswer}

Correct answer:
${input.correctAnswer}

Explain the mistake.

Rules:
- Maximum 3 sentences.
- Use simple language.
- Explain why their answer is wrong.
- Explain why the correct answer is correct.
- Focus only on the concept tested.
`,
      {
        temperature: 0.2,
        maxOutputTokens: 150,
      },
    );

    const text = response.text?.trim();

    if (!text) {
      throw new Error("Gemini returned an empty explanation");
    }

    return text;
  }

  async generateSimilarQuestion(
    input: ExplainMistakeInput,
  ): Promise<SimilarQuestion> {
    const response = await generateWithRetry(
      `
Create ONE new multiple-choice question for a police exam aspirant.

Original question:
${input.question}

Original options:
${input.options.map((option, index) => `${index}. ${option}`).join("\n")}

Correct answer:
${input.correctAnswer}

Create a NEW question testing the same underlying concept.

Do not copy the original question.

Return ONLY valid JSON:

{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctIdx": 0,
  "explanation": "string"
}

Rules:
- Exactly 4 options.
- Only one option is correct.
- correctIdx must be 0, 1, 2, or 3.
- Keep the question concise.
- Keep the explanation concise.
`,
      {
        temperature: 0.4,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
      },
    );

    const text = response.text?.trim();

    if (!text) {
      throw new Error("Gemini returned an empty question");
    }

    const parsed = JSON.parse(text) as SimilarQuestion;

    if (
      typeof parsed.question !== "string" ||
      !Array.isArray(parsed.options) ||
      parsed.options.length !== 4 ||
      !Number.isInteger(parsed.correctIdx) ||
      parsed.correctIdx < 0 ||
      parsed.correctIdx > 3 ||
      typeof parsed.explanation !== "string"
    ) {
      throw new Error("Gemini returned invalid question data");
    }

    return parsed;
  }
}
