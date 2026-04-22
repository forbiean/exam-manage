const { AppError } = require("../utils/appError");
const { supabaseRequest } = require("../lib/supabase");

function normalizeSubmissionRecord(row) {
  return {
    id: row.id,
    examId: row.exam_id,
    examTitle: row.exam_title,
    studentId: row.student_id,
    studentName: row.student_name,
    status: row.status,
    totalScore: row.total_score === null || row.total_score === undefined ? null : Number(row.total_score),
    maxScore: Number(row.max_score || 0),
    submittedAt: row.submitted_at,
    startedAt: row.started_at,
    reviewedAt: row.reviewed_at,
    needsManualReview: Boolean(row.needs_manual_review),
  };
}

async function ensureExamAvailableForStudent(examId) {
  const rows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/exams",
    searchParams: {
      select: "id,status,start_time,end_time,total_score",
      id: `eq.${examId}`,
      status: "neq.draft",
      limit: 1,
    },
  });
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(404, "考试不存在");
  }
  return rows[0];
}

async function loadExamQuestions(examId) {
  const mappings = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/exam_questions",
    searchParams: {
      select: "question_id,score,sort_order",
      exam_id: `eq.${examId}`,
      order: "sort_order.asc",
    },
  });
  const questionIds = (Array.isArray(mappings) ? mappings : []).map((item) => item.question_id);
  if (questionIds.length === 0) return [];

  const questions = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/questions",
    searchParams: {
      select: "id,type,correct_answer,is_active",
      id: `in.(${questionIds.join(",")})`,
      is_active: "eq.true",
    },
  });

  const scoreMap = new Map(
    (Array.isArray(mappings) ? mappings : []).map((item) => [item.question_id, Number(item.score) || 0])
  );
  const questionMap = new Map(
    (Array.isArray(questions) ? questions : []).map((item) => [
      item.id,
      {
        id: item.id,
        type: item.type,
        correctAnswer: item.correct_answer,
        score: scoreMap.get(item.id) || 0,
      },
    ])
  );

  return questionIds.map((id) => questionMap.get(id)).filter(Boolean);
}

async function startExam({ examId, studentId }) {
  const exam = await ensureExamAvailableForStudent(examId);

  const existing = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/submissions",
    searchParams: {
      select:
        "id,exam_id,student_id,status,objective_score,manual_score,total_score,max_score,needs_manual_review,started_at,submitted_at,reviewed_at",
      exam_id: `eq.${examId}`,
      student_id: `eq.${studentId}`,
      limit: 1,
    },
  });

  if (Array.isArray(existing) && existing.length > 0) {
    const row = existing[0];
    return {
      id: row.id,
      examId: row.exam_id,
      studentId: row.student_id,
      status: row.status,
      startedAt: row.started_at,
      submittedAt: row.submitted_at,
      totalScore: Number(row.total_score || 0),
      maxScore: Number(row.max_score || 0),
      needsManualReview: Boolean(row.needs_manual_review),
    };
  }

  const created = await supabaseRequest({
    method: "POST",
    path: "/rest/v1/submissions",
    headers: { Prefer: "return=representation" },
    body: {
      exam_id: examId,
      student_id: studentId,
      status: "in_progress",
      objective_score: 0,
      manual_score: 0,
      total_score: 0,
      max_score: Number(exam.total_score || 0),
      needs_manual_review: false,
      started_at: new Date().toISOString(),
    },
  });

  if (!Array.isArray(created) || created.length === 0) {
    throw new AppError(500, "开始考试失败");
  }

  const row = created[0];
  return {
    id: row.id,
    examId: row.exam_id,
    studentId: row.student_id,
    status: row.status,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    totalScore: Number(row.total_score || 0),
    maxScore: Number(row.max_score || 0),
    needsManualReview: Boolean(row.needs_manual_review),
  };
}

