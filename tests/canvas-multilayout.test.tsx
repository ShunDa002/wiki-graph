import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ForceGraphCanvas } from '../components/graph/ForceGraphCanvas';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { useGraphStore, LayoutAlgorithm } from '../store/useGraphStore';
import { GraphResponse, GraphResponseSchema } from '../lib/api';

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

describe('Multi-Layout Canvas Unification & Contextual Controls', () => {
  beforeEach(() => {
    act(() => {
      useGraphStore.getState().setLayoutAlgorithm('force');
    });
  });

  it('renders simulation controls (Play/Pause, Reheat) in Force-Directed Organic layout', () => {
    render(<ForceGraphCanvas graphData={mockGraphData} />);

    // Common navigation controls
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Fit View / Reset Camera')).toBeInTheDocument();
    expect(screen.getByTitle('Hide Labels')).toBeInTheDocument();

    // Simulation controls must be visible in force mode
    expect(screen.getByTitle(/Pause Physics Simulation/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Re-cluster \/ Re-heat Physics Simulation/i)).toBeInTheDocument();
  });

  const staticLayouts: LayoutAlgorithm[] = ['dagre-tb', 'dagre-lr', 'grid', 'radial'];

  staticLayouts.forEach((layout) => {
    it(`hides simulation buttons when active layout is ${layout}`, () => {
      act(() => {
        useGraphStore.getState().setLayoutAlgorithm(layout);
      });

      render(<ForceGraphCanvas graphData={mockGraphData} />);

      // Navigation controls remain visible
      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Fit View / Reset Camera')).toBeInTheDocument();

      // Simulation buttons must be hidden in static layouts
      expect(screen.queryByTitle(/Physics Simulation/i)).not.toBeInTheDocument();
      expect(screen.queryByTitle(/Re-cluster/i)).not.toBeInTheDocument();
    });
  });

  it('dynamically toggles simulation buttons when switching layout from force to grid', () => {
    render(<ForceGraphCanvas graphData={mockGraphData} />);

    // Initially in force mode -> simulation buttons exist
    expect(screen.getByTitle(/Re-cluster/i)).toBeInTheDocument();

    // Switch to grid layout
    act(() => {
      useGraphStore.getState().setLayoutAlgorithm('grid');
    });

    // Reheat & physics buttons should now be removed from DOM
    expect(screen.queryByTitle(/Re-cluster/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Physics Simulation/i)).not.toBeInTheDocument();

    // Switch back to force layout
    act(() => {
      useGraphStore.getState().setLayoutAlgorithm('force');
    });

    // Reheat & physics buttons should reappear
    expect(screen.getByTitle(/Re-cluster/i)).toBeInTheDocument();
  });

  it('renders via unified Canvas engine through GraphCanvas for all layouts', () => {
    act(() => {
      useGraphStore.getState().setLayoutAlgorithm('dagre-tb');
    });

    const { container } = render(<GraphCanvas graphData={mockGraphData} />);
    // Verify an HTML5 Canvas element is rendered
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
