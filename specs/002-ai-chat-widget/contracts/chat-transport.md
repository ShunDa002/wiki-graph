# Chat Transport Interface

To ensure the mock implementation can eventually be replaced with a real RAG backend without modifying UI components, the widget logic must rely on an abstract `ChatTransport` interface.

## Interface Definition

```typescript
export interface ChatTransport {
  /**
   * Send a message to the backend. 
   * In the mock implementation, this introduces a 1-3 second delay to simulate processing.
   */
  sendMessage(message: string): Promise<string>;
}
```
