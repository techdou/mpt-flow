import { create } from "zustand";
import { useCanvasStore } from "./canvasStore";
import { collectUpstreamParams } from "../workflow/engine";
import { runStage } from "../api/stage";
import type { FlowNodeData, StageId } from "../workflow/types";
import type { Node } from "@xyflow/react";

/**
 * 任务运行状态管理。
 *
 * 职责：
 *   - runNode: 触发某个节点的单阶段执行
 *   - 收集上游产物 → 组装请求体 → 调 API → 更新节点状态/产物
 *   - 维护一个共享的 taskId（同一画布上所有节点共用，跨阶段复用 manifest）
 *
 * 流程：
 *   1. 从 canvasStore 拿到当前画布的 nodes/edges
 *   2. BFS 收集目标节点的所有上游产物
 *   3. 合并节点自身的 params（用户在 InspectorPanel 填的）
 *   4. 带上共享 taskId（如果有）调 POST /stage/{stageId}
 *   5. 成功：更新节点 status=success + outputs；失败：status=error + error 信息
 */

interface TaskState {
  /** 当前工作流的共享 task_id，首次运行某节点时由后端生成 */
  sharedTaskId: string | null;
  /** 是否有节点正在运行（用于禁用其他节点的运行按钮，防止并发 task_id 分裂） */
  isRunning: boolean;

  runNode: (nodeId: string) => Promise<void>;
  resetTaskId: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  sharedTaskId: null,
  isRunning: false,

  resetTaskId: () => set({ sharedTaskId: null }),

  runNode: async (nodeId: string) => {
    // 防并发：已有节点在运行时拒绝新请求，避免 task_id 分裂。
    if (get().isRunning) return;

    const canvas = useCanvasStore.getState();
    const node = canvas.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    set({ isRunning: true });

    const stageId = node.data.stageId as StageId;
    const { updateNodeData } = canvas;

    // 标记运行中
    updateNodeData(nodeId, { status: "running", error: undefined });

    try {
      // 收集上游产物
      const upstreamParams = collectUpstreamParams(
        nodeId,
        canvas.nodes,
        canvas.edges
      );

      // 合并节点自身的 params（用户填的 video_subject 等）
      // 上游产物优先级低于用户显式填的参数
      const payload: Record<string, unknown> = {
        ...upstreamParams,
        ...node.data.params,
      };

      // 带上共享 taskId（跨阶段复用后端 manifest）
      const sharedTaskId = get().sharedTaskId;
      if (sharedTaskId) {
        payload.task_id = sharedTaskId;
      }

      // 调 API
      const result = await runStage(stageId, payload);

      // 记录 task_id（首次运行后固定下来）
      if (!get().sharedTaskId && result.task_id) {
        set({ sharedTaskId: result.task_id });
      }

      // 更新节点产物
      updateNodeData(nodeId, {
        status: "success",
        outputs: result.outputs || {},
        taskId: result.task_id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      updateNodeData(nodeId, { status: "error", error: message });
    } finally {
      set({ isRunning: false });
    }
  },
}));
