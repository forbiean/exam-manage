const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

type LoginPayload = {
  email: string;
  password: string;
};

export async function login(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "登录失败" }));
    throw new Error(err.message || "登录失败");
  }

  return response.json() as Promise<{
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: "student" | "admin";
    };
  }>;
}

