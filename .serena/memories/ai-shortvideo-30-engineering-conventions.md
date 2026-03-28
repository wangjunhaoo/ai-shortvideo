# 工程约定
- 语言：仓库沟通与代码注释以简体中文为主。
- 代码风格：TypeScript/React 为主，命名清晰，避免兼容性残留代码；关键流程允许少量中文注释。
- 质量门禁：倾向严格构建，不保留 `ignoreBuildErrors` / `ignoreDuringBuilds`。
- 工具偏好：搜索优先 `rg`；代码理解优先 Serena 符号工具；编辑优先精确补丁。
- 运行时注意：桌面打包场景不能依赖 devDependency 在安装后动态补装；原生模块问题应尽量在启动前烟雾测试暴露。
- 已知当前仓库有一些现存 lint warning，但 `next build` 可完成。