'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, FileText, Layers } from 'lucide-react';
import { Source } from '../../features/chat/chat.types';

interface SourcesAccordionProps {
  sources: Source[];
  activeCitation?: number | null;
  pulseTrigger?: number;
  onSelectSource?: (source: Source) => void;
}

export const SourcesAccordion: React.FC<SourcesAccordionProps> = ({
  sources,
  activeCitation,
  pulseTrigger,
  onSelectSource,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-expand and smoothly scroll to citation item if user clicks an inline citation
  useEffect(() => {
    if (activeCitation != null && sources.some((s) => s.citation === activeCitation)) {
      setIsOpen(true);

      const el = document.getElementById(`source-item-${activeCitation}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const timer = setTimeout(() => {
          const delayedEl = document.getElementById(`source-item-${activeCitation}`);
          delayedEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [activeCitation, pulseTrigger, sources]);

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div
      id="sources-accordion"
      className="mb-2 rounded-xl bg-neutral-900/90 border border-neutral-700/60 overflow-hidden text-xs shadow-sm"
    >
      <button
        type="button"
        id="sources-accordion-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="sources-accordion-content"
        className="w-full flex items-center justify-between px-3 py-2 text-left bg-neutral-800/60 hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-300 font-medium"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sources ({sources.length})</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="sources-accordion-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="divide-y divide-neutral-800/80 overflow-hidden"
          >
            {sources.map((source) => {
              const isHighlighted = activeCitation === source.citation;
              return (
                <div
                  key={source.citation}
                  id={`source-item-${source.citation}`}
                  onClick={() => onSelectSource?.(source)}
                  className={`flex items-start gap-2.5 px-3 py-2 transition-all duration-200 cursor-pointer ${
                    isHighlighted
                      ? 'bg-indigo-950/80 border-l-2 border-indigo-400 ring-2 ring-indigo-400/80 shadow-[0_0_15px_rgba(99,102,241,0.25)] animate-pulse'
                      : 'hover:bg-neutral-800/40'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center min-w-5 h-5 rounded font-mono text-[10px] font-bold border mt-0.5 transition-colors ${
                      isHighlighted
                        ? 'bg-indigo-600 text-white border-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                        : 'bg-indigo-600/30 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    [{source.citation}]
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-medium text-neutral-200 truncate">
                      <FileText className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate">{source.title || source.path}</span>
                    </div>

                    <div className="text-[10px] text-neutral-400 font-mono truncate mt-0.5">
                      {source.path}
                    </div>

                    {(source.confidence != null || source.score != null) && (
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-neutral-400">
                        {source.confidence != null && (
                          <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/50">
                            Confidence: {typeof source.confidence === 'number' ? `${Math.round(source.confidence * 100)}%` : source.confidence}
                          </span>
                        )}
                        {source.score != null && (
                          <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/50">
                            Score: {source.score.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
