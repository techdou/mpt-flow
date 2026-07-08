import { create } from "zustand";
import { useCanvasStore } from "./canvasStore";
import { collectUpstreamParams } from "../workflow/engine";
import { runStage } from "../api/stage";
import type { FlowNodeData, StageId } from "../workflow/types";

/**
 * 任务运行状态管理。
 *
 * 职责：
 *   - runNode: 触发某个节点的单阶段执行
 *   - 收集上游产物 → 组装请求体 → 调 API → 更新节点状态/产物
 *   - 维护一个共享的 taskId（同一画布上所有节点共用，跨阶段复用 manifest）
 *   - 运行时显示已用时间计时器
 *
 * 关于"运行进度"的设计说明（诚实原则）：
 *   后端 /stage/* 端点是阻塞式的——要等整个阶段跑完才返回。
 *   没有 SSE / WebSocket 推送中间进度，所以"运行中实时进度百分比"在
 *   当前架构下无法真实获取。之前用 setInterval 轮询 GET /tasks/{id}
 *   有两个致命问题：(1) 首次运行时 sharedTaskId 还没拿到，轮询的是 null；
 *   (2) 就算拿到了，后端 POST /stage 要等跑完才返回，轮询到的 task 在
 *   阶段结束前可能根本不存在于 state 里（stage 端点先跑完才 update_task）。
 *   所以这里去掉假进度轮询，只保留真实的耗时计时器。进度条用
 *   indeterminate 动画表示"运行中但不显示假百分比"。
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

    const { updateNodeData } = canvas;
    const stageId = node.data.stageId as StageId;

    set({ isRunning: true });
    updateNodeData(nodeId, {
      status: "running",
      error: undefined,
      progress: undefined,
      elapsedSeconds: 0,
    });

    // 耗时计时器（同步回调，无竞态风险，finally 里 clearInterval 即可）
    const startTime = Date.now();
    const elapsedTimer = setInterval(() => {
      updateNodeData(nodeId, { elapsedSeconds: Math.floor((Date.now() - startTime) / 1000) });
    }, 1000);

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

      // 调 API（阻塞，等阶段跑完才返回）
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
        progress: 100,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      updateNodeData(nodeId, { status: "error", error: message });
    } finally {
      clearInterval(elapsedTimer);
      set({ isRunning: false });
    }
  },
}));
