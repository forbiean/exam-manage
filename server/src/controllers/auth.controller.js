const { signAccessToken } = require("../utils/jwt");
const { AppError } = require("../utils/appError");
const { ok } = require("../utils/response");
const { supabaseRequest } = require("../lib/supabase");

async function verifyByUsername(username, password) {
  const rows = await supabaseRequest({
    method: "POST",
    path: "/rest/v1/rpc/verify_user_login",
    body: {
      p_username: username,
      p_password: password,
    },
  });
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  return rows[0];
}

async function verifyByEmail(email, password) {
  const rows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/users",
    searchParams: {
      select: "id,username,role,full_name,email,is_active,must_change_password,password_hash",
      email: `eq.${email}`,
      is_active: "eq.true",
      limit: 1,
    },
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const user = rows[0];
  const verifyRows = await verifyByUsername(user.username, password);
  return verifyRows;
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw new AppError(400, "email 和 password 不能为空");
    }

    let user = await verifyByUsername(email, password);
    if (!user && String(email).includes("@")) {
      user = await verifyByEmail(email, password);
    }

    if (!user) {
      throw new AppError(401, "账号或密码错误");
    }

    const token = signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.full_name,
    });

    return ok(
      res,
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
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
