'use client';

import React, { useRef, useEffect } from 'react';
import { SendHorizontal, Square } from 'lucide-react';

interface MessageComposerProps {
  draft: string;
  onDraftChange: (draft: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

const MAX_CHARACTERS = 2000;

export const MessageComposer: React.FC<MessageComposerProps> = ({
  draft,
  onDraftChange,
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea height up to a max
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [draft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && draft.trim() && !disabled) {
        onSend();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_CHARACTERS);
    onDraftChange(value);
  };

  const isNearLimit = draft.length >= MAX_CHARACTERS * 0.9;
  const isAtLimit = draft.length >= MAX_CHARACTERS;

  return (
    <div className="p-3 bg-neutral-900/95 border-t border-neutral-800/80 rounded-b-2xl">
      <div className="relative flex items-end gap-2 bg-neutral-950/80 border border-neutral-800 focus-within:border-indigo-500/80 rounded-xl px-3 py-2 transition-colors">
        <textarea
          ref={textareaRef}
          id="chat-composer-input"
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isStreaming}
          placeholder="Ask a question about the graph... (Enter to send, Shift+Enter for newline)"
          rows={1}
          maxLength={MAX_CHARACTERS}
          className="flex-1 bg-transparent text-neutral-100 placeholder-neutral-500 text-xs sm:text-sm resize-none focus:outline-none max-h-28 overflow-y-auto leading-relaxed py-1 disabled:opacity-60"
        />

        <div className="flex items-center gap-2 shrink-0 pb-0.5">
          {draft.length > 50 && (
            <span
              className={`text-[10px] font-mono ${
                isAtLimit
                  ? 'text-red-400 font-bold'
                  : isNearLimit
                  ? 'text-amber-400'
                  : 'text-neutral-500'
              }`}
            >
              {draft.length}/{MAX_CHARACTERS}
            </span>
          )}

          {isStreaming ? (
            <button
              type="button"
              id="chat-stop-btn"
              onClick={onStop}
              aria-label="Stop generating"
              title="Stop generating"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-medium cursor-pointer shadow-sm transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              id="chat-send-btn"
              onClick={onSend}
              disabled={!draft.trim() || disabled}
              aria-label="Send message"
              title="Send message"
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-indigo-500/20"
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
