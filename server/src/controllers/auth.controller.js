const { findUserByEmail } = require("../data/users");
const { signAccessToken } = require("../utils/jwt");
const { AppError } = require("../utils/appError");
const { ok } = require("../utils/response");

function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw new AppError(400, "email 和 password 不能为空");
    }

    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      throw new AppError(401, "账号或密码错误");
    }

    const token = signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    return ok(
      res,
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      "登录成功"
    );
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return ok(
    res,
    {
      user: {
        id: req.user.sub,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name,
      },
    },
    "获取当前用户成功"
  );
}

module.exports = {
  login,
  me,
};

