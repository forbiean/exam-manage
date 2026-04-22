const {
  listQuestions: listQuestionsService,
  createQuestion: createQuestionService,
  updateQuestion: updateQuestionService,
  deleteQuestion: deleteQuestionService,
  activateQuestion: activateQuestionService,
} = require("../services/questionAdmin.service");
const {
  listExams: listExamsService,
  createExam: createExamService,
  updateExamQuestions: updateExamQuestionsService,
  publishExam: publishExamService,
  deleteExam: deleteExamService,
} = require("../services/examAdmin.service");
const {
  getAllSubmissionRecords,
  getSubmissionDetailForAdmin,
  reviewSubmissionByAdmin,
} = require("../services/submission.service");
const {
  listStudents: listStudentsService,
  createStudent: createStudentService,
  updateStudent: updateStudentService,
  deleteStudent: deleteStudentService,
  importStudentsFromCsv: importStudentsFromCsvService,
} = require("../services/studentAdmin.service");
const { ok } = require("../utils/response");

async function listQuestions(req, res, next) {
  try {
    const status = String(req.query.status || "active");
    const data = await listQuestionsService(status);
    return ok(res, data, "获取题库成功");
  } catch (error) {
    return next(error);
  }
}

async function createQuestion(req, res, next) {
  try {
    const operatorUserId = req.user?.sub || null;
    const question = await createQuestionService(req.body || {}, operatorUserId);
    return ok(res, question, "创建题目成功", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateQuestion(req, res, next) {
  try {
    const operatorUserId = req.user?.sub || null;
    const question = await updateQuestionService(req.params.questionId, req.body || {}, operatorUserId);
    return ok(res, question, "更新题目成功");
  } catch (error) {
    return next(error);
  }
}

async function deleteQuestion(req, res, next) {
  try {
    const operatorUserId = req.user?.sub || null;
    const hardDelete = String(req.query.hard || "false") === "true";
    const result = await deleteQuestionService(req.params.questionId, operatorUserId, hardDelete);
    return ok(res, result, "删除题目成功");
  } catch (error) {
    return next(error);
  }
}

async function activateQuestion(req, res, next) {
  try {
    const operatorUserId = req.user?.sub || null;
    const result = await activateQuestionService(req.params.questionId, operatorUserId);
    return ok(res, result, "恢复题目成功");
  } catch (error) {
    return next(error);
  }
}

async function listExams(req, res, next) {
  try {
    const data = await listExamsService();
    return ok(res, data, "获取考试列表成功");
  } catch (error) {
    return next(error);
  }
}

async function createExam(req, res, next) {
  try {
    const operatorUserId = req.user?.sub || null;
    const exam = await createExamService(req.body || {}, operatorUserId);
    return ok(res, exam, "创建考试成功", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateExamQuestions(req, res, next) {
  try {
    const operatorUserId = req.user?.sub || null;
    const exam = await updateExamQuestionsService(
      req.params.examId,
      req.body?.questionIds || [],
      operatorUserId
    );
    return ok(res, exam, "更新考试题目成功");
  } catch (error) {
    return next(error);
  }
}

async function publishOneExam(req, res, next) {
  try {
    const operatorUserId = req.user?.sub || null;
    const exam = await publishExamService(req.params.examId, operatorUserId);
    return ok(res, exam, "发布考试成功");
  } catch (error) {
    return next(error);
  }
}

async function deleteExam(req, res, next) {
  try {
    const result = await deleteExamService(req.params.examId);
    return ok(res, result, "删除考试成功");
  } catch (error) {
    return next(error);
  }
}

async function listSubmissions(req, res, next) {
  try {
    const submissions = await getAllSubmissionRecords();
    return ok(res, submissions, "获取提交记录成功");
  } catch (error) {
    return next(error);
  }
}

async function getSubmissionDetail(req, res, next) {
  try {
    const detail = await getSubmissionDetailForAdmin(req.params.submissionId);
    return ok(res, detail, "获取提交详情成功");
  } catch (error) {
    return next(error);
  }
}

async function reviewSubmission(req, res, next) {
  try {
    const result = await reviewSubmissionByAdmin({
      submissionId: req.params.submissionId,
      adminUserId: req.user?.sub || null,
      essayScore: req.body?.essayScore,
    });
    return ok(res, result, "保存评阅成功");
  } catch (error) {
    return next(error);
  }
}

async function listStudents(req, res, next) {
  try {
    const data = await listStudentsService({
      search: req.query.search || "",
      page: req.query.page || 1,
      pageSize: req.query.pageSize || 20,
    });
    return ok(res, data, "获取学生列表成功");
  } catch (error) {
    return next(error);
  }
}

async function createStudent(req, res, next) {
  try {
    const student = await createStudentService(req.body || {});
    return ok(res, student, "创建学生成功", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const student = await updateStudentService(req.params.studentId, req.body || {});
    return ok(res, student, "更新学生成功");
  } catch (error) {
    return next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    const result = await deleteStudentService(req.params.studentId);
    return ok(res, result, "删除学生成功");
  } catch (error) {
    return next(error);
  }
}

async function importStudentsFromCsv(req, res, next) {
  try {
    const { fileName, csvText, overwrite } = req.body || {};
    const result = await importStudentsFromCsvService({ fileName, csvText, overwrite });
    return ok(res, result, "批量导入执行完成");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  activateQuestion,
  listExams,
  createExam,
  updateExamQuestions,
  publishOneExam,
  deleteExam,
  listSubmissions,
  getSubmissionDetail,
  reviewSubmission,
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudentsFromCsv,
};
