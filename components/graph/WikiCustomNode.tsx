'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WikiNodeData } from '../../lib/graph-transforms';
import { FileText, AlertCircle, Bookmark, Compass } from 'lucide-react';
import clsx from 'clsx';

function WikiCustomNodeComponent({ data }: NodeProps<WikiNodeData>) {
  const {
    node,
    unresolvedCount,
    isSelected,
    isNeighbor,
    isDimmed,
    isSearchMatch,
    showLabels = true,
  } = data;

  const isOrphan = node.metadata.isOrphan;
  const isIndex = node.type === 'index' || node.label.toLowerCase().includes('index');

  return (
    <div
      className={clsx(
        'group relative min-w-[180px] max-w-[240px] px-3 py-2.5 rounded-xl border backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg select-none',
        // Base backgrounds & borders
        isIndex
          ? 'bg-purple-950/40 border-purple-500/40 text-purple-100 hover:border-purple-400'
          : isOrphan
          ? 'bg-amber-950/30 border-amber-500/40 border-dashed text-amber-100 hover:border-amber-400'
          : 'bg-neutral-900/80 border-neutral-700/60 text-neutral-100 hover:border-neutral-500',
        // Highlighting states
        isSelected &&
          '!ring-2 !ring-blue-500 !border-blue-400 !bg-blue-950/60 shadow-blue-500/30 scale-105 z-30',
        isNeighbor &&
          '!ring-1 !ring-cyan-400/80 !border-cyan-400/60 !bg-neutral-800/90 shadow-cyan-500/20 z-20',
        isSearchMatch &&
          '!ring-2 !ring-amber-400 !border-amber-300 shadow-amber-500/20',
        isDimmed && 'opacity-25 grayscale-[30%] pointer-events-auto'
      )}
    >
      {/* Target & Source Handles for React Flow Edge Routing */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-blue-400 !border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-blue-400 !border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-blue-400 !border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-blue-400 !border-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Header Info: Type icon & Badges */}
      <div className="flex items-center justify-between space-x-1.5 mb-1.5">
        <div className="flex items-center space-x-1.5 min-w-0">
          {isIndex ? (
            <Compass className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          ) : isOrphan ? (
            <Bookmark className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          )}

          {node.metadata.folder && (
            <span className="text-[10px] text-neutral-400 truncate max-w-[90px] font-mono">
              {node.metadata.folder}
            </span>
          )}
        </div>

        {/* Diagnostic Badges */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {unresolvedCount > 0 && (
            <span
              title={`${unresolvedCount} unresolved wikilink${unresolvedCount > 1 ? 's' : ''}`}
              className="flex items-center space-x-0.5 px-1 py-0.5 text-[9px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded"
            >
              <AlertCircle className="w-2.5 h-2.5" />
              <span>{unresolvedCount}</span>
            </span>
          )}

          {isOrphan && (
            <span className="px-1 py-0.5 text-[9px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
              orphan
            </span>
          )}
        </div>
      </div>

      {/* Node Title / Label */}
      {showLabels && (
        <div className="font-medium text-xs text-white leading-tight truncate">
          {node.metadata.title || node.label}
        </div>
      )}

      {/* Tags preview (max 2) */}
      {node.metadata.tags && node.metadata.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1 overflow-hidden max-h-4">
          {node.metadata.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono"
            >
              #{tag}
            </span>
          ))}
          {node.metadata.tags.length > 2 && (
            <span className="text-[9px] text-neutral-500">
              +{node.metadata.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const WikiCustomNode = memo(WikiCustomNodeComponent);
