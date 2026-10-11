'use client';

import React from 'react';
import { GraphNode, UnresolvedLink } from '../../lib/api';
import { X, ArrowRight, ArrowLeft, AlertCircle, FileText, Bookmark } from 'lucide-react';

interface NodePreviewProps {
  node: GraphNode | null;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  incomingNeighbors?: GraphNode[];
  outgoingNeighbors?: GraphNode[];
  unresolvedLinks?: UnresolvedLink[];
}

export function NodePreview({
  node,
  onClose,
  onSelectNode,
  incomingNeighbors = [],
  outgoingNeighbors = [],
  unresolvedLinks = [],
}: NodePreviewProps) {
  if (!node) return null;

  const { title, path, folder, tags, aliases, excerpt, incomingCount, outgoingCount, isOrphan } =
    node.metadata;

  return (
    <aside
      id="node-preview-panel"
      className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 w-full md:max-w-sm transition-all duration-300 z-30 max-h-[85vh] overflow-y-auto"
      aria-label="Note details"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-800">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {folder && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-800/50 px-2 py-0.5 rounded-md">
                {folder}
              </span>
            )}
            {isOrphan && (
              <span className="text-[10px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-amber-400" />
                Orphan Note
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white leading-tight truncate">
            {title || node.label}
          </h2>
          {path && (
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5 break-all">
              {path}
            </p>
          )}
        </div>
        <button
          id="close-preview-btn"
          onClick={onClose}
          className="text-neutral-400 hover:text-white p-1.5 rounded-xl hover:bg-neutral-800 transition flex-shrink-0"
          title="Close preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tags & Aliases */}
      {((tags && tags.length > 0) || (aliases && aliases.length > 0)) && (
        <div className="flex flex-col gap-2">
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((t: string, idx: number) => (
                <span
                  key={`${t}-${idx}`}
                  className="text-[11px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md font-medium"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
          {aliases && aliases.length > 0 && (
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <span className="text-neutral-500">Aliases:</span>
              <span className="text-neutral-300">{aliases.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5">
          <div className="text-sm font-bold text-blue-400">{incomingCount}</div>
          <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
            Incoming Links
          </div>
        </div>
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5">
          <div className="text-sm font-bold text-emerald-400">{outgoingCount}</div>
          <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
            Outgoing Links
          </div>
        </div>
      </div>

      {/* Content Excerpt */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 block">
          Excerpt
        </label>
        <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/50 italic">
          &ldquo;{excerpt || 'No excerpt available for this note.'}&rdquo;
        </p>
      </div>

      {/* Unresolved Links Diagnostics (FR-009) */}
      {unresolvedLinks.length > 0 && (
        <div className="pt-2 border-t border-neutral-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Unresolved Wikilinks ({unresolvedLinks.length})</span>
          </span>
          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
            {unresolvedLinks.map((ul, idx) => (
              <div
                key={`${ul.source || ''}-${ul.target}-${idx}`}
                className="px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-900/40 text-[11px] text-rose-300 font-mono"
              >
                [[{ul.target}]]
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Notes */}
      <div className="flex flex-col gap-3 pt-2 border-t border-neutral-800 text-xs">
        {/* Outgoing */}
        {outgoingNeighbors.length > 0 && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-neutral-400" />
              <span>Links To ({outgoingNeighbors.length})</span>
            </span>
            <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
              {outgoingNeighbors.map((target, idx) => (
                <button
                  key={`${target.id}-${idx}`}
                  onClick={() => onSelectNode(target.id)}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300 hover:text-white transition flex items-center justify-between text-xs"
                >
                  <span className="truncate">{target.metadata.title || target.label}</span>
                  <span className="text-neutral-500 text-[10px] font-mono ml-2">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Incoming */}
        {incomingNeighbors.length > 0 && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3 text-neutral-400" />
              <span>Linked From ({incomingNeighbors.length})</span>
            </span>
            <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
              {incomingNeighbors.map((source, idx) => (
                <button
                  key={`${source.id}-${idx}`}
                  onClick={() => onSelectNode(source.id)}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300 hover:text-white transition flex items-center justify-between text-xs"
                >
                  <span className="truncate">{source.metadata.title || source.label}</span>
                  <span className="text-neutral-500 text-[10px] font-mono ml-2">←</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export const NotePreview = NodePreview;
