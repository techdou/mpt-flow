import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCanvasStore } from "../store/canvasStore";
import { useTaskStore } from "../store/taskStore";
import { STAGE_HINTS } from "../workflow/metadata";
import { STAGE_PARAMS, getSelectDefaults } from "../workflow/stageParams";
import { useSettingsStore } from "../store/settingsStore";
import type { StageId } from "../workflow/types";

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

  // 节点选中时预填 select 默认值，避免用户不动 select 时字段缺失。
  useEffect(() => {
    if (!node) return;
    const stageId = node.data.stageId as StageId;
    const defaults = getSelectDefaults(stageId);
    const missing = Object.entries(defaults).filter(
      ([k, v]) => node.data.params[k] === undefined
    );
    if (missing.length > 0) {
      const patch: Record<string, unknown> = {};
      for (const [k, v] of missing) patch[k] = v;
      updateNodeData(node.id, { params: { ...node.data.params, ...patch } });
    }
  }, [selectedNodeId, node, updateNodeData]);

  if (!node) {
    return (
      <div className="flex w-72 flex-col border-l border-mpt-border bg-mpt-dark">
        <div className="px-4 py-3">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-mpt-teal">
            {t("inspector.title")}
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="whitespace-pre-line text-center text-sm text-mpt-muted">
            {t("inspector.emptyState")}
          </p>
        </div>
      </div>
    );
  }

  const stageId = node.data.stageId;
  const params = STAGE_PARAMS[stageId] || [];
  const hint = STAGE_HINTS[stageId];

  const handleParamChange = (key: string, value: string) => {
    let parsed: unknown = value;
    // 数字字段转 number
    if (value !== "" && !isNaN(Number(value)) && key !== "video_subject") {
      const numVal = Number(value);
      if (key === "paragraph_number" || key === "voice_rate" || key === "video_clip_duration" || key === "video_count") {
        parsed = numVal;
      }
    }
    // 布尔字段转 boolean
    if (value === "true") parsed = true;
    if (value === "false") parsed = false;

    updateNodeData(node.id, {
      params: { ...node.data.params, [key]: parsed },
    });
  };

  return (
    <div className="flex w-72 flex-col border-l border-mpt-border bg-mpt-dark">
      <div className="border-b border-mpt-border px-4 py-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-mpt-teal">
          {t("inspector.title")}
        </h2>
        <p className="mt-1 text-sm font-medium text-white">{stageId}</p>
        <p className="mt-1 text-xs text-mpt-muted">{hint.what[lang]}</p>
      </div>

      {/* 共享 task_id 状态 */}
      <div className="border-b border-mpt-border bg-mpt-panel px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-mpt-muted">{t("inspector.taskId")}</span>
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
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {params.map((param) => (
          <div key={param.key}>
            <label className="mb-1 block text-xs text-mpt-muted">
              {t(`inspector.params.${param.labelKey}`)}
            </label>
            {param.type === "textarea" ? (
              <textarea
                className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1 text-sm text-white focus:border-mpt-teal focus:outline-none"
                rows={3}
                placeholder={param.placeholderKey ? t(`inspector.placeholders.${param.placeholderKey}`) : undefined}
                value={String(node.data.params[param.key] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
              />
            ) : param.type === "select" ? (
              <select
                className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1 text-sm text-white focus:border-mpt-teal focus:outline-none"
                value={String(node.data.params[param.key] ?? param.options?.[0] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
              >
                {param.options?.map((opt) => (
                  <option key={opt} value={opt} className="bg-mpt-panel">
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={param.type === "number" ? "number" : "text"}
                className="w-full rounded border border-mpt-border bg-mpt-panel px-2 py-1 text-sm text-white focus:border-mpt-teal focus:outline-none"
                placeholder={param.placeholderKey ? t(`inspector.placeholders.${param.placeholderKey}`) : undefined}
                value={String(node.data.params[param.key] ?? "")}
                onChange={(e) => handleParamChange(param.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {/* 运行按钮 */}
      <div className="border-t border-mpt-border px-4 py-3">
        <button
          onClick={() => runNode(node.id)}
          disabled={node.data.status === "running"}
          className="w-full rounded-lg bg-mpt-teal py-2 text-sm font-semibold text-white hover:bg-mpt-teal/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {node.data.status === "running" ? t("inspector.runningButton") : t("inspector.runButton")}
        </button>
        {node.data.status === "error" && node.data.error && (
          <p className="mt-2 text-xs text-mpt-red break-all">{node.data.error}</p>
        )}
      </div>
    </div>
  );
}
