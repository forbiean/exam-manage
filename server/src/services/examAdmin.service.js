const { AppError } = require("../utils/appError");
const { supabaseRequest } = require("../lib/supabase");

const EXAM_STATUSES = ["draft", "published", "closed"];

function normalizeExam(record, questionIds = []) {
  return {
    id: record.id,
    title: record.title,
    description: record.description || "",
    durationMinutes: record.duration_minutes,
    status: record.status,
    startTime: record.start_time,
    endTime: record.end_time,
    totalScore: record.total_score ?? 0,
    questionCount: record.question_count ?? 0,
    questionIds,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function normalizeAndValidateQuestionIds(questionIds) {
  if (!Array.isArray(questionIds)) {
    throw new AppError(400, "questionIds 必须是数组");
  }
  const trimmed = questionIds.map((id) => String(id || "").trim()).filter(Boolean);
  if (trimmed.length === 0) {
    throw new AppError(400, "至少选择 1 道题目");
  }
  const unique = Array.from(new Set(trimmed));
  if (unique.length !== trimmed.length) {
    throw new AppError(400, "题目不能重复选择");
  }
  return unique;
}

async function fetchQuestionScores(questionIds) {
  const ids = questionIds.join(",");
  const rows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/questions",
    searchParams: {
      select: "id,score,is_active",
      id: `in.(${ids})`,
      is_active: "eq.true",
      limit: questionIds.length,
    },
  });
  const list = Array.isArray(rows) ? rows : [];
  if (list.length !== questionIds.length) {
    throw new AppError(400, "包含不存在或未激活的题目");
  }
  const scoreMap = new Map(list.map((row) => [row.id, Number(row.score) || 1]));
  return scoreMap;
}

async function listExams() {
  const exams = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/exams",
    searchParams: {
      select:
        "id,title,description,duration_minutes,status,start_time,end_time,total_score,question_count,created_at,updated_at",
      order: "created_at.desc",
    },
  });

  const examRows = Array.isArray(exams) ? exams : [];
  if (examRows.length === 0) return [];

  const examIds = examRows.map((item) => item.id).join(",");
  const mappings = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/exam_questions",
    searchParams: {
      select: "exam_id,question_id,sort_order",
      exam_id: `in.(${examIds})`,
      order: "sort_order.asc",
    },
  });

  const grouped = new Map();
  (Array.isArray(mappings) ? mappings : []).forEach((row) => {
    const arr = grouped.get(row.exam_id) || [];
    arr.push(row.question_id);
    grouped.set(row.exam_id, arr);
  });

  return examRows.map((row) => normalizeExam(row, grouped.get(row.id) || []));
}

async function createExam(payload, operatorUserId) {
  const title = String(payload.title || "").trim();
  if (!title) {
    throw new AppError(400, "title 不能为空");
  }

  const status = EXAM_STATUSES.includes(payload.status) ? payload.status : "draft";
  const durationMinutes = Number(payload.durationMinutes || 60);
  if (durationMinutes <= 0) {
    throw new AppError(400, "durationMinutes 必须大于 0");
  }

  const body = {
    title,
    description: String(payload.description || "").trim(),
    duration_minutes: durationMinutes,
    status,
    start_time: payload.startTime || null,
    end_time: payload.endTime || null,
    created_by: operatorUserId || null,
    updated_by: operatorUserId || null,
    ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
  };

  const rows = await supabaseRequest({
    method: "POST",
    path: "/rest/v1/exams",
    headers: { Prefer: "return=representation" },
    body,
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(500, "创建考试失败");
  }
  return normalizeExam(rows[0], []);
}

async function ensureExamExists(examId) {
  const rows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/exams",
    searchParams: {
      select:
        "id,title,description,duration_minutes,status,start_time,end_time,total_score,question_count,created_at,updated_at",
      id: `eq.${examId}`,
      limit: 1,
    },
  });
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(404, "考试不存在");
  }
  return rows[0];
}

async function updateExamQuestions(examId, questionIds, operatorUserId) {
  const normalizedQuestionIds = normalizeAndValidateQuestionIds(questionIds);
  await ensureExamExists(examId);
  const scoreMap = await fetchQuestionScores(normalizedQuestionIds);

  await supabaseRequest({
    method: "DELETE",
    path: "/rest/v1/exam_questions",
    searchParams: {
      exam_id: `eq.${examId}`,
    },
  });

  await supabaseRequest({
    method: "POST",
    path: "/rest/v1/exam_questions",
    body: normalizedQuestionIds.map((questionId, index) => ({
      exam_id: examId,
      question_id: questionId,
      sort_order: index + 1,
      score: scoreMap.get(questionId) || 1,
    })),
  });

  await supabaseRequest({
    method: "PATCH",
    path: "/rest/v1/exams",
    searchParams: {
      id: `eq.${examId}`,
    },
    body: {
      updated_by: operatorUserId || null,
    },
  });

  const [exam] = await listExams().then((items) => items.filter((item) => item.id === examId));
  if (!exam) {
    throw new AppError(500, "更新后查询考试失败");
  }
  return exam;
}

async function publishExam(examId, operatorUserId) {
  const rows = await supabaseRequest({
    method: "PATCH",
    path: "/rest/v1/exams",
    searchParams: {
      id: `eq.${examId}`,
    },
    headers: { Prefer: "return=representation" },
    body: {
      status: "published",
      published_at: new Date().toISOString(),
      updated_by: operatorUserId || null,
    },
  });
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(404, "考试不存在");
  }
  return normalizeExam(rows[0], []);
}

async function deleteExam(examId) {
  const rows = await supabaseRequest({
    method: "DELETE",
    path: "/rest/v1/exams",
    searchParams: {
      id: `eq.${examId}`,
    },
    headers: { Prefer: "return=representation" },
  });
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(404, "考试不存在");
  }
  return { id: examId };
}

module.exports = {
  listExams,
  createExam,
  updateExamQuestions,
  publishExam,
  deleteExam,
};

