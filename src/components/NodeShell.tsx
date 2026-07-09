import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import type { FlowNodeData, NodeStatus } from "../workflow/types";
import { NodeTooltip } from "./NodeTooltip";
import { StageIcon } from "./StageIcon";
import { useCanvasStore } from "../store/canvasStore";
import { useMetadataStore } from "../store/metadataStore";
import { useTaskStore } from "../store/taskStore";
import { stageColor } from "../workflow/stageVisuals";

/** 状态对应的视觉（pill 样式） */
const STATUS_PILL: Record<NodeStatus, { bg: string; text: string; dot: string }> = {
  idle: { bg: "bg-mpt-border/40", text: "text-mpt-muted", dot: "bg-mpt-muted" },
  running: { bg: "bg-mpt-gold/20", text: "text-mpt-gold", dot: "bg-mpt-gold animate-pulse" },
  success: { bg: "bg-green-500/20", text: "text-green-400", dot: "bg-green-400" },
  error: { bg: "bg-mpt-red/20", text: "text-mpt-red", dot: "bg-mpt-red" },
};

/**
 * 通用节点外壳：所有阶段节点共用这个布局。
 *
 * 结构：左侧颜色条 → 输入 Handle → 标题栏（图标+名称+状态pill+运行按钮）→ 产物预览 → 右侧输出 Handle
 */
function NodeShellInner({ id, data, selected }: NodeProps) {
  const { t } = useTranslation();
  const nodeData = data as unknown as FlowNodeData;
  const status = nodeData.status;
  const color = stageColor(nodeData.stageId);
  const pill = STATUS_PILL[status];
  const [hovered, setHovered] = useState(false);

  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const { runNode, isRunning } = useTaskStore();

  const meta = useMetadataStore((s) =>
    s.metas.find((m) => m.id === nodeData.stageId)
  );

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    runNode(id);
  };

  const handleClick = () => setSelectedNode(id);

  // 产物预览
  const outputEntries = Object.entries(nodeData.outputs || {});
  const previewOutput = (val: unknown): string => {
    if (val == null) return "";
    if (typeof val === "string") {
      return val.length > 60 ? val.slice(0, 60) + "..." : val;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return "[]";
      const preview = val.slice(0, 2).map((v) => {
        if (typeof v === "string") {
          return `"${v.length > 20 ? v.slice(0, 20) + "…" : v}"`;
        }
        return JSON.stringify(v).slice(0, 20);
      }).join(", ");
      return val.length > 2
        ? `[${preview}, …${t("node.totalItems", { count: val.length })}]`
        : `[${preview}]`;
    }
    if (typeof val === "object") {
      const keys = Object.keys(val as object);
      return keys.length > 4 ? `{${keys.slice(0, 4).join(", ")}, …}` : `{${keys.join(", ")}}`;
    }
    return String(val).slice(0, 60);
  };

  return (
    <div
      className={`relative min-w-[210px] rounded-lg border-l-[3px] border border-l-transparent bg-mpt-panel shadow-lg transition-all duration-200 ${
        selected
          ? "border-mpt-teal shadow-[0_0_0_1px_rgba(8,127,140,0.3)]"
          : "border-mpt-border hover:-translate-y-0.5 hover:border-mpt-teal/40 hover:shadow-[0_8px_30px_rgba(8,127,140,0.1)]"
      }`}
      style={{ borderLeftColor: color }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Left} />

      {/* 悬停说明气泡 */}
      {hovered && (
        <div className="absolute left-full top-0 z-50 ml-3 animate-fade-in">
          <NodeTooltip meta={meta} />
        </div>
      )}

      {/* 删除按钮 */}
      {selected && status !== "running" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          className="absolute -right-2 -top-2 z-[60] flex h-6 w-6 items-center justify-center rounded-full border border-mpt-red bg-mpt-panel text-mpt-red transition-transform hover:scale-110 hover:bg-mpt-red hover:text-white"
          title={t("node.deleteNode")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <StageIcon stageId={nodeData.stageId} className="h-5 w-5 shrink-0" />
        <span className="text-sm font-heading font-bold text-white">
          {t(`node.stageName.${nodeData.stageId}`)}
        </span>
        {/* 状态 pill */}
        <span className={`ml-1 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${pill.bg} ${pill.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
          {t(`node.status.${status}`)}
        </span>
        {/* 运行按钮 */}
        <button
          onClick={handleRun}
          disabled={status === "running" || isRunning}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded text-white transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: color }}
          title={status === "running" ? t("node.runButton.running") : t("node.runButton.run")}
        >
          {status === "running" ? (
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* 运行中：进度条 + 计时 */}
      {status === "running" && (
        <div className="px-3 pb-1">
          <div className="h-0.5 overflow-hidden rounded bg-mpt-border">
            <div className="h-full w-1/3 animate-pulse rounded" style={{ backgroundColor: color }} />
          </div>
          {typeof nodeData.elapsedSeconds === "number" && (
            <span className="mt-0.5 block font-mono text-[10px] text-mpt-muted">
              {nodeData.elapsedSeconds}s
            </span>
          )}
        </div>
      )}

      {/* 产物预览 */}
      {outputEntries.length > 0 && (
        <div className="border-t border-mpt-border px-3 py-2">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-mpt-teal">
            {t("node.outputs")}
          </div>
          <div className="space-y-0.5">
            {outputEntries.slice(0, 3).map(([key, val]) => (
              <div key={key} className="text-xs">
                <code className="text-mpt-gold">{key}</code>
                <span className="text-mpt-muted">: </span>
                <span className="text-mpt-muted/90 break-all">{previewOutput(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {status === "error" && nodeData.error && (
        <div className="border-t border-mpt-red/30 bg-mpt-red/10 px-3 py-1.5">
          <p className="text-xs text-mpt-red break-all">{nodeData.error}</p>
          <p className="mt-0.5 text-[10px] text-mpt-muted">{t("node.retryHint")}</p>
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const NodeShell = memo(NodeShellInner);
