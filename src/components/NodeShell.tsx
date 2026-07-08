import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData, NodeStatus, StageId } from "../workflow/types";
import { NodeTooltip } from "./NodeTooltip";
import { useCanvasStore } from "../store/canvasStore";
import { useMetadataStore } from "../store/metadataStore";
import { useTaskStore } from "../store/taskStore";

/** 状态对应的颜色和文字 */
const STATUS_STYLES: Record<NodeStatus, { dot: string; ring: string; label: string }> = {
  idle: { dot: "bg-mpt-muted", ring: "border-mpt-border", label: "待运行" },
  running: { dot: "bg-mpt-gold animate-pulse", ring: "border-mpt-gold", label: "运行中" },
  success: { dot: "bg-green-500", ring: "border-green-500/50", label: "完成" },
  error: { dot: "bg-mpt-red", ring: "border-mpt-red", label: "失败" },
};

/** 阶段中文名 */
const STAGE_NAMES: Record<StageId, string> = {
  script: "脚本生成",
  terms: "关键词生成",
  audio: "配音生成",
  subtitle: "字幕生成",
  materials: "素材获取",
  render: "视频合成",
};

/**
 * 通用节点外壳：所有阶段节点共用这个布局。
 *
 * 结构：左侧输入 Handle → 标题栏（状态灯 + 阶段名 + 运行按钮）→ 产物预览 → 右侧输出 Handle
 * 悬停时显示 NodeTooltip（通过 onMouseEnter/Leave + 全局 meta 查找）。
 */
function NodeShellInner({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as FlowNodeData;
  const status = nodeData.status;
  const style = STATUS_STYLES[status];
  const [hovered, setHovered] = useState(false);

  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);
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

  // 产物预览（只显示前 60 字）
  const outputEntries = Object.entries(nodeData.outputs || {});
  const previewOutput = (val: unknown): string => {
    if (typeof val === "string") return val.length > 60 ? val.slice(0, 60) + "..." : val;
    if (Array.isArray(val)) return `[${val.length} 项]`;
    return JSON.stringify(val).slice(0, 60);
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

      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
        <span className="text-sm font-semibold text-white">
          {STAGE_NAMES[nodeData.stageId]}
        </span>
        <button
          onClick={handleRun}
          disabled={status === "running" || isRunning}
          className="ml-auto rounded bg-mpt-teal px-2 py-0.5 text-xs font-medium text-white hover:bg-mpt-teal/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "running" ? "..." : "运行"}
        </button>
      </div>

      {/* 状态行 */}
      <div className="px-3 pb-1">
        <span className="font-mono text-xs text-mpt-muted">{style.label}</span>
      </div>

      {/* 产物预览 */}
      {outputEntries.length > 0 && (
        <div className="border-t border-mpt-border px-3 py-2">
          <div className="mb-1 font-mono text-xs text-mpt-teal">产物</div>
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

      {/* 错误信息 */}
      {status === "error" && nodeData.error && (
        <div className="border-t border-mpt-red/30 bg-mpt-red/10 px-3 py-1.5">
          <p className="text-xs text-mpt-red break-all">{nodeData.error}</p>
        </div>
      )}

      {/* 输出 Handle（右侧） */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const NodeShell = memo(NodeShellInner);
