import "dotenv/config";
import { GeminiProvider } from "../src/server/ai/gemini-provider.ts";

const provider = new GeminiProvider();

const input = {
  question: "What is 25% of 200?",
  options: ["25", "40", "50", "75"],
  correctAnswer: "50",
  userAnswer: "40",
};

console.log("Testing mistake explanation...\n");

const explanation = await provider.explainMistake(input);

console.log("Explanation:");
console.log(explanation);

console.log("\n-----------------------------\n");

console.log("Testing similar question...\n");

const similar = await provider.generateSimilarQuestion(input);

console.log("Similar question:");
console.log(similar.question);

console.log("\nOptions:");

similar.options.forEach((option, index) => {
  console.log(`${index}: ${option}`);
});

console.log("\nCorrect index:", similar.correctIdx);
console.log("Explanation:", similar.explanation);