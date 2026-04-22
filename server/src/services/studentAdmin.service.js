const { AppError } = require("../utils/appError");
const { supabaseRequest } = require("../lib/supabase");

function normalizeStudent(record) {
  return {
    id: record.id,
    username: record.username,
    fullName: record.full_name,
    email: record.email,
    phone: record.phone,
    studentNo: record.student_no,
    isActive: record.is_active,
    mustChangePassword: record.must_change_password,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

async function listStudents({ search = "", page = 1, pageSize = 20 }) {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safePageSize = Number(pageSize) > 0 ? Number(pageSize) : 20;
  const from = (safePage - 1) * safePageSize;

  const orFilter = search
    ? `(username.ilike.*${search}*,full_name.ilike.*${search}*,student_no.ilike.*${search}*)`
    : undefined;

  const rows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/users",
    searchParams: {
      select:
        "id,username,full_name,email,phone,student_no,is_active,must_change_password,created_at,updated_at",
      role: "eq.student",
      or: orFilter,
      order: "created_at.desc",
      offset: from,
      limit: safePageSize,
    },
  });

  const countRows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/users",
    searchParams: {
      select: "id",
      role: "eq.student",
      ...(orFilter ? { or: orFilter } : {}),
    },
  });

  return {
    list: Array.isArray(rows) ? rows.map(normalizeStudent) : [],
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total: Array.isArray(countRows) ? countRows.length : 0,
      hasMore: Array.isArray(rows) ? rows.length === safePageSize : false,
    },
  };
}

function validateStudentInput(payload, isUpdate = false) {
  const required = ["username", "fullName", "studentNo"];
  if (!isUpdate) {
    for (const key of required) {
      if (!payload[key] || String(payload[key]).trim() === "") {
        throw new AppError(400, `${key} 不能为空`);
      }
    }
    if (!payload.password || String(payload.password).trim() === "") {
      throw new AppError(400, "password 不能为空");
    }
  }
}

async function createStudent(payload) {
  validateStudentInput(payload);

  const result = await supabaseRequest({
    method: "POST",
    path: "/rest/v1/rpc/import_students_from_batch",
    body: {
      p_batch_id: await createSingleImportBatch(payload),
      p_operator_user_id: null,
      p_overwrite: false,
    },
  });

  const summary = Array.isArray(result) ? result[0] : result;
  if (!summary || summary.inserted_count !== 1) {
    throw new AppError(400, "创建学生失败，可能是账号或学号重复");
  }

  const students = await listStudents({ search: payload.username, page: 1, pageSize: 1 });
  const student = students.list.find((item) => item.username === payload.username);
  if (!student) {
    throw new AppError(500, "创建后查询学生失败");
  }
  return student;
}

async function createSingleImportBatch(payload) {
  const batchRows = await supabaseRequest({
    method: "POST",
    path: "/rest/v1/student_import_batches",
    headers: { Prefer: "return=representation" },
    body: {
      file_name: "single-create",
      status: "pending",
      created_by: null,
    },
  });

  const batch = batchRows?.[0];
  if (!batch?.id) {
    throw new AppError(500, "创建导入批次失败");
  }

  await supabaseRequest({
    method: "POST",
    path: "/rest/v1/student_import_rows",
    body: {
      batch_id: batch.id,
      row_no: 1,
      username: payload.username,
      password_plain: payload.password,
      full_name: payload.fullName,
      email: payload.email || null,
      phone: payload.phone || null,
      student_no: payload.studentNo,
    },
  });

  return batch.id;
}

async function updateStudent(studentId, payload) {
  validateStudentInput(payload, true);

  const patch = {};
  if (payload.fullName !== undefined) patch.full_name = payload.fullName;
  if (payload.email !== undefined) patch.email = payload.email || null;
  if (payload.phone !== undefined) patch.phone = payload.phone || null;
  if (payload.studentNo !== undefined) patch.student_no = payload.studentNo;
  if (payload.isActive !== undefined) patch.is_active = Boolean(payload.isActive);
  if (payload.mustChangePassword !== undefined) {
    patch.must_change_password = Boolean(payload.mustChangePassword);
  }

  const updatedRows = await supabaseRequest({
    method: "PATCH",
    path: "/rest/v1/users",
    searchParams: {
      id: `eq.${studentId}`,
      role: "eq.student",
    },
    headers: { Prefer: "return=representation" },
    body: patch,
  });

  if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
    throw new AppError(404, "学生不存在");
  }

  const rows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/users",
    searchParams: {
      select:
        "id,username,full_name,email,phone,student_no,is_active,must_change_password,created_at,updated_at",
      id: `eq.${studentId}`,
      role: "eq.student",
      limit: 1,
    },
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(404, "学生不存在");
  }
  return normalizeStudent(rows[0]);
}

async function deleteStudent(studentId) {
  const updatedRows = await supabaseRequest({
    method: "PATCH",
    path: "/rest/v1/users",
    searchParams: {
      id: `eq.${studentId}`,
      role: "eq.student",
    },
    headers: { Prefer: "return=representation" },
    body: {
      is_active: false,
    },
  });
  if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
    throw new AppError(404, "学生不存在");
  }
  return { id: studentId };
}

function parseCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new AppError(400, "CSV 至少包含表头和一行数据");
  }

  const headers = lines[0].split(",").map((s) => s.trim());
  const required = ["username", "password", "fullName", "studentNo"];
  const miss = required.filter((key) => !headers.includes(key));
  if (miss.length > 0) {
    throw new AppError(400, `CSV 缺少字段: ${miss.join(", ")}`);
  }

  return lines.slice(1).map((line, idx) => {
    const cols = line.split(",").map((s) => s.trim());
    const row = {};
    headers.forEach((header, i) => {
      row[header] = cols[i] || "";
    });
    return {
      rowNo: idx + 1,
      username: row.username,
      password: row.password,
      fullName: row.fullName,
      email: row.email || null,
      phone: row.phone || null,
      studentNo: row.studentNo,
    };
  });
}

async function importStudentsFromCsv({ fileName, csvText, overwrite }) {
  const rows = parseCsv(csvText);

  const batchRows = await supabaseRequest({
    method: "POST",
    path: "/rest/v1/student_import_batches",
    headers: { Prefer: "return=representation" },
    body: {
      file_name: fileName || "students.csv",
      status: "pending",
      created_by: null,
      overwrite_existing: Boolean(overwrite),
    },
  });

  const batch = batchRows?.[0];
  if (!batch?.id) {
    throw new AppError(500, "创建导入批次失败");
  }

  const importRows = rows.map((row) => ({
    batch_id: batch.id,
    row_no: row.rowNo,
    username: row.username,
    password_plain: row.password,
    full_name: row.fullName,
    email: row.email,
    phone: row.phone,
    student_no: row.studentNo,
  }));

  await supabaseRequest({
    method: "POST",
    path: "/rest/v1/student_import_rows",
    body: importRows,
  });

  const summary = await supabaseRequest({
    method: "POST",
    path: "/rest/v1/rpc/import_students_from_batch",
    body: {
      p_batch_id: batch.id,
      p_operator_user_id: null,
      p_overwrite: Boolean(overwrite),
    },
  });

  const detailRows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/student_import_rows",
    searchParams: {
      select: "row_no,username,imported,error_message",
      batch_id: `eq.${batch.id}`,
      order: "row_no.asc",
    },
  });

  return {
    batchId: batch.id,
    summary: Array.isArray(summary) ? summary[0] : summary,
    detail: detailRows,
  };
}

module.exports = {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudentsFromCsv,
};
