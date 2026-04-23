# ExamHub 部署版 README

本文是生产部署文档，适用于你当前项目形态：
- 前端：Next.js 静态导出（`output: "export"`，产物目录 `dist`）
- 后端：Node.js + Express（建议用 PM2 常驻）
- 数据库：Supabase（云端）
- 网关：Nginx（反向代理 + 静态资源 + HTTPS）

## 1. 部署架构（推荐）

- `https://exam.example.com` -> Nginx -> 前端静态文件（`/var/www/exam-manage/dist`）
- `https://exam.example.com/api/*` -> Nginx 反向代理 -> `http://127.0.0.1:4000`
- 后端进程由 PM2 管理，开机自启

## 2. 服务器准备

推荐环境：
- Ubuntu 22.04 / 24.04
- Node.js 20+
- Nginx
- PM2

安装基础软件：

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

## 3. 拉取代码与安装依赖

```bash
cd /opt
sudo git clone <你的仓库地址> exam-manage
cd /opt/exam-manage
sudo npm install
```

## 4. 配置环境变量

在项目根目录创建 `.env`（可先复制 `.env.example`）：

```bash
cp .env.example .env
```

至少要正确填写这些值：

```env
PORT=4000
JWT_SECRET=请改成强随机字符串
JWT_EXPIRES_IN=2h
CORS_ORIGIN=https://exam.example.com
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_API_BASE_URL=https://exam.example.com

# 当前后端代码要求这四项存在（即使你不使用这两个账号）
STUDENT_EMAIL=student@example.com
STUDENT_PASSWORD=student123
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

说明：
- `CORS_ORIGIN` 必须是你前端正式域名。
- 前端是静态导出，`NEXT_PUBLIC_API_BASE_URL` 在构建时写入，改了后需重新 `npm run build`。

## 5. 初始化 Supabase（首次部署）

在 Supabase SQL Editor 依次执行：
1. `server/sql/supabase_init.sql`
2. `server/sql/supabase_exam_modules.sql`
3. `server/sql/supabase_exam_demo_seed.sql`（可选，仅演示数据）

## 6. 构建前端静态文件

```bash
cd /opt/exam-manage
npm run build
```

构建后会生成：
- `dist/`（可直接作为静态站点目录）

## 7. 启动后端（PM2）

```bash
cd /opt/exam-manage
pm2 start server/src/index.js --name examhub-api
pm2 save
pm2 startup
```

检查状态：

```bash
pm2 ls
pm2 logs examhub-api
```

## 8. 配置 Nginx

新建站点配置（示例）：

```bash
sudo nano /etc/nginx/sites-available/examhub.conf
```

写入（把域名改成你的）：

```nginx
server {
    listen 80;
    server_name exam.example.com;

    root /opt/exam-manage/dist;
    index index.html;

    # 前端静态资源
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用并重载：

```bash
sudo ln -s /etc/nginx/sites-available/examhub.conf /etc/nginx/sites-enabled/examhub.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 9. 配置 HTTPS（Let’s Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d exam.example.com
```

证书自动续期检查：

```bash
sudo certbot renew --dry-run
```

## 10. 上线后自检清单

1. `https://exam.example.com` 可打开前端页面
2. `https://exam.example.com/api/health` 返回成功
3. 管理员能登录
4. 学生能进入考试并交卷
5. 管理员提交记录可查看并评阅

## 11. 日常更新流程

```bash
cd /opt/exam-manage
git pull
npm install
npm run build
pm2 restart examhub-api
sudo systemctl reload nginx
```

说明：
- 只改后端：可不执行 `npm run build`
- 改了前端或 `.env` 里的 `NEXT_PUBLIC_*`：必须重新 `npm run build`

## 12. 回滚（简单版）

做法建议：
- 每次发布前打 tag 或备份目录
- 出问题后回退到上一版本：

```bash
cd /opt/exam-manage
git checkout <上一个稳定tag或commit>
npm install
npm run build
pm2 restart examhub-api
sudo systemctl reload nginx
```

## 13. 常见问题

### 13.1 后端启动失败：Missing required environment variables
- `.env` 缺失必填项，按第 4 节补齐。

### 13.2 前端调用 API 401 或跨域报错
- 检查 `CORS_ORIGIN` 是否等于线上前端域名（含协议）。
- 检查 Nginx 是否正确代理 `/api/`。

### 13.3 页面还是旧版本
- 确认 `npm run build` 成功。
- 检查 Nginx `root` 是否指向 `/opt/exam-manage/dist`。
- 清浏览器缓存后再试。

