import { useCallback, useRef, type DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type Node,
} from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";
import { isValidConnection } from "../workflow/engine";
import { NodeShell } from "./NodeShell";
import type { StageId } from "../workflow/types";

// 注册节点类型：所有阶段节点都用 NodeShell 渲染
const nodeTypes: NodeTypes = {
  stage: NodeShell,
};

/**
 * React Flow 画布主体。
 *
 * 职责：
 *   - 渲染节点/边（从 canvasStore 取受控数据）
 *   - 处理 DnD 拖入新节点（从 Sidebar 拖来）
 *   - 处理连线校验（isValidConnection 防环）
 */
export function FlowCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    addStageNode,
  } = useCanvasStore();

  // 拖入新节点
  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const stageId = e.dataTransfer.getData("application/stage") as StageId;
      if (!stageId) return;

      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = {
        x: e.clientX - bounds.left - 100,
        y: e.clientY - bounds.top - 30,
      };
      addStageNode(stageId, position);
    },
    [addStageNode]
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div ref={wrapperRef} className="flex-1">
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
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onPaneClick={() => setSelectedNode(null)}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#30363d", strokeWidth: 2 },
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
    </div>
  );
}
