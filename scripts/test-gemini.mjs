import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing");
}

const ai = new GoogleGenAI({ apiKey });

console.log("Testing Gemini...");

const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-lite",
  contents:
    "Explain in one simple sentence why a student should revise mistakes instead of only solving new questions in 10 words.",
  config: {
    temperature: 0.2,
    maxOutputTokens: 100,
  },
});

console.log("\nGemini response:\n");
console.log(response.text);