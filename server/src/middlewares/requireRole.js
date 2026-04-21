function requireRole(allowedRole) {
  return function roleGuard(req, res, next) {
    if (!req.user || req.user.role !== allowedRole) {
      return res.status(403).json({ message: "无权限访问该资源" });
    }
    return next();
  };
}

module.exports = {
  requireRole,
};

