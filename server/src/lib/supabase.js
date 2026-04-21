const { loadEnv } = require("../config/env");
const { AppError } = require("../utils/appError");

function buildHeaders() {
  const env = loadEnv();
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

function buildUrl(path, searchParams = null) {
  const env = loadEnv();
  const url = new URL(`${env.SUPABASE_URL}${path}`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function supabaseRequest({ method, path, searchParams, body, headers = {} }) {
  const response = await fetch(buildUrl(path, searchParams), {
    method,
    headers: {
      ...buildHeaders(),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.message || payload?.error_description || payload?.hint;
    throw new AppError(500, detail || "Supabase 请求失败");
  }

  return payload;
}

module.exports = {
  supabaseRequest,
};

