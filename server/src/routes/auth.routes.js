const express = require("express");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { login, me } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", login);
router.get("/me", authenticateToken, me);

module.exports = router;
