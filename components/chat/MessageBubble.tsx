'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bot, User, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../../features/chat/chat.types';
import { SourcesAccordion } from './SourcesAccordion';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);

  const isStreaming = message.status === 'streaming';

  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCitationClick = (citationNumber: number) => {
    if (isStreaming) return;
    if (!message.sources || !message.sources.some((s) => s.citation === citationNumber)) {
      return;
    }
    setActiveCitation(citationNumber);
    setPulseTrigger((prev) => prev + 1);
  };

  const renderContentWithCitations = (text: string) => {
    if (!text) return null;
    const citationRegex = /\[(\d+)\]/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        elements.push(text.slice(lastIndex, matchIndex));
      }
      const citationNumber = parseInt(match[1], 10);
      elements.push(
        <button
          key={`citation-${matchIndex}`}
          type="button"
          data-citation={citationNumber}
          disabled={isStreaming}
          onClick={() => handleCitationClick(citationNumber)}
          className={`inline-flex items-center text-[11px] font-semibold font-mono px-1 py-0.5 mx-0.5 rounded border align-baseline transition-colors ${
            isStreaming
              ? 'opacity-60 cursor-not-allowed bg-indigo-500/10 text-indigo-400/60 border-indigo-500/20'
              : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 hover:text-indigo-100 border-indigo-500/40 cursor-pointer'
          }`}
          title={isStreaming ? `Generating response...` : `View Source [${citationNumber}]`}
        >
          [{citationNumber}]
        </button>
      );
      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return elements;
  };

  const isSimulated = message.isSimulated === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-2.5 my-2 px-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs shadow-sm ${isUser
          ? 'bg-indigo-600 text-white'
          : 'bg-neutral-800 border border-neutral-700 text-indigo-400'
          }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Assistant Sources Accordion (rendered above answer bubble) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full mb-1">
            <SourcesAccordion
              sources={message.sources}
              activeCitation={activeCitation}
              pulseTrigger={pulseTrigger}
              onSelectSource={(s) => {
                setActiveCitation(s.citation);
                setPulseTrigger((prev) => prev + 1);
              }}
            />
          </div>
        )}

        <div
          className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${isUser
            ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-tr-sm border border-indigo-400/30'
            : 'bg-neutral-800/90 text-neutral-200 rounded-tl-sm border border-neutral-700/60 w-full'
            }`}
        >
          {!message.content && message.status === 'streaming' ? (
            <div className="flex items-center gap-1.5 py-0.5 text-neutral-400">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0 }}
              />
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.15 }}
              />
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.3 }}
              />
              <span className="text-[11px] text-neutral-400 ml-1">Assistant is typing...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {isUser ? message.content : renderContentWithCitations(message.content)}
              {message.status === 'streaming' && (
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Inline red error banner for partial/failed generation */}
          {message.error && (
            <div
              id="message-error-banner"
              className="mt-2.5 px-3 py-2 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="leading-snug">{message.error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-neutral-500 font-mono">
          <span>{timeString}</span>
          {!isUser && isSimulated && (
            <span
              id="message-simulated-badge"
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-indigo-400 border border-neutral-700/80 font-sans tracking-wide font-medium"
            >
              Simulated
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
