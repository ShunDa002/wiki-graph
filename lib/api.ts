import { z } from 'zod';

export const NodeMetadataSchema = z.object({
  title: z.string().default('Untitled'),
  path: z.string().default(''),
  folder: z.string().default(''),
  tags: z.array(z.string()).default([]),
  aliases: z.array(z.string()).default([]),
  excerpt: z.string().default(''),
  status: z.string().default('active'),
  incomingCount: z.number().default(0),
  outgoingCount: z.number().default(0),
  isOrphan: z.boolean().default(false),
});

export type NodeMetadata = z.infer<typeof NodeMetadataSchema>;

export const RawNodeSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  title: z.string().optional(),
  type: z.string().optional().default('note'),
  path: z.string().optional(),
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
  aliases: z.array(z.string()).optional(),
  excerpt: z.string().optional(),
  status: z.string().optional(),
  incomingCount: z.number().optional(),
  outgoingCount: z.number().optional(),
  isOrphan: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).passthrough();

export const GraphNodeSchema = RawNodeSchema.transform((raw) => {
  const meta = raw.metadata || {};
  const title = (raw.title ?? meta.title ?? raw.label ?? raw.id) || 'Untitled';
  const label = (raw.label ?? raw.title ?? meta.title ?? raw.id) || 'Untitled';
  const path = (raw.path ?? meta.path) || '';
  const folder = (raw.folder ?? meta.folder) || '';
  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : Array.isArray(meta.tags)
    ? meta.tags
    : [];
  const aliases = Array.isArray(raw.aliases)
    ? raw.aliases
    : Array.isArray(meta.aliases)
    ? meta.aliases
    : [];
  const excerpt = (raw.excerpt ?? meta.excerpt) || '';
  const status = (raw.status ?? meta.status) || 'active';
  const incomingCount = typeof raw.incomingCount === 'number'
    ? raw.incomingCount
    : typeof meta.incomingCount === 'number'
    ? meta.incomingCount
    : 0;
  const outgoingCount = typeof raw.outgoingCount === 'number'
    ? raw.outgoingCount
    : typeof meta.outgoingCount === 'number'
    ? meta.outgoingCount
    : 0;
  const isOrphan = typeof raw.isOrphan === 'boolean'
    ? raw.isOrphan
    : typeof meta.isOrphan === 'boolean'
    ? meta.isOrphan
    : false;

  const metadata: NodeMetadata = {
    title,
    path,
    folder,
    tags,
    aliases,
    excerpt,
    status,
    incomingCount,
    outgoingCount,
    isOrphan,
  };

  return {
    id: raw.id,
    label,
    title,
    path,
    folder,
    tags,
    aliases,
    excerpt,
    status,
    incomingCount,
    outgoingCount,
    isOrphan,
    type: raw.type || 'note',
    metadata,
  };
});

