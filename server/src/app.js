const express = require("express");
const cors = require("cors");
const { loadEnv } = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const adminRoutes = require("./routes/admin.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");
const { ok } = require("./utils/response");

const env = loadEnv();
const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  ok(res, { status: "ok" }, "health check ok");
});

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
