'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../../features/chat/chat.types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageSquareDashed } from 'lucide-react';

interface MessageViewportProps {
  messages: ChatMessage[];
  isTyping?: boolean;
  isStreaming?: boolean;
}

export const MessageViewport: React.FC<MessageViewportProps> = ({
  messages,
  isTyping = false,
  isStreaming = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isTyping, isStreaming]);

  // For active streaming tokens, keep scroll pinned
  const lastMessage = messages[messages.length - 1];
  const lastMessageLength = lastMessage?.content?.length;
  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    }
  }, [lastMessageLength, isStreaming]);

  const hasStreamingMessage = messages.some(
    (msg) => msg.role === 'assistant' && msg.status === 'streaming'
  );

  return (
    <div
      id="chat-message-viewport"
      tabIndex={0}
      aria-label="Chat messages history"
      className="flex-1 overflow-y-auto px-1 py-3 space-y-1 scroll-smooth focus:outline-none"
    >
      {messages.length === 0 && !isTyping && (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500 gap-2">
          <MessageSquareDashed className="w-8 h-8 stroke-1 text-neutral-600" />
          <p className="text-xs">No messages yet. Send a prompt below to start chatting!</p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {isTyping && !hasStreamingMessage && <TypingIndicator />}

      <div ref={bottomRef} className="h-2" />
    </div>
  );
};
