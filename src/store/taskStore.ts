import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCanvasStore } from "./canvasStore";
import { collectUpstreamParams } from "../workflow/engine";
import { runStage } from "../api/stage";
import { getSelectDefaults } from "../workflow/stageParams";
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
 * 竞态保护（H1 修复）：
 *   runNode 是长异步流程（render 可能数分钟）。运行期间用户可能加载
 *   模板/清空画布导致节点被删除。await 之后必须检查：
 *   1. 节点是否还存在（被删了就丢弃结果）
 *   2. 用 runGeneration 计数器区分"我这次运行"和"之后的运行"
 *   sharedTaskId 只在当前 generation 仍然有效时才写入。
 */

interface TaskState {
  /** 当前工作流的共享 task_id，首次运行某节点时由后端生成 */
  sharedTaskId: string | null;
  /** 是否有节点正在运行（用于禁用其他节点的运行按钮，防止并发 task_id 分裂） */
  isRunning: boolean;
  /** 运换代数：每次 resetTaskId/runNode 递增，用于检测 await 期间画布是否已变 */
  runGeneration: number;

  runNode: (nodeId: string) => Promise<void>;
  resetTaskId: () => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      sharedTaskId: null,
      isRunning: false,
      runGeneration: 0,

      resetTaskId: () =>
        set((state) => ({
          sharedTaskId: null,
          runGeneration: state.runGeneration + 1,
        })),

      runNode: async (nodeId: string) => {
        // 防并发：已有节点在运行时拒绝新请求，避免 task_id 分裂。
        if (get().isRunning) return;

        const canvas = useCanvasStore.getState();
        const node = canvas.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const { updateNodeData } = canvas;
        const stageId = node.data.stageId as StageId;

        // 记录本次运行的 generation，await 后用来检测画布是否已变
        const myGeneration = get().runGeneration;

        set({ isRunning: true });
        updateNodeData(nodeId, {
          status: "running",
          error: undefined,
          progress: undefined,
          elapsedSeconds: 0,
        });

        const startTime = Date.now();
        const elapsedTimer = setInterval(() => {
          // 计时器也要检查节点是否还在（用户可能删了它）
          const exists = useCanvasStore.getState().nodes.some((n) => n.id === nodeId);
          if (exists) {
            updateNodeData(nodeId, { elapsedSeconds: Math.floor((Date.now() - startTime) / 1000) });
          }
        }, 1000);

        try {
          // 重新读取最新的 nodes/edges（画布可能已变）
          const latestCanvas = useCanvasStore.getState();
          const upstreamParams = collectUpstreamParams(
            nodeId,
            latestCanvas.nodes,
            latestCanvas.edges
          );

          // 合并节点参数 + 注入 select 默认值兜底（M1 修复：模板节点 params 可能是空的）
          const selectDefaults = getSelectDefaults(stageId);
          const effectiveParams = { ...selectDefaults, ...latestCanvas.nodes.find((n) => n.id === nodeId)?.data.params };

          const payload: Record<string, unknown> = {
            ...upstreamParams,
            ...effectiveParams,
          };

          const sharedTaskId = get().sharedTaskId;
          if (sharedTaskId) {
            payload.task_id = sharedTaskId;
          }

          const result = await runStage(stageId, payload);

          // === 竞态保护（H1 修复）===
          // await 期间画布可能已被清空/换模板，需要检查：
          // 1. 当前 generation 是否还有效（resetTaskId 会递增 generation）
          // 2. 节点是否还存在
          if (myGeneration !== get().runGeneration) return; // 画布已变，丢弃结果

          const stillExists = useCanvasStore.getState().nodes.some((n) => n.id === nodeId);
          if (!stillExists) return; // 节点被删了，丢弃结果

          // 只在当前 generation 仍然有效时才写 sharedTaskId，防止污染新画布
          if (!get().sharedTaskId && result.task_id && myGeneration === get().runGeneration) {
            set({ sharedTaskId: result.task_id });
          }

          updateNodeData(nodeId, {
            status: "success",
            outputs: result.outputs || {},
            taskId: result.task_id,
            progress: 100,
          });
        } catch (err) {
          // 错误也要检查竞态
          if (myGeneration !== get().runGeneration) return;
          const stillExists = useCanvasStore.getState().nodes.some((n) => n.id === nodeId);
          if (!stillExists) return;

          const message = err instanceof Error ? err.message : String(err);
          updateNodeData(nodeId, {
            status: "error",
            error: message,
            outputs: {}, // M4 修复：失败时清空旧产物，防止下游收集到过期数据
          });
        } finally {
          clearInterval(elapsedTimer);
          // 只有当前 generation 的运行才解锁，防止错误的 unlock
          if (myGeneration === get().runGeneration) {
            set({ isRunning: false });
          }
        }
      },
    }),
    {
      name: "mpt-task",
      partialize: (state) => ({ sharedTaskId: state.sharedTaskId }), // C 修复：只持久化 sharedTaskId
    }
  )
);
