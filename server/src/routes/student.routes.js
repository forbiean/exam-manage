const express = require("express");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { requireRole } = require("../middlewares/requireRole");

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole("student"));

router.get("/profile", (req, res) => {
  return res.json({
    message: "学生接口访问成功",
    role: req.user.role,
    email: req.user.email,
  });
});

module.exports = router;

