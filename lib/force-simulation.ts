import { GraphNode, GraphEdge } from './api';

export interface SimNode {
  id: string;
  label: string;
  type: string;
  folder: string;
  tags: string[];
  excerpt: string;
  incomingCount: number;
  outgoingCount: number;
  degree: number;
  radius: number;
  isIndex: boolean;
  isOrphan: boolean;

  // Physics coordinates and velocities
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null; // Fixed position if being dragged
  fy?: number | null;
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
  mass: number;
}

export interface SimEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  sourceNode?: SimNode;
  targetNode?: SimNode;
}

export interface DegreeStats {
  minDegree: number;
  maxDegree: number;
  medianDegree: number;
  averageDegree: number;
}

/**
 * Calculates degree (in + out) for all nodes based on graph edges and node metadata.
 */
export function computeDegrees(nodes: GraphNode[], edges: GraphEdge[]): Map<string, { inDegree: number; outDegree: number; degree: number }> {
  const inDegreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();

  for (const edge of edges) {
    outDegreeMap.set(edge.source, (outDegreeMap.get(edge.source) || 0) + 1);
    inDegreeMap.set(edge.target, (inDegreeMap.get(edge.target) || 0) + 1);
  }

  const result = new Map<string, { inDegree: number; outDegree: number; degree: number }>();

  for (const node of nodes) {
    const calculatedIn = inDegreeMap.get(node.id) || 0;
    const calculatedOut = outDegreeMap.get(node.id) || 0;

    // Use maximum of calculated links and metadata counts if provided
    const inDegree = Math.max(calculatedIn, node.metadata?.incomingCount || 0);
    const outDegree = Math.max(calculatedOut, node.metadata?.outgoingCount || 0);
    const degree = inDegree + outDegree;

    result.set(node.id, { inDegree, outDegree, degree });
  }

  return result;
}

/**
 * Calculates degree stats (min, max, median, average) across a collection of degrees.
 */
export function computeDegreeStats(degrees: number[]): DegreeStats {
  if (degrees.length === 0) {
    return { minDegree: 0, maxDegree: 0, medianDegree: 0, averageDegree: 0 };
  }

  const sorted = [...degrees].sort((a, b) => a - b);
  const minDegree = sorted[0];
  const maxDegree = sorted[sorted.length - 1];
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const averageDegree = sum / sorted.length;
  const mid = Math.floor(sorted.length / 2);
  const medianDegree = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return { minDegree, maxDegree, medianDegree, averageDegree };
}

/**
 * Calculates dynamic node radius based on degree centrality and note importance.
 * Leaf notes remain small and delicate (5-7px), while central hub/index notes scale up to 20-24px.
 */
export function calculateNodeRadius(
  degree: number,
  stats: DegreeStats,
  isIndex: boolean,
  isOrphan: boolean
): number {
  const MIN_RADIUS = 5.5;
  const MAX_RADIUS = 22.0;

  if (isOrphan) {
    return 5.0;
  }

  const { minDegree, maxDegree } = stats;
  const spread = Math.max(1, maxDegree - minDegree);
  const normalizedDegree = Math.max(0, Math.min(1, (degree - minDegree) / spread));

  // Power curve (exponent 0.6) boosts visibility of moderately connected notes while scaling hubs smoothly
  let radius = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.pow(normalizedDegree, 0.6);

  // Central hub / index notes get prominent structural pillar sizing
  if (isIndex || (degree >= 6 && !isOrphan)) {
    radius = Math.max(radius, 18.0);
  }

  return Math.round(radius * 10) / 10;
}

export type NeonColorCategory = 'cyan' | 'magenta' | 'yellow' | 'blue' | 'amber';

export interface NeonNodeTheme {
  category: NeonColorCategory;
  categoryLabel: string;
  accentHex: string;          // Pure solid fluorescent color (e.g. #00f0ff, #ff2a85, #ffe600)
  glowRgba: string;           // Soft bloom aura (e.g. rgba(0, 240, 255, 0.6))
  borderRgba: string;         // Delicate high-contrast rim (e.g. rgba(207, 250, 254, 0.85))
  textColor: string;          // Typography color
  pillBg: string;             // Label backdrop
  gradient?: [string, string, string]; // Optional gradient
}

