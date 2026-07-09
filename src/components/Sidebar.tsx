import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "zh" | "en";
  const addStageNode = useCanvasStore((s) => s.addStageNode);

  const onDragStart = (e: DragEvent, stageId: StageId) => {
    e.dataTransfer.setData("application/stage", stageId);
    e.dataTransfer.effectAllowed = "move";
  };

  // 键盘添加：在画布中心附近放节点，用已有节点数做偏移避免重叠。
  // 位置不精确没关系——FlowCanvas 会 watch lastAddedNodeId 并 fitView 让它可见。
  const onKeyDown = (e: KeyboardEvent, stageId: StageId) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const count = useCanvasStore.getState().nodes.length;
    addStageNode(stageId, {
      x: (count % 5) * 60,
      y: Math.floor(count / 5) * 80,
    });
  };

  // 短名称 helper：取 hint.what 的第一句作为侧栏显示名
  const shortName = (stageId: StageId): string => {
    const text = STAGE_HINTS[stageId].what[lang];
    return text.split("，")[0].split("。")[0].split(",")[0].split(".")[0];
  };

  return (
    <div className="flex w-56 flex-col border-r border-mpt-border bg-mpt-dark">
      <div className="px-4 py-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-mpt-teal">
          {t("sidebar.title")}
        </h2>
        <p className="mt-1 text-xs text-mpt-muted">{t("sidebar.subtitle")}</p>
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
            aria-label={t("sidebar.addNode", { name: shortName(stageId) })}
            className="cursor-grab rounded-lg border border-mpt-border bg-mpt-panel p-3 transition-colors hover:border-mpt-teal focus:border-mpt-teal focus:outline-none focus:ring-1 focus:ring-mpt-teal active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{STAGE_ICONS[stageId]}</span>
              <div>
                <div className="text-sm font-medium text-white">
                  {shortName(stageId)}
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
