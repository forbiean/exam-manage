const express = require("express");
const cors = require("cors");
const { loadEnv } = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const adminRoutes = require("./routes/admin.routes");

const env = loadEnv();
const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;

