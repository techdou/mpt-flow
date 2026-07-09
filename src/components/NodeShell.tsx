import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useTranslation } from "react-i18next";
import type { FlowNodeData, NodeStatus, StageId } from "../workflow/types";
import { NodeTooltip } from "./NodeTooltip";
import { useCanvasStore } from "../store/canvasStore";
import { useMetadataStore } from "../store/metadataStore";
import { useTaskStore } from "../store/taskStore";

/** 状态对应的颜色（label 走 i18n） */
const STATUS_DOT_RING: Record<NodeStatus, { dot: string; ring: string }> = {
  idle: { dot: "bg-mpt-muted", ring: "border-mpt-border" },
  running: { dot: "bg-mpt-gold animate-pulse", ring: "border-mpt-gold" },
  success: { dot: "bg-green-500", ring: "border-green-500/50" },
  error: { dot: "bg-mpt-red", ring: "border-mpt-red" },
};

/**
 * 通用节点外壳：所有阶段节点共用这个布局。
 *
 * 结构：左侧输入 Handle → 标题栏（状态灯 + 阶段名 + 运行按钮）→ 产物预览 → 右侧输出 Handle
 * 悬停时显示 NodeTooltip（通过 onMouseEnter/Leave + 全局 meta 查找）。
 */
function NodeShellInner({ id, data, selected }: NodeProps) {
  const { t } = useTranslation();
  const nodeData = data as unknown as FlowNodeData;
  const status = nodeData.status;
  const style = STATUS_DOT_RING[status];
  const [hovered, setHovered] = useState(false);

  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const { runNode, isRunning } = useTaskStore();

  // 从 metadataStore 响应式订阅（App 层加载后写入）
  const meta = useMetadataStore((s) =>
    s.metas.find((m) => m.id === nodeData.stageId)
  );

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    runNode(id);
  };

  const handleClick = () => setSelectedNode(id);

  // 产物预览：根据类型智能截断
  const outputEntries = Object.entries(nodeData.outputs || {});
  const previewOutput = (val: unknown): string => {
    if (val == null) return "";
    if (typeof val === "string") {
      return val.length > 60 ? val.slice(0, 60) + "..." : val;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return "[]";
      // 数组显示前 2 项内容 + 省略。对象项用 JSON 截断，避免 [object Object]
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
      className={`relative min-w-[200px] rounded-lg border ${style.ring} bg-mpt-panel shadow-lg transition-shadow ${
        selected ? "ring-2 ring-mpt-teal" : ""
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* 输入 Handle（左侧） */}
      <Handle type="target" position={Position.Left} />

      {/* 悬停说明气泡 */}
      {hovered && (
        <div className="absolute left-full top-0 z-50 ml-3">
          <NodeTooltip meta={meta} />
        </div>
      )}

      {/* 删除按钮：选中时显示，运行中禁用 */}
      {selected && status !== "running" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          className="absolute -right-2 -top-2 z-[60] flex h-5 w-5 items-center justify-center rounded-full border border-mpt-red bg-mpt-panel text-xs text-mpt-red hover:bg-mpt-red hover:text-white"
          title={t("node.deleteNode")}
        >
          ×
        </button>
      )}

      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
        <span className="text-sm font-semibold text-white">
          {t(`node.stageName.${nodeData.stageId}`)}
        </span>
        <button
          onClick={handleRun}
          disabled={status === "running" || isRunning}
          className="ml-auto rounded bg-mpt-teal px-2 py-0.5 text-xs font-medium text-white hover:bg-mpt-teal/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "running"
            ? t("node.runButton.running")
            : status === "error"
            ? t("node.runButton.retry")
            : t("node.runButton.run")}
        </button>
      </div>

      {/* 状态行：运行中显示已用时间 */}
      <div className="px-3 pb-1">
        {status === "running" ? (
          <span className="font-mono text-xs text-mpt-muted">
            {t(`node.status.${status}`)}
            {typeof nodeData.elapsedSeconds === "number"
              ? ` · ${nodeData.elapsedSeconds}s`
              : ""}
          </span>
        ) : (
          <span className="font-mono text-xs text-mpt-muted">{t(`node.status.${status}`)}</span>
        )}
      </div>

      {/* 运行中 indeterminate 进度条（不显示假百分比，后端无实时进度推送） */}
      {status === "running" && (
        <div className="mx-3 mb-1 h-1 overflow-hidden rounded bg-mpt-border">
          <div className="h-full w-1/3 animate-pulse rounded bg-mpt-gold" />
        </div>
      )}

      {/* 产物预览 */}
      {outputEntries.length > 0 && (
        <div className="border-t border-mpt-border px-3 py-2">
          <div className="mb-1 font-mono text-xs text-mpt-teal">{t("node.outputs")}</div>
          <div className="space-y-1">
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

      {/* 错误信息（含重试提示） */}
      {status === "error" && nodeData.error && (
        <div className="border-t border-mpt-red/30 bg-mpt-red/10 px-3 py-1.5">
          <p className="text-xs text-mpt-red break-all">{nodeData.error}</p>
          <p className="mt-0.5 text-xs text-mpt-muted">{t("node.retryHint")}</p>
        </div>
      )}

      {/* 输出 Handle（右侧） */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const NodeShell = memo(NodeShellInner);