/**
 * Neon Graph Theme: Maps nodes to a high-contrast luminescent palette:
 * - Hub Centrality: Core notes / structural pillars illuminated in bright glowing cyan.
 * - Distributed Leaf Nodes: Categorical neon accents in magenta/hot pink, vivid neon yellow, and pale electric blue.
 */
export function getNeonNodeTheme(node: SimNode): NeonNodeTheme {
  // 1. Hub Centrality: Major core notes (Index, Maps of Content, structural pillars)
  // Scaled up significantly and illuminated in bright glowing cyan
  if (node.isIndex || (node.degree >= 6 && !node.isOrphan)) {
    return {
      category: 'cyan',
      categoryLabel: 'Hub',
      accentHex: '#00f0ff',
      glowRgba: 'rgba(0, 240, 255, 0.65)',
      borderRgba: 'rgba(207, 250, 254, 0.9)',
      gradient: ['#e0fcff', '#00f0ff', '#0284c7'],
      textColor: '#ecfeff',
      pillBg: 'rgba(6, 20, 44, 0.88)',
    };
  }

  // 2. Orphan status: Neon Amber
  if (node.isOrphan) {
    return {
      category: 'amber',
      categoryLabel: 'Orphan',
      accentHex: '#fb923c',
      glowRgba: 'rgba(251, 146, 60, 0.45)',
      borderRgba: 'rgba(253, 186, 116, 0.75)',
      gradient: ['#fff7ed', '#fb923c', '#c2410c'],
      textColor: '#ffedd5',
      pillBg: 'rgba(38, 18, 6, 0.88)',
    };
  }

  // 3. Categorical neon accents based on folder, type, and tags
  const folder = (node.folder || '').toLowerCase();
  const type = (node.type || '').toLowerCase();
  const tags = (node.tags || []).map((t) => t.toLowerCase());

  const hasTag = (...patterns: string[]) =>
    tags.some((t) =>
      patterns.some(
        (p) => t === p || t.startsWith(p + '/') || t.startsWith(p + '-') || t.endsWith('/' + p)
      )
    );

  // Magenta / Hot Pink: Concepts, Theory, AI, Models, Architecture
  if (
    folder === 'concepts' ||
    folder.startsWith('concepts/') ||
    type === 'concept' ||
    hasTag('concept', 'theory', 'ai', 'llm', 'agent', 'architecture', 'model', 'neural')
  ) {
    return {
      category: 'magenta',
      categoryLabel: 'Concept',
      accentHex: '#ff2a85',
      glowRgba: 'rgba(255, 42, 133, 0.55)',
      borderRgba: 'rgba(254, 205, 226, 0.85)',
      gradient: ['#fff1f5', '#ff2a85', '#be123c'],
      textColor: '#fff1f5',
      pillBg: 'rgba(38, 8, 24, 0.88)',
    };
  }

  // Vivid Neon Yellow: Sources, Reference, Guides, Datasets, Tools
  if (
    folder === 'sources' ||
    folder.startsWith('sources/') ||
    type === 'source' ||
    folder === 'reference' ||
    folder.startsWith('reference/') ||
    folder === 'guides' ||
    folder.startsWith('guides/') ||
    hasTag('source', 'paper', 'ref', 'reference', 'guide', 'tool', 'dataset')
  ) {
    return {
      category: 'yellow',
      categoryLabel: 'Source',
      accentHex: '#ffe600',
      glowRgba: 'rgba(255, 230, 0, 0.55)',
      borderRgba: 'rgba(254, 240, 138, 0.85)',
      gradient: ['#fffee5', '#ffe600', '#ca8a04'],
      textColor: '#fef9c3',
      pillBg: 'rgba(38, 34, 6, 0.88)',
    };
  }

  // Distributed Leaf Notes: Pale Electric Blue
  return {
    category: 'blue',
    categoryLabel: 'Note',
    accentHex: '#38bdf8',
    glowRgba: 'rgba(56, 189, 248, 0.5)',
    borderRgba: 'rgba(186, 230, 253, 0.8)',
    gradient: ['#f0f9ff', '#38bdf8', '#0369a1'],
    textColor: '#e0f2fe',
    pillBg: 'rgba(8, 24, 48, 0.88)',
  };
}

/**
 * Initializes physics simulation nodes with organic distributed positions and dynamic radii.
 */
