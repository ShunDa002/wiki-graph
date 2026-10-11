import { describe, it, expect } from 'vitest';
import {
  GraphResponseSchema,
  GraphNodeSchema,
  isSchemaVersionSupported,
  ApiError,
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
