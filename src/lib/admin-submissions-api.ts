import { clearAuthStorage, getToken } from "@/lib/auth";
import type { SubmissionRecord } from "@/lib/student-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

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

export async function getAdminSubmissions() {
  return request<SubmissionRecord[]>(`${API_BASE_URL}/api/admin/submissions`);
}

export type AdminSubmissionAnswerDetail = {
  questionId: string;
  type: "single" | "judge" | "essay";
  stem: string;
  options: string[];
  correctAnswer: string | null;
  questionScore: number;
  sortOrder: number;
  studentAnswer: string;
  isCorrect: boolean | null;
  autoScore: number;
  manualScore: number;
  finalScore: number;
  reviewStatus: "auto_graded" | "pending_review" | "reviewed";
  reviewComment: string | null;
};

export type AdminSubmissionDetail = SubmissionRecord & {
  answers: AdminSubmissionAnswerDetail[];
};

export async function getAdminSubmissionDetail(submissionId: string) {
  return request<AdminSubmissionDetail>(`${API_BASE_URL}/api/admin/submissions/${submissionId}`);
}

export async function reviewAdminSubmission(submissionId: string, essayScore: number) {
  return request<{
    id: string;
    examId: string;
    studentId: string;
    status: "reviewed";
    objectiveScore: number;
    manualScore: number;
    totalScore: number;
    maxScore: number;
    needsManualReview: boolean;
    submittedAt: string | null;
    reviewedAt: string | null;
  }>(`${API_BASE_URL}/api/admin/submissions/${submissionId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ essayScore }),
  });
}
