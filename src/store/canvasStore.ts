import { create } from "zustand";
import {
  type Edge,
  type Node,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import type { FlowNodeData, NodeStatus, StageId } from "../workflow/types";
import { useSettingsStore } from "./settingsStore";
import { getSelectDefaults } from "../workflow/stageParams";

/**
 * 画布状态管理（Zustand）。
 *
 * 职责：
 *   - 维护 React Flow 的 nodes / edges（受控模式）
 *   - 维护当前选中的节点（驱动右侧 InspectorPanel）
 *   - 提供 updateNodeData 动作：单阶段触发后更新节点状态/产物
 *
 * 不在这里管"运行节点"的异步逻辑（那在 taskStore + workflow engine 里），
 * 这里只管画布结构。
 */

interface CanvasState {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  /** 最近添加的节点 id（FlowCanvas watch 它触发 fitView，让键盘添加的节点可见） */
  lastAddedNodeId: string | null;
  /** 模板加载触发器，递增时 FlowCanvas 对全画布 fitView */
  fitViewTrigger: number;

  setNodes: (nodes: Node<FlowNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNode: (id: string | null) => void;

  /** 更新某个节点的 data 字段（合并式） */
  updateNodeData: (id: string, patch: Partial<FlowNodeData>) => void;

  /** 在画布上添加一个新节点 */
  addStageNode: (stageId: StageId, position: { x: number; y: number }) => string;

  /** 删除指定节点（同时删除连到它的边） */
  deleteNode: (id: string) => void;

  /** 删除指定连线 */
  deleteEdge: (id: string) => void;

  /** 加载预设模板（替换整个画布） */
  loadTemplate: (nodes: Node<FlowNodeData>[], edges: Edge[]) => void;

  /** 清空画布 */
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  lastAddedNodeId: null,
  fitViewTrigger: 0,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes as unknown as Node[]) as unknown as Node<FlowNodeData>[] }),

  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection: Connection) =>
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) }),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  updateNodeData: (id, patch) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
      ),
    }),

  addStageNode: (stageId, position) => {
    const id = `${stageId}-${Date.now()}`;
    // 新建节点时注入默认参数：settingsStore 的用户预设 + select 的 options[0] 兜底
    const settingsState = useSettingsStore.getState();
    const userDefaults = settingsState.defaultParams[stageId] || {};
    const selectDefaults = getSelectDefaults(stageId);
    const initialParams = { ...selectDefaults, ...userDefaults };

    const newNode: Node<FlowNodeData> = {
      id,
      type: "stage",
      position,
      data: {
        stageId,
        status: "idle" as NodeStatus,
        outputs: {},
        params: initialParams,
      },
    };
    set({ nodes: [...get().nodes, newNode], lastAddedNodeId: id });
    return id;
  },

  deleteNode: (id) =>
    set({
      // 删节点的同时，删掉所有连到它的边（source 或 target 是它）
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    }),

  deleteEdge: (id) => set({ edges: get().edges.filter((e) => e.id !== id) }),

  loadTemplate: (nodes, edges) => set((state) => ({ nodes, edges, selectedNodeId: null, lastAddedNodeId: null, fitViewTrigger: state.fitViewTrigger + 1 })),

  clearCanvas: () => set({ nodes: [], edges: [], selectedNodeId: null, lastAddedNodeId: null }),
}));
