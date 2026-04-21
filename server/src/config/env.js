const requiredEnvVars = [
  "PORT",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CORS_ORIGIN",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STUDENT_EMAIL",
  "STUDENT_PASSWORD",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadEnv() {
  const missing = requiredEnvVars.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    PORT: Number(getRequiredEnv("PORT")),
    JWT_SECRET: getRequiredEnv("JWT_SECRET"),
    JWT_EXPIRES_IN: getRequiredEnv("JWT_EXPIRES_IN"),
    CORS_ORIGIN: getRequiredEnv("CORS_ORIGIN"),
    SUPABASE_URL: getRequiredEnv("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    STUDENT_EMAIL: getRequiredEnv("STUDENT_EMAIL"),
    STUDENT_PASSWORD: getRequiredEnv("STUDENT_PASSWORD"),
    ADMIN_EMAIL: getRequiredEnv("ADMIN_EMAIL"),
    ADMIN_PASSWORD: getRequiredEnv("ADMIN_PASSWORD"),
  };
}

module.exports = {
  loadEnv,
};
