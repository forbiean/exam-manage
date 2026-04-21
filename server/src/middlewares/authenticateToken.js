const { verifyAccessToken } = require("../utils/jwt");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "未登录或令牌缺失",
      data: null,
    });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "登录已过期或令牌无效",
      data: null,
    });
  }
}

module.exports = {
  authenticateToken,
};
