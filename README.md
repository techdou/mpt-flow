# MPT Flow · 视频生成工作流编排

[English](#english) · 简体中文

MoneyPrinterTurbo 的节点画布前端。把视频生成 pipeline 的每一步（脚本→关键词→配音→字幕→素材→合成）变成可拖拽、可连线、可悬停查看说明的节点。

## 功能特性

- 🎨 **节点画布** — 拖拽式编排视频生成流水线，6 色编码区分阶段
- 🔗 **智能连线** — 自动校验依赖关系防止成环，带箭头和发光效果
- ▶️ **单节点运行** — 只跑流水线中某个阶段，不必整条重跑
- 🛡️ **依赖预检查** — 运行前检查上游阶段是否完成，未满足时显示警告
- 💡 **悬停说明** — 鼠标移到节点上，弹出"做什么/何时用/踩坑提示"
- 📋 **预设模板** — 一键加载「完整流程」「仅文案」「配音+字幕」
- 🌐 **多语言** — 中文 / English，即时切换
- 🌗 **亮暗双主题** — 暗色 / 亮色 / 跟随系统，CSS 变量方案零闪烁
- ⚙️ **可配置** — 后端地址、请求超时、默认参数预设，全部持久化
- 🔄 **状态持久化** — task_id 跨刷新保持，运行竞态保护防止数据错位

## 技术栈

| 维度 | 选型 |
|------|------|
| 构建 | Vite 5 |
| 框架 | React 18 + TypeScript |
| 画布 | [@xyflow/react](https://reactflow.dev/) v12 (React Flow) |
| 状态 | Zustand（含 persist 持久化） |
| 样式 | Tailwind CSS v3（CSS 变量主题切换） |
| i18n | react-i18next |
| 字体 | 得意黑（标题）+ 思源黑体（正文）+ JetBrains Mono（代码） |

## 快速开始

### 前置条件

- Node.js ≥ 18
- MoneyPrinterTurbo 后端（需含 stage API，位于 `feat/workflow-stage-api` 分支）

### 启动后端

```bash
cd MoneyPrinterTurbo
python main.py          # 默认监听 127.0.0.1:18081
```

> 后端监听端口可在 `config.toml` 的 `listen_port` 修改。前端连接地址在 [`vite.config.ts`](vite.config.ts) 的 `server.proxy.target` 里同步修改，或在设置面板里运行时配置。

### 启动前端

```bash
npm install
npm run dev             # http://localhost:5174
npm run build           # 生产构建到 dist/
npm run preview         # 预览生产构建
```

## 项目结构

```
src/
├── api/
│   ├── client.ts           # axios 实例（dev 经 vite proxy 转发到后端）
│   └── stage.ts            # 单阶段触发 + metadata API 封装
├── i18n/
│   ├── index.ts            # react-i18next 初始化
│   ├── zh.json             # 中文资源
│   └── en.json             # 英文资源
├── store/
│   ├── canvasStore.ts      # Zustand: 画布节点/边/选中态
│   ├── taskStore.ts        # Zustand: 运行节点（收集上游→调API→更新状态）
│   ├── metadataStore.ts    # Zustand: 从后端加载节点元数据
│   └── settingsStore.ts    # Zustand: 用户设置（语言/主题/后端地址/默认参数）
├── utils/
│   └── theme.ts            # 亮暗主题切换（CSS 变量 + matchMedia）
├── workflow/
│   ├── types.ts            # FlowNodeData / StageId / StageMeta 类型
│   ├── engine.ts           # BFS 收集上游产物 + 依赖检查 + 连线校验
│   ├── metadata.ts         # 大白话节点说明（中英双语）
│   ├── stageParams.ts      # 各阶段参数定义（含 min/max 范围校验）
│   ├── stageVisuals.ts     # 6 色编码 + SVG 图标定义
│   └── templates.ts        # 预设模板（完整流程/仅文案/配音+字幕）
├── components/
│   ├── FlowCanvas.tsx      # React Flow 画布主体
│   ├── NodeShell.tsx       # 通用节点外壳（颜色条+图标+状态pill+运行按钮）
│   ├── NodeTooltip.tsx     # 悬停说明气泡（颜色条+pill标签+输入输出）
│   ├── Sidebar.tsx         # 左侧节点拖拽面板
│   ├── InspectorPanel.tsx  # 右侧参数配置面板
│   ├── SettingsPanel.tsx   # 设置弹窗（语言/主题/后端/默认参数）
│   ├── DeletableEdge.tsx   # 可删除连线（×按钮 + 透明hit-area）
│   └── StageIcon.tsx       # 阶段 SVG 图标
└── App.tsx                 # 顶层组装 + 工具栏 + 设置入口
```

## 核心交互

**节点悬停说明**：鼠标移到节点上，弹出气泡显示——大白话解释（做什么/何时用/踩坑提示）+ 结构化输入输出字段。内容来自后端 `/api/v1/stage/metadata` 和前端 `metadata.ts` 的合并。悬停时节点自动提升层级，tooltip 不被相邻节点遮挡。

**节点单独运行**：点节点上的「运行」按钮，前端收集所有上游节点的产物（BFS 回溯），合并用户在右侧面板填的参数，调 `POST /api/v1/stage/{stageId}`。跨阶段通过共享 `task_id` 复用后端 manifest.json。

**节点连线**：从节点右侧 Handle 拖到下游节点左侧 Handle。连线时自动校验防止成环。

**预设模板**：顶部工具栏一键加载「完整流程」「仅文案」「配音+字幕」三种模板，加载后自动 fitView，仍可自由增删节点。

**主题切换**：设置面板选择暗色/亮色/跟随系统。基于 CSS 变量方案，切换瞬时生效无闪烁，刷新页面保持设置。

**依赖预检查**：运行节点前自动检查上游阶段是否已成功完成（如 audio 需要 script、render 需要 materials+audio）。未满足依赖时右侧面板显示橙色警告，避免后端返回不友好的错误。

**错误处理**：后端 422 校验错误自动转成可读提示（如 `video_subject: field required`）。节点运行失败时自动清空旧产物，防止下游用到过期数据。运行期间换模板有竞态保护，不会污染新画布的 task_id。

## 主题与配色

界面支持亮/暗双主题，通过 CSS 变量实现（`tailwind.config.js` 的结构色指向 `var(--mpt-*)`，`theme.css` 定义 `:root`（亮）和 `.dark`（暗）两套变量）。

每个阶段有专属颜色编码：

| 阶段 | 颜色 | 含义 |
|------|------|------|
| script | 🔴 红 `#e83d3d` | 脚本生成 |
| terms | 🔹 青 `#087f8c` | 关键词生成 |
| audio | 🟡 金 `#d99a00` | 配音生成 |
| subtitle | 🟣 紫 `#8b5cf6` | 字幕生成 |
| materials | 🟣 浅紫 `#a371f7` | 素材获取 |
| render | 🟢 绿 `#3fb950` | 视频合成 |

品牌色（red/teal/gold + 阶段色）在亮暗模式下保持一致，只切换结构色（背景/面板/边框/文字）。

## 后端 API 契约

| 端点 | 说明 |
|------|------|
| `POST /api/v1/stage/script` | 单独跑脚本生成 |
| `POST /api/v1/stage/terms` | 单独跑关键词生成 |
| `POST /api/v1/stage/audio` | 单独跑配音（TTS） |
| `POST /api/v1/stage/subtitle` | 单独跑字幕（从 timeline.json 重建 sub_maker） |
| `POST /api/v1/stage/materials` | 单独跑素材获取 |
| `POST /api/v1/stage/render` | 单独跑视频合成 |
| `GET /api/v1/stage/metadata` | 6 个节点的中英文元数据 |

> 后端阻塞式 API，无实时进度推送。前端用 indeterminate 进度条 + 真实耗时计时器。

## 开发说明

- **TypeScript 检查**：`npx tsc --noEmit`
- **生产构建**：`npm run build`（先 `tsc -b` 再 `vite build`）
- **添加新语言**：在 `src/i18n/` 新增 `xx.json`，在 `i18n/index.ts` 的 resources 里注册
- **添加新节点类型**：在 `stageVisuals.ts` 加颜色+图标，`stageParams.ts` 加参数定义，`metadata.ts` 加双语说明

## License

MIT

---

## English

A node-canvas frontend for MoneyPrinterTurbo. Turns each step of the video-generation pipeline (script → terms → audio → subtitle → materials → render) into a draggable, connectable node with hover-to-explain tooltips.

### Features

- **Node Canvas** — Drag-and-drop pipeline editor with 6-color stage coding
- **Smart Connections** — Dependency validation, arrows, glow effects
- **Single-Node Execution** — Run one stage without re-running the whole pipeline
- **Hover Tooltips** — Plain-language explanations + structured I/O fields
- **Preset Templates** — Full pipeline / Text-only / Audio+Subtitle
- **i18n** — Chinese / English with instant switching
- **Light/Dark Theme** — Dark / Light / System, CSS variable based, no flash
- **Configurable** — Backend URL, timeout, default params, all persisted

### Quick Start

```bash
# 1. Start the MoneyPrinterTurbo backend (with stage API) on :18081
cd MoneyPrinterTurbo && python main.py

# 2. Start this frontend
npm install
npm run dev             # http://localhost:5174
```

### Tech Stack

Vite 5 · React 18 · TypeScript · @xyflow/react v12 · Zustand · Tailwind CSS v3 · react-i18next

## License

MIT
