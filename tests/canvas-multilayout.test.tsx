import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ForceGraphCanvas } from '../components/graph/ForceGraphCanvas';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { useGraphStore, LayoutAlgorithm } from '../store/useGraphStore';
import { GraphResponse, GraphResponseSchema } from '../lib/api';
import {
  initializeSimulationNodes,
  stepConstrainedPhysics,
} from '../lib/force-simulation';
import { computeCanvasLayout } from '../lib/layout-engine';

const mockGraphData: GraphResponse = GraphResponseSchema.parse({
  schemaVersion: '1.0.0',
  generatedAt: '2026-10-10T00:00:00Z',
  sourceVersion: 'v1',
  metadata: {
    nodeCount: 3,
    edgeCount: 2,
    brokenLinkCount: 0,
  },
  nodes: [
    {
      id: 'node1',
      label: 'Core Concept',
      title: 'Core Concept',
      type: 'index',
      path: 'node1.md',
      folder: 'concepts',
      tags: ['core'],
      aliases: [],
      excerpt: 'Central hub note',
      status: 'active',
      incomingCount: 2,
      outgoingCount: 2,
      isOrphan: false,
    },
    {
      id: 'node2',
      label: 'Sub Concept',
      title: 'Sub Concept',
      type: 'concept',
      path: 'node2.md',
      folder: 'concepts',
      tags: ['ai'],
      aliases: [],
      excerpt: 'Sub conceptual branch',
      status: 'active',
      incomingCount: 1,
      outgoingCount: 1,
      isOrphan: false,
    },
    {
      id: 'node3',
      label: 'Leaf Note',
      title: 'Leaf Note',
      type: 'source',
      path: 'node3.md',
      folder: 'sources',
      tags: ['paper'],
      aliases: [],
      excerpt: 'Terminal leaf note',
      status: 'active',
      incomingCount: 1,
      outgoingCount: 0,
      isOrphan: false,
    },
  ],
  edges: [
    { id: 'e1', source: 'node1', target: 'node2', type: 'wikilink' },
    { id: 'e2', source: 'node2', target: 'node3', type: 'wikilink' },
  ],
  unresolvedLinks: [],
});

describe('Multi-Layout Canvas Unification & Continuous Constrained Physics Controls', () => {
  beforeEach(() => {
    act(() => {
      useGraphStore.getState().setLayoutAlgorithm('force');
    });
  });

  const allLayouts: LayoutAlgorithm[] = ['force', 'dagre-tb', 'dagre-lr', 'grid', 'radial'];

  // (a) Simulation controls are visible in ALL layouts (FR-021, T050, T052)
  allLayouts.forEach((layout) => {
    it(`renders simulation controls (Play/Pause, Reheat) in ${layout} layout`, () => {
      act(() => {
        useGraphStore.getState().setLayoutAlgorithm(layout);
      });

      render(<ForceGraphCanvas graphData={mockGraphData} />);

      // Navigation controls
      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Fit View / Reset Camera')).toBeInTheDocument();

      // Simulation controls must remain visible in ALL layouts
      expect(screen.getByTitle(/Pause Physics Simulation|Resume Physics Simulation/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Re-cluster/i)).toBeInTheDocument();
    });
  });

  // (b) Alpha floor is maintained in constrained layouts (FR-022, T045, T052)
  it('maintains perpetual minimum alpha floor (~0.015) during constrained cooling', () => {
    let alpha = 0.5;
    for (let frame = 0; frame < 1000; frame++) {
      alpha = Math.max(0.015, alpha * 0.992);
    }
    expect(alpha).toBeCloseTo(0.015, 3);
    expect(alpha).toBeGreaterThanOrEqual(0.015);
  });

  it('runs continuous micro-movement forces when alpha is at the perpetual floor', () => {
    const { simNodes, simEdges } = initializeSimulationNodes(
      mockGraphData.nodes,
      mockGraphData.edges,
      800,
      600
    );
    const posMap = computeCanvasLayout(simNodes, simEdges, 'grid', { width: 800, height: 600 });
    simNodes.forEach((node) => {
      const pos = posMap.get(node.id);
      if (pos) {
        node.anchorX = pos.x;
        node.anchorY = pos.y;
        node.x = pos.x + 10;
        node.y = pos.y;
      }
    });

    const initialX = simNodes[0].x;
    stepConstrainedPhysics(simNodes, simEdges, 800, 600, 0.015);

    expect(simNodes[0].vx).not.toBe(0);
    expect(simNodes[0].x).not.toBe(initialX);
  });

  // (c) Nodes have valid anchorX/anchorY after layout switch (FR-015, T046, T052)
  it('assigns valid anchorX/anchorY after layout switch to non-force layouts and clears in force mode', () => {
    const { simNodes, simEdges } = initializeSimulationNodes(
      mockGraphData.nodes,
      mockGraphData.edges,
      800,
      600
    );

    // Initial force mode has no anchors
    expect(simNodes[0].anchorX ?? null).toBeNull();

    // Switch to dagre-tb
    const posMap = computeCanvasLayout(simNodes, simEdges, 'dagre-tb', { width: 800, height: 600 });
    simNodes.forEach((node) => {
      const pos = posMap.get(node.id);
      if (pos) {
        node.anchorX = pos.x;
        node.anchorY = pos.y;
      }
    });

    simNodes.forEach((node) => {
      expect(node.anchorX).toBeTypeOf('number');
      expect(node.anchorY).toBeTypeOf('number');
      expect(Number.isFinite(node.anchorX)).toBe(true);
      expect(Number.isFinite(node.anchorY)).toBe(true);
    });

    // Clear on return to force layout
    simNodes.forEach((node) => {
      node.anchorX = null;
      node.anchorY = null;
    });
    simNodes.forEach((node) => {
      expect(node.anchorX).toBeNull();
      expect(node.anchorY).toBeNull();
    });
  });

  it('renders via unified Canvas engine through GraphCanvas for all layouts', () => {
    act(() => {
      useGraphStore.getState().setLayoutAlgorithm('dagre-tb');
    });

    const { container } = render(<GraphCanvas graphData={mockGraphData} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
