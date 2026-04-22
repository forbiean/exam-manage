const express = require("express");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { requireRole } = require("../middlewares/requireRole");
const {
  listPublishedExams,
  getOneExamPaper,
  startOneExam,
  submitOneExam,
  myHistory,
} = require("../controllers/student.controller");

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole("student"));

router.get("/exams", listPublishedExams);
router.get("/exams/:examId", getOneExamPaper);
router.post("/exams/:examId/start", startOneExam);
router.post("/submissions/:submissionId/submit", submitOneExam);
router.get("/history", myHistory);

module.exports = router;
