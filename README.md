# ExamHub（在线考试与管理系统）

这是一个前后端分离的考试系统项目，包含：
- 学生端：登录、考试列表、在线答题、交卷、历史成绩
- 管理端：题库管理、考试管理、学生管理、提交记录与人工复核
- 后端：基于 Express + Supabase（PostgreSQL）提供 API

本 README 按 0 基础视角编写，你可以直接照步骤跑起来。

## 1. 技术栈

- 前端：Next.js 16.2.4（App Router）、React 19、TypeScript、Tailwind CSS v4、shadcn/ui
- 后端：Express 5、JWT 鉴权
- 数据库：Supabase（PostgreSQL）

## 2. 项目结构

```text
exam-manage/
├─ src/                    # Next.js 前端
├─ server/                 # Express 后端
│  ├─ src/
│  └─ sql/                 # Supabase 初始化 SQL
├─ .env.example
├─ package.json
└─ README.md
```

## 3. 运行前准备

你需要先安装：
- Node.js（建议 20+）
- npm（Node 安装后自带）
- 一个 Supabase 项目（可用免费版）

## 4. 第一步：安装依赖

在项目根目录执行：

```bash
npm install
```

## 5. 第二步：初始化 Supabase 数据库

1. 打开 Supabase 控制台，进入你的项目。
2. 进入 SQL Editor，按顺序执行以下 3 个文件内容：
   1. `server/sql/supabase_init.sql`
   2. `server/sql/supabase_exam_modules.sql`
   3. `server/sql/supabase_exam_demo_seed.sql`（可选，用于导入演示数据）

说明：
- `supabase_init.sql` 会创建 `users` 表、登录函数、导入学生函数，并插入默认管理员。
- 默认管理员账号：`admin`
- 默认管理员密码：`admin@123456`

## 6. 第三步：配置环境变量

1. 复制 `.env.example` 为 `.env`
2. 按你的实际值修改

示例：

```env
PORT=4000
JWT_SECRET=please_change_this_secret
JWT_EXPIRES_IN=2h
CORS_ORIGIN=http://localhost:3000

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

说明：
- `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY` 是后端必须项，缺失会启动失败。
- `NEXT_PUBLIC_API_BASE_URL` 是前端请求后端 API 的地址。

## 7. 第四步：启动项目

你需要开 2 个终端窗口。

终端 A（启动后端）：

```bash
npm run dev:server
```

终端 B（启动前端）：

```bash
npm run dev
```

启动后访问：
- 前端：http://localhost:3000
- 后端健康检查：http://localhost:4000/api/health

## 8. 如何登录与体验

### 8.1 管理员登录
- 账号：`admin`
- 密码：`admin@123456`
- 入口页：`/login`

### 8.2 学生登录
- 如果执行了 `supabase_exam_demo_seed.sql`，可使用其中演示学生账号。
- 或在管理员端“学生管理”里创建/导入学生账号后登录。

## 9. 关键业务规则（已实现）

### 9.1 学生端考试列表分组
- `进行中`：已发布且当前时间在考试开始~截止之间
- `其他`：除草稿外的其他考试

### 9.2 交卷状态流转
- 仅客观题（单选/判断）：
  - 交卷后自动判分
  - 管理端显示 `已评阅`
  - 学生历史显示 `已出分`
- 含简答题：
  - 交卷后进入 `待复核`
  - 管理端显示 `待复核`
  - 学生历史显示 `待评阅`

### 9.3 管理员人工复核
- 在“提交记录”中点“查看”
- 输入简答题得分后可“保存评阅”
- 输入规则：
  - 必填
  - 必须为整数
  - 范围：`0 ~ 所有简答题分值之和`
- 保存后该记录变为 `已评阅`，总分同步更新

## 10. 常用脚本

```bash
# 前端开发
npm run dev

# 后端开发
npm run dev:server

# 前端构建
npm run build

# 前端生产启动
npm run start

# 后端生产启动
npm run start:server

# 代码检查
npm run lint
```

## 11. 常见问题

### 11.1 后端启动报错：Missing required environment variables
原因：`.env` 缺少 Supabase 配置。  
处理：补齐 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`。

### 11.2 前端请求失败或 401
常见原因：
- `NEXT_PUBLIC_API_BASE_URL` 配置不对
- 后端没启动
- 登录 token 过期

### 11.3 Next 构建缓存异常（如 build-manifest 相关报错）
可执行：

```powershell
Remove-Item -Recurse -Force dist, .next
npm run build
```

## 12. 主要路由

学生端：
- `/login`
- `/student/exams`
- `/student/exams/[id]`
- `/student/history`

管理端：
- `/admin`
- `/admin/questions`
- `/admin/exams`
- `/admin/students`
- `/admin/submissions`
- `/admin/scores`

## 13. API 简表

认证：
- `POST /api/auth/login`
- `GET /api/auth/me`

学生：
- `GET /api/student/exams`
- `GET /api/student/exams/:examId`
- `POST /api/student/exams/:examId/start`
- `POST /api/student/submissions/:submissionId/submit`
- `GET /api/student/history`

管理员：
- `GET /api/admin/questions`
- `POST /api/admin/questions`
- `PATCH /api/admin/questions/:questionId`
- `PATCH /api/admin/questions/:questionId/activate`
- `DELETE /api/admin/questions/:questionId`
- `GET /api/admin/exams`
- `POST /api/admin/exams`
- `PATCH /api/admin/exams/:examId/questions`
- `PATCH /api/admin/exams/:examId/publish`
- `DELETE /api/admin/exams/:examId`
- `GET /api/admin/submissions`
- `GET /api/admin/submissions/:submissionId`
- `PATCH /api/admin/submissions/:submissionId/review`
- `GET /api/admin/students`
- `POST /api/admin/students`
- `PATCH /api/admin/students/:studentId`
- `DELETE /api/admin/students/:studentId`
- `POST /api/admin/students/import`
