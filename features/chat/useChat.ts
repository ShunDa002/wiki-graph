'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ChatViewMode, Source } from './chat.types';
import { chatReducer, initialChatState } from './chat.reducer';
import { chatStorage, getStorageWarning } from './chat.storage';
import { askQuestionStream } from './chat.api';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome_assistant_0',
  role: 'assistant',
  content:
    'Welcome to your AI Wiki Assistant! I can help you navigate notes, discover related topics, and answer questions about your knowledge vault.',
  timestamp: Date.now(),
  status: 'complete',
};

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Fallback streaming generator for offline/static development and testing.
 */
async function fallbackStreamingResponse(
  input: string,
  onSources: (sources: Source[]) => void,
  onToken: (token: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const initialDelay = 800;
  await new Promise((resolve) => setTimeout(resolve, initialDelay));
  if (signal?.aborted) return;

  const sampleSources: Source[] = [
    {
      citation: 1,
      path: 'wiki/graph-architecture.md',
      title: 'Graph Architecture',
      confidence: 0.94,
    },
    {
      citation: 2,
      path: 'wiki/semantic-search.md',
      title: 'Semantic Search Engine',
      confidence: 0.88,
    },
  ];
  onSources(sampleSources);

  const normalized = input.trim().toLowerCase();
  let fullAnswer: string;

  if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hey')) {
    fullAnswer =
      "Hello! I'm your AI wiki assistant. How can I help you explore your knowledge graph today? [1]";
  } else if (normalized.includes('graph') || normalized.includes('node') || normalized.includes('edge')) {
    fullAnswer =
      'Your knowledge graph visualizes notes as interconnected nodes. You can filter by folder or tag, switch layouts, and click any node to view connections. [1]';
  } else if (normalized.includes('rag') || normalized.includes('backend') || normalized.includes('llm')) {
    fullAnswer =
      'A retrieval-augmented generation (RAG) backend connects directly to your parsed wiki notes! [2]';
  } else if (normalized.includes('search') || normalized.includes('find')) {
    fullAnswer =
      'You can use the search bar at the top of the canvas to highlight nodes by title, tag, or alias in real time. [2]';
  } else {
    fullAnswer = `I received your query: "${input.slice(0, 100)}${input.length > 100 ? '...' : ''}". [1]`;
  }

  const words = fullAnswer.split(' ');
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) return;
    const chunk = (i === 0 ? '' : ' ') + words[i];
    onToken(chunk);
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  if (signal?.aborted) return;
  onDone();
}

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const hydratedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Hydrate state from storage on mount
  useEffect(() => {
    const warning = getStorageWarning();
    if (warning) {
      dispatch({ type: 'SET_STORAGE_WARNING', payload: warning });
    }

    const savedDraft = chatStorage.getDraft();
    const savedView = chatStorage.getView();
    const savedHistory = chatStorage.getHistory();
    const savedThreadId = chatStorage.getThreadId();
    const isInit = chatStorage.isInitialized();

    const activeThreadId = savedThreadId || generateUuid();
    dispatch({ type: 'SET_THREAD_ID', payload: activeThreadId });
    chatStorage.setThreadId(activeThreadId);

    if (savedDraft) {
      dispatch({ type: 'SET_DRAFT', payload: savedDraft });
    }

    if (savedView) {
      dispatch({ type: 'SET_VIEW', payload: savedView });
    }

    if (savedHistory.length > 0) {
      dispatch({ type: 'SET_MESSAGES', payload: savedHistory });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } else if (!isInit) {
      // First time initialization welcome message (FR-004)
      dispatch({ type: 'SET_MESSAGES', payload: [WELCOME_MESSAGE] });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      chatStorage.setHistory([WELCOME_MESSAGE]);
      chatStorage.setInitialized(true);
    } else {
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    }

    dispatch({ type: 'SET_HYDRATED', payload: true });
    hydratedRef.current = true;

    return () => {
      // Cleanup any active stream on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // 2. Sync changes back to storage after initial hydration
  useEffect(() => {
    if (!hydratedRef.current) return;
    chatStorage.setDraft(state.draft);
  }, [state.draft]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    chatStorage.setView(state.view);
  }, [state.view]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    chatStorage.setHistory(state.messages);
  }, [state.messages]);

  useEffect(() => {
    if (!hydratedRef.current || !state.threadId) return;
    chatStorage.setThreadId(state.threadId);
  }, [state.threadId]);

  // Actions
  const setView = useCallback((view: ChatViewMode) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const setDraft = useCallback((draft: string) => {
    dispatch({ type: 'SET_DRAFT', payload: draft });
  }, []);

  const dismissWarning = useCallback(() => {
    dispatch({ type: 'SET_STORAGE_WARNING', payload: null });
  }, []);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    dispatch({ type: 'SET_STREAMING', payload: false });
    dispatch({ type: 'SET_TYPING', payload: false });
  }, []);

  const clearHistory = useCallback(() => {
    stopGenerating();
    dispatch({ type: 'CLEAR_HISTORY' });
    chatStorage.setHistory([]);
  }, [stopGenerating]);

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? state.draft).trim();
      if (!text || state.isStreaming || state.isTyping) return;

      const userMessage: ChatMessage = {
        id: generateUuid(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };

      if (!textOverride) {
        dispatch({ type: 'SET_DRAFT', payload: '' });
      }

      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      // Create empty assistant message placeholder for streaming
      const assistantMessageId = generateUuid();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        sources: [],
        status: 'streaming',
      };

      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
      dispatch({ type: 'SET_STREAMING', payload: true });
      dispatch({ type: 'SET_TYPING', payload: true });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const activeThreadId = state.threadId || generateUuid();
      let streamFallbackNeeded = false;
      let receivedBackendData = false;

      // Check if real backend is specified or try calling askQuestionStream
      try {
        await askQuestionStream(
          activeThreadId,
          text,
          {
            onSources: (sources) => {
              receivedBackendData = true;
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: { id: assistantMessageId, patch: { sources } },
              });
            },
            onToken: (token) => {
              receivedBackendData = true;
              // Once tokens start streaming, turn off typing indicator
              dispatch({ type: 'SET_TYPING', payload: false });
              dispatch({
                type: 'APPEND_MESSAGE_CONTENT',
                payload: { id: assistantMessageId, delta: token },
              });
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: { id: assistantMessageId, patch: {} },
              });
            },
            onDone: () => {
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: { id: assistantMessageId, patch: { status: 'complete' } },
              });
              dispatch({ type: 'SET_STREAMING', payload: false });
              dispatch({ type: 'SET_TYPING', payload: false });
              abortControllerRef.current = null;
            },
            onError: (errMsg) => {
              // If backend failed and NO data has arrived yet, fallback gracefully
              if (!receivedBackendData) {
                streamFallbackNeeded = true;
              } else {
                dispatch({
                  type: 'UPDATE_MESSAGE',
                  payload: { id: assistantMessageId, patch: { status: 'error', error: errMsg } },
                });
                dispatch({ type: 'SET_STREAMING', payload: false });
                dispatch({ type: 'SET_TYPING', payload: false });
                abortControllerRef.current = null;
              }
            },
          },
          { signal: controller.signal }
        );
      } catch {
        if (!receivedBackendData) {
          streamFallbackNeeded = true;
        }
      }

      // If backend was unreachable, no backend data was received, and request was not aborted
      if (streamFallbackNeeded && !receivedBackendData && !controller.signal.aborted) {
        try {
          await fallbackStreamingResponse(
            text,
            (sources) => {
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: { id: assistantMessageId, patch: { sources } },
              });
            },
            (token) => {
              dispatch({ type: 'SET_TYPING', payload: false });
              dispatch({
                type: 'APPEND_MESSAGE_CONTENT',
                payload: { id: assistantMessageId, delta: token },
              });
            },
            () => {
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: { id: assistantMessageId, patch: { status: 'complete' } },
              });
              dispatch({ type: 'SET_STREAMING', payload: false });
              dispatch({ type: 'SET_TYPING', payload: false });
              abortControllerRef.current = null;
            },
            controller.signal
          );
        } catch {
          // Handled or cancelled
        }
      }

      if (controller.signal.aborted) {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { id: assistantMessageId, patch: { status: 'complete' } },
        });
        dispatch({ type: 'SET_STREAMING', payload: false });
        dispatch({ type: 'SET_TYPING', payload: false });
      }
    },
    [state.draft, state.isStreaming, state.isTyping, state.threadId]
  );

  return {
    state,
    setView,
    setDraft,
    sendMessage,
    stopGenerating,
    clearHistory,
    dismissWarning,
  };
}

export type UseChatReturn = ReturnType<typeof useChat>;
