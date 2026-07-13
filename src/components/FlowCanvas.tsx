import { useCallback, useEffect, useRef, type DragEvent } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import { useTranslation } from "react-i18next";
import { useCanvasStore } from "../store/canvasStore";
import { isValidConnection } from "../workflow/engine";
import { NodeShell } from "./NodeShell";
import { DeletableEdge } from "./DeletableEdge";
import { stageColor } from "../workflow/stageVisuals";
import type { StageId, FlowNodeData } from "../workflow/types";

const nodeTypes: NodeTypes = {
  stage: NodeShell,
};

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
};

/**
 * 画布内容（必须在 ReactFlowProvider 内才能用 useReactFlow hook）。
 */
function CanvasInner() {
  const { t } = useTranslation();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    addStageNode,
    lastAddedNodeId,
    fitViewTrigger,
  } = useCanvasStore();
  const { screenToFlowPosition, fitView } = useReactFlow();

  const lastHandledNodeId = useRef<string | null>(null);
  useEffect(() => {
    if (lastAddedNodeId && lastAddedNodeId !== lastHandledNodeId.current) {
      lastHandledNodeId.current = lastAddedNodeId;
      // L2 修复：返回 cleanup 清理定时器，防止组件卸载后调用 fitView
      const timer = setTimeout(() => fitView({ nodes: [{ id: lastAddedNodeId }], duration: 300, maxZoom: 1.2 }), 50);
      return () => clearTimeout(timer);
    }
  }, [lastAddedNodeId, fitView]);

  // 模板加载后对全画布 fitView，让所有节点可见
  const lastFitTrigger = useRef(0);
  useEffect(() => {
    if (fitViewTrigger !== lastFitTrigger.current) {
      lastFitTrigger.current = fitViewTrigger;
      const timer = setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 50);
      return () => clearTimeout(timer);
    }
  }, [fitViewTrigger, fitView]);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const stageId = e.dataTransfer.getData("application/stage") as StageId;
      if (!stageId) return;
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
    <div className="relative h-full w-full">
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
          markerEnd: { type: MarkerType.ArrowClosed, color: "#087f8c", width: 16, height: 16 },
        }}
      >
        <Background color="var(--mpt-grid)" gap={24} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as unknown as FlowNodeData;
            return stageColor(data.stageId);
          }}
          nodeStrokeWidth={2}
          maskColor="var(--mpt-overlay)"
          style={{
            backgroundColor: "var(--mpt-panel)",
            border: "1px solid var(--mpt-border)",
            borderRadius: "8px",
          }}
        />
      </ReactFlow>

      {/* 空状态引导 */}
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-fade-in text-center">
            <div className="mb-3 flex justify-center gap-2 opacity-30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#087f8c" strokeWidth="1.5">
                <path d="M9 11l3 3 8-8M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-mpt-muted">{t("app.emptyHint")}</p>
            <p className="mt-1 text-xs text-mpt-muted/60">{t("app.emptyHintSub")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function FlowCanvas() {
  return (
    <div className="h-full flex-1">
      <ReactFlowProvider>
        <CanvasInner />
      </ReactFlowProvider>
    </div>
  );
}
