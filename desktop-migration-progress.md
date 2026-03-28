# 桌面单机版迁移进度

## 当前基线
- 目标：保留创作功能，移除余额/计费，逐步从 `Electron + Next 内嵌服务` 迁移到 `Electron + Local Engine + Renderer + Shared Contracts`。
- 当前状态：桌面包可运行，但仍依赖 `Next/Auth/API/Prisma runtime`，属于“可交付折中版”，不是蓝图终态。

## 完成情况
- 已完成：本地任务执行器、运行时内存事件总线、计费接口桌面模式关闭、安装包与快速冒烟链路、`workers/handlers` 去 `BullMQ Job` 类型边界、`workers/handlers` 去 `prisma` 直连。
- 部分完成：`packages/engine` 与 `packages/core` 已启动并落下首批/次批模块；UI 与鉴权仍停留在 Next 体系。
- 未开始：`packages/renderer`、IPC hooks、本地身份体系、billing 代码彻底删除。

## 当前实施阶段
- 阶段：P1
- 目标：沿 `runtime-context + repositories` 继续收口 worker 业务层，逐步移除 `task/service` 与 `prisma` 直连。

## 本轮任务
- [x] 建立本地进度追踪文件
- [x] 建立 `packages/shared/contracts/task-job.ts`
- [x] 建立 `src/lib/workers/runtime-context.ts`
- [x] 将 `src/lib/workers/shared.ts`、`utils.ts` 切换到 `WorkerTaskJob`
- [x] 将 `src/lib/workers/*.worker.ts` 切换到 `WorkerTaskJob`
- [x] 将 `src/lib/workers/handlers/*.ts` 从 `Job<TaskJobData>` 切换到 `WorkerTaskJob`
- [x] 进行本地快速验证

## 本轮结果
- `packages/shared/contracts/task-job.ts` 已落地，形成首个跨运行时的任务作业契约。
- `src/lib/workers/runtime-context.ts` 已落地，`WorkerTaskJob`、`WorkerTaskHandler`、执行 logger 已统一出口。
- `src/lib/workers/shared.ts`、`utils.ts`、`*.worker.ts`、`handlers/*.ts` 已切到 `WorkerTaskJob`，`BullMQ Job` 不再是 worker 业务层的直接类型边界。
- `src/lib/task/local-executor.ts` 已切到共享任务契约，桌面本地执行器不再依赖 `BullMQ Job` 类型。
- 已完成一次 TypeScript 快速编译校验，当前这批改动可通过。

## 本轮追加进展
- 新增 `src/lib/workers/repositories/task-repository.ts`，把任务状态、进度、心跳、外部任务 ID、计费补偿等访问收口为默认仓储。
- 新增 `src/lib/workers/repositories/project-repository.ts`，为项目模式、小说推广项目读取、角色/场景落库提供最小仓储接口。
- 新增 `src/lib/workers/repositories/user-preference-repository.ts`，把分析模型读取收口为默认用户偏好仓储。
- `src/lib/workers/runtime-context.ts` 已扩展为携带 `repositories.task / repositories.project` 的执行上下文。
- `src/lib/workers/shared.ts` 与 `src/lib/workers/utils.ts` 已改为通过默认仓储访问任务数据，不再直接依赖 `task/service` 或 `prisma`。
- 首批 handler 已接入上下文仓储：
  - `src/lib/workers/handlers/analyze-global.ts`
  - `src/lib/workers/handlers/analyze-global-persist.ts`
  - `src/lib/workers/handlers/analyze-novel.ts`
  - `src/lib/workers/handlers/llm-stream.ts`
  - `src/lib/workers/handlers/episode-split.ts`
  - `src/lib/workers/handlers/voice-analyze.ts`
  - `src/lib/workers/handlers/clips-build.ts`
  - `src/lib/workers/handlers/screenplay-convert.ts`
  - `src/lib/workers/handlers/story-to-script.ts`
  - `src/lib/workers/handlers/script-to-storyboard.ts`
  - `src/lib/workers/video.worker.ts`
  - `src/lib/workers/text.worker.ts`
  - `src/lib/workers/handlers/character-profile.ts`
  - `src/lib/workers/handlers/shot-ai-variants.ts`
  - `src/lib/workers/handlers/shot-ai-prompt-location.ts`
  - `src/lib/workers/handlers/shot-ai-prompt-appearance.ts`
  - `src/lib/workers/handlers/shot-ai-prompt-shot.ts`
  - `src/lib/workers/handlers/panel-variant-task-handler.ts`
  - `src/lib/workers/handlers/reference-to-character.ts`
  - `src/lib/workers/handlers/asset-hub-image-task-handler.ts`
  - `src/lib/workers/handlers/asset-hub-modify-task-handler.ts`
  - `src/lib/workers/handlers/character-image-task-handler.ts`
  - `src/lib/workers/handlers/location-image-task-handler.ts`
  - `src/lib/workers/handlers/panel-image-task-handler.ts`
  - `src/lib/workers/handlers/image-task-handlers-core.ts`

## 当前仓储覆盖范围
- `TaskRepository`
  - 心跳、处理中/完成/失败状态推进
  - 进度更新
  - 外部任务 ID 读写
  - 计费补偿回滚与账单信息更新
- `ProjectRepository`
  - 项目模式查询
  - 项目分析模型上下文读取
  - 小说推广项目读取
  - 小说项目素材树读取（角色外观、场景图片、videoRatio）
  - 角色创建/更新
  - 角色档案目标读取、批量待确认角色读取
  - 角色档案数据更新、形象写入、确认状态更新
  - 角色外观读取、主外观读取、图片/描述/历史字段写回
  - 场景创建与图片写入
  - 场景读取与图片描述更新
  - 场景图片按 id / index 读取与图片/描述/历史字段写回
  - 分镜、面板、台词读取
  - 面板图片写回
  - 面板图片状态写回（`imageUrl` / `previousImageUrl` / `candidateImages`）
  - storyboard 文本重生成所需的分镜/素材读取
  - 插帧分镜所需的 storyboard panel 读取与事务插入
  - 面板视频、口型视频写回
  - `voice-analyze` 所需剧集/分镜读取与台词 upsert
  - `clips-build` 所需剧集读取与片段批量保存
  - `script-to-storyboard` 所需分镜/面板批量落库
- `AssetHubRepository`
  - 全局角色及外观读取
  - 全局角色外观图片/描述/历史字段写回
  - 全局场景及图片读取
  - 全局场景图片/描述/历史字段写回
- `UserPreferenceRepository`
  - 分析模型读取

## 当前结论
- P0 已完成：`BullMQ Job` 类型边界已经收缩到适配层。
- P1 持续推进中：默认仓储和执行上下文已形成，`src/lib/workers/handlers` 下已无 `prisma` 直连，并开始把纯业务模块迁入 `packages/core`。

## 下一阶段
- P1：抽 `core` 与 repository 闸口
- P2：建立本地 `engine`
- P3：迁 `renderer`
- P4：移除 `next-auth`、SSE、billing 遗留

## 最新进展（2026-03-21）
- `src/lib/workers/video.worker.ts` 已改为在 handler 入口创建 `TaskExecutionContext`，所有 panel/voiceLine 查询与视频结果写回统一走 `ProjectRepository`。
- `ProjectRepository` 已覆盖视频链需要的 `getPanelById`、`getPanelByStoryboardIndex`、`getVoiceLineById`、`updatePanelVideo`、`updatePanelLipSyncVideo`。
- `src/lib/workers/text.worker.ts` 已完成 `regenerate_storyboard_text` 与 `insert_panel` 两条链的仓储切换，worker 自身不再直接依赖 `prisma`。
- `ProjectRepository` 已新增 `getStoryboardForTextRegeneration`、`getStoryboardAssets`、`replaceStoryboardPanels`、`getStoryboardForInsertPanel`、`insertPanelAfter`，覆盖 storyboard 文本链的读取与事务写回。
- `src/lib/workers/handlers/character-profile.ts` 与 `character-profile-helpers.ts` 已切到 `ProjectRepository`，角色档案确认链不再直接依赖 `prisma`。
- 当前已完成一次快速 TypeScript 编译校验，视频链、文本链、角色档案链收口后的类型闭合正常。
- `src/lib/workers/handlers/shot-ai-persist.ts` 已改为纯 helper + repository 入参模式，不再直接依赖 `prisma`。
- `src/lib/workers/handlers/shot-ai-variants.ts`、`shot-ai-prompt-location.ts`、`shot-ai-prompt-appearance.ts`、`shot-ai-prompt-shot.ts` 已切到 `createTaskExecutionContext(job)`，通过 `ProjectRepository + UserPreferenceRepository` 解析分析模型和项目数据。
- `src/lib/workers/handlers/panel-variant-task-handler.ts` 已改为通过 `ProjectRepository` 读取/写回面板，不再直接依赖 `prisma`。
- `AssetHubRepository` 已落地，`reference-to-character.ts`、`asset-hub-image-task-handler.ts`、`asset-hub-modify-task-handler.ts` 已通过该仓储收口资产库分支写回。
- `image-task-handler-shared.ts` 已改为通过 `ProjectRepository.getNovelData` 读取小说项目素材树，不再直接依赖 `prisma`。
- `character-image-task-handler.ts`、`location-image-task-handler.ts`、`panel-image-task-handler.ts` 与 `image-task-handlers-core.ts` 已切到 `ProjectRepository`。
- 当前已完成一次快速 TypeScript 编译校验；截至本轮，`src/lib/workers/handlers` 下已无 `prisma` 直连。
- `desktop:verify:local` 已通过，注册、登录、项目创建、项目列表、账单接口关闭链路正常。
- `desktop:verify:release` 已通过，新的安装包与 `win-unpacked` 均完成打包产物冒烟。
- 下一阶段从“继续拆 worker 业务层”转为“面向客户的安装包交付与后续 warning 清理”。

## 最新进展（2026-03-22）
- `packages/engine` 已正式落地：
  - `packages/engine/runtime-context.ts`
  - `packages/engine/repositories/task-repository.ts`
  - `packages/engine/repositories/project-repository.ts`
  - `packages/engine/repositories/user-preference-repository.ts`
  - `packages/engine/repositories/asset-hub-repository.ts`
- `packages/engine` 运行时服务继续扩展：
  - `packages/engine/config-service.ts`
  - `packages/engine/auth.ts`
  - `packages/engine/api-auth.ts`
  - `packages/engine/prisma.ts`
  - `packages/engine/prisma-retry.ts`
  - `packages/engine/prisma-error.ts`
  - `packages/engine/services/projects-service.ts`
  - `packages/engine/services/user-api-config-service.ts`
- `src/lib/workers/runtime-context.ts` 与 `src/lib/workers/repositories/*.ts` 已改成薄转发层，业务代码改走 `@engine/*` 别名。
- `packages/core` 第一批模块已迁入：
  - `packages/core/model-config-contract.ts`
  - `packages/core/storyboard-phases.ts`
  - `packages/core/prompt-i18n/*`
- `packages/core` 第二批模块已迁入：
  - `packages/core/model-capabilities/*`
  - `packages/core/model-pricing/*`
- `packages/core/workflow-concurrency.ts` 已迁入，旧 `src/lib/workflow-concurrency.ts` 已改为薄转发层。
- `packages/engine/config-service.ts` 已迁入，旧 `src/lib/config-service.ts` 已改为薄转发层。
- `src/lib/model-config-contract.ts`、`src/lib/storyboard-phases.ts`、`src/lib/prompt-i18n/*`、`src/lib/model-capabilities/*`、`src/lib/model-pricing/*` 已改为薄转发层。
- `src/lib/config-service.ts`、`src/lib/auth.ts`、`src/lib/api-auth.ts`、`src/lib/prisma.ts`、`src/lib/prisma-retry.ts`、`src/lib/prisma-error.ts` 已改为薄转发层。
- 相关引用已批量切到 `@core/*` / `@engine/*`，范围覆盖 `packages/engine`、`src/lib/workers`、`src/app/api`、`src/app/[locale]`、`src/components` 等路径。
- 本轮已完成：
  - `npx tsc --noEmit --pretty false --incremental false`
  - `npm run desktop:build:web`
  - 对当前运行中的本地桌面实例执行 `node scripts/desktop/smoke-test.mjs --base-url http://127.0.0.1:13000`
- 冒烟结果正常：注册、登录、项目创建、项目列表、账单接口关闭均通过。
- 在继续扩展 `engine` 后，已再次完成：
  - `npx tsc --noEmit --pretty false --incremental false`
  - `npm run desktop:build:web`
  - 重启 `desktop:run` 后执行 `smoke-test`
- 第二轮冒烟结果正常：`@engine/auth` / `@engine/api-auth` / `@engine/prisma*` 路径迁移未影响注册、登录与项目链路。
- `src/app/api/projects/route.ts`、`src/app/api/projects/[projectId]/route.ts`、`src/app/api/projects/[projectId]/assets/route.ts` 已改成薄路由，业务实现迁入 `projects-service.ts`。
- `src/app/api/user/api-config/route.ts` 已改成薄路由，原有大部分配置读写逻辑迁入 `user-api-config-service.ts`。
- 在路由薄化后，已再次完成：
  - `npx tsc --noEmit --pretty false --incremental false`
  - `npm run desktop:build:web`
  - 重启 `desktop:run` 后执行额外冒烟
- 额外冒烟直接校验了：
  - `/api/user/api-config`
  - `/api/projects`
  - `/api/projects/[projectId]/assets`
- 结果正常：注册、登录、项目创建、项目列表、用户配置读取、项目资产读取、账单接口关闭均通过。
- `src/app/api/projects/[projectId]/data/route.ts` 已改成薄路由，完整项目数据读取迁入 `projects-service.ts` 的 `getUserProjectFullData()`。
- `packages/engine/services/novel-promotion-project-service.ts` 已继续扩展，新增：
  - `getVideoEditorProjectByEpisodeId`
  - `upsertVideoEditorProject`
  - `deleteVideoEditorProjectByEpisodeId`
  - `listNovelPromotionEpisodes`
  - `createNovelPromotionEpisode`
  - `getNovelPromotionEpisodeDetail`
  - `updateNovelPromotionEpisode`
  - `deleteNovelPromotionEpisode`
- `src/app/api/novel-promotion/[projectId]/route.ts`、`assets/route.ts` 已完成薄路由化后，又补做了一轮真实桌面冒烟。
- `src/app/api/novel-promotion/[projectId]/editor/route.ts` 已改成薄路由，编辑器项目查询/保存/删除逻辑迁入 `novel-promotion-project-service.ts`。
- `src/app/api/novel-promotion/[projectId]/episodes/route.ts` 与 `episodes/[episodeId]/route.ts` 已改成薄路由，剧集列表、创建、详情、更新、删除逻辑迁入 `novel-promotion-project-service.ts`。
- 这轮额外桌面冒烟直接校验了：
  - `/api/projects/[projectId]/data`
  - `/api/novel-promotion/[projectId]`
  - `/api/novel-promotion/[projectId]/assets`
  - `/api/novel-promotion/[projectId]/episodes`
  - `/api/novel-promotion/[projectId]/episodes/[episodeId]`
  - `/api/novel-promotion/[projectId]/editor`
- 结果正常：新建项目、创建剧集、读取剧集详情、更新剧集、保存编辑器项目、读取编辑器项目、删除编辑器项目、删除剧集均通过，说明这批 route thinning 没有打断桌面运行时契约。
- 新增 `packages/engine/services/novel-promotion-voice-service.ts`，将语音侧轻量 CRUD 与文件落库逻辑从 route 中抽离，覆盖：
  - `getNovelPromotionVoiceLines`
  - `createNovelPromotionVoiceLine`
  - `updateNovelPromotionVoiceLine`
  - `deleteNovelPromotionVoiceLine`
  - `getNovelPromotionSpeakerVoices`
  - `updateNovelPromotionSpeakerVoice`
  - `updateNovelPromotionCharacterVoiceSettings`
  - `saveDesignedNovelPromotionCharacterVoice`
  - `uploadNovelPromotionCharacterVoiceFile`
- `src/app/api/novel-promotion/[projectId]/voice-lines/route.ts`、`speaker-voice/route.ts`、`character-voice/route.ts` 已改为薄路由。
- 桌面冒烟过程中暴露出本地存储绝对路径拼接错误，现已修复：
  - `src/lib/storage/utils.ts` 新增 `resolveUploadRoot()`
  - `src/lib/storage/providers/local.ts` 改为兼容绝对 `UPLOAD_DIR`
  - `src/app/api/files/[...path]/route.ts` 改为使用绝对上传根路径，避免 Windows 下 `process.cwd() + 绝对路径` 拼坏
- 这轮额外桌面冒烟直接校验了：
  - `/api/novel-promotion/[projectId]/voice-lines`
  - `/api/novel-promotion/[projectId]/speaker-voice`
  - `/api/novel-promotion/[projectId]/character-voice`
- 结果正常：台词创建/查询/单条更新/批量音色更新/删除、发言人音色写入与读取、角色音色设置更新、AI 设计音色保存、角色音频文件上传均通过。
- 新增 `packages/engine/services/novel-promotion-asset-service.ts`，开始收口基础资产 CRUD：
  - `updateNovelPromotionCharacter`
  - `deleteNovelPromotionCharacter`
  - `createNovelPromotionLocation`
  - `updateNovelPromotionLocation`
  - `deleteNovelPromotionLocation`
- `src/app/api/novel-promotion/[projectId]/character/route.ts` 的 `PATCH/DELETE` 已改成薄路由。
- `src/app/api/novel-promotion/[projectId]/location/route.ts` 的 `POST/PATCH/DELETE` 已改成薄路由。
- 这轮额外桌面冒烟直接校验了：
  - `/api/novel-promotion/[projectId]/character`
  - `/api/novel-promotion/[projectId]/location`
- 结果正常：角色创建、角色更新、角色删除、场景创建、场景名称更新、场景图片描述更新、场景删除均通过。
- 新增 `packages/engine/services/novel-promotion-editing-service.ts`，开始收口编辑态单对象更新路由：
  - `updateNovelPromotionClip`
  - `updateNovelPromotionPanelLink`
- `src/app/api/novel-promotion/[projectId]/clips/[clipId]/route.ts` 已改成薄路由。
- `src/app/api/novel-promotion/[projectId]/panel-link/route.ts` 已改成薄路由。
- 这轮额外桌面冒烟采用“桌面运行时真实接口 + 同库最小测试数据”方式验证：
  - 先通过 API 创建项目与剧集
  - 再向桌面运行时 SQLite 插入最小 `clip/storyboard/panel` 数据
  - 然后直接校验 `/api/novel-promotion/[projectId]/clips/[clipId]`
  - 和 `/api/novel-promotion/[projectId]/panel-link`
- 结果正常：clip 文本/角色/场景/剧本字段更新与 panel 首尾帧链接状态写回均通过。
- 迁移副产物方面，已清理一批 `TaskJobData` 无用导入，降低后续构建噪音；当前仍保留项目既有 ESLint warning 与 `bullmq` 的 build warning，未阻断构建与桌面验证。
- 新增 `packages/engine/services/novel-promotion-editing-service.ts` 的第二批编辑态服务：
  - `createNovelPromotionStoryboardGroup`
  - `moveNovelPromotionStoryboardGroup`
  - `deleteNovelPromotionStoryboardGroup`
  - `updateNovelPromotionPhotographyPlan`
  - 同文件还已包含前一轮的 `getNovelPromotionStoryboards / clearNovelPromotionStoryboardError / createNovelPromotionPanel / deleteNovelPromotionPanel / patchNovelPromotionPanel / putNovelPromotionPanel`
- `src/app/api/novel-promotion/[projectId]/storyboard-group/route.ts` 已改成薄路由，POST/PUT/DELETE 只保留鉴权、参数解析和 `NextResponse` 包装。
- `src/app/api/novel-promotion/[projectId]/photography-plan/route.ts` 已改成薄路由，PUT 的摄影方案写入逻辑迁入 `novel-promotion-editing-service.ts`。
- 这轮真实桌面回归直接命中新路由：
  - 通过 API 完成注册、登录、项目创建、剧集创建
  - `POST /api/novel-promotion/[projectId]/storyboard-group` 创建两组分镜
  - `PUT /api/novel-promotion/[projectId]/storyboard-group` 调整分镜组顺序
  - `PUT /api/novel-promotion/[projectId]/photography-plan` 写入摄影方案
  - `DELETE /api/novel-promotion/[projectId]/storyboard-group` 删除分镜组
- 回归后通过桌面运行时 SQLite (`C:/Users/pc/AppData/Roaming/Electron/data/waoowaoo.db`) 直接回查：
  - 分镜组移动后顺序正常
  - 摄影方案已按现有契约落库为 `JSON.stringify(photographyPlan)`
  - 删除分镜组后仅剩目标 storyboard，初始 panel 保留正常
- 这轮完成顺序为：
  - `npm run desktop:build:web`
  - 构建后再执行 `npx tsc --noEmit --pretty false --incremental false`
  - 重启 `desktop:run`
  - 执行真实桌面接口 + SQLite 回查验证
- `packages/engine/services/novel-promotion-asset-service.ts` 已继续扩展角色形象编辑能力：
  - `createNovelPromotionCharacterAppearance`
  - `updateNovelPromotionCharacterAppearance`
  - `deleteNovelPromotionCharacterAppearance`
- `packages/engine/services/novel-promotion-editing-service.ts` 已新增 `selectNovelPromotionPanelCandidate`，收口面板候选图选择/取消逻辑。
- `src/app/api/novel-promotion/[projectId]/character/appearance/route.ts` 已改成薄路由，POST/PATCH/DELETE 只保留鉴权、参数解析和响应包装。
- `src/app/api/novel-promotion/[projectId]/panel/select-candidate/route.ts` 已改成薄路由，候选图选择/取消逻辑迁入 `novel-promotion-editing-service.ts`。
- 这轮真实桌面回归直接命中新路由：
  - 通过 API 创建项目与角色
  - `POST /api/novel-promotion/[projectId]/character/appearance` 创建子形象
  - `PATCH /api/novel-promotion/[projectId]/character/appearance` 更新子形象描述
  - `DELETE /api/novel-promotion/[projectId]/character/appearance` 删除子形象
  - 通过 API 创建剧集和分镜组后，向桌面 SQLite 写入最小 `candidateImages` 测试数据
  - `POST /api/novel-promotion/[projectId]/panel/select-candidate` 验证选择与取消两种动作
- SQLite 回查确认：
  - 删除子形象后只剩主形象，`appearanceIndex` 重新收口为 0
  - 选择候选图后 `imageUrl` 写为选中的候选 key，旧图进入 `imageHistory`
  - 取消候选图后 `candidateImages` 被清空
- 本轮继续沿用桌面交付回归链：
  - `npm run desktop:build:web`
  - 重启 `desktop:run`
  - 真实接口回归 + SQLite 回查
- `packages/engine/services/novel-promotion-asset-service.ts` 已继续扩展候选图确认逻辑：
  - `confirmNovelPromotionCharacterSelection`
  - `confirmNovelPromotionLocationSelection`
- `src/app/api/novel-promotion/[projectId]/character/confirm-selection/route.ts` 与 `location/confirm-selection/route.ts` 已改成薄路由。
- 这轮真实桌面回归直接命中新路由：
  - 通过 API 创建项目、角色、场景
  - 向桌面 SQLite 补最小候选图数据：
    - 角色形象 `imageUrls/descriptions/selectedIndex`
    - 场景图片 `imageUrl/isSelected/selectedImageId`
  - `POST /api/novel-promotion/[projectId]/character/confirm-selection`
  - `POST /api/novel-promotion/[projectId]/location/confirm-selection`
- SQLite 回查确认：
  - 角色确认后只保留选中的图片与描述，`selectedIndex` 重置为 0
  - 场景确认后只保留选中的 `LocationImage`，剩余图片索引收口到 0，`selectedImageId` 正确指向保留项
- 本轮仍采用真实桌面运行时回归：重建 `next build`、重启 `desktop:run`、接口调用后直接回查 `C:/Users/pc/AppData/Roaming/Electron/data/waoowaoo.db`
- `packages/engine/services/novel-promotion-asset-service.ts` 已继续扩展轻量选择态服务：
  - `selectNovelPromotionCharacterImage`
  - `selectNovelPromotionLocationImage`
- `src/app/api/novel-promotion/[projectId]/select-character-image/route.ts` 与 `select-location-image/route.ts` 已改成薄路由。
- 这轮真实桌面回归直接命中新路由：
  - 通过 API 创建项目、角色、场景
  - 向桌面 SQLite 写入最小候选图数据：角色 `imageUrls`、场景 `LocationImage.imageUrl`
  - `POST /api/novel-promotion/[projectId]/select-character-image` 先选择后取消
  - `POST /api/novel-promotion/[projectId]/select-location-image` 先选择后取消
- SQLite 回查确认：
  - 角色选择后 `selectedIndex/imageUrl` 正确写回，取消后恢复为 `null`
  - 场景选择后 `isSelected/selectedImageId` 正确写回，取消后全部恢复为未选中且 `selectedImageId=null`
- 至此，角色与场景的候选图链路已经覆盖：
  - 选择
  - 确认
  - 删除未选中项
- `packages/engine/services/novel-promotion-asset-service.ts` 本轮新增：
  - `cleanupNovelPromotionUnselectedImages`
  - `updateNovelPromotionAssetLabel`
  - `uploadNovelPromotionAssetImage`
  - 内部辅助 `updateAssetImageLabel`
  - 内部辅助 `createUploadedLabeledImage`
- `src/app/api/novel-promotion/[projectId]/cleanup-unselected-images/route.ts`、`update-asset-label/route.ts`、`upload-asset-image/route.ts` 已全部改成薄路由，路由层仅保留鉴权、参数解析和响应包装。
- `src/app/api/novel-promotion/[projectId]/update-appearance/route.ts` 与 `update-location/route.ts` 也已改为直接调用现有 `asset service`，移除了 route 内的描述 JSON/场景描述写回逻辑。
- 这轮真实桌面回归新增覆盖：
  - `POST /api/novel-promotion/[projectId]/upload-asset-image`
  - `POST /api/novel-promotion/[projectId]/update-asset-label`
  - `POST /api/novel-promotion/[projectId]/cleanup-unselected-images`
- 回归过程通过 API 创建项目、角色、场景，并分别上传两张角色图与两张场景图，再调用已薄化的 `select-character-image`、`select-location-image` 选中保留图，最后执行未选中清理与重新打标签。
- 真实回归首次失败的原因不是业务逻辑，而是测试图像过小：最开始使用 `1x1` PNG，导致标签条高度计算为 `0`，`sharp` 报 `Expected valid width, height and channels to create a new input image`；改为现场生成 `256x256` PNG 后已通过。
- SQLite 直连回查确认：
  - 角色与场景清理后都只保留选中图片，索引重新收口到 `0`
  - 角色与场景重新打标签后都生成了新的图片 key，旧 key 不再作为最终展示图
- 为这轮真实回归补了一条可复用脚本：
  - `scripts/desktop/verify-update-routes.mjs`
  - `package.json` 新增 `desktop:verify:update-routes`
- `update-appearance` 与 `update-location` 已完成独立真实桌面回归：
  - 使用桌面开发态同一套运行时环境与 SQLite：`C:/Users/pc/AppData/Roaming/Electron/data/waoowaoo.db`
  - 自动执行 `prisma db push`、启动 `next start`、注册登录、创建项目、创建角色与场景，然后调用两条已薄化路由
  - SQLite 回查确认：
    - `character_appearances.description` 与 `descriptions[0]` 已写回为“更新后的角色描述”
    - `location_images.description` 已写回为“更新后的场景描述”
- 本轮验证结果表明：
  - `src/app/api/novel-promotion/[projectId]/update-appearance/route.ts`
  - `src/app/api/novel-promotion/[projectId]/update-location/route.ts`
  已经从“只改了代码”提升到“薄路由 + 真实回归通过”的完成态。
- `packages/engine/services/novel-promotion-asset-service.ts` 已新增 `createNovelPromotionCharacter`，把角色创建、初始形象落库、参考图后台触发都收口到 `asset service`。
- `src/app/api/novel-promotion/[projectId]/character/route.ts` 的 POST 分支已改成薄路由，路由层只负责鉴权、请求体读取、`taskLocale / Accept-Language / Cookie` 转发。
- 复用了 `desktop:verify:update-routes` 再次回归，确认角色创建链未回归：
  - 注册、登录、创建项目、创建角色、创建场景、更新角色形象描述、更新场景描述都通过
  - 说明 `character/route.ts` 的创建重构没有打断现有资产侧链路
- `packages/engine/services/novel-promotion-editing-service.ts` 已新增 `updateNovelPromotionShotPrompt`，把镜头提示词单对象更新收进 `editing service`。
- `src/app/api/novel-promotion/[projectId]/update-prompt/route.ts` 已改成薄路由，不再直接访问 `prisma.novelPromotionShot`。
- `scripts/desktop/verify-update-routes.mjs` 已扩展：
  - 通过 `/api/novel-promotion/[projectId]/episodes` 创建剧集
  - 直接向桌面 SQLite 插入最小 `novel_promotion_shots` 测试数据
  - 调用 `/api/novel-promotion/[projectId]/update-prompt`
  - 回查 `novel_promotion_shots.imagePrompt`
- 最新一轮真实回归确认：
  - `imagePrompt` 已写回为“更新后的镜头提示词”
  - 当前同一条回归脚本已覆盖：角色创建、场景创建、`update-appearance`、`update-location`、`update-prompt`
- `packages/engine/services/novel-promotion-project-service.ts` 已新增 `createNovelPromotionEpisodesBatch`，把批量导入剧集、清空现有剧集、更新 `lastEpisodeId/importStatus` 的逻辑迁入 `project service`。
- `src/app/api/novel-promotion/[projectId]/episodes/batch/route.ts` 已改成薄路由，不再直接访问 `prisma`。
- `scripts/desktop/verify-update-routes.mjs` 已继续扩展：
  - 调用 `/api/novel-promotion/[projectId]/episodes/batch` 验证批量导入两集
  - 再调用同一路由验证 `clearExisting + 空数组` 清空分支
  - 清空后再创建单集，继续跑后面的 `update-prompt`
- SQLite 回查确认：
  - `novel_promotion_projects.importStatus` 已写回为 `cleared`
  - 清空后项目下只剩重建的单集，且 `lastEpisodeId` 正确指向新单集
  - 说明 `episodes/batch` 的服务化没有打断后续单集与镜头编辑链
- `packages/engine/services/novel-promotion-asset-service.ts` 本轮新增：
  - `copyNovelPromotionAssetFromGlobal`
  - 内部辅助 `copyCharacterFromGlobal`
  - 内部辅助 `copyLocationFromGlobal`
  - 内部辅助 `copyVoiceFromGlobal`
- `src/app/api/novel-promotion/[projectId]/copy-from-global/route.ts` 已改成薄路由，路由层只保留鉴权、参数解析与 `NextResponse` 包装。
- 新增独立真实回归脚本：
  - `scripts/desktop/verify-copy-from-global.mjs`
  - `package.json` 新增 `desktop:verify:copy-from-global`
- 这轮真实桌面回归覆盖：
  - 全局角色复制到项目角色
  - 全局场景复制到项目场景
  - 全局音色复制到项目角色
  - 黑边标签重生成
  - `selectedImageId`、`sourceGlobal*`、`profileConfirmed`、`voice*` 字段回写
- SQLite 直连回查确认：
  - 角色复制后 `sourceGlobalCharacterId`、`profileConfirmed`、`voiceId/voiceType/customVoiceUrl` 正确写回
  - 场景复制后 `sourceGlobalLocationId`、`summary`、`selectedImageId` 正确写回
  - 角色与场景复制后的最终图片 key 均已更新，不再复用原种子图 key
- `scripts/desktop/verify-modify-image-submit-routes.mjs` 已修复 SQLite 回查锁问题：新增 `withDbRetry`、`busy_timeout` 和提交后短暂等待，真实桌面回归现已稳定通过。
- `packages/engine/services/novel-promotion-download-service.ts` 本轮新增，收口了：
  - `downloadNovelPromotionImages`
  - `downloadNovelPromotionVideos`
  - `downloadNovelPromotionVoices`
  - `listNovelPromotionVideoUrls`
- `src/app/api/novel-promotion/[projectId]/download-images/route.ts`、`download-videos/route.ts`、`download-voices/route.ts`、`video-urls/route.ts` 已全部改成薄路由，只保留鉴权、请求解析和响应包装。
- 下载/导出链已补独立真实回归：
  - `scripts/desktop/verify-download-routes.mjs`
  - `package.json` 新增 `desktop:verify:download-routes`
- 这轮真实桌面回归覆盖：
  - 图片 ZIP 下载
  - 视频 ZIP 下载
  - 配音 ZIP 下载
  - `video-urls` 返回代理下载链接
  - 跨项目 `episodeId` 边界校验
- 回归方式：自动执行 `prisma db push`、启动 `next start`、注册登录、创建两个项目和剧集、向桌面 SQLite 写入最小 `clip/storyboard/panel/voice line` 数据，并在 `C:/Users/pc/AppData/Roaming/Electron/uploads` 下写入本地种子文件供 ZIP 路由读取。
- 最新一轮回归确认：
  - 三个 ZIP 路由都返回 `application/zip`
  - `video-urls` 返回 2 条代理链接，并按 `panelPreferences` 正确选择原始视频/口型同步视频
  - 使用其他项目的 `episodeId` 调用 `video-urls` 会返回 `404`，说明 service 化后已经收紧数据边界
- `packages/engine/services/novel-promotion-task-submit-service.ts` 本轮新增，收口了：
  - `submitNovelPromotionRegenerateStoryboardTextTask`
  - `submitNovelPromotionInsertPanelTask`
  - `submitNovelPromotionVoiceDesignTask`
  - `submitNovelPromotionRegeneratePanelImageTask`
- `src/app/api/novel-promotion/[projectId]/regenerate-storyboard-text/route.ts`、`insert-panel/route.ts`、`voice-design/route.ts`、`regenerate-panel-image/route.ts` 已改成薄路由。
- 这组轻提交链已补独立真实回归：
  - `scripts/desktop/verify-light-submit-routes.mjs`
  - `package.json` 新增 `desktop:verify:light-submit-routes`
- 真实桌面回归覆盖：
  - `POST /api/novel-promotion/[projectId]/regenerate-storyboard-text`
  - `POST /api/novel-promotion/[projectId]/insert-panel`
  - `POST /api/novel-promotion/[projectId]/voice-design`
  - `POST /api/novel-promotion/[projectId]/regenerate-panel-image`
- 为了让 `regenerate-panel-image` 按原语义通过 `resolveModelSelection`，脚本会为当前测试用户注入最小 `user_preferences.customModels`，并把项目 `storyboardModel` 设为 `fal::banana-2`。
- SQLite 回查确认：
  - `tasks.type / targetType / targetId / dedupeKey` 均正确
  - `graph_runs.input.analysisModel / userInput / voicePrompt / previewText / candidateCount / imageModel / ui.intent / ui.hasOutputAtStart` 均按预期写入
- `packages/engine/services/novel-promotion-image-task-service.ts` 本轮继续扩展：
  - `submitNovelPromotionGenerateImageTask`
  - `submitNovelPromotionGenerateCharacterImageTask`
- `src/app/api/novel-promotion/[projectId]/generate-image/route.ts` 与 `generate-character-image/route.ts` 已改成薄路由，路由层只保留鉴权、locale 解析、requestId 透传和 `NextResponse` 包装。
- `packages/engine/services/novel-promotion-voice-service.ts` 本轮继续扩展：
  - `submitNovelPromotionLipSyncTask`
  - `submitNovelPromotionVoiceGenerateTask`
- `src/app/api/novel-promotion/[projectId]/lip-sync/route.ts` 与 `voice-generate/route.ts` 已改成薄路由。
- 新增独立真实回归脚本：
  - `scripts/desktop/verify-generation-task-routes.mjs`
  - `package.json` 新增 `desktop:verify:generation-task-routes`
- 这轮真实桌面回归覆盖：
  - `POST /api/novel-promotion/[projectId]/generate-image` 角色分支
  - `POST /api/novel-promotion/[projectId]/generate-image` 场景分支
  - `POST /api/novel-promotion/[projectId]/generate-character-image`（不传 appearanceId，验证首个 appearance 自动解析）
  - `POST /api/novel-promotion/[projectId]/lip-sync`
  - `POST /api/novel-promotion/[projectId]/voice-generate` 单条分支
  - `POST /api/novel-promotion/[projectId]/voice-generate` 批量 `all=true` 分支
- 回归方式：自动执行 `prisma db push`、启动 `next start`、注册登录、创建项目/角色/场景/两集剧集，并向桌面 SQLite 注入最小 `storyboard/panel/voice line` 数据；同时为当前测试用户注入最小 `user_preferences.customModels` 与默认 lipsync 模型，保证 `voice-generate` 和 `lip-sync` 走真实模型选择/计费路径。
- SQLite 回查确认：
  - `generate-image(character)` 的 `task.type=image_character`，目标为 `appearanceId`，payload 带 `count=2`、`imageModel=fal::banana-2`
  - `generate-character-image` 自动解析主形象并写入相同 `appearanceId`，payload 带 `count=3`、`artStyle=realistic`
  - `generate-image(location)` 的 `task.type=image_location`，目标为 `locationId`，且 `location_images` 槽位按 `count` 扩容
  - `lip-sync` 的 payload 正确注入默认模型 `fal::fal-ai/kling-video/lipsync/audio-to-video`
  - `voice-generate` 单条与批量分支都正确写入 `audioModel=fal::audio-model`、`maxSeconds`、`taskIds`
- 最新一轮扫尾结果：`src/app/api/novel-promotion` 下还保留直连业务实现的只剩三块：
  - `generate-video/route.ts`
  - `panel-variant/route.ts`
  - `episodes/split-by-markers/route.ts`
- 本轮已收掉最后三块重路由：
  - `packages/engine/services/novel-promotion-project-service.ts` 新增 `splitNovelPromotionEpisodesByMarkers`
  - `packages/engine/services/novel-promotion-panel-variant-service.ts` 已接管 `panel-variant` 的校验、事务插入、提交失败回滚
  - `packages/engine/services/novel-promotion-video-task-service.ts` 已接管 `generate-video` 的单 panel / 批量分支、能力校验与计费构造
- `src/app/api/novel-promotion/[projectId]/episodes/split-by-markers/route.ts`、`panel-variant/route.ts`、`generate-video/route.ts` 已全部改成薄路由，只保留鉴权、`locale/requestId` 解析和 `NextResponse` 包装。
- 新增最终真实桌面回归脚本：
  - `scripts/desktop/verify-final-heavy-routes.mjs`
  - `package.json` 新增 `desktop:verify:final-heavy-routes`
- 这轮真实桌面回归覆盖：
  - `POST /api/novel-promotion/[projectId]/episodes/split-by-markers`
  - `POST /api/novel-promotion/[projectId]/panel-variant`
  - `POST /api/novel-promotion/[projectId]/generate-video` 单 panel 分支
  - `POST /api/novel-promotion/[projectId]/generate-video` 批量 `all=true` 分支
- 回归方式：自动执行 `prisma db push`、启动 `next start`、注册登录、创建项目与三组剧集，并向桌面 SQLite 注入最小 `clip/storyboard/panel` 数据；随后分别触发分集标记拆分、panel 变体生成、单视频生成和批量视频生成。
- SQLite 回查确认：
  - `split-by-markers` 返回 `success=true`、`method=markers`、`episodes.length=3`
  - `panel-variant` 已创建新 panel，`panelIndex=1`、`panelNumber=2`、`storyboard.panelCount=3`
  - `panel-variant` 的 `tasks.type=panel_variant`，且 `graph_runs.input.newPanelId` 等于返回的 `panelId`
  - `generate-video` 单任务的 `tasks.type=video_panel`，目标为指定 panel，`graph_runs.input.videoModel=fal::seedance/video`
  - `generate-video` 批量分支返回 `total=2`，两个 task 都正确落到批量 episode 下的两个 panel
- 当前静态扫描结果：`rg -n "prisma\\.|submitTask\\(" src/app/api/novel-promotion -S` 已无命中，说明 `novel-promotion` 路由层里的 `prisma/submitTask` 直连已清空。
- `asset-hub` 已开始进入同一套 `engine service` 迁移节奏：
  - `packages/engine/services/asset-hub-library-service.ts` 新增
  - 已收口：
    - `listAssetHubFolders`
    - `createAssetHubFolder`
    - `updateAssetHubFolder`
    - `deleteAssetHubFolder`
    - `listAssetHubPickerItems`
- `src/app/api/asset-hub/folders/route.ts`、`folders/[folderId]/route.ts`、`picker/route.ts` 已改成薄路由，路由层不再直接访问 `prisma`。
- 这批改动已通过一轮 `desktop:build:web` 编译验证，说明 `asset-hub` 第一组 service 拆分已与当前桌面主线兼容。
- `packages/engine/services/asset-hub-character-service.ts`、`asset-hub-location-voice-service.ts`、`asset-hub-task-service.ts`、`asset-hub-image-management-service.ts`、`asset-hub-ai-modify-service.ts` 已全部落地，`src/app/api/asset-hub` 对应路由均已改成薄路由。
- `src/app/api/asset-hub` 已完成静态收口：路由层不再直接调用 `prisma` 或 `submitTask`。
- 本轮继续新增：
  - `packages/engine/services/user-preference-service.ts`
  - `packages/engine/services/user-models-service.ts`
  - `packages/engine/services/run-retry-service.ts`
  - `packages/engine/services/sse-service.ts`
  - `packages/engine/services/auth-register-service.ts`
  - `packages/engine/services/billing-query-service.ts`
- 已改成薄路由：
  - `src/app/api/user-preference/route.ts`
  - `src/app/api/user/models/route.ts`
  - `src/app/api/runs/[runId]/steps/[stepKey]/retry/route.ts`
  - `src/app/api/sse/route.ts`
  - `src/app/api/auth/register/route.ts`
  - `src/app/api/projects/[projectId]/costs/route.ts`
  - `src/app/api/user/costs/route.ts`
  - `src/app/api/user/transactions/route.ts`
- 当前静态扫描结果：`src/app/api` 下已无 `prisma.` / `submitTask(` 直连命中，说明 API 路由层已整体完成第一阶段薄路由化。
- 当前剩余的蓝图缺口不再是 API 路由层，而是更深层的终态工作：`packages/renderer` 独立化、`next-auth` 本地化、Prisma 运行时替换、计费模块彻底删除。
- 已新增 `packages/renderer/pages`，作为桌面 UI 的第一批页面承载层。
- `tsconfig.json` 已新增 `@renderer/* -> ./packages/renderer/*` 路径别名。
- 以下页面实现已从 `src/app` 入口剥离到 `packages/renderer/pages`：
  - `packages/renderer/pages/profile-page.tsx`
  - `packages/renderer/pages/workspace-page.tsx`
  - `packages/renderer/pages/asset-hub-page.tsx`
  - `packages/renderer/pages/project-detail-page.tsx`
- 以下 Next 页面已改成薄入口，仅保留 `@renderer/pages/*` 转发：
  - `src/app/[locale]/profile/page.tsx`
  - `src/app/[locale]/workspace/page.tsx`
  - `src/app/[locale]/workspace/asset-hub/page.tsx`
  - `src/app/[locale]/workspace/[projectId]/page.tsx`
- 这一步采用“整页搬迁、行为不变”的策略，先把页面实现从 `src/app` 脱离，再逐步继续下沉页面内部组件、hooks 和数据获取逻辑。
- 当前桌面构建已通过，说明 `packages/renderer` 的首批入口迁移与现有 Next 外壳兼容。
- 当前蓝图下一阶段重点已从“页面入口迁移”进入“页面内部模块迁移”：优先收 `profile/components`、`workspace` 的本地交互块，以及 `asset-hub` / `project-detail` 的页面内状态与局部组件依赖。
- `packages/renderer/modules` 已建立，开始承接页面内部私有组件与 helper。
- 已下沉 `profile` 组件树：
  - `packages/renderer/modules/profile/components/**`
  - `packages/renderer/pages/profile-page.tsx` 已改为从 `@renderer/modules/profile/components/ApiConfigTab` 读取页面内部模块。
- 已下沉 `asset-hub` 页面级组件树：
  - `packages/renderer/modules/asset-hub/components/**`
  - `packages/renderer/pages/asset-hub-page.tsx` 已改为从 `@renderer/modules/asset-hub/components/*` 读取 `FolderSidebar`、`AssetGrid`、`FolderModal`、`VoiceDesignDialog`、`VoiceCreationModal`、`VoicePickerDialog`。
- 已下沉 `project-detail` 首个页面私有 helper：
  - `packages/renderer/modules/project-detail/episode-selection.ts`
  - `packages/renderer/pages/project-detail-page.tsx` 已改为从 `@renderer/modules/project-detail/episode-selection` 读取剧集选择逻辑。
- 当前 `renderer` 迁移状态：
  - 页面入口层：`profile/workspace/asset-hub/project-detail` 已迁入 `packages/renderer/pages`
  - 页面私有模块：`profile`、`asset-hub`、`project-detail` 已开始从 `src/app` 下沉到 `packages/renderer/modules`
- 本轮构建已通过，说明 `renderer/pages + renderer/modules` 的首批分层与当前 Next 外壳兼容。
- 下一阶段优先级：
  1. 继续下沉 `project-detail` 对 `src/app/[locale]/workspace/[projectId]/modes/**` 的页面私有依赖
  2. 收 `workspace-page` 内部交互块为 `renderer/modules/workspace`
  3. 再处理 `profile` 组件树里残留的 `src/app` 本地耦合点与旧目录清理
- `novel-promotion` 模式树切换到 `packages/renderer/modules/project-detail/novel-promotion` 后，守卫/审计脚本路径已同步完成：
  - `scripts/check-outbound-image-unification.ts`
  - `scripts/guards/no-server-mirror-state.mjs`
  - `scripts/guards/no-multiple-sources-of-truth.mjs`
  - `scripts/guards/task-target-states-no-polling-guard.mjs`
  - `scripts/guards/task-status-cutover-audit.sh`
- `check-outbound-image-unification` 的断言已对齐当前实现：
  - `VideoPanelCardHeader` 的按钮校验已改成匹配 `renderer/modules` 下的新结构，而不是旧页面树中的精确 className 字符串
  - `asset-hub modify-image` 的图片输入清洗校验已改为检查 `packages/engine/services/asset-hub-task-service.ts`，因为当前 sanitize 逻辑已下沉到 `engine service`
- `task-target-states-no-polling-guard` 已对齐当前任务态查询实现：
  - `VoiceStage` 的检测路径已改到 `packages/renderer/modules/project-detail/novel-promotion/components/VoiceStage.tsx`
  - `useTaskTargetStateMap` 的 guard 不再要求 `refetchInterval: false`，改为要求“仅在 `queued/processing` 阶段使用 query-driven conditional refetch，其他阶段返回 `false`”
- 验证结果：
  - `npm run desktop:build:web` 通过
  - `npx tsx scripts/check-outbound-image-unification.ts` 通过
  - `node scripts/guards/no-server-mirror-state.mjs` 通过
  - `node scripts/guards/no-multiple-sources-of-truth.mjs` 通过
  - `node scripts/guards/task-target-states-no-polling-guard.mjs` 通过
  - `bash scripts/guards/task-status-cutover-audit.sh` 通过
  - `rg -n -F -- "src/app/[locale]/workspace/[projectId]/modes/novel-promotion" src tests scripts` 已无命中，说明 `src/tests/scripts` 三处对旧 `novel-promotion` 页面树的显式路径引用已清零
- 当前 `renderer` 切换状态：
  - 代码层：`novel-promotion` 已从 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion` 切到 `packages/renderer/modules/project-detail/novel-promotion`
  - 守卫层：相关扫描根目录、路径存在性检查、审计脚本都已跟上新目录
  - 下一步应继续下沉 `workspace-page` 相关模块，并开始清理 `src/app` 下已被 `renderer/modules` 替代的旧页面私有实现
- `workspace-page` 已开始进入页面内部模块下沉阶段，新增：
  - `packages/renderer/modules/workspace/types.ts`
  - `packages/renderer/modules/workspace/format-project-date.ts`
  - `packages/renderer/modules/workspace/WorkspaceSearchBar.tsx`
  - `packages/renderer/modules/workspace/WorkspaceProjectsSection.tsx`
  - `packages/renderer/modules/workspace/ProjectFormModal.tsx`
  - `packages/renderer/modules/workspace/WorkspacePagination.tsx`
- `packages/renderer/pages/workspace-page.tsx` 已完成第一轮瘦身：
  - 保留会话鉴权、项目请求、删除/编辑/创建等状态编排
  - 搜索栏、项目卡片区、空态、新建/编辑弹窗、分页 UI 都改为从 `@renderer/modules/workspace/*` 引入
- 这一步没有改动对外行为，只把原来堆在页面文件里的私有 UI 逻辑切到 `renderer/modules/workspace`
- 本轮构建已通过，说明 `workspace-page -> renderer/modules/workspace` 的首批拆分与当前 Next 外壳兼容
- 当前 `renderer` 下一步建议：
  1. 继续拆 `workspace-page` 中与项目请求、表单状态相关的 hook/service
  2. 回头清理 `src/app/[locale]/workspace/page.tsx` 薄入口之外的旧页面残余
  3. 继续推进 `project-detail` 页面内更深层的 `novel-promotion` 私有组件去耦
- `workspace-page` 第二轮下沉已完成，新增：
  - `packages/renderer/modules/workspace/useWorkspacePageState.ts`
- `useWorkspacePageState` 已收口以下页面内状态与副作用：
  - `useSession + auth/signin` 跳转
  - 项目列表请求与分页/搜索联动
  - 新建项目弹窗与模型配置检测
  - 编辑项目弹窗
  - 删除确认与删除后刷新
  - 表单重置与搜索清空
- `packages/renderer/pages/workspace-page.tsx` 现已进一步收缩为纯页面编排层：
  - 保留 `useTranslations`
  - 通过 `useWorkspacePageState(t)` 取得全部页面状态与动作
  - 页面主体只负责拼装 `WorkspaceSearchBar`、`WorkspaceProjectsSection`、`WorkspacePagination`、`ProjectFormModal`、`ConfirmDialog`
- 为避免 `next-intl` translator 类型不兼容，`packages/renderer/modules/workspace/types.ts` 已新增：
  - `TranslationValues`
  - `TranslationFn`
- 本轮构建已再次通过，说明 `workspace-page` 从“页面内状态 + 展示逻辑混写”推进到“页面编排层 + workspace hook + workspace modules”后仍与现有 Next 外壳兼容
- 当前建议优先级已调整为：
  1. 开始拆 `project-detail-page` 的页面内状态与数据装配
  2. 再回头清理 `workspace-page` 里可继续下沉的请求 helper
  3. 最后做 `src/app/[locale]/workspace` 下旧页面私有残余清理
- `project-detail-page` 已开始进入页面内状态与门禁逻辑下沉阶段，新增：
  - `packages/renderer/modules/project-detail/detail-types.ts`
  - `packages/renderer/modules/project-detail/useProjectDetailRouteState.ts`
  - `packages/renderer/modules/project-detail/useProjectDetailModelSetup.ts`
  - `packages/renderer/modules/project-detail/ProjectDetailImportGate.tsx`
  - `packages/renderer/modules/project-detail/useProjectDetailEpisodeActions.ts`
- `useProjectDetailRouteState` 已收口：
  - `stage/episode` URL 参数解析
  - `effectiveStage` 归一化
  - 剧集排序与 `selectedEpisodeId` 解析
  - `importStatus / shouldShowImportWizard / shouldGateImportWizardByModel`
  - URL 回写与剧集切换行为
- `useProjectDetailModelSetup` 已收口：
  - 导入向导前的默认分析模型检测
  - 模型草稿状态
  - 模型配置弹窗开关
  - 保存默认分析模型
- `ProjectDetailImportGate` 已承接：
  - 导入前 loading 卡片
  - 模型未配置 gate 卡片
  - 模型配置弹窗
  - 正常导入向导入口
- `useProjectDetailEpisodeActions` 已收口：
  - 创建剧集
  - 智能导入完成后的刷新与跳转
  - 重命名剧集
  - 删除剧集
- `packages/renderer/pages/project-detail-page.tsx` 当前已明显瘦身：
  - 保留 `project/episode` 查询装配、初始化态/错误态分支和 `NovelPromotionWorkspace` 组装
  - URL 状态、模型门禁、导入 gate、剧集 CRUD 回调都改为从 `@renderer/modules/project-detail/*` 引入
- 本轮构建已通过，说明 `project-detail-page` 的首批 hook/组件化与当前 Next 外壳兼容
- 当前下一步建议：
  1. 继续拆 `project-detail-page` 里残留的 query 装配与初始化判定
  2. 进入 `novel-promotion` 模式树内部，继续把页面私有逻辑从大组件中抽成模块 hook
  3. 回头清理 `src/app/[locale]/workspace/[projectId]` 及其旧页面残余
- `project-detail-page` 第三轮收口已完成，新增：
  - `packages/renderer/modules/project-detail/useProjectDetailPageState.ts`
  - `packages/renderer/modules/project-detail/ProjectDetailStateViews.tsx`
- `useProjectDetailPageState` 已聚合：
  - `project` 查询
  - `episode` 查询
  - route state
  - model setup gate
  - episode actions
  - 初始化判定与 `initLoadingState`
- `ProjectDetailStateViews` 已承接：
  - loading 页面壳
  - error 页面壳
- `packages/renderer/pages/project-detail-page.tsx` 现已进一步收缩为：
  - 读取翻译与路由
  - 调用 `useProjectDetailPageState(t)`
  - 在三种状态视图之间切换，并装配 `NovelPromotionWorkspace / ProjectDetailImportGate`
- 本轮继续做了旧 `novel-promotion` 树引用调查：
  - `packages/renderer/pages/project-detail-page.tsx` 已明确只引用 `packages/renderer/modules/project-detail/novel-promotion/NovelPromotionWorkspace`
  - 全仓搜索未发现新的外部入口继续显式引用旧 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion` 树
  - 但旧树仍完整保留在 `src/app` 下，并且会被 Next 构建阶段继续编译，因此构建 warning 里仍会出现旧树文件
- 当前判断：
  - `renderer` 侧入口已经切过去了
  - 要彻底摆脱旧 `src/app/.../novel-promotion` 树，需要进入“删除旧树”阶段
  - 这一步是目录级删除，属于高风险操作，需要用户显式确认后才能执行
- `ScriptViewAssetsPanel` 已完成选择态单源化：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/script-view/hooks/useScriptViewAssetSelectionState.ts`
  - `ScriptViewAssetsPanel.tsx` 的角色/场景弹层已全部改为通过 `selectionState` 读取与写入，不再在组件体内保留独立的选择草稿状态
  - 角色选择、场景选择、弹层开关、保存中状态、变更检测都统一收口到 hook
- `NovelInputStage` 已完成首批页面私有实现下沉：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/input-stage/RatioSelector.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/input-stage/StyleSelector.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/input-stage/useNovelInputTextState.ts`
  - `NovelInputStage.tsx` 已移除内联的比例选择器、风格选择器和 IME 本地输入状态实现，页面本体继续变薄
- 本轮 `npm run desktop:build:web` 已通过，说明 `script-view` 与 `input-stage` 的这一轮模块化与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续拆 `ScriptViewScriptPanel.tsx` 的内联编辑能力
  2. 再处理 `assets/CharacterCard.tsx` 或 `CharacterSection.tsx` 这类更大的资产组件
- `ScriptViewScriptPanel` 已完成首轮组件化拆分：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/script-view/EditableText.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/script-view/screenplay.ts`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/script-view/ScreenplaySceneCard.tsx`
  - `ScriptViewScriptPanel.tsx` 已移除内联的 `EditableText` 与 screenplay 解析/场景渲染实现，当前主要保留 clips 列表编排、选中态与摘要兜底
- 当前 `script-view` 的拆分方向已形成：
  - `ScriptViewAssetsPanel` 负责资产选择编排，状态收口到 hook
  - `ScriptViewScriptPanel` 负责分段剧本列表编排，scene 渲染与内联编辑已拆成独立模块
- 本轮 `npm run desktop:build:web` 已通过，说明 `script-view` 这组拆分与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续拆 `assets/CharacterCard.tsx` 或 `assets/CharacterSection.tsx`
  2. 或继续处理 `script-view/ScriptViewRuntime.tsx` 的页面私有装配逻辑
- `CharacterSection` 已完成容器化拆分：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/character-section/useFocusedCharacterScroll.ts`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/character-section/CharacterSectionHeader.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/character-section/CharacterGroupPanel.tsx`
  - `CharacterSection.tsx` 已从“大型区块组件”收缩为：项目资产订阅 + 角色列表编排
- `CharacterCard` 已完成首轮状态下沉：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/character-card/useCharacterCardState.ts`
  - 上传、删除菜单、确认选择、本地 pending、图片派生值、任务展示态、上传态等都已收口到 hook
  - `CharacterCard.tsx` 当前更接近视图装配层，继续拆分时可以直接从 selection/compact 两种模式视图入手
- 本轮 `npm run desktop:build:web` 已通过，说明 assets 区的这轮模块化与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续拆 `CharacterCard.tsx` 的 selection/compact 模式视图
  2. 或对称处理 `LocationSection.tsx`，让角色/场景区块结构一致
- `CharacterCard` 已完成模式视图拆分：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/character-card/CharacterCardSelectionView.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/character-card/CharacterCardCompactView.tsx`
  - `CharacterCard.tsx` 当前主要负责：状态 hook 装配、动作节点拼装、selection/compact 模式分发
- `LocationSection` 已完成首轮容器化拆分：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/location-section/LocationSectionHeader.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/location-section/LocationGridItem.tsx`
  - `LocationSection.tsx` 现已退成项目资产订阅 + 场景列表编排层
- 当前 assets 区结构已明显更一致：
  - 角色区：Section -> Header / GroupPanel -> Card -> state hook + mode views
  - 场景区：Section -> Header / GridItem -> Card
- 本轮 `npm run desktop:build:web` 已通过，说明角色/场景区块的这轮模块化与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续拆 `LocationCard.tsx`，补齐与 `CharacterCard` 对称的 state/view 分层
  2. 或转去 `ScriptViewRuntime.tsx`，继续压薄 `script-view` 装配层
- `LocationCard` 已完成与 `CharacterCard` 对称的首轮分层：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/location-card/useLocationCardState.ts`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/location-card/LocationCardSelectionView.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/location-card/LocationCardCompactView.tsx`
  - `LocationCard.tsx` 当前主要负责：状态 hook 装配、动作节点拼装、selection/compact 模式分发
- 当前 assets 区角色/场景两条线已基本拉齐：
  - `Section -> Header / 列表项 -> Card -> state hook + mode views`
- 本轮 `npm run desktop:build:web` 已再次通过，说明 `LocationCard` 对称重构与当前 Next 外壳兼容
- 下一步优先级：
  1. 回到 `ScriptViewRuntime.tsx`，继续压薄 script-view 装配层
  2. 或开始清理 `packages/renderer/modules/project-detail/novel-promotion` 下仍然偏重的 stage 组件
- `ScriptViewRuntime` 已完成首轮装配层收口：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/script-view/types.ts`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/script-view/useScriptViewTranslations.ts`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/script-view/useScriptViewClipSaving.ts`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/script-view/useScriptViewClipAssetState.ts`
  - `ScriptViewRuntime.tsx` 当前主要保留：项目资产查询、assetsLoadingState 计算、`ScriptViewScriptPanel` / `ScriptViewAssetsPanel` 拼装
- 当前 `script-view` 结构已形成：
  - Runtime -> translations/state hooks -> ScriptPanel / AssetsPanel -> 子组件与局部 hook
- 本轮 `npm run desktop:build:web` 已通过，说明 `script-view` 这轮拆分与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续拆 `stage` 组件，如 `AssetsStage.tsx` 或 `PromptsStage.tsx`
  2. 或回头清理 `packages/renderer/modules/project-detail/novel-promotion` 下仍然较重的装配组件
- `AssetsStage` 已完成首轮容器化拆分：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/hooks/useAssetsStageViewState.ts`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/AssetsStageSections.tsx`
  - `AssetsStage.tsx` 已把本地视图状态（`previewImage / toast / totalAssets / getAppearances / onRefresh`）收口到轻量 hook，并把 `toolbar / 未确认档案 / 角色区 / 场景区 / modals` 的 JSX 拼装移交给 `AssetsStageSections`
- 当前 `AssetsStage` 更接近稳定容器层：保留项目资产订阅、mutation/hook 装配和子组件 props 组合，不再直接承载大块 JSX 结构
- 本轮 `npm run desktop:build:web` 已通过，说明 `AssetsStage` 的这轮容器化拆分与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续拆 `PromptsStage.tsx` 或其他仍偏重的 stage 容器
  2. 或继续抽 `AssetsStage` 的 props 组合逻辑，进一步压薄容器层
- `prompts-stage` 已完成一轮视图拼装拆分：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/prompts-stage/PromptListToolbar.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/prompts-stage/PromptAppendSection.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/prompts-stage/PromptStageNextButton.tsx`
  - `PromptListPanel.tsx` 已把列表头部和视图切换拼装移交给 `PromptListToolbar`
  - `PromptEditorPanel.tsx` 已把追加输入区和下一步按钮移交给独立视图组件
- 当前 `prompts-stage` 结构更接近：
  - `PromptsStageLayout` 负责 runtime 装配
  - `PromptListPanel / PromptEditorPanel` 负责容器分发
  - `PromptListToolbar / PromptAppendSection / PromptStageNextButton` 承担页面私有视图块
- 本轮 `npm run desktop:build:web` 已通过，说明 `prompts-stage` 这轮拆分与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续清理 `packages/renderer/modules/project-detail/novel-promotion/components` 下仍偏重的 stage/container
  2. 或回头收缩 `AssetsStage` 中仍较长的 props 组合逻辑
- `NovelInputStage` 已完成首轮视图块拆分：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/input-stage/CurrentEpisodeBanner.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/input-stage/NovelTextInputPanel.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/input-stage/NovelInputConfigPanel.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/input-stage/NovelInputActionPanel.tsx`
  - `NovelInputStage.tsx` 已退回输入同步与顶层状态编排层，不再直接承载大块文案和配置/操作区 JSX
- `WorkspaceHeaderShell` 已完成首轮头部装配拆分：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/workspace-header/WorkspaceHeaderModals.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/workspace-header/WorkspaceEpisodeSelector.tsx`
  - `WorkspaceHeaderShell.tsx` 已把设置/世界观弹窗与剧集选择器排序映射移出，当前更接近导航与顶部动作壳
- 本轮 `npm run desktop:build:web` 已通过，说明 `NovelInputStage` 与 `WorkspaceHeaderShell` 这轮拆分与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续压缩 `AssetsStage.tsx` 的 props 组合逻辑
  2. 或继续清理 `WorkspaceHeaderShell` 相关类型与壳层，进一步收口 header 容器
- `AssetsStage` 已完成第二轮容器瘦身：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/hooks/useAssetsStageSectionProps.ts`
  - `AssetsStage.tsx` 已把 `statusOverlayProps / toolbarProps / unconfirmedProfilesProps / characterSectionProps / locationSectionProps / modalsProps` 的组合逻辑整体移交给新 hook
  - `AssetsStage` 当前更接近：项目资产订阅 + 业务 hook 装配 + `AssetsStageSections` 分发
- 本轮修正了 `handleConfirmProfile` 在未确认档案区和弹窗区之间的签名差异，确保 `AssetsStageModals` 仍拿到完整回调契约
- 本轮 `npm run desktop:build:web` 已通过，说明 `AssetsStage` 的第二轮瘦身与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续清理 `WorkspaceHeaderShell` 周边重复类型，收口 header 边界
  2. 或继续找 `novel-promotion` 下仍偏重的 runtime/container 做同类拆分
- `AssetsStageModals` 已完成首轮分组拆分：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/AssetsStageModalTypes.ts`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/AssetsEditingModals.tsx`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/AssetsSupportModals.tsx`
  - `AssetsStageModals.tsx` 现在只负责两组 modal 的分发，不再直接承载所有编辑/创建/音色/档案/全局复制 JSX
- 当前 modal 结构已形成：
  - `AssetsEditingModals`：预览、图片编辑、角色/场景编辑、角色/场景创建
  - `AssetsSupportModals`：音色设计、角色档案确认、全局资产复制
- 本轮 `npm run desktop:build:web` 已通过，说明 `AssetsStageModals` 这轮分组拆分与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续清理 `WorkspaceHeaderShell` 周边类型重复
  2. 或继续找 `novel-promotion` 下其余偏重 runtime/container 做同类拆分
- `WorkspaceHeaderShell` 已完成第二轮壳层瘦身：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/workspace-header/types.ts`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/workspace-header/WorkspaceHeaderControls.tsx`
  - `WorkspaceHeaderShell.tsx` 已移除本地重复的 `EpisodeSummary / UserModelsPayload / nav item` 类型声明，并把 `CapsuleNav + WorkspaceTopActions` 装配移交给 `WorkspaceHeaderControls`
  - `WorkspaceHeaderModals.tsx`、`WorkspaceEpisodeSelector.tsx` 已开始共用 `workspace-header/types.ts`
- 当前 header 结构更接近：
  - `WorkspaceHeaderModals`：设置/世界观弹窗装配
  - `WorkspaceEpisodeSelector`：剧集排序与映射
  - `WorkspaceHeaderControls`：阶段导航与顶部动作
  - `WorkspaceHeaderShell`：三块壳层分发
- 本轮 `npm run desktop:build:web` 已通过，说明 header 这轮类型收口与控制区拆分与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续清理其余重复类型与 runtime/container 壳层
  2. 或回到 `novel-promotion` 其他偏重组件继续做同类拆分
- `WorkspaceRunStreamConsoles` 已完成重复控制台渲染收口：
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/run-stream-console/types.ts`
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/run-stream-console/RunStreamConsoleOverlay.tsx`
  - `WorkspaceRunStreamConsoles.tsx` 已把 story-to-script 与 script-to-storyboard 两套几乎相同的 overlay 渲染压成复用组件，父组件只保留两次实例化和文案传参
- 当前 run-stream 控制台结构更接近：
  - `RunStreamConsoleOverlay`：最小化徽标、fallback stage、选中态/活动态、重试和 overlay 卡片渲染
  - `WorkspaceRunStreamConsoles`：两路 stream 的壳层分发
- 本轮 `npm run desktop:build:web` 已通过，说明 run-stream 控制台这轮抽象与当前 Next 外壳兼容
- 下一步优先级：
  1. 继续找 `script-view` 或 `storyboard` 下仍偏重的装配层
  2. 或继续清理 `novel-promotion` 目录里的重复类型与壳层
- 2026-03-23 08:41:55：继续收认证边界，开始把页面入口从直接 `next-auth/react` 状态判断切到 `packages/renderer/auth` 的统一守卫 hook。
  - `packages/renderer/auth/client.tsx` 新增 `useRequiredRendererSession` 与 `useGuestRendererSession`，分别收口“受保护页面跳登录页”和“访客页面已登录即跳工作区”的重定向时机。
  - `packages/renderer/pages/profile-page.tsx`、`packages/renderer/modules/workspace/useWorkspacePageState.ts`、`src/app/[locale]/page.tsx` 已切到新 hook，不再各自维护 `status/session + useEffect(router.push/replace)`。
  - `src/app/[locale]/auth/signin/page.tsx`、`src/app/[locale]/auth/signup/page.tsx` 也已切到 `useGuestRendererSession`，已登录用户不会再停留在认证页。
  - 当前 `packages/renderer` 页面入口的认证边界已开始成型：页面层主要消费 `canRenderProtected / canRenderGuest / isLoading`，后续替换本地身份体系时改动面会继续缩小。
- 本轮 `npm run desktop:build:web` 已通过，说明 renderer 认证守卫这轮收口与当前 Next 外壳兼容。
- 下一步优先级：
  1. 继续扩展 `packages/renderer/auth`，把认证页表单提交后的跳转与常用加载态继续收口
  2. 或回到 `script-view / storyboard` 这类仍偏重的 runtime/container 继续做同类拆分
- 2026-03-23 08:41:55：renderer 认证边界继续推进，认证页入口也开始迁入 `packages/renderer`。
  - 新增 `packages/renderer/pages/signin-page.tsx`、`packages/renderer/pages/signup-page.tsx`，登录/注册页现在和 `profile / workspace / asset-hub / project-detail` 一样走 renderer 页面入口。
  - 新增 `packages/renderer/modules/auth/useSignInForm.ts`、`packages/renderer/modules/auth/useSignUpForm.ts`，把认证表单的字段状态、提交流程、错误/成功反馈从 `src/app` 页面里抽出。
  - `src/app/[locale]/auth/signin/page.tsx`、`src/app/[locale]/auth/signup/page.tsx` 已退成薄入口，只负责转发到 `@renderer/pages/*`。
  - 当前 renderer 认证入口结构已经形成：
    - `packages/renderer/auth`：会话 provider 与 route guards
    - `packages/renderer/pages`：登录/注册页面入口
    - `packages/renderer/modules/auth`：认证表单状态与提交逻辑
- 本轮 `npm run desktop:build:web` 已通过，说明认证页 renderer 化与当前 Next 外壳兼容。
- 下一步优先级：
  1. 继续把 auth 常用加载态/跳转策略做成更统一的 renderer auth 边界
  2. 或回到 `storyboard / script-view` 这类仍偏重的 runtime/container 继续做同类拆分
- 2026-03-23 08:41:55：renderer 认证入口继续扩展，首页与等待态也开始并入 `packages/renderer`。
  - 新增 `packages/renderer/auth/RendererSessionPendingScreen.tsx`，统一承接认证相关的等待态展示，支持文本与 logo 两种模式。
  - 新增 `packages/renderer/pages/landing-page.tsx`，首页入口已迁入 renderer；`src/app/[locale]/page.tsx` 现在退成薄入口，只转发到 `@renderer/pages/landing-page`。
  - `packages/renderer/pages/profile-page.tsx`、`workspace-page.tsx`、`signin-page.tsx`、`signup-page.tsx` 已改为复用 `RendererSessionPendingScreen`，页面层不再各自维护重复的认证等待态结构。
  - 结合上一轮的 `useRequiredRendererSession / useGuestRendererSession`、认证页 renderer 化、认证表单 hooks 抽离，当前 renderer 认证入口的结构进一步清晰：
    - `packages/renderer/auth`：provider、route guard、pending screen
    - `packages/renderer/pages`：landing / signin / signup / profile / workspace 页面入口
    - `packages/renderer/modules/auth`：认证表单状态与提交流程
- 本轮 `npm run desktop:build:web` 已通过，说明首页 renderer 化与认证等待态抽象与当前 Next 外壳兼容。
- 下一步优先级：
  1. 继续减少 `src/app` 旧页面树对主链的承担，优先处理剩余非薄入口页面
  2. 或回到 `storyboard / script-view` 这类仍偏重的 runtime/container 继续做同类拆分
- 2026-03-23 08:41:55：继续削减 `packages/renderer` 对旧 `src/app` 页面树的直接依赖。
  - `packages/renderer/modules/project-detail/novel-promotion/components/voice/SpeakerVoiceBindingDialog.tsx` 已改为引用 `@renderer/modules/asset-hub/components/VoicePickerDialog` 和 `VoiceCreationModal`。
  - 原先这条链仍直接指向 `src/app/[locale]/workspace/asset-hub/components/*`，会让 `project-detail -> novel-promotion -> voice` 仍然挂在旧页面树上；现在这条依赖已经回收到 renderer 内部。
  - 当前 `packages/renderer/modules/project-detail/novel-promotion/components/voice` 与 `packages/renderer/modules/asset-hub/components` 已形成直接依赖，不再通过旧 `src/app` 组件树过桥。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续扫描 `packages/renderer` 中是否还残留对 `src/app` 组件或页面目录的直接引用
  2. 或回到 `storyboard / script-view`，继续拆仍然偏重的 renderer 容器组件
- 2026-03-23 08:41:55：回到 `storyboard` 容器层继续瘦身，开始压缩 `index.tsx` 与 `StoryboardCanvas.tsx`。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/StoryboardStageModals.tsx`，把图片编辑、AI 数据、预览、角色/场景选择器的整块弹窗编排从 `storyboard/index.tsx` 抽出。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/hooks/useStoryboardStageSectionProps.ts`，把 `StoryboardToolbar` 和 `StoryboardCanvas` 的 props 组合逻辑从 `index.tsx` 抽到独立 hook。
  - `storyboard/index.tsx` 现在主要保留 `controller + modalRuntime + StoryboardStageShell` 三层装配，不再直接承载两大块 props 拼装和整段 modal JSX。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/StoryboardCanvas.types.ts` 与 `StoryboardCanvasItem.tsx`，把 `StoryboardCanvas.tsx` 中单个分镜组项与“在此插入”按钮的列表项编排抽成独立组件。
  - `StoryboardCanvas.tsx` 现在只保留空态和列表遍历，不再承载整段 `map(storyboard)` 逻辑。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续拆 `StoryboardGroup.tsx`，把 header/actions/screenplay/panel list 之外的状态与视图片段继续下沉
  2. 或继续处理 `hooks/usePanelCrudActions.ts`，把 300+ 行任务与保存协调逻辑再切开一层
- 2026-03-23 08:41:55：继续压缩 `StoryboardGroup.tsx`。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/hooks/useStoryboardGroupViewState.ts`，把组级面板任务状态判断、运行中数量、待生成数量、overlay 状态和清错后再生图逻辑从组件体抽出。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/StoryboardGroupClipSection.tsx`，把剧情折叠区与 screenplay/source text 视图从 `StoryboardGroup.tsx` 抽出。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/StoryboardGroupChrome.tsx`，把 failed alert、overlay、header、actions 顶栏壳层收口。
  - `StoryboardGroup.tsx` 现在更接近“group runtime + clip section + panel list + dialogs”的分发层，不再自己承载顶部壳层和状态计算。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `hooks/usePanelCrudActions.ts` 这类 300+ 行的重逻辑 hook
  2. 或继续拆 `PanelVariantModal.tsx` / `AIDataModalFormPane.tsx` 这类 storyboard 子视图重块
- 2026-03-23 08:41:55：继续瘦身 `hooks/usePanelCrudActions.ts`。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/hooks/usePanelSaveLifecycle.ts`，把 `PanelSaveCoordinator`、debounce、retry、saveState、savingPanels、清理面板保存生命周期等逻辑从 `usePanelCrudActions.ts` 抽出。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/hooks/usePanelAssetEditActions.ts`，把角色添加、角色移除、场景设置三类局部编辑动作从 `usePanelCrudActions.ts` 抽出。
  - `usePanelCrudActions.ts` 现在主要负责：
    - 接入 `usePanelSaveLifecycle`
    - 处理新增面板/删除面板
    - 汇总返回保存态与局部编辑动作
  - 这样 storyboard 这条链的“生命周期协调”和“局部资产编辑”已经开始与 CRUD 业务动作分层。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `PanelVariantModal.tsx` 或 `AIDataModalFormPane.tsx` 这类仍偏重的 storyboard 子视图
  2. 或继续拆 `usePanelCrudActions.ts` 中新增/删除面板的业务动作壳层
- 2026-03-23 08:41:55：继续瘦身 `PanelVariantModal.tsx`。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/hooks/usePanelVariantModalState.ts`，把自动分析、推荐列表状态、自定义输入、资源包含开关、关闭与提交逻辑从弹窗主体中抽出。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/PanelVariantModalPanelInfo.tsx`，承接左侧面板图片预览与原描述区。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/PanelVariantModalFooter.tsx`，承接底部取消/自定义生成按钮与提交态。
  - `PanelVariantModal.tsx` 现在主要负责 portal、头部、suggestion/custom 区域装配，不再直接承载整段运行时状态逻辑和底部按钮区。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `AIDataModalFormPane.tsx`
  2. 或继续拆 `PanelVariantModal` 周边 suggestion/custom 视图片区块
- 2026-03-23 09:55:00：继续瘦身 `AIDataModalFormPane.tsx` 和 `AIDataModal.tsx`。
  - 新增 `AIDataModalFormPane.types.ts`，统一收口 `AIDataModalFormPane` 及其分区子组件的 props 契约。
  - 新增 `AIDataModalBasicSection.tsx`、`AIDataModalPhotographySection.tsx`、`AIDataModalActingSection.tsx`，把基础信息、摄影规则、表演说明三段表单区块从 `AIDataModalFormPane.tsx` 抽出。
  - `AIDataModalFormPane.tsx` 现在主要负责三段子视图的组合，不再直接承载完整表单大块 JSX。
  - 新增 `AIDataModalHeader.tsx`、`AIDataModalFooter.tsx`、`buildAIDataPreviewJson.ts`，把弹窗头部、底部动作区和预览 JSON 组装从 `AIDataModal.tsx` 抽出。
  - `AIDataModal.tsx` 现在更接近“状态 hook + 预览数据装配 + 头/体/尾分发”的容器层。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续压缩 `AIDataModalPreviewPane.tsx` 或 `AIDataModal.tsx` 周边剩余容器逻辑
  2. 或回到 `storyboard` 下一个仍偏重的 modal/runtime 组件继续做同类拆分
- 2026-03-23 10:15:00：继续瘦身 `InsertPanelModal.tsx`。
  - 新增 `InsertPanelModal.types.ts`，统一收口插入分镜弹窗的 `PanelInfo` 与主 props 契约。
  - 新增 `hooks/useInsertPanelModalState.ts`，把 `mounted`、`userInput`、分析/插入任务展示态、关闭逻辑、自动分析/确认插入动作从弹窗主体中抽出。
  - 新增 `InsertPanelModalPanelsPreview.tsx`，承接前后镜头预览与中间插入指示区。
  - 新增 `InsertPanelModalActions.tsx`，承接 AI 分析与确认插入按钮区。
  - `InsertPanelModal.tsx` 现在主要负责 portal、标题壳、输入框和子区块装配，不再直接承载整段状态初始化、前后镜头预览和按钮区 JSX。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `AIDataModalPreviewPane.tsx` 或相邻轻量 modal 视图片区块
  2. 或转向 `ImageEditModal.tsx` 这类仍偏重的 storyboard 编辑弹窗
- 2026-03-23 10:32:00：继续瘦身 `ImageEditModal.tsx`。
  - 新增 `ImageEditModal.types.ts`，统一收口图片编辑弹窗自身、参考图上传区和底部动作区的 props 契约。
  - 新增 `hooks/useImageEditModalState.ts`，把 `editPrompt/editImages/selectedAssets/showAssetPicker/previewImage`、文件上传、粘贴、资产增删、提交校验从主组件中抽出。
  - 新增 `ImageEditModalReferenceImages.tsx`，承接参考图上传与缩略图删除区。
  - 新增 `ImageEditModalFooter.tsx`，承接取消/开始编辑按钮区。
  - `ImageEditModal.tsx` 现在主要负责项目资产查询、状态 hook 装配、选中资产区、资产选择器与预览弹窗分发。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `AIDataModalPreviewPane.tsx` 或 `CandidateSelector.tsx`
  2. 或继续压 `ImageEditModalAssetPicker.tsx` 这类仍偏重的 storyboard 编辑弹窗子区块
- 2026-03-23 10:48:00：继续瘦身 `ImageEditModalAssetPicker.tsx`。
  - 新增 `ImageEditModalCharacterSection.tsx`，把角色资产网格、形象多版本展示、选择/取消选择、预览图片逻辑从资产选择器主体中抽出。
  - 新增 `ImageEditModalLocationSection.tsx`，把场景资产网格、已选图片解析、选择/取消选择、预览图片逻辑从资产选择器主体中抽出。
  - `ImageEditModalAssetPicker.tsx` 现在主要负责弹窗壳、标题区、确认按钮和角色/场景区块分发，不再直接承载两大段资产网格渲染。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `CandidateSelector.tsx`
  2. 或继续压 `AIDataModalPreviewPane.tsx` 这类轻量展示块的内联逻辑
- 2026-03-23 11:08:00：继续瘦身 `CandidateSelector.tsx`。
  - 新增 `CandidateSelector.types.ts`，统一收口候选图选择器及缩略图项的 props 契约。
  - 新增 `hooks/useCandidateSelectorState.ts`，把确认中状态、任务展示态、缩略图尺寸计算、当前选中文案和确认动作从主组件中抽出。
  - 新增 `CandidateSelectorThumbnail.tsx`，承接原图与候选图的单项缩略图渲染、选中态和放大按钮壳层。
  - 新增 `CandidateSelectorFooter.tsx`，承接当前选中项说明、取消/确认按钮区。
  - `CandidateSelector.tsx` 现在主要负责头部壳、原图/候选图列表分发和底部区装配，不再直接承载确认状态与全部缩略图 JSX。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `AIDataModalPreviewPane.tsx`
  2. 或继续压 `ScreenplayDisplay.tsx` / `StoryboardPanelList.tsx` 这类仍偏重的 storyboard 展示容器
- 2026-03-23 11:28:00：继续瘦身 `ScreenplayDisplay.tsx`。
  - 新增 `ScreenplayDisplay.types.ts`，统一收口剧本展示所需的 scene/content/tab 类型与主 props 契约。
  - 新增 `hooks/useScreenplayDisplayState.ts`，把剧本 JSON 解析、解析失败兜底和页签状态从主组件中抽出。
  - 新增 `ScreenplayDisplayTabs.tsx`，承接格式化剧本/原文切换按钮区。
  - 新增 `ScreenplaySceneBlock.tsx` 与 `ScreenplayContentItem.tsx`，把场景级渲染和 action/dialogue/voiceover 三类内容块从主组件中抽出。
  - `ScreenplayDisplay.tsx` 现在主要负责状态 hook 装配、页签分发和格式化剧本/原文两类视图切换，不再直接承载整段场景与内容渲染 JSX。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `AIDataModalPreviewPane.tsx`
  2. 或继续压 `StoryboardPanelList.tsx` 这类仍偏重的 storyboard 展示容器
- 2026-03-23 11:50:00：继续瘦身 `StoryboardPanelList.tsx`。
  - 新增 `StoryboardPanelList.types.ts`，统一收口列表级与单项级 props、以及面板视图模型结构。
  - 新增 `hooks/useStoryboardPanelListItems.ts`，把列表项 `imageUrl/globalPanelNumber`、修改中/删除中/保存中状态、失败信息、编辑数据和候选图数据的计算从主组件中抽出。
  - 新增 `StoryboardPanelListItem.tsx`，承接单个面板项的 wrapper、z-index 计算和 `PanelCard` 桥接。
  - `StoryboardPanelList.tsx` 现在主要负责网格壳、纵横版列数选择和面板项分发，不再直接承载整段列表项状态计算与 `PanelCard` 参数拼装。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `AIDataModalPreviewPane.tsx`
  2. 或继续压 `PanelCard.tsx` / `StoryboardGroupDialogs.tsx` 这类仍偏重的 storyboard 桥接容器
- 2026-03-23 12:10:00：继续瘦身 `PanelCard.tsx`。
  - 新增 `PanelCard.types.ts`，统一收口面板卡片与候选图数据的 props 契约。
  - 新增 `PanelCardDeleteButton.tsx`，把右上角删除按钮从卡片主体中抽出。
  - 新增 `PanelCardSideActions.tsx`，把图片区域右侧的插入分镜/镜头变体按钮区从卡片主体中抽出。
  - 新增 `PanelCardEditorSection.tsx`，把 `PanelEditForm` 的状态桥接和编辑区 JSX 从卡片主体中抽出。
  - `PanelCard.tsx` 现在主要负责 `GlassSurface` 壳、`ImageSection` 和三个子区块装配，不再直接承载删除按钮、侧边动作区和编辑区的具体 JSX。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `StoryboardGroupDialogs.tsx`
  2. 或继续压 `AIDataModalPreviewPane.tsx` 这类轻量展示块的内联逻辑
- 2026-03-23 12:35:00：继续瘦身 `ImageSection.tsx`。
  - 新增 `ImageSection.types.ts`，统一收口图片区与候选图数据的 props 契约。
  - 新增 `hooks/useImageSectionState.ts`，把图片区脉冲动画状态、比例转换和候选图可用性判断从主组件中抽出。
  - 新增 `ImageSectionBadges.tsx`，把镜头编号和景别角标区从主组件中抽出。
  - 新增 `ImageSectionStatusContent.tsx`，把加载中/失败/空态三类状态内容从主组件中抽出，保留原有再生图触发逻辑。
  - 新增 `ImageSectionContent.tsx`，承接候选图模式、状态内容、正常图片展示三类主体内容分发。
  - `ImageSection.tsx` 现在主要负责外层容器、状态 hook 装配、主体内容区、角标区和动作按钮区分发，不再直接承载整段状态分支与状态视图 JSX。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `StoryboardGroupDialogs.tsx`
  2. 或继续压 `AIDataModalPreviewPane.tsx` / `PanelVariantModalSuggestionList.tsx` 这类剩余展示桥接块
- 2026-03-23 12:55:00：继续瘦身 `PanelVariantModalSuggestionList.tsx`。
  - 新增 `PanelVariantModalSuggestionList.types.ts`，统一收口推荐列表与单项建议卡片的 props 契约。
  - 新增 `PanelVariantModalSuggestionListHeader.tsx`，承接推荐区标题、分析中状态和重新分析按钮区。
  - 新增 `PanelVariantSuggestionItem.tsx`，承接单条推荐卡片的评分、标题描述、镜头参数和选择按钮区。
  - 新增 `PanelVariantModalSuggestionEmptyState.tsx`，承接“点击分析”空态提示。
  - `PanelVariantModalSuggestionList.tsx` 现在主要负责头部、错误提示、建议列表和空态分发，不再直接承载整段单项卡片 JSX。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `StoryboardGroupDialogs.tsx`
  2. 或继续压 `AIDataModalPreviewPane.tsx` 这类轻量展示块的复制逻辑
- 2026-03-23 13:18:00：继续瘦身 `AIDataModalPreviewPane.tsx` 和 `StoryboardGroupDialogs.tsx`。
  - 新增 `AIDataModalPreviewPane.types.ts`，统一收口预览区 props 契约。
  - 新增 `copyPreviewJsonToClipboard.ts`，把 JSON 文本复制与降级 fallback 逻辑从预览区主体中抽出。
  - 新增 `AIDataModalPreviewHeader.tsx`，承接预览标题和复制按钮区。
  - `AIDataModalPreviewPane.tsx` 现在主要负责 `previewText` 计算和头部/代码区分发，不再直接承载整段复制逻辑。
  - 新增 `StoryboardGroupDialogs.types.ts`，统一收口插入分镜弹窗与变体弹窗桥接所需的快照类型与主 props 契约。
  - 新增 `StoryboardGroupInsertDialog.tsx` 和 `StoryboardGroupVariantDialog.tsx`，分别承接插入分镜弹窗与镜头变体弹窗的条件渲染与参数桥接。
  - `StoryboardGroupDialogs.tsx` 现在主要负责两个子弹窗桥接组件的分发，不再直接承载两段弹窗 JSX。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `ImageSectionActionButtons.tsx`
  2. 或继续压 `StoryboardGroup.tsx` / `index.tsx` 这类仍偏重的 storyboard 容器
- 2026-03-23 13:38:00：继续瘦身 `ImageSectionActionButtons.tsx`。
  - 新增 `ImageSectionActionButtons.types.ts`，统一收口图片区动作条的 props 契约。
  - 新增 `hooks/useImageSectionActionButtonsState.ts`，把候选图生成数量状态、重新生成点击日志和触发逻辑从动作条主体中抽出。
  - 新增 `ImageSectionPrimaryActions.tsx`，承接重新生成、查看 AI 数据、AI 编辑三类主动作区。
  - 新增 `ImageSectionUndoAction.tsx`，承接撤回上一版本按钮区与显示条件。
  - `ImageSectionActionButtons.tsx` 现在主要负责动作壳和主动作区/撤回动作的分发，不再直接承载整段按钮配置与重新生成逻辑。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `StoryboardGroup.tsx` / `index.tsx`
  2. 或继续压 `AIDataModalPhotographySection.tsx` 这类仍偏重的 storyboard 表单区块
- 2026-03-23 14:08:00：继续瘦身 `StoryboardGroup.tsx`。
  - 新增 `hooks/useStoryboardGroupSectionProps.ts`，把 `StoryboardGroupChrome`、`StoryboardPanelList`、`StoryboardGroupDialogs` 三段的 props 汇总从主组件中抽出。
  - `StoryboardGroup.tsx` 现在主要负责运行时 hook 调用、分段 props hook 装配和三块子区的分发，不再直接承载大段 props 桥接细节。
  - 插入分镜禁用规则、面板列表桥接、弹窗桥接与顶部 chrome 桥接都已经集中到 section-props hook 内，后续继续收容器时边界会更清晰。
- 本轮 `npm run desktop:build:web` 已通过（重定向日志构建）。
- 下一步优先级：
  1. 继续处理 `AIDataModalPhotographySection.tsx`
  2. 或继续压 `storyboard/index.tsx` 这一层的容器装配
- 2026-03-23 14:35:00：继续瘦身 `AIDataModalPhotographySection.tsx`。
  - 新增 `AIDataModalPhotographyFields.tsx`，把摄影规则里的摘要、光线、景深、色调字段从主组件中抽出。
  - 新增 `AIDataModalPhotographyCharacters.tsx`，把角色站位、姿态、朝向编辑区从主组件中抽出。
  - `AIDataModalPhotographySection.tsx` 现在主要负责摄影规则段落标题和两个子区块分发，不再直接承载整段字段 JSX。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `storyboard/index.tsx`
  2. 或继续压 `StoryboardGroup.tsx` 周边仍残留的桥接层
- 2026-03-23 15:10:00：继续瘦身 `storyboard/index.tsx`。
  - 新增 `hooks/useStoryboardStageRuntime.ts`，把 `controller`、`modalRuntime`、`section props` 以及 `isNextDisabled`/`transitioningState` 这组运行时装配从主组件中抽出。
  - `storyboard/index.tsx` 现在主要负责读取页面入参、调用 `useStoryboardStageRuntime`，然后把结果分发给 `StoryboardStageShell`、`StoryboardToolbar`、`StoryboardCanvas`、`StoryboardStageModals`。
  - `StoryboardStage` 已退成入口壳，不再直接承载大段 controller 字段解构和 modal runtime 装配。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `AIDataModalBasicSection.tsx`
  2. 或继续压 `StoryboardToolbar.tsx` / `StoryboardStageShell.tsx` 这类 storyboard 外层壳组件
- 2026-03-23 16:05:00：继续瘦身 `AIDataModalBasicSection.tsx`。
  - 新增 `AIDataModalBasicPrimaryFields.tsx`，把镜头类型和运镜方式输入区从主组件中抽出。
  - 新增 `AIDataModalBasicSceneSummary.tsx`，把场景和角色摘要展示区从主组件中抽出。
  - 新增 `AIDataModalBasicPrompts.tsx`，把视觉描述和视频提示词输入区从主组件中抽出。
  - `AIDataModalBasicSection.tsx` 现在主要负责基础数据段落标题和三个子区块分发，不再直接承载整段基础表单 JSX。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `AIDataModalActingSection.tsx`
  2. 或继续压 `StoryboardToolbar.tsx` / `StoryboardStageShell.tsx` 这类 storyboard 外层壳组件
- 2026-03-23 16:45:00：继续瘦身 `AIDataModalActingSection.tsx`。
  - 新增 `AIDataModalActingHeader.tsx`，把表演说明区的标题壳从主组件中抽出。
  - 新增 `AIDataModalActingCharacterCard.tsx`，把单个角色的表演说明编辑卡片从主组件中抽出。
  - `AIDataModalActingSection.tsx` 现在主要负责空态判定、标题分发和角色卡片列表渲染，不再直接承载单项编辑卡片 JSX。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `AIDataModalFormPane.tsx`
  2. 或继续压 `StoryboardToolbar.tsx` / `StoryboardStageShell.tsx` 这类 storyboard 外层壳组件
- 2026-03-23 17:25:00：继续瘦身 `AIDataModal.tsx`。
  - 新增 `hooks/useAIDataModalRuntime.ts`，把 `useAIDataModalState`、预览 JSON 生成、header/form/preview/footer 四段 props 装配以及保存关闭联动从主组件中抽出。
  - `AIDataModal.tsx` 现在主要负责开关判断和弹窗骨架分发，不再直接承载整段状态解构、预览 JSON 组装和 props 桥接。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `StoryboardHeader.tsx`
  2. 或继续压 `AIDataModalFormPane.tsx` 周边容器
- 2026-03-23 18:20:00：继续瘦身 `StoryboardHeader.tsx`。
  - 新增 `StoryboardHeader.types.ts`，统一收口头部摘要区和动作区的 props 契约。
  - 新增 `hooks/useStoryboardHeaderState.ts`，把运行中任务展示态解析从主组件中抽出。
  - 新增 `StoryboardHeaderSummary.tsx`，承接标题、分镜统计、运行中角标和并发上限展示。
  - 新增 `StoryboardHeaderActions.tsx`，承接批量生成、下载全部和返回按钮区。
  - `StoryboardHeader.tsx` 现在主要负责翻译、状态 hook 装配和摘要区/动作区分发，不再直接承载整段头部 JSX。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `StoryboardToolbar.tsx`
  2. 或继续压 `AIDataModalFormPane.tsx` 周边容器
- 2026-03-23 19:00:00：继续瘦身 `StoryboardToolbar.tsx` 和 `StoryboardStageShell.tsx`。
  - 新增 `StoryboardToolbar.types.ts`，统一收口工具栏和“开头新增分镜组”按钮的 props 契约。
  - 新增 `StoryboardAddGroupButton.tsx`，把工具栏里的“在开头新增分镜组”按钮区从主组件中抽出。
  - `StoryboardToolbar.tsx` 现在主要负责 `StoryboardHeader` 和 `StoryboardAddGroupButton` 两段分发，不再直接承载按钮 JSX。
  - 新增 `StoryboardStageShell.types.ts`，统一收口外层壳和固定下一步按钮的 props 契约。
  - 新增 `StoryboardStageNextButton.tsx`，把固定底部“下一步/生成视频”按钮区从外层壳组件中抽出。
  - `StoryboardStageShell.tsx` 现在主要负责布局壳和 `children`/`StoryboardStageNextButton` 分发，不再直接承载固定按钮 JSX。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `AIDataModalFormPane.tsx` 周边容器
  2. 或继续压 `StoryboardStageModals.tsx` 这类 storyboard 分发层
- 2026-03-23 19:35:00：继续瘦身 `StoryboardStageModals.tsx`。
  - 新增 `StoryboardStageModals.types.ts`，统一收口主弹窗组、资产选择器组和外层分发的契约。
  - 新增 `StoryboardStagePrimaryModals.tsx`，承接图片编辑弹窗、AI 数据弹窗和图片预览弹窗的桥接。
  - 新增 `StoryboardStageAssetPickers.tsx`，承接角色选择器和场景选择器的桥接。
  - `StoryboardStageModals.tsx` 现在主要负责主弹窗组和资产选择器组两段分发，不再直接承载五段 modal JSX。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `AIDataModalFormPane.tsx` 周边容器
  2. 或继续压 `StoryboardCanvasItem.tsx` / `StoryboardCanvas.tsx` 这类 storyboard 列表桥接层
- 2026-03-23 20:10:00：继续瘦身 `StoryboardCanvas.tsx` 和 `StoryboardCanvasItem.tsx`。
  - 新增 `StoryboardCanvasEmptyState.tsx`，把画布空态展示从主组件中抽出。
  - 新增 `StoryboardCanvasInsertButton.tsx`，把“在此插入分镜组”按钮区从单项组件中抽出。
  - 新增 `StoryboardCanvasItem.types.ts`，统一收口单项桥接契约。
  - 新增 `hooks/useStoryboardCanvasItemState.ts`，把 `clip`、`textPanels`、提交态、候选态、失败态和是否已有图片这组派生状态从单项组件中抽出。
  - `StoryboardCanvas.tsx` 现在主要负责空态/列表分发；`StoryboardCanvasItem.tsx` 现在主要负责 `StoryboardGroup` 和插入按钮两段桥接，不再直接承载派生状态计算和按钮 JSX。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `StoryboardCanvasItem.tsx` 到 `StoryboardGroup.tsx` 的 props 桥接
  2. 或继续压 `AIDataModalFormPane.tsx` 周边容器
- 2026-03-23 20:40:00：继续瘦身 `StoryboardCanvasItem.tsx`。
  - 新增 `hooks/useStoryboardCanvasItemGroupProps.ts`，把 `StoryboardGroup` 的长 props 桥接从单项组件中抽出。
  - `StoryboardCanvasItem.tsx` 现在主要负责状态 hook、`StoryboardGroup` 分发和插入按钮分发，不再直接承载整段 `StoryboardGroup` 参数组装。
- 本轮 `npm run desktop:build:web` 已通过（日志构建在工具超时后继续完成，尾部已确认产物汇总）。
- 下一步优先级：
  1. 继续处理 `StoryboardGroup.tsx` 周边 props 聚合
  2. 或继续压 `AIDataModalFormPane.tsx` 周边容器
- 2026-03-23 21:05:00：继续瘦身 `StoryboardGroup.tsx`。
  - 新增 `hooks/useStoryboardGroupRuntime.ts`，把插入/变体 runtime、任务错误映射、组级视图状态和 section props 装配统一收进上层 group runtime。
  - `StoryboardGroup.tsx` 现在主要负责容器 class 分发、`StoryboardGroupChrome`、`StoryboardGroupClipSection`、`StoryboardPanelList`、`StoryboardGroupDialogs` 四段视图分发，不再自己串联四个 runtime hook。
- 本轮 `npm run desktop:build:web` 已通过（沙箱内直跑触发 `spawn EPERM`，已使用提权构建完成验证）。
- 下一步优先级：
  1. 继续处理 `AIDataModalFormPane.tsx` 周边容器
  2. 或继续压 `StoryboardGroupChrome.tsx` / `StoryboardPanelList.tsx` 这类局部桥接层
- 2026-03-23 21:35:00：继续瘦身 `StoryboardGroupChrome.tsx`。
  - 新增 `StoryboardGroupChrome.types.ts`，统一收口状态层和主行布局的 props 契约。
  - 新增 `StoryboardGroupChromeStatus.tsx`，承接失败警告和任务覆盖层。
  - 新增 `StoryboardGroupChromeMainRow.tsx`，承接头部和动作区布局分发。
  - `StoryboardGroupChrome.tsx` 现在主要负责状态层和主行布局两段分发，不再直接承载整段警告、覆盖层和头部动作 JSX。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `AIDataModalFormPane.tsx` 周边容器
  2. 或继续压 `StoryboardPanelList.tsx` / `StoryboardGroupActions.tsx` 这类局部桥接层
- 2026-03-23 22:05:00：继续瘦身 `StoryboardGroupActions.tsx`。
  - 新增 `StoryboardGroupActions.types.ts`，统一收口动作区、文本再生按钮、批量生成按钮和管理按钮的 props 契约。
  - 新增 `hooks/useStoryboardGroupActionsState.ts`，把文本任务和图片任务两组运行态推导从主组件中抽出。
  - 新增 `StoryboardGroupRegenerateTextButton.tsx`、`StoryboardGroupGenerateAllButton.tsx`、`StoryboardGroupManageButtons.tsx`，分别承接文本再生、批量补图、面板管理按钮区。
  - `StoryboardGroupActions.tsx` 现在主要负责状态 hook 装配和三段按钮区分发，不再直接承载整段运行态和按钮 JSX。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardPanelListItem.tsx` 周边桥接层
  2. 或继续压 `AIDataModalFormPane.tsx` 周边容器
- 2026-03-23 22:35:00：继续瘦身 `StoryboardPanelListItem.tsx`。
  - 新增 `hooks/useStoryboardPanelListItemCardProps.ts`，把 `PanelCard` 的长 props 桥接从单项列表组件中抽出。
  - `StoryboardPanelListItem.tsx` 现在主要负责 wrapper 层和 `PanelCard` 分发，不再直接承载整段 `PanelCard` 参数组装。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardPanelList.tsx` 周边桥接
  2. 或继续压 `AIDataModalFormPane.tsx` 周边容器
- 2026-03-23 23:05:00：继续瘦身 `ImageSectionCandidateMode.tsx`。
  - 新增 `ImageSectionCandidateMode.types.ts`，统一收口候选图模式、缩略图区、底部动作区和状态角标的 props 契约。
  - 新增 `hooks/useImageSectionCandidateModeState.ts`，把候选过滤、选中索引、确认中状态和确认动作从主组件中抽出。
  - 新增 `ImageSectionCandidateThumbnails.tsx`、`ImageSectionCandidateActions.tsx`、`ImageSectionCandidateStatusBadge.tsx`，分别承接缩略图列表、底部动作区和顶部状态角标。
  - `ImageSectionCandidateMode.tsx` 现在主要负责主图预览和三段子视图分发，不再直接承载候选图列表、确认流程和状态角标 JSX。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `PanelVariantModal.tsx` 或 `ImageSectionContent.tsx` 这类相邻容器
  2. 或继续压 `StoryboardPanelList.tsx` / `StoryboardGroup.tsx` 周边桥接
- 2026-03-23 23:35:00：继续瘦身 `PanelVariantModal.tsx`。
  - 更新 `PanelVariantModal.types.ts`，把 modal 自身、头部和滚动内容区的 props 契约统一收口到类型文件。
  - 新增 `PanelVariantModalHeader.tsx`，承接标题和关闭动作区。
  - 新增 `PanelVariantModalContent.tsx`，承接分镜信息、推荐列表和自定义选项三段滚动内容。
  - `PanelVariantModal.tsx` 现在主要负责状态 hook、portal 和 `header / content / footer` 三段分发，不再自己承载整段 modal 头部与内容 JSX。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `ImageSectionContent.tsx` / `ImageEditModal.tsx` 这类相邻容器
  2. 或继续压 `StoryboardPanelList.tsx` / `StoryboardGroup.tsx` 周边桥接
- 2026-03-23 23:55:00：继续瘦身 `ImageEditModal.tsx`。
  - 更新 `ImageEditModal.types.ts`，新增头部、提示词区、主体内容区和辅助弹窗区的 props 契约。
  - 新增 `ImageEditModalHeader.tsx`、`ImageEditModalPromptSection.tsx`、`ImageEditModalBody.tsx`、`ImageEditModalAuxiliaryOverlays.tsx`，分别承接 modal 头部、提示词输入、主体内容和资产选择/图片预览弹窗桥接。
  - `ImageEditModal.tsx` 现在主要负责项目资产查询、状态 hook 和外层壳层分发，不再自己承载提示词输入区、主体内容和辅助弹窗桥接 JSX。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `ImageSectionContent.tsx` / `PanelCard.tsx` 这类相邻容器
  2. 或继续压 `StoryboardPanelList.tsx` / `StoryboardGroup.tsx` 周边桥接
- 2026-03-24 00:20:00：继续瘦身 `PanelCard.tsx`。
  - 新增 `hooks/usePanelCardSectionProps.ts`，把 `ImageSection`、侧边动作区和编辑区三段子视图的 props 聚合从主组件中抽出。
  - `PanelCard.tsx` 现在主要负责外层 `GlassSurface` 壳、删除按钮和三段子视图分发，不再自己承载整段 `ImageSection` / `PanelCardSideActions` / `PanelCardEditorSection` 参数组装。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `ImageSectionContent.tsx` / `PanelActionButtons.tsx` 这类相邻容器
  2. 或继续压 `StoryboardPanelList.tsx` / `StoryboardGroup.tsx` 周边桥接
- 2026-03-24 00:45:00：继续瘦身 `ImageSectionContent.tsx`。
  - 新增 `ImageSectionContent.types.ts`，统一收口图片区内容分发的 props 与模式类型。
  - 新增 `hooks/useImageSectionContentMode.ts`，把删除中、修改中、提交中、候选图、失败、成图、空态这组模式判定从主组件中抽出。
  - 新增 `ImageSectionPreviewImage.tsx`，承接普通成图预览视图。
  - `ImageSectionContent.tsx` 现在主要负责按模式分发 `status / candidate / preview / empty` 四类视图，不再自己承载整段模式判断和普通成图 JSX。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `PanelActionButtons.tsx` / `StoryboardPanelList.tsx` 这类相邻桥接层
  2. 或继续压 `StoryboardGroup.tsx` / `ImageSection.tsx` 周边容器
- 2026-03-24 01:15:00：批量继续瘦身 `PanelActionButtons.tsx`、`StoryboardPanelList.tsx`、`ImageSection.tsx`。
  - 新增 `PanelActionButtons.types.ts`、`PanelActionButtonItem.tsx`，把面板间操作按钮组改成配置化分发，`PanelActionButtons.tsx` 现在主要负责动作配置和列表渲染。
  - 新增 `hooks/useStoryboardPanelListRuntime.ts`，把网格布局类名、面板项列表和单项公共桥接参数从 `StoryboardPanelList.tsx` 中抽出；`StoryboardPanelList.tsx` 现在主要负责列表分发。
  - 新增 `hooks/useImageSectionViewProps.ts`，把 `ImageSection` 的容器样式、内容区、角标区和动作区 props 聚合从主组件中抽出；`ImageSection.tsx` 现在主要负责壳层和三段子视图分发。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `ImageEditModalSelectedAssets.tsx` / `ImageEditModalCharacterSection.tsx` 这类相邻 image-edit 组件
  2. 或继续压 `StoryboardGroup.tsx` / `StoryboardPanelListItem.tsx` 周边桥接
- 2026-03-24 01:45:00：批量继续瘦身 `ImageEditModalSelectedAssets.tsx`、`ImageEditModalCharacterSection.tsx`、`ImageEditModalLocationSection.tsx`、`ImageEditModalAssetPicker.tsx`。
  - 更新 `ImageEditModal.types.ts`，统一收口已选素材列表、角色卡片、场景卡片和 asset picker 头尾桥接的 props 契约。
  - 新增 `ImageEditModalSelectedAssetsHeader.tsx`、`ImageEditModalSelectedAssetItem.tsx`，把已选素材列表拆成头部和单项卡片。
  - 新增 `ImageEditModalCharacterCard.tsx`、`ImageEditModalLocationCard.tsx`，把角色/场景素材区拆成项级卡片，`CharacterSection` 与 `LocationSection` 现在主要负责列表分发。
  - 新增 `ImageEditModalAssetPickerHeader.tsx`、`ImageEditModalAssetPickerFooter.tsx`，把 asset picker 的头尾壳层从主组件中抽出。
  - `ImageEditModalAssetPicker.tsx` 现在主要负责对话框壳和内容区分发，不再自己承载头尾 JSX。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardGroup.tsx` / `StoryboardGroupChromeMainRow.tsx` 这类 storyboard 上层壳
  2. 或继续压 `ImageEditModalBody.tsx` / `ImageEditModalSelectedAssets.tsx` 周边 bridge props
- 2026-03-24 02:20:00：继续批量瘦身 `PanelCardSideActions.tsx`、`ImageEditModalBody.tsx`、`StoryboardGroupChromeMainRow.tsx`。
  - 新增 `hooks/usePanelCardSideActionsProps.ts`，把侧边动作区的空态判定和 `PanelActionButtons` 标准化参数组装从 `PanelCardSideActions.tsx` 中抽出。
  - 新增 `hooks/useImageEditModalBodySectionProps.ts`，把 `ImageEditModalBody.tsx` 里的提示词区、已选素材区、参考图区三段 props 聚合从主组件中抽出。
  - 新增 `StoryboardGroupChromeMainRow.types.ts`、`hooks/useStoryboardGroupChromeMainRowProps.ts`，把 `StoryboardGroupHeader` 和 `StoryboardGroupActions` 两段 props 聚合从主行组件中抽出。
  - 这三处主组件现在都更接近壳层/分发层，不再自己承载重复 bridge props 组装。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardGroup.tsx` / `StoryboardGroupChrome.tsx` 周边上层壳
  2. 或继续压 `ImageSectionStatusContent.tsx` / `CandidateSelector.tsx` 这类仍偏重的展示容器
- 2026-03-24 02:55:00：继续批量瘦身 `CandidateSelector.tsx`、`ImageSectionStatusContent.tsx`。
  - 更新 `CandidateSelector.types.ts`，新增头部和缩略图列表契约；新增 `CandidateSelectorHeader.tsx`、`CandidateSelectorThumbnailStrip.tsx`、`hooks/useCandidateSelectorRuntime.ts`，把标题区、缩略图项构造和 footer props 聚合从 `CandidateSelector.tsx` 中抽出。
  - 新增 `ImageSectionStatusContent.types.ts`、`ImageSectionLoadingState.tsx`、`ImageSectionFailedState.tsx`、`ImageSectionEmptyState.tsx`，把图片区状态渲染拆成独立视图组件。
  - `CandidateSelector.tsx` 和 `ImageSectionStatusContent.tsx` 现在都主要负责状态/视图分发，不再自己承载整段标题、缩略图组装和状态页 JSX。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardGroup.tsx` / `StoryboardGroupChrome.tsx` 这类 storyboard 更上层壳
  2. 或继续压 `ImageSectionStatusContent.tsx` 上游调用链与 `CandidateSelectorFooter.tsx` 周边 bridge props
- 2026-03-23 17:36:18：继续批量瘦身 `StoryboardGroupChrome.tsx`、`StoryboardGroup.tsx`、`CandidateSelectorFooter.tsx`、`ImageSectionStatusContent.tsx`。
  - 新增 `hooks/useStoryboardGroupChromeSectionProps.ts`，把 `StoryboardGroupChrome` 的状态层和主行层 props 聚合从主组件中抽出；`StoryboardGroupChrome.tsx` 现在只负责 `status / mainRow` 两段分发。
  - 新增 `hooks/useStoryboardGroupRenderShell.ts`，把 `StoryboardGroup` 的容器 class 和 `clipSection` 外壳从 group runtime 中拆出；`useStoryboardGroupRuntime.ts` 现在返回 `renderShell + sections` 两层结构，`StoryboardGroup.tsx` 也改成对象入参，不再保留一长串 props 解构。
  - 更新 `CandidateSelector.types.ts` 和 `hooks/useCandidateSelectorRuntime.ts`，把 `CandidateSelectorFooter` 所需的翻译桥接改成显式标签契约；`CandidateSelectorFooter.tsx` 不再接收 `t()` 函数透传。
  - 更新 `ImageSectionStatusContent.types.ts`、`ImageSectionStatusContent.tsx`、`ImageSectionContent.tsx`，把 `ImageSectionStatusContent` 从“返回渲染函数”的工具形态改成真实组件；`ImageSectionContent.tsx` 现在按 `variant` 直接分发 `loading / failed / empty` 状态视图。
- 本轮两次 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardGroup.tsx` / `StoryboardGroupChrome.tsx` 上层 render shell 和 section props
  2. 或继续压 `CandidateSelectorFooter.tsx` / `ImageSectionContent.tsx` 周边剩余 bridge props
- 2026-03-23 17:50:00：继续批量瘦身 `StoryboardGroupActions.tsx`、`ImageSectionActionButtons.tsx`、`ImageSectionContent.tsx`。
  - 更新 `StoryboardGroupActions.types.ts`、`StoryboardGroupRegenerateTextButton.tsx`、`StoryboardGroupGenerateAllButton.tsx`、`StoryboardGroupManageButtons.tsx`、`StoryboardGroupActions.tsx`，把 `StoryboardGroupActions` 这条链上的 `t()` 透传全部改成显式 label/title 契约，动作按钮子组件不再依赖翻译函数桥接。
  - 新增 `hooks/useImageSectionActionButtonsProps.ts`，把 `ImageSectionPrimaryActions` 和 `ImageSectionUndoAction` 的 props 聚合、外层容器 class 组装从 `ImageSectionActionButtons.tsx` 中抽出；`ImageSectionActionButtons.tsx` 现在只负责状态 hook 和两段动作视图分发。
  - 新增 `hooks/useImageSectionContentSectionProps.ts`，把 `ImageSectionContent.tsx` 中候选图、预览图、状态视图三段 section props 聚合抽出；`ImageSectionContent.tsx` 现在主要负责 `mode -> status/candidate/preview` 三类分发，不再反复内联相同的状态 props。
- 本轮两次 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardGroupActions.tsx` / `CandidateSelector.tsx` 周边剩余显式契约和按钮桥接
  2. 或继续压 `ImageSectionCandidateMode.tsx` / `ImageSectionActionButtons.tsx` 上游 section props
- 2026-03-23 18:10:00：继续批量瘦身 `StoryboardGroupActions.tsx`、`ImageSectionCandidateMode.tsx`、`CandidateSelector.tsx` 周边 section props。
  - 新增 `hooks/useStoryboardGroupActionSectionProps.ts`，把 `StoryboardGroupActions.tsx` 里三组子按钮 props 的文案与状态聚合从主组件中抽出；`StoryboardGroupActions.tsx` 现在主要负责动作区分发。
  - 新增 `hooks/useImageSectionCandidateModeSectionProps.ts`，把 `ImageSectionCandidateMode.tsx` 里的主预览、缩略图区、确认动作区、状态角标四段 props 聚合抽出；`ImageSectionCandidateMode.tsx` 现在主要负责壳层和四段分发。
  - 更新 `ImageSectionCandidateMode.types.ts`、`ImageSectionCandidateThumbnails.tsx`、`ImageSectionCandidateActions.tsx`、`ImageSectionCandidateStatusBadge.tsx`，把子组件改成显式文案/条目契约，并顺手清掉 `ImageSectionCandidateActions.tsx` 里写死的“取消候选”文案。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `CandidateSelector.tsx` / `useCandidateSelectorRuntime.ts` 的 section props 结构统一
  2. 或继续压 `ImageSectionCandidateMode.tsx` / `ImageSectionActionButtons.tsx` 上游壳层
- 2026-03-23 18:25:00：继续批量瘦身 `CandidateSelector.tsx`、`useCandidateSelectorRuntime.ts`、`StoryboardCanvas.tsx`。
  - 新增 `hooks/useCandidateSelectorSectionProps.ts`，把 `CandidateSelector` 的容器样式、头部、缩略图区、底部动作区四段 props 聚合从 runtime 中抽出；`CandidateSelector.tsx` 现在已经改成和前面一致的 `sections` 分发结构。
  - 更新 `ImageSectionCandidateActions.tsx`，移除不再需要的 `next-intl` 依赖，确认按钮只使用显式 `confirmLabel` 契约。
  - 更新 `StoryboardCanvasInsertButton.tsx`、`StoryboardCanvasEmptyState.tsx`、`StoryboardCanvas.tsx`、`StoryboardCanvasItem.tsx`，把这条链上残留的 `t()` 透传改成显式 label/title/description 契约，`StoryboardCanvas` 侧的旧式翻译桥接已清掉。
- 本轮两次 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardCanvas.tsx` / `StoryboardCanvasItem.tsx` 周边剩余 section props
  2. 或继续压 `AIDataModal.tsx` / `StoryboardHeader.tsx` 这类仍残留较多 `t()` 桥接的壳层
- 2026-03-23 18:40:00：继续批量瘦身 `StoryboardHeader.tsx`、`AIDataModal.tsx`、`StoryboardCanvas.tsx`。
  - 新增 `hooks/useStoryboardHeaderSectionProps.ts`，把 `StoryboardHeader` 的 summary/actions 两段文案与 props 聚合从主组件中抽出；同步更新 `StoryboardHeader.types.ts`、`StoryboardHeaderSummary.tsx`、`StoryboardHeaderActions.tsx`，把这条链的 `t()` 透传全部改成显式 label 契约。
  - 更新 `AIDataModalPreviewPane.types.ts`、`AIDataModalPreviewPane.tsx`、`AIDataModalFooter.tsx`、`hooks/useAIDataModalRuntime.ts`，把 `AIDataModal` 的 preview/footer 两段 `t()` 透传改成显式 `title/copyLabel/cancelLabel/saveLabel` 契约。
  - 新增 `hooks/useCandidateSelectorSectionProps.ts`，把 `CandidateSelector` 统一成 `sections` 结构；同步更新 `CandidateSelector.tsx` 和 `hooks/useCandidateSelectorRuntime.ts`。
  - 更新 `StoryboardCanvasInsertButton.tsx`、`StoryboardCanvasEmptyState.tsx`、`StoryboardCanvas.tsx`、`StoryboardCanvasItem.tsx`，清掉 `StoryboardCanvas` 这条链上的翻译函数透传。
- 本轮两次 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `AIDataModalFormPane.tsx` / `AIDataModal*.tsx` 内层 section props 与显式文案契约
  2. 或继续压 `StoryboardCanvasItem.tsx` / `StoryboardCanvas.tsx` 周边剩余桥接层
- 2026-03-23 19:05:00：继续瘦身 `AIDataModalFormPane.tsx`、`AIDataModalBasicSection.tsx`、`AIDataModalPhotographySection.tsx`、`AIDataModalActingSection.tsx`、`StoryboardCanvasItem.tsx`。
  - 新增 `hooks/useAIDataModalFormPaneSectionProps.ts`，把 `AIDataModalFormPane.tsx` 里三段 section props 聚合抽出；`AIDataModalFormPane.tsx` 现在只负责三段子视图分发。
  - 新增 `hooks/useStoryboardCanvasItemRuntime.ts`，把 `StoryboardCanvasItem.tsx` 里的 item state、group props 和 insert button props 收进 runtime hook；`StoryboardCanvasItem.tsx` 现在只负责 `StoryboardGroup` 和 `StoryboardCanvasInsertButton` 两段分发。
  - 更新 `AIDataModalFormPane.types.ts`、`hooks/useAIDataModalRuntime.ts`、`hooks/useAIDataModalFormPaneSectionProps.ts`，把 `AIDataModal` 三个 section 的最外层翻译桥接改成显式 `labels` 契约。
  - 更新 `AIDataModalBasicSection.tsx`、`AIDataModalBasicPrimaryFields.tsx`、`AIDataModalBasicSceneSummary.tsx`、`AIDataModalBasicPrompts.tsx`，把基础数据区标题、字段名和 placeholder 从 `t()` 透传改成显式 labels。
  - 更新 `AIDataModalPhotographySection.tsx`、`AIDataModalPhotographyFields.tsx`、`AIDataModalPhotographyCharacters.tsx`，把摄影规则区标题和字段标签从 `t()` 透传改成显式 labels。
  - 更新 `AIDataModalActingSection.tsx`、`AIDataModalActingHeader.tsx`、`AIDataModalActingCharacterCard.tsx`，把表演说明区标题和字段标签从 `t()` 透传改成显式 labels。
- 下一步优先级：
  1. 继续处理 `StoryboardCanvas.tsx` / `StoryboardCanvasItem.tsx` 周边剩余 section props 与壳层桥接
  2. 或继续压 `AIDataModal.tsx` / `AIDataModalFormPane.tsx` 周边剩余 runtime 边界
- 2026-03-23 19:30:00：继续瘦身 `StoryboardCanvas.tsx`、`hooks/useStoryboardCanvasItemRuntime.ts`、`hooks/useStoryboardStageSectionProps.ts`。
  - 新增 `StoryboardCanvasLabels`，把空态标题、空态描述和“在此插入分镜组”文案提升为 `StoryboardCanvas` 的显式 labels 契约。
  - 更新 `StoryboardCanvas.tsx`，移除本地 `useTranslations('storyboard')`，空态完全改由上游 `labels` 驱动。
  - 更新 `hooks/useStoryboardCanvasItemRuntime.ts`，插入按钮文案改为复用 `canvas.labels.insertHereLabel`，这条链不再自己获取翻译函数。
  - 更新 `hooks/useStoryboardStageSectionProps.ts`，在 stage section props 层统一组装 `canvas.labels`，继续收缩 storyboard canvas 这条链的翻译边界。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardCanvas.tsx` / `StoryboardCanvasItem.tsx` 周边剩余 section props 与壳层桥接
  2. 或继续压 `AIDataModal.tsx` / `AIDataModalFormPane.tsx` 周边剩余 runtime 边界
- 2026-03-23 20:05:00：继续瘦身 `hooks/useStoryboardStageSectionProps.ts`、`hooks/useAIDataModalRuntime.ts`。
  - 新增 `hooks/useStoryboardCanvasSectionProps.ts`，把 `useStoryboardStageSectionProps.ts` 里整段 `canvasProps` 组装抽成独立 hook；`stage` 层现在更清晰地只负责 `toolbar / canvas / modals` 三段分发。
  - 新增 `hooks/useAIDataModalFormPaneLabels.ts`，把 `useAIDataModalRuntime.ts` 里三组 `basic/photography/acting` labels 组装抽成独立 hook；`AIDataModalRuntime` 现在更聚焦于状态和四段 props 装配。
  - 同步更新 `StoryboardCanvas.types.ts`、`StoryboardCanvas.tsx`、`hooks/useStoryboardCanvasItemRuntime.ts`、`hooks/useStoryboardStageSectionProps.ts`，继续收紧 `StoryboardCanvas` 这条链的上游边界。
- 本轮两次 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardCanvas.tsx` / `StoryboardCanvasItem.tsx` 周边剩余 section props 与壳层桥接
  2. 或继续压 `AIDataModal.tsx` / `useAIDataModalRuntime.ts` 周边剩余 runtime 边界
- 2026-03-23 20:45:00：继续瘦身 `hooks/useAIDataModalRuntime.ts`、`hooks/useStoryboardCanvasItemRuntime.ts`。
  - 新增 `hooks/useAIDataModalViewProps.ts`，把 `header/form/preview/footer` 四段 view props 组装从 `useAIDataModalRuntime.ts` 中抽成独立 hook；`useAIDataModalRuntime.ts` 现在更聚焦状态同步、previewJson 生成和保存生命周期。
  - 新增 `hooks/useStoryboardCanvasInsertButtonProps.ts`，把 `StoryboardCanvasItem` 的插入按钮 props 组装从 `useStoryboardCanvasItemRuntime.ts` 中抽成独立 hook。
  - 同步修正 `useAIDataModalViewProps.ts` 的 `previewJson` 类型，使 `AIDataModalPreviewPane` 的 props 契约与预览对象保持一致。
- 本轮两次 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `AIDataModal.tsx` / `useAIDataModalRuntime.ts` 周边剩余 runtime 边界
  2. 或继续压 `StoryboardCanvas.tsx` / `useStoryboardCanvasItemRuntime.ts` 周边剩余桥接层
- 2026-03-23 21:20:00：继续瘦身 `ImageSection.tsx`、`ImageSectionContent.tsx`、`ImageSectionStatusContent.tsx`、`ImageSectionCandidateMode.tsx` 及其 hooks。
  - 在 `ImageSection.types.ts` 中新增 `ImageSectionStatusLabels`、`ImageSectionCandidateLabels`、`ImageSectionContentLabels`，把 `ImageSectionContent.types.ts`、`ImageSectionStatusContent.types.ts`、`ImageSectionCandidateMode.types.ts` 全部切到显式 labels 契约。
  - 更新 `ImageSection.tsx` 和 `hooks/useImageSectionViewProps.ts`，把 `contentLabels` 与 `actionLabels` 统一收敛在 `ImageSection` 顶层；`useImageSectionViewProps.ts` 不再向下透传 `t()`。
  - 更新 `ImageSectionContent.tsx`、`hooks/useImageSectionContentSectionProps.ts`、`ImageSectionStatusContent.tsx`，把 status/content 这条链改成纯 labels 驱动；`ImageSectionStatusContent.tsx` 不再依赖通用翻译函数。
  - 更新 `ImageSectionCandidateMode.tsx`、`hooks/useImageSectionCandidateModeSectionProps.ts`，把 candidate 预览、缩略图区、动作区、状态角标的文案全部改成由显式 labels/格式化函数提供；`candidate` 这条链已清掉 `useTranslations('storyboard')`。
- 本轮 `npm run desktop:build:web` 已通过。
- 2026-03-23 21:45:00：继续瘦身 `PanelActionButtons.tsx`、`PanelCardSideActions.tsx`、`StoryboardGroupHeader.tsx`、`StoryboardGroupActions.tsx`、`StoryboardGroupChromeStatus.tsx` 及其桥接 hooks。
  - 在 `PanelActionButtons.types.ts` 中新增 `PanelActionLabels`，更新 `PanelActionButtons.tsx`、`PanelCardSideActions.tsx`、`hooks/usePanelCardSideActionsProps.ts`，把侧边动作区文案边界提升到 `PanelCardSideActions`，`PanelActionButtons.tsx` 不再直接取翻译。
  - 在 `StoryboardGroupActions.types.ts` 中新增 `StoryboardGroupActionLabels`，更新 `StoryboardGroupActions.tsx` 与 `hooks/useStoryboardGroupActionSectionProps.ts`，把动作区三组按钮统一改成显式 label/title 契约。
  - 更新 `StoryboardGroupHeader.tsx`，新增 `StoryboardGroupHeaderLabels`，把移动按钮标题和 segment 标题从组件体中提走。
  - 在 `StoryboardGroupChrome.types.ts` 中新增 `StoryboardGroupChromeStatusLabels`，更新 `StoryboardGroupChromeStatus.tsx`、`hooks/useStoryboardGroupChromeMainRowProps.ts`、`hooks/useStoryboardGroupChromeSectionProps.ts`，把 `StoryboardGroup` 的 header/actions/status 三段翻译边界统一提升到主行桥接 hooks。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `StoryboardGroupActions.tsx` / `useStoryboardGroupActions.ts` 周边仍残留的交互文案桥接
  2. 或继续压 `ImageSection.tsx` / `PanelActionButtons.tsx` 相邻的 `InsertPanelButton.tsx`、`PanelVariantModal*` 等组件显式契约
- 2026-03-24 00:40:00：继续瘦身 `InsertPanelModal.tsx`、`InsertPanelModalPanelsPreview.tsx`、`InsertPanelModalActions.tsx`。
  - 更新 `InsertPanelModal.types.ts`，新增 `InsertPanelModalLabels`、`InsertPanelModalPreviewLabels`、`InsertPanelModalActionLabels`，把插入弹窗的标题、占位符、预览文案、动作按钮文案统一成显式契约。
  - 更新 `InsertPanelModal.tsx`，把 `insert between` 标题、输入框 placeholder、预览 labels、动作区 labels 统一在 modal 顶层组装后再下发。
  - 更新 `InsertPanelModalPanelsPreview.tsx`、`InsertPanelModalActions.tsx`，清掉 `useTranslations('storyboard')`，这两个组件现在都变成纯显示层。
- 本轮 `npm run desktop:build:web` 已通过。
- 2026-03-24 01:05:00：继续瘦身 `PanelVariantModal.tsx`、`PanelVariantModalContent.tsx` 及相关显示组件。
  - 更新 `PanelVariantModal.types.ts` 与 `PanelVariantModalSuggestionList.types.ts`，为 `header / footer / panel-info / custom-options / suggestion-list / suggestion-item` 新增显式 labels 契约。
  - 更新 `PanelVariantModal.tsx`，把 header/footer/panel-info/custom-options 的文案边界提升到 modal 顶层；`PanelVariantModalHeader.tsx`、`PanelVariantModalFooter.tsx`、`PanelVariantModalPanelInfo.tsx`、`PanelVariantModalCustomOptions.tsx` 已清掉 `useTranslations`。
  - 更新 `PanelVariantModalContent.tsx`，把 suggestion-list 的 labels 统一在 content 层组装；`PanelVariantModalSuggestionList.tsx`、`PanelVariantModalSuggestionListHeader.tsx`、`PanelVariantSuggestionItem.tsx` 现在都改成显式 labels 驱动。
  - `usePanelVariantModalState.ts` 里的分析失败和自定义变体默认文案仍保留在业务态 hook 内，暂未继续上提。
- 本轮 `npm run desktop:build:web` 已通过。
- 下一步优先级：
  1. 继续处理 `usePanelVariantModalState.ts` / `useStoryboardGroupActions.ts` 这类交互消息边界
  2. 或继续压 `InsertPanelButton.tsx`、`PanelVariantModalCustomOptions.tsx` 相邻残留的 storyboard 显示层桥接
- 2026-03-24 02:10:00：继续上提 `storyboard` 业务 hook 的消息边界，集中清理 `usePanelVariantModalState.ts`、`useStoryboardGroupActions.ts`、`usePanelCrudActions.ts`、`usePanelInsertActions.ts`、`useStoryboardBatchPanelGeneration.ts`、`usePanelImageDownload.ts` 与 `useCandidateSelectorRuntime.ts`。
  - 更新 `PanelVariantModal.types.ts`、`PanelVariantModal.tsx`、`hooks/usePanelVariantModalState.ts`，新增 `PanelVariantModalStateMessages`，把分析失败、自定义变体标题和默认镜头文案提升到 modal 顶层组装；`usePanelVariantModalState.ts` 已不再直接依赖 `useTranslations('storyboard')`。
  - 更新 `hooks/useStoryboardGroupActions.ts` 与 `hooks/usePanelOperations.ts`，新增 `StoryboardGroupActionMessages`，把删除/重生成/新增/移动分镜组的确认与失败提示全部提升到 `usePanelOperations.ts` 统一组装。
  - 更新 `hooks/usePanelCrudActions.ts`、`hooks/usePanelInsertActions.ts` 与 `hooks/usePanelOperations.ts`，把新增分镜、删除分镜、插入分镜三条业务链的默认镜头值、确认弹窗和失败提示全部切到显式 messages 契约；`usePanelOperations.ts` 已成为 `group / panel / insert` 三组交互 hook 的统一翻译边界。
  - 更新 `hooks/useStoryboardBatchPanelGeneration.ts` 与 `hooks/useStoryboardPanelAssetActions.ts`，把批量生成完成/失败文案和 `common.none` 提升到 `useStoryboardPanelAssetActions.ts`，`useStoryboardBatchPanelGeneration.ts` 不再直接取翻译。
  - 更新 `hooks/usePanelImageDownload.ts` 与 `hooks/useImageGeneration.ts`，把“未找到剧集”和下载失败提示提升到 `useImageGeneration.ts` 组装；`usePanelImageDownload.ts` 改成纯 messages 驱动。
  - 更新 `CandidateSelector.types.ts`、`CandidateSelector.tsx` 与 `hooks/useCandidateSelectorRuntime.ts`，新增 `CandidateSelectorLabels`，把标题、副标题、原图标签、候选图标签、空态文案和底部按钮文案全部提升到 `CandidateSelector.tsx` 统一组装；`useCandidateSelectorRuntime.ts` 已清掉 `useTranslations('storyboard')`。
- 本轮多次 `npm run desktop:build:web` 已通过。
- 当前 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/hooks` 中仍保留的直接翻译热点主要剩余：
  1. `usePanelCandidates.ts`
  2. `usePanelImageModification.ts`
  3. `usePanelVariant.ts`
  4. `useStoryboardGroupChromeMainRowProps.ts`
  5. `useStoryboardGroupChromeSectionProps.ts`
  6. `useStoryboardHeaderSectionProps.ts`
  7. `useStoryboardStageSectionProps.ts`
- 2026-03-24 03:05:00：继续上提 `candidate / image modification / panel variant` 三条业务 hook 的消息边界。
  - 更新 `hooks/usePanelCandidates.ts` 与 `hooks/useImageGeneration.ts`，新增 `PanelCandidateMessages`，把候选图确认失败提示和未知错误文案提升到 `useImageGeneration.ts` 统一组装；`usePanelCandidates.ts` 不再直接依赖 `useTranslations('storyboard')`。
  - 更新 `hooks/usePanelImageModification.ts` 与 `hooks/useImageGeneration.ts`，新增 `PanelImageModificationMessages`，把“panel not found”和图片修改失败提示提升到 `useImageGeneration.ts` 统一组装；`usePanelImageModification.ts` 已清掉直接翻译依赖。
  - 更新 `hooks/usePanelVariant.ts` 与 `hooks/useStoryboardStageController.ts`，新增 `PanelVariantMessages`，把乐观插入占位 panel 的 `variant.generating` 文案提升到 `useStoryboardStageController.ts` 组装；`usePanelVariant.ts` 已不再直接取翻译。
- 本轮 `npm run desktop:build:web` 已通过。
- 当前 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/hooks` 中剩余的直接翻译热点主要收敛为：
  1. `useImageGeneration.ts`
  2. `usePanelOperations.ts`
  3. `useStoryboardPanelAssetActions.ts`
  4. `useStoryboardStageController.ts`
  5. `useStoryboardGroupChromeMainRowProps.ts`
  6. `useStoryboardGroupChromeSectionProps.ts`
  7. `useStoryboardHeaderSectionProps.ts`
  8. `useStoryboardStageSectionProps.ts`
- 2026-03-24 05:20:00：完成 `storyboard/hooks` 目录翻译边界清零，收掉 `useStoryboardStageController.ts` 最后一层 `useTranslations`。
  - 更新 `hooks/usePanelVariant.ts`，导出 `PanelVariantMessages`，供 `useStoryboardStageController.ts` 显式注入 `panelVariant.generating` 文案。
  - 更新 `hooks/useStoryboardStageController.ts`、`hooks/useStoryboardStageRuntime.ts` 与 `index.tsx`，把 `panelOperations / imageGeneration / panelAssetActions / panelVariant` 四组 messages 统一改成 `StoryboardStage -> useStoryboardStageRuntime -> useStoryboardStageController` 注入链。
  - 使用 `rg -n "useTranslations\(" "packages/renderer/modules/project-detail/novel-promotion/components/storyboard/hooks"` 校验，`hooks` 目录已无直接翻译依赖。
  - 本轮 `npm run desktop:build:web` 已通过；当前 `storyboard/hooks` 的翻译边界已全部提升到组件层或 runtime 装配层。
- 2026-03-24 06:10:00：继续上提 `storyboard` 容器层的翻译边界，完成 `Toolbar / Header / StageShell` 以及 `StoryboardGroup / PanelCardSideActions` 两条桥接链的显式 labels 化。
  - 更新 `StoryboardToolbar.types.ts`、`StoryboardHeader.types.ts`、`StoryboardStageShell.types.ts`、`StoryboardToolbar.tsx`、`StoryboardHeader.tsx`、`StoryboardStageShell.tsx`、`StoryboardStageNextButton.tsx`、`hooks/useStoryboardStageRuntime.ts`、`hooks/useStoryboardStageSectionProps.ts` 与 `index.tsx`，把 `addGroupAtStart / header summary-actions / generateVideo` 文案统一提升到 `StoryboardStage` 顶层组装，`StoryboardToolbar.tsx`、`StoryboardHeader.tsx`、`StoryboardStageShell.tsx` 已清掉 `useTranslations('storyboard')`。
  - 其中 `StoryboardHeader` 的分镜组数/分镜数量文案改为显式 formatter 函数，避免在根入口提前固化动态计数，保持新增/删除分镜后的文案实时正确。
  - 更新 `StoryboardGroupChrome.types.ts`、`StoryboardGroupChrome.tsx`、`StoryboardGroupClipSection.tsx`、`StoryboardGroup.tsx`、`hooks/useStoryboardGroupSectionProps.ts`、`hooks/useStoryboardGroupRenderShell.ts`、`hooks/useStoryboardGroupRuntime.ts`，把 `group chrome` 与 `clip section` 的文案边界提升到 `StoryboardGroup.tsx` 根容器；`StoryboardGroupChrome.tsx` 与 `StoryboardGroupClipSection.tsx` 已清掉 `useTranslations('storyboard')`。
  - 更新 `PanelCardSideActions.tsx`、`hooks/usePanelCardSectionProps.ts`、`PanelCard.tsx`，把侧边动作按钮区的文案提升到 `PanelCard.tsx` 根卡片，`PanelCardSideActions.tsx` 已清掉 `useTranslations('storyboard')`。
  - 本轮多次 `npm run desktop:build:web` 已通过；当前 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard` 下残留的直接翻译组件已收敛到 `AIDataModal / CandidateSelector / ImageEditModal / ImageSection / PanelCard / InsertPanelModal / PanelVariantModal / ScreenplayDisplay / InsertPanelButton / StoryboardGroup / index.tsx`。
- 2026-03-25 00:40:00：继续上提 `storyboard` 的图片区翻译边界，完成 `PanelCard -> ImageSection` 主链的显式 labels 化。
  - 更新 `ImageSection.types.ts`，新增 `ImageSectionLabels`，把图片区文案正式收口成 `content / actions` 两段契约。
  - 更新 `ImageSection.tsx` 与 `hooks/useImageSectionViewProps.ts`，`ImageSection` 已不再直接依赖 `useTranslations('storyboard')`，只接收 `labels` 并做状态/视图分发。
  - 更新 `hooks/usePanelCardSectionProps.ts` 与 `PanelCard.tsx`，把 `shotNumber / preview / status / candidate / regenerate / edit / undo` 这组图片区文案提升到 `PanelCard.tsx` 根组件统一组装，再经由 `usePanelCardSectionProps` 传给 `ImageSection`。
  - 本轮 `npm run desktop:build:web` 已通过；当前 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard` 下残留的直接翻译组件已进一步收敛为 `AIDataModal / ImageEditModal / InsertPanelButton / InsertPanelModal / PanelVariantModal / PanelCard / ScreenplayDisplay / StoryboardGroup / index.tsx`，以及当前在 `packages/renderer` 树内暂未接入主链的 `CandidateSelector.tsx`。
- 2026-03-25 01:05:00：继续上提 `AIDataModal` runtime 的翻译边界。
  - 更新 `AIDataModal.tsx`，把 `formPaneLabels + viewLabels` 的组装统一提升到 modal 顶层。
  - 更新 `hooks/useAIDataModalRuntime.ts`，改成只接收显式 `formPaneLabels` 与 `viewLabels`，不再直接依赖翻译函数。
  - 更新 `hooks/useAIDataModalViewProps.ts`，只接收 `labels` 组装 `header / form / preview / footer` 四段视图 props。
- 2026-03-25 01:20:00：继续上提 `PanelVariantModalContent` 的翻译边界。
  - 更新 `PanelVariantModal.types.ts`，补齐 `suggestion-list` 显式 labels 类型。
  - 更新 `PanelVariantModal.tsx`，把 `suggestionListLabels` 统一在根 modal 顶层组装后下发。
  - 更新 `PanelVariantModalContent.tsx`，清掉 `useTranslations`，现在只接收显式 `suggestionListLabels` 做内容分发。
- 2026-03-25 01:40:00：继续上提 `ScreenplayDisplay` 这条显示链的翻译边界。
  - 更新 `ScreenplayDisplay.types.ts`，新增 `ScreenplayDisplayLabels`，统一收口 `tabs / scene / parseFailed` 的显式文案契约。
  - 更新 `ScreenplayDisplay.tsx`、`ScreenplayDisplayTabs.tsx`、`ScreenplaySceneBlock.tsx`、`ScreenplayContentItem.tsx`，整条链已清掉 `useTranslations` 和 `t()` 透传，全部改成 `labels` 驱动。
  - 更新 `StoryboardGroupClipSection.tsx`、`hooks/useStoryboardGroupRuntime.ts` 与 `StoryboardGroup.tsx`，把 `screenplay` 文案提升到 `StoryboardGroup` 根容器统一组装，再由 `clipSection` 向下传递。
- 2026-03-25 02:00:00：继续上提 `ImageEditModal` 的翻译边界。
  - 更新 `ImageEditModal.types.ts` 与 `ImageEditModal.tsx`，让根 modal 改成直接接收显式 `labels`，不再自己依赖 `useTranslations` 或 `useImageEditModalLabels`。
  - 更新 `StoryboardStagePrimaryModals.tsx`，把 `image-edit` 文案边界提升到主弹窗分发层统一组装，再向 `ImageEditModal` 注入。
- 2026-03-25 02:15:00：继续上提 `InsertPanelModal` 的翻译边界。
  - 更新 `InsertPanelModal.tsx` 与 `InsertPanelModal.types.ts`，让插入弹窗根组件改成直接接收显式 `labels`，不再自己依赖 `useTranslations`。
  - 更新 `StoryboardGroupInsertDialog.tsx`，把 `insert-between` 标题、占位符、预览文案和动作区文案统一提升到分发层组装，再向 `InsertPanelModal` 注入。
- 2026-03-25 02:35:00：继续上提 `AIDataModal` 的翻译边界。
  - 更新 `AIDataModal.types.ts`，新增 `AIDataModalFormLabels` 与 `AIDataModalViewLabels`，把 `formPaneLabels + viewLabels` 明确成根 modal 的显式契约。
  - 更新 `AIDataModal.tsx`、`hooks/useAIDataModalRuntime.ts` 与 `hooks/useAIDataModalViewProps.ts`，让根 modal 和 runtime 只接收显式 labels，不再自己组装翻译。
  - 更新 `StoryboardStagePrimaryModals.tsx`，把 `ai-data` 的标题、副标题、预览和底部按钮文案统一提升到主弹窗分发层，再向 `AIDataModal` 注入。
- 2026-03-25 03:00:00：继续上提 `PanelVariantModal` 的翻译边界。
  - 更新 `PanelVariantModal.types.ts` 与 `PanelVariantModal.tsx`，让变体弹窗根组件改成直接接收显式 `labels + messages`，不再自己依赖 `useTranslations`。
  - 更新 `StoryboardGroupVariantDialog.tsx`，把 `variant` 标题、信息区、推荐列表、底部动作和状态消息统一提升到分发层组装，再向 `PanelVariantModal` 注入。
- 2026-03-25 03:20:00：继续上提 `StoryboardGroup` 组级对话框链的翻译边界。
  - 更新 `StoryboardGroupDialogs.types.ts`、`StoryboardGroupDialogs.tsx`、`StoryboardGroupInsertDialog.tsx` 与 `StoryboardGroupVariantDialog.tsx`，让 `insert / variant` 两条弹窗分发链都改成直接接收显式 `labels/messages`。
  - 更新 `hooks/useStoryboardGroupRuntime.ts`、`hooks/useStoryboardGroupSectionProps.ts` 与 `StoryboardGroup.tsx`，把 `insert-dialog` 和 `variant-dialog` 的文案统一提升到 `StoryboardGroup` 根容器组装，再经由 `dialogsProps` 向下传递。
  - 对 `InsertPanel` 和 `PanelVariant` 的动态编号文案改成 formatter 函数，避免在边界上提后把动态标题错误固化成静态字符串。
- 2026-03-25 03:45:00：继续上提 `StoryboardStage` 主弹窗分发链的翻译边界。
  - 更新 `StoryboardStageModals.types.ts`，新增 `StoryboardStagePrimaryModalLabels`，把 `image-edit / ai-data` 两条主弹窗链的显式 labels 契约集中收口。
  - 更新 `StoryboardStagePrimaryModals.tsx`、`StoryboardStageModals.tsx`、`hooks/useStoryboardStageSectionProps.ts`、`hooks/useStoryboardStageRuntime.ts` 与 `index.tsx`，让主弹窗分发层只接收显式 labels，`StoryboardStagePrimaryModals.tsx` 已清掉 `useTranslations`。

- 2026-03-25 04:15:00：继续推进 `renderer` 主链，把 `video-stage / voice-stage` 的实际 runtime 从 `src/lib/novel-promotion/stages/*-runtime-core.tsx` 前移到 `packages/renderer`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/video-stage/hooks/useVideoStageRuntime.tsx`，该文件不再是薄转发，已承接原 `src/lib/novel-promotion/stages/video-stage-runtime-core.tsx` 的完整实现。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/voice-stage/hooks/useVoiceStageRuntime.tsx`，该文件不再是薄转发，已承接原 `src/lib/novel-promotion/stages/voice-stage-runtime-core.tsx` 的完整实现。
  - 更新 `src/lib/novel-promotion/stages/video-stage-runtime-core.tsx` 与 `src/lib/novel-promotion/stages/voice-stage-runtime-core.tsx`，旧 `src/lib` 入口已改成仅保留 `@renderer` 薄转发。
  - 结果：`packages/renderer` 继续脱离旧运行时壳，`video-stage / voice-stage` 的主运行链已并回 `renderer` 目录；当前 `src/lib/novel-promotion/stages` 中最重的两块 UI runtime 已完成前移。
- 本轮 `npm run desktop:build:web` 已通过。

- 2026-03-25 05:10:00：继续推进 `video-stage / voice-stage` 的 `renderer` 主链收口。
  - 将 `src/lib/novel-promotion/stages/video-stage-runtime/*` 与 `voice-stage-runtime/*` helper 目录整体前移到 `packages/renderer/modules/project-detail/novel-promotion/components/video-stage/runtime` 与 `voice-stage/runtime`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/video-stage/hooks/useVideoStageRuntime.tsx` 与 `voice-stage/hooks/useVoiceStageRuntime.tsx`，改为直接依赖相邻 `../runtime/*`，不再绕回旧 `src/lib` runtime helper 目录。
  - 更新 `src/lib/novel-promotion/stages/video-stage-runtime/*` 与 `voice-stage-runtime/*`，旧 helper 文件已统一收口为对 `@renderer` runtime 目录的薄转发。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/video/VideoToolbar.tsx` 与 `video/index.ts`，新增 `VideoToolbarLabels`，把 `video-stage` 顶部工具栏的文案边界提升到 `useVideoStageRuntime.tsx` 组装。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/voice-stage/VoiceControlPanel.tsx`，新增 `VoiceControlPanelLabels`，把台词编辑弹层文案边界提升到 `useVoiceStageRuntime.tsx` 组装。
  - 结果：`video-stage / voice-stage` 的主运行链和第一层可见控制面板都已回到 `packages/renderer`；`src/lib/novel-promotion/stages` 继续缩成运行时薄外壳。
- 本轮 `npm run desktop:build:web` 已通过。
- 2026-03-25 06:40:00：继续推进 `video-stage / voice-stage` 的显式 labels 收口，完成 `VideoTimelinePanel / VoiceToolbar / EmbeddedVoiceToolbar / SpeakerVoiceStatus / VoiceLineList / SpeakerVoiceBindingDialog` 这批展示组件的翻译边界上提。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/video-stage/VideoTimelinePanel.tsx` 与 `video-stage/hooks/useVideoStageRuntime.tsx`，新增 `VideoTimelinePanelLabels`，时间线卡片不再直接依赖 `useTranslations('voice')`，文案统一回到 `useVideoStageRuntime.tsx` 组装。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/voice/VoiceToolbar.tsx`、`EmbeddedVoiceToolbar.tsx`、`SpeakerVoiceStatus.tsx`、`voice-stage/VoiceControlPanel.tsx` 与 `voice-stage/hooks/useVoiceStageRuntime.tsx`，新增 `VoiceToolbarLabels / EmbeddedVoiceToolbarLabels / SpeakerVoiceStatusLabels`，配音控制面板及其顶部工具栏、嵌入工具栏、发言人状态卡全部改成显式 labels 注入。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/voice/EmotionSettingsPanel.tsx`、`EmptyVoiceState.tsx`、`VoiceLineCard.tsx`、`voice-stage/VoiceLineList.tsx` 与 `voice-stage/hooks/useVoiceStageRuntime.tsx`，把空态、台词卡片、情绪设置面板统一收口为 `VoiceLineListLabels`，展示组件已清掉 `useTranslations`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/voice/SpeakerVoiceBindingDialog.tsx` 与 `voice-stage/hooks/useVoiceStageRuntime.tsx`，新增 `SpeakerVoiceBindingDialogLabels`，内联音色绑定弹窗也改为 runtime 注入文案。
  - 结果：`packages/renderer/modules/project-detail/novel-promotion/components/video-stage`、`voice`、`voice-stage` 三个目录下，除了根 `useVideoStageRuntime.tsx` 与 `useVoiceStageRuntime.tsx` 之外，展示组件中的 `useTranslations` 已清零。
- 本轮 `npm run desktop:build:web` 已通过。
- 2026-03-25 08:15:00：继续推进 `renderer` 主链的显式 labels 收口，完成 `video/voice` 展示层和 `input-stage` 这两组主链组件的翻译边界上提。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/video-stage/VideoTimelinePanel.tsx` 与 `video-stage/hooks/useVideoStageRuntime.tsx`，新增 `VideoTimelinePanelLabels`，时间线展示卡片已改为由 `useVideoStageRuntime.tsx` 注入文案。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/voice/VoiceToolbar.tsx`、`EmbeddedVoiceToolbar.tsx`、`SpeakerVoiceStatus.tsx`、`VoiceLineCard.tsx`、`EmptyVoiceState.tsx`、`EmotionSettingsPanel.tsx`、`SpeakerVoiceBindingDialog.tsx`，以及 `voice-stage/VoiceControlPanel.tsx`、`VoiceLineList.tsx`、`hooks/useVoiceStageRuntime.tsx`，把 `voice` 展示链统一收口成 `VoiceControlPanelLabels / VoiceLineListLabels / SpeakerVoiceBindingDialogLabels` 三层显式契约；展示组件中的 `useTranslations` 已清零。
  - 结果：`packages/renderer/modules/project-detail/novel-promotion/components/video-stage`、`voice`、`voice-stage` 三个目录下只剩 `useVideoStageRuntime.tsx` 与 `useVoiceStageRuntime.tsx` 两个根 runtime 直接取词。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/NovelInputStage.tsx`、`input-stage/CurrentEpisodeBanner.tsx`、`NovelTextInputPanel.tsx`、`NovelInputConfigPanel.tsx`、`NovelInputActionPanel.tsx`、`RatioSelector.tsx`、`StyleSelector.tsx`，把 `input-stage` 六个展示子组件改为显式 labels 契约，由 `NovelInputStage.tsx` 根组件统一组装注入。
  - 结果：`packages/renderer/modules/project-detail/novel-promotion/components/input-stage` 目录内的 `useTranslations` 已清零，仅 `NovelInputStage.tsx` 根组件保留翻译组装职责。
- 本轮 `npm run desktop:build:web` 已通过。
- 2026-03-25 09:05:00：继续推进 `video` 主链的显式 labels 收口，完成 `video/panel-card/runtime` 的翻译边界上提。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/video/panel-card/runtime/videoPanelRuntimeCore.tsx`，新增 `labels` 与 `formatCapabilityLabel`，把 `panel-card` 展示链所需文案统一收口在根 runtime hook。
  - 更新 `VideoPanelCardHeader.tsx`、`VideoPanelCardBody.tsx`、`VideoPanelCardFooter.tsx`，清掉对 `runtime.t / runtime.tCommon` 的直接依赖，全部改为显式消费 `runtime.labels`。
  - 结果：`packages/renderer/modules/project-detail/novel-promotion/components/video/panel-card` 目录下，展示组件侧已经没有直接翻译边界，只剩 `videoPanelRuntimeCore.tsx` 作为根文案装配点。
- 本轮 `npm run desktop:build:web` 已通过。
- 2026-03-25 10:10:00：继续推进 `renderer` 主链，完成 `prompts-stage` 与 `smart-import` 两组显示层/业务消息边界上提。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/prompts-stage/runtime/promptStageRuntime.types.ts`、`runtime/promptStageRuntimeCore.tsx`、`runtime/hooks/usePromptEditorRuntime.ts`、`runtime/hooks/usePromptAiModifyFlow.ts`、`runtime/hooks/usePromptAppendFlow.ts`，新增 `PromptStageLabels / PromptEditorMessages / PromptAppendMessages`，把 `PromptListToolbar / PromptListCardView / PromptListTableView / PromptAppendSection / PromptStageNextButton` 的显示文案与编辑/追加提示统一提升到 `promptStageRuntimeCore.tsx` 根 runtime 组装。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/prompts-stage/PromptListToolbar.tsx`、`PromptListCardView.tsx`、`PromptListTableView.tsx`、`PromptAppendSection.tsx`、`PromptStageNextButton.tsx`，这批展示组件已清掉 `useTranslations`，只消费显式 `labels`。
  - 使用 `rg -n --glob "*.tsx" "useTranslations\(" "packages/renderer/modules/project-detail/novel-promotion/components/prompts-stage"` 校验，当前 `prompts-stage` 下仅 `runtime/promptStageRuntimeCore.tsx` 保留根翻译边界。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/smart-import/types.ts`、`SmartImportWizard.tsx`、`smart-import/steps/StepSource.tsx`、`StepMapping.tsx`、`StepConfirm.tsx`、`StepParse.tsx`，新增 `StepSourceLabels / StepMappingLabels / StepConfirmLabels / StepParseLabels`，把四个步骤页的显示文案统一提升到 `SmartImportWizard.tsx` 根入口组装。
  - 使用 `rg -n --glob "*.tsx" "useTranslations\(" "packages/renderer/modules/project-detail/novel-promotion/components/smart-import" "packages/renderer/modules/project-detail/novel-promotion/components/SmartImportWizard.tsx"` 校验，当前 `smart-import` 这条链仅 `SmartImportWizard.tsx` 保留根翻译边界。
- 本轮 `npm run desktop:build:web` 已通过；仍保留仓库既有 ESLint warning 与 `bullmq` critical dependency warning，未新增构建阻断。
- 2026-03-25 12:15:00：继续推进 `assets` 主链，完成 `AssetToolbar / CharacterSection / CharacterGroupPanel / LocationSection` 这组上层壳的显式 labels 化。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/assets/AssetToolbar.tsx`，新增 `AssetToolbarLabels`，把工具栏统计、全局分析、批量生成、刷新、下载提示和下载失败文案全部提升到外层注入；`AssetToolbar.tsx` 已清掉 `useTranslations('assets')`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/assets/CharacterSection.tsx`、`character-section/CharacterSectionHeader.tsx`、`character-section/CharacterGroupPanel.tsx`，新增 `CharacterSectionLabels`，把角色区标题、统计、添加角色、资产数、复制全局档案、删除角色这些文案统一提升到 section props 组装层；这三处已清掉 `useTranslations('assets')`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/assets/LocationSection.tsx`、`location-section/LocationSectionHeader.tsx`，新增 `LocationSectionLabels`，把场景区标题、统计和新增场景文案统一提升到 section props 组装层；这两处已清掉 `useTranslations('assets')`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/assets/hooks/useAssetsStageSectionProps.ts`，由该 hook 统一组装 `toolbar / character section / location section` 三组 labels，再向 `AssetsStageSections` 下发。
  - 使用定向 `rg` 校验，上述 6 个文件中的 `useTranslations` 已清零；当前 `assets` 主链残留热点已收敛到 `AssetsStage.tsx`、`AssetLibrary.tsx`、`AddLocationModal.tsx`、`CharacterCard.tsx`、`LocationCard.tsx` 以及 `assets/character-card/*`、`assets/location-card/*`。
- 本轮 `npm run desktop:build:web` 已通过；未新增构建阻断。
- 2026-03-25 13:10:00：继续推进 `assets` 主链，完成 `CharacterProfile*`、`AssetsEditingModals` 以及 `CharacterCard / LocationCard` 两条卡片链的翻译边界上提。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/assets/UnconfirmedProfilesSection.tsx`、`AssetsSupportModals.tsx`、`AssetsStageModals.tsx`、`hooks/useAssetsStageSectionProps.ts`，把 `CharacterProfileCard` 和 `CharacterProfileDialog` 的 labels 统一提升到 `useAssetsStageSectionProps` 组装；`UnconfirmedProfilesSection.tsx` 与 `AssetsSupportModals.tsx` 已清掉 `useTranslations('assets')`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/assets/AssetsEditingModals.tsx`、`AssetsStageModals.tsx`、`hooks/useAssetsStageSectionProps.ts`，把 `ImageEditModal` 的 labels 从 `AssetsEditingModals.tsx` 提升到 `useAssetsStageSectionProps` 组装；`AssetsEditingModals.tsx` 已清掉 `useTranslations('assets')`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/assets/character-card/types.ts`、`location-card/types.ts`、`character-card/useCharacterCardState.ts`、`location-card/useLocationCardState.ts`，为角色/场景卡片补齐 `state messages + selection/overlay/compact labels` 契约，并清掉 state hook 内的直接翻译依赖。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/assets/CharacterCard.tsx`、`LocationCard.tsx`，让卡片改为纯消费显式 `labels/messages`；对应的 labels 组装继续上提到 `character-section/CharacterGroupPanel.tsx` 与 `location-section/LocationGridItem.tsx`，随后再上提到 `CharacterSection.tsx`、`LocationSection.tsx` 和 `hooks/useAssetsStageSectionProps.ts`。
  - 使用定向 `rg -n "useTranslations\(" "packages/renderer/modules/project-detail/novel-promotion/components/assets"` 校验，当前 `assets` 目录中仅剩一个未被 `renderer` 主链引用的 `AddLocationModal.tsx` 保留直接翻译边界；`assets/hooks`、`assets/character-card/*`、`assets/location-card/*`、`CharacterCard.tsx`、`LocationCard.tsx`、`CharacterGroupPanel.tsx`、`LocationGridItem.tsx`、`UnconfirmedProfilesSection.tsx`、`AssetsSupportModals.tsx`、`AssetsEditingModals.tsx` 已全部清零。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-25 14:05:00：继续推进 `assets` 和资产库主链，完成运行中资产库入口的显式 labels 收口。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/WorkspaceAssetLibraryModal.tsx`，新增 `WorkspaceAssetLibraryModalLabels`，将标题从组件内部硬编码改为显式 labels 注入。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/NovelPromotionWorkspace.tsx`，由 `vm.i18n.t('buttons.assetLibrary')` 统一组装并向 `WorkspaceAssetLibraryModal` 注入 labels。
  - 结果：正在使用的资产库主链入口已统一回到 workspace 根容器装配；`packages/renderer/modules/project-detail/novel-promotion/components/assets` 主链只剩未被主链引用的 `AddLocationModal.tsx` 残留可作为死代码候选，后续删除需用户确认。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 11:35:00：继续推进 `renderer` 主链的根翻译边界收口，完成 `storyboard / assets / input-stage / smart-import / run-stream` 五条链的一批根 i18n hook 改造。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/hooks/useStoryboardStageLabels.ts` 与 `useStoryboardGroupLabels.ts`，把 `StoryboardStage` 和 `StoryboardGroup` 中大段 `controllerMessages / labels / messages` 组装整体抽成专用 hook；`storyboard/index.tsx` 与 `StoryboardGroup.tsx` 已清掉直接 `useTranslations('storyboard')`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/PanelEditForm.tsx`、`StoryboardStageAssetPickers.tsx`、`StoryboardStageModals.types.ts`、`hooks/useStoryboardStageRuntime.ts`、`hooks/useStoryboardStageSectionProps.ts`、`hooks/useStoryboardStageLabels.ts` 与 `storyboard/index.tsx`，把 `CharacterPickerModal / LocationPickerModal` 改成显式 `labels`，并由 `StoryboardStage -> StoryboardStageModals -> StoryboardStageAssetPickers` 注入；`PanelEditForm.tsx` 已清掉直接翻译依赖。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/assets/hooks/useAssetsStageI18n.ts`，把 `AssetsStage.tsx` 中批量生成、复制、角色/场景、TTS、档案管理五组消息统一抽成 hook；`AssetsStage.tsx` 已清掉直接 `useTranslations('assets')`，只保留对 `useAssetsStageI18n` 返回的 `t/messages` 消费。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/input-stage/useNovelInputStageLabels.ts` 与 `smart-import/hooks/useSmartImportLabels.ts`，把 `NovelInputStage.tsx` 和 `SmartImportWizard.tsx` 的 labels 组装迁入专用 hook；这两个根组件已清掉直接 `useTranslations`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/WorkspaceRunStreamConsoles.tsx` 与 `NovelPromotionWorkspace.tsx`，把运行流控制台文案改成由 workspace 根容器显式注入；`WorkspaceRunStreamConsoles.tsx` 已清掉 `useTranslations('progress')`。
  - 使用 `npx tsc --noEmit --pretty false --incremental false` 多轮校验通过；当前热点已进一步收敛到 `prompts-stage/runtime/promptStageRuntimeCore.tsx`、`script-view/useScriptViewTranslations.ts`、`video-stage/hooks/useVideoStageRuntime.tsx`、`voice-stage/hooks/useVoiceStageRuntime.tsx`、`video/panel-card/runtime/videoPanelRuntimeCore.tsx`、少量未接入主链的 `video/VideoPromptModal.tsx` 与 `video/FirstLastFramePanel.tsx`，以及本轮新增的根 i18n hook 文件本身。
- 2026-03-26 09:27:39：继续推进 `video-stage / voice-stage / video` 三条主链的根翻译边界收口，完成 runtime i18n hook 与 `video/panel-card` 翻译边界上提。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/video-stage/hooks/useVideoStageI18n.ts`，把 `VideoToolbar / VideoTimelinePanel / batch config modal` 的 labels 以及 `renderCapabilityLabel` 统一抽成专用 i18n hook；`useVideoStageRuntime.tsx` 已清掉直接 `useTranslations('video')`，改为消费显式 `toolbarLabels / timelineLabels / batchConfigLabels / translate / renderCapabilityLabel`。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/voice-stage/hooks/useVoiceStageI18n.ts`，把 `VoiceControlPanel / VoiceLineList / SpeakerVoiceBindingDialog` 的 labels、加载文案、任务失败提示消息与 `translate/translateWithValues` 统一抽成专用 i18n hook；`useVoiceStageRuntime.tsx` 已清掉直接 `useTranslations('voice')`。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/video/panel-card/runtime/useVideoPanelRuntimeI18n.ts`，把 `videoPanelRuntimeCore.tsx` 中 `panel-card` 展示链和 capability label 格式化统一提升到专用 i18n hook；`videoPanelRuntimeCore.tsx` 已清掉 `useTranslations('video') / useTranslations('common')`。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/components/video/useVideoPromptModalLabels.ts` 与 `useFirstLastFramePanelLabels.ts`，把未接主链但仍保留在 `packages/renderer` 的 `VideoPromptModal.tsx` 与 `FirstLastFramePanel.tsx` 也改成 labels hook 模式；这两个组件已清掉直接 `useTranslations('video')`。
  - 使用 `rg -n "useTranslations\(" "packages/renderer/modules/project-detail/novel-promotion/components/video" "packages/renderer/modules/project-detail/novel-promotion/components/video-stage" "packages/renderer/modules/project-detail/novel-promotion/components/voice-stage"` 校验，当前这三条链仅剩专用 i18n hook 文件本身保留翻译边界，展示组件与 runtime 已全部清零。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 10:05:00：继续推进 `novel-promotion` 模块级根容器翻译边界收口，完成 workspace 根容器与 stage navigation 的 i18n hook 化。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/hooks/useNovelPromotionWorkspaceI18n.ts`，把 `NovelPromotionWorkspace.tsx` 和 `useNovelPromotionWorkspaceController.ts` 共同使用的 `novelPromotion / errors / common / progress` 翻译组装统一抽到专用 hook。
  - 更新 `NovelPromotionWorkspace.tsx`，去掉直接 `useTranslations('progress')`，运行流徽标、顶部资产库按钮、刷新按钮、创建中 toast、重建确认按钮与 `WorkspaceRunStreamConsoles` labels 已统一改成消费 `useNovelPromotionWorkspaceI18n.ts` 返回的显式 labels。
  - 更新 `hooks/useNovelPromotionWorkspaceController.ts`，去掉对 `useTranslations('novelPromotion'/'errors'/'common')` 的直接依赖，改为消费 `useNovelPromotionWorkspaceI18n.ts` 返回的 `t / tc / te`。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/useStageNavigationLabels.ts`，并更新 `StageNavigation.tsx`，把阶段导航按钮文案提到专用 labels hook；`StageNavigation.tsx` 已清掉直接翻译依赖。
  - 使用 `rg -n "useTranslations\(" "packages/renderer/modules/project-detail/novel-promotion"` 校验，当前整个 `novel-promotion` 模块只剩专用 i18n hook/labels hook 自身保留翻译边界，主运行链和展示组件已清零。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 11:10:00：开始把 `packages/renderer` 的高频 `/api/*` 直连从页面 hook 中收口到 renderer client，给后续 IPC 替换建立闸口。
  - 新增 `packages/renderer/clients/project-client.ts`，收口 `projects / novel-promotion episodes / user-preference` 相关请求。
  - 更新 `packages/renderer/modules/workspace/useWorkspacePageState.ts`，把项目列表、创建/更新/删除项目、用户偏好读取全部改成走 `project-client.ts`，页面 hook 已清掉原始 `/api/projects*` 和 `/api/user-preference` 路径字符串。
  - 更新 `packages/renderer/modules/project-detail/useProjectDetailEpisodeActions.ts` 与 `useProjectDetailModelSetup.ts`，把剧集创建/重命名/删除、项目数据读取、默认分析模型读取/写入统一改成走 `project-client.ts`。
  - 新增 `packages/renderer/clients/task-client.ts` 与 `packages/renderer/clients/auth-client.ts`，分别收口任务状态轮询和注册提交。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/components/voice-stage/runtime/useVoiceRuntimeSync.ts`，任务状态轮询已不再直接拼 `/api/tasks/*`。
  - 更新 `packages/renderer/modules/auth/useSignUpForm.ts`，注册提交已改成通过 `auth-client.ts`。
  - 使用 `rg -n "apiFetch\(" "packages/renderer"` 校验，`workspace / project-detail / auth` 这一组的高频主链已从页面 hook 迁入 `packages/renderer/clients/*`；当前剩余热点已集中到 `asset-hub-page.tsx` 与 `profile/api-config` 系列。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 12:05:00：继续推进 `packages/renderer` 的 client 化，完成 `asset-hub-page` 与 `profile/api-config` 这一批高频 `/api/*` 直连收口。
  - 新增 `packages/renderer/clients/asset-hub-client.ts`，统一收口资产库文件夹创建/更新/删除、AI 音色保存、资产图生成请求、角色绑定全局音色。
  - 更新 `packages/renderer/pages/asset-hub-page.tsx`，把 `/api/asset-hub/folders*`、`/api/asset-hub/character-voice`、`/api/asset-hub/generate-image`、`/api/asset-hub/characters/[characterId]` 的原始调用全部改成走 `asset-hub-client.ts`。
  - 新增 `packages/renderer/clients/api-config-client.ts`，统一收口 `GET/PUT /api/user/api-config`、`POST /api/user/api-config/test-provider`、`POST /api/user/api-config/probe-model-llm-protocol`。
  - 更新 `packages/renderer/modules/profile/components/api-config/hooks.ts`、`provider-card/hooks/useProviderCardState.ts`、`api-config-tab/ApiConfigTabContainer.tsx`，把配置加载/保存、provider 连通性测试、LLM protocol 探测全部改成走 `api-config-client.ts`。
  - 使用 `rg -n "apiFetch\("` 对 `asset-hub-page.tsx`、`api-config/hooks.ts`、`useProviderCardState.ts`、`ApiConfigTabContainer.tsx` 定向校验，4 个调用点中的 `apiFetch` 已清零；`packages/renderer` 下剩余 `apiFetch` 已全部集中在 `clients/*` 目录，便于后续继续替换为 IPC client。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 12:45:00：继续推进桌面蓝图中的认证脱钩，先把 `renderer` 从 `next-auth/react` 脱开，再把后端 `session` 读取从 `api-auth.ts` 抽成 service。
  - 更新 `packages/renderer/clients/auth-client.ts`，新增 `getRendererSession`、`signInWithCredentials`、`signOutRendererSession`、`RendererAuthSession` 等显式 client 能力，`renderer` 前端会话层开始只依赖本地 auth client，不再依赖 `next-auth/react`。
  - 更新 `packages/renderer/auth/client.tsx`，移除 `SessionProvider / useSession / signIn / signOut`，改为自管 `RendererSessionContext`、`useRendererSession`、`useRequiredRendererSession`、`useGuestRendererSession`，并通过自定义 `renderer-auth:session-changed` 事件刷新会话状态。
  - 使用 `rg -n "next-auth/react|useSession\(|SessionProvider|signIn\(|signOut\(" "packages/renderer"` 校验，当前 `packages/renderer` 中已不再引用 `next-auth/react`。
  - 新增 `packages/engine/services/auth-login-service.ts`，把用户名/密码校验与登录日志统一收口；`packages/engine/auth.ts` 的 `CredentialsProvider.authorize` 已改成只委托 `authenticateUserCredentials()`。
  - 新增 `packages/engine/services/auth-session-service.ts`，把 `getServerSession(authOptions)` 和内部任务令牌会话读取统一抽到 service；`packages/engine/api-auth.ts` 现在只保留鉴权编排与权限检查，不再直接持有 `NextAuth` session 读取逻辑。
  - 使用 `rg -n "next-auth|PrismaAdapter|getServerSession" "packages/engine"` 校验，当前 `packages/engine` 中的 `NextAuth` 依赖已收敛到 `auth.ts` 和 `services/auth-session-service.ts` 两个真正的后端接入点。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 13:20:00：继续推进认证主链脱钩，完成 `NextAuth bridge` 收口与 `src/app/api/auth` 整组薄路由化。
  - 新增 `packages/engine/services/next-auth-bridge-service.ts`，把 `authOptions`、`NextAuth` route handler、`getServerSession(authOptions)`、登录限流兼容响应统一收进单一 bridge service。
  - 更新 `packages/engine/auth.ts`，退成对 `next-auth-bridge-service` 的薄导出；`packages/engine/services/auth-session-service.ts` 已改成调用 `readNextAuthSession()`，不再直接引用 `getServerSession(authOptions)`。
  - 更新 `src/app/api/auth/[...nextauth]/route.ts`，现在只转发 `handleNextAuthGetRequest / handleNextAuthPostRequest`，路由层已清掉 `NextAuth`、限流、日志与兼容响应细节。
  - 新增 `packages/engine/services/auth-register-route-service.ts`，把注册限流和注册响应下沉到 engine service；`src/app/api/auth/register/route.ts` 已退成 `apiHandler(handleRegisterUserRequest)` 薄路由。
  - 使用 `rg` 校验，当前 `src/app/api/auth` 目录已只剩转发层；`packages/engine` 中的 `NextAuth` 依赖已收敛到 `services/next-auth-bridge-service.ts` 这一个真正的桥接点，以及调用它的 `auth-session-service.ts`/`auth.ts` 薄外壳。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 14:05:00：继续推进桌面主链对 `src/lib/query/hooks` 的解耦，完成 `asset-hub` 只读查询链向 `packages/renderer` 前移。
  - 扩展 `packages/renderer/clients/asset-hub-client.ts`，新增 `listAssetHubCharacters / listAssetHubLocations / listAssetHubVoices / listAssetHubFolders` 四个只读入口。
  - 新增 `packages/renderer/modules/asset-hub/hooks/useAssetHubQueries.ts`，把 `GlobalCharacter / GlobalLocation / GlobalVoice / GlobalFolder` 类型和 `useRendererGlobalCharacters / useRendererGlobalLocations / useRendererGlobalVoices / useRendererGlobalFolders` 查询 hooks 前移到 renderer；查询仍复用 `queryKeys` 与 `useTaskTargetStateMap`，但已不再通过 `src/lib/query/hooks/useGlobalAssets.ts` 间接绑定 Web 查询层。
  - 更新 `packages/renderer/pages/asset-hub-page.tsx`，把文件夹/角色/场景/音色四组只读查询改成走 `useRendererGlobal*`；更新 `packages/renderer/modules/asset-hub/components/VoicePickerDialog.tsx`，改成走 `useRendererGlobalVoices()`。
  - 使用 `rg` 校验，`asset-hub-page.tsx` 与 `VoicePickerDialog.tsx` 中对 `useGlobalCharacters / useGlobalLocations / useGlobalVoices / useGlobalFolders` 的引用已清零。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 14:35:00：继续推进 `renderer` 对旧查询层的解耦，完成 `asset-hub` 页面对 `useSSE`、任务目标状态查询与音色选择弹窗的 renderer 包装。
  - 新增 `packages/renderer/hooks/useRendererSse.ts`、`packages/renderer/hooks/useRendererTaskTargetStateMap.ts`，把 `useSSE` 与 `useTaskTargetStateMap` 包到 `renderer` 侧稳定入口；新增 `packages/renderer/modules/asset-hub/hooks/useAssetHubSse.ts`，专门承接全局资产库 SSE 订阅。
  - 更新 `packages/renderer/pages/asset-hub-page.tsx`，改用 `useAssetHubSse()`，页面已清掉对 `@/lib/query/hooks` 的最后一条直接依赖；更新 `packages/renderer/modules/asset-hub/hooks/useAssetHubQueries.ts`，改成走 `useRendererTaskTargetStateMap()`，`asset-hub` 查询 hook 不再直接引用旧 query hook。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/WorkspaceProvider.tsx`，把工作区 SSE 订阅从 `@/lib/query/hooks/useSSE` 切到 `@renderer/hooks/useRendererSse`，为下一批工作区链路继续前移做准备。
  - 更新 `packages/renderer/modules/asset-hub/components/VoicePickerDialog.tsx`，新增 `VoicePickerDialogLabels`，把标题、空态、确认/取消、试听/播放中文案提升为显式 labels；同步更新 `packages/renderer/pages/asset-hub-page.tsx` 与 `packages/renderer/modules/project-detail/novel-promotion/components/voice/SpeakerVoiceBindingDialog.tsx` 传入 labels，并补齐旧 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/voice/SpeakerVoiceBindingDialog.tsx` 的兼容入参，确保 Next 旧树仍可编译。
  - 使用 `rg` 定向校验，`asset-hub-page.tsx`、`WorkspaceProvider.tsx`、`VoicePickerDialog.tsx` 已清掉对 `@/lib/query/hooks` 或 `useTranslations` 的直接主链依赖。
- 2026-03-26 15:05:00：继续推进 `asset-hub` 组件层 mutation 边界收口，完成模块内旧 query hook 的稳定出口封装。
  - 新增 `packages/renderer/modules/asset-hub/hooks/useAssetHubOperations.ts`，统一封装 `useAiDesignLocation`、`useCreateAssetHubLocation`、`useRefreshGlobalAssets`、`useUpdateCharacterName`、`useAiModifyCharacterDescription`、`useUpdateCharacterAppearanceDescription`、`useUpdateLocationName`、`useAiModifyLocationDescription`、`useUpdateLocationSummary`、`useDesignAssetHubVoice`、`useSaveDesignedAssetHubVoice`、`useUploadAssetHubVoice`。
  - 更新 `packages/renderer/modules/asset-hub/components/AddLocationModal.tsx`、`CharacterEditModal.tsx`、`LocationEditModal.tsx`、`VoiceDesignDialog.tsx`、`voice-creation/hooks/useVoiceCreation.tsx`，这 5 处组件/运行时 hook 已不再直接 import `@/lib/query/hooks`，而是统一改走 `useAssetHubOperations.ts`。
  - 使用 `rg -n "@/lib/query/hooks|@/lib/query/hooks/use" "packages/renderer/modules/asset-hub"` 校验，当前 `asset-hub` 模块内对旧 query hooks 的直接依赖已只剩 `useAssetHubOperations.ts` 这一层稳定出口；组件层与页面层不再直接耦合旧查询实现。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 15:35:00：继续推进 `asset-hub` 模块级解耦，完成 SSE/任务目标状态查询包装与音色选择弹窗 labels 化。
  - 新增 `packages/renderer/hooks/useRendererSse.ts` 与 `packages/renderer/hooks/useRendererTaskTargetStateMap.ts`，把 `useSSE`、`useTaskTargetStateMap` 收口到 `renderer` 层稳定出口；新增 `packages/renderer/modules/asset-hub/hooks/useAssetHubSse.ts` 承接全局资产库 SSE 订阅。
  - 更新 `packages/renderer/pages/asset-hub-page.tsx`，改用 `useAssetHubSse()`，页面已清掉对 `@/lib/query/hooks` 的最后一条直接依赖；更新 `packages/renderer/modules/asset-hub/hooks/useAssetHubQueries.ts`，改成走 `useRendererTaskTargetStateMap()`，`asset-hub` 查询 hook 不再直接引用旧 query hook。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/WorkspaceProvider.tsx`，把工作区 SSE 订阅切到 `@renderer/hooks/useRendererSse`，工作区根 provider 不再直接依赖 `@/lib/query/hooks/useSSE`。
  - 更新 `packages/renderer/modules/asset-hub/components/VoicePickerDialog.tsx`，新增 `VoicePickerDialogLabels`，把标题、空态、确认/取消、试听/播放文案全部提升为显式 labels；同步更新 `packages/renderer/pages/asset-hub-page.tsx`、`packages/renderer/modules/project-detail/novel-promotion/components/voice/SpeakerVoiceBindingDialog.tsx`，并补齐旧 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/voice/SpeakerVoiceBindingDialog.tsx` 的兼容入参，确保旧树仍可编译。
- 2026-03-26 16:05:00：继续推进 `asset-hub` 组件层 mutation 边界和 `project-detail` 根查询边界前移。
  - 新增 `packages/renderer/modules/asset-hub/hooks/useAssetHubOperations.ts`，统一封装 `useAiDesignLocation`、`useCreateAssetHubLocation`、`useRefreshGlobalAssets`、`useUpdateCharacterName`、`useAiModifyCharacterDescription`、`useUpdateCharacterAppearanceDescription`、`useUpdateLocationName`、`useAiModifyLocationDescription`、`useUpdateLocationSummary`、`useDesignAssetHubVoice`、`useSaveDesignedAssetHubVoice`、`useUploadAssetHubVoice`；更新 `AddLocationModal.tsx`、`CharacterEditModal.tsx`、`LocationEditModal.tsx`、`VoiceDesignDialog.tsx`、`voice-creation/hooks/useVoiceCreation.tsx`，这 5 处组件/运行时 hook 已不再直接 import `@/lib/query/hooks`。
  - 新增 `packages/renderer/hooks/useRendererProjectQueries.ts`，统一暴露 `useProjectData / useEpisodeData / useProjectAssets / useRefreshProjectAssets / useUserModels`；更新 `packages/renderer/modules/project-detail/useProjectDetailPageState.ts`、`useProjectDetailModelSetup.ts`、`novel-promotion/hooks/useWorkspaceUserModels.ts`、`useWorkspaceEpisodeStageData.ts`、`AssetLibrary.tsx`、`AssetsStage.tsx`、`AssetToolbar.tsx`、`PanelEditForm.tsx`、`script-view/ScriptViewRuntime.tsx`、`storyboard/ImageEditModal.tsx`、`assets/CharacterSection.tsx`、`assets/LocationSection.tsx`、`storyboard/hooks/useStoryboardStageController.ts`、`voice-stage/hooks/useVoiceStageRuntime.tsx`，把这批根查询/根只读资产链全部收口到 `renderer` 侧稳定出口。
  - 使用 `rg` 定向校验，当前 `asset-hub-page.tsx`、`WorkspaceProvider.tsx`、`useAssetHubQueries.ts`、`VoicePickerDialog.tsx` 已清掉对旧 query hooks 的直接依赖；`asset-hub` 模块内对旧 query hooks 的直接引用已只剩 `useAssetHubOperations.ts` 这一层稳定出口。`project-detail` 这批根查询文件也已统一转向 `@renderer/hooks/useRendererProjectQueries`。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 16:35:00：继续推进 `project-detail / novel-promotion` 的 renderer 稳定出口建设，完成 `assets` 与 `storyboard` 两组高频 mutation/refresh 链的统一收口。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations.ts`，统一封装 `useGenerateProjectCharacterImage`、`useGenerateProjectLocationImage`、`useAiCreateProjectLocation`、`useCreateProjectLocation`、`useAnalyzeProjectGlobalAssets`、`useCopyProjectAssetFromGlobal`、`useRegenerateSingleCharacterImage`、`useRegenerateCharacterGroup`、`useDeleteProjectCharacter`、`useDeleteProjectAppearance`、`useSelectProjectCharacterImage`、`useConfirmProjectCharacterSelection`、`useUpdateProjectAppearanceDescription`、`useRegenerateSingleLocationImage`、`useRegenerateLocationGroup`、`useDeleteProjectLocation`、`useSelectProjectLocationImage`、`useConfirmProjectLocationSelection`、`useUpdateProjectLocationDescription`、`useUpdateProjectCharacterVoiceSettings`、`useSaveProjectDesignedVoice`、`useCreateProjectPanel`、`useDeleteProjectPanel`、`useUpdateProjectPanel`、`useInsertProjectPanel`、`useCreateProjectPanelVariant`、`useRefreshEpisodeData`、`useAnalyzeProjectShotVariants`、`useClearProjectStoryboardError`、`useRefreshStoryboards`、`useRegenerateProjectPanelImage`、`useModifyProjectStoryboardImage`、`useDownloadProjectImages`、`useDeleteProjectStoryboardGroup`、`useRegenerateProjectStoryboardText`、`useCreateProjectStoryboardGroup`、`useMoveProjectStoryboardGroup`、`useSelectProjectPanelCandidate` 等高频操作。
  - 新增 `packages/renderer/hooks/useRendererProjectQueries.ts`，统一暴露 `useProjectData / useEpisodeData / useProjectAssets / useRefreshProjectAssets / useUserModels` 这组根查询与刷新入口。
  - 更新 `packages/renderer/modules/project-detail/useProjectDetailPageState.ts`、`useProjectDetailModelSetup.ts`、`novel-promotion/hooks/useWorkspaceUserModels.ts`、`useWorkspaceEpisodeStageData.ts`、`AssetLibrary.tsx`、`AssetsStage.tsx`、`assets/AssetToolbar.tsx`、`PanelEditForm.tsx`、`script-view/ScriptViewRuntime.tsx`、`storyboard/ImageEditModal.tsx`、`assets/CharacterSection.tsx`、`assets/LocationSection.tsx`、`storyboard/hooks/useStoryboardStageController.ts`、`voice-stage/hooks/useVoiceStageRuntime.tsx`，将根查询/只读资产链统一切到 `@renderer/hooks/useRendererProjectQueries`。
  - 更新 `assets` 侧操作链：`components/assets/AddLocationModal.tsx`、`hooks/useAssetsGlobalActions.ts`、`useAssetsCopyFromHub.ts`、`useCharacterActions.ts`、`useLocationActions.ts`、`useTTSGeneration.ts`、`useProfileManagement.ts`、`useBatchGeneration.ts`、`useAssetModals.ts`、`useAssetsImageEdit.ts`、`useBatchGeneration.helpers.ts`，这组文件已清掉对旧 query hooks 的直接依赖，改为统一消费 `useRendererNovelPromotionOperations` 与 `useRendererProjectQueries`。
  - 更新 `storyboard` 侧操作链：`hooks/usePanelCrudActions.ts`、`usePanelInsertActions.ts`、`usePanelVariant.ts`、`useImageGeneration.ts`、`usePanelCandidates.ts`、`usePanelVariantModalState.ts`、`useStoryboardGroupActions.ts`、`usePanelOperations.ts`，这组文件已清掉对旧 query hooks / project mutations 的直接依赖，统一转向 `renderer` 稳定出口。
  - 使用定向 `rg` 校验，上述 `assets/hooks` 与本轮处理的 `storyboard/hooks` 文件已清掉 `@/lib/query/hooks` / `@/lib/query/mutations/useProjectMutations` 的直接引用；旧 query 层在这些主链文件中已不再直接出现。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 12:07:48：继续推进 `renderer` 与 `engine/auth` 两条主链边界收口，完成 `novel-promotion runtime hooks` 稳定出口、`renderer` 旧 query 直接依赖清零，以及 `auth provider` 中性边界落地。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionRuntimeHooks.ts`，统一封装 `run stream / task presentation / video / voice / smart-import / prompt runtime` 所需的旧 query hooks 与 task 状态 hooks；更新 `useWorkspaceConfigActions.ts`、`useWorkspaceExecution.ts`、`useWorkspaceVideoActions.ts`、`workspace-controller-view-model.ts`、`prompts-stage/runtime/promptStageRuntimeCore.tsx`、`smart-import/hooks/useWizardState.ts`、`voice/VoiceDesignDialog.tsx`、`voice-stage/runtime/useVoiceStageDataLoader.ts`、`useVoiceTaskState.ts`、`video-stage/hooks/useVideoStageRuntime.tsx`、`video-stage/runtime/useVideoTaskStates.ts`、`useVideoVoiceLines.ts`、`video/panel-card/runtime/hooks/usePanelVoiceManager.ts`、`storyboard/hooks/useStoryboardGroupTaskErrors.ts`、`useStoryboardTaskAwareStoryboards.ts`、`voice-stage/hooks/useVoiceStageRuntime.tsx`、`storyboard/hooks/useStoryboardStageController.ts`，这批运行时入口已清掉对 `@/lib/query/hooks*`、`@/lib/query/useStoryboards`、`@/lib/query/useTaskPresentation`、`@/lib/query/mutations/task-mutations` 的直接引用。
  - 扩展 `packages/renderer/modules/asset-hub/hooks/useAssetHubOperations.ts`，补齐 `generate/select/undo/upload/delete voice/location/character` 这批 asset-hub 卡片链 mutation 出口；更新 `asset-hub/components/CharacterCard.tsx`、`LocationCard.tsx`、`VoiceCard.tsx`、`VoiceSettings.tsx`，组件层已清掉对 `@/lib/query/mutations` 的直接引用。
  - 扩展 `packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations.ts`，补齐 `useUploadProjectCharacterImage`、`useUploadProjectLocationImage`、`useUploadProjectCharacterVoice`；更新 `components/assets/character-card/useCharacterCardState.ts`、`location-card/useLocationCardState.ts`、`components/assets/VoiceSettings.tsx`，`novel-promotion` 卡片链上传 mutation 已统一收口到 renderer bridge。
  - 新增 `scripts/guards/renderer-query-bridge-guard.mjs` 与 `package.json` 的 `check:renderer-query-bridge`，并将其接入 `test:guards`；当前 guard 只允许 `packages/renderer` 中的显式 bridge 文件接触 `@/lib/query/hooks*` / `@/lib/query/mutations*` 或 `next-auth/react`。运行 `node scripts/guards/renderer-query-bridge-guard.mjs` 已通过。
  - 新增 `packages/engine/services/auth-provider-service.ts`，把 `readNextAuthSession`、`handleNextAuthGetRequest`、`handleNextAuthPostRequest` 包成中性 provider service；更新 `packages/engine/auth.ts`、`packages/engine/services/auth-session-service.ts`、`src/app/api/auth/[...nextauth]/route.ts`，当前 `route` 和 `session` 读取已不再直接依赖 `next-auth-bridge-service`，为后续本地身份体系替换预留出稳定的 provider 边界。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 本轮 `node scripts/guards/renderer-query-bridge-guard.mjs` 已通过。
- 2026-03-26 13:05:17：继续推进 `engine/auth` 中性边界固化，新增 `next-auth` provider boundary guard。
  - 新增 `scripts/guards/engine-auth-provider-boundary-guard.mjs`，扫描 `packages/engine` 与 `src/app/api/auth`，约束只有 `packages/engine/services/next-auth-bridge-service.ts` 可以直接 import `next-auth` / `@next-auth/prisma-adapter`，且只有 `packages/engine/services/auth-provider-service.ts` 可以直接 import `@engine/services/next-auth-bridge-service`。
  - 更新 `package.json`，新增 `check:engine-auth-provider-boundary`，并把它接入 `test:guards`；当前 `engine/auth` 的 provider boundary 已形成可持续防回流的检查点。
  - 使用 `rg` 校验，`packages/engine` 与 `src/app/api/auth` 中剩余的 `next-auth` 直接依赖已经只保留在 `next-auth-bridge-service.ts`，`auth-provider-service.ts` 只保留对 bridge 的单点消费。
- 本轮 `node scripts/guards/engine-auth-provider-boundary-guard.mjs` 已通过。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 13:17:53：继续推进 renderer 认证主链去 `next-auth` 细节化，新增中性 auth 路由与认证 endpoint guard。
  - 更新 `packages/engine/services/auth-provider-service.ts`，新增 `handleAuthSessionRequest`、`handleAuthCsrfRequest`、`handleAuthLoginRequest`、`handleAuthLogoutRequest`，把 `session / csrf / login / logout` 这四种稳定入口统一映射到 provider service，再由 provider service 单点转发到 `next-auth-bridge-service`。
  - 新增 `src/app/api/auth/session/route.ts`、`src/app/api/auth/csrf/route.ts`、`src/app/api/auth/login/route.ts`、`src/app/api/auth/logout/route.ts`，`renderer` 前端主链已不再依赖 `callback/credentials` 与 `signout` 这类 `next-auth` 实现路径。
  - 更新 `packages/renderer/clients/auth-client.ts`，登录/退出已改走 `/api/auth/login?json=true` 与 `/api/auth/logout?json=true`，会话与 csrf 继续走稳定的 `/api/auth/session`、`/api/auth/csrf`。
  - 新增 `scripts/guards/renderer-auth-route-neutrality-guard.mjs`，禁止 `packages/renderer` 再出现 `/api/auth/callback/credentials` 与 `/api/auth/signout`；更新 `package.json`，新增 `check:renderer-auth-route-neutrality` 并接入 `test:guards`。
  - 使用 `rg` 校验，`packages/renderer` 当前认证主链只保留 `/api/auth/session`、`/api/auth/csrf`、`/api/auth/login`、`/api/auth/logout`、`/api/auth/register` 这组中性入口，旧 `next-auth` 路径已从 renderer 主链退出。
- 本轮 `node scripts/guards/renderer-auth-route-neutrality-guard.mjs` 已通过。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 13:20:06：继续推进 renderer transport boundary 固化，新增 `/api/*` client-only guard。
  - 新增 `scripts/guards/renderer-api-client-boundary-guard.mjs`，限制 `packages/renderer` 中只有 `packages/renderer/clients/*` 可以出现以 `/api/` 开头的原始路由字面量，避免页面、组件、runtime hook 回流到直连 HTTP。
  - 更新 `package.json`，新增 `check:renderer-api-client-boundary` 并接入 `test:guards`；当前 renderer 的 transport boundary 已从“约定”提升为“可执行守卫”。
  - 使用定向扫描校验，当前 `packages/renderer` 中的 `/api/*` 路径字面量已全部收敛在 `asset-hub-client.ts`、`project-client.ts`、`api-config-client.ts`、`task-client.ts`、`auth-client.ts` 五个 client 文件内，页面/组件/runtime hook 已无原始 `/api/*` 路由字符串。
- 本轮 `node scripts/guards/renderer-api-client-boundary-guard.mjs` 已通过。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 2026-03-26 18:15:00：继续推进 `renderer` 从旧 query 实现向真实 runtime hooks 迁移，完成第一批稳定请求的 client 化与 hook 落地。
  - 新增 `packages/renderer/clients/novel-promotion-runtime-client.ts`，把 `storyboard stats / project config / episode field / episodes list / episodes batch / split / split-by-markers / voice-stage data / analyze assets / analyze voice / design voice / generate voice / create-update-delete voice line / speaker voice / voice zip / episode video urls / remote blob / matched voice lines / clip update / panel link / video prompt / photography plan / acting notes` 这批稳定入口改成 renderer 自己的 request 层，不再依赖旧 query mutation 实现。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionRuntimeQueryHooks.ts`，用 TanStack Query 重新实现 `useGetProjectStoryboardStats`、`useUpdateProjectConfig`、`useUpdateProjectEpisodeField`、`useListProjectEpisodes`、`useSaveProjectEpisodesBatch`、`useSplitProjectEpisodes`、`useSplitProjectEpisodesByMarkers`、`useFetchProjectVoiceStageData`、`useAnalyzeProjectAssets`、`useAnalyzeProjectVoice`、`useDesignProjectVoice`、`useGenerateProjectVoice`、`useCreateProjectVoiceLine`、`useUpdateProjectVoiceLine`、`useDeleteProjectVoiceLine`、`useDownloadProjectVoices`、`useUpdateSpeakerVoice`、`useListProjectEpisodeVideoUrls`、`useDownloadRemoteBlob`、`useMatchedVoiceLines`、`useUpdateProjectClip`、`useUpdateProjectPanelLink`、`useUpdateProjectPanelVideoPrompt`、`useUpdateProjectPhotographyPlan`、`useUpdateProjectPanelActingNotes`、`useTaskList`、`useDismissFailedTasks`；其中 `projectData / episodeData / projectAssets / tasks` 相关 optimistic update 与 invalidate 已在 renderer hooks 内接管。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionRuntimeHooks.ts`，当前它只再对旧 query 层保留重流式/重 presentation 能力：`useAiModifyProjectShotPrompt`、`useStoryToScriptRunStream`、`useScriptToStoryboardRunStream`、`useStoryboardTaskPresentation`、`useVideoTaskPresentation`、`useVoiceTaskPresentation`、`useBatchGenerateVideos`、`useGenerateVideo`、`useLipSync`。
  - 结果是：`workspace config / smart-import / voice-stage data / voice runtime / video url list / storyboard failed-task` 这批高频 runtime 主链已经不再通过旧 query 实现；`useStoryboardGroupTaskErrors.ts` 这条失败任务查询链也已切到 renderer 自己的 `useTaskList / useDismissFailedTasks`。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 本轮 `node scripts/guards/renderer-query-bridge-guard.mjs`、`renderer-api-client-boundary-guard.mjs`、`renderer-auth-route-neutrality-guard.mjs`、`engine-auth-provider-boundary-guard.mjs` 已通过。
- 2026-03-26 19:35:00：继续推进 `renderer` 读链与轻量 operations bridge 去旧层化，完成 `project queries / task-target-states / SSE / run-stream` 的真实实现前移。
  - 新增 `packages/renderer/clients/run-client.ts` 与 `packages/renderer/hooks/run-stream/*`、`packages/renderer/hooks/useRendererRunStreamState.ts`，把 `run-stream` 状态机、恢复订阅、事件适配、快照和 `/api/runs*` transport 收回到 renderer；新增 `packages/renderer/modules/project-detail/novel-promotion/hooks/run-stream-active-run.ts`、`useStoryToScriptRunStream.ts`、`useScriptToStoryboardRunStream.ts`，并更新 `packages/renderer/clients/novel-promotion-runtime-client.ts` 增加 `requestStoryToScriptRun / requestScriptToStoryboardRun`。`useRendererNovelPromotionRuntimeHooks.ts` 已清掉最后两条旧 `run stream hook` 直连。
  - 更新 `packages/renderer/clients/project-client.ts`，补齐 `getNovelPromotionEpisode / getProjectAssets / getProjectCharacters / getProjectLocations / getUserModels`；重写 `packages/renderer/hooks/useRendererProjectQueries.ts`，现在 `useProjectData / useEpisodeData / useProjectAssets / useRefreshProjectAssets / useUserModels` 已是 renderer 自己的 `react-query` 实现，不再从旧 `@/lib/query/hooks` 重导出。
  - 更新 `packages/renderer/clients/task-client.ts` 增加 `fetchTaskTargetStates`，重写 `packages/renderer/hooks/useRendererTaskTargetStateMap.ts`；新增 `packages/renderer/clients/sse-client.ts`，重写 `packages/renderer/hooks/useRendererSse.ts`。现在 `task-target-states` 与 `SSE` 都已经是 renderer 自己的实现，不再包装旧 query hook。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations.ts`，本地实现 `useRefreshEpisodeData / useRefreshStoryboards / useSelectProjectPanelCandidate`；更新 `packages/renderer/modules/asset-hub/hooks/useAssetHubOperations.ts`，本地实现 `useRefreshGlobalAssets / useGenerateCharacterImage / useGenerateLocationImage`，并把 `useModifyCharacterImage / useModifyLocationImage` 切到 renderer 版 `useAssetHubMutations`。
  - 更新 `packages/renderer/modules/asset-hub/hooks/useAssetHubMutations.ts` 与 `useAssetHubOperations.ts`，把 `asset-hub-mutations-shared` 中仅用于失效的旧共享层内联回 renderer；当前 `packages/renderer` 中剩余对旧 query hooks 的依赖已只剩两个显式 operations bridge：`packages/renderer/modules/asset-hub/hooks/useAssetHubOperations.ts` 与 `packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations.ts`。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 本轮 `node scripts/guards/renderer-query-bridge-guard.mjs` 与 `renderer-api-client-boundary-guard.mjs` 已通过。
- 2026-03-26 18:45:00：继续推进 `renderer` 从旧 query hooks 脱离，完成最后两条 `run stream` 主链前移。
  - 新增 `packages/renderer/clients/run-client.ts`，把 `/api/runs`、`/api/runs/:id`、`/api/runs/:id/events`、`retry`、`cancel` 这批 transport 收口到 renderer client；新增 `packages/renderer/hooks/run-stream/*` 与 `packages/renderer/hooks/useRendererRunStreamState.ts`，把 `run-stream` 状态机、恢复订阅、事件适配、SSE 解析、快照与视图派生整体前移到 renderer。
  - 新增 `packages/renderer/modules/project-detail/novel-promotion/hooks/run-stream-active-run.ts`、`useStoryToScriptRunStream.ts`、`useScriptToStoryboardRunStream.ts`，并更新 `packages/renderer/clients/novel-promotion-runtime-client.ts` 增加 `requestStoryToScriptRun / requestScriptToStoryboardRun`；两条流式请求已改成通过 renderer client 注入执行函数，不再从 hook 层直写 `/api/*`。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionRuntimeHooks.ts`，把 `useStoryToScriptRunStream`、`useScriptToStoryboardRunStream` 从旧 `@/lib/query/hooks` 切到 renderer 本地实现；当前 `useRendererNovelPromotionRuntimeHooks.ts` 已不再直接依赖旧 query hooks。
  - 结果是：`packages/renderer` 的 `novel-promotion runtime bridge` 已清掉最后两条旧 `run stream hook` 直连；剩余 bridge 依赖已经收敛到更窄的 `task presentation / runtime query` 层，而不再是旧 query hook 本体。
- 本轮 `npx tsc --noEmit --pretty false --incremental false` 已通过。
- 本轮 `node scripts/guards/renderer-query-bridge-guard.mjs`、`renderer-api-client-boundary-guard.mjs`、`renderer-auth-route-neutrality-guard.mjs`、`engine-auth-provider-boundary-guard.mjs` 已通过。
- 2026-03-26 20:25:00：继续推进 `renderer operations bridge` 去旧层化，完成 `novel-promotion` 图片链与 `asset-hub` 卡片链的真实本地实现。
  - 更新 `packages/renderer/clients/novel-promotion-runtime-client.ts`，新增 `requestGenerateProjectCharacterImage / requestGenerateProjectLocationImage / requestUploadProjectCharacterImage / requestUploadProjectLocationImage / requestModifyProjectCharacterImage / requestModifyProjectLocationImage / requestSelectProjectCharacterImage / requestSelectProjectLocationImage / requestUndoProjectCharacterImage / requestUndoProjectLocationImage / requestAnalyzeProjectGlobalAssets / requestCopyProjectAssetFromGlobal / requestAiCreateProjectLocation / requestCreateProjectLocation / requestDeleteProjectCharacter / requestDeleteProjectAppearance / requestDeleteProjectLocation / requestUpdateProjectAppearanceDescription / requestUpdateProjectLocationDescription`，把 `assets` 高频操作所需 transport 收回到 renderer client。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations.ts`，本地实现 `generate / upload / modify / select / undo` 角色与场景图片，以及 `analyze-global / copy-from-global / ai-create-location / create-location / delete-character / delete-appearance / delete-location / update-appearance-description / update-location-description`；其中角色/场景选图与删除继续保留 `projectAssets + projectData` 的 optimistic patch 与回滚。
  - 更新 `packages/renderer/clients/asset-hub-client.ts`，新增 `requestSelectAssetHubCharacterImage / requestSelectAssetHubLocationImage / requestUndoAssetHubCharacterImage / requestUndoAssetHubLocationImage / requestUploadAssetHubCharacterImage / requestUploadAssetHubLocationImage / deleteAssetHubCharacter / deleteAssetHubLocation`，把 `asset-hub` 角色/场景卡片链 transport 收回到 renderer client。
  - 更新 `packages/renderer/modules/asset-hub/hooks/useAssetHubOperations.ts`，本地实现 `useSelectCharacterImage / useSelectLocationImage / useUndoCharacterImage / useUndoLocationImage / useUploadCharacterImage / useUploadLocationImage / useDeleteCharacter / useDeleteLocation`；继续保留 folder 级 `globalAssets.characters()/locations()` 多查询快照与 optimistic restore，不再依赖旧 `asset-hub` mutation 文件。
  - 使用 `rg` 校验，当前 `packages/renderer` 中对旧 `@/lib/query/hooks|mutations` 的直接依赖仍只剩两个显式 bridge 文件，但其主链高频操作已经大幅本地化；`desktop:build:web`、`renderer-query-bridge-guard.mjs`、`renderer-api-client-boundary-guard.mjs` 已通过。
- 2026-03-26 23:10:00：继续推进 `renderer operations bridge` 去旧层化，完成 `asset-hub` 剩余 operations 本地化，并将 `packages/renderer` 对旧 query 层的直接依赖清零。
  - 更新 `packages/renderer/clients/asset-hub-client.ts`，新增 `requestAiDesignAssetHubLocation / requestCreateAssetHubLocation / requestUpdateAssetHubCharacterName / requestUpdateAssetHubLocationName / requestUpdateAssetHubAssetLabel / requestUpdateAssetHubCharacterAppearanceDescription / requestUpdateAssetHubLocationSummary / requestAiModifyAssetHubCharacterDescription / requestAiModifyAssetHubLocationDescription / deleteAssetHubCharacterAppearance / deleteAssetHubVoice / requestDesignAssetHubVoice / requestSaveDesignedAssetHubVoice / requestUploadAssetHubVoice / requestUploadAssetHubCharacterVoice`，并补齐 `requestResolvedTask` 与统一错误构造逻辑。
  - 更新 `packages/renderer/modules/asset-hub/hooks/useAssetHubOperations.ts`，把剩余 `useDeleteCharacterAppearance / useDeleteVoice / useAiDesignLocation / useAiModifyCharacterDescription / useAiModifyLocationDescription / useCreateAssetHubLocation / useDesignAssetHubVoice / useSaveDesignedAssetHubVoice / useUpdateCharacterAppearanceDescription / useUpdateCharacterName / useUpdateLocationName / useUpdateLocationSummary / useUploadCharacterVoice / useUploadAssetHubVoice` 全部改为 renderer 本地 `useMutation`，并新增 `invalidateGlobalVoices()`。
  - 更新 `packages/renderer/clients/novel-promotion-runtime-client.ts`，新增 `requestConfirmProjectCharacterSelection / requestConfirmProjectCharacterProfile / requestConfirmProjectLocationSelection / requestUploadProjectCharacterVoice / requestUpdateProjectCharacterVoiceSettings / requestSaveProjectDesignedVoice / requestAnalyzeProjectShotVariants / requestBatchConfirmProjectCharacterProfiles / requestCreateProjectStoryboardGroup / requestMoveProjectStoryboardGroup / requestDeleteProjectStoryboardGroup / requestCreateProjectPanel / requestDeleteProjectPanel / requestUpdateProjectPanel / requestInsertProjectPanel / requestCreateProjectPanelVariant / requestClearProjectStoryboardError / requestDownloadProjectImages / requestRegenerateProjectPanelImage / requestModifyProjectStoryboardImage / requestRegenerateProjectStoryboardText / requestRegenerateProjectCharacterGroup / requestRegenerateProjectLocationGroup / requestRegenerateSingleProjectCharacterImage / requestRegenerateSingleProjectLocationImage`，把 `novel-promotion` 的确认、音色、panel/group CRUD 与 regenerate 主链 transport 收回到 renderer client。
  - 更新 `packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations.ts`，本地实现 `useConfirmProjectCharacterSelection / useConfirmProjectCharacterProfile / useConfirmProjectLocationSelection / useUploadProjectCharacterVoice / useUpdateProjectCharacterVoiceSettings / useSaveProjectDesignedVoice / useAnalyzeProjectShotVariants / useBatchConfirmProjectCharacterProfiles / useCreateProjectStoryboardGroup / useCreateProjectPanel / useCreateProjectPanelVariant / useDeleteProjectPanel / useDeleteProjectStoryboardGroup / useMoveProjectStoryboardGroup / useInsertProjectPanel / useUpdateProjectPanel / useClearProjectStoryboardError / useDownloadProjectImages / useModifyProjectStoryboardImage / useRegenerateCharacterGroup / useRegenerateLocationGroup / useRegenerateProjectPanelImage / useRegenerateProjectStoryboardText / useRegenerateSingleCharacterImage / useRegenerateSingleLocationImage`，并继续保留 overlay 与 invalidate 行为。
  - 使用 `rg -n "@/lib/query/hooks|@/lib/query/mutations" "packages/renderer"` 校验，`packages/renderer` 中对旧 query 层的直接依赖已降为 0；`desktop:build:web`、`renderer-query-bridge-guard.mjs`、`renderer-api-client-boundary-guard.mjs` 均通过，构建仅剩旧树 warning 与 bullmq 动态依赖 warning。
- 2026-03-26 23:40:00：继续推进 `renderer clients` 的 transport contract 收口，把原始 `/api/*` 字面量集中到共享 route contract。
  - 新增 `packages/shared/contracts/renderer-api-routes.ts`，统一提供 `authRoutes / projectRoutes / apiConfigRoutes / assetHubRoutes / novelPromotionRoutes / runRoutes / taskRoutes / sseRoutes` 和 `withQuery()`；后续切 `engine` 稳定入口时只需要改这一层。
  - 更新 `packages/renderer/clients/project-client.ts`、`auth-client.ts`、`api-config-client.ts`、`asset-hub-client.ts`、`novel-promotion-runtime-client.ts`、`run-client.ts`、`task-client.ts`、`sse-client.ts`，这 8 个 client 已全部改成从 `@shared/contracts/renderer-api-routes` 取路由，不再各自拼 `/api/*`。
  - 新增 `scripts/guards/renderer-client-route-contract-guard.mjs`，并在 `package.json` 中接入 `check:renderer-client-route-contract` 与 `test:guards`；现在 `packages/renderer/clients` 内如果重新写原始 `/api/*`，会直接被 guard 拦下。
  - 使用 `rg -n '/api/' "packages/renderer/clients"` 校验，当前 `clients/*` 原始 `/api/*` 路由字面量已清零；`renderer-client-route-contract-guard.mjs`、`renderer-api-client-boundary-guard.mjs`、`renderer-query-bridge-guard.mjs` 均通过。
  - `npm run desktop:build:web` 已通过，未引入新的构建阻断；当前桌面主链的 transport 字面量已经集中到共享 contract，为下一步把 `renderer clients` 继续切到 `engine` 稳定入口打好了接口层基础。
- 2026-03-26 23:58:00：继续推进认证主链收口，完成 `next-auth` 运行时代码退场与本地 provider 固化。
  - 更新 `packages/engine/services/next-auth-bridge-service.ts`，把原 `NextAuth / PrismaAdapter / CredentialsProvider / getServerSession` 实现整体替换成废弃占位模块；当前该文件不再 import `next-auth` 或 `@next-auth/prisma-adapter`，只保留显式 `NEXT_AUTH_BRIDGE_REMOVED` 失败信号，防止旧路径被静默恢复。
  - 更新 `src/types/next-auth.d.ts`，移除历史 `next-auth` 类型扩展，改成迁移占位文件；当前仓库中的 `next-auth` 代码引用已从运行主链退出，只剩依赖元数据与历史兼容 route。
  - 更新 `scripts/guards/engine-auth-provider-boundary-guard.mjs`，约束从“只有 bridge 可以直接 import next-auth”进一步提升为“`packages/engine` 与 `src/app/api/auth` 中完全禁止直接 import next-auth / bridge”；`node scripts/guards/engine-auth-provider-boundary-guard.mjs` 已通过。
  - 使用 `rg -n "next-auth|@next-auth/prisma-adapter" "packages" "src" "scripts"` 校验，当前代码侧只剩 guard 文本、迁移占位注释和依赖元数据，认证运行时代码已不再直接绑定 `next-auth`。
- 2026-03-27 00:06:00：继续推进桌面主运行链分层，把 `desktop/main.cjs` 收成 Electron 壳层，并抽出 `Web runtime adapter`。
  - 新增 `desktop/runtime/managed-web-runtime.cjs`，承接运行时目录准备、环境文件写入、子进程托管、启动等待与关闭清理；`desktop/main.cjs` 当前只保留 Electron 单实例、窗口创建、启动编排和异常兜底。
  - 新增 `desktop/runtime/next-runtime-adapter.cjs`，把 `Next + Prisma + /api/system/boot-id` 相关实现集中到可替换 adapter，包括安装包依赖校验、Prisma client 准备、`db push`、`next start` 和健康检查；后续替换成本地 engine 时只需要改这层 adapter，而不是再改 Electron 壳。
  - 更新 `desktop/main.cjs`，现在通过 `resolveRuntimeAppRoot(app)`、`buildDesktopRuntime(app, appRoot)`、`startManagedRuntime({ app, dialog, runtime })` 组装启动过程，不再直接持有 `spawn / prisma / next / boot-id` 细节。
  - 使用 `node -e "require('./desktop/runtime/next-runtime-adapter.cjs'); require('./desktop/runtime/managed-web-runtime.cjs')"` 校验新模块语法，`npm run desktop:build:web` 也已通过；当前未引入新的构建阻断，仅保留既有 lint warning 和 bullmq dynamic dependency warning。
- 2026-03-27 00:12:00：继续推进桌面 runtime 可替换化，把 `managed-web-runtime` 从硬编码 `Next adapter` 改成入口注入。
  - 更新 `desktop/runtime/managed-web-runtime.cjs`，`startManagedRuntime` 现在通过 `adapter.ensurePackagedRuntimeDependencies / smokeTestPackagedRuntimeDependencies / ensureRuntimeReady / startRuntime / waitForRuntimeReady` 这组中性接口编排启动流程，不再直接 import `next-runtime-adapter`。
  - 更新 `desktop/runtime/next-runtime-adapter.cjs`，统一导出 `ensurePackagedRuntimeDependencies / smokeTestPackagedRuntimeDependencies / ensureRuntimeReady / startRuntime / waitForRuntimeReady`；当前 `Next + Prisma` 只是一个具体 adapter 实现。
  - 更新 `desktop/main.cjs`，显式注入 `adapter: nextRuntimeAdapter`；后续切本地 engine 或 IPC runtime 时，只需要在入口替换 adapter，不需要改 `managed-web-runtime` 的编排壳。
  - 使用 `node -e "const adapter=require('./desktop/runtime/next-runtime-adapter.cjs'); const runtime=require('./desktop/runtime/managed-web-runtime.cjs')"` 校验 adapter 注入装配，`engine-auth-provider-boundary-guard.mjs` 也继续通过。
- 2026-03-27 00:20:00：继续推进桌面验证脚本的认证中性化，完成旧 `next-auth` 登录路径与环境变量退出脚本主链。
  - 更新 `scripts/desktop/smoke-test.mjs`、`verify-copy-from-global.mjs`、`verify-download-routes.mjs`、`verify-final-heavy-routes.mjs`、`verify-generation-task-routes.mjs`、`verify-light-submit-routes.mjs`、`verify-modify-image-submit-routes.mjs`、`verify-update-routes.mjs`，将登录入口统一改成 `/api/auth/login?json=true`，不再调用 `/api/auth/callback/credentials`。
  - 上述桌面验证脚本中的运行环境变量已统一改成 `APP_BASE_URL / AUTH_SESSION_SECRET`，并清掉 `NEXTAUTH_URL / NEXTAUTH_SECRET / nextAuthSecret` 旧命名，避免脚本继续把兼容语义钉回主链。
  - 新增 `scripts/guards/desktop-auth-neutrality-guard.mjs`，限制 `scripts/desktop` 不得再出现旧 callback/signout 路径和 `NEXTAUTH_*` 变量；更新 `package.json`，新增 `check:desktop-auth-neutrality` 并接入 `test:guards`。
  - `node scripts/guards/desktop-auth-neutrality-guard.mjs` 与 `npm run desktop:build:web` 已通过；当前旧认证路径在代码主链、renderer 主链和桌面验证链上都已退出，只剩兼容 route 本身仍保留。
- 2026-03-27 00:34:00：继续推进 `engine/auth` 的兼容边界收缩，把 `[...nextauth]` catch-all 从 provider 主链中拆离。
  - 新增 `packages/engine/services/auth-compat-route-service.ts`，将遗留的 `session / csrf / callback/credentials / signout` catch-all 路径统一集中到兼容服务，并为所有兼容响应加上 `Deprecation / Sunset / Link / X-Auth-Compat-Route` 标头，明确后继中性入口分别是 `/api/auth/session`、`/api/auth/csrf`、`/api/auth/login`、`/api/auth/logout`。
  - 更新 `src/app/api/auth/[...nextauth]/route.ts`，当前只转发 `handleAuthCompatGetRequest / handleAuthCompatPostRequest`；更新 `packages/engine/services/auth-provider-service.ts`，删除对 `nextauth` catch-all 参数解析与 `callback/signout` 兼容分支，provider service 只保留中性的 `session / csrf / login / logout` 入口。
  - 新增 `scripts/guards/engine-auth-compat-route-boundary-guard.mjs`，限制只有 `src/app/api/auth/[...nextauth]/route.ts` 能 import `@engine/services/auth-compat-route-service`；更新 `package.json`，新增 `check:engine-auth-compat-route-boundary` 并接入 `test:guards`。
  - `node scripts/guards/engine-auth-provider-boundary-guard.mjs`、`node scripts/guards/engine-auth-compat-route-boundary-guard.mjs` 与 `npm run desktop:build:web` 已通过；当前 `auth-provider-service` 已彻底退出遗留 `nextauth` 路由语义，`[...nextauth]` 降级成单一兼容壳。
- 2026-03-27 00:39:00：继续推进 `desktop runtime adapter` 可替换化，把通用 `Prisma` 预检与 HTTP 启动支撑从 `next-runtime-adapter` 中拆离。
  - 新增 `desktop/runtime/prisma-runtime-support.cjs`，集中 `@prisma/client` 依赖校验、packaged smoke test、开发态 `prisma generate`、`prisma db push` 这组 SQLite/Prisma 运行时预检；更新 `desktop/runtime/next-runtime-adapter.cjs`，当前只复用这层支撑，不再自己持有完整 Prisma 初始化实现。
  - 新增 `desktop/runtime/http-runtime-support.cjs`，集中 `startNodeHttpRuntime / waitForHttpRuntimeReady` 两个通用 HTTP 运行时辅助；更新 `desktop/runtime/next-runtime-adapter.cjs`，把 `next start` 与健康检查组装成纯 Next-specific 参数，不再自己拼 Node 进程启动壳。
  - 结果是：`desktop/runtime/managed-web-runtime.cjs` 负责编排，`desktop/runtime/http-runtime-support.cjs` 负责通用 HTTP 运行时壳，`desktop/runtime/prisma-runtime-support.cjs` 负责 Prisma 预检，`desktop/runtime/next-runtime-adapter.cjs` 只剩 Next-specific 依赖与启动参数；后续切本地 engine adapter 时可以直接复用前两层支撑。
  - `node -e "require('./desktop/runtime/http-runtime-support.cjs'); require('./desktop/runtime/prisma-runtime-support.cjs'); require('./desktop/runtime/next-runtime-adapter.cjs')"` 与 `npm run desktop:build:web` 已通过。
- 2026-03-27 00:48:00：继续推进 desktop runtime adapter 的可替换化，新增 adapter registry 与 Next-specific support 层。
  - 新增 `desktop/runtime/next-http-runtime-support.cjs`，集中 `next start` 的依赖校验、packaged smoke test、启动参数与 `/api/system/boot-id` 健康检查；更新 `desktop/runtime/next-runtime-adapter.cjs`，当前只再组合 `next-http-runtime-support + prisma-runtime-support` 两层支撑。
  - 新增 `desktop/runtime/runtime-adapter-registry.cjs`，`desktop/main.cjs` 已改成通过 `resolveRuntimeAdapter()` 选择当前 adapter，不再直接 import `next-runtime-adapter.cjs`；后续切本地 engine adapter 时只需要注册新实现并切换 registry。
  - 新增 `scripts/guards/desktop-runtime-adapter-registry-guard.mjs`，并接入 `package.json` 的 `check:desktop-runtime-adapter-registry` 与 `test:guards`，防止 Electron 主入口重新绑定具体 adapter。
  - `node scripts/guards/desktop-runtime-adapter-registry-guard.mjs` 与 `npm run desktop:build:web` 已通过。
- 2026-03-27 01:02:00：继续推进基础设施 API 下沉，把桌面 runtime 高频依赖的公共路由迁入 `packages/engine/services`。
  - 新增 `packages/engine/services/runtime-health-route-service.ts`、`local-file-route-service.ts`、`storage-sign-route-service.ts`、`cos-image-route-service.ts`，并更新 `src/app/api/system/boot-id/route.ts`、`src/app/api/files/[...path]/route.ts`、`src/app/api/storage/sign/route.ts`、`src/app/api/cos/image/route.ts`；这批基础端点已退成薄 HTTP 壳。
  - 新增 `packages/engine/services/task-route-service.ts`、`run-route-service.ts`、`task-target-state-route-service.ts`、`sse-route-service.ts`，并更新 `src/app/api/tasks/route.ts`、`tasks/[taskId]/route.ts`、`tasks/dismiss/route.ts`、`runs/route.ts`、`runs/[runId]/route.ts`、`runs/[runId]/cancel/route.ts`、`runs/[runId]/events/route.ts`、`task-target-states/route.ts`、`sse/route.ts`；`tasks / runs / sse / task-target-states` 这组 desktop runtime 与 renderer 高频基础设施路由已把核心编排迁入 engine services。
  - 结果是：`src/app/api` 中与 desktop runtime 直接相关的基础端点已经不再持有主要业务编排逻辑，为下一步把 adapter 指向本地 engine 服务留出了更直接的复用面。
  - 本轮多次 `npm run desktop:build:web` 均已通过，未引入新的构建阻断；当前仍只保留既有 lint warning 与 bullmq 动态依赖 warning。
- 2026-03-27 01:18:00：继续推进 `projects / user` 高频 API 下沉，把项目与用户设置类 route 压成薄壳。
  - 新增 `packages/engine/services/project-route-service.ts`，集中 `projects` 相关 HTTP 编排：项目列表、创建、详情、更新、删除、完整数据、资产延迟加载、费用详情；更新 `src/app/api/projects/route.ts`、`projects/[projectId]/route.ts`、`projects/[projectId]/data/route.ts`、`projects/[projectId]/assets/route.ts`、`projects/[projectId]/costs/route.ts`，这些 route 已退成参数转发壳层。
  - 新增 `packages/engine/services/user-settings-route-service.ts`，集中 `user/models` 与 `user-preference` 的鉴权和响应编排；更新 `src/app/api/user/models/route.ts` 与 `src/app/api/user-preference/route.ts`，两者已不再直接持有 `requireUserAuth + NextResponse` 逻辑。
  - 结果是：桌面 runtime 和 renderer 高频读取的 `projects / user models / user preference` 这组 API，已经和前一轮 `tasks / runs / sse` 一样具备 engine service 复用面，后续本地 engine adapter 可以直接挂这些 service，而不是继续复用 `src/app/api` 中的旧实现。
- 2026-03-27 01:33:00：继续推进 profile 侧高频 API 下沉，把 `api-config` 与 `billing` 相关 route 压成薄壳。
  - 新增 `packages/engine/services/user-api-config-route-service.ts`，集中 `user/api-config` 的获取、保存、连接测试、provider 测试、LLM 协议探测、媒体模板探测与模板校验；更新 `src/app/api/user/api-config/route.ts`、`test-connection/route.ts`、`test-provider/route.ts`、`probe-model-llm-protocol/route.ts`、`assistant/probe-media-template/route.ts`、`assistant/validate-media-template/route.ts`，这些 route 已退成单一 service 转发。
  - 新增 `packages/engine/services/user-billing-route-service.ts`，集中 `user/balance`、`user/costs`、`user/costs/details`、`user/transactions` 的 billing feature guard、鉴权、分页参数与响应编排；对应 `src/app/api/user/*` 路由已不再直接持有 `requireUserAuth / NextResponse / billing` 逻辑。
  - 结果是：profile 页面高频依赖的 `api-config + billing` 这组 API，已和 `projects / tasks / runs / sse` 一样进入 `engine/services` 主链，后续若切本地 engine adapter，可直接复用这些中性 route service，而不是继续依赖 `src/app/api` 内的旧实现。
- 2026-03-27 01:48:00：继续推进 `asset-hub` 路由下沉，把剩余媒体与管理类 route 压成薄壳。
  - 更新 `packages/engine/services/asset-hub-route-service.ts`，新增 `appearances / nested appearances / select-image` 相关 handler，并把 `voices / picker / update-asset-label / generate-image / modify-image / voice-design / ai-modify / ai-design` 这批 route 全部接到统一 route service。
  - 新增 `packages/engine/services/asset-hub-media-route-service.ts`，集中承接 `character-voice / upload-temp / upload-image / undo-image / reference-to-character` 的鉴权、存储上传、任务提交和 Prisma 编排。
  - 更新 `src/app/api/asset-hub/appearances/route.ts`、`character-voice/route.ts`、`select-image/route.ts`、`undo-image/route.ts`、`upload-temp/route.ts`、`reference-to-character/route.ts`、`upload-image/route.ts`、`voices/route.ts`、`voices/[id]/route.ts`、`voices/upload/route.ts`、`picker/route.ts`、`update-asset-label/route.ts`、`generate-image/route.ts`、`modify-image/route.ts`、`voice-design/route.ts`、`ai-modify-character/route.ts`、`ai-modify-location/route.ts`、`ai-design-character/route.ts`、`ai-design-location/route.ts`、`characters/[characterId]/appearances/[appearanceIndex]/route.ts`，这些 route 现已退成单一 service 转发壳。
  - 结果是：`src/app/api/asset-hub` 当前已清掉直接 `requireUserAuth / prisma / maybeSubmitLLMTask / NextResponse.json` 的业务编排，后续本地 engine adapter 可以直接复用 `asset-hub-route-service + asset-hub-media-route-service` 两层稳定入口。
- 2026-03-27 02:02:00：继续推进 `novel-promotion` task-submit 路由下沉，把图片、音色、视频与分镜任务提交类 route 压成薄壳。
  - 新增 `packages/engine/services/novel-promotion-task-route-service.ts`，集中承接 `generate-image / generate-character-image / modify-asset-image / modify-storyboard-image / regenerate-group / regenerate-single-image / regenerate-panel-image / regenerate-storyboard-text / insert-panel / voice-design / voice-generate / lip-sync / generate-video / panel-variant` 这批任务提交入口的鉴权、locale 解析、requestId 注入和响应编排。
  - 更新 `src/app/api/novel-promotion/[projectId]/generate-image/route.ts`、`generate-character-image/route.ts`、`modify-asset-image/route.ts`、`modify-storyboard-image/route.ts`、`regenerate-group/route.ts`、`regenerate-single-image/route.ts`、`regenerate-panel-image/route.ts`、`regenerate-storyboard-text/route.ts`、`insert-panel/route.ts`、`voice-design/route.ts`、`voice-generate/route.ts`、`lip-sync/route.ts`、`generate-video/route.ts`、`panel-variant/route.ts`，这些 route 已退成单一 service 转发壳。
  - 结果是：`novel-promotion` 的高频任务提交链已经不再把 `resolveRequiredTaskLocale / submitNovelPromotion* / NextResponse.json` 逻辑留在 `src/app/api`，后续本地 engine adapter 可以直接挂 `novel-promotion-task-route-service.ts`。
- 2026-03-27 02:14:00：继续推进 `novel-promotion` LLM task-submit 路由下沉，把剩余 `maybeSubmitLLMTask` 主链压成薄壳。
  - 新增 `packages/engine/services/novel-promotion-llm-route-service.ts`，集中承接 `ai-create-character / ai-create-location / ai-modify-appearance / ai-modify-location / ai-modify-shot-prompt / analyze / analyze-global / analyze-shot-variants / character-profile confirm / batch-confirm / clips / episodes split / screenplay-conversion / script-to-storyboard-stream / reference-to-character / story-to-script-stream / voice-analyze` 的鉴权、参数校验、任务去重和 `maybeSubmitLLMTask` 编排。
  - 更新 `src/app/api/novel-promotion/[projectId]/ai-create-character/route.ts`、`ai-create-location/route.ts`、`ai-modify-appearance/route.ts`、`ai-modify-location/route.ts`、`ai-modify-shot-prompt/route.ts`、`analyze/route.ts`、`analyze-global/route.ts`、`analyze-shot-variants/route.ts`、`character-profile/confirm/route.ts`、`character-profile/batch-confirm/route.ts`、`clips/route.ts`、`episodes/split/route.ts`、`screenplay-conversion/route.ts`、`script-to-storyboard-stream/route.ts`、`reference-to-character/route.ts`、`story-to-script-stream/route.ts`、`voice-analyze/route.ts`，这些 route 现已退成 `apiHandler + service` 壳层；流式路由继续保留 `nodejs runtime` 声明。
  - 结果是：`src/app/api/novel-promotion/[projectId]` 中这批 LLM 提交路由已经清掉直接 `maybeSubmitLLMTask / TASK_TYPE / createHash / getProjectModelConfig / requireProjectAuth*` 业务编排，`novel-promotion` 的主任务提交链已经基本进入 `packages/engine/services`。
- 2026-03-27 02:42:00：继续推进 `novel-promotion` 非任务型高频 CRUD 路由下沉，把 `project/assets/episodes/storyboards/editor/panel/group` 压成薄壳。
  - 新增 `packages/engine/services/novel-promotion-route-service.ts`，集中承接 `project config/assets`、`episodes`、`storyboards`、`editor`、`storyboard-group`、`panel` 这批 route 的鉴权、查询参数解析、基础参数校验与 `NextResponse` 编排。
  - 更新 `src/app/api/novel-promotion/[projectId]/route.ts`、`assets/route.ts`、`episodes/route.ts`、`episodes/[episodeId]/route.ts`、`storyboards/route.ts`、`editor/route.ts`、`storyboard-group/route.ts`、`panel/route.ts`，这些 route 已退成 `apiHandler + service` 壳层，不再直接持有 `requireProjectAuth* / NextResponse.json / ApiError / getNovelPromotion* / createNovelPromotion* / updateNovelPromotion* / deleteNovelPromotion*` 编排逻辑。
  - 本轮 `desktop:build:web` 已通过；结果是 `novel-promotion` 非任务型主链中最常用的一批读取与编辑入口已经进入 `packages/engine/services` 主链，后续可以继续沿同一模式收 `character/location/voice/download` 余量路由。
- 2026-03-27 03:08:00：继续推进 `novel-promotion` 剩余高频 CRUD 与媒体 route 下沉，把 `character/location/voice/download/light-edit` 及尾部媒体路由压成薄壳。
  - 扩展 `packages/engine/services/novel-promotion-route-service.ts`，新增 `character / character appearance / character confirm-selection / location / location confirm-selection / select-character-image / select-location-image / update-appearance / update-location / update-asset-label / upload-asset-image / copy-from-global / character-voice / voice-lines / speaker-voice / download-images / download-videos / download-voices / video-urls / clips/[clipId] / panel-link / photography-plan / episodes/batch / episodes/split-by-markers` 这批 handler，集中承接鉴权、参数收窄、FormData 解析与 `NextResponse` 编排。
  - 更新对应 `src/app/api/novel-promotion/[projectId]/**/route.ts`，上述 route 已全部退成 `apiHandler + service` 薄壳，不再直接持有 `requireProjectAuth* / ApiError / NextResponse` 的业务编排。
  - 新增 `packages/engine/services/novel-promotion-media-route-service.ts`，集中承接 `panel/select-candidate / update-prompt / cleanup-unselected-images / video-proxy / undo-regenerate` 这批尾部媒体路由；对应 route 已全部切到新的 media route service。
  - 连续两次 `npm run desktop:build:web` 已通过；当前 `src/app/api/novel-promotion/[projectId]` 主链中，剩余厚路由已经显著收敛。
- 2026-03-27 03:26:00：继续推进 `src/app/api` 主链薄壳化，清零 route 层直接鉴权/Prisma/任务编排，并新增薄壳 guard 固化边界。
  - 新增 `packages/engine/services/admin-log-route-service.ts`、`packages/engine/services/assistant-chat-route-service.ts`，并扩展 `packages/engine/services/run-route-service.ts` 增加 `handleRetryRunStepRequest`；`src/app/api/admin/download-logs/route.ts`、`src/app/api/user/assistant/chat/route.ts`、`src/app/api/runs/[runId]/steps/[stepKey]/retry/route.ts` 已退成单一 service 转发壳。
  - 新增 `scripts/guards/app-api-route-thinness-guard.mjs`，约束 `src/app/api` 只能依赖 `*route-service`、`*media-route-service`、`auth-provider-service` 这类稳定入口，禁止 route 再直接触碰 `@engine/api-auth`、`prisma`、`maybeSubmitLLMTask`、存储/任务/assistant/logging` 实现；已接入 `package.json` 的 `check:app-api-route-thinness` 与 `test:guards`。
  - 使用 `rg -l "require(Project|User)Auth|isErrorResponse|maybeSubmitLLMTask|prisma|deleteObject|getSignedUrl|toFetchableUrl" "src/app/api"` 校验，当前 `src/app/api` 中这类直接业务编排命中已降为 0；`desktop:build:web` 与 `app-api-route-thinness-guard` 已通过。
- 2026-03-27 18:40:00：继续推进 `engine/services` 与桌面 runtime 终态，完成 `api-errors` 中性化与本地 engine adapter 主路径切换。
  - 更新 `src/lib/api-errors.ts`，删除 `NextResponse` 运行时依赖，统一改用标准 `Response`，并把 `req.nextUrl` 读取改成 `new URL(req.url)`；`apiHandler` 现在不再要求 Next 运行时对象即可完成 requestId、内部流式任务事件、审计与错误响应编排。
  - 新增 `desktop/runtime/route-module-dispatcher.cjs`，基于 `.next/server/app-paths-manifest.json` 构建 `/api/*` 路由匹配器，运行时按需加载编译后的 `routeModule.userland`，并用标准 `Request/Response` 在 Node HTTP server 中直接分发 API route。
  - 新增 `desktop/runtime/engine-runtime-server.cjs`，以自定义 Node HTTP server 承接 `/api/*`，其余页面请求委托给 Next programmatic handler；新增 `desktop/runtime/engine-runtime-adapter.cjs`，复用 `http-runtime-support + prisma-runtime-support` 启动本地 engine runtime，不再通过 `next start` CLI 起服务。
  - 更新 `desktop/runtime/runtime-adapter-registry.cjs`，注册 `engine` adapter 并改成默认值；更新 `scripts/guards/desktop-runtime-adapter-registry-guard.mjs`，新增约束：registry 必须默认 `engine`，且 `engine-runtime-adapter.cjs` 必须指向 `engine-runtime-server.cjs`，禁止重新依赖 `next-http-runtime-support` 或退回 `next start` 语义。
  - `npm run desktop:build:web`、`node scripts/guards/desktop-runtime-adapter-registry-guard.mjs`、`node scripts/guards/app-api-route-thinness-guard.mjs`、`node scripts/guards/engine-auth-provider-boundary-guard.mjs` 均已通过；额外用临时 SQLite/本地上传目录起 `engine-runtime-server.cjs` 做了烟测，`GET /api/system/boot-id` 已返回 200，说明新的本地 engine runtime 主路径可以实际对外服务。
