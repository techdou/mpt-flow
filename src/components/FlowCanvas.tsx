import { useCallback, useEffect, useRef, type DragEvent } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";
import { isValidConnection } from "../workflow/engine";
import { NodeShell } from "./NodeShell";
import { DeletableEdge } from "./DeletableEdge";
import type { StageId } from "../workflow/types";

// 注册节点/边类型：必须定义在组件外，否则每次 render 都创建新对象导致性能问题
const nodeTypes: NodeTypes = {
  stage: NodeShell,
};

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
};

/**
 * 画布内容（必须在 ReactFlowProvider 内才能用 useReactFlow hook）。
 * 拖拽落点用 screenToFlowPosition 换算，避免缩放/平移后错位。
 */
function CanvasInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    addStageNode,
    lastAddedNodeId,
  } = useCanvasStore();
  const { screenToFlowPosition, fitView } = useReactFlow();

  // 键盘添加节点后（lastAddedNodeId 变化），fitView 让新节点可见。
  // 拖拽添加不需要这个（落点已经是视口内位置）。用 ref 记录上次处理过的 id 避免重复 fit。
  const lastHandledNodeId = useRef<string | null>(null);
  useEffect(() => {
    if (lastAddedNodeId && lastAddedNodeId !== lastHandledNodeId.current) {
      lastHandledNodeId.current = lastAddedNodeId;
      // 短延迟等 React Flow 完成节点测量后再 fit
      setTimeout(() => fitView({ nodes: [{ id: lastAddedNodeId }], duration: 300, maxZoom: 1.2 }), 50);
    }
  }, [lastAddedNodeId, fitView]);

  // 拖入新节点
  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const stageId = e.dataTransfer.getData("application/stage") as StageId;
      if (!stageId) return;

      // screenToFlowPosition 把屏幕坐标换算成画布坐标，
      // 自动处理缩放和平移，避免手动 clientX - bounds.left 在缩放后错位。
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addStageNode(stageId, position);
    },
    [addStageNode, screenToFlowPosition]
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={(conn) => {
        if (isValidConnection(conn, edges)) {
          onConnect(conn);
        }
      }}
      isValidConnection={(conn) => isValidConnection(conn, edges)}
      onNodeClick={(_, node) => setSelectedNode(node.id)}
      onPaneClick={() => setSelectedNode(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        defaultEdgeOptions={{
          type: "deletable",
          animated: true,
        }}
    >
      <Background color="#21262d" gap={20} />
      <Controls />
      <MiniMap
        nodeColor={() => "#087f8c"}
        maskColor="rgba(15, 20, 25, 0.7)"
        style={{ backgroundColor: "#161b22" }}
      />
    </ReactFlow>
  );
}

/**
 * 画布外壳：用 ReactFlowProvider 包裹，让内部能用 useReactFlow hook。
 */
export function FlowCanvas() {
  return (
    <div className="flex-1">
      <ReactFlowProvider>
        <CanvasInner />
      </ReactFlowProvider>
    </div>
  );
}
