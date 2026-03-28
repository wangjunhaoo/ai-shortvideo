# 桌面单机版迁移蓝图
- 目标：保留创作类功能，移除余额/计费，改造成无需自建服务器的桌面单机产品。
- 推荐架构：Electron Shell + React SPA Renderer + Local Engine + SQLite + 本地文件系统。
- 必删运行时：本地 Next server、Redis、BullMQ、Prisma runtime generate、HTTP 自调用、SSE。
- 高复用区：src/lib 下生成、媒体、模型、提示词、storage、novel-promotion 等业务模块；messages、standards、lib 资源。
- 低复用区：src/app/api、auth、billing、desktop/main.cjs 当前服务编排。
- UI 迁移重点：src/app/[locale]/workspace、asset-hub、profile(API 配置)；改为 SPA + IPC hooks。
- 首批实施：先抽 core 与 shared contracts，再做 engine，本地 JobRunner 与 SQLite schema，最后迁 renderer。