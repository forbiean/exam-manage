<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ExamHub - 在线考试与管理系统

## 技术栈

- **Next.js**: 16.2.4 (App Router)
- **React**: 19.2.4
- **TypeScript**: ^5
- **Tailwind CSS**: v4
- **shadcn/ui**: 组件库
- **Lucide React**: 图标库

## 页面路由清单

### 学生端

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 产品展示页，含 Hero、功能特性 |
| `/login` | 登录页 | 学生/管理员角色切换登录 |
| `/student/exams` | 考试列表 | 展示进行中和已结束的考试 |
| `/student/exams/[id]` | 答题页 | 在线答题，支持单选/判断/简答 |
| `/student/history` | 历史成绩 | 查看考试记录和成绩统计 |

### 管理端

| 路由 | 页面 | 说明 |
|------|------|------|
| `/admin` | 后台概览 | 数据统计仪表盘 |
| `/admin/exams` | 考试管理 | 创建、编辑、发布考试 |
| `/admin/questions` | 题库管理 | 单选/判断/简答题维护 |
| `/admin/students` | 学生管理 | 学生账号增删改查与批量导入 |
| `/admin/submissions` | 提交记录 | 学生提交查看与人工复核 |
| `/admin/scores` | 成绩统计 | 扩展功能，成绩分析 |

## 开发注意事项

### 1. 静态导出配置

项目配置了 `output: "export"`，所有页面会在构建时生成静态 HTML：

```ts
// next.config.ts
const nextConfig = {
  output: "export",
  distDir: "dist",
  images: { unoptimized: true },
};
```

### 2. 动态路由必须提供 generateStaticParams

使用 `output: "export"` 时，所有动态路由 `[id]` 必须在 page.tsx 中导出 `generateStaticParams()`：

```tsx
// app/student/exams/[id]/page.tsx
import { mockExams } from "@/lib/mock-data";

export function generateStaticParams() {
  return mockExams.map((exam) => ({
    id: exam.id,
  }));
}
```

**注意**：`generateStaticParams` 必须在服务端组件中导出，不能与 `"use client"` 共存。如果页面需要客户端交互，应将逻辑拆分到单独的 Client Component 中。

### 3. 客户端组件与服务端组件分离

当动态路由需要客户端状态（useState/useEffect 等）时，采用以下模式：

```
app/student/exams/[id]/
├── page.tsx              # 服务端组件，导出 generateStaticParams
└── ExamTakingClient.tsx  # 客户端组件，"use client"
```

### 4. 数据来源（重要）

- 前端页面仍有部分模块使用 `src/lib/mock-data.ts` 做演示。
- 登录与管理员学生管理已接入 Supabase。
- 不要将管理员登录来源回退到 `.env` mock 账号校验。

当前真实接口相关：
- `POST /api/auth/login`：后端通过 Supabase 校验账号密码
- `GET/POST/PATCH/DELETE /api/admin/students*`：对 Supabase `public.users` 与导入表操作

### 5. 构建缓存问题

如遇到 Turbopack 缓存错误（如 `ENOENT: build-manifest.json`），清理构建缓存后重新构建：

```powershell
Remove-Item -Recurse -Force dist, .next
npm run build
```

### 6. 管理端布局

管理端页面统一使用 `AdminLayout` 组件（`src/components/admin-layout.tsx`），包含侧边栏导航和移动端响应式抽屉菜单。所有 `/admin/*` 页面都应包裹在 `<AdminLayout>` 中。

### 7. 组件规范

- 优先使用 shadcn/ui 组件
- 图标统一使用 `lucide-react`
- 样式使用 Tailwind CSS 工具类
- 颜色变量使用 shadcn 主题系统（如 `bg-primary`、`text-muted-foreground`）

### 8. Supabase 环境变量（后端必需）

启动 Express 前必须配置：

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

缺失会导致后端启动失败（`Missing required environment variables`）。

### 9. 学生批量导入约束

- 管理端学生导入页面：`/admin/students`
- 前端支持上传文件：`.csv/.xlsx/.xls`（不是手动粘贴文本）
- 解析后按 CSV 头字段导入，必需表头：
  - `username,password,fullName,studentNo`
- 可选字段：
  - `email,phone`
- 导入弹窗必须支持：
  - 前 5 行预览
  - 导入失败明细（有失败才显示）
