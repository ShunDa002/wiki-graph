import { ChatAction, ChatState } from './chat.types';

export const initialChatState: ChatState = {
  view: 'minimized',
  hydrated: false,
  initialized: false,
  draft: '',
  messages: [],
  isStreaming: false,
  mockTyping: false,
  unreadCount: 0,
  storageWarning: null,
  threadId: '',
  error: null,
};

export const MAX_DRAFT_LENGTH = 2000;

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_VIEW': {
      const isOpening = action.payload !== 'minimized' && state.view === 'minimized';
      return {
        ...state,
        view: action.payload,
        unreadCount: isOpening ? 0 : state.unreadCount,
      };
    }

    case 'SET_DRAFT': {
      return {
        ...state,
        draft: action.payload.slice(0, MAX_DRAFT_LENGTH),
      };
    }

    case 'ADD_MESSAGE': {
      const isUnread = state.view === 'minimized' && action.payload.role === 'assistant';
      return {
        ...state,
        messages: [...state.messages, action.payload],
        unreadCount: isUnread ? state.unreadCount + 1 : state.unreadCount,
      };
    }

    case 'UPDATE_MESSAGE': {
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id ? { ...msg, ...action.payload.patch } : msg
        ),
      };
    }

    case 'APPEND_MESSAGE_CONTENT': {
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? { ...msg, content: msg.content + action.payload.delta }
            : msg
        ),
      };
    }

    case 'SET_MESSAGES': {
      return {
        ...state,
        messages: action.payload,
      };
    }

    case 'SET_STREAMING': {
      return {
        ...state,
        isStreaming: action.payload,
      };
    }

    case 'SET_MOCK_TYPING': {
      return {
        ...state,
        mockTyping: action.payload,
      };
    }

    case 'SET_HYDRATED': {
      return {
        ...state,
        hydrated: action.payload,
      };
    }

    case 'SET_INITIALIZED': {
      return {
        ...state,
        initialized: action.payload,
      };
    }

    case 'SET_THREAD_ID': {
      return {
        ...state,
        threadId: action.payload,
      };
    }

    case 'INCREMENT_UNREAD': {
      return {
        ...state,
        unreadCount: state.unreadCount + 1,
      };
    }

    case 'RESET_UNREAD': {
      return {
        ...state,
        unreadCount: 0,
      };
    }

    case 'SET_STORAGE_WARNING': {
      return {
        ...state,
        storageWarning: action.payload,
      };
    }

    case 'CLEAR_HISTORY': {
      return {
        ...state,
        messages: [],
      };
    }

    default:
      return state;
  }
}
