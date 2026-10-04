import {
  type AnyPgColumn,
  integer,
  jsonb,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const tests = pgTable('tests', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  takenAt: timestamp('taken_at', { withTimezone: true }).notNull().defaultNow(),
  source: text('source').$type<'real' | 'simulated'>().notNull().default('real'),
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  options: jsonb('options').$type<string[]>().notNull(),
  correctIdx: smallint('correct_idx').notNull(),
  subject: text('subject').notNull(),
  subtopic: text('subtopic').notNull().default('unclassified'),
  concept: text('concept'),
  lang: text('lang').$type<'mr' | 'en' | 'mixed'>(),
  origin: text('origin').$type<'mock' | 'generated'>().notNull().default('mock'),
  parentId: integer('parent_id').references((): AnyPgColumn => questions.id),
  sourceLabel: text('source_label'),
  keyStatus: text('key_status').$type<'unverified' | 'verified' | 'disputed'>().notNull().default('unverified'),
  verification: text('verification').$type<'none' | 'code' | 'cross_model' | 'flagged'>().notNull().default('none'),
  aiMeta: jsonb('ai_meta'),
});

export const revisionSessions = pgTable('revision_sessions', {
  id: serial('id').primaryKey(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

export const attempts = pgTable('attempts', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').notNull().references(() => questions.id),
  testId: integer('test_id').references(() => tests.id),
  sessionId: integer('session_id').references(() => revisionSessions.id),
  context: text('context').$type<'mock' | 'similar'>().notNull(),
  selectedIdx: smallint('selected_idx'), // null = unattempted
  confidence: text('confidence').$type<'sure' | 'unsure' | 'guessed'>(),
  missReason: text('miss_reason'),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reviewCards = pgTable('review_cards', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').notNull().unique().references(() => questions.id),
  kind: text('kind').$type<'wrong' | 'shaky'>().notNull(),
  stage: smallint('stage').notNull().default(0),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull().defaultNow(),
  state: text('state').$type<'active' | 'fixed'>().notNull().default('active'),
  lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
  explanation: text('explanation'),
  explanationForIdx: smallint('explanation_for_idx'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
