const jwt = require("jsonwebtoken");
const { loadEnv } = require("../config/env");

function signAccessToken(payload) {
  const env = loadEnv();
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  const env = loadEnv();
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};

