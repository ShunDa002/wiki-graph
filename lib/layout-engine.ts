import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { LayoutAlgorithm } from '../store/useGraphStore';
import { SimNode, SimEdge } from './force-simulation';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 70;

export interface CanvasLayoutPosition {
  x: number;
  y: number;
}

/**
 * Computes deterministic 2D coordinates for Canvas circular nodes across all layout algorithms.
 * Used by ForceGraphCanvas to position and tween nodes without physics drift in static layouts.
 */
export function computeCanvasLayout(
  nodes: SimNode[],
  edges: SimEdge[],
  algorithm: LayoutAlgorithm,
  options: { width?: number; height?: number } = {}
): Map<string, CanvasLayoutPosition> {
  const result = new Map<string, CanvasLayoutPosition>();
  if (nodes.length === 0) return result;

  const width = options.width || 1000;
  const height = options.height || 800;
  const centerX = width / 2;
  const centerY = height / 2;

  // 1. Force layout: preserve active simulation coordinates or phyllotaxis distribution
  if (algorithm === 'force') {
    nodes.forEach((node, i) => {
      if (typeof node.x === 'number' && !isNaN(node.x) && (node.x !== 0 || node.y !== 0)) {
        result.set(node.id, { x: node.x, y: node.y });
      } else {
        const angle = i * 2.399963229728653; // Golden angle
        const r = 40 * Math.sqrt(i + 1);
        result.set(node.id, {
          x: centerX + r * Math.cos(angle),
          y: centerY + r * Math.sin(angle),
        });
      }
    });
    return result;
  }

  // 2. Grid Structure: deterministic 2D grid matrix ordered by degree centrality
  if (algorithm === 'grid') {
    const sorted = [...nodes].sort(
      (a, b) => (b.degree || 0) - (a.degree || 0) || a.label.localeCompare(b.label)
    );
    const count = sorted.length;
    const cols = Math.ceil(Math.sqrt(count * 1.3));
    const rows = Math.ceil(count / cols);
    const spacingX = 140;
    const spacingY = 115;

    const gridWidth = (cols - 1) * spacingX;
    const gridHeight = (rows - 1) * spacingY;
    const startX = centerX - gridWidth / 2;
    const startY = centerY - gridHeight / 2;

    sorted.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      result.set(node.id, {
        x: startX + col * spacingX,
        y: startY + row * spacingY,
      });
    });
    return result;
  }

  // 3. Concentric Radial: central hubs at core radiating outward to leaves and orphans
  if (algorithm === 'radial') {
    const sorted = [...nodes].sort(
      (a, b) => (b.degree || 0) - (a.degree || 0) || a.label.localeCompare(b.label)
    );

    if (sorted.length === 1) {
      result.set(sorted[0].id, { x: centerX, y: centerY });
      return result;
    }

    const remaining = [...sorted];
    let ringIndex = 0;
    const radiusStep = 135;

    if (remaining.length > 7) {
      const centerHub = remaining.shift()!;
      result.set(centerHub.id, { x: centerX, y: centerY });
      ringIndex = 1;
    }

    while (remaining.length > 0) {
      const currentRadius = Math.max(1, ringIndex) * radiusStep;
      const ringCapacity = Math.max(6, Math.floor(ringIndex * 7));
      const countOnRing = Math.min(remaining.length, ringCapacity);
      const ringNodes = remaining.splice(0, countOnRing);
      const offsetAngle = (ringIndex % 2) * (Math.PI / countOnRing);

      ringNodes.forEach((node, idx) => {
        const angle = (idx / countOnRing) * 2 * Math.PI + offsetAngle;
        result.set(node.id, {
          x: centerX + currentRadius * Math.cos(angle),
          y: centerY + currentRadius * Math.sin(angle),
        });
      });

      ringIndex++;
    }

    return result;
  }

  // 4. Hierarchical Dagre (dagre-tb or dagre-lr)
  const rankdir = algorithm === 'dagre-lr' ? 'LR' : 'TB';
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir,
    nodesep: 45,
    ranksep: 85,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    const size = (node.radius || 10) * 2 + 20;
    dagreGraph.setNode(node.id, { width: size, height: size });
  });

  edges.forEach((edge) => {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  // Compute bounding box to center graph neatly around (centerX, centerY)
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    if (pos) {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    }
  });

  const graphCenterX = (minX + maxX) / 2;
  const graphCenterY = (minY + maxY) / 2;
  const offsetX = centerX - graphCenterX;
  const offsetY = centerY - graphCenterY;

  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    if (pos) {
      result.set(node.id, {
        x: pos.x + offsetX,
        y: pos.y + offsetY,
      });
    } else {
      result.set(node.id, { x: centerX, y: centerY });
    }
  });

  return result;
}

/**
 * Legacy layout engine for React Flow DOM nodes.
 */
export function applyLayout<T = any>(
  nodes: Node<T>[],
  edges: Edge[],
  algorithm: LayoutAlgorithm = 'force'
): Node<T>[] {
  if (nodes.length === 0) return [];

  if (algorithm === 'force') {
    const center = { x: 500, y: 500 };
    const radiusStep = 150;
    const count = nodes.length;
    return nodes.map((node, i) => {
      const angle = i * 2.399963229728653; // Golden angle
      const r = radiusStep * Math.sqrt((i + 1) / (count + 1)) * 2.5;
      return {
        ...node,
        position: {
          x: center.x + r * Math.cos(angle) - NODE_WIDTH / 2,
          y: center.y + r * Math.sin(angle) - NODE_HEIGHT / 2,
        },
      };
    });
  }

  if (algorithm === 'grid') {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const spacingX = 240;
    const spacingY = 120;
    return nodes.map((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        ...node,
        position: {
          x: col * spacingX,
          y: row * spacingY,
        },
      };
    });
  }

  if (algorithm === 'radial') {
    const center = { x: 500, y: 500 };
    const radiusStep = 180;
    const count = nodes.length;
    return nodes.map((node, i) => {
      const angle = (i / count) * 2 * Math.PI;
      const radius = radiusStep * (1 + Math.floor(i / 15) * 0.8);
      return {
        ...node,
        position: {
          x: center.x + radius * Math.cos(angle) - NODE_WIDTH / 2,
          y: center.y + radius * Math.sin(angle) - NODE_HEIGHT / 2,
        },
      };
    });
  }

  // Dagre layout (dagre-tb or dagre-lr)
  const rankdir = algorithm === 'dagre-lr' ? 'LR' : 'TB';
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir,
    nodesep: 50,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPos = dagreGraph.node(node.id);
    if (!nodeWithPos) return node;

    return {
      ...node,
      position: {
        x: nodeWithPos.x - NODE_WIDTH / 2,
        y: nodeWithPos.y - NODE_HEIGHT / 2,
      },
    };
  });
}
