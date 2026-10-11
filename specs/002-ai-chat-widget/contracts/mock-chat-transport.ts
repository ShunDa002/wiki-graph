export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatTransport {
  /**
   * Sends a message and returns the response asynchronously.
   * In a real implementation, this would make an API call to the backend.
   * @param message The user's input string.
   * @returns A promise resolving to the assistant's reply.
   */
  sendMessage(message: string): Promise<ChatMessage>;
}