export const RawEdgeSchema = z.object({
  id: z.string().optional(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional().default('wikilink'),
}).passthrough();

export const GraphEdgeSchema = RawEdgeSchema.transform((raw) => ({
  id: raw.id || `${raw.source}->${raw.target}`,
  source: raw.source,
  target: raw.target,
  type: raw.type || 'wikilink',
}));

export const RawUnresolvedLinkSchema = z.object({
  source: z.string().optional(),
  sourceId: z.string().optional(),
  target: z.string().optional(),
  linkText: z.string().optional(),
  rawTarget: z.string().optional(),
  type: z.string().optional().default('wikilink'),
}).passthrough();

export const UnresolvedLinkSchema = RawUnresolvedLinkSchema.transform((raw) => ({
  source: raw.source || raw.sourceId || '',
  target: raw.target || raw.linkText || raw.rawTarget || '',
  type: raw.type || 'wikilink',
}));

export const GraphMetadataResponseSchema = z.object({
  schemaVersion: z.string().optional().default('1.0.0'),
  generatedAt: z.string().optional().default(() => new Date().toISOString()),
  sourceVersion: z.string().optional().default(''),
}).passthrough();

export const HealthResponseSchema = z.object({
  status: z.string().default('ok'),
  graphReady: z.boolean().optional().default(true),
  nodeCount: z.number().optional().default(0),
  sourceVersion: z.string().optional().default(''),
}).passthrough();

export const RawGraphResponseSchema = z.object({
  schemaVersion: z.string().optional().default('1.0.0'),
  generatedAt: z.string().optional().default(() => new Date().toISOString()),
  sourceVersion: z.string().optional().default(''),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  nodes: z.array(RawNodeSchema).default([]),
  edges: z.array(RawEdgeSchema).default([]),
  unresolvedLinks: z.array(RawUnresolvedLinkSchema).optional(),
  brokenLinks: z.array(RawUnresolvedLinkSchema).optional(),
}).passthrough();

export const GraphResponseSchema = RawGraphResponseSchema.transform((raw) => {
  const unresolvedRaw = raw.unresolvedLinks || raw.brokenLinks || [];
  const nodes = raw.nodes.map((n) => GraphNodeSchema.parse(n));
  const edges = raw.edges.map((e) => GraphEdgeSchema.parse(e));
  const unresolvedLinks = unresolvedRaw.map((u) => UnresolvedLinkSchema.parse(u));

  return {
    schemaVersion: raw.schemaVersion || '1.0.0',
    generatedAt: raw.generatedAt || new Date().toISOString(),
    sourceVersion: raw.sourceVersion || '',
    metadata: raw.metadata || {},
    nodes,
    edges,
    unresolvedLinks,
  };
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
export type UnresolvedLink = z.infer<typeof UnresolvedLinkSchema>;
export type GraphMetadataResponse = z.infer<typeof GraphMetadataResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type GraphResponse = z.infer<typeof GraphResponseSchema>;

export const SUPPORTED_SCHEMA_VERSIONS = ['1.0.0', '1.0', '1'];

export function isSchemaVersionSupported(version?: string): boolean {
  if (!version) return true;
  if (SUPPORTED_SCHEMA_VERSIONS.includes(version)) return true;
  const major = version.split('.')[0];
  return major === '1';
}

let cachedWorkingBaseUrl: string | null = null;

export function getCandidateBaseUrls(): string[] {
  if (cachedWorkingBaseUrl) return [cachedWorkingBaseUrl];

  const raw = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');
  const candidates: string[] = [];

  // When running in a browser environment, same-origin Next.js rewrite /api/backend is most reliable
  if (typeof window !== 'undefined') {
    candidates.push('/api/backend');
  }

  if (raw) {
    if (raw.includes('host.docker.internal')) {
      // In host browser (outside docker container), host.docker.internal resolves to localhost/127.0.0.1
      candidates.push(raw.replace('host.docker.internal', 'localhost'));
      candidates.push(raw.replace('host.docker.internal', '127.0.0.1'));
      candidates.push('/api/backend');
      candidates.push(raw);
    } else {
      candidates.push(raw);
      candidates.push('/api/backend');
    }
  } else {
    candidates.push('/api/backend');
    candidates.push('http://localhost:8001');
    candidates.push('http://127.0.0.1:8001');
    candidates.push('http://localhost:8000');
  }

  return Array.from(new Set(candidates));
}

export function getApiBaseUrl(): string {
  if (cachedWorkingBaseUrl) return cachedWorkingBaseUrl;
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:8000'
  ).replace(/\/+$/, '');
}

/**
 * Resilient fetch that tries candidate backend endpoints (including same-origin Next.js proxy)
 */
export async function fetchFromBackend(path: string, init?: RequestInit): Promise<Response> {
  const candidates = getCandidateBaseUrls();
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (const base of candidates) {
    try {
      const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
      const res = await fetch(url, init);
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        lastResponse = res;
        continue;
      }
      cachedWorkingBaseUrl = base;
      return res;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error('All backend endpoints failed');
}

export class ApiError extends Error {
  status?: number;
  isUnavailable?: boolean;
  isUnsupportedSchema?: boolean;
  schemaVersion?: string;

  constructor(
    message: string,
    options?: {
      status?: number;
      isUnavailable?: boolean;
      isUnsupportedSchema?: boolean;
      schemaVersion?: string;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.isUnavailable = options?.isUnavailable;
    this.isUnsupportedSchema = options?.isUnsupportedSchema;
    this.schemaVersion = options?.schemaVersion;
  }
}

/**
 * Fetch full graph from FastAPI backend
 */
export async function getGraph(): Promise<GraphResponse> {
  let response: Response;

  try {
    response = await fetchFromBackend('/graph', {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch (err) {
    throw new ApiError(
      'Service Unavailable: Failed to connect to the graph backend service.',
      {
        isUnavailable: true,
      }
    );
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new ApiError(
        `Service Unavailable (HTTP ${response.status}): The graph backend service is temporarily offline.`,
        {
          status: response.status,
          isUnavailable: true,
        }
      );
    }
    throw new ApiError(
      `Backend error (HTTP ${response.status}): ${response.statusText}`,
      {
        status: response.status,
      }
    );
  }

  const rawJson = await response.json();
  const parsed = GraphResponseSchema.safeParse(rawJson);

  if (!parsed.success) {
    throw new ApiError(
      `Invalid graph payload received from backend: ${parsed.error.message}`
    );
  }

  if (!isSchemaVersionSupported(parsed.data.schemaVersion)) {
    throw new ApiError(
      `Unsupported schema version "${parsed.data.schemaVersion}". The client supports version 1.x. Please refresh or update the client.`,
      {
        isUnsupportedSchema: true,
        schemaVersion: parsed.data.schemaVersion,
      }
    );
  }

  return parsed.data;
}

/**
 * Fetch graph metadata for freshness check
 */
export async function getMetadata(): Promise<GraphMetadataResponse> {
  let response: Response;

  try {
    response = await fetchFromBackend('/graph/metadata', {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch (err) {
    throw new ApiError('Failed to fetch graph metadata: Service unavailable', {
      isUnavailable: true,
    });
  }

  if (!response.ok) {
    throw new ApiError(`Failed to fetch graph metadata (HTTP ${response.status})`, {
      status: response.status,
    });
  }

  const rawJson = await response.json();
  const parsed = GraphMetadataResponseSchema.safeParse(rawJson);

  if (!parsed.success) {
    throw new ApiError(`Invalid metadata response: ${parsed.error.message}`);
  }

  return parsed.data;
}

/**
 * Fetch health status of backend
 */
export async function getHealth(): Promise<HealthResponse> {
  let response: Response;

  try {
    response = await fetchFromBackend('/health', {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch (err) {
    throw new ApiError('Health check failed: Service unavailable', {
      isUnavailable: true,
    });
  }

  if (!response.ok) {
    throw new ApiError(`Health check returned HTTP ${response.status}`, {
      status: response.status,
    });
  }

  const rawJson = await response.json();
  const parsed = HealthResponseSchema.safeParse(rawJson);
  if (!parsed.success) {
    throw new ApiError(`Invalid health check response: ${parsed.error.message}`);
  }

  return parsed.data;
}

/**
 * Fetch single node by ID
 */
export async function getNode(id: string): Promise<GraphNode> {
  const encodedId = encodeURIComponent(id);
  const response = await fetchFromBackend(`/graph/node?id=${encodedId}`, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ApiError(`Failed to fetch node (HTTP ${response.status})`, {
      status: response.status,
    });
  }

  const rawJson = await response.json();
  const parsed = GraphNodeSchema.safeParse(rawJson);
  if (!parsed.success) {
    throw new ApiError(`Invalid node data: ${parsed.error.message}`);
  }

  return parsed.data;
}
