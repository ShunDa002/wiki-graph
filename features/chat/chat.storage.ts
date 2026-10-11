import { ChatMessage, ChatViewMode } from './chat.types';

const STORAGE_KEYS = {
  DRAFT: 'llm_wiki_chat_draft',
  VIEW: 'llm_wiki_chat_view',
  HISTORY: 'llm_wiki_chat_history',
  INIT: 'llm_wiki_chat_init',
  THREAD_ID: 'llm_wiki_chat_thread_id',
} as const;

let storageWarningTriggered = false;

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeSessionStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    const testKey = '__storage_test__';
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function isStorageAvailable(): boolean {
  return safeLocalStorage() !== null && safeSessionStorage() !== null;
}

export function getStorageWarning(): string | null {
  if (typeof window === 'undefined') return null;
  if (!isStorageAvailable() && !storageWarningTriggered) {
    storageWarningTriggered = true;
    return 'Browser storage is unavailable. Chat history and drafts will not persist across reloads.';
  }
  return null;
}

export const chatStorage = {
  getDraft(): string {
    try {
      const storage = safeLocalStorage();
      return storage ? storage.getItem(STORAGE_KEYS.DRAFT) || '' : '';
    } catch {
      return '';
    }
  },

  setDraft(draft: string): void {
    try {
      const storage = safeLocalStorage();
      if (!storage) return;
      if (!draft) {
        storage.removeItem(STORAGE_KEYS.DRAFT);
      } else {
        storage.setItem(STORAGE_KEYS.DRAFT, draft);
      }
    } catch {
      // Degrade gracefully
    }
  },

  getView(): ChatViewMode | null {
    try {
      const storage = safeLocalStorage();
      if (!storage) return null;
      const view = storage.getItem(STORAGE_KEYS.VIEW);
      if (view === 'minimized' || view === 'standard' || view === 'expanded') {
        return view;
      }
      return null;
    } catch {
      return null;
    }
  },

  setView(view: ChatViewMode): void {
    try {
      const storage = safeLocalStorage();
      if (storage) {
        storage.setItem(STORAGE_KEYS.VIEW, view);
      }
    } catch {
      // Degrade gracefully
    }
  },

  getHistory(): ChatMessage[] {
    try {
      const storage = safeSessionStorage();
      if (!storage) return [];
      const data = storage.getItem(STORAGE_KEYS.HISTORY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  setHistory(messages: ChatMessage[]): void {
    try {
      const storage = safeSessionStorage();
      if (storage) {
        storage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(messages));
      }
    } catch {
      // Degrade gracefully
    }
  },

  getThreadId(): string | null {
    try {
      const storage = safeSessionStorage();
      return storage ? storage.getItem(STORAGE_KEYS.THREAD_ID) : null;
    } catch {
      return null;
    }
  },

  setThreadId(threadId: string): void {
    try {
      const storage = safeSessionStorage();
      if (storage) {
        storage.setItem(STORAGE_KEYS.THREAD_ID, threadId);
      }
    } catch {
      // Degrade gracefully
    }
  },

  isInitialized(): boolean {
    try {
      const storage = safeSessionStorage();
      if (!storage) return false;
      return storage.getItem(STORAGE_KEYS.INIT) === 'true';
    } catch {
      return false;
    }
  },

  setInitialized(initialized: boolean): void {
    try {
      const storage = safeSessionStorage();
      if (storage) {
        storage.setItem(STORAGE_KEYS.INIT, initialized ? 'true' : 'false');
      }
    } catch {
      // Degrade gracefully
    }
  },
};
