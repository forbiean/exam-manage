const { randomUUID } = require("crypto");

const db = {
  questions: [
    {
      id: "q-1",
      type: "single",
      stem: "Node.js 默认运行时是什么？",
      options: ["浏览器", "V8", "JVM", "CLR"],
      answer: "V8",
      analysis: "Node.js 基于 Chrome 的 V8 引擎。",
    },
    {
      id: "q-2",
      type: "judge",
      stem: "Express 是 Node.js 的 Web 框架。",
      options: ["true", "false"],
      answer: "true",
      analysis: "这是正确描述。",
    },
    {
      id: "q-3",
      type: "short",
      stem: "简述 JWT 的基本组成。",
      options: [],
      answer: null,
      analysis: "简答题需人工复核。",
    },
  ],
  exams: [],
  submissions: [],
};

function generateId(prefix) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

module.exports = {
  db,
  generateId,
};

