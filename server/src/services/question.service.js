const { AppError } = require("../utils/appError");
const {
  listQuestions,
  createQuestion,
  updateQuestion,
  findQuestionById,
} = require("../db/repositories/question.repository");

const QUESTION_TYPES = ["single", "judge", "short"];

function validateQuestionPayload(payload, isUpdate = false) {
  const { type, stem, options, answer } = payload;

  if (!isUpdate && (!type || !stem)) {
    throw new AppError(400, "type 和 stem 为必填项");
  }

  if (type && !QUESTION_TYPES.includes(type)) {
    throw new AppError(400, "type 必须是 single、judge、short");
  }

  if (type === "single") {
    if (!Array.isArray(options) || options.length < 2) {
      throw new AppError(400, "single 题目 options 至少 2 个");
    }
    if (!answer || !options.includes(answer)) {
      throw new AppError(400, "single 题目的 answer 必须在 options 中");
    }
  }

  if (type === "judge") {
    if (!["true", "false"].includes(String(answer))) {
      throw new AppError(400, "judge 题目的 answer 必须是 true 或 false");
    }
  }
}

function getAllQuestions() {
  return listQuestions();
}

function addQuestion(payload) {
  validateQuestionPayload(payload);
  return createQuestion(payload);
}

function editQuestion(questionId, payload) {
  const question = findQuestionById(questionId);
  if (!question) {
    throw new AppError(404, "题目不存在");
  }

  const merged = { ...question, ...payload };
  validateQuestionPayload(merged, true);
  return updateQuestion(questionId, payload);
}

module.exports = {
  getAllQuestions,
  addQuestion,
  editQuestion,
};

