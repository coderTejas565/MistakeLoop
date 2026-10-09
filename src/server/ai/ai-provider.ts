export interface ExplainMistakeInput {
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
}

export interface SimilarQuestion {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

export interface AIProvider {
  explainMistake(input: ExplainMistakeInput): Promise<string>;

  generateSimilarQuestion(input: ExplainMistakeInput): Promise<SimilarQuestion>;
}
