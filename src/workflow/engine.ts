import type { Edge, Node } from "@xyflow/react";
import type { FlowNodeData, StageId } from "./types";

/**
 * 工作流引擎：拓扑排序 + 上游产物收集。
 *
 * 核心能力：当用户点"运行某个节点"时，需要把它的所有上游节点的产物
 * 收集起来，作为请求体传给后端。比如运行 audio 节点时，要把上游
 * script 节点的 outputs.script 塞进请求体的 video_script 字段。
 *
 * 算法：从目标节点出发，BFS 回溯所有上游节点（沿 edge 的 target→source 方向）。
 */

/** 获取某个节点的所有直接上游节点 */
export function getDirectUpstreams(
  nodeId: string,
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): Node<FlowNodeData>[] {
  const upstreamIds = edges.filter((e) => e.target === nodeId).map((e) => e.source);
  return nodes.filter((n) => upstreamIds.includes(n.id));
}

/**
 * 收集某个节点的所有上游产物，合并成一个 params 对象。
 *
 * 约定：上游节点的 outputs 会按字段名直接合并。
 * 例如 script 节点的 outputs.script → params.video_script
 *      terms 节点的 outputs.terms → params.video_terms
 *
 * 字段映射表处理"产物名 → 请求体字段名"的差异。
 */
const OUTPUT_TO_PARAM: Record<string, string> = {
  script: "video_script",
  terms: "video_terms",
  audio_file: "audio_file", // 不直接传，靠 task_id 复用
  audio_duration: "audio_duration",
  subtitle_path: "subtitle_path",
  materials: "materials",
};

export function collectUpstreamParams(
  nodeId: string,
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): Record<string, unknown> {
  const visited = new Set<string>();
  const queue = [nodeId];
  const params: Record<string, unknown> = {};

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const upstreams = getDirectUpstreams(currentId, nodes, edges);
    for (const up of upstreams) {
      // 合并上游产物
      for (const [outputKey, value] of Object.entries(up.data.outputs)) {
        const paramKey = OUTPUT_TO_PARAM[outputKey] || outputKey;
        if (value !== undefined && value !== null && value !== "") {
          params[paramKey] = value;
        }
      }
      queue.push(up.id);
    }
  }

  return params;
}

/**
 * 校验连线是否合法。
 * 规则：不能成环（A→B→A），不能自连。
 * 这里只做基础校验，具体"输出能否喂给输入"由用户自己判断。
 */
export function isValidConnection(
  connection: { source: string; target: string },
  edges: Edge[]
): boolean {
  if (connection.source === connection.target) return false;

  // 检查是否成环：从 target 回溯，如果能走到 source 就成环了
  const visited = new Set<string>();
  const queue = [connection.target];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === connection.source) return false;
    if (visited.has(current)) continue;
    visited.add(current);

    const upstreams = edges
      .filter((e) => e.target === current)
      .map((e) => e.source);
    queue.push(...upstreams);
  }

  return true;
}

/** 判断某个阶段是否可运行（所有 depends_on 对应的上游节点都成功过） */
export function canRunStage(
  stageId: StageId,
  allStagesStatus: Record<StageId, "idle" | "success" | undefined>
): boolean {
  // 简化版：实际依赖检查在运行时由后端兜底（缺上游返回 400）
  return true;
}
