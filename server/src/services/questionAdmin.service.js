const { AppError } = require("../utils/appError");
const { supabaseRequest } = require("../lib/supabase");

const QUESTION_TYPES = ["single", "judge", "essay", "short"];

function normalizeQuestion(record) {
  return {
    id: record.id,
    type: record.type === "short" ? "essay" : record.type,
    stem: record.stem,
    options: Array.isArray(record.options) ? record.options : [],
    correctAnswer: record.correct_answer,
    analysis: record.analysis,
    score: record.score,
    category: record.category,
    isActive: record.is_active,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function validateQuestionPayload(payload, isUpdate = false) {
  const { type, stem, options, correctAnswer, score } = payload;

  if (!isUpdate) {
    if (!type || !stem || score === undefined || score === null) {
      throw new AppError(400, "type、stem、score 为必填项");
    }
  }

  if (type && !QUESTION_TYPES.includes(type)) {
    throw new AppError(400, "type 必须是 single、judge、essay、short");
  }

  if (type === "single") {
    if (!Array.isArray(options) || options.length < 2) {
      throw new AppError(400, "single 题目 options 至少 2 个");
    }
    if (!correctAnswer) {
      throw new AppError(400, "single 题目必须提供正确答案");
    }
  }

  if (type === "judge") {
    if (!correctAnswer) {
      throw new AppError(400, "judge 题目必须提供正确答案");
    }
  }

  if (score !== undefined && Number(score) <= 0) {
    throw new AppError(400, "score 必须大于 0");
  }
}

async function listQuestions() {
  const rows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/questions",
    searchParams: {
      select: "id,type,stem,options,correct_answer,analysis,score,category,is_active,created_at,updated_at",
      is_active: "eq.true",
      order: "created_at.desc",
    },
  });
  return Array.isArray(rows) ? rows.map(normalizeQuestion) : [];
}

async function createQuestion(payload, operatorUserId) {
  validateQuestionPayload(payload, false);

  const insertBody = {
    type: payload.type === "essay" ? "essay" : payload.type,
    stem: payload.stem,
    options: Array.isArray(payload.options) ? payload.options : [],
    correct_answer: payload.correctAnswer || null,
    analysis: payload.analysis || null,
    score: Number(payload.score),
    category: payload.category || "未分类",
    created_by: operatorUserId || null,
    updated_by: operatorUserId || null,
  };

  const rows = await supabaseRequest({
    method: "POST",
    path: "/rest/v1/questions",
    headers: { Prefer: "return=representation" },
    body: insertBody,
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(500, "创建题目失败");
  }
  return normalizeQuestion(rows[0]);
}

async function updateQuestion(questionId, payload, operatorUserId) {
  const existingRows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/questions",
    searchParams: {
      select: "id,type,stem,options,correct_answer,analysis,score,category,is_active,created_at,updated_at",
      id: `eq.${questionId}`,
      limit: 1,
    },
  });

  if (!Array.isArray(existingRows) || existingRows.length === 0) {
    throw new AppError(404, "题目不存在");
  }

  const existing = normalizeQuestion(existingRows[0]);
  const merged = {
    ...existing,
    ...payload,
  };
  validateQuestionPayload(merged, true);

  const patchBody = {
    ...(payload.type !== undefined ? { type: payload.type } : {}),
    ...(payload.stem !== undefined ? { stem: payload.stem } : {}),
    ...(payload.options !== undefined ? { options: payload.options } : {}),
    ...(payload.correctAnswer !== undefined ? { correct_answer: payload.correctAnswer || null } : {}),
    ...(payload.analysis !== undefined ? { analysis: payload.analysis || null } : {}),
    ...(payload.score !== undefined ? { score: Number(payload.score) } : {}),
    ...(payload.category !== undefined ? { category: payload.category || "未分类" } : {}),
    updated_by: operatorUserId || null,
  };

  const rows = await supabaseRequest({
    method: "PATCH",
    path: "/rest/v1/questions",
    searchParams: {
      id: `eq.${questionId}`,
    },
    headers: { Prefer: "return=representation" },
    body: patchBody,
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(404, "题目不存在");
  }
  return normalizeQuestion(rows[0]);
}

async function deleteQuestion(questionId, operatorUserId) {
  const rows = await supabaseRequest({
    method: "PATCH",
    path: "/rest/v1/questions",
    searchParams: {
      id: `eq.${questionId}`,
      is_active: "eq.true",
    },
    headers: { Prefer: "return=representation" },
    body: {
      is_active: false,
      updated_by: operatorUserId || null,
    },
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(404, "题目不存在");
  }

  return { id: questionId };
}

module.exports = {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};

