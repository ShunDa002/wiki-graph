import { describe, it, expect } from 'vitest';
import {
  computeDegrees,
  computeDegreeStats,
  calculateNodeRadius,
  initializeSimulationNodes,
  stepPhysicsSimulation,
  shouldRenderNodeLabel,
  getNeonNodeTheme,
  SimNode,
  DEFAULT_PHYSICS_PARAMS,
} from '../lib/force-simulation';
import { GraphNode, GraphEdge } from '../lib/api';

describe('Force Simulation Physics and Degree Centrality', () => {
  function makeMockNode(partial: Partial<GraphNode> & { id: string; label: string }): GraphNode {
    const metadata = {
      title: partial.title || partial.label,
      path: partial.path || partial.id,
      folder: partial.folder || '',
      tags: partial.tags || [],
      aliases: partial.aliases || [],
      excerpt: partial.excerpt || '',
      status: partial.status || 'active',
      incomingCount: partial.incomingCount ?? 0,
      outgoingCount: partial.outgoingCount ?? 0,
      isOrphan: partial.isOrphan ?? false,
      ...partial.metadata,
    };
    return {
      id: partial.id,
      label: partial.label,
      title: metadata.title,
      path: metadata.path,
      folder: metadata.folder,
      tags: metadata.tags,
      aliases: metadata.aliases,
      excerpt: metadata.excerpt,
      status: metadata.status,
      incomingCount: metadata.incomingCount,
      outgoingCount: metadata.outgoingCount,
      isOrphan: metadata.isOrphan,
      type: partial.type || 'note',
      metadata,
    };
  }

  const mockNodes: GraphNode[] = [
    makeMockNode({
      id: 'index.md',
      label: 'Vault Index',
      type: 'index',
      tags: ['meta'],
      excerpt: 'Root index of vault',
      incomingCount: 2,
      outgoingCount: 2,
      isOrphan: false,
    }),
    makeMockNode({
      id: 'neural-nets.md',
      label: 'Neural Networks',
      folder: 'concepts',
      tags: ['ai'],
      excerpt: 'Deep learning foundational guide',
      incomingCount: 1,
      outgoingCount: 1,
      isOrphan: false,
    }),
    makeMockNode({
      id: 'leaf.md',
      label: 'Specialized Leaf Note',
      folder: 'concepts',
      tags: ['ai'],
      excerpt: 'A leaf detail',
      incomingCount: 1,
      outgoingCount: 0,
      isOrphan: false,
    }),
    makeMockNode({
      id: 'orphan.md',
      label: 'Disconnected Note',
      folder: 'drafts',
      tags: ['draft'],
      excerpt: 'Isolated note',
      status: 'draft',
      incomingCount: 0,
      outgoingCount: 0,
      isOrphan: true,
    }),
  ];

  const mockEdges: GraphEdge[] = [
    { id: 'e1', source: 'index.md', target: 'neural-nets.md', type: 'wikilink' },
    { id: 'e2', source: 'neural-nets.md', target: 'leaf.md', type: 'wikilink' },
  ];

  it('computes in-degree, out-degree and total degree centrality correctly', () => {
    const degrees = computeDegrees(mockNodes, mockEdges);
    expect(degrees.get('index.md')?.degree).toBe(4); // 2+2 from metadata, or edges
    expect(degrees.get('neural-nets.md')?.degree).toBe(2);
    expect(degrees.get('leaf.md')?.degree).toBe(1);
    expect(degrees.get('orphan.md')?.degree).toBe(0);
  });

  it('scales node radii dynamically based on degree centrality and index status', () => {
    const stats = computeDegreeStats([0, 1, 2, 4]);

    const leafRadius = calculateNodeRadius(1, stats, false, false);
    const hubRadius = calculateNodeRadius(4, stats, false, false);
    const indexRadius = calculateNodeRadius(4, stats, true, false);
    const orphanRadius = calculateNodeRadius(0, stats, false, true);

    // Dynamic hierarchy: hubs are significantly larger than leaf notes
    expect(hubRadius).toBeGreaterThan(leafRadius);
    expect(leafRadius).toBeGreaterThanOrEqual(5.5);
    expect(hubRadius).toBeGreaterThanOrEqual(20);
    expect(indexRadius).toBeGreaterThanOrEqual(16);
    expect(orphanRadius).toBe(5.0);
  });

  it('initializes simulation nodes without NaN values and with connected edges', () => {
    const { simNodes, simEdges } = initializeSimulationNodes(mockNodes, mockEdges, 1000, 800);
    expect(simNodes.length).toBe(4);
    expect(simEdges.length).toBe(2);

    for (const node of simNodes) {
      expect(Number.isNaN(node.x)).toBe(false);
      expect(Number.isNaN(node.y)).toBe(false);
      expect(node.radius).toBeGreaterThan(0);
    }
  });

  it('advances physics simulation steps smoothly, attracting connected nodes and repelling others', () => {
    const { simNodes, simEdges } = initializeSimulationNodes(mockNodes, mockEdges, 1000, 800);

    const initialX0 = simNodes[0].x;
    const initialY0 = simNodes[0].y;

    stepPhysicsSimulation(simNodes, simEdges, 1000, 800, 0.5, DEFAULT_PHYSICS_PARAMS);

    for (const node of simNodes) {
      expect(Number.isNaN(node.x)).toBe(false);
      expect(Number.isNaN(node.y)).toBe(false);
      expect(Number.isNaN(node.vx)).toBe(false);
      expect(Number.isNaN(node.vy)).toBe(false);
    }

    // Nodes moved organically under forces
    expect(simNodes[0].x !== initialX0 || simNodes[0].y !== initialY0).toBe(true);
  });

  it('applies adaptive label Level-of-Detail visibility according to zoom and prominence', () => {
    const hubNode: SimNode = {
      id: 'hub',
      label: 'Hub',
      type: 'index',
      folder: '',
      tags: [],
      excerpt: '',
      incomingCount: 5,
      outgoingCount: 5,
      degree: 10,
      radius: 20,
      isIndex: true,
      isOrphan: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      mass: 4,
    };

    const leafNode: SimNode = {
      id: 'leaf',
      label: 'Leaf',
      type: 'note',
      folder: '',
      tags: [],
      excerpt: '',
      incomingCount: 1,
      outgoingCount: 0,
      degree: 1,
      radius: 6,
      isIndex: false,
      isOrphan: false,
      x: 10,
      y: 10,
      vx: 0,
      vy: 0,
      mass: 2,
    };

    // Zoomed far out (0.4) -> hub visible, leaf hidden
    const hubFar = shouldRenderNodeLabel(hubNode, 0.4, false, false, false, 2);
    const leafFar = shouldRenderNodeLabel(leafNode, 0.4, false, false, false, 2);
    expect(hubFar.visible).toBe(true);
    expect(leafFar.visible).toBe(false);

    // Selected leaf node is always visible regardless of zoom
    const selectedLeafFar = shouldRenderNodeLabel(leafNode, 0.4, true, false, false, 2);
    expect(selectedLeafFar.visible).toBe(true);

    // Zoomed in (1.3) -> all nodes visible
    const leafClose = shouldRenderNodeLabel(leafNode, 1.3, false, false, false, 2);
    expect(leafClose.visible).toBe(true);
  });

  describe('Neon Graph Theme Palette & Visual Hierarchy', () => {
    it('illuminates major hubs and index notes in Electric Cyan (#00f0ff)', () => {
      const indexNode: SimNode = {
        id: 'index.md',
        label: 'Vault Index',
        type: 'index',
        folder: '',
        tags: [],
        excerpt: '',
        incomingCount: 2,
        outgoingCount: 2,
        degree: 4,
        radius: 18,
        isIndex: true,
        isOrphan: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        mass: 5,
      };

      const highDegreeHub: SimNode = {
        id: 'moc.md',
        label: 'Map of Content',
        type: 'note',
        folder: 'maps',
        tags: ['moc'],
        excerpt: '',
        incomingCount: 5,
        outgoingCount: 4,
        degree: 9,
        radius: 22,
        isIndex: false,
        isOrphan: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        mass: 8,
      };

      const indexTheme = getNeonNodeTheme(indexNode);
      expect(indexTheme.category).toBe('cyan');
      expect(indexTheme.accentHex).toBe('#00f0ff');
      expect(indexTheme.categoryLabel).toBe('Hub');

      const hubTheme = getNeonNodeTheme(highDegreeHub);
      expect(hubTheme.category).toBe('cyan');
      expect(hubTheme.accentHex).toBe('#00f0ff');
    });

    it('maps concept and theoretical notes to vibrant Magenta / Hot Pink (#ff2a85)', () => {
      const conceptNode: SimNode = {
        id: 'neural-nets.md',
        label: 'Neural Networks',
        type: 'concept',
        folder: 'concepts',
        tags: ['ai'],
        excerpt: '',
        incomingCount: 1,
        outgoingCount: 1,
        degree: 2,
        radius: 7,
        isIndex: false,
        isOrphan: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        mass: 2,
      };

      const theme = getNeonNodeTheme(conceptNode);
      expect(theme.category).toBe('magenta');
      expect(theme.accentHex).toBe('#ff2a85');
      expect(theme.categoryLabel).toBe('Concept');
    });

    it('maps sources, guides, and reference documents to Vivid Neon Yellow (#ffe600)', () => {
      const sourceNode: SimNode = {
        id: 'arxiv.md',
        label: 'Arxiv 2305.18290',
        type: 'source',
        folder: 'sources',
        tags: ['paper'],
        excerpt: '',
        incomingCount: 0,
        outgoingCount: 1,
        degree: 1,
        radius: 6,
        isIndex: false,
        isOrphan: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        mass: 2,
      };

      const theme = getNeonNodeTheme(sourceNode);
      expect(theme.category).toBe('yellow');
      expect(theme.accentHex).toBe('#ffe600');
      expect(theme.categoryLabel).toBe('Source');
    });

    it('maps isolated orphan notes to Neon Amber (#fb923c)', () => {
      const orphanNode: SimNode = {
        id: 'scratchpad.md',
        label: 'Scratchpad',
        type: 'note',
        folder: 'drafts',
        tags: [],
        excerpt: '',
        incomingCount: 0,
        outgoingCount: 0,
        degree: 0,
        radius: 5,
        isIndex: false,
        isOrphan: true,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        mass: 1,
      };

      const theme = getNeonNodeTheme(orphanNode);
      expect(theme.category).toBe('amber');
      expect(theme.accentHex).toBe('#fb923c');
      expect(theme.categoryLabel).toBe('Orphan');
    });

    it('maps peripheral leaf notes to Pale Electric Blue (#38bdf8)', () => {
      const leafNode: SimNode = {
        id: 'daily.md',
        label: 'Daily Log 2026-10-11',
        type: 'note',
        folder: 'journal',
        tags: ['daily'],
        excerpt: '',
        incomingCount: 1,
        outgoingCount: 0,
        degree: 1,
        radius: 6,
        isIndex: false,
        isOrphan: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        mass: 2,
      };

      const theme = getNeonNodeTheme(leafNode);
      expect(theme.category).toBe('blue');
      expect(theme.accentHex).toBe('#38bdf8');
      expect(theme.categoryLabel).toBe('Note');
    });
  });
});

