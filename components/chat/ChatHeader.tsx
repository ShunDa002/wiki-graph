'use client';

import React from 'react';
import { Bot, Maximize2, Minimize2, Minus, Trash2 } from 'lucide-react';
import { ChatViewMode } from '../../features/chat/chat.types';

interface ChatHeaderProps {
  view: ChatViewMode;
  isTyping?: boolean;
  onToggleExpand: () => void;
  onMinimize: () => void;
  onClearHistory?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  view,
  isTyping = false,
  onToggleExpand,
  onMinimize,
  onClearHistory,
}) => {
  const isExpanded = view === 'expanded';

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-neutral-900/95 border-b border-neutral-800/80 rounded-t-2xl select-none">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">LLM Wiki AI</h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isTyping ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span>{isTyping ? 'Thinking...' : 'Ready'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-neutral-400">
        {onClearHistory && (
          <button
            type="button"
            onClick={onClearHistory}
            id="chat-clear-btn"
            aria-label="Clear chat history"
            title="Clear chat history"
            className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleExpand}
          id="chat-expand-btn"
          aria-label={isExpanded ? 'Restore window size' : 'Expand window'}
          title={isExpanded ? 'Restore' : 'Expand'}
          className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-neutral-200 transition-colors cursor-pointer"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onMinimize}
          id="chat-minimize-btn"
          aria-label="Minimize chat window"
          title="Minimize"
          className="p-1.5 rounded-lg hover:bg-neutral-800 hover:text-neutral-200 transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
