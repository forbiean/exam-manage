const { AppError } = require("../utils/appError");
const {
  createSubmission,
  updateSubmission,
  findSubmissionById,
  listSubmissions,
  listSubmissionsByStudentId,
  findSubmissionByExamAndStudent,
} = require("../db/repositories/submission.repository");
const { findExamById } = require("../db/repositories/exam.repository");
const { findQuestionById } = require("../db/repositories/question.repository");

function buildExamQuestions(exam) {
  return exam.questionIds.map((id) => {
    const question = findQuestionById(id);
    if (!question) {
      throw new AppError(500, `考试题目缺失: ${id}`);
    }
    return question;
  });
}

function startExam({ examId, studentId }) {
  const exam = findExamById(examId);
  if (!exam || exam.status !== "published") {
    throw new AppError(404, "考试不存在或未发布");
  }

  const existing = findSubmissionByExamAndStudent(examId, studentId);
  if (existing) {
    return existing;
  }

  return createSubmission({
    examId,
    studentId,
    status: "in_progress",
    answers: [],
    objectiveScore: 0,
    needsManualReview: false,
    totalScore: 0,
  });
}

function submitExam({ submissionId, studentId, answers }) {
  if (!Array.isArray(answers)) {
    throw new AppError(400, "answers 必须是数组");
  }

  const submission = findSubmissionById(submissionId);
  if (!submission || submission.studentId !== studentId) {
    throw new AppError(404, "提交记录不存在");
  }

  if (submission.status === "submitted") {
    throw new AppError(400, "该提交已完成，请勿重复提交");
  }

  const exam = findExamById(submission.examId);
  if (!exam) {
    throw new AppError(404, "考试不存在");
  }

  const questions = buildExamQuestions(exam);
  const answerMap = new Map(answers.map((item) => [item.questionId, item.answer]));

  let objectiveScore = 0;
  let needsManualReview = false;
  const gradedAnswers = questions.map((question) => {
    const studentAnswer = answerMap.get(question.id) ?? null;

    if (question.type === "short") {
      needsManualReview = true;
      return {
        questionId: question.id,
        answer: studentAnswer,
        isCorrect: null,
        score: 0,
        reviewStatus: "pending_review",
      };
    }

    const isCorrect = String(studentAnswer) === String(question.answer);
    if (isCorrect) {
      objectiveScore += 1;
    }

    return {
      questionId: question.id,
      answer: studentAnswer,
      isCorrect,
      score: isCorrect ? 1 : 0,
      reviewStatus: "auto_graded",
    };
  });

  const updated = updateSubmission(submissionId, {
    answers: gradedAnswers,
    objectiveScore,
    totalScore: objectiveScore,
    needsManualReview,
    status: "submitted",
    submittedAt: new Date().toISOString(),
  });

  return updated;
}

function getStudentHistory(studentId) {
  return listSubmissionsByStudentId(studentId).filter(
    (item) => item.status === "submitted"
  );
}

function getAllSubmissionRecords() {
  return listSubmissions();
}

module.exports = {
  startExam,
  submitExam,
  getStudentHistory,
  getAllSubmissionRecords,
};

