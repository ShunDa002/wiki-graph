'use client';

import React from 'react';
import { Filter, X, RotateCcw, Folder, Tag, EyeOff } from 'lucide-react';

interface FilterPanelProps {
  folders: string[];
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  hideOrphans: boolean;
  onToggleHideOrphans: () => void;
  onClose?: () => void;
}

export function FilterPanel({
  folders,
  selectedFolder,
  onSelectFolder,
  tags,
  selectedTag,
  onSelectTag,
  hideOrphans,
  onToggleHideOrphans,
  onClose,
}: FilterPanelProps) {
  const hasActiveFilters = selectedFolder !== null || selectedTag !== null || hideOrphans;

  return (
    <aside
      id="graph-filter-panel"
      className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 shadow-2xl text-neutral-300 text-xs flex flex-col gap-3.5 max-w-xs w-full z-20"
    >
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <span className="font-semibold text-neutral-200 tracking-wide uppercase text-[11px] flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>Filters</span>
        </span>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              id="reset-filters-btn"
              onClick={() => {
                onSelectFolder(null);
                onSelectTag(null);
                if (hideOrphans) onToggleHideOrphans();
              }}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          {onClose && (
            <button
              id="close-filters-btn"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-200 p-1 transition"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Folders */}
      <div>
        <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1.5 flex items-center gap-1">
          <Folder className="w-3 h-3 text-neutral-400" />
          <span>Folders</span>
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          <button
            onClick={() => onSelectFolder(null)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              selectedFolder === null
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-neutral-950/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
            }`}
          >
            All Folders
          </button>
          {folders.map((folder) => (
            <button
              key={folder}
              onClick={() => onSelectFolder(selectedFolder === folder ? null : folder)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                selectedFolder === folder
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-neutral-950/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              {folder}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1.5 flex items-center gap-1">
            <Tag className="w-3 h-3 text-neutral-400" />
            <span>Tags</span>
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                  selectedTag === tag
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-neutral-950/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orphan Toggle */}
      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
          <EyeOff className="w-3 h-3 text-amber-400" />
          <span>Hide Isolated (Orphans)</span>
        </span>
        <button
          id="toggle-orphans-btn"
          role="switch"
          aria-checked={hideOrphans}
          onClick={onToggleHideOrphans}
          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
            hideOrphans ? 'bg-blue-600' : 'bg-neutral-800'
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
              hideOrphans ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </aside>
  );
}
