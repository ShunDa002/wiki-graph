'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { useChat } from '../../features/chat/useChat';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';

export const ChatWidget: React.FC = () => {
  const {
    state,
    setView,
    setDraft,
    sendMessage,
    stopGenerating,
    clearHistory,
    dismissWarning,
  } = useChat();

  const isMinimized = state.view === 'minimized';
  const isExpanded = state.view === 'expanded';
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Escape to minimize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMinimized) {
        setView('minimized');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMinimized, setView]);

  // Focus trap for mobile expanded modal mode
  useEffect(() => {
    if (isExpanded && typeof window !== 'undefined' && window.innerWidth < 640) {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstElement?.focus();

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      window.addEventListener('keydown', handleTab);
      return () => window.removeEventListener('keydown', handleTab);
    }
  }, [isExpanded]);

  return (
    <div ref={containerRef} id="chat-widget-root">
      {/* Mobile expanded backdrop overlay: only active when expanded and on mobile */}
      {isExpanded && (
        <div
          id="chat-modal-backdrop"
          onClick={() => setView('standard')}
          className="sm:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Non-blocking Storage Warning Toast (T018) */}
      {state.storageWarning && isMinimized && (
        <div
          id="chat-storage-warning-toast"
          role="alert"
          className="fixed bottom-24 right-5 z-50 max-w-xs flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-amber-950/95 border border-amber-600/70 rounded-xl text-amber-200 text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] leading-tight font-medium">{state.storageWarning}</span>
          </div>
          <button
            type="button"
            onClick={dismissWarning}
            id="chat-dismiss-warning-btn"
            className="text-amber-400 hover:text-amber-100 p-1 rounded-lg hover:bg-amber-900/50 cursor-pointer transition-colors"
            aria-label="Dismiss storage warning"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main positioning container - z-50 to ensure floating above NotePreview (z-40) */}
      <div
        data-testid="chat-widget-container"
        className={`fixed z-50 transition-all ${
          isMinimized
            ? 'sm:bottom-16 bottom-5 right-5 pointer-events-auto'
            : isExpanded
            ? 'inset-2 sm:inset-auto sm:bottom-5 sm:right-5 flex items-center justify-center sm:block pointer-events-none'
            : 'bottom-4 right-4 sm:bottom-5 sm:right-5 pointer-events-none'
        }`}
      >
        <AnimatePresence mode="wait">
          {isMinimized ? (
            <div key="launcher" className="pointer-events-auto">
              <ChatLauncher
                onClick={() => setView('standard')}
                unreadCount={state.unreadCount}
              />
            </div>
          ) : (
            <div key="panel" className="pointer-events-auto">
              <ChatPanel
                state={state}
                onSetView={setView}
                onSetDraft={setDraft}
                onSendMessage={sendMessage}
                onStopGenerating={stopGenerating}
                onClearHistory={clearHistory}
                onDismissWarning={dismissWarning}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
