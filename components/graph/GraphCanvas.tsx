'use client';

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { GraphResponse } from '../../lib/api';
import { useGraphStore } from '../../store/useGraphStore';
import {
  filterGraphData,
  transformToReactFlowElements,
  WikiNodeData,
} from '../../lib/graph-transforms';
import { applyLayout } from '../../lib/layout-engine';
import { WikiCustomNode } from './WikiCustomNode';
import { ForceGraphCanvas } from './ForceGraphCanvas';

const nodeTypes = {
  wikiNode: WikiCustomNode,
};

interface GraphCanvasProps {
  graphData: GraphResponse;
  onSelectNode?: (nodeId: string | null) => void;
}

function InnerGraphCanvas({ graphData, onSelectNode }: GraphCanvasProps) {
  const {
    selectedNodeId,
    setSelectedNodeId,
    searchQuery,
    selectedFolder,
    selectedTag,
    hideOrphans,
    layoutAlgorithm,
    showLabels,
  } = useGraphStore();

  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<WikiNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const isInitialLayoutDone = useRef(false);

  // 1. Filter and transform graph data
  const { flowNodes, flowEdges } = useMemo(() => {
    const { filteredNodes, filteredEdges, unresolvedBySource } = filterGraphData(
      graphData,
      {
        searchQuery,
        selectedFolder,
        selectedTag,
        hideOrphans,
      }
    );

    const { flowNodes: rawNodes, flowEdges: rawEdges } = transformToReactFlowElements(
      filteredNodes,
      filteredEdges,
      unresolvedBySource,
      {
        selectedNodeId,
        searchQuery,
        showLabels,
      }
    );

    // Apply layout positions
    const laidOutNodes = applyLayout(rawNodes, rawEdges, layoutAlgorithm);

    return { flowNodes: laidOutNodes, flowEdges: rawEdges };
  }, [
    graphData,
    searchQuery,
    selectedFolder,
    selectedTag,
    hideOrphans,
    selectedNodeId,
    layoutAlgorithm,
    showLabels,
  ]);

  // 2. Synchronize React Flow states when calculated elements change
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);

    // Fit view on initial load or layout switch
    if (!isInitialLayoutDone.current && flowNodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 600 });
        isInitialLayoutDone.current = true;
      }, 50);
    }
  }, [flowNodes, flowEdges, setNodes, setEdges, reactFlowInstance]);

  // 3. Center on selected node when selectedNodeId changes
  useEffect(() => {
    if (selectedNodeId && reactFlowInstance) {
      const targetNode = flowNodes.find((n) => n.id === selectedNodeId);
      if (targetNode) {
        reactFlowInstance.setCenter(
          targetNode.position.x + 100,
          targetNode.position.y + 35,
          { zoom: 1.1, duration: 500 }
        );
      }
    }
  }, [selectedNodeId, reactFlowInstance, flowNodes]);

  // 4. Handle Node click
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const nextId = node.id === selectedNodeId ? null : node.id;
      setSelectedNodeId(nextId);
      if (onSelectNode) {
        onSelectNode(nextId);
      }
    },
    [selectedNodeId, setSelectedNodeId, onSelectNode]
  );

  // 5. Handle Pane (background) click -> Deselect
  const handlePaneClick = useCallback(() => {
    if (selectedNodeId) {
      setSelectedNodeId(null);
      if (onSelectNode) {
        onSelectNode(null);
      }
    }
  }, [selectedNodeId, setSelectedNodeId, onSelectNode]);

  return (
    <div className="w-full h-full relative bg-[#0a0d14]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls
          className="!bg-neutral-900/80 !border-neutral-800 !rounded-xl !overflow-hidden !shadow-xl [&>button]:!bg-transparent [&>button]:!border-neutral-800 [&>button]:!text-neutral-300 hover:[&>button]:!bg-neutral-800"
          position="bottom-left"
        />
        <MiniMap
          nodeStrokeColor="#38bdf8"
          nodeColor={(node) => {
            const data = node.data as WikiNodeData;
            if (data?.node?.metadata?.isOrphan) return '#f59e0b';
            if (data?.node?.type === 'index') return '#a855f7';
            return '#3b82f6';
          }}
          className="!bg-neutral-900/80 !border-neutral-800 !rounded-xl !shadow-xl"
          maskColor="rgba(10, 13, 20, 0.7)"
          position="bottom-right"
        />
      </ReactFlow>

      {/* Empty Filtered State indicator */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-neutral-900/90 border border-neutral-800 px-6 py-4 rounded-xl text-center shadow-xl">
            <p className="text-sm font-medium text-neutral-300">No matching notes found</p>
            <p className="text-xs text-neutral-500 mt-1">Try adjusting your search query or filters</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function GraphCanvas(props: GraphCanvasProps) {
  // All layouts (Force, Dagre TB/LR, Grid, Radial) are rendered via the unified Canvas engine
  return <ForceGraphCanvas {...props} />;
}
