import { getToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

export type StudentRecord = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  studentNo: string;
  isActive: boolean;
  mustChangePassword: boolean;
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

  if (!response.ok || !body || !("success" in body) || !body.success) {
    throw new Error((body && "message" in body && body.message) || "请求失败");
  }

  return body.data;
}

export async function getStudents(params: { search?: string; page?: number; pageSize?: number }) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  return request<{
    list: StudentRecord[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    };
  }>(`${API_BASE_URL}/api/admin/students?${q.toString()}`);
}

export async function createStudent(payload: {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
  studentNo: string;
}) {
  return request<StudentRecord>(`${API_BASE_URL}/api/admin/students`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStudent(
  studentId: string,
  payload: {
    fullName?: string;
    email?: string;
    phone?: string;
    studentNo?: string;
    isActive?: boolean;
    mustChangePassword?: boolean;
  }
) {
  return request<StudentRecord>(`${API_BASE_URL}/api/admin/students/${studentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteStudent(studentId: string) {
  return request<{ id: string }>(`${API_BASE_URL}/api/admin/students/${studentId}`, {
    method: "DELETE",
  });
}

export async function importStudentsCsv(payload: {
  fileName: string;
  csvText: string;
  overwrite: boolean;
}) {
  return request<{
    batchId: string;
    summary: { inserted_count: number; updated_count: number; failed_count: number };
    detail: Array<{ row_no: number; username: string; imported: boolean; error_message: string | null }>;
  }>(`${API_BASE_URL}/api/admin/students/import`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

