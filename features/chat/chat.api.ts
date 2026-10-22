import { AskStreamCallbacks, Source } from './chat.types';

let cachedWorkingEndpoint: string | null = null;

export function getCandidateEndpoints(customEndpoint?: string): string[] {
  if (customEndpoint) return [customEndpoint];
  if (cachedWorkingEndpoint) return [cachedWorkingEndpoint];

  const endpoints: string[] = [];

  // 1. Same-origin Next.js /ask route (fastest, proxies server-side, no browser CORS)
  endpoints.push('/ask');

  // 2. Explicit NEXT_PUBLIC_CHAT_API_URL
  if (process.env.NEXT_PUBLIC_CHAT_API_URL) {
    endpoints.push(process.env.NEXT_PUBLIC_CHAT_API_URL);
  }

  // 3. From NEXT_PUBLIC_BACKEND_URL
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    const base = backendUrl.replace(/\/+$/, '');
    if (base.includes('host.docker.internal')) {
      endpoints.push(`${base.replace('host.docker.internal', 'localhost')}/ask`);
      endpoints.push(`${base.replace('host.docker.internal', '127.0.0.1')}/ask`);
      endpoints.push(`${base}/ask`);
    } else {
      endpoints.push(`${base}/ask`);
    }
  }

  // 4. Common local backend ports
  endpoints.push('http://localhost:8001/ask');
  endpoints.push('http://127.0.0.1:8001/ask');
  endpoints.push('http://localhost:8000/ask');
  endpoints.push('http://127.0.0.1:8000/ask');

  return Array.from(new Set(endpoints));
}

export interface AskStreamOptions {
  endpoint?: string;
  signal?: AbortSignal;
}

/**
 * Sends a question to the backend /ask endpoint and processes the Server-Sent Events (SSE) stream.
 *
 * Request Contract:
 * - Method: POST
 * - Headers: Content-Type: application/json
 * - Body: { thread_id, user_input }
 *
 * Supported SSE Events:
 * - sources: JSON array of Source objects
 * - token: JSON object with { content: string }
 * - done: JSON object with { thread_id: string }
 * - error: JSON object with { message: string }
 */
