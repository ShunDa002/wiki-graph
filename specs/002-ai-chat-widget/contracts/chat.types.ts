export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export type WidgetView = 'minimized' | 'standard' | 'expanded';

export interface ChatState {
  view: WidgetView;
  hydrated: boolean;
  initialized: boolean;
  draft: string;
  messages: ChatMessage[];
  mockTyping: boolean;
  unreadCount: number;
}

export interface ChatTransport {
  /**
   * Sends a message and returns the response asynchronously.
   * @param message The user message to send
   * @param history The conversation history up to this point
   * @returns A promise that resolves to the assistant's reply message
   */
  sendMessage(message: string, history: ChatMessage[]): Promise<ChatMessage>;
}
