const express = require("express");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { requireRole } = require("../middlewares/requireRole");
const {
  listQuestions,
  createQuestion,
  updateQuestion,
  listExams,
  createExam,
  publishOneExam,
  listSubmissions,
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole("admin"));

router.get("/questions", listQuestions);
router.post("/questions", createQuestion);
router.patch("/questions/:questionId", updateQuestion);

router.get("/exams", listExams);
router.post("/exams", createExam);
router.patch("/exams/:examId/publish", publishOneExam);

router.get("/submissions", listSubmissions);

module.exports = router;
