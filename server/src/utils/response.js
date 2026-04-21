function ok(res, data = null, message = "ok", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

module.exports = {
  ok,
};

