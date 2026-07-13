import type { Edge, Node } from "@xyflow/react";
import type { FlowNodeData, StageId } from "./types";

/**
 * 工作流引擎：拓扑排序 + 上游产物收集 + 依赖检查 + 连线校验。
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
 * 产物名 → 请求体字段名 的映射。
 * script → video_script, terms → video_terms 等。
 */
const OUTPUT_TO_PARAM: Record<string, string> = {
  script: "video_script",
  terms: "video_terms",
  audio_duration: "audio_duration",
  subtitle_path: "subtitle_path",
  materials: "materials",
};

/**
 * 收集某个节点的所有上游产物，合并成一个 params 对象。
 *
 * M4 修复：只收集 status === "success" 的上游节点产物，
 * 跳过 error/idle/running 状态的节点，避免用过期或失败的数据。
 */
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
      // M4 修复：跳过非 success 状态的上游，避免收集过期/失败产物
      if (up.data.status !== "success") {
        queue.push(up.id);
        continue;
      }
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
 * 各阶段的运行时依赖检查（B 修复）。
 *
 * 返回未满足的依赖描述列表。空数组 = 可以运行。
 * 用于运行前预检查，避免后端返回不友好的 400/422 错误。
 */
export function checkDependencies(
  nodeId: string,
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): { stageId: StageId; missing: string[] } {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return { stageId: "script" as StageId, missing: ["node not found"] };

  const stageId = node.data.stageId as StageId;
  const upstreams = getDirectUpstreams(nodeId, nodes, edges);
  const upstreamStages = new Set(upstreams.map((n) => n.data.stageId as StageId));
  const upstreamSuccess = new Set(
    upstreams.filter((n) => n.data.status === "success").map((n) => n.data.stageId as StageId)
  );

  const missing: string[] = [];

  // 检查各阶段的前置条件
  switch (stageId) {
    case "terms":
    case "audio":
      // 需要 script 的产物（video_script）
      if (!upstreamSuccess.has("script")) {
        missing.push("script");
      }
      break;
    case "subtitle":
      if (!upstreamSuccess.has("audio")) {
        missing.push("audio");
      }
      break;
    case "materials":
      // 在线源需要 terms；所有源都需要 audio
      if (!upstreamSuccess.has("audio")) {
        missing.push("audio");
      }
      // terms 检查（local 源可跳过，但用户可能没改 source）
      const hasTermsUpstream = upstreamStages.has("terms");
      if (hasTermsUpstream && !upstreamSuccess.has("terms")) {
        missing.push("terms");
      }
      break;
    case "render":
      if (!upstreamSuccess.has("materials")) {
        missing.push("materials");
      }
      if (!upstreamSuccess.has("audio")) {
        missing.push("audio");
      }
      break;
  }

  return { stageId, missing };
}

/**
 * 校验连线是否合法。
 * 规则：不能成环（A→B→A），不能自连。
 */
export function isValidConnection(
  connection: { source: string; target: string },
  edges: Edge[]
): boolean {
  if (connection.source === connection.target) return false;

  const visited = new Set<string>();
  const queue = [connection.target];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === connection.source) return false;
    if (visited.has(current)) continue;
    visited.add(current);

    const downstreams = edges
      .filter((e) => e.source === current)
      .map((e) => e.target);
    queue.push(...downstreams);
  }

  return true;
}
