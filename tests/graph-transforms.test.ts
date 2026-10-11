import { describe, it, expect } from 'vitest';
import {
  filterGraphData,
  transformToReactFlowElements,
} from '../lib/graph-transforms';
import { GraphResponse } from '../lib/api';

const mockGraphData: GraphResponse = {
  schemaVersion: '1.0.0',
  generatedAt: '2026-10-10T00:00:00Z',
  sourceVersion: 'v1.0.0',
  nodes: [
    {
      id: 'n1',
      label: 'Alpha Node',
      type: 'note',
      metadata: {
        title: 'Alpha Note',
        path: 'concepts/alpha.md',
        folder: 'concepts',
        tags: ['architecture', 'core'],
        aliases: ['First'],
        excerpt: 'Alpha content excerpt',
        status: 'active',
        incomingCount: 0,
        outgoingCount: 1,
        isOrphan: false,
      },
    },
    {
      id: 'n2',
      label: 'Beta Node',
      type: 'note',
      metadata: {
        title: 'Beta Note',
        path: 'concepts/beta.md',
        folder: 'concepts',
        tags: ['core'],
        aliases: [],
        excerpt: 'Beta content excerpt',
        status: 'active',
        incomingCount: 1,
        outgoingCount: 0,
        isOrphan: false,
      },
    },
    {
      id: 'n3',
      label: 'Gamma Orphan',
      type: 'note',
      metadata: {
        title: 'Gamma Orphan',
        path: 'drafts/gamma.md',
        folder: 'drafts',
        tags: ['draft'],
        aliases: [],
        excerpt: 'Orphan note excerpt',
        status: 'draft',
        incomingCount: 0,
        outgoingCount: 0,
        isOrphan: true,
      },
    },
  ],
  edges: [
    {
      id: 'e1-2',
      source: 'n1',
      target: 'n2',
      type: 'wikilink',
    },
  ],
  unresolvedLinks: [
    {
      source: 'n1',
      target: 'NonExistentNote',
      type: 'wikilink',
    },
  ],
};

describe('filterGraphData', () => {
  it('returns all nodes when no filters are set', () => {
    const result = filterGraphData(mockGraphData, {});
    expect(result.filteredNodes.length).toBe(3);
    expect(result.filteredEdges.length).toBe(1);
  });

  it('filters nodes by folder', () => {
    const result = filterGraphData(mockGraphData, { selectedFolder: 'concepts' });
    expect(result.filteredNodes.length).toBe(2);
    expect(result.filteredNodes.map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(result.filteredEdges.length).toBe(1);
  });

  it('filters nodes by tag', () => {
    const result = filterGraphData(mockGraphData, { selectedTag: 'architecture' });
    expect(result.filteredNodes.length).toBe(1);
    expect(result.filteredNodes[0].id).toBe('n1');
    // Edge e1-2 connects n1 to n2, but n2 is filtered out, so filteredEdges should be empty
    expect(result.filteredEdges.length).toBe(0);
  });

  it('filters out orphans when hideOrphans is true', () => {
    const result = filterGraphData(mockGraphData, { hideOrphans: true });
    expect(result.filteredNodes.length).toBe(2);
    expect(result.filteredNodes.some((n) => n.id === 'n3')).toBe(false);
  });

  it('searches by query across title, label, and tags', () => {
    const result = filterGraphData(mockGraphData, { searchQuery: 'orphan' });
    expect(result.filteredNodes.length).toBe(1);
    expect(result.filteredNodes[0].id).toBe('n3');
  });
});

describe('transformToReactFlowElements', () => {
  it('transforms nodes and edges and maps unresolved links', () => {
    const { filteredNodes, filteredEdges, unresolvedBySource } = filterGraphData(
      mockGraphData,
      {}
    );

    const { flowNodes, flowEdges } = transformToReactFlowElements(
      filteredNodes,
      filteredEdges,
      unresolvedBySource,
      { selectedNodeId: null }
    );

    expect(flowNodes.length).toBe(3);
    expect(flowEdges.length).toBe(1);

    const n1Flow = flowNodes.find((n) => n.id === 'n1');
    expect(n1Flow?.data.unresolvedCount).toBe(1);
    expect(n1Flow?.data.unresolvedLinks[0].target).toBe('NonExistentNote');
  });

  it('computes neighborhood highlights when a node is selected', () => {
    const { filteredNodes, filteredEdges, unresolvedBySource } = filterGraphData(
      mockGraphData,
      {}
    );

    const { flowNodes, flowEdges } = transformToReactFlowElements(
      filteredNodes,
      filteredEdges,
      unresolvedBySource,
      { selectedNodeId: 'n1' }
    );

    const n1 = flowNodes.find((n) => n.id === 'n1');
    const n2 = flowNodes.find((n) => n.id === 'n2');
    const n3 = flowNodes.find((n) => n.id === 'n3');

    expect(n1?.data.isSelected).toBe(true);
    expect(n2?.data.isNeighbor).toBe(true);
    expect(n3?.data.isDimmed).toBe(true);
  });
});
