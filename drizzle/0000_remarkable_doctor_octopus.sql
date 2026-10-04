CREATE TABLE "attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"test_id" integer,
	"session_id" integer,
	"context" text NOT NULL,
	"selected_idx" smallint,
	"confidence" text,
	"miss_reason" text,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_idx" smallint NOT NULL,
	"subject" text NOT NULL,
	"subtopic" text DEFAULT 'unclassified' NOT NULL,
	"concept" text,
	"lang" text,
	"origin" text DEFAULT 'mock' NOT NULL,
	"parent_id" integer,
	"source_label" text,
	"key_status" text DEFAULT 'unverified' NOT NULL,
	"verification" text DEFAULT 'none' NOT NULL,
	"ai_meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "review_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"kind" text NOT NULL,
	"stage" smallint DEFAULT 0 NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"explanation" text,
	"explanation_for_idx" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_cards_question_id_unique" UNIQUE("question_id")
);
--> statement-breakpoint
CREATE TABLE "revision_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'real' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_session_id_revision_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."revision_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_parent_id_questions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;