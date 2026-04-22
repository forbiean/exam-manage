const { AppError } = require("../utils/appError");
const { supabaseRequest } = require("../lib/supabase");

function normalizeExam(record, questionIds = []) {
  return {
    id: record.id,
    title: record.title,
    description: record.description || "",
    durationMinutes: record.duration_minutes,
    status: record.status,
    startTime: record.start_time,
    endTime: record.end_time,
    totalScore: record.total_score ?? 0,
    questionCount: record.question_count ?? 0,
    questionIds,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function normalizeQuestion(record) {
  return {
    id: record.id,
    type: record.type === "short" ? "essay" : record.type,
    stem: record.stem,
    options: Array.isArray(record.options) ? record.options : [],
    score: Number(record.score) || 0,
  };
}

async function getExamsForStudent() {
  const exams = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/exams",
    searchParams: {
      select:
        "id,title,description,duration_minutes,status,start_time,end_time,total_score,question_count,created_at,updated_at",
      status: "neq.draft",
      order: "start_time.desc.nullslast,created_at.desc",
    },
  });

  const examRows = Array.isArray(exams) ? exams : [];
  if (examRows.length === 0) return [];

  const examIds = examRows.map((item) => item.id).join(",");
  const mappings = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/exam_questions",
    searchParams: {
      select: "exam_id,question_id,sort_order",
      exam_id: `in.(${examIds})`,
      order: "sort_order.asc",
    },
  });

  const grouped = new Map();
  (Array.isArray(mappings) ? mappings : []).forEach((row) => {
    const arr = grouped.get(row.exam_id) || [];
    arr.push(row.question_id);
    grouped.set(row.exam_id, arr);
  });

  return examRows.map((row) => normalizeExam(row, grouped.get(row.id) || []));
}

async function getExamPaperForStudent(examId) {
  const exams = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/exams",
    searchParams: {
      select:
        "id,title,description,duration_minutes,status,start_time,end_time,total_score,question_count,created_at,updated_at",
      id: `eq.${examId}`,
      status: "neq.draft",
      limit: 1,
    },
  });

  if (!Array.isArray(exams) || exams.length === 0) {
    throw new AppError(404, "考试不存在");
  }
  const exam = exams[0];

  const mappings = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/exam_questions",
    searchParams: {
      select: "question_id,sort_order",
      exam_id: `eq.${examId}`,
      order: "sort_order.asc",
    },
  });

  const questionIds = (Array.isArray(mappings) ? mappings : []).map((item) => item.question_id);
  if (questionIds.length === 0) {
    return { exam: normalizeExam(exam, []), questions: [] };
  }

  const questionRows = await supabaseRequest({
    method: "GET",
    path: "/rest/v1/questions",
    searchParams: {
      select: "id,type,stem,options,score,is_active",
      id: `in.(${questionIds.join(",")})`,
      is_active: "eq.true",
    },
  });

  const questionMap = new Map(
    (Array.isArray(questionRows) ? questionRows : []).map((item) => [item.id, normalizeQuestion(item)])
  );

  const sortedQuestions = questionIds.map((id) => questionMap.get(id)).filter(Boolean);
  return {
    exam: normalizeExam(exam, questionIds),
    questions: sortedQuestions,
  };
}

module.exports = {
  getExamsForStudent,
  getExamPaperForStudent,
};
