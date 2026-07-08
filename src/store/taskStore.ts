import { create } from "zustand";
import { useCanvasStore } from "./canvasStore";
import { collectUpstreamParams } from "../workflow/engine";
import { runStage, getTaskState } from "../api/stage";
import type { FlowNodeData, StageId } from "../workflow/types";
import type { Node } from "@xyflow/react";

/**
 * 任务运行状态管理。
 *
 * 职责：
 *   - runNode: 触发某个节点的单阶段执行
 *   - 收集上游产物 → 组装请求体 → 调 API → 更新节点状态/产物
 *   - 维护一个共享的 taskId（同一画布上所有节点共用，跨阶段复用 manifest）
 *   - 长耗时阶段（audio/materials/render）运行时轮询后端进度，更新节点显示
 *
 * 进度轮询原理：
 *   runStage 是阻塞 await 的。对长耗时阶段，在 await 期间并行起一个
 *   setInterval 轮询 GET /tasks/{taskId} 的 progress 字段，更新到
 *   node.data.progress。API 返回后清除 interval。
 */

/** 需要进度轮询的长耗时阶段（这些走 tm.start，后端会更新 progress） */
const PROGRESS_STAGES: StageId[] = ["audio", "subtitle", "materials", "render"];

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

    // 耗时计时器（所有阶段都显示已用时间）
    const startTime = Date.now();
    const elapsedTimer = setInterval(() => {
      updateNodeData(nodeId, { elapsedSeconds: Math.floor((Date.now() - startTime) / 1000) });
    }, 1000);

    // 进度轮询器（仅长耗时阶段）
    let progressTimer: ReturnType<typeof setInterval> | null = null;
    const sharedTaskId = get().sharedTaskId;
    if (PROGRESS_STAGES.includes(stageId) && sharedTaskId) {
      progressTimer = setInterval(async () => {
        try {
          const taskState = await getTaskState(sharedTaskId);
          if (typeof taskState.progress === "number") {
            updateNodeData(nodeId, { progress: taskState.progress });
          }
        } catch {
          // 轮询失败静默忽略，不打断主流程
        }
      }, 3000);
    }

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
        progress: 100,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      updateNodeData(nodeId, { status: "error", error: message });
    } finally {
      clearInterval(elapsedTimer);
      if (progressTimer) clearInterval(progressTimer);
      set({ isRunning: false });
    }
  },
}));
