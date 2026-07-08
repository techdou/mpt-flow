# MPT Flow · 视频生成工作流编排

MoneyPrinterTurbo 的节点画布前端。把视频生成 pipeline 的每一步（脚本→关键词→配音→字幕→素材→合成）变成可拖拽、可连线、可悬停查看说明的节点。

## 技术栈

- **Vite 5 + React 18 + TypeScript**
- **@xyflow/react v12**（React Flow 节点画布）
- **Zustand**（状态管理）
- **Tailwind CSS v3**（样式，暗色主题，复刻 webui 红/青/金配色）

## 前置条件

需要先启动 MoneyPrinterTurbo 后端（带 stage API 的版本）：

```bash
cd E:\projects\generate_videos\MoneyPrinterTurbo
python main.py  # 默认监听 18080
```

本项目 dev server 默认连接 `http://127.0.0.1:18081`（在 `vite.config.ts` 里改）。

## 启动

```bash
cd E:\projects\mpt-flow
npm install
npm run dev      # 启动 dev server，http://localhost:5174
npm run build    # 生产构建
```

## 架构

```
src/
├── api/
│   ├── client.ts          # axios 实例（dev 经 vite proxy 转发到后端）
│   └── stage.ts           # 单阶段触发 + metadata API 封装
├── store/
│   ├── canvasStore.ts     # Zustand: 画布节点/边/选中态
│   └── taskStore.ts       # Zustand: 运行节点（收集上游→调API→更新状态）
├── workflow/
│   ├── types.ts           # FlowNodeData / StageId / StageMeta 类型
│   ├── engine.ts          # BFS 收集上游产物 + 连线校验
│   ├── metadata.ts        # 大白话节点说明（与后端结构化元数据合并）
│   └── templates.ts       # 预设模板（完整流程/仅文案/配音+字幕）
├── components/
│   ├── FlowCanvas.tsx     # React Flow 画布主体
│   ├── NodeShell.tsx      # 通用节点外壳（状态灯+运行按钮+Handle）
│   ├── NodeTooltip.tsx    # 悬停说明气泡（核心交互）
│   ├── Sidebar.tsx        # 左侧节点拖拽面板
│   └── InspectorPanel.tsx # 右侧参数配置面板
└── App.tsx                # 顶层组装 + metadata 加载 + 模板工具栏
```

## 核心交互

**节点悬停说明**：鼠标移到节点上，弹出气泡显示——大白话解释（做什么/何时用/踩坑提示）+ 结构化输入输出字段。内容来自后端 `/api/v1/stage/metadata` 和前端 `metadata.ts` 的合并。

**节点单独运行**：点节点上的「运行」按钮，前端收集所有上游节点的产物（BFS 回溯），合并用户在右侧面板填的参数，调 `POST /api/v1/stage/{stageId}`。跨阶段通过共享 `task_id` 复用后端 manifest.json。

**节点连线**：从节点右侧 Handle 拖到下游节点左侧 Handle。连线时自动校验防止成环。

**预设模板**：顶部工具栏一键加载「完整流程」「仅文案」「配音+字幕」三种模板，加载后仍可自由增删节点。

## 后端 API（MoneyPrinterTurbo feat/workflow-stage-api 分支）

| 端点 | 说明 |
|------|------|
| `POST /api/v1/stage/script` | 单独跑脚本生成 |
| `POST /api/v1/stage/terms` | 单独跑关键词生成 |
| `POST /api/v1/stage/audio` | 单独跑配音（TTS） |
| `POST /api/v1/stage/subtitle` | 单独跑字幕（从 timeline.json 重建 sub_maker） |
| `POST /api/v1/stage/materials` | 单独跑素材获取 |
| `POST /api/v1/stage/render` | 单独跑视频合成 |
| `GET /api/v1/stage/metadata` | 6 个节点的中英文元数据 |
