import { Node, Edge, MarkerType } from 'reactflow';
import { GraphResponse, GraphNode, GraphEdge, UnresolvedLink } from './api';

export interface WikiNodeData {
  node: GraphNode;
  unresolvedLinks: UnresolvedLink[];
  unresolvedCount: number;
  isSelected?: boolean;
  isNeighbor?: boolean;
  isDimmed?: boolean;
  isSearchMatch?: boolean;
  showLabels?: boolean;
}

export interface FilterOptions {
  searchQuery?: string;
  selectedFolder?: string | null;
  selectedTag?: string | null;
  hideOrphans?: boolean;
}

/**
 * Filters the graph nodes and edges according to active filter criteria.
 */
export function filterGraphData(
  graphData: GraphResponse,
  filters: FilterOptions
): {
  filteredNodes: GraphNode[];
  filteredEdges: GraphEdge[];
  unresolvedBySource: Map<string, UnresolvedLink[]>;
} {
  const { searchQuery = '', selectedFolder = null, selectedTag = null, hideOrphans = false } = filters;

  // Group unresolved links by source
  const unresolvedBySource = new Map<string, UnresolvedLink[]>();
  graphData.unresolvedLinks.forEach((link) => {
    const list = unresolvedBySource.get(link.source) || [];
    list.push(link);
    unresolvedBySource.set(link.source, list);
  });

  const query = searchQuery.trim().toLowerCase();

  const filteredNodes = graphData.nodes.filter((node) => {
    // 1. Orphan filter
    if (hideOrphans && node.metadata.isOrphan) {
      return false;
    }

    // 2. Folder filter
    if (selectedFolder && node.metadata.folder !== selectedFolder) {
      return false;
    }

    // 3. Tag filter
    if (selectedTag && !node.metadata.tags.includes(selectedTag)) {
      return false;
    }

    // 4. Search query filter
    if (query) {
      const matchLabel = node.label.toLowerCase().includes(query);
      const matchTitle = node.metadata.title.toLowerCase().includes(query);
      const matchPath = node.metadata.path.toLowerCase().includes(query);
      const matchTags = node.metadata.tags.some((t) => t.toLowerCase().includes(query));
      const matchAliases = node.metadata.aliases.some((a) => a.toLowerCase().includes(query));

      if (!matchLabel && !matchTitle && !matchPath && !matchTags && !matchAliases) {
        return false;
      }
    }

    return true;
  });

  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Only keep edges whose source and target are both in visible nodes
  const filteredEdges = graphData.edges.filter(
    (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );

  return {
    filteredNodes,
    filteredEdges,
    unresolvedBySource,
  };
}

/**
 * Transforms FastAPI Graph response to React Flow nodes and edges,
 * computing selection, neighborhood highlighting, and styling.
 */
export function transformToReactFlowElements(
  nodes: GraphNode[],
  edges: GraphEdge[],
  unresolvedBySource: Map<string, UnresolvedLink[]>,
  options: {
    selectedNodeId: string | null;
    searchQuery?: string;
    showLabels?: boolean;
  }
): {
  flowNodes: Node<WikiNodeData>[];
  flowEdges: Edge[];
} {
  const { selectedNodeId, searchQuery = '', showLabels = true } = options;
  const query = searchQuery.trim().toLowerCase();

  // Compute neighborhood if a node is selected
  const neighbors = new Set<string>();
  const activeEdgeIds = new Set<string>();

  if (selectedNodeId) {
    edges.forEach((edge) => {
      if (edge.source === selectedNodeId) {
        neighbors.add(edge.target);
        activeEdgeIds.add(edge.id);
      } else if (edge.target === selectedNodeId) {
        neighbors.add(edge.source);
        activeEdgeIds.add(edge.id);
      }
    });
  }

  const flowNodes: Node<WikiNodeData>[] = nodes.map((node) => {
    const isSelected = selectedNodeId === node.id;
    const isNeighbor = Boolean(selectedNodeId && neighbors.has(node.id));
    const isDimmed = Boolean(selectedNodeId && !isSelected && !isNeighbor);

    const isSearchMatch = Boolean(
      query &&
        (node.label.toLowerCase().includes(query) ||
          node.metadata.title.toLowerCase().includes(query) ||
          node.metadata.tags.some((t) => t.toLowerCase().includes(query)))
    );

    const unresolvedLinks = unresolvedBySource.get(node.id) || [];

    return {
      id: node.id,
      type: 'wikiNode',
      position: { x: 0, y: 0 }, // Assigned by layout engine
      data: {
        node,
        unresolvedLinks,
        unresolvedCount: unresolvedLinks.length,
        isSelected,
        isNeighbor,
        isDimmed,
        isSearchMatch,
        showLabels,
      },
    };
  });

  const flowEdges: Edge[] = edges.map((edge) => {
    const isActive = activeEdgeIds.has(edge.id);
    const isDimmed = Boolean(selectedNodeId && !isActive);

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: isActive,
      style: {
        stroke: isActive ? '#38bdf8' : isDimmed ? '#334155' : '#64748b',
        strokeWidth: isActive ? 2.5 : 1.2,
        opacity: isDimmed ? 0.25 : 0.75,
        transition: 'all 0.2s ease',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isActive ? '#38bdf8' : isDimmed ? '#334155' : '#64748b',
        width: 14,
        height: 14,
      },
    };
  });

  return { flowNodes, flowEdges };
}
