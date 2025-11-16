import React, { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { RoadmapNode as RoadmapNodeType } from "@/store/roadmap/types";
import RoadmapNodeComponent from "./RoadmapNode";
import NodeContextMenu from "./NodeContextMenu";

interface RoadmapTreeProps {
  nodes: RoadmapNodeType[];
  roadmapId: string;
}

const nodeTypes = {
  roadmapNode: RoadmapNodeComponent,
};

// Layout constants
const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 150;

const RoadmapTreeContent: React.FC<RoadmapTreeProps> = ({ nodes: roadmapNodes }) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: RoadmapNodeType;
  } | null>(null);

  // Build hierarchical structure
  const { nodes, edges } = useMemo(() => {
    if (!roadmapNodes || roadmapNodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Group nodes by parent
    const nodesByParent = new Map<string | null, RoadmapNodeType[]>();
    roadmapNodes.forEach((node) => {
      const parentId = node.parent_node_id;
      if (!nodesByParent.has(parentId)) {
        nodesByParent.set(parentId, []);
      }
      nodesByParent.get(parentId)!.push(node);
    });

    // Calculate positions using hierarchical layout
    const positionedNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();

    const layoutNode = (
      node: RoadmapNodeType,
      depth: number,
      siblingIndex: number,
      siblingCount: number,
      parentX?: number
    ) => {
      const children = nodesByParent.get(node.public_id) || [];
      const totalWidth = siblingCount * (NODE_WIDTH + HORIZONTAL_SPACING);
      const startX = parentX !== undefined
        ? parentX - (totalWidth / 2) + (NODE_WIDTH / 2)
        : 0;

      const x = startX + siblingIndex * (NODE_WIDTH + HORIZONTAL_SPACING);
      const y = depth * (NODE_HEIGHT + VERTICAL_SPACING);

      nodePositions.set(node.public_id, { x, y });

      positionedNodes.push({
        id: node.public_id,
        type: "roadmapNode",
        position: { x, y },
        data: { node },
      });

      // Layout children
      children.forEach((child, index) => {
        flowEdges.push({
          id: `${node.public_id}-${child.public_id}`,
          source: node.public_id,
          target: child.public_id,
          type: "smoothstep",
          animated: child.status === 1, // Animate if in progress
          style: {
            stroke: child.status === 2 ? "#22c55e" : child.status === 1 ? "#3b82f6" : "#94a3b8",
            strokeWidth: 2,
          },
        });

        layoutNode(child, depth + 1, index, children.length, x);
      });
    };

    // Start with root nodes (no parent)
    const rootNodes = nodesByParent.get(null) || [];
    rootNodes.forEach((rootNode, index) => {
      layoutNode(rootNode, 0, index, rootNodes.length);
    });

    return { nodes: positionedNodes, edges: flowEdges };
  }, [roadmapNodes]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const roadmapNode = node.data.node as RoadmapNodeType;

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        node: roadmapNode,
      });
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No nodes in this roadmap</p>
      </div>
    );
  }

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
        />
      </ReactFlow>

      {contextMenu && (
        <NodeContextMenu
          node={contextMenu.node}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
        />
      )}
    </>
  );
};

const RoadmapTree: React.FC<RoadmapTreeProps> = (props) => {
  return (
    <ReactFlowProvider>
      <RoadmapTreeContent {...props} />
    </ReactFlowProvider>
  );
};

export default RoadmapTree;
