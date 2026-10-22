export type Role = 'user' | 'assistant';
export type MessageRole = Role;

export type WidgetView = 'minimized' | 'standard' | 'expanded';
export type ChatViewMode = WidgetView;

export type MessageStatus = 'complete' | 'streaming' | 'error';

export interface Source {
  citation: number;
  path: string;
  title: string;
  reviewed?: boolean;
  confidence?: number | string;
  status?: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  sources?: Source[];
  status?: MessageStatus;
  error?: string;
}

export interface ChatState {
  view: WidgetView;
  hydrated: boolean;
  initialized: boolean;
  draft: string;
  messages: ChatMessage[];
  isStreaming: boolean;
  isTyping: boolean;
  unreadCount: number;
  storageWarning: string | null;
  threadId: string;
  error?: string | null;
}

export type ChatAction =
  | { type: 'SET_VIEW'; payload: WidgetView }
  | { type: 'SET_DRAFT'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; patch: Partial<ChatMessage> } }
  | { type: 'APPEND_MESSAGE_CONTENT'; payload: { id: string; delta: string } }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_HYDRATED'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_THREAD_ID'; payload: string }
  | { type: 'INCREMENT_UNREAD' }
  | { type: 'RESET_UNREAD' }
  | { type: 'SET_STORAGE_WARNING'; payload: string | null }
  | { type: 'CLEAR_HISTORY' };

export interface AskRequest {
  thread_id: string;
  user_input: string;
}

export interface AskStreamCallbacks {
  onSources?: (sources: Source[]) => void;
  onToken?: (token: string) => void;
  onDone?: () => void;
  onError?: (errorMessage: string) => void;
}

export interface ChatTransport {
  sendMessage(message: string, history?: ChatMessage[]): Promise<ChatMessage>;
}
