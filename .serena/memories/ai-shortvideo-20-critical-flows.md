# 关键链路
- Web/桌面启动链路：Next 服务 + Worker + Watchdog + Redis；桌面入口为 `desktop/main.cjs`，通过 `process.execPath + ELECTRON_RUN_AS_NODE=1` 启动 Node 子进程。
- 桌面启动前置：运行时配置写入用户目录，Prisma Client 就绪检查，`prisma db push`，再依次拉起 Redis / Next / Worker / Watchdog。
- AI 业务链路：API 路由进入 `src/app/api/**`，领域与任务逻辑下沉到 `src/lib/**`，BullMQ 负责任务执行与队列。
- 媒体处理链路：多处路由和 worker 依赖 `sharp` 进行图片元数据、裁剪、压缩与参考图处理。