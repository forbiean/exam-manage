export interface Question {
  id: string;
  type: "single" | "judge" | "essay";
  stem: string;
  options?: string[];
  correctAnswer?: string;
  score: number;
  category: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: "draft" | "published" | "closed";
  startTime: string;
  endTime: string;
  totalScore: number;
  questionCount: number;
  questions?: string[];
}

export interface Submission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  status: "in_progress" | "submitted" | "reviewed";
  totalScore?: number;
  maxScore: number;
  submittedAt?: string;
  answers: Record<string, string>;
}

export interface ScoreStat {
  examId: string;
  examTitle: string;
  avgScore: number;
  passRate: number;
  totalSubmissions: number;
  maxScore: number;
}

export const mockQuestions: Question[] = [
  {
    id: "q1",
    type: "single",
    stem: "以下哪个不是 JavaScript 的基本数据类型？",
    options: ["String", "Number", "Boolean", "Array"],
    correctAnswer: "D",
    score: 5,
    category: "编程基础",
  },
  {
    id: "q2",
    type: "single",
    stem: "HTTP 协议默认使用的端口号是？",
    options: ["21", "80", "443", "8080"],
    correctAnswer: "B",
    score: 5,
    category: "网络基础",
  },
  {
    id: "q3",
    type: "judge",
    stem: "CSS 是层叠样式表的缩写。",
    correctAnswer: "A",
    score: 3,
    category: "编程基础",
  },
  {
    id: "q4",
    type: "single",
    stem: "在 React 中，用于管理状态的内置 Hook 是？",
    options: ["useEffect", "useState", "useContext", "useReducer"],
    correctAnswer: "B",
    score: 5,
    category: "前端框架",
  },
  {
    id: "q5",
    type: "essay",
    stem: "请简述 RESTful API 的设计原则。",
    score: 10,
    category: "架构设计",
  },
  {
    id: "q6",
    type: "single",
    stem: "以下哪个命令用于在 Git 中创建新分支？",
    options: ["git checkout", "git branch", "git merge", "git commit"],
    correctAnswer: "B",
    score: 5,
    category: "版本控制",
  },
  {
    id: "q7",
    type: "judge",
    stem: "Docker 容器与虚拟机相比，启动速度更快。",
    correctAnswer: "A",
    score: 3,
    category: "运维部署",
  },
  {
    id: "q8",
    type: "essay",
    stem: "请描述数据库索引的作用及使用场景。",
    score: 10,
    category: "数据库",
  },
];

export const mockExams: Exam[] = [
  {
    id: "e1",
    title: "前端开发基础测试",
    description: "涵盖 HTML、CSS、JavaScript 基础知识的综合测试。",
    durationMinutes: 60,
    status: "published",
    startTime: "2026-04-20T09:00:00",
    endTime: "2026-04-27T23:59:59",
    totalScore: 100,
    questionCount: 20,
    questions: ["q1", "q3", "q4", "q6"],
  },
  {
    id: "e2",
    title: "计算机网络原理",
    description: "网络协议、OSI 模型、TCP/IP 等核心概念测试。",
    durationMinutes: 90,
    status: "published",
    startTime: "2026-04-22T10:00:00",
    endTime: "2026-04-29T23:59:59",
    totalScore: 100,
    questionCount: 25,
    questions: ["q2", "q7"],
  },
  {
    id: "e3",
    title: "系统架构设计",
    description: "微服务、分布式系统、数据库设计等高级主题。",
    durationMinutes: 120,
    status: "draft",
    startTime: "2026-05-01T09:00:00",
    endTime: "2026-05-10T23:59:59",
    totalScore: 150,
    questionCount: 15,
    questions: ["q5", "q8"],
  },
  {
    id: "e4",
    title: "数据库优化专项",
    description: "索引优化、查询优化、事务管理等数据库进阶内容。",
    durationMinutes: 45,
    status: "closed",
    startTime: "2026-03-15T09:00:00",
    endTime: "2026-03-20T23:59:59",
    totalScore: 50,
    questionCount: 10,
    questions: ["q8"],
  },
];

export const mockSubmissions: Submission[] = [
  {
    id: "s1",
    examId: "e1",
    examTitle: "前端开发基础测试",
    studentId: "stu1",
    studentName: "张三",
    status: "reviewed",
    totalScore: 85,
    maxScore: 100,
    submittedAt: "2026-04-21T10:30:00",
    answers: { q1: "D", q3: "A", q4: "B", q6: "B" },
  },
  {
    id: "s2",
    examId: "e1",
    examTitle: "前端开发基础测试",
    studentId: "stu2",
    studentName: "李四",
    status: "submitted",
    maxScore: 100,
    submittedAt: "2026-04-21T11:00:00",
    answers: { q1: "A", q3: "A", q4: "B", q6: "C" },
  },
  {
    id: "s3",
    examId: "e2",
    examTitle: "计算机网络原理",
    studentId: "stu1",
    studentName: "张三",
    status: "reviewed",
    totalScore: 72,
    maxScore: 100,
    submittedAt: "2026-04-21T14:00:00",
    answers: { q2: "B", q7: "A" },
  },
  {
    id: "s4",
    examId: "e4",
    examTitle: "数据库优化专项",
    studentId: "stu3",
    studentName: "王五",
    status: "reviewed",
    totalScore: 45,
    maxScore: 50,
    submittedAt: "2026-03-18T16:00:00",
    answers: { q8: "索引可以加快查询速度..." },
  },
];

export const mockScoreStats: ScoreStat[] = [
  {
    examId: "e1",
    examTitle: "前端开发基础测试",
    avgScore: 78.5,
    passRate: 82,
    totalSubmissions: 156,
    maxScore: 100,
  },
  {
    examId: "e2",
    examTitle: "计算机网络原理",
    avgScore: 71.2,
    passRate: 68,
    totalSubmissions: 89,
    maxScore: 100,
  },
  {
    examId: "e4",
    examTitle: "数据库优化专项",
    avgScore: 42.0,
    passRate: 75,
    totalSubmissions: 45,
    maxScore: 50,
  },
];

export function getExamById(id: string): Exam | undefined {
  return mockExams.find((e) => e.id === id);
}

export function getQuestionsByIds(ids: string[]): Question[] {
  return mockQuestions.filter((q) => ids.includes(q.id));
}

export function getSubmissionsByStudent(studentId: string): Submission[] {
  return mockSubmissions.filter((s) => s.studentId === studentId);
}

export function getSubmissionsByExam(examId: string): Submission[] {
  return mockSubmissions.filter((s) => s.examId === examId);
}
