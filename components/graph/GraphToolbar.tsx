'use client';

import React from 'react';
import { LayoutAlgorithm, useGraphStore } from '../../store/useGraphStore';
import { Layers, SlidersHorizontal, Tag, Sparkles } from 'lucide-react';

interface GraphToolbarProps {
  nodeCount: number;
  edgeCount: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function GraphToolbar({
  nodeCount,
  edgeCount,
  onRefresh,
  isRefreshing,
}: GraphToolbarProps) {
  const {
    layoutAlgorithm,
    setLayoutAlgorithm,
    showLabels,
    setShowLabels,
    isFilterPanelOpen,
    toggleFilterPanel,
    isDiagnosticsPanelOpen,
    toggleDiagnosticsPanel,
  } = useGraphStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 px-4 py-2 rounded-2xl shadow-xl text-xs text-neutral-300">
      {/* Metrics */}
      <div className="flex items-center gap-3 font-medium">
        <span className="flex items-center gap-2 text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-white">{nodeCount}</span> Notes
        </span>
        <span className="text-neutral-600">•</span>
        <span className="text-neutral-400">
          <span className="font-mono text-neutral-300">{edgeCount}</span> Links
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Layout Switcher (FR-008) */}
        <div className="flex items-center gap-1.5 bg-neutral-950/60 px-2 py-1 rounded-xl border border-neutral-800">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-neutral-500 font-semibold text-[10px] uppercase tracking-wider">
            Layout
          </span>
          <select
            id="layout-select"
            value={layoutAlgorithm}
            onChange={(e) => setLayoutAlgorithm(e.target.value as LayoutAlgorithm)}
            className="bg-neutral-900 text-neutral-200 border-none outline-none rounded-lg px-2 py-1 text-xs cursor-pointer hover:bg-neutral-800 transition"
          >
            <option value="force">Force-Directed (Organic)</option>
            <option value="dagre-tb">Hierarchical (Top-Down)</option>
            <option value="dagre-lr">Hierarchical (Left-Right)</option>
            <option value="grid">Grid Structure</option>
            <option value="radial">Concentric Radial</option>
          </select>
        </div>

        {/* Labels Toggle */}
        <button
          id="toggle-labels-btn"
          onClick={() => setShowLabels(!showLabels)}
          className={`px-3 py-1.5 rounded-xl border transition font-medium ${
            showLabels
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30'
              : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          {showLabels ? 'Labels On' : 'Labels Off'}
        </button>

        {/* Filter Panel Toggle */}
        <button
          id="toggle-filter-panel-btn"
          onClick={toggleFilterPanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition font-medium ${
            isFilterPanelOpen
              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/30'
              : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>

        {/* Manual Refresh Button (FR-011) */}
        {onRefresh && (
          <button
            id="manual-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Check freshness and refresh graph data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300 hover:text-white transition font-medium disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
}
