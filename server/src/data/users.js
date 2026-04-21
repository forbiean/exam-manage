const { loadEnv } = require("../config/env");

function getMockUsers() {
  const env = loadEnv();
  return [
    {
      id: "u-student-1",
      email: env.STUDENT_EMAIL,
      password: env.STUDENT_PASSWORD,
      role: "student",
      name: "学生用户",
    },
    {
      id: "u-admin-1",
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      role: "admin",
      name: "管理员",
    },
  ];
}

function findUserByEmail(email) {
  return getMockUsers().find((user) => user.email === email);
}

module.exports = {
  findUserByEmail,
};

