const { db, generateId } = require("../memory");

function createExam(payload) {
  const exam = {
    id: generateId("exam"),
    createdAt: new Date().toISOString(),
    ...payload,
  };
  db.exams.push(exam);
  return exam;
}

function listExams() {
  return db.exams;
}

function findExamById(examId) {
  return db.exams.find((item) => item.id === examId);
}

function updateExam(examId, payload) {
  const index = db.exams.findIndex((item) => item.id === examId);
  if (index === -1) {
    return null;
  }
  db.exams[index] = {
    ...db.exams[index],
    ...payload,
  };
  return db.exams[index];
}

module.exports = {
  createExam,
  listExams,
  findExamById,
  updateExam,
};

