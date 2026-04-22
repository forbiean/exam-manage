const {
  getExamsForStudent,
  getExamPaperForStudent,
} = require("../services/exam.service");
const {
  startExam,
  submitExam,
  getStudentHistory,
} = require("../services/submission.service");
const { ok } = require("../utils/response");

async function listPublishedExams(req, res, next) {
  try {
    const exams = await getExamsForStudent();
    return ok(res, exams, "获取考试列表成功");
  } catch (error) {
    return next(error);
  }
}

async function getOneExamPaper(req, res, next) {
  try {
    const paper = await getExamPaperForStudent(req.params.examId);
    return ok(res, paper, "获取考试试卷成功");
  } catch (error) {
    return next(error);
  }
}

async function startOneExam(req, res, next) {
  try {
    const submission = await startExam({
      examId: req.params.examId,
      studentId: req.user.sub,
    });
    return ok(res, submission, "开始考试成功", 201);
  } catch (error) {
    return next(error);
  }
}

async function submitOneExam(req, res, next) {
  try {
    const submission = await submitExam({
      submissionId: req.params.submissionId,
      studentId: req.user.sub,
      answers: req.body?.answers,
    });
    return ok(res, submission, "交卷成功");
  } catch (error) {
    return next(error);
  }
}

async function myHistory(req, res, next) {
  try {
    const history = await getStudentHistory(req.user.sub);
    return ok(res, history, "获取历史成绩成功");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPublishedExams,
  getOneExamPaper,
  startOneExam,
  submitOneExam,
  myHistory,
};
