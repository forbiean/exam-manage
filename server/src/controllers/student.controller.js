const { getPublishedExamsForStudent } = require("../services/exam.service");
const {
  startExam,
  submitExam,
  getStudentHistory,
} = require("../services/submission.service");
const { ok } = require("../utils/response");

function listPublishedExams(req, res, next) {
  try {
    return ok(res, getPublishedExamsForStudent(), "获取已发布考试成功");
  } catch (error) {
    return next(error);
  }
}

function startOneExam(req, res, next) {
  try {
    const submission = startExam({
      examId: req.params.examId,
      studentId: req.user.sub,
    });
    return ok(res, submission, "开始考试成功", 201);
  } catch (error) {
    return next(error);
  }
}

function submitOneExam(req, res, next) {
  try {
    const submission = submitExam({
      submissionId: req.params.submissionId,
      studentId: req.user.sub,
      answers: req.body?.answers,
    });
    return ok(res, submission, "交卷成功");
  } catch (error) {
    return next(error);
  }
}

function myHistory(req, res, next) {
  try {
    return ok(res, getStudentHistory(req.user.sub), "获取历史成绩成功");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPublishedExams,
  startOneExam,
  submitOneExam,
  myHistory,
};

