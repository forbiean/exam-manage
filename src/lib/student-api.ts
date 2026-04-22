import { clearAuthStorage, getToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

export type StudentExamStatus = "draft" | "published" | "closed";

export type StudentExamRecord = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: StudentExamStatus;
  startTime: string | null;
  endTime: string | null;
  totalScore: number;
  questionCount: number;
  questionIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type StudentQuestionType = "single" | "judge" | "essay";

export type StudentQuestionRecord = {
  id: string;
  type: StudentQuestionType;
  stem: string;
  options: string[];
  score: number;
};

export type StudentExamPaper = {
  exam: StudentExamRecord;
  questions: StudentQuestionRecord[];
};

export type SubmissionStatus = "in_progress" | "submitted" | "reviewed";

export type SubmissionRecord = {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  status: SubmissionStatus;
  totalScore: number | null;
  maxScore: number;
  submittedAt: string | null;
  startedAt: string | null;
  reviewedAt: string | null;
  needsManualReview: boolean;
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

export async function getStudentExams() {
  return request<StudentExamRecord[]>(`${API_BASE_URL}/api/student/exams`);
}

export async function getStudentExamPaper(examId: string) {
  return request<StudentExamPaper>(`${API_BASE_URL}/api/student/exams/${examId}`);
}

export async function startStudentExam(examId: string) {
  return request<{
    id: string;
    examId: string;
    studentId: string;
    status: SubmissionStatus;
    startedAt: string;
    submittedAt: string | null;
    totalScore: number;
    maxScore: number;
    needsManualReview: boolean;
  }>(`${API_BASE_URL}/api/student/exams/${examId}/start`, {
    method: "POST",
  });
}

export async function submitStudentExam(
  submissionId: string,
  answers: Array<{ questionId: string; answer: string }>
) {
  return request<{
    id: string;
    examId: string;
    studentId: string;
    status: SubmissionStatus;
    objectiveScore: number;
    totalScore: number;
    maxScore: number;
    needsManualReview: boolean;
    submittedAt: string | null;
    reviewedAt: string | null;
  }>(`${API_BASE_URL}/api/student/submissions/${submissionId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function getStudentHistory() {
  return request<SubmissionRecord[]>(`${API_BASE_URL}/api/student/history`);
}

