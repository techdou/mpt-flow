import { useEffect, useState } from "react";
import { useCanvasStore } from "./store/canvasStore";
import { useTaskStore } from "./store/taskStore";
import { fetchStageMetadata } from "./api/stage";
import { FlowCanvas } from "./components/FlowCanvas";
import { Sidebar } from "./components/Sidebar";
import { InspectorPanel } from "./components/InspectorPanel";
import { TEMPLATES, type Template } from "./workflow/templates";
import type { StageMeta } from "./workflow/types";

/**
 * 全局 metadata 类型声明（NodeShell 通过 window.__STAGE_METAS__ 读取）
 */
declare global {
  interface Window {
    __STAGE_METAS__?: StageMeta[];
  }
}

export default function App() {
  const { loadTemplate, clearCanvas } = useCanvasStore();
  const { resetTaskId } = useTaskStore();
  const [metas, setMetas] = useState<StageMeta[]>([]);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string>("");

  // 启动时加载后端节点元数据
  useEffect(() => {
    fetchStageMetadata()
      .then((data) => {
        setMetas(data);
        window.__STAGE_METAS__ = data;
      })
      .catch((err) => {
        setMetaError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  const handleLoadTemplate = (tpl: Template) => {
    loadTemplate(tpl.nodes, tpl.edges);
    setActiveTemplate(tpl.id);
    resetTaskId();
  };

  const handleClear = () => {
    clearCanvas();
    setActiveTemplate("");
    resetTaskId();
  };

  return (
    <div className="flex h-screen flex-col">
      {/* 顶部工具栏 */}
      <header className="flex items-center gap-3 border-b border-mpt-border bg-mpt-dark px-4 py-2">
        <div className="flex items-baseline gap-2">
          <h1 className="font-mono text-sm font-bold text-mpt-teal">MPT Flow</h1>
          <span className="text-xs text-mpt-muted">视频生成工作流编排</span>
        </div>

        <div className="ml-4 flex items-center gap-2">
          <span className="font-mono text-xs text-mpt-muted">模板：</span>
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleLoadTemplate(tpl)}
              title={tpl.description}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                activeTemplate === tpl.id
                  ? "bg-mpt-teal text-white"
                  : "bg-mpt-panel text-mpt-muted hover:text-white"
              }`}
            >
              {tpl.name}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="ml-2 rounded bg-mpt-panel px-2.5 py-1 text-xs text-mpt-red hover:bg-mpt-red/10"
          >
            清空
          </button>
        </div>

        {/* 后端连接状态 */}
        <div className="ml-auto flex items-center gap-2">
          {metaError ? (
            <span className="font-mono text-xs text-mpt-red" title={metaError}>
              ● 后端未连接
            </span>
          ) : metas.length > 0 ? (
            <span className="font-mono text-xs text-green-500">
              ● 后端已连接（{metas.length} 个阶段）
            </span>
          ) : (
            <span className="font-mono text-xs text-mpt-gold animate-pulse">
              ● 连接中...
            </span>
          )}
        </div>
      </header>

      {/* 主体三栏布局 */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <FlowCanvas />
        <InspectorPanel />
      </div>
    </div>
  );
}
