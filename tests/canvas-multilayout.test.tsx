import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
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
    expect(screen.getByTitle('Pause')).toBeInTheDocument();
    expect(screen.getByTitle('Refresh Graph')).toBeInTheDocument();

    // Toggling simulation switches tooltip between Pause and Resume
    const pauseBtn = screen.getByTitle('Pause');
    fireEvent.click(pauseBtn);
    expect(screen.getByTitle('Resume')).toBeInTheDocument();

    const resumeBtn = screen.getByTitle('Resume');
    fireEvent.click(resumeBtn);
    expect(screen.getByTitle('Pause')).toBeInTheDocument();
  });

  const staticLayouts: LayoutAlgorithm[] = ['dagre-tb', 'dagre-lr', 'grid', 'radial'];

  staticLayouts.forEach((layout) => {
    it(`displays uniform HUD buttons with disabled simulation control in ${layout} layout`, () => {
      act(() => {
        useGraphStore.getState().setLayoutAlgorithm(layout);
      });

      render(<ForceGraphCanvas graphData={mockGraphData} />);

      // Navigation controls remain visible
      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Fit View / Reset Camera')).toBeInTheDocument();

      // Simulation & layout buttons are present in all layouts
      const simBtn = screen.getByTitle('Physics engine is inactive in static layouts');
      expect(simBtn).toBeInTheDocument();
      expect(simBtn).toBeDisabled();

      const reclusterBtn = screen.getByTitle('Refresh Graph');
      expect(reclusterBtn).toBeInTheDocument();
      expect(reclusterBtn).not.toBeDisabled();

      // Clicking recluster in static layout executes without errors
      fireEvent.click(reclusterBtn);
    });
  });

  it('maintains uniform HUD buttons when switching layout between force and grid', () => {
    render(<ForceGraphCanvas graphData={mockGraphData} />);

    // Initially in force mode -> simulation button is enabled
    const forceSimBtn = screen.getByTitle('Pause');
    expect(forceSimBtn).toBeInTheDocument();
    expect(forceSimBtn).not.toBeDisabled();
    expect(screen.getByTitle('Refresh Graph')).toBeInTheDocument();

    // Switch to grid layout
    act(() => {
      useGraphStore.getState().setLayoutAlgorithm('grid');
    });

    // In grid layout -> buttons remain present; simulation button becomes disabled with inactive tooltip
    const gridSimBtn = screen.getByTitle('Physics engine is inactive in static layouts');
    expect(gridSimBtn).toBeInTheDocument();
    expect(gridSimBtn).toBeDisabled();
    expect(screen.getByTitle('Refresh Graph')).toBeInTheDocument();

    // Switch back to force layout
    act(() => {
      useGraphStore.getState().setLayoutAlgorithm('force');
    });

    // In force layout -> simulation button is active again
    expect(screen.getByTitle('Pause')).toBeInTheDocument();
    expect(screen.getByTitle('Refresh Graph')).toBeInTheDocument();
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
