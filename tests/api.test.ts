import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  GraphResponseSchema,
  GraphNodeSchema,
  isSchemaVersionSupported,
  ApiError,
  shouldRetryGraphQuery,
  getGraphRetryDelay,
  fetchFromBackend,
  getGraph,
} from '../lib/api';

describe('API Schemas and Validation', () => {
  it('validates a valid GraphResponse', () => {
    const raw = {
      schemaVersion: '1.0.0',
      generatedAt: '2026-10-10T12:00:00Z',
      sourceVersion: 'v1.2.3',
      nodes: [
        {
          id: 'notes%2Fintro.md',
          label: 'Intro',
          type: 'note',
          metadata: {
            title: 'Introduction Note',
            path: 'notes/intro.md',
            folder: 'notes',
            tags: ['ai', 'wiki'],
            aliases: ['Intro'],
            excerpt: 'Welcome to the LLM wiki graph.',
            status: 'active',
            incomingCount: 2,
            outgoingCount: 3,
            isOrphan: false,
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'notes%2Fintro.md',
          target: 'notes%2Foverview.md',
          type: 'wikilink',
        },
      ],
      unresolvedLinks: [
        {
          source: 'notes%2Fintro.md',
          target: 'MissingNote',
          type: 'wikilink',
        },
      ],
    };

    const parsed = GraphResponseSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.nodes.length).toBe(1);
      expect(parsed.data.edges.length).toBe(1);
      expect(parsed.data.unresolvedLinks.length).toBe(1);
    }
  });

  it('validates a real FastAPI backend payload with flat node properties and no label field', () => {
    const raw = {
      schemaVersion: '1.0.0',
      generatedAt: '2026-10-10T16:20:25.201828+00:00',
      sourceVersion: '427b021d406ed6c3fe1d9bcf6434c924cef987ee',
      metadata: {
        nodeCount: 1,
        edgeCount: 1,
        brokenLinkCount: 0,
      },
      nodes: [
        {
          id: 'concepts/Agentic AI.md',
          title: 'Agentic AI',
          path: 'concepts/Agentic AI.md',
          folder: 'concepts',
          tags: ['agents', 'ai', 'langgraph'],
          aliases: ['Agentic Artificial Intelligence'],
          excerpt: 'Agentic AI refers to an artificial intelligence system...',
          type: 'concept',
          status: 'active',
          confidence: 'medium',
          outgoingCount: 3,
          incomingCount: 6,
          isOrphan: false,
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'concepts/Agentic AI.md',
          target: 'concepts/LangGraph.md',
          type: 'wikilink',
        },
      ],
    };

    const parsed = GraphResponseSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const node = parsed.data.nodes[0];
      expect(node.label).toBe('Agentic AI');
      expect(node.metadata.title).toBe('Agentic AI');
      expect(node.metadata.folder).toBe('concepts');
      expect(node.metadata.tags).toEqual(['agents', 'ai', 'langgraph']);
      expect(node.metadata.isOrphan).toBe(false);
      expect(node.metadata.incomingCount).toBe(6);
      expect(node.metadata.outgoingCount).toBe(3);
    }
  });

  it('provides default values for missing metadata fields in GraphNode', () => {
    const rawNode = {
      id: 'notes%2Fminimal.md',
      label: 'Minimal',
    };

    const parsed = GraphNodeSchema.safeParse(rawNode);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.type).toBe('note');
      expect(parsed.data.metadata.title).toBe('Minimal');
      expect(parsed.data.metadata.isOrphan).toBe(false);
      expect(parsed.data.metadata.tags).toEqual([]);
    }
  });

  it('checks supported schema versions correctly', () => {
    expect(isSchemaVersionSupported('1.0.0')).toBe(true);
    expect(isSchemaVersionSupported('1.2.0')).toBe(true);
    expect(isSchemaVersionSupported('1.0')).toBe(true);
    expect(isSchemaVersionSupported('2.0.0')).toBe(false);
    expect(isSchemaVersionSupported('0.9.0')).toBe(false);
  });

  it('constructs ApiError with appropriate flags', () => {
    const unavailableErr = new ApiError('Offline', { isUnavailable: true });
    expect(unavailableErr.isUnavailable).toBe(true);
    expect(unavailableErr.message).toBe('Offline');

    const schemaErr = new ApiError('Incompatible', {
      isUnsupportedSchema: true,
      schemaVersion: '2.0.0',
    });
    expect(schemaErr.isUnsupportedSchema).toBe(true);
    expect(schemaErr.schemaVersion).toBe('2.0.0');
  });
});

describe('Startup Retry Policy & Query Helpers', () => {
  it('shouldRetryGraphQuery retries on service unavailable or network errors', () => {
    const unavailableErr = new ApiError('Offline', { isUnavailable: true, status: 503 });
    expect(shouldRetryGraphQuery(0, unavailableErr, 4)).toBe(true);
    expect(shouldRetryGraphQuery(1, unavailableErr, 4)).toBe(true);
    expect(shouldRetryGraphQuery(3, unavailableErr, 4)).toBe(true);
    expect(shouldRetryGraphQuery(4, unavailableErr, 4)).toBe(false);

    const networkErr = new Error('Failed to fetch');
    expect(shouldRetryGraphQuery(0, networkErr, 4)).toBe(true);
    expect(shouldRetryGraphQuery(4, networkErr, 4)).toBe(false);
  });

  it('shouldRetryGraphQuery does not retry on unsupported schema or 4xx client errors', () => {
    const schemaErr = new ApiError('Schema version mismatch', {
      isUnsupportedSchema: true,
      schemaVersion: '2.0.0',
    });
    expect(shouldRetryGraphQuery(0, schemaErr, 4)).toBe(false);

    const notFoundErr = new ApiError('Not found', { status: 404 });
    expect(shouldRetryGraphQuery(0, notFoundErr, 4)).toBe(false);

    const unauthorizedErr = new ApiError('Unauthorized', { status: 401 });
    expect(shouldRetryGraphQuery(0, unauthorizedErr, 4)).toBe(false);
  });

  it('getGraphRetryDelay calculates delays spaced by several seconds', () => {
    expect(getGraphRetryDelay(0)).toBe(2000);
    expect(getGraphRetryDelay(1)).toBe(3000);
    expect(getGraphRetryDelay(2)).toBe(4000);
    expect(getGraphRetryDelay(3)).toBe(5000);
    expect(getGraphRetryDelay(10)).toBe(5000); // capped at 5s
  });
});

describe('fetchFromBackend and getGraph Retry Behavior', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetchFromBackend retries transient 502/503 errors when retry options are provided', async () => {
    let callCount = 0;

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        return new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await fetchFromBackend('/test', undefined, {
      retries: 3,
      retryDelayMs: 10,
      backoffFactor: 1,
    });

    expect(res.status).toBe(200);
    expect(callCount).toBe(3);
  });

  it('getGraph succeeds when transient failure resolves within retries', async () => {
    let callCount = 0;

    const validPayload = {
      schemaVersion: '1.0.0',
      generatedAt: '2026-10-10T12:00:00Z',
      sourceVersion: 'v1.0.0',
      nodes: [],
      edges: [],
      unresolvedLinks: [],
    };

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response('Gateway Offline', { status: 503, statusText: 'Service Unavailable' });
      }
      return new Response(JSON.stringify(validPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const graph = await getGraph({
      retries: 2,
      retryDelayMs: 10,
      backoffFactor: 1,
    });

    expect(graph.schemaVersion).toBe('1.0.0');
    expect(callCount).toBe(2);
  });
});

