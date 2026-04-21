const { AppError } = require("../utils/appError");

function notFoundHandler(_req, _res, next) {
  next(new AppError(404, "接口不存在"));
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "服务器内部错误";

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

