'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChatHeader } from './ChatHeader';
import { MessageViewport } from './MessageViewport';
import { MessageComposer } from './MessageComposer';
import { SuggestedPrompts } from './SuggestedPrompts';
import { ChatState, ChatViewMode } from '../../features/chat/chat.types';
import { AlertCircle, X } from 'lucide-react';

interface ChatPanelProps {
  state: ChatState;
  onSetView: (view: ChatViewMode) => void;
  onSetDraft: (draft: string) => void;
  onSendMessage: (textOverride?: string) => void;
  onStopGenerating?: () => void;
  onClearHistory: () => void;
  onDismissWarning: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  state,
  onSetView,
  onSetDraft,
  onSendMessage,
  onStopGenerating,
  onClearHistory,
  onDismissWarning,
}) => {
  const isExpanded = state.view === 'expanded';
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap for expanded mode (T025)
  useEffect(() => {
    if (!isExpanded) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusableElements = panel.querySelectorAll<HTMLElement>(focusableSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentFocusables = panel.querySelectorAll<HTMLElement>(focusableSelector);
      const currentFirst = currentFocusables[0];
      const currentLast = currentFocusables[currentFocusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === currentFirst) {
          e.preventDefault();
          currentLast?.focus();
        }
      } else {
        if (document.activeElement === currentLast) {
          e.preventDefault();
          currentFirst?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isExpanded]);

  const handleToggleExpand = () => {
    onSetView(isExpanded ? 'standard' : 'expanded');
  };

  const handleMinimize = () => {
    onSetView('minimized');
  };

  const panelClasses = isExpanded
    ? 'w-[94vw] sm:w-[680px] md:w-[760px] h-[82.8vh] sm:h-[648px] max-h-[calc(100vh-2.5rem)]'
    : 'w-[94vw] sm:w-[400px] md:w-[430px] h-[80vh] sm:h-[540px] max-h-[calc(100vh-2.5rem)]';

  const isGenerating = state.isStreaming || state.isTyping;
  const userMessageCount = state.messages.filter((m) => m.role === 'user').length;

  return (
    <motion.div
      ref={panelRef}
      layout
      id="chat-panel"
      role="region"
      aria-label="AI Chat Assistant"
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col ${panelClasses} max-w-full bg-neutral-900/95 backdrop-blur-xl border border-neutral-800/90 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/60 overflow-hidden z-50`}
    >
      {/* Header */}
      <ChatHeader
        view={state.view}
        isTyping={isGenerating}
        onToggleExpand={handleToggleExpand}
        onMinimize={handleMinimize}
        onClearHistory={onClearHistory}
      />

      {/* Storage Warning Toast */}
      {state.storageWarning && (
        <div
          id="chat-storage-warning"
          className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-950/60 border-b border-amber-800/60 text-amber-200 text-xs animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] leading-tight">{state.storageWarning}</span>
          </div>
          <button
            type="button"
            onClick={onDismissWarning}
            className="text-amber-400 hover:text-amber-200 p-0.5 cursor-pointer"
            aria-label="Dismiss warning"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages */}
      <MessageViewport
        messages={state.messages}
        isTyping={state.isTyping}
        isStreaming={state.isStreaming}
      />

      {/* Suggested Prompts (renewed on every user message submission) */}
      <SuggestedPrompts
        refreshTrigger={userMessageCount}
        onSelectPrompt={(prompt) => {
          onSendMessage(prompt);
        }}
        disabled={isGenerating}
      />

      {/* Composer */}
      <MessageComposer
        draft={state.draft}
        onDraftChange={onSetDraft}
        onSend={() => onSendMessage()}
        onStop={onStopGenerating}
        isStreaming={state.isStreaming}
        disabled={isGenerating}
      />
    </motion.div>
  );
};
