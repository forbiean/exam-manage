# ExamHub Express API（在线考试）

## 1. 目录结构（分层）

```text
server/
  src/
    config/
      env.js                          # 读取并校验环境变量
    controllers/
      auth.controller.js              # 登录、当前用户
      admin.controller.js             # 管理员接口编排
      student.controller.js           # 学生接口编排
    db/
      memory.js                       # 内存数据库（示例用）
      repositories/
        question.repository.js        # 题目数据访问
        exam.repository.js            # 考试数据访问
        submission.repository.js      # 提交记录数据访问
    data/
      users.js                        # 登录账号（来自环境变量）
    middlewares/
      authenticateToken.js            # JWT 登录校验
      requireRole.js                  # 角色权限校验
      errorHandler.js                 # 404 + 全局错误处理
    routes/
      auth.routes.js                  # /api/auth/*
      admin.routes.js                 # /api/admin/*
      student.routes.js               # /api/student/*
    services/
      question.service.js             # 题库业务
      exam.service.js                 # 考试业务
      submission.service.js           # 开考/交卷/判分/历史成绩
    utils/
      jwt.js                          # 签发与解析 JWT
      response.js                     # 统一成功响应
      appError.js                     # 业务错误对象
    app.js                            # Express 组装
    index.js                          # 启动入口
```

## 2. 中间件职责

- `authenticateToken`
  - 从 `Authorization: Bearer <token>` 读取 JWT
  - 验证登录态，失败返回 `401`
  - 成功后把用户信息放到 `req.user`

- `requireRole("student" | "admin")`
  - 校验 `req.user.role`
  - 角色不符返回 `403`

- `errorHandler` / `notFoundHandler`
  - 所有未匹配路由返回 `404`
  - 所有业务异常统一返回 JSON 错误结构

## 3. 统一 JSON 返回格式

成功：

```json
{
  "success": true,
  "message": "xxx",
  "data": {}
}
```

失败：

```json
{
  "success": false,
  "message": "xxx",
  "data": null
}
```

## 4. 接口清单

### 认证

- `POST /api/auth/login`
- `GET /api/auth/me`

### 管理员（需 admin token）

- `GET /api/admin/questions` 题库列表
- `POST /api/admin/questions` 创建题目
- `PATCH /api/admin/questions/:questionId` 修改题目
- `GET /api/admin/exams` 考试列表
- `POST /api/admin/exams` 创建考试
- `PATCH /api/admin/exams/:examId/publish` 发布考试
- `GET /api/admin/submissions` 查看所有提交记录

### 学生（需 student token）

- `GET /api/student/exams` 查看已发布考试
- `POST /api/student/exams/:examId/start` 开始考试并创建 submission
- `POST /api/student/submissions/:submissionId/submit` 提交答案并自动判分
- `GET /api/student/history` 查看自己的历史成绩

## 5. 判分规则

- `single`（单选）: 自动判分，答对 +1。
- `judge`（判断）: 自动判分，答对 +1。
- `short`（简答）: 不自动计分，`reviewStatus = "pending_review"`，并将 `needsManualReview = true`。

## 6. 环境变量（不要硬编码）

请在项目根目录 `.env` 中配置（可复制 `.env.example`）：

```env
PORT=4000
JWT_SECRET=please_change_this_secret
JWT_EXPIRES_IN=2h
CORS_ORIGIN=http://localhost:3000

STUDENT_EMAIL=student@example.com
STUDENT_PASSWORD=student123
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

## 7. 如何测试每个接口（PowerShell）

先启动后端：

```powershell
npm run dev:server
```

### 7.1 登录并保存 token

管理员登录：

```powershell
$adminLogin = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@example.com","password":"admin123"}'
$adminToken = $adminLogin.data.token
```

学生登录：

```powershell
$studentLogin = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/login" -ContentType "application/json" -Body '{"email":"student@example.com","password":"student123"}'
$studentToken = $studentLogin.data.token
```

### 7.2 管理员维护题库

创建单选题：

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/admin/questions" -Headers @{ Authorization = "Bearer $adminToken" } -ContentType "application/json" -Body '{"type":"single","stem":"2+2=?","options":["3","4","5"],"answer":"4","analysis":"基础算术"}'
```

查看题库：

```powershell
$questions = Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/admin/questions" -Headers @{ Authorization = "Bearer $adminToken" }
$questions.data
```

### 7.3 管理员创建并发布考试

取前 3 道题 ID 创建考试：

```powershell
$qids = $questions.data | Select-Object -First 3 | ForEach-Object { $_.id }
$body = @{ title = "Node 基础测验"; questionIds = $qids; status = "draft" } | ConvertTo-Json
$examResp = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/admin/exams" -Headers @{ Authorization = "Bearer $adminToken" } -ContentType "application/json" -Body $body
$examId = $examResp.data.id
```

发布考试：

```powershell
Invoke-RestMethod -Method Patch -Uri "http://localhost:4000/api/admin/exams/$examId/publish" -Headers @{ Authorization = "Bearer $adminToken" }
```

### 7.4 学生查看考试并开始考试

查看已发布考试：

```powershell
$published = Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/student/exams" -Headers @{ Authorization = "Bearer $studentToken" }
$published.data
```

开始考试（创建 submission）：

```powershell
$start = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/student/exams/$examId/start" -Headers @{ Authorization = "Bearer $studentToken" }
$submissionId = $start.data.id
```

### 7.5 学生交卷并验证自动判分

提交答案（其中简答题会被标记待复核）：

```powershell
$submitBody = @{
  answers = @(
    @{ questionId = $qids[0]; answer = "V8" },
    @{ questionId = $qids[1]; answer = "true" },
    @{ questionId = $qids[2]; answer = "JWT 包含 header、payload、signature" }
  )
} | ConvertTo-Json -Depth 5

$submitResp = Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/student/submissions/$submissionId/submit" -Headers @{ Authorization = "Bearer $studentToken" } -ContentType "application/json" -Body $submitBody
$submitResp.data
```

你应看到：
- `objectiveScore` 为客观题得分
- `answers` 中简答题 `reviewStatus = "pending_review"`
- `needsManualReview = true`

### 7.6 学生历史成绩

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/student/history" -Headers @{ Authorization = "Bearer $studentToken" }
```

### 7.7 管理员查看全部提交

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/admin/submissions" -Headers @{ Authorization = "Bearer $adminToken" }
```

### 7.8 权限是否生效（重点）

- 学生 token 调 `/api/admin/questions`，应返回 `403`。
- 管理员 token 调 `/api/student/history`，应返回 `403`。
- 不带 token 调 `/api/student/exams`，应返回 `401`。

