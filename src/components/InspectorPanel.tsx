import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCanvasStore } from "../store/canvasStore";
import { useTaskStore } from "../store/taskStore";
import { STAGE_HINTS } from "../workflow/metadata";
import { STAGE_PARAMS, getSelectDefaults } from "../workflow/stageParams";
import type { StageId } from "../workflow/types";
import { stageColor } from "../workflow/stageVisuals";
import { StageIcon } from "./StageIcon";

/**
 * 右侧参数配置面板。
 *
 * 点击节点后显示该节点的可配置参数。用户填的值存到 node.data.params，
 * 运行时会和上游产物合并成请求体。
 */
export function InspectorPanel() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "zh" | "en";
  const { nodes, selectedNodeId, updateNodeData } = useCanvasStore();
  const { sharedTaskId, runNode, resetTaskId } = useTaskStore();

  const node = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    if (!node) return;
    const stageId = node.data.stageId as StageId;
    const defaults = getSelectDefaults(stageId);
    const missing = Object.entries(defaults).filter(
      ([k]) => node.data.params[k] === undefined
    );
    if (missing.length > 0) {
      const patch: Record<string, unknown> = {};
      for (const [k, v] of missing) patch[k] = v;
      updateNodeData(node.id, { params: { ...node.data.params, ...patch } });
    }
  }, [selectedNodeId, node, updateNodeData]);

  if (!node) {
    return (
      <div className="flex w-80 flex-col border-l border-mpt-border bg-mpt-panel">
        <div className="border-b border-mpt-border px-5 py-3.5">
          <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-mpt-teal">
            {t("inspector.title")}
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-5">
          <div className="text-center">
            <div className="mb-3 flex justify-center opacity-20">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#087f8c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3 8-8M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
              </svg>
            </div>
            <p className="whitespace-pre-line text-sm text-mpt-muted">
              {t("inspector.emptyState")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stageId = node.data.stageId;
  const color = stageColor(stageId);
  const params = STAGE_PARAMS[stageId] || [];
  const hint = STAGE_HINTS[stageId];

  const handleParamChange = (key: string, value: string) => {
    let parsed: unknown = value;
    if (value !== "" && !isNaN(Number(value)) && key !== "video_subject") {
      const numVal = Number(value);
      if (key === "paragraph_number" || key === "voice_rate" || key === "video_clip_duration" || key === "video_count") {
        parsed = numVal;
      }
    }
    if (value === "true") parsed = true;
    if (value === "false") parsed = false;

    updateNodeData(node.id, {
      params: { ...node.data.params, [key]: parsed },
    });
  };

  const inputClass =
    "w-full rounded-md border border-mpt-border bg-mpt-elevated px-3 py-2 text-sm text-white focus:border-mpt-teal focus:outline-none";

  return (
    <div className="flex w-80 flex-col border-l border-mpt-border bg-mpt-panel">
      {/* 头部 */}
      <div className="border-b border-mpt-border px-5 py-3.5" style={{ borderLeft: `3px solid ${color}` }}>
        <div className="flex items-center gap-2">
          <StageIcon stageId={stageId} className="h-5 w-5" />
          <h2 className="font-heading text-sm font-bold text-white">
            {t(`node.stageName.${stageId}`)}
          </h2>
          <span className="font-mono text-[10px] text-mpt-muted">{stageId}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-mpt-muted">{hint.what[lang]}</p>
      </div>

      {/* 共享 task_id */}
      <div className="border-b border-mpt-border bg-mpt-elevated/50 px-5 py-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-mpt-muted">
            {t("inspector.taskId")}
          </span>
          {sharedTaskId && (
            <button
              onClick={resetTaskId}
              className="text-xs text-mpt-red hover:underline"
            >
              {t("inspector.reset")}
            </button>
          )}
        </div>
        <p className="mt-0.5 truncate font-mono text-xs text-mpt-gold">
          {sharedTaskId || t("inspector.taskIdEmpty")}
        </p>
      </div>

      {/* 参数表单 */}
      <div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
        {params.map((param) => (
          <div key={param.key}>
            <label className="mb-1 block text-xs font-medium text-mpt-muted">
              {t(`inspector.params.${param.labelKey}`)}
            </label>
            {param.type === "textarea" ? (
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder={param.placeholderKey ? t(`inspector.placeholders.${param.placeholderKey}`) : undefined}
                value={String(node.data.params[param.key] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
              />
            ) : param.type === "select" ? (
              <select
                className={inputClass}
                value={String(node.data.params[param.key] ?? param.options?.[0] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
              >
                {param.options?.map((opt) => (
                  <option key={opt} value={opt} className="bg-mpt-elevated">{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={param.type === "number" ? "number" : "text"}
                className={inputClass}
                placeholder={param.placeholderKey ? t(`inspector.placeholders.${param.placeholderKey}`) : undefined}
                value={String(node.data.params[param.key] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {/* 运行按钮 */}
      <div className="border-t border-mpt-border px-5 py-3.5">
        <button
          onClick={() => runNode(node.id)}
          disabled={node.data.status === "running"}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: color }}
        >
          {node.data.status === "running" && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
            </svg>
          )}
          {node.data.status === "running" ? t("inspector.runningButton") : t("inspector.runButton")}
        </button>
        {node.data.status === "error" && node.data.error && (
          <p className="mt-2 text-xs text-mpt-red break-all">{node.data.error}</p>
        )}
      </div>
    </div>
  );
}
