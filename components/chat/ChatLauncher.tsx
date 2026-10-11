'use client';

import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Sparkles } from 'lucide-react';

interface ChatLauncherProps {
  onClick: () => void;
  unreadCount?: number;
}

export const ChatLauncher: React.FC<ChatLauncherProps> = ({ onClick, unreadCount = 0 }) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      id="chat-launcher-btn"
      aria-label="Open AI chat assistant"
      title="Open AI chat assistant"
      className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-xl shadow-indigo-500/25 border border-indigo-400/30 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#0a0d14] cursor-pointer"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      <div className="relative">
        <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />
        <Sparkles className="w-3.5 h-3.5 absolute -top-1.5 -right-2 text-cyan-200 animate-pulse" />
      </div>

      {unreadCount > 0 && (
        <span
          id="chat-unread-badge"
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-[11px] font-bold text-white bg-red-500 border-2 border-[#0a0d14] rounded-full shadow-md animate-bounce"
          aria-label={`${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </motion.button>
  );
};