- 2026-03-27 19:05:00：继续推进 `src/app/api` 的 Next 类型退场，清零 route 层 `NextRequest / next/server` 依赖。
  - 对 `src/app/api` 下仍残留 `NextRequest` 注解的薄壳 route 做了机械收口，统一改用标准 `Request`，并删除对应 `import { NextRequest } from 'next/server'`；当前 `rg -n "NextResponse|next/server" "src/app/api"` 命中为 0。
  - 同步更新 `src/lib/api-errors.ts`，移除最后一个 `NextRequest` 类型依赖；现在 `apiHandler`、`getIdempotencyKey`、`extractRouteContext` 等主链已全部基于标准 `Request/Response + new URL(req.url)`。
  - `npm run desktop:build:web`、`node scripts/guards/app-api-route-thinness-guard.mjs`、`node scripts/guards/desktop-runtime-adapter-registry-guard.mjs` 已再次通过；当前 `src/app/api` 这一层已经连类型壳都不再依赖 `next/server`，为后续直接脱离 Next route runtime 做好了最后一层准备。
- 2026-03-27 19:18:00：新增 `scripts/guards/app-api-next-runtime-zero-guard.mjs` 并接入 `package.json` 的 `check:app-api-next-runtime-zero` 与 `test:guards`，固定 `src/app/api + src/lib/api-errors.ts` 不得再出现 `next/server`、`NextRequest`、`NextResponse`、`nextUrl` 依赖；guard 已通过。
- 2026-03-27 19:32:00：继续缩小桌面内 Next handler 责任面，`route-module-dispatcher` 已从 `/api/*` 扩展到 `/m/*`。
  - 更新 `desktop/runtime/route-module-dispatcher.cjs`，新增 `DISPATCHED_ROUTE_PREFIXES = ['/api/', '/m/']`，构建期产物中的媒体公开路由 `/m/[publicId]` 现在也会由本地 dispatcher 直接加载编译后的 route module 处理。
  - 结果是：`engine-runtime-server.cjs` 中由 Next programmatic handler 负责的范围进一步收缩，当前主要只剩页面渲染，而 API 与媒体下载/跳转类 route 已统一走本地 Node dispatcher。
- 2026-03-27 21:05:00：继续打通桌面 engine runtime 的页面直出，补齐 `App Router + next-intl` 对页面请求上下文的要求。
  - 更新 `desktop/runtime/page-module-dispatcher.cjs`，在调用编译后的 `app/[locale]/page.js` handler 前，统一注入 `initURL / initQuery / initProtocol / relativeProjectDir / distDir / query / params / invokePath / invokeQuery / rewroteURL / locale` 这组 Next request meta，并同步补写 `x-next-intl-locale` 请求头；同时将 `originalRequest / originalResponse` 显式回指到原始 Node `req/res`，让页面 handler 运行时环境与 Next 原生路径保持一致。
  - 用最小 HTTP server 直接调用 `.next/server/app/[locale]/page.js` 做了对照验证：裸请求会在 `app-page.runtime.prod.js` 抛 `Cannot read properties of undefined (reading 'startsWith')`，补齐 request meta 后 404，再补 `x-next-intl-locale` 后 `/zh` 返回 200 且输出 `<html lang=\"zh\">`；说明页面 render 主阻塞已经从 direct handler 路径消除。
  - 进一步以真实 `desktop/runtime/engine-runtime-server.cjs` 起服务做烟测，`GET /api/system/boot-id` 与 `GET /zh` 同时返回 200，桌面本地 engine runtime 现在已经能在不经过 `next start` 的情况下完成 API 与页面直出。
  - 更新 `scripts/desktop/smoke-test.mjs`，新增 `verifyLandingPage(baseUrl, locale)`，把 `/${locale}` 的 HTML 响应与 `<html lang=\"${locale}\">` 校验纳入桌面 smoke，防止后续 adapter/locale 改动再次打坏页面直出链。
- 2026-03-27 21:34:00：继续压缩旧 `src/app` 的 `novel-promotion` 兼容树，把顶层入口固定成 renderer 薄转发壳。
  - 更新 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/NovelPromotionWorkspace.tsx`、`StageNavigation.tsx`、`WorkspaceProvider.tsx`、`types.ts`，旧根文件已全部改成对 `packages/renderer/modules/project-detail/novel-promotion/*` 的直接 re-export，不再承载任何业务实现、翻译或 query/SSE 逻辑。
  - 新增 `scripts/guards/legacy-novel-promotion-root-shell-guard.mjs`，精确约束上述 4 个文件只能保持为 renderer 薄转发壳；更新 `package.json`，新增 `check:legacy-novel-promotion-root-shell` 并接入 `test:guards`，防止实现回流到旧树。
  - `node scripts/guards/legacy-novel-promotion-root-shell-guard.mjs`、`node scripts/guards/legacy-novel-promotion-boundary-guard.mjs` 与 `npm run desktop:build:web` 已通过；当前旧 `src/app` 的 `novel-promotion` 兼容树已经从“根入口仍含实现”收敛到“根入口只保留兼容壳”。
- 2026-03-27 21:46:00：继续清理认证遗留元数据，完成 `next-auth` 锁文件退场。
  - 更新 `pnpm-lock.yaml`，删除 `@next-auth/prisma-adapter`、`next-auth` 的 importer 依赖条目和对应 package block；现在 `package.json / package-lock.json / pnpm-lock.yaml` 中都已不再保留 `next-auth` 或 `@next-auth/prisma-adapter`。
  - 使用 `rg -n "next-auth|@next-auth/prisma-adapter" package.json package-lock.json pnpm-lock.yaml` 校验，当前命中已清零；代码侧只剩 `src/types/next-auth.d.ts` 与 `packages/engine/services/next-auth-bridge-service.ts` 里的迁移注释文本，不再有运行时或依赖元数据残留。
- 2026-03-27 22:08:00：继续压缩旧 `src/app` 的 `novel-promotion` 兼容树，把阶段级入口组件批量收成 renderer 壳。
  - 更新 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/AssetLibrary.tsx`、`AssetsStage.tsx`、`ConfigStage.tsx`、`NovelInputStage.tsx`、`PanelEditForm.tsx`、`PromptsStage.tsx`、`ScriptStage.tsx`、`ScriptView.tsx`、`SmartImportWizard.tsx`、`StoryboardStage.tsx`、`VideoStage.tsx`、`VideoStageRoute.tsx`、`VoiceStage.tsx`、`VoiceStageRoute.tsx`，这批阶段级/舞台级入口已统一改成对 `packages/renderer/modules/project-detail/novel-promotion/components/*` 的 compat shell。
  - 旧树里为适配新 `renderer` 签名，仅保留了最小必要的调用面修正：`storyboard/index.tsx` 已补 `CharacterPickerModal / LocationPickerModal` 的显式 `labels`；`storyboard` 相关旧文件中的 `PanelEditData` 导入已统一改成 `import type`，不再要求 compat shell 伪造值导出。
  - 新增 `scripts/guards/legacy-novel-promotion-stage-shell-guard.mjs`，并在 `package.json` 中接入 `check:legacy-novel-promotion-stage-shell` 与 `test:guards`；该 guard 用于固定上述 14 个阶段入口只能保持为 renderer 薄转发壳，防止旧实现回流。
  - `legacy-novel-promotion-boundary-guard`、`legacy-novel-promotion-root-shell-guard`、`legacy-novel-promotion-stage-shell-guard` 与 `desktop:build:web` 已通过；当前旧 `src/app` 的 `novel-promotion` 兼容树已从“只有 4 个根入口是壳”推进到“根入口 + 阶段入口”都已空心化。
- 2026-03-27 22:26:00：继续压缩旧 `src/app` 的 `novel-promotion` workspace 级兼容入口，把 header/runtime/console 这一层也收成 renderer 壳。
  - 更新 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/WorkspaceTopActions.tsx`、`WorkspaceStageContent.tsx`、`WorkspaceRunStreamConsoles.tsx`、`WorkspaceAssetLibraryModal.tsx`、`WorkspaceHeaderShell.tsx`，以及 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/WorkspaceStageRuntimeContext.tsx`，这些 workspace 级入口已统一改成对 `packages/renderer/modules/project-detail/novel-promotion/*` 的 compat shell。
  - 为保持旧树类型检查通过，本轮继续补了最小兼容修正：`storyboard/index.tsx` 中 `CharacterPickerModal / LocationPickerModal` 已对齐新 labels 契约；`PanelEditForm.tsx` 的 compat shell 已补 `PanelEditData / CharacterPickerModalLabels / LocationPickerModalLabels` 类型转发；旧 storyboard 文件中的 `PanelEditData` 值导入已统一收敛为类型导入。
  - 新增 `scripts/guards/legacy-novel-promotion-workspace-shell-guard.mjs`，并在 `package.json` 中接入 `check:legacy-novel-promotion-workspace-shell` 与 `test:guards`；当前 root/stage/workspace 三层 compat shell 都已有独立 guard 固化。
  - `legacy-novel-promotion-boundary-guard`、`legacy-novel-promotion-root-shell-guard`、`legacy-novel-promotion-stage-shell-guard`、`legacy-novel-promotion-workspace-shell-guard` 与 `desktop:build:web` 已通过；旧 `src/app` 的 `novel-promotion` 兼容树又空心化了一层。
- 2026-03-28 00:10:43：继续压缩旧 `src/app` 的 `novel-promotion` compat 树，把 `video-stage / voice-stage / prompts-stage / script-view` 四组子目录入口批量收成 renderer 壳。
  - 更新 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/video-stage/VideoRenderPanel.tsx`、`VideoStageLayout.tsx`、`VideoStageShell.tsx`、`VideoTimelinePanel.tsx`、`hooks/useVideoStageRuntime.tsx`，以及 `voice-stage/VoiceControlPanel.tsx`、`VoiceLineList.tsx`、`VoiceStageLayout.tsx`、`VoiceStageShell.tsx`、`hooks/useVoiceStageRuntime.tsx`；这两组目录级入口已统一改成对 `packages/renderer/modules/project-detail/novel-promotion/components/{video-stage,voice-stage}/*` 的 compat shell。
  - 更新 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/prompts-stage/PromptEditorPanel.tsx`、`PromptListPanel.tsx`、`PromptListCardView.tsx`、`PromptsStageLayout.tsx`、`PromptListTableView.tsx`、`PromptsStageShell.tsx`、`hooks/usePromptStageActions.tsx`、`runtime/promptStageRuntimeCore.tsx`、`runtime/promptStageRuntime.types.ts`、`runtime/promptStageRuntime.utils.ts`、`runtime/hooks/usePromptEditorRuntime.ts`、`usePromptDraftByShot.ts`、`usePromptAssetMention.ts`、`usePromptAppendFlow.ts`、`usePromptAiModifyFlow.ts`，以及 `script-view/SpotlightCards.tsx`、`ScriptViewScriptPanel.tsx`、`ScriptViewRuntime.tsx`、`ScriptViewCore.tsx`、`ScriptViewContainer.tsx`、`ScriptViewAssetsPanel.tsx`、`clip-asset-utils.ts`、`asset-state-utils.ts`；这些旧目录文件也已统一改成 renderer re-export 壳，不再保留旧实现。
  - 新增 `scripts/guards/legacy-novel-promotion-video-stage-shell-guard.mjs`、`legacy-novel-promotion-voice-stage-shell-guard.mjs`、`legacy-novel-promotion-prompts-stage-shell-guard.mjs`、`legacy-novel-promotion-script-view-shell-guard.mjs`，并在 `package.json` 中接入对应 `check:*` 与 `test:guards`；现在 root/stage/workspace 之外，`video-stage / voice-stage / prompts-stage / script-view` 四组目录级 compat 壳也都有单独 guard 固化。
  - `node scripts/guards/legacy-novel-promotion-{video-stage,voice-stage,prompts-stage,script-view}-shell-guard.mjs` 与多轮 `npm run desktop:build:web` 已通过；旧 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion` compat 树已从“三层壳”继续推进到“多组高频子目录也空心化”。
- 2026-03-28 00:32:00：继续压缩旧 `src/app` 的 `novel-promotion` compat 树，把 `video / voice` 两组组件目录收成 renderer 壳。
  - 更新 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/video/VideoToolbar.tsx`、`VideoPromptModal.tsx`、`VideoPanelCard.tsx`、`types.ts`、`FirstLastFramePanel.tsx`、`index.ts`，以及 `panel-card/VideoPanelCardShell.tsx`、`VideoPanelCardLayout.tsx`、`VideoPanelCardHeader.tsx`、`VideoPanelCardFooter.tsx`、`VideoPanelCardBody.tsx`、`types.ts`、`runtime/videoPanelRuntimeCore.tsx`、`runtime/shared.ts`、`hooks/useVideoPanelActions.tsx`、`runtime/hooks/usePanelVoiceManager.ts`、`usePanelVideoModel.ts`、`usePanelTaskStatus.ts`、`usePanelPromptEditor.ts`、`usePanelPlayer.ts`、`usePanelLipSync.ts`；这整组旧 `video` 目录已统一改成对 `packages/renderer/modules/project-detail/novel-promotion/components/video/*` 的 compat shell。
  - 更新 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/voice/VoiceToolbar.tsx`、`VoiceLineCard.tsx`、`VoiceDesignDialog.tsx`、`SpeakerVoiceStatus.tsx`、`SpeakerVoiceBindingDialog.tsx`、`EmptyVoiceState.tsx`、`EmotionSettingsPanel.tsx`、`EmbeddedVoiceToolbar.tsx`；旧 `voice` 目录也已统一改成 renderer re-export 壳，不再保留旧实现。
  - 新增 `scripts/guards/legacy-novel-promotion-video-shell-guard.mjs`、`legacy-novel-promotion-voice-shell-guard.mjs`，并在 `package.json` 中接入对应 `check:*` 与 `test:guards`；现在旧 compat 树中 `video / video-stage / voice / voice-stage / prompts-stage / script-view` 六组高频子目录都已有独立 guard 固化。
  - `node scripts/guards/legacy-novel-promotion-{video,voice}-shell-guard.mjs` 与新一轮 `npm run desktop:build:web` 已通过；旧 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion` 当前只剩 `storyboard` 这组最大目录还保留较多旧 compat 实现。
- 2026-03-28 01:24:00：继续推进旧 `src/app` 的 `novel-promotion` compat 树整体验证，完成 `storyboard` 壳化并把整棵旧树标准化成统一 renderer shell。
  - 批量更新 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/storyboard/**`，把 `storyboard` 目录下 63 个旧文件全部改成对 `packages/renderer/modules/project-detail/novel-promotion/components/storyboard/**` 的 compat shell；唯一保留原内容的 `ImageSection.css` 已确认与 renderer 侧完全一致。
  - 继续批量更新旧 `novel-promotion` 树内剩余的 `assets`、`smart-import`、`hooks` 等 51 个非壳文件，并对整棵旧树共 199 个 `.ts/.tsx/.js/.jsx` 文件做统一标准化，当前 `src/app/[locale]/workspace/[projectId]/modes/novel-promotion` 中除 `ImageSection.css` 外，所有代码文件都已是标准化的 `export * / export { default }` renderer compat shell。
  - 新增 `scripts/guards/legacy-novel-promotion-storyboard-shell-guard.mjs` 与 `scripts/guards/legacy-novel-promotion-compat-shell-guard.mjs`，前者固定 `storyboard` 目录 shell 与 `ImageSection.css` 一致性，后者固定整棵旧 `novel-promotion` compat 树只能保持为 renderer 壳；更新 `package.json`，新增 `check:legacy-novel-promotion-storyboard-shell`、`check:legacy-novel-promotion-compat-shell` 并接入 `test:guards`。
  - 旧的 `root / stage / workspace / prompts-stage / script-view / video / video-stage / voice / voice-stage` 分目录 guard 已改成转发到全树 `compat-shell` guard，避免静态正则与当前统一 shell 形态再次漂移；整组 `legacy-novel-promotion-*` guard 与 `npm run desktop:build:web` 已再次通过。
- 2026-03-28 01:35:12：继续收运行时尾巴，补齐 `next runtime adapter` 退场占位并锁死 engine-only 主链。
  - 新增回填 `desktop/runtime/next-runtime-adapter.cjs`，当前文件已退化为单一废弃占位 stub，只导出 `NEXT_RUNTIME_ADAPTER_REMOVED` 与统一抛错入口；桌面主链不再允许通过该文件启动任何 runtime。
  - 更新 `scripts/guards/desktop-runtime-adapter-registry-guard.mjs`，除继续约束 `desktop/main.cjs -> runtime-adapter-registry -> engine-runtime-adapter` 主链外，现在还强制要求 `next-runtime-adapter.cjs` 文件必须存在、必须包含退场 marker，且不得重新依赖 `next-http-runtime-support.cjs`、`next start` 或任意实际 runtime 启动逻辑。
  - 结果是：`next-runtime-adapter.cjs` 不再是“删除后缺口”，而是“受 guard 保护的不可用占位实现”，桌面 runtime 主链继续稳定收敛到 `engine`。
- 2026-03-28 01:35:12：继续固化认证退场边界，避免 `next-auth` 通过注释位或 stub 位回流。
  - 更新 `scripts/guards/engine-auth-provider-boundary-guard.mjs`，新增对 `packages/engine/services/next-auth-bridge-service.ts` 和 `src/types/next-auth.d.ts` 的显式校验：bridge 必须保持 `NEXT_AUTH_BRIDGE_REMOVED` stub，且不得重新 import `next-auth` / `@next-auth/prisma-adapter`；类型文件必须保持“已退场” marker 和 `export {}`，不得恢复 `declare module 'next-auth'`。
  - 结果是：认证主链不仅从运行时代码上切到了 `local-auth-provider-service`，连废弃占位本身也被 guard 固定成不可恢复旧实现的状态。
- 2026-03-28 01:35:12：继续清理桌面 runtime 的 `next` 工具层残留，把未引用的 `next-http-runtime-support` 也退成受控 stub。
  - 更新 `desktop/runtime/next-http-runtime-support.cjs`，当前仅保留 `NEXT_HTTP_RUNTIME_SUPPORT_REMOVED` marker 与统一抛错导出，不再承载任何 `next start`、依赖校验或健康检查逻辑。
  - 更新 `scripts/guards/desktop-runtime-adapter-registry-guard.mjs`，新增对 `next-http-runtime-support.cjs` 的存在性和退场 stub 校验，禁止该文件重新引用 `http-runtime-support.cjs` 或恢复 `next start` 语义。
  - 结果是：桌面 runtime 侧与 `next start` 相关的 adapter/support 文件都已经固定成“engine 主链 + next stub 留痕”的状态，后续不会从工具层回流旧实现。
- 2026-03-28 01:35:12：继续压缩桌面页面链的 Next 运行时边界，把页面产物耦合收口到单一 support 文件。
  - 新增 `desktop/runtime/next-page-runtime-support.cjs`，统一承接页面链的 `next/dist/server/request-meta`、`next/dist/server/node-environment`、packaged `require('next')` smoke，以及页面 request meta 注入逻辑。
  - 更新 `desktop/runtime/page-module-dispatcher.cjs`、`module-dispatcher-support.cjs`、`engine-runtime-adapter.cjs`，把散落的 Next 页面运行时依赖全部切到 `next-page-runtime-support.cjs`，当前桌面 runtime 的直接 Next 页面绑定已从多文件收敛到单一支撑点。
  - 新增 `scripts/guards/desktop-next-page-runtime-boundary-guard.mjs`，并接入 `package.json` 的 `check:desktop-next-page-runtime-boundary` 与 `test:guards`；该 guard 现在固定 `desktop/runtime` 内只有 `next-page-runtime-support.cjs` 能直接接触 `next/dist`、`addRequestMeta` 和 packaged `require('next')`。
- 2026-03-28 01:35:12：继续清理构建阶段检测里的旧 Next 二进制路径耦合，并完成本轮桌面主链回归。
  - 更新 `src/lib/runtime-mode.ts`，新增共享的 `isWebBuildPhase()`；构建阶段判定改成基于 `NEXT_PHASE / npm_lifecycle_event / argv basename` 的中性规则，不再写死 `next/dist/bin/next`。
  - 更新 `src/instrumentation.ts` 与 `src/lib/redis.ts`，统一改走 `isWebBuildPhase()` 与 `isDesktopLocalTasksEnabled()`，清掉两处重复的旧 Next CLI 路径判断。
  - 本轮已通过：`desktop-next-page-runtime-boundary-guard`、`desktop-runtime-adapter-registry-guard`、`desktop-engine-runtime-next-handler-zero-guard`、`desktop-engine-runtime-request-response-zero-guard`、`engine-auth-provider-boundary-guard`，以及 `desktop:build:web`；当前桌面主运行链中，剩余 Next 页面依赖已稳定收口到唯一允许点 `desktop/runtime/next-page-runtime-support.cjs`。
- 2026-03-28 04:30:00：修复 packaged desktop smoke 中的 Next App Router request scope 问题，`win-unpacked` 目录产物重新通过完整冒烟。
  - 更新 `desktop/runtime/route-module-dispatcher.cjs`，在加载任意 `.next/server/app/**/route.js` 前先调用 `ensureNextPageNodeEnvironment()`，避免 `/api/system/boot-id` 先把 `next/dist/server/app-render/async-local-storage` 以缺失 `AsyncLocalStorage` 的状态缓存住，进而导致后续访问 `/zh` 时抛 `Invariant: AsyncLocalStorage accessed in runtime where it is not available`。
  - 更新 `desktop/runtime/next-page-runtime-support.cjs`，新增 `applyNextRouteRequestMeta()`；并在 `route-module-dispatcher.cjs` 中改成调用编译产物导出的 `handler(req, res, ctx)`，同时为 route prepare 链补齐 `initURL / initQuery / initProtocol / relativeProjectDir / distDir / middlewareInvoke / minimalMode / query / params / invokePath / invokeQuery / rewroteURL`，修复动态 API 路由 `/api/projects/[projectId]/costs` 报 `context.params` 为 `undefined`、账单关闭校验返回 500 的问题。
  - 验证结果：更新后的 `dist/desktop/win-unpacked/waoowaoo.exe` 已再次通过 `npm run desktop:smoke:packaged`，链路覆盖 `/zh` 页面直出、注册、登录、创建项目、项目列表与账单关闭；当前可交付目录版产物为 `dist/desktop/win-unpacked/`。另：`desktop:pack:dir` 在当前脏输出目录上会报 `electron.exe -> waoowaoo.exe` 的重命名异常，若需要重新生成全新安装包或干净目录版，需要先清空 `dist/desktop` 后再重打一轮。
