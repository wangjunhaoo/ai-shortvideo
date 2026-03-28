# 模块地图
- `src/app`：Next.js 页面与 API 路由，核心业务入口。
- `src/lib`：领域逻辑、任务编排、存储、模型配置、日志、Worker 处理器等。
- `desktop`：Electron 主进程与桌面运行时集成。
- `scripts`：构建、守护、桌面打包辅助脚本、各种 guard/check。
- `prisma`：数据库 schema，桌面模式额外使用 `schema.sqlite.prisma`。
- `messages`：中英文国际化文案。
- `standards`：模型能力、定价等规范数据。
- `tests`：unit/integration/system/regression/contract 测试。