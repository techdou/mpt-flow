import type { StageId } from "./types";

/**
 * 每个阶段的视觉身份：颜色 + SVG 图标。
 * 用于节点卡片、侧栏、MiniMap、tooltip 的统一视觉编码。
 */

export interface StageVisual {
  /** 主色，用于颜色条/图标/MiniMap */
  color: string;
  /** SVG path（24x24 viewBox，stroke 风格） */
  iconPath: string;
}

export const STAGE_VISUALS: Record<StageId, StageVisual> = {
  script: {
    color: "#e83d3d",
    // 文档/笔
    iconPath:
      "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  },
  terms: {
    color: "#087f8c",
    // 搜索
    iconPath:
      "M21 21l-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
  },
  audio: {
    color: "#d99a00",
    // 波形
    iconPath:
      "M3 12h2l2-6 4 12 2-6h2M17 12h4",
  },
  subtitle: {
    color: "#8b5cf6",
    // 对话框
    iconPath:
      "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z",
  },
  materials: {
    color: "#a371f7",
    // 胶片
    iconPath:
      "M3 5h18v14H3V5zM7 5v3M7 16v3M17 5v3M17 16v3M3 9h18M3 15h18",
  },
  render: {
    color: "#3fb950",
    // 播放/显示器
    iconPath:
      "M2 4h20v14H2V4zM10 9l5 3-5 3V9z",
  },
};

/** 获取 stage 颜色的便捷方法 */
export function stageColor(stageId: StageId): string {
  return STAGE_VISUALS[stageId]?.color ?? "#087f8c";
}