export function initializeSimulationNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  existingNodesMap?: Map<string, SimNode>
): { simNodes: SimNode[]; simEdges: SimEdge[] } {
  const degreeMap = computeDegrees(nodes, edges);
  const degrees = Array.from(degreeMap.values()).map((d) => d.degree);
  const stats = computeDegreeStats(degrees);

  const centerX = width / 2;
  const centerY = height / 2;
  const initialRadius = Math.min(width, height) * 0.35;

  const simNodes: SimNode[] = nodes.map((node, i) => {
    const dInfo = degreeMap.get(node.id) || { inDegree: 0, outDegree: 0, degree: 0 };
    const isIndex =
      node.type === 'index' ||
      node.label.toLowerCase().includes('index') ||
      node.metadata?.title?.toLowerCase().includes('index') ||
      node.id.toLowerCase().includes('index');
    const isOrphan = node.metadata?.isOrphan || dInfo.degree === 0;

    const radius = calculateNodeRadius(dInfo.degree, stats, isIndex, isOrphan);
    const mass = Math.max(1, Math.sqrt(radius));

    // Preserve existing coordinates if available, otherwise distribute on organic spiral
    const existing = existingNodesMap?.get(node.id);
    let x = existing?.x ?? 0;
    let y = existing?.y ?? 0;
    let vx = existing?.vx ?? 0;
    let vy = existing?.vy ?? 0;

    if (!existing) {
      // Golden spiral distribution with small jitter for organic spread
      const angle = i * 2.399963229728653; // Golden angle
      const r = initialRadius * Math.sqrt((i + 1) / (nodes.length + 1));
      const jitterX = (Math.random() - 0.5) * 40;
      const jitterY = (Math.random() - 0.5) * 40;
      x = centerX + r * Math.cos(angle) + jitterX;
      y = centerY + r * Math.sin(angle) + jitterY;
    }

    return {
      id: node.id,
      label: node.metadata?.title || node.label || node.id,
      type: node.type,
      folder: node.metadata?.folder || '',
      tags: node.metadata?.tags || [],
      excerpt: node.metadata?.excerpt || '',
      incomingCount: dInfo.inDegree,
      outgoingCount: dInfo.outDegree,
      degree: dInfo.degree,
      radius,
      isIndex,
      isOrphan,
      x,
      y,
      vx,
      vy,
      fx: existing?.fx ?? null,
      fy: existing?.fy ?? null,
      mass,
    };
  });

  const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

  const simEdges: SimEdge[] = [];
  for (const edge of edges) {
    const sNode = nodeMap.get(edge.source);
    const tNode = nodeMap.get(edge.target);
    if (sNode && tNode) {
      simEdges.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        sourceNode: sNode,
        targetNode: tNode,
      });
    }
  }

  return { simNodes, simEdges };
}

export interface PhysicsParams {
  repulsion: number;       // Repulsion strength between nodes
  springLength: number;    // Resting distance for links
  springStrength: number;  // Spring attraction strength
  centering: number;       // Gravitational pull to center
  damping: number;         // Friction factor
  collisionPadding: number;// Distance between node perimeters
}

export const DEFAULT_PHYSICS_PARAMS: PhysicsParams = {
  repulsion: 1800,
  springLength: 75,
  springStrength: 0.045,
  centering: 0.012,
  damping: 0.88,
  collisionPadding: 8,
};

/**
 * Runs a single step of the force-directed physics simulation.
 * Calculates repulsion (N-body), spring attraction, center gravity, and collision restitution.
 */
