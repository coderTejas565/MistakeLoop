export type Confidence = 'sure' | 'unsure' | 'guessed' | null;
export type KeyStatus = 'unverified' | 'verified' | 'disputed';
export type AttemptStatus = 'correct' | 'wrong' | 'skipped';

export interface QuestionLite {
  id: number;
  subject: string;
  subtopic: string; // 'unclassified' until tagged
  correctIdx: number;
  keyStatus: KeyStatus;
}

export interface MockAttempt {
  questionId: number;
  testId: number;
  testOrder: number; // 0 = oldest test, increasing
  selectedIdx: number | null; // null = unattempted
  confidence: Confidence; // null = not flagged
}

export type CardKind = 'wrong' | 'shaky';

export interface Card {
  id: number;
  questionId: number;
  subtopic: string;
  kind: CardKind;
  stage: number; // 0..3
  dueAt: Date;
  state: 'active' | 'fixed';
  lastReviewedAt: Date | null;
  missedCount: number;
}
