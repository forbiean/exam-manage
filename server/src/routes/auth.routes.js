const express = require("express");
const { findUserByEmail } = require("../data/users");
const { signAccessToken } = require("../utils/jwt");
const { authenticateToken } = require("../middlewares/authenticateToken");

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "email 和 password 不能为空" });
  }

  const user = findUserByEmail(email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "账号或密码错误" });
  }

  const token = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

router.get("/me", authenticateToken, (req, res) => {
  return res.json({
    user: {
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;