export async function askQuestionStream(
  threadId: string,
  userInput: string,
  callbacks: AskStreamCallbacks,
  options: AskStreamOptions = {}
): Promise<void> {
  const signal = options.signal;
  const candidates = getCandidateEndpoints(options.endpoint);

  let response: Response | null = null;
  let lastErrorMessage = 'Failed to connect to chat API';

  for (const endpoint of candidates) {
    if (signal?.aborted) return;

    const timeoutCtrl = new AbortController();
    const timeoutTimer = setTimeout(() => timeoutCtrl.abort(), 2000);

    const onParentAbort = () => timeoutCtrl.abort();
    signal?.addEventListener('abort', onParentAbort, { once: true });

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: threadId,
          user_input: userInput,
        }),
        signal: timeoutCtrl.signal,
      });

      if (res.ok && res.body) {
        response = res;
        cachedWorkingEndpoint = endpoint;
        clearTimeout(timeoutTimer);
        signal?.removeEventListener('abort', onParentAbort);
        break;
      } else {
        let errDetails = `HTTP error ${res.status}: ${res.statusText}`;
        try {
          const bodyText = await res.text();
          if (bodyText) {
            const parsed = JSON.parse(bodyText);
            errDetails = parsed.message || parsed.detail || errDetails;
          }
        } catch {
          // keep errDetails
        }
        lastErrorMessage = errDetails;
      }
    } catch (err: unknown) {
      if (signal?.aborted) return;
      lastErrorMessage = err instanceof Error ? err.message : 'Network connection error';
    } finally {
      clearTimeout(timeoutTimer);
      signal?.removeEventListener('abort', onParentAbort);
    }
  }

  if (!response || !response.body) {
    callbacks.onError?.(lastErrorMessage);
    return;
  }

  try {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let isFinished = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE records are separated by double newline (\r?\n\r?\n)
      let boundaryMatch: RegExpMatchArray | null;
      while ((boundaryMatch = buffer.match(/\r?\n\r?\n/)) !== null) {
        const boundaryIndex = boundaryMatch.index!;
        const delimiterLength = boundaryMatch[0].length;
        const block = buffer.slice(0, boundaryIndex);
        buffer = buffer.slice(boundaryIndex + delimiterLength);

        if (!block.trim()) continue;

        let eventType = 'message';
        const dataLines: string[] = [];

        const lines = block.split(/\r?\n/);
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            let dataContent = line.slice(5);
            if (dataContent.startsWith(' ')) {
              dataContent = dataContent.slice(1);
            }
            dataLines.push(dataContent);
          }
        }

        const dataStr = dataLines.join('\n');

        if (eventType === 'done') {
          isFinished = true;
          callbacks.onDone?.();
          continue;
        }

        if (!dataStr) continue;

        let parsed: any = null;
        try {
          parsed = JSON.parse(dataStr);
        } catch {
          // Not JSON - treat as raw string
          parsed = null;
        }

        if (eventType === 'token') {
          if (parsed && typeof parsed.content === 'string') {
            callbacks.onToken?.(parsed.content);
          } else if (typeof parsed === 'string') {
            callbacks.onToken?.(parsed);
          } else {
            // raw string token
            callbacks.onToken?.(dataStr);
          }
        } else if (eventType === 'sources') {
          const rawList = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.sources)
            ? parsed.sources
            : null;

          if (rawList) {
            const normalizedSources: Source[] = rawList.map((item: any, idx: number) => ({
              citation: typeof item.citation === 'number' ? item.citation : idx + 1,
              path: item.path || item.url || '',
              title: item.title || item.id || `Source ${idx + 1}`,
              confidence: item.confidence,
              score: item.score,
              reviewed: item.reviewed,
            }));
            callbacks.onSources?.(normalizedSources);
          }
        } else if (eventType === 'error') {
          isFinished = true;
          const msg = (parsed && (parsed.message || parsed.error)) || dataStr || 'Stream generation failed';
          callbacks.onError?.(msg);
        } else {
          // generic fallback
          if (parsed && typeof parsed.content === 'string') {
            callbacks.onToken?.(parsed.content);
          } else if (Array.isArray(parsed)) {
            const normalizedSources: Source[] = parsed.map((item: any, idx: number) => ({
              citation: typeof item.citation === 'number' ? item.citation : idx + 1,
              path: item.path || item.url || '',
              title: item.title || item.id || `Source ${idx + 1}`,
            }));
            callbacks.onSources?.(normalizedSources);
          }
        }
      }
    }

    // Process any remaining tail in the buffer
    if (buffer.trim()) {
      const lines = buffer.split(/\r?\n/);
      let eventType = 'message';
      const dataLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          let dataContent = line.slice(5);
          if (dataContent.startsWith(' ')) {
            dataContent = dataContent.slice(1);
          }
          dataLines.push(dataContent);
        }
      }
      const dataStr = dataLines.join('\n');
      if (eventType === 'done') {
        callbacks.onDone?.();
        isFinished = true;
      } else if (dataStr) {
        let parsed: any = null;
        try {
          parsed = JSON.parse(dataStr);
        } catch {
          parsed = null;
        }

        if (eventType === 'token') {
          callbacks.onToken?.(parsed?.content ?? dataStr);
        } else if (eventType === 'sources') {
          const rawList = Array.isArray(parsed) ? parsed : parsed?.sources;
          if (Array.isArray(rawList)) {
            callbacks.onSources?.(
              rawList.map((item: any, idx: number) => ({
                citation: typeof item.citation === 'number' ? item.citation : idx + 1,
                path: item.path || item.url || '',
                title: item.title || item.id || `Source ${idx + 1}`,
              }))
            );
          }
        } else if (eventType === 'error') {
          callbacks.onError?.(parsed?.message ?? dataStr);
          isFinished = true;
        }
      }
    }

    if (!isFinished && !signal?.aborted) {
      callbacks.onDone?.();
    }
  } catch (err: unknown) {
    if (signal?.aborted) {
      return;
    }
    const message = err instanceof Error ? err.message : 'Error while reading stream';
    callbacks.onError?.(message);
  }
}
