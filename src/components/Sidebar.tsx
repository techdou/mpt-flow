import { useTranslation } from "react-i18next";
import type { DragEvent, KeyboardEvent } from "react";
import type { StageId } from "../workflow/types";
import { STAGE_ORDER, STAGE_HINTS } from "../workflow/metadata";
import { useCanvasStore } from "../store/canvasStore";
import { StageIcon } from "./StageIcon";
import { stageColor } from "../workflow/stageVisuals";

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

  const onKeyDown = (e: KeyboardEvent, stageId: StageId) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const count = useCanvasStore.getState().nodes.length;
    addStageNode(stageId, {
      x: (count % 5) * 60,
      y: Math.floor(count / 5) * 80,
    });
  };

  const shortName = (stageId: StageId): string => {
    const text = STAGE_HINTS[stageId].what[lang];
    return text.split("，")[0].split("。")[0].split(",")[0].split(".")[0];
  };

  return (
    <div className="flex w-56 flex-col border-r border-mpt-border bg-mpt-panel">
      <div className="border-b border-mpt-border px-4 py-3">
        <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-mpt-teal">
          {t("sidebar.title")}
        </h2>
        <p className="mt-1 text-xs text-mpt-muted">{t("sidebar.subtitle")}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {STAGE_ORDER.map((stageId) => (
          <div
            key={stageId}
            draggable
            onDragStart={(e) => onDragStart(e, stageId)}
            onKeyDown={(e) => onKeyDown(e, stageId)}
            tabIndex={0}
            role="button"
            aria-label={t("sidebar.addNode", { name: shortName(stageId) })}
            className="group cursor-grab rounded-lg border border-mpt-border bg-mpt-elevated p-3 transition-all hover:-translate-y-0.5 hover:border-mpt-teal/50 hover:shadow-md focus:border-mpt-teal focus:outline-none focus:ring-1 focus:ring-mpt-teal active:cursor-grabbing"
            style={{ borderLeft: `3px solid ${stageColor(stageId)}` }}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mpt-dark">
                <StageIcon stageId={stageId} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-mpt-foreground group-hover:text-mpt-teal">
                  {t(`node.stageName.${stageId}`)}
                </div>
                <div className="font-mono text-[10px] text-mpt-muted">{stageId}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
