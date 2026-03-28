# 环境与发布
- 本地开发：先复制 `.env.example` 为 `.env`，再安装依赖；基础设施通常通过 `docker compose up mysql redis minio -d` 启动。
- 常用命令：
  - `npm run dev`：并发启动 Next / Worker / Watchdog / Bull Board。
  - `npm run build`：Prisma generate + Next build。
  - `npm run desktop:prepare`：桌面构建前准备（sqlite schema、Prisma、Web build）。
  - `npm run desktop:sync:redis:win`：同步 Windows Redis 二进制。
  - `npm run desktop:pack` / `npm run desktop:dist`：生成 NSIS 安装包。
- Docker：`Dockerfile` 采用多阶段构建，运行态仍携带部分 dev 工具以支持 `tsx` 启动 worker/watchdog。
- CI：README 提到 Windows 桌面构建工作流 `.github/workflows/desktop-windows.yml`。