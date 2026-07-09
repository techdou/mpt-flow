import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCanvasStore } from "./store/canvasStore";
import { useTaskStore } from "./store/taskStore";
import { useMetadataStore } from "./store/metadataStore";
import { fetchStageMetadata } from "./api/stage";
import { FlowCanvas } from "./components/FlowCanvas";
import { Sidebar } from "./components/Sidebar";
import { InspectorPanel } from "./components/InspectorPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { TEMPLATES } from "./workflow/templates";

export default function App() {
  const { t } = useTranslation();
  const { loadTemplate, clearCanvas } = useCanvasStore();
  const { resetTaskId } = useTaskStore();
  const { metas, error: metaError, setMetas, setError } = useMetadataStore();
  const [activeTemplate, setActiveTemplate] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  // 启动时加载后端节点元数据
  useEffect(() => {
    fetchStageMetadata()
      .then((data) => setMetas(data))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [setMetas, setError]);

  const handleLoadTemplate = (templateId: string, nodes: typeof TEMPLATES[0]["nodes"], edges: typeof TEMPLATES[0]["edges"]) => {
    loadTemplate(nodes, edges);
    setActiveTemplate(templateId);
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
      <header className="flex items-center gap-3 border-b border-mpt-border bg-mpt-panel px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <h1 className="font-heading text-base font-bold tracking-tight text-mpt-teal">MPT Flow</h1>
          <span className="hidden text-xs text-mpt-muted sm:inline">{t("app.subtitle")}</span>
        </div>

        <div className="ml-4 flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-mpt-muted">{t("app.template")}</span>
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleLoadTemplate(tpl.id, tpl.nodes, tpl.edges)}
              title={t(tpl.descKey)}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                activeTemplate === tpl.id
                  ? "bg-mpt-teal text-mpt-foreground"
                  : "bg-mpt-panel text-mpt-muted hover:text-mpt-foreground"
              }`}
            >
              {t(tpl.nameKey)}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="ml-2 rounded bg-mpt-panel px-2.5 py-1 text-xs text-mpt-red hover:bg-mpt-red/10"
          >
            {t("app.clear")}
          </button>
        </div>

        {/* 操作提示 */}
        <div className="ml-3 hidden font-mono text-xs text-mpt-muted/60 lg:flex">
          {t("app.hint")}
        </div>

        {/* 后端连接状态 + 设置按钮 */}
        <div className="ml-auto flex items-center gap-3">
          {metaError ? (
            <span className="font-mono text-xs text-mpt-red" title={metaError}>
              {t("app.backendDisconnected")}
            </span>
          ) : metas.length > 0 ? (
            <span className="font-mono text-xs text-mpt-success">
              {t("app.backendConnected", { count: metas.length })}
            </span>
          ) : (
            <span className="font-mono text-xs text-mpt-gold animate-pulse">
              {t("app.backendConnecting")}
            </span>
          )}

          {/* 设置齿轮按钮 */}
          <button
            onClick={() => setShowSettings(true)}
            title={t("settings.title")}
            className="rounded p-1 text-mpt-muted transition-colors hover:bg-mpt-panel hover:text-mpt-teal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* 主体三栏布局 */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <FlowCanvas />
        <InspectorPanel />
      </div>

      {/* 设置面板 Modal */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
