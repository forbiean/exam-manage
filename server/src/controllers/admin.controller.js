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
const {
  listStudents: listStudentsService,
  createStudent: createStudentService,
  updateStudent: updateStudentService,
  deleteStudent: deleteStudentService,
  importStudentsFromCsv: importStudentsFromCsvService,
} = require("../services/studentAdmin.service");
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
  listExams,
  createExam,
  publishOneExam,
  listSubmissions,
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudentsFromCsv,
};
