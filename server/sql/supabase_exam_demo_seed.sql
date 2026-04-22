-- =========================================================
-- ExamHub: Demo seed data for exams/questions/submissions
-- Usage:
--   1) Run server/sql/supabase_init.sql
--   2) Run server/sql/supabase_exam_modules.sql
--   3) Run this file
-- Safe to run multiple times (idempotent)
-- =========================================================

DO $$
DECLARE
  v_admin_id uuid;
  v_student_1 uuid;
  v_student_2 uuid;

  q1 uuid; q2 uuid; q3 uuid; q4 uuid; q5 uuid; q6 uuid;
  e1 uuid; e2 uuid; e3 uuid;

  s1 uuid; -- reviewed
  s2 uuid; -- submitted (pending manual review)
  s3 uuid; -- in progress
BEGIN
  -- 0) pick operator admin
  SELECT id INTO v_admin_id
  FROM public.users
  WHERE role = 'admin'
  ORDER BY created_at
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION '未找到管理员账号，请先执行 server/sql/supabase_init.sql';
  END IF;

  -- 1) demo students
  INSERT INTO public.users (
    username, password_hash, role, full_name, email, phone, student_no,
    is_active, must_change_password, created_by, updated_by
  )
  SELECT
    'stu_demo1',
    crypt('demo123456', gen_salt('bf', 10)),
    'student',
    '演示学生甲',
    'stu_demo1@example.com',
    '13800000001',
    'S20260201',
    true,
    false,
    v_admin_id,
    v_admin_id
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE username = 'stu_demo1');

  INSERT INTO public.users (
    username, password_hash, role, full_name, email, phone, student_no,
    is_active, must_change_password, created_by, updated_by
  )
  SELECT
    'stu_demo2',
    crypt('demo123456', gen_salt('bf', 10)),
    'student',
    '演示学生乙',
    'stu_demo2@example.com',
    '13800000002',
    'S20260202',
    true,
    false,
    v_admin_id,
    v_admin_id
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE username = 'stu_demo2');

  SELECT id INTO v_student_1 FROM public.users WHERE username = 'stu_demo1' LIMIT 1;
  SELECT id INTO v_student_2 FROM public.users WHERE username = 'stu_demo2' LIMIT 1;

  -- 2) questions
  INSERT INTO public.questions (type, stem, options, correct_answer, analysis, score, category, created_by, updated_by)
  SELECT
    'single',
    '以下哪个不是 JavaScript 的基本数据类型？',
    '["String","Number","Boolean","Array"]'::jsonb,
    'D',
    'Array 属于引用类型，不是 JS 基本数据类型。',
    5,
    '编程基础',
    v_admin_id,
    v_admin_id
  WHERE NOT EXISTS (SELECT 1 FROM public.questions WHERE stem = '以下哪个不是 JavaScript 的基本数据类型？');

  INSERT INTO public.questions (type, stem, options, correct_answer, analysis, score, category, created_by, updated_by)
  SELECT
    'single',
    'HTTP 协议默认使用的端口号是？',
    '["21","80","443","8080"]'::jsonb,
    'B',
    'HTTP 默认端口是 80。',
    5,
    '网络基础',
    v_admin_id,
    v_admin_id
  WHERE NOT EXISTS (SELECT 1 FROM public.questions WHERE stem = 'HTTP 协议默认使用的端口号是？');

  INSERT INTO public.questions (type, stem, options, correct_answer, analysis, score, category, created_by, updated_by)
  SELECT
    'judge',
    'CSS 是层叠样式表的缩写。',
    '["正确","错误"]'::jsonb,
    'A',
    'CSS 即 Cascading Style Sheets。',
    3,
    '编程基础',
    v_admin_id,
    v_admin_id
  WHERE NOT EXISTS (SELECT 1 FROM public.questions WHERE stem = 'CSS 是层叠样式表的缩写。');

  INSERT INTO public.questions (type, stem, options, correct_answer, analysis, score, category, created_by, updated_by)
  SELECT
    'single',
    '在 React 中，用于管理状态的内置 Hook 是？',
    '["useEffect","useState","useContext","useReducer"]'::jsonb,
    'B',
    'useState 用于在函数组件中管理本地状态。',
    5,
    '前端框架',
    v_admin_id,
    v_admin_id
  WHERE NOT EXISTS (SELECT 1 FROM public.questions WHERE stem = '在 React 中，用于管理状态的内置 Hook 是？');

  INSERT INTO public.questions (type, stem, options, correct_answer, analysis, score, category, created_by, updated_by)
  SELECT
    'single',
    '以下哪个命令用于在 Git 中创建新分支？',
    '["git checkout","git branch","git merge","git commit"]'::jsonb,
    'B',
    'git branch 用于创建分支。',
    5,
    '版本控制',
    v_admin_id,
    v_admin_id
  WHERE NOT EXISTS (SELECT 1 FROM public.questions WHERE stem = '以下哪个命令用于在 Git 中创建新分支？');

  INSERT INTO public.questions (type, stem, options, correct_answer, analysis, score, category, created_by, updated_by)
  SELECT
    'essay',
    '请简述 RESTful API 的设计原则。',
    '[]'::jsonb,
    NULL,
    '可从资源导向、HTTP 动词语义、状态码、无状态等角度评分。',
    10,
    '架构设计',
    v_admin_id,
    v_admin_id
  WHERE NOT EXISTS (SELECT 1 FROM public.questions WHERE stem = '请简述 RESTful API 的设计原则。');

  SELECT id INTO q1 FROM public.questions WHERE stem = '以下哪个不是 JavaScript 的基本数据类型？' LIMIT 1;
  SELECT id INTO q2 FROM public.questions WHERE stem = 'HTTP 协议默认使用的端口号是？' LIMIT 1;
  SELECT id INTO q3 FROM public.questions WHERE stem = 'CSS 是层叠样式表的缩写。' LIMIT 1;
  SELECT id INTO q4 FROM public.questions WHERE stem = '在 React 中，用于管理状态的内置 Hook 是？' LIMIT 1;
  SELECT id INTO q5 FROM public.questions WHERE stem = '以下哪个命令用于在 Git 中创建新分支？' LIMIT 1;
  SELECT id INTO q6 FROM public.questions WHERE stem = '请简述 RESTful API 的设计原则。' LIMIT 1;

  -- 3) exams
  INSERT INTO public.exams (
    title, description, duration_minutes, status, start_time, end_time,
    created_by, updated_by, published_at
  )
  SELECT
    '前端开发基础测试（演示）',
    '用于测试考试管理、题库管理、提交记录模块的演示考试。',
    60,
    'published',
    now() - interval '2 day',
    now() + interval '5 day',
    v_admin_id,
    v_admin_id,
    now() - interval '2 day'
  WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE title = '前端开发基础测试（演示）');

  INSERT INTO public.exams (
    title, description, duration_minutes, status, start_time, end_time,
    created_by, updated_by, published_at
  )
  SELECT
    '系统设计专项（演示）',
    '包含简答题，便于测试待复核提交场景。',
    90,
    'published',
    now() - interval '1 day',
    now() + interval '7 day',
    v_admin_id,
    v_admin_id,
    now() - interval '1 day'
  WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE title = '系统设计专项（演示）');

  INSERT INTO public.exams (
    title, description, duration_minutes, status, start_time, end_time,
    created_by, updated_by
  )
  SELECT
    '数据库优化专项（演示草稿）',
    '用于测试草稿状态考试。',
    45,
    'draft',
    now() + interval '3 day',
    now() + interval '10 day',
    v_admin_id,
    v_admin_id
  WHERE NOT EXISTS (SELECT 1 FROM public.exams WHERE title = '数据库优化专项（演示草稿）');

  SELECT id INTO e1 FROM public.exams WHERE title = '前端开发基础测试（演示）' LIMIT 1;
  SELECT id INTO e2 FROM public.exams WHERE title = '系统设计专项（演示）' LIMIT 1;
  SELECT id INTO e3 FROM public.exams WHERE title = '数据库优化专项（演示草稿）' LIMIT 1;

  -- 4) exam-question mapping
  INSERT INTO public.exam_questions (exam_id, question_id, sort_order, score)
  VALUES
    (e1, q1, 1, 5),
    (e1, q3, 2, 3),
    (e1, q4, 3, 5),
    (e1, q5, 4, 5)
  ON CONFLICT (exam_id, question_id)
  DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    score = EXCLUDED.score;

  INSERT INTO public.exam_questions (exam_id, question_id, sort_order, score)
  VALUES
    (e2, q2, 1, 5),
    (e2, q6, 2, 10),
    (e2, q5, 3, 5)
  ON CONFLICT (exam_id, question_id)
  DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    score = EXCLUDED.score;

  INSERT INTO public.exam_questions (exam_id, question_id, sort_order, score)
  VALUES
    (e3, q2, 1, 5),
    (e3, q6, 2, 10)
  ON CONFLICT (exam_id, question_id)
  DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    score = EXCLUDED.score;

  -- 5) submissions
  INSERT INTO public.submissions (
    exam_id, student_id, status, max_score,
    started_at, submitted_at, reviewed_at, reviewed_by, time_spent_seconds
  )
  VALUES (
    e1,
    v_student_1,
    'reviewed',
    (SELECT total_score FROM public.exams WHERE id = e1),
    now() - interval '1 day' - interval '55 min',
    now() - interval '1 day',
    now() - interval '23 hour',
    v_admin_id,
    3300
  )
  ON CONFLICT (exam_id, student_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    max_score = EXCLUDED.max_score,
    started_at = EXCLUDED.started_at,
    submitted_at = EXCLUDED.submitted_at,
    reviewed_at = EXCLUDED.reviewed_at,
    reviewed_by = EXCLUDED.reviewed_by,
    time_spent_seconds = EXCLUDED.time_spent_seconds,
    updated_at = now();

  INSERT INTO public.submissions (
    exam_id, student_id, status, max_score,
    started_at, submitted_at, reviewed_at, reviewed_by, time_spent_seconds
  )
  VALUES (
    e2,
    v_student_2,
    'submitted',
    (SELECT total_score FROM public.exams WHERE id = e2),
    now() - interval '6 hour' - interval '70 min',
    now() - interval '6 hour',
    NULL,
    NULL,
    4200
  )
  ON CONFLICT (exam_id, student_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    max_score = EXCLUDED.max_score,
    started_at = EXCLUDED.started_at,
    submitted_at = EXCLUDED.submitted_at,
    reviewed_at = EXCLUDED.reviewed_at,
    reviewed_by = EXCLUDED.reviewed_by,
    time_spent_seconds = EXCLUDED.time_spent_seconds,
    updated_at = now();

  INSERT INTO public.submissions (
    exam_id, student_id, status, max_score,
    started_at, submitted_at, reviewed_at, reviewed_by, time_spent_seconds
  )
  VALUES (
    e1,
    v_student_2,
    'in_progress',
    (SELECT total_score FROM public.exams WHERE id = e1),
    now() - interval '30 min',
    NULL,
    NULL,
    NULL,
    1800
  )
  ON CONFLICT (exam_id, student_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    max_score = EXCLUDED.max_score,
    started_at = EXCLUDED.started_at,
    submitted_at = EXCLUDED.submitted_at,
    reviewed_at = EXCLUDED.reviewed_at,
    reviewed_by = EXCLUDED.reviewed_by,
    time_spent_seconds = EXCLUDED.time_spent_seconds,
    updated_at = now();

  SELECT id INTO s1 FROM public.submissions WHERE exam_id = e1 AND student_id = v_student_1;
  SELECT id INTO s2 FROM public.submissions WHERE exam_id = e2 AND student_id = v_student_2;
  SELECT id INTO s3 FROM public.submissions WHERE exam_id = e1 AND student_id = v_student_2;

  -- 6) submission answers: reviewed record
  INSERT INTO public.submission_answers (
    submission_id, question_id, answer_text, is_correct,
    auto_score, manual_score, review_status, review_comment, reviewed_by, reviewed_at
  )
  VALUES
    (s1, q1, 'D', true, 5, 0, 'reviewed', '客观题自动判分通过', v_admin_id, now() - interval '23 hour'),
    (s1, q3, 'A', true, 3, 0, 'reviewed', '判断题正确', v_admin_id, now() - interval '23 hour'),
    (s1, q4, 'B', true, 5, 0, 'reviewed', '单选题正确', v_admin_id, now() - interval '23 hour'),
    (s1, q5, 'B', true, 5, 0, 'reviewed', '单选题正确', v_admin_id, now() - interval '23 hour')
  ON CONFLICT (submission_id, question_id)
  DO UPDATE SET
    answer_text = EXCLUDED.answer_text,
    is_correct = EXCLUDED.is_correct,
    auto_score = EXCLUDED.auto_score,
    manual_score = EXCLUDED.manual_score,
    review_status = EXCLUDED.review_status,
    review_comment = EXCLUDED.review_comment,
    reviewed_by = EXCLUDED.reviewed_by,
    reviewed_at = EXCLUDED.reviewed_at,
    updated_at = now();

  -- 7) submission answers: submitted record (has essay pending review)
  INSERT INTO public.submission_answers (
    submission_id, question_id, answer_text, is_correct,
    auto_score, manual_score, review_status, review_comment, reviewed_by, reviewed_at
  )
  VALUES
    (s2, q2, 'B', true, 5, 0, 'auto_graded', NULL, NULL, NULL),
    (s2, q5, 'A', false, 0, 0, 'auto_graded', NULL, NULL, NULL),
    (s2, q6, 'RESTful 强调资源导向、无状态、统一接口、合理使用 HTTP 动词和状态码。', NULL, 0, 0, 'pending_review', NULL, NULL, NULL)
  ON CONFLICT (submission_id, question_id)
  DO UPDATE SET
    answer_text = EXCLUDED.answer_text,
    is_correct = EXCLUDED.is_correct,
    auto_score = EXCLUDED.auto_score,
    manual_score = EXCLUDED.manual_score,
    review_status = EXCLUDED.review_status,
    review_comment = EXCLUDED.review_comment,
    reviewed_by = EXCLUDED.reviewed_by,
    reviewed_at = EXCLUDED.reviewed_at,
    updated_at = now();

  -- 8) submission answers: in-progress record (partial)
  INSERT INTO public.submission_answers (
    submission_id, question_id, answer_text, is_correct,
    auto_score, manual_score, review_status, review_comment, reviewed_by, reviewed_at
  )
  VALUES
    (s3, q1, 'A', false, 0, 0, 'auto_graded', NULL, NULL, NULL),
    (s3, q3, NULL, NULL, 0, 0, 'auto_graded', NULL, NULL, NULL)
  ON CONFLICT (submission_id, question_id)
  DO UPDATE SET
    answer_text = EXCLUDED.answer_text,
    is_correct = EXCLUDED.is_correct,
    auto_score = EXCLUDED.auto_score,
    manual_score = EXCLUDED.manual_score,
    review_status = EXCLUDED.review_status,
    review_comment = EXCLUDED.review_comment,
    reviewed_by = EXCLUDED.reviewed_by,
    reviewed_at = EXCLUDED.reviewed_at,
    updated_at = now();

  -- 9) refresh rollups
  PERFORM public.refresh_submission_scores(s1);
  PERFORM public.refresh_submission_scores(s2);
  PERFORM public.refresh_submission_scores(s3);

  UPDATE public.submissions s
     SET max_score = e.total_score,
         updated_at = now()
    FROM public.exams e
   WHERE s.exam_id = e.id
     AND s.id IN (s1, s2, s3);

  RAISE NOTICE 'Demo seed complete. students=2, exams=3, questions=6, submissions=3';
END
$$;
