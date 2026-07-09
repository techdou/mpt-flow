import { STAGE_VISUALS } from "../workflow/stageVisuals";
import type { StageId } from "../workflow/types";

/**
 * 阶段 SVG 图标。
 * stroke 风格（24x24），颜色默认用 stage 主色。
 * 可通过 className 控制 size。
 */
export function StageIcon({
  stageId,
  className = "h-4 w-4",
  color,
}: {
  stageId: StageId;
  className?: string;
  color?: string;
}) {
  const visual = STAGE_VISUALS[stageId];
  const stroke = color ?? visual.color;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={visual.iconPath} />
    </svg>
  );
}
