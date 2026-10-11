import { ChatMessage, ChatTransport } from './chat.types';

export class MockChatTransport implements ChatTransport {
  private minDelayMs: number;
  private maxDelayMs: number;

  constructor(minDelayMs = 1000, maxDelayMs = 3000) {
    this.minDelayMs = minDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  async sendMessage(message: string): Promise<ChatMessage> {
    const delay = Math.floor(
      Math.random() * (this.maxDelayMs - this.minDelayMs + 1) + this.minDelayMs
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    const content = this.generateResponse(message);
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      id,
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
  }

  private generateResponse(input: string): string {
    const normalized = input.trim().toLowerCase();

    if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hey')) {
      return "Hello! I'm your AI wiki assistant prototype. How can I help you explore your knowledge graph today?";
    }

    if (normalized.includes('graph') || normalized.includes('node') || normalized.includes('edge')) {
      return "Your knowledge graph visualizes notes as interconnected nodes. You can filter by folder or tag, switch layouts, and click any node to view incoming and outgoing connections.";
    }

    if (normalized.includes('rag') || normalized.includes('backend') || normalized.includes('llm')) {
      return "Currently, I am operating in static mock mode with simulated latency. In a future phase, a retrieval-augmented generation (RAG) backend will connect directly to your parsed wiki notes!";
    }

    if (normalized.includes('search') || normalized.includes('find')) {
      return "You can use the search bar at the top of the canvas to highlight nodes by title, tag, or alias in real time.";
    }

    return `I received your query: "${input.slice(0, 100)}${input.length > 100 ? '...' : ''}". In this prototype environment, all assistant responses are simulated client-side.`;
  }
}

export const defaultMockTransport = new MockChatTransport();
