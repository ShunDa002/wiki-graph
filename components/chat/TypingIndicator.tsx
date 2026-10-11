'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div
      id="chat-typing-indicator"
      className="flex items-center gap-2.5 px-4 py-2 text-neutral-400 text-xs animate-in fade-in duration-200"
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      <div className="w-6 h-6 rounded-lg bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-indigo-400 shrink-0">
        <Bot className="w-3.5 h-3.5" />
      </div>

      <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800/80 border border-neutral-700/60 rounded-2xl rounded-tl-sm shadow-sm">
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0 }}
        />
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.15 }}
        />
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.3 }}
        />
        <span className="text-[11px] text-neutral-400 ml-1">Assistant is typing...</span>
      </div>
    </div>
  );
};
