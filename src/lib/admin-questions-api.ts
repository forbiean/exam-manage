import { getToken } from "@/lib/auth";
import { clearAuthStorage } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

export type QuestionType = "single" | "judge" | "essay";

export type QuestionRecord = {
  id: string;
  type: QuestionType;
  stem: string;
  options: string[];
  correctAnswer: string | null;
  analysis: string | null;
  score: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const body = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | { message?: string }
    | null;

  if (response.status === 401) {
    clearAuthStorage();
    if (typeof window !== "undefined") {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirect}`;
    }
    throw new Error("登录已过期，请重新登录");
  }

  if (!response.ok || !body || !("success" in body) || !body.success) {
    throw new Error((body && "message" in body && body.message) || "请求失败");
  }

  return body.data;
}

export async function getQuestions(status: "active" | "inactive" | "all" = "active") {
  const q = new URLSearchParams();
  q.set("status", status);
  return request<QuestionRecord[]>(`${API_BASE_URL}/api/admin/questions?${q.toString()}`);
}

export async function createQuestion(payload: {
  type: QuestionType;
  stem: string;
  options: string[];
  correctAnswer?: string;
  analysis?: string;
  score: number;
  category: string;
}) {
  return request<QuestionRecord>(`${API_BASE_URL}/api/admin/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuestion(
  questionId: string,
  payload: Partial<{
    type: QuestionType;
    stem: string;
    options: string[];
    correctAnswer: string;
    analysis: string;
    score: number;
    category: string;
  }>
) {
  return request<QuestionRecord>(`${API_BASE_URL}/api/admin/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteQuestion(questionId: string, hardDelete = false) {
  const q = new URLSearchParams();
  if (hardDelete) q.set("hard", "true");
  return request<{ id: string; hardDeleted: boolean }>(
    `${API_BASE_URL}/api/admin/questions/${questionId}${q.toString() ? `?${q.toString()}` : ""}`,
    {
    method: "DELETE",
    }
  );
}

export async function activateQuestion(questionId: string) {
  return request<QuestionRecord>(`${API_BASE_URL}/api/admin/questions/${questionId}/activate`, {
    method: "PATCH",
  });
}
