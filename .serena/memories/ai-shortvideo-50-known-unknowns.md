# 未决问题与假设
- 当前桌面安装日志里存在一条较早的 `sharp` 加载失败记录，但在当前安装目录下直接 `require('sharp')` 与 Electron `ELECTRON_RUN_AS_NODE=1` 模式都可成功，推断这更像旧构建残留问题。
- 2026-03-21 复查时，真正可复现的桌面启动阻塞是 `next start` 在运行时读取 `next.config.ts`，由于安装包不包含 `typescript` 而失败；已改为 `next.config.mjs` 规避该依赖。
- 桌面日志目录下没有单独的 `desktop-main.log`，主进程失败主要依赖弹窗和控制台输出定位。
- 仓库存在未提交改动时需要先确认是否与当前任务冲突，避免覆盖用户工作。