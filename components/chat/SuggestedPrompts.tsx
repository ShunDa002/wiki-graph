'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
  refreshTrigger?: number | string;
}

/**
 * Extracts and cleans topic strings from various API response shapes
 * (flat string array, object with topics/data/suggestions array, or array of objects).
 */
export function extractTopicsList(data: unknown): string[] {
  let list: unknown[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.topics)) list = record.topics;
    else if (Array.isArray(record.random_topics)) list = record.random_topics;
    else if (Array.isArray(record.suggestions)) list = record.suggestions;
    else if (Array.isArray(record.data)) list = record.data;
    else if (Array.isArray(record.items)) list = record.items;
  }

  return list
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object' && item !== null) {
        const itemObj = item as Record<string, unknown>;
        const val = itemObj.topic || itemObj.title || itemObj.name || itemObj.label || itemObj.text;
        if (typeof val === 'string') return val.trim();
      }
      return '';
    })
    .filter((t) => Boolean(t));
}

/**
 * Formats a topic string into a natural question prompt chip.
 * Avoids redundant "What is What is...?" or duplicated trailing question marks.
 */
export function formatTopicToPrompt(topic: string): string {
  const trimmed = topic.trim();
  if (!trimmed) return '';

  // If already formatted as a full question/inquiry, preserve it with single trailing ?
  if (/^(what|how|why|where|when|which|who|can|explain|tell)\b/i.test(trimmed)) {
    return trimmed.endsWith('?') ? trimmed : `${trimmed}?`;
  }

  // Strip trailing punctuation before wrapping
  const clean = trimmed.replace(/[?.!]+$/, '');
  return `What is ${clean}?`;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
  refreshTrigger,
}) => {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    setIsLoading(true);
    setHasError(false);

    const fetchPrompts = async () => {
      try {
        // Build candidate URLs in order of reliability:
        // 1. Same-origin Next.js route /random-topics (most reliable, avoids CORS/DNS issues)
        // 2. Relative or local URL
        // 3. Fallback backend URL if explicitly non-docker
        const candidates: string[] = [];

        if (typeof window !== 'undefined') {
          // In browser, relative /random-topics hits the Next.js same-origin API route
          candidates.push('/random-topics');
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') || '';
        if (backendUrl && !backendUrl.includes('host.docker.internal')) {
          candidates.push(`${backendUrl}/random-topics`);
        }

        // Add fallback relative route if not already added
        if (!candidates.includes('/random-topics')) {
          candidates.push('/random-topics');
        }

        let response: Response | null = null;

        for (const url of candidates) {
          if (abortController.signal.aborted) return;
          try {
            // Short timeout to prevent hanging on unresponsive endpoints
            const timeoutSignal = AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined;
            const res = await fetch(url, {
              headers: { Accept: 'application/json' },
              cache: 'no-store',
              signal: timeoutSignal,
            });

            if (res.ok) {
              response = res;
              break;
            }
          } catch {
            // Try next candidate
          }
        }

        let rawTopics: string[] = [];

        if (response && response.ok) {
          const data = await response.json();
          rawTopics = extractTopicsList(data);
        }

        if (!isMounted) return;

        if (rawTopics.length === 0) {
          setHasError(true);
          setPrompts([]);
        } else {
          // Shuffle and pick top 3
          const shuffled = [...rawTopics].sort(() => 0.5 - Math.random());
          const selectedPrompts = shuffled
            .slice(0, 3)
            .map(formatTopicToPrompt)
            .filter(Boolean);

          if (selectedPrompts.length === 0) {
            setHasError(true);
            setPrompts([]);
          } else {
            setPrompts(selectedPrompts);
            setHasError(false);
          }
        }
      } catch {
        if (isMounted) {
          setHasError(true);
          setPrompts([]);
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
      abortController.abort();
    };
  }, [refreshTrigger, retryTrigger]);

  return (
    <div className="px-4 py-2 border-t border-neutral-800/60 bg-neutral-900/40">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 mb-2">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Suggested queries</span>
      </div>
      {isLoading ? (
        <div className="flex flex-wrap gap-1.5">
          <div className="h-7 w-32 bg-neutral-800/50 rounded-full animate-pulse border border-neutral-700/60" />
          <div className="h-7 w-24 bg-neutral-800/50 rounded-full animate-pulse border border-neutral-700/60" />
          <div className="h-7 w-40 bg-neutral-800/50 rounded-full animate-pulse border border-neutral-700/60" />
        </div>
      ) : hasError || prompts.length === 0 ? (
        <div className="flex items-center justify-between gap-2 py-0.5">
          <span className="text-[11px] text-neutral-400">
            Failed to load suggested topics
          </span>
          <button
            type="button"
            onClick={handleRetry}
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/80 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <RotateCcw className="w-3 h-3 text-neutral-400" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(prompt)}
              className="text-left text-[11px] px-2.5 py-1 rounded-full bg-neutral-800/80 hover:bg-indigo-950/60 hover:text-indigo-200 text-neutral-300 border border-neutral-700/60 hover:border-indigo-500/40 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
