# 项目画像
- 仓库名：`ai-shortvideo`，产品名/桌面应用名：`waoowaoo`
- 业务目标：AI 影视 Studio，面向短剧/漫画视频制作，支持从小说文本生成角色、场景、分镜、配音与视频。
- 仓库形态：单仓库，Web 主应用 + Worker + Watchdog + Electron 桌面打包链路。
- 主技术栈：Next.js 15 App Router、React 19、TypeScript、Prisma、BullMQ、Redis、SQLite/MySQL、Electron 35、electron-builder。
- 运行模式：
  - 浏览器/服务端模式：Next.js + Worker/Watchdog + 外部依赖（MySQL/Redis/MinIO）。
  - Windows 桌面模式：Electron 启动内嵌 Next/Worker/Watchdog/Redis，数据落在用户目录。