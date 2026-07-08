import type { DragEvent } from "react";
import type { StageId } from "../workflow/types";
import { STAGE_ORDER, STAGE_HINTS } from "../workflow/metadata";

const STAGE_ICONS: Record<StageId, string> = {
  script: "📝",
  terms: "🔍",
  audio: "🔊",
  subtitle: "💬",
  materials: "🎬",
  render: "🎞️",
};

/**
 * 左侧节点拖拽面板。
 *
 * 用户从这里把节点类型拖到画布上。使用 React Flow 的 DnD 约定：
 * onDragStart 时把 stageId 写到 dataTransfer，FlowCanvas 的 onDrop 时读取。
 */
export function Sidebar() {
  const onDragStart = (e: DragEvent, stageId: StageId) => {
    e.dataTransfer.setData("application/stage", stageId);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex w-56 flex-col border-r border-mpt-border bg-mpt-dark">
      <div className="px-4 py-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-mpt-teal">
          节点库
        </h2>
        <p className="mt-1 text-xs text-mpt-muted">拖到画布上添加</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {STAGE_ORDER.map((stageId) => (
          <div
            key={stageId}
            draggable
            onDragStart={(e) => onDragStart(e, stageId)}
            className="cursor-grab rounded-lg border border-mpt-border bg-mpt-panel p-3 transition-colors hover:border-mpt-teal active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{STAGE_ICONS[stageId]}</span>
              <div>
                <div className="text-sm font-medium text-white">
                  {STAGE_HINTS[stageId].what.split("，")[0].split("。")[0]}
                </div>
                <div className="font-mono text-xs text-mpt-muted">{stageId}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
