'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
  refreshTrigger?: number | string;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
  refreshTrigger,
}) => {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    const fetchPrompts = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') || '';
        let response: Response | null = null;
        if (backendUrl) {
          try {
            response = await fetch(`${backendUrl}/random-topics?t=${Date.now()}`);
          } catch {
            // Backend unreachable, fallback to local
          }
        }
        if (!response || !response.ok) {
          response = await fetch(`/random-topics?t=${Date.now()}`);
        }
        if (!response.ok) {
          throw new Error('Failed to fetch topics');
        }
        const data = await response.json();
        if (isMounted && Array.isArray(data)) {
          // Shuffle or select a random slice if more than 3
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          setPrompts(shuffled.slice(0, 3).map((topic: string) => `What is ${topic}?`));
        }
      } catch {
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPrompts();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  if (hasError || (!isLoading && prompts.length === 0)) {
    return null; // Show no suggested prompts on error or if empty
  }

  return (
    <div className="px-4 py-2 border-t border-neutral-800/60 bg-neutral-900/40">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 mb-2">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Suggested queries</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {isLoading ? (
          <>
            <div className="h-7 w-32 bg-neutral-800/50 rounded-full animate-pulse border border-neutral-700/60" />
            <div className="h-7 w-24 bg-neutral-800/50 rounded-full animate-pulse border border-neutral-700/60" />
            <div className="h-7 w-40 bg-neutral-800/50 rounded-full animate-pulse border border-neutral-700/60" />
          </>
        ) : (
          prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(prompt)}
              className="text-left text-[11px] px-2.5 py-1 rounded-full bg-neutral-800/80 hover:bg-indigo-950/60 hover:text-indigo-200 text-neutral-300 border border-neutral-700/60 hover:border-indigo-500/40 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {prompt}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
