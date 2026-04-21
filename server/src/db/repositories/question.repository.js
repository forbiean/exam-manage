const { db, generateId } = require("../memory");

function listQuestions() {
  return db.questions;
}

function findQuestionById(questionId) {
  return db.questions.find((item) => item.id === questionId);
}

function createQuestion(payload) {
  const question = {
    id: generateId("q"),
    ...payload,
  };
  db.questions.push(question);
  return question;
}

function updateQuestion(questionId, payload) {
  const index = db.questions.findIndex((item) => item.id === questionId);
  if (index === -1) {
    return null;
  }

  db.questions[index] = {
    ...db.questions[index],
    ...payload,
  };
  return db.questions[index];
}

module.exports = {
  listQuestions,
  findQuestionById,
  createQuestion,
  updateQuestion,
};

