const { AppError } = require("../utils/appError");
const {
  createExam,
  listExams,
  findExamById,
  updateExam,
} = require("../db/repositories/exam.repository");
const { findQuestionById } = require("../db/repositories/question.repository");

function validateQuestionIds(questionIds) {
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    throw new AppError(400, "questionIds 不能为空");
  }

  for (const questionId of questionIds) {
    const question = findQuestionById(questionId);
    if (!question) {
      throw new AppError(400, `题目不存在: ${questionId}`);
    }
  }
}

function createExamByAdmin(payload) {
  const { title, questionIds, status } = payload;

  if (!title) {
    throw new AppError(400, "title 不能为空");
  }
  validateQuestionIds(questionIds);

  const normalizedStatus = status === "published" ? "published" : "draft";

  return createExam({
    title,
    questionIds,
    status: normalizedStatus,
  });
}

function publishExam(examId) {
  const exam = findExamById(examId);
  if (!exam) {
    throw new AppError(404, "考试不存在");
  }
  return updateExam(examId, { status: "published" });
}

function getPublishedExamsForStudent() {
  return listExams().filter((item) => item.status === "published");
}

function getAllExamsForAdmin() {
  return listExams();
}

module.exports = {
  createExamByAdmin,
  publishExam,
  getPublishedExamsForStudent,
  getAllExamsForAdmin,
};

