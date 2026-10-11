'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  value: string;
  onChange: (query: string) => void;
  resultCount?: number;
}

export function SearchBox({ value, onChange, resultCount }: SearchBoxProps) {
  return (
    <div className="relative w-full max-w-sm">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-neutral-400 pointer-events-none">
          <Search className="w-4 h-4 text-neutral-400" />
        </div>

        <input
          id="graph-search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search notes, aliases, tags..."
          className="w-full bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-neutral-100 placeholder-neutral-500 rounded-2xl pl-10 pr-20 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition shadow-lg"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {value ? (
            <button
              id="clear-search-btn"
              onClick={() => onChange('')}
              className="text-neutral-400 hover:text-neutral-200 p-1 text-xs transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {value && typeof resultCount === 'number' && (
            <span className="text-[11px] bg-neutral-800 text-blue-300 border border-neutral-700 px-2 py-0.5 rounded-full font-mono">
              {resultCount} found
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