export function stepPhysicsSimulation(
  nodes: SimNode[],
  edges: SimEdge[],
  width: number,
  height: number,
  alpha: number,
  params: PhysicsParams = DEFAULT_PHYSICS_PARAMS
): void {
  if (alpha <= 0.001 || nodes.length === 0) return;

  const centerX = width / 2;
  const centerY = height / 2;
  const nodeCount = nodes.length;

  // 1. Repulsion between all pairs of nodes (unconnected nodes repel, creating space)
  for (let i = 0; i < nodeCount; i++) {
    const n1 = nodes[i];
    for (let j = i + 1; j < nodeCount; j++) {
      const n2 = nodes[j];
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const distSq = dx * dx + dy * dy + 25; // Softening parameter
      const dist = Math.sqrt(distSq);

      // Force scales with radii and inverse-square distance
      const forceMag = (params.repulsion * (n1.radius + n2.radius) * alpha) / distSq;
      const fx = (dx / dist) * forceMag;
      const fy = (dy / dist) * forceMag;

      n1.vx -= fx / n1.mass;
      n1.vy -= fy / n1.mass;
      n2.vx += fx / n2.mass;
      n2.vy += fy / n2.mass;

      // Hard collision prevention so circular nodes never overlap
      const minDistance = n1.radius + n2.radius + params.collisionPadding;
      if (dist < minDistance && dist > 0.001) {
        const overlap = (minDistance - dist) * 0.5 * alpha;
        const pushX = (dx / dist) * overlap;
        const pushY = (dy / dist) * overlap;
        n1.x -= pushX;
        n1.y -= pushY;
        n2.x += pushX;
        n2.y += pushY;
      }
    }
  }

  // 2. Spring attraction along connected edges (connected notes pull together into semantic clusters)
  for (let e = 0; e < edges.length; e++) {
    const edge = edges[e];
    const sNode = edge.sourceNode;
    const tNode = edge.targetNode;
    if (!sNode || !tNode) continue;

    const dx = tNode.x - sNode.x;
    const dy = tNode.y - sNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;

    // Target spring distance accounts for node sizes
    const targetDist = params.springLength + (sNode.radius + tNode.radius) * 0.7;
    const displacement = dist - targetDist;
    const springForce = displacement * params.springStrength * alpha;

    const fx = (dx / dist) * springForce;
    const fy = (dy / dist) * springForce;

    sNode.vx += fx / sNode.mass;
    sNode.vy += fy / sNode.mass;
    tNode.vx -= fx / tNode.mass;
    tNode.vy -= fy / tNode.mass;
  }

  // 3. Centering force & velocity integration
  for (let i = 0; i < nodeCount; i++) {
    const node = nodes[i];

    // If dragged by user, hold at fixed coordinate
    if (typeof node.fx === 'number' && typeof node.fy === 'number') {
      node.x = node.fx;
      node.y = node.fy;
      node.vx = 0;
      node.vy = 0;
      continue;
    }

    // Gravitational pull toward viewport center
    const centerPullX = (centerX - node.x) * params.centering * alpha;
    const centerPullY = (centerY - node.y) * params.centering * alpha;

    node.vx = (node.vx + centerPullX) * params.damping;
    node.vy = (node.vy + centerPullY) * params.damping;

    // Apply velocity
    node.x += node.vx;
    node.y += node.vy;
  }
}

/**
 * Determines whether a node label should be rendered based on zoom Level-of-Detail (LoD)
 * and node prominence (degree centrality, index hub status, selection, or neighbor status).
 */
export function shouldRenderNodeLabel(
  node: SimNode,
  zoom: number,
  isSelected: boolean,
  isHovered: boolean,
  isNeighbor: boolean,
  medianDegree: number
): { visible: boolean; alpha: number } {
  // Always show crisp label for selected, hovered, or direct neighbor notes
  if (isSelected || isHovered) {
    return { visible: true, alpha: 1.0 };
  }
  if (isNeighbor) {
    return { visible: true, alpha: 0.95 };
  }

  // Level 1: Zoomed far out (zoom < 0.65)
  // Only high-degree structural hubs and central index notes show labels
  if (zoom < 0.65) {
    if (node.isIndex || node.degree >= Math.max(4, medianDegree * 1.8)) {
      const alpha = Math.min(0.85, Math.max(0.4, (zoom - 0.25) / 0.4));
      return { visible: alpha > 0.1, alpha };
    }
    return { visible: false, alpha: 0 };
  }

  // Level 2: Medium zoom (0.65 <= zoom < 1.15)
  // Notes with multiple connections show labels, leaf notes remain uncluttered
  if (zoom < 1.15) {
    if (node.isIndex || node.degree >= 2) {
      const alpha = Math.min(0.9, Math.max(0.5, (zoom - 0.6) / 0.5));
      return { visible: true, alpha };
    }
    return { visible: false, alpha: 0 };
  }

  // Level 3: Zoomed in (zoom >= 1.15)
  // Full typography visibility across the dense network map
  const alpha = Math.min(1.0, 0.7 + (zoom - 1.15) * 0.3);
  return { visible: true, alpha };
}