async function submitExam({ submissionId, studentId, answers }) {
  if (!Array.isArray(answers)) {
    throw new AppError(400, "answers 必须是数组");
  }

  const submissionRows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/submissions",
    searchParams: {
      select:
        "id,exam_id,student_id,status,objective_score,manual_score,total_score,max_score,needs_manual_review,started_at,submitted_at,reviewed_at",
      id: `eq.${submissionId}`,
      student_id: `eq.${studentId}`,
      limit: 1,
    },
  });

  if (!Array.isArray(submissionRows) || submissionRows.length === 0) {
    throw new AppError(404, "提交记录不存在");
  }
  const submission = submissionRows[0];
  if (submission.status !== "in_progress") {
    throw new AppError(400, "该提交已完成，请勿重复提交");
  }

  const questions = await loadExamQuestions(submission.exam_id);
  const answerMap = new Map(
    answers
      .filter((item) => item && item.questionId)
      .map((item) => [String(item.questionId), item.answer === undefined ? null : String(item.answer)])
  );

  let objectiveScore = 0;
  let needsManualReview = false;
  const answerRows = questions.map((question) => {
    const answerText = answerMap.get(question.id) ?? null;

    if (question.type === "essay" || question.type === "short") {
      needsManualReview = true;
      return {
        submission_id: submissionId,
        question_id: question.id,
        answer_text: answerText,
        is_correct: null,
        auto_score: 0,
        manual_score: 0,
        review_status: "pending_review",
      };
    }

    const isCorrect = answerText !== null && String(answerText) === String(question.correctAnswer ?? "");
    const autoScore = isCorrect ? Number(question.score || 0) : 0;
    objectiveScore += autoScore;

    return {
      submission_id: submissionId,
      question_id: question.id,
      answer_text: answerText,
      is_correct: isCorrect,
      auto_score: autoScore,
      manual_score: 0,
      review_status: "auto_graded",
    };
  });

  await supabaseRequest({
    method: "DELETE",
    path: "/rest/v1/submission_answers",
    searchParams: {
      submission_id: `eq.${submissionId}`,
    },
  });

  if (answerRows.length > 0) {
    await supabaseRequest({
      method: "POST",
      path: "/rest/v1/submission_answers",
      body: answerRows,
    });
  }

  const nowIso = new Date().toISOString();
  const finalStatus = needsManualReview ? "submitted" : "reviewed";
  const totalScore = objectiveScore;
  const patchBody = {
    status: finalStatus,
    objective_score: objectiveScore,
    total_score: totalScore,
    needs_manual_review: needsManualReview,
    submitted_at: nowIso,
    reviewed_at: needsManualReview ? null : nowIso,
  };

  const updatedRows = await supabaseRequest({
    method: "PATCH",
    path: "/rest/v1/submissions",
    searchParams: {
      id: `eq.${submissionId}`,
      student_id: `eq.${studentId}`,
    },
    headers: { Prefer: "return=representation" },
    body: patchBody,
  });

  if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
    throw new AppError(500, "交卷失败");
  }

  const updated = updatedRows[0];
  return {
    id: updated.id,
    examId: updated.exam_id,
    studentId: updated.student_id,
    status: updated.status,
    objectiveScore: Number(updated.objective_score || 0),
    totalScore: Number(updated.total_score || 0),
    maxScore: Number(updated.max_score || 0),
    needsManualReview: Boolean(updated.needs_manual_review),
    submittedAt: updated.submitted_at,
    reviewedAt: updated.reviewed_at,
  };
}

async function getStudentHistory(studentId) {
  const rows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/v_admin_submissions",
    searchParams: {
      select:
        "id,exam_id,exam_title,student_id,student_name,status,total_score,max_score,needs_manual_review,started_at,submitted_at,reviewed_at,created_at,updated_at",
      student_id: `eq.${studentId}`,
      status: "in.(submitted,reviewed)",
      order: "submitted_at.desc.nullslast,created_at.desc",
    },
  });

  return Array.isArray(rows) ? rows.map(normalizeSubmissionRecord) : [];
}

async function getAllSubmissionRecords() {
  const rows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/v_admin_submissions",
    searchParams: {
      select:
        "id,exam_id,exam_title,student_id,student_name,status,total_score,max_score,needs_manual_review,started_at,submitted_at,reviewed_at,created_at,updated_at",
      order: "submitted_at.desc.nullslast,created_at.desc",
    },
  });

  return Array.isArray(rows) ? rows.map(normalizeSubmissionRecord) : [];
}

module.exports = {
  startExam,
  submitExam,
  getStudentHistory,
  getAllSubmissionRecords,
};
