import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";

/**
 * 自定义连线组件：在贝塞尔曲线中点显示一个 × 删除按钮。
 *
 * 鼠标悬停连线或按钮时按钮才显示（避免画布上满是 ×）。
 * 点击 × 调 canvasStore.deleteEdge 删除。
 *
 * React Flow 默认的 Backspace 删除仍然有效，这只是额外的可视化入口。
 */
function DeletableEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [visible, setVisible] = useState(false);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* 连线本身：鼠标悬停时高亮 */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: visible ? "#087f8c" : "#30363d",
          strokeWidth: visible ? 2.5 : 2,
        }}
      />
      {/* 不可见的粗命中区域：覆盖整条连线，让鼠标在线上任意位置都能触发显示 × 按钮 */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ pointerEvents: "stroke", cursor: "pointer" }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteEdge(id);
            }}
            className={`flex h-5 w-5 items-center justify-center rounded-full border border-mpt-border bg-mpt-panel text-xs text-mpt-red transition-opacity hover:bg-mpt-red hover:text-white ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            title="删除连线"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const DeletableEdge = memo(DeletableEdgeInner);

