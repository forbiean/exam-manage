const {
  getAllQuestions,
  addQuestion,
  editQuestion,
} = require("../services/question.service");
const {
  createExamByAdmin,
  publishExam,
  getAllExamsForAdmin,
} = require("../services/exam.service");
const { getAllSubmissionRecords } = require("../services/submission.service");
const { ok } = require("../utils/response");

function listQuestions(req, res, next) {
  try {
    return ok(res, getAllQuestions(), "获取题库成功");
  } catch (error) {
    return next(error);
  }
}

function createQuestion(req, res, next) {
  try {
    const question = addQuestion(req.body || {});
    return ok(res, question, "创建题目成功", 201);
  } catch (error) {
    return next(error);
  }
}

function updateQuestion(req, res, next) {
  try {
    const question = editQuestion(req.params.questionId, req.body || {});
    return ok(res, question, "更新题目成功");
  } catch (error) {
    return next(error);
  }
}

function listExams(req, res, next) {
  try {
    return ok(res, getAllExamsForAdmin(), "获取考试列表成功");
  } catch (error) {
    return next(error);
  }
}

function createExam(req, res, next) {
  try {
    const exam = createExamByAdmin(req.body || {});
    return ok(res, exam, "创建考试成功", 201);
  } catch (error) {
    return next(error);
  }
}

function publishOneExam(req, res, next) {
  try {
    const exam = publishExam(req.params.examId);
    return ok(res, exam, "发布考试成功");
  } catch (error) {
    return next(error);
  }
}

function listSubmissions(req, res, next) {
  try {
    return ok(res, getAllSubmissionRecords(), "获取提交记录成功");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listQuestions,
  createQuestion,
  updateQuestion,
  listExams,
  createExam,
  publishOneExam,
  listSubmissions,
};

