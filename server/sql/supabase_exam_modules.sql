-- =========================================================
-- ExamHub: Exams / Question Bank / Submissions schema (Supabase)
-- Safe to run multiple times (idempotent for create-if-not-exists parts)
-- Depends on existing public.users and public.set_updated_at()
-- =========================================================

create extension if not exists pgcrypto;

-- 1) Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM ('single', 'judge', 'essay', 'short');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_status') THEN
    CREATE TYPE exam_status AS ENUM ('draft', 'published', 'closed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE submission_status AS ENUM ('in_progress', 'submitted', 'reviewed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'answer_review_status') THEN
    CREATE TYPE answer_review_status AS ENUM ('auto_graded', 'pending_review', 'reviewed');
  END IF;
END
$$;

-- 2) Question bank
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type question_type NOT NULL,
  stem text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text,
  analysis text,
  score integer NOT NULL DEFAULT 1 CHECK (score > 0),
  category text NOT NULL DEFAULT '未分类',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_questions_correct_answer_required
    CHECK (
      (type IN ('essay', 'short'))
      OR correct_answer IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions(is_active);

DROP TRIGGER IF EXISTS trg_questions_updated_at ON public.questions;
CREATE TRIGGER trg_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3) Exams
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  status exam_status NOT NULL DEFAULT 'draft',
  start_time timestamptz,
  end_time timestamptz,
  total_score integer NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  question_count integer NOT NULL DEFAULT 0 CHECK (question_count >= 0),
  published_at timestamptz,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_exams_time_range CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_start_time ON public.exams(start_time);
CREATE INDEX IF NOT EXISTS idx_exams_end_time ON public.exams(end_time);

DROP TRIGGER IF EXISTS trg_exams_updated_at ON public.exams;
CREATE TRIGGER trg_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4) Exam-question mapping (ordered)
CREATE TABLE IF NOT EXISTS public.exam_questions (
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 1,
  score integer NOT NULL DEFAULT 1 CHECK (score > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (exam_id, question_id),
  UNIQUE (exam_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON public.exam_questions(question_id);

-- Keep exams.question_count / exams.total_score synced with exam_questions
CREATE OR REPLACE FUNCTION public.refresh_exam_stats(p_exam_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.exams e
     SET question_count = COALESCE((SELECT COUNT(*) FROM public.exam_questions eq WHERE eq.exam_id = p_exam_id), 0),
         total_score = COALESCE((SELECT SUM(eq.score) FROM public.exam_questions eq WHERE eq.exam_id = p_exam_id), 0),
         updated_at = now()
   WHERE e.id = p_exam_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_exam_questions_refresh_exam_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_exam_stats(OLD.exam_id);
  ELSE
    PERFORM public.refresh_exam_stats(NEW.exam_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_exam_questions_refresh_exam_stats ON public.exam_questions;
CREATE TRIGGER trg_exam_questions_refresh_exam_stats
AFTER INSERT OR UPDATE OR DELETE ON public.exam_questions
FOR EACH ROW
EXECUTE FUNCTION public.trg_exam_questions_refresh_exam_stats();

-- 5) Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status submission_status NOT NULL DEFAULT 'in_progress',
  objective_score numeric(8,2) NOT NULL DEFAULT 0,
  manual_score numeric(8,2) NOT NULL DEFAULT 0,
  total_score numeric(8,2) NOT NULL DEFAULT 0,
  max_score numeric(8,2) NOT NULL DEFAULT 0,
  needs_manual_review boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  time_spent_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id),
  CONSTRAINT ck_submissions_scores_non_negative CHECK (
    objective_score >= 0 AND manual_score >= 0 AND total_score >= 0 AND max_score >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_submissions_exam ON public.submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions(submitted_at DESC);

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON public.submissions;
CREATE TRIGGER trg_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 6) Submission answers (per question)
CREATE TABLE IF NOT EXISTS public.submission_answers (
  id bigserial PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  answer_text text,
  is_correct boolean,
  auto_score numeric(8,2) NOT NULL DEFAULT 0,
  manual_score numeric(8,2) NOT NULL DEFAULT 0,
  final_score numeric(8,2) GENERATED ALWAYS AS (COALESCE(auto_score, 0) + COALESCE(manual_score, 0)) STORED,
  review_status answer_review_status NOT NULL DEFAULT 'auto_graded',
  review_comment text,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, question_id),
  CONSTRAINT ck_submission_answers_scores_non_negative CHECK (auto_score >= 0 AND manual_score >= 0)
);

CREATE INDEX IF NOT EXISTS idx_submission_answers_submission ON public.submission_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_answers_question ON public.submission_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_submission_answers_review_status ON public.submission_answers(review_status);

DROP TRIGGER IF EXISTS trg_submission_answers_updated_at ON public.submission_answers;
CREATE TRIGGER trg_submission_answers_updated_at
BEFORE UPDATE ON public.submission_answers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Keep submissions scores and manual-review flag synced with submission_answers
CREATE OR REPLACE FUNCTION public.refresh_submission_scores(p_submission_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.submissions s
     SET objective_score = COALESCE((SELECT SUM(sa.auto_score) FROM public.submission_answers sa WHERE sa.submission_id = p_submission_id), 0),
         manual_score = COALESCE((SELECT SUM(sa.manual_score) FROM public.submission_answers sa WHERE sa.submission_id = p_submission_id), 0),
         total_score = COALESCE((SELECT SUM(sa.final_score) FROM public.submission_answers sa WHERE sa.submission_id = p_submission_id), 0),
         needs_manual_review = EXISTS (
           SELECT 1
             FROM public.submission_answers sa
            WHERE sa.submission_id = p_submission_id
              AND sa.review_status = 'pending_review'
         ),
         updated_at = now()
   WHERE s.id = p_submission_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_submission_answers_refresh_submission()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_submission_scores(OLD.submission_id);
  ELSE
    PERFORM public.refresh_submission_scores(NEW.submission_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_submission_answers_refresh_submission ON public.submission_answers;
CREATE TRIGGER trg_submission_answers_refresh_submission
AFTER INSERT OR UPDATE OR DELETE ON public.submission_answers
FOR EACH ROW
EXECUTE FUNCTION public.trg_submission_answers_refresh_submission();

-- 7) Helper view for admin submission list
CREATE OR REPLACE VIEW public.v_admin_submissions AS
SELECT
  s.id,
  s.exam_id,
  e.title AS exam_title,
  s.student_id,
  u.full_name AS student_name,
  s.status,
  s.total_score,
  s.max_score,
  s.needs_manual_review,
  s.started_at,
  s.submitted_at,
  s.reviewed_at,
  s.created_at,
  s.updated_at
FROM public.submissions s
JOIN public.exams e ON e.id = s.exam_id
JOIN public.users u ON u.id = s.student_id;
