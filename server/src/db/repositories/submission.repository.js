const { db, generateId } = require("../memory");

function createSubmission(payload) {
  const submission = {
    id: generateId("sub"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payload,
  };
  db.submissions.push(submission);
  return submission;
}

function updateSubmission(submissionId, payload) {
  const index = db.submissions.findIndex((item) => item.id === submissionId);
  if (index === -1) {
    return null;
  }

  db.submissions[index] = {
    ...db.submissions[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  return db.submissions[index];
}

function findSubmissionById(submissionId) {
  return db.submissions.find((item) => item.id === submissionId);
}

function listSubmissions() {
  return db.submissions;
}

function listSubmissionsByStudentId(studentId) {
  return db.submissions.filter((item) => item.studentId === studentId);
}

function findSubmissionByExamAndStudent(examId, studentId) {
  return db.submissions.find(
    (item) => item.examId === examId && item.studentId === studentId
  );
}

module.exports = {
  createSubmission,
  updateSubmission,
  findSubmissionById,
  listSubmissions,
  listSubmissionsByStudentId,
  findSubmissionByExamAndStudent,
};
