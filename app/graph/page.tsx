'use client';

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGraph, getMetadata } from '../../lib/api';
import { useGraphStore } from '../../store/useGraphStore';
import { GraphCanvas } from '../../components/graph/GraphCanvas';
import { ErrorPanel } from '../../components/graph/ErrorPanel';
import { SearchBox } from '../../components/graph/SearchBox';
import { FilterPanel } from '../../components/graph/FilterPanel';
import { NodePreview } from '../../components/graph/NodePreview';
import { GraphToolbar } from '../../components/graph/GraphToolbar';

export default function GraphPage() {
  const {
    selectedNodeId,
    setSelectedNodeId,
    searchQuery,
    setSearchQuery,
    selectedFolder,
    setSelectedFolder,
    selectedTag,
    setSelectedTag,
    hideOrphans,
    setHideOrphans,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
  } = useGraphStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch graph data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['graph'],
    queryFn: getGraph,
  });

  // 2. Metadata Freshness Check on initial load (FR-011)
  useEffect(() => {
    async function checkFreshness() {
      try {
        const metadata = await getMetadata();
        if (data && metadata.generatedAt !== data.generatedAt) {
          // Backend has updated graph data
          refetch();
        }
      } catch (e) {
        // Soft-fail freshness check without breaking current view
        console.warn('Metadata freshness check failed:', e);
      }
    }

    if (data) {
      checkFreshness();
    }
  }, [data, refetch]);

  // 3. Manual Refresh handler (FR-011)
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // 4. Initial URL search parameter sync for `?note=` (FR-004)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const noteParam = params.get('note');
      if (noteParam) {
        setSelectedNodeId(noteParam);
      }
    }
  }, [setSelectedNodeId]);

  // 5. Synchronize URL on node selection change
  const handleSelectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (nodeId) {
        url.searchParams.set('note', nodeId);
      } else {
        url.searchParams.delete('note');
      }
      window.history.pushState({}, '', url.toString());
    }
  }, [setSelectedNodeId]);

  // 6. Listen to browser history navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedNodeId(params.get('note'));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setSelectedNodeId]);

  // 7. Derived folders and tags
  const folders = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.nodes.map((n) => n.metadata.folder).filter(Boolean))).sort();
  }, [data]);

  const tags = useMemo(() => {
    if (!data) return [];
    const allTags = new Set<string>();
    data.nodes.forEach((n) => n.metadata.tags.forEach((t) => allTags.add(t)));
    return Array.from(allTags).sort();
  }, [data]);

  // 8. Derived selected node and its neighbors
  const selectedNode = useMemo(() => {
    if (!data || !selectedNodeId) return null;
    return data.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [data, selectedNodeId]);

  const { incomingNeighbors, outgoingNeighbors, selectedUnresolvedLinks } = useMemo(() => {
    if (!data || !selectedNodeId) {
      return { incomingNeighbors: [], outgoingNeighbors: [], selectedUnresolvedLinks: [] };
    }

    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));
    const seenIncoming = new Set<string>();
    const seenOutgoing = new Set<string>();
    const incoming: typeof data.nodes = [];
    const outgoing: typeof data.nodes = [];

    data.edges.forEach((edge) => {
      if (edge.source === selectedNodeId) {
        const targetNode = nodeMap.get(edge.target);
        if (targetNode && !seenOutgoing.has(targetNode.id)) {
          seenOutgoing.add(targetNode.id);
          outgoing.push(targetNode);
        }
      } else if (edge.target === selectedNodeId) {
        const sourceNode = nodeMap.get(edge.source);
        if (sourceNode && !seenIncoming.has(sourceNode.id)) {
          seenIncoming.add(sourceNode.id);
          incoming.push(sourceNode);
        }
      }
    });

    const unresolved = data.unresolvedLinks.filter((ul) => ul.source === selectedNodeId);

    return {
      incomingNeighbors: incoming,
      outgoingNeighbors: outgoing,
      selectedUnresolvedLinks: unresolved,
    };
  }, [data, selectedNodeId]);

  // 9. Matching node count for search
  const searchMatchCount = useMemo(() => {
    if (!data || !searchQuery.trim()) return undefined;
    const q = searchQuery.toLowerCase();
    return data.nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.metadata.title.toLowerCase().includes(q) ||
        n.metadata.tags.some((t) => t.toLowerCase().includes(q))
    ).length;
  }, [data, searchQuery]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#060b18] text-neutral-100 flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-cyan-950/60 bg-[#070e24]/80 backdrop-blur-md px-4 flex items-center justify-between z-20 gap-4">
        <div className="flex items-center space-x-3 flex-shrink-0">
          <span className="text-xl">🕸️</span>
          <h1 className="font-semibold text-lg text-white tracking-tight hidden sm:inline">
            LLM Wiki Graph
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
            Neon Constellation
          </span>
        </div>

        <div className="flex-1 max-w-sm">
          <SearchBox
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={searchMatchCount}
          />
        </div>

        <div className="flex items-center">
          <GraphToolbar
            nodeCount={data?.nodes.length || 0}
            edgeCount={data?.edges.length || 0}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        </div>
      </header>

      {/* Main Canvas & Overlays */}
      <div className="relative flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#060b18]/85 backdrop-blur-sm z-30">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin shadow-[0_0_12px_rgba(0,240,255,0.5)]" />
              <p className="text-sm font-medium text-cyan-200">Loading knowledge graph...</p>
            </div>
          </div>
        )}

        {error && <ErrorPanel error={error} onRetry={() => refetch()} />}

        {data && (
          <GraphCanvas graphData={data} onSelectNode={handleSelectNode} />
        )}

        {/* Filter Panel (Overlay Top-Left / Top-Right) */}
        {isFilterPanelOpen && (
          <div className="absolute top-4 left-4 z-30">
            <FilterPanel
              folders={folders}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
              tags={tags}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
              hideOrphans={hideOrphans}
              onToggleHideOrphans={() => setHideOrphans(!hideOrphans)}
              onClose={() => setIsFilterPanelOpen(false)}
            />
          </div>
        )}

        {/* Selected Node Preview Panel (Overlay Top-Right / Bottom on mobile) */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-30 max-w-sm w-full">
            <NodePreview
              node={selectedNode}
              onClose={() => handleSelectNode(null)}
              onSelectNode={handleSelectNode}
              incomingNeighbors={incomingNeighbors}
              outgoingNeighbors={outgoingNeighbors}
              unresolvedLinks={selectedUnresolvedLinks}
            />
          </div>
        )}
      </div>
    </main>
  );
}
