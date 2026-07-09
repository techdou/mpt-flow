import type { Edge, Node } from "@xyflow/react";
import type { FlowNodeData, StageId } from "./types";

/** 创建一个初始状态的节点 */
function makeNode(stageId: StageId, x: number, y: number): Node<FlowNodeData> {
  return {
    id: stageId,
    type: "stage",
    position: { x, y },
    data: {
      stageId,
      status: "idle",
      outputs: {},
      params: {},
    },
  };
}

/** 连线辅助 */
function makeEdge(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    animated: true,
  };
}

export interface Template {
  id: string;
  /** i18n key 前缀，完整 key 为 templates.<id>.name / .description */
  nameKey: string;
  descKey: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
}

/**
 * 预设模板。
 *
 * 每个模板定义一组节点 + 连线 + 布局，用户从工具栏一键加载。
 * 选了模板后用户仍可增删节点（不锁定）。
 * 模板名和描述走 i18n（templates.<id>.name / .description）。
 */
export const TEMPLATES: Template[] = [
  {
    id: "full",
    nameKey: "templates.full.name",
    descKey: "templates.full.description",
    nodes: [
      makeNode("script", 0, 200),
      makeNode("terms", 280, 100),
      makeNode("audio", 280, 300),
      makeNode("subtitle", 560, 300),
      makeNode("materials", 560, 100),
      makeNode("render", 840, 200),
    ],
    edges: [
      makeEdge("script", "terms"),
      makeEdge("script", "audio"),
      makeEdge("terms", "materials"),
      makeEdge("audio", "materials"),
      makeEdge("audio", "subtitle"),
      makeEdge("materials", "render"),
      makeEdge("audio", "render"),
      makeEdge("subtitle", "render"),
    ],
  },
  {
    id: "script-only",
    nameKey: "templates.script-only.name",
    descKey: "templates.script-only.description",
    nodes: [makeNode("script", 100, 200), makeNode("terms", 400, 200)],
    edges: [makeEdge("script", "terms")],
  },
  {
    id: "audio-subtitle",
    nameKey: "templates.audio-subtitle.name",
    descKey: "templates.audio-subtitle.description",
    nodes: [
      makeNode("script", 0, 200),
      makeNode("audio", 300, 150),
      makeNode("subtitle", 600, 250),
    ],
    edges: [makeEdge("script", "audio"), makeEdge("audio", "subtitle")],
  },
];
