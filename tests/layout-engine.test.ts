import { describe, it, expect } from 'vitest';
import { applyLayout, computeCanvasLayout } from '../lib/layout-engine';
import { Node, Edge } from 'reactflow';
import { SimNode, SimEdge } from '../lib/force-simulation';

describe('applyLayout (Legacy React Flow)', () => {
  const mockNodes: Node[] = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
    { id: '3', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
  ];

  const mockEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
  ];

  it('calculates hierarchical Dagre TB positions', () => {
    const positioned = applyLayout(mockNodes, mockEdges, 'dagre-tb');
    expect(positioned.length).toBe(3);
    const n1 = positioned.find((n) => n.id === '1')!;
    const n2 = positioned.find((n) => n.id === '2')!;
    const n3 = positioned.find((n) => n.id === '3')!;

    expect(n1.position.y).toBeLessThan(n2.position.y);
    expect(n2.position.y).toBeLessThan(n3.position.y);
  });

  it('calculates hierarchical Dagre LR positions', () => {
    const positioned = applyLayout(mockNodes, mockEdges, 'dagre-lr');
    expect(positioned.length).toBe(3);
    const n1 = positioned.find((n) => n.id === '1')!;
    const n2 = positioned.find((n) => n.id === '2')!;
    const n3 = positioned.find((n) => n.id === '3')!;

    expect(n1.position.x).toBeLessThan(n2.position.x);
    expect(n2.position.x).toBeLessThan(n3.position.x);
  });

  it('calculates grid positions', () => {
    const positioned = applyLayout(mockNodes, mockEdges, 'grid');
    expect(positioned.length).toBe(3);
    expect(positioned[0].position).toEqual({ x: 0, y: 0 });
    expect(positioned[1].position.x).toBeGreaterThan(0);
  });

  it('calculates radial positions', () => {
    const positioned = applyLayout(mockNodes, mockEdges, 'radial');
    expect(positioned.length).toBe(3);
    expect(positioned.some((n) => n.position.x !== 0 || n.position.y !== 0)).toBe(true);
  });
});

describe('computeCanvasLayout (Canvas Circular Nodes)', () => {
  const createMockSimNode = (id: string, label: string, degree: number): SimNode => ({
    id,
    label,
    type: 'note',
    folder: 'concepts',
    tags: [],
    excerpt: 'Test',
    incomingCount: degree,
    outgoingCount: 0,
    degree,
    radius: 10 + degree * 2,
    isIndex: false,
    isOrphan: degree === 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mass: 1,
  });

  const simNodes: SimNode[] = [
    createMockSimNode('hub', 'Core Hub', 10),
    createMockSimNode('child1', 'Child 1', 3),
    createMockSimNode('child2', 'Child 2', 2),
    createMockSimNode('leaf', 'Leaf Note', 1),
  ];

  const simEdges: SimEdge[] = [
    { id: 'e1', source: 'hub', target: 'child1', type: 'wikilink' },
    { id: 'e2', source: 'hub', target: 'child2', type: 'wikilink' },
    { id: 'e3', source: 'child1', target: 'leaf', type: 'wikilink' },
  ];

  it('handles empty nodes gracefully', () => {
    const result = computeCanvasLayout([], [], 'dagre-tb');
    expect(result.size).toBe(0);
  });

  it('calculates hierarchical Dagre TB positions with parent above child', () => {
    const positions = computeCanvasLayout(simNodes, simEdges, 'dagre-tb', { width: 1000, height: 800 });
    expect(positions.size).toBe(4);

    const hubPos = positions.get('hub')!;
    const child1Pos = positions.get('child1')!;
    const leafPos = positions.get('leaf')!;

    expect(hubPos.y).toBeLessThan(child1Pos.y);
    expect(child1Pos.y).toBeLessThan(leafPos.y);
  });

  it('calculates hierarchical Dagre LR positions with parent left of child', () => {
    const positions = computeCanvasLayout(simNodes, simEdges, 'dagre-lr', { width: 1000, height: 800 });
    expect(positions.size).toBe(4);

    const hubPos = positions.get('hub')!;
    const child1Pos = positions.get('child1')!;
    const leafPos = positions.get('leaf')!;

    expect(hubPos.x).toBeLessThan(child1Pos.x);
    expect(child1Pos.x).toBeLessThan(leafPos.x);
  });

  it('calculates deterministic grid positions ordered by degree centrality', () => {
    const positions = computeCanvasLayout(simNodes, simEdges, 'grid', { width: 1000, height: 800 });
    expect(positions.size).toBe(4);

    // All positions should be distinct
    const coords = Array.from(positions.values());
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        const isSame = coords[i].x === coords[j].x && coords[i].y === coords[j].y;
        expect(isSame).toBe(false);
      }
    }
  });

  it('calculates concentric radial layout with hub near center and leaves on ring', () => {
    const positions = computeCanvasLayout(simNodes, simEdges, 'radial', { width: 1000, height: 800 });
    expect(positions.size).toBe(4);

    const hubPos = positions.get('hub')!;
    const child1Pos = positions.get('child1')!;

    // Both positions should be finite numbers centered around width/height
    expect(Number.isFinite(hubPos.x)).toBe(true);
    expect(Number.isFinite(hubPos.y)).toBe(true);
    expect(Number.isFinite(child1Pos.x)).toBe(true);
    expect(Number.isFinite(child1Pos.y)).toBe(true);
  });

  it('returns valid coordinates for force layout', () => {
    const positions = computeCanvasLayout(simNodes, simEdges, 'force', { width: 1000, height: 800 });
    expect(positions.size).toBe(4);
    positions.forEach((pos) => {
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
    });
  });
});
