# Express Auth Server

## 目录结构建议

```text
server/
  src/
    config/
      env.js                # 读取并校验环境变量
    data/
      users.js              # 演示账号数据（来自 env）
    middlewares/
      authenticateToken.js  # 验证是否登录（JWT）
      requireRole.js        # 验证角色（student/admin）
    routes/
      auth.routes.js        # 登录、获取当前用户
      student.routes.js     # 学生受保护接口
      admin.routes.js       # 管理员受保护接口
    utils/
      jwt.js                # token 签发与校验
    app.js                  # Express 应用组装
    index.js                # 启动入口
```

## 中间件职责

- `authenticateToken`
- 解析 `Authorization: Bearer <token>`
- 验证 JWT 是否有效
- 有效则把用户信息挂到 `req.user`
- 无效返回 `401`

- `requireRole("student" | "admin")`
- 在已经登录的前提下检查 `req.user.role`
- 角色不匹配返回 `403`

## 启动

1. 根目录创建 `.env`（可复制 `.env.example`）
2. 安装依赖：`npm install`
3. 启动 Next：`npm run dev`
4. 启动 Express：`npm run dev:server`

## 鉴权验证步骤（建议按顺序）

1. 未登录访问前端保护页
- 打开 `http://localhost:3000/student/exams`
- 预期：自动跳转 `/login`

2. 学生登录
- 在登录页选择“学生”
- 输入 `.env` 中的 `STUDENT_EMAIL` / `STUDENT_PASSWORD`
- 预期：跳转到 `/student/exams`

3. 学生访问管理员接口（越权测试）
- 先登录学生，再调用：
- `GET http://localhost:4000/api/admin/dashboard`（带学生 token）
- 预期：`403`

4. 管理员登录
- 重新登录，选择“管理员”
- 输入 `.env` 中的 `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- 预期：跳转到 `/admin`

5. 管理员访问学生接口（越权测试）
- 调用 `GET http://localhost:4000/api/student/profile`（带管理员 token）
- 预期：`403`

6. 角色正确访问
- 学生 token 访问 `/api/student/profile` 返回 `200`
- 管理员 token 访问 `/api/admin/dashboard` 返回 `200`

