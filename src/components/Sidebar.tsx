import type { DragEvent, KeyboardEvent } from "react";
import type { StageId } from "../workflow/types";
import { STAGE_ORDER, STAGE_HINTS } from "../workflow/metadata";
import { useCanvasStore } from "../store/canvasStore";

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
 * 两种添加方式：
 *   - 鼠标：拖拽到画布指定位置（onDragStart 写 dataTransfer）
 *   - 键盘：聚焦后按 Enter/Space，在画布中心附近添加（无障碍可达）
 */
export function Sidebar() {
  const addStageNode = useCanvasStore((s) => s.addStageNode);

  const onDragStart = (e: DragEvent, stageId: StageId) => {
    e.dataTransfer.setData("application/stage", stageId);
    e.dataTransfer.effectAllowed = "move";
  };

  // 键盘添加：在画布中心附近放节点，用已有节点数做偏移避免重叠。
  const onKeyDown = (e: KeyboardEvent, stageId: StageId) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const count = useCanvasStore.getState().nodes.length;
    addStageNode(stageId, {
      x: 200 + (count % 5) * 50,
      y: 150 + Math.floor(count / 5) * 80,
    });
  };

  return (
    <div className="flex w-56 flex-col border-r border-mpt-border bg-mpt-dark">
      <div className="px-4 py-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-mpt-teal">
          节点库
        </h2>
        <p className="mt-1 text-xs text-mpt-muted">拖到画布或按回车添加</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {STAGE_ORDER.map((stageId) => (
          <div
            key={stageId}
            draggable
            onDragStart={(e) => onDragStart(e, stageId)}
            onKeyDown={(e) => onKeyDown(e, stageId)}
            tabIndex={0}
            role="button"
            aria-label={`添加${STAGE_HINTS[stageId].what.split("，")[0]}节点`}
            className="cursor-grab rounded-lg border border-mpt-border bg-mpt-panel p-3 transition-colors hover:border-mpt-teal focus:border-mpt-teal focus:outline-none focus:ring-1 focus:ring-mpt-teal active:cursor-grabbing"
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
