import { z } from 'zod';

/**
 * Normalize null and undefined values returned by the backend while keeping
 * stable, non-null output types for the rest of the application.
 */
const stringWithDefault = (fallback = '') =>
  z.preprocess(
    (value) => (value == null ? undefined : value),
    z.string().optional().default(fallback)
  );

const booleanWithDefault = (fallback: boolean) =>
  z.preprocess(
    (value) => (value == null ? undefined : value),
    z.boolean().optional().default(fallback)
  );

const numberWithDefault = (fallback: number) =>
  z.preprocess(
    (value) => (value == null ? undefined : value),
    z.number().optional().default(fallback)
  );

const recordWithDefault = () =>
  z.preprocess(
    (value) => (value == null ? undefined : value),
    z.record(z.string(), z.any()).optional().default({})
  );

export const NodeMetadataSchema = z.object({
  title: stringWithDefault('Untitled'),
  path: stringWithDefault(''),
  folder: stringWithDefault(''),
  tags: z.preprocess(
    (value) => (value == null ? undefined : value),
    z.array(z.string()).optional().default([])
  ),
  aliases: z.preprocess(
    (value) => (value == null ? undefined : value),
    z.array(z.string()).optional().default([])
  ),
  excerpt: stringWithDefault(''),
  status: stringWithDefault('active'),
  incomingCount: numberWithDefault(0),
  outgoingCount: numberWithDefault(0),
  isOrphan: booleanWithDefault(false),
});

export type NodeMetadata = z.infer<typeof NodeMetadataSchema>;

export const RawNodeSchema = z
  .object({
    id: z.string(),
    label: z.string().nullish(),
    title: z.string().nullish(),
    type: stringWithDefault('note'),
    path: z.string().nullish(),
    folder: z.string().nullish(),
    tags: z.array(z.string()).nullish(),
    aliases: z.array(z.string()).nullish(),
    excerpt: z.string().nullish(),
    status: z.string().nullish(),
    incomingCount: z.number().nullish(),
    outgoingCount: z.number().nullish(),
    isOrphan: z.boolean().nullish(),
    metadata: z.record(z.string(), z.any()).nullish(),
  })
  .passthrough();

export const GraphNodeSchema = RawNodeSchema.transform((raw) => {
  const meta = raw.metadata ?? {};
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
  const incomingCount =
    typeof raw.incomingCount === 'number'
      ? raw.incomingCount
      : typeof meta.incomingCount === 'number'
        ? meta.incomingCount
        : 0;
  const outgoingCount =
    typeof raw.outgoingCount === 'number'
      ? raw.outgoingCount
      : typeof meta.outgoingCount === 'number'
        ? meta.outgoingCount
        : 0;
  const isOrphan =
    typeof raw.isOrphan === 'boolean'
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

export const RawEdgeSchema = z
  .object({
    id: z.string().nullish(),
    source: z.string(),
    target: z.string(),
    type: stringWithDefault('wikilink'),
  })
  .passthrough();

export const GraphEdgeSchema = RawEdgeSchema.transform((raw) => ({
  id: raw.id || `${raw.source}->${raw.target}`,
  source: raw.source,
  target: raw.target,
  type: raw.type || 'wikilink',
}));

export const RawUnresolvedLinkSchema = z
  .object({
    source: z.string().nullish(),
    sourceId: z.string().nullish(),
    target: z.string().nullish(),
    linkText: z.string().nullish(),
    rawTarget: z.string().nullish(),
    type: stringWithDefault('wikilink'),
  })
  .passthrough();

export const UnresolvedLinkSchema = RawUnresolvedLinkSchema.transform((raw) => ({
  source: raw.source || raw.sourceId || '',
  target: raw.target || raw.linkText || raw.rawTarget || '',
  type: raw.type || 'wikilink',
}));

export const GraphMetadataResponseSchema = z
  .object({
    schemaVersion: stringWithDefault('1.0.0'),
    // Do not invent a current timestamp when metadata is unavailable.
    generatedAt: stringWithDefault(''),
    sourceVersion: stringWithDefault(''),
  })
  .passthrough();

export const HealthResponseSchema = z
  .object({
    status: stringWithDefault('ok'),
    graphReady: booleanWithDefault(true),
    nodeCount: numberWithDefault(0),
    sourceVersion: stringWithDefault(''),
  })
  .passthrough();

export const RawGraphResponseSchema = z
  .object({
    schemaVersion: stringWithDefault('1.0.0'),
    // An empty value allows callers to skip freshness comparison safely.
    generatedAt: stringWithDefault(''),
    sourceVersion: stringWithDefault(''),
    metadata: recordWithDefault(),
    nodes: z.preprocess(
      (value) => (value == null ? undefined : value),
      z.array(RawNodeSchema).optional().default([])
    ),
    edges: z.preprocess(
      (value) => (value == null ? undefined : value),
      z.array(RawEdgeSchema).optional().default([])
    ),
    unresolvedLinks: z.array(RawUnresolvedLinkSchema).nullish(),
    brokenLinks: z.array(RawUnresolvedLinkSchema).nullish(),
  })
  .passthrough();

export const GraphResponseSchema = RawGraphResponseSchema.transform((raw) => {
  const unresolvedRaw = raw.unresolvedLinks ?? raw.brokenLinks ?? [];
  const nodes = raw.nodes.map((node) => GraphNodeSchema.parse(node));
  const edges = raw.edges.map((edge) => GraphEdgeSchema.parse(edge));
  const unresolvedLinks = unresolvedRaw.map((link) =>
    UnresolvedLinkSchema.parse(link)
  );

  return {
    schemaVersion: raw.schemaVersion || '1.0.0',
    generatedAt: raw.generatedAt || '',
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
export type GraphMetadataResponse = z.infer<
  typeof GraphMetadataResponseSchema
>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type GraphResponse = z.infer<typeof GraphResponseSchema>;

export const SUPPORTED_SCHEMA_VERSIONS = ['1.0.0', '1.0', '1'];

export function isSchemaVersionSupported(version?: string): boolean {
  if (!version) return true;
  if (SUPPORTED_SCHEMA_VERSIONS.includes(version)) return true;
  return version.split('.')[0] === '1';
}

let cachedWorkingBaseUrl: string | null = null;

export function getCandidateBaseUrls(): string[] {
  if (cachedWorkingBaseUrl) return [cachedWorkingBaseUrl];

  const raw = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');
  const candidates: string[] = [];

  // In a browser, the same-origin Next.js rewrite is generally the most reliable.
  if (typeof window !== 'undefined') {
    candidates.push('/api/backend');
  }

  if (raw) {
    if (raw.includes('host.docker.internal')) {
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
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  ).replace(/\/+$/, '');
}

/**
 * Resilient fetch that tries candidate backend endpoints, including the
 * same-origin Next.js proxy.
 */
export async function fetchFromBackend(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const candidates = getCandidateBaseUrls();
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (const base of candidates) {
    try {
      const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
      const response = await fetch(url, init);

      if (
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504
      ) {
        lastResponse = response;
        continue;
      }

      cachedWorkingBaseUrl = base;
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) return lastResponse;

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

/** Fetch and decode a JSON response with a clearer malformed-JSON error. */
async function readJson(response: Response, context: string): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiError(`${context}: Backend returned invalid JSON`, {
      status: response.status,
    });
  }
}

/** Fetch the full graph from the FastAPI backend. */
export async function getGraph(): Promise<GraphResponse> {
  let response: Response;

  try {
    response = await fetchFromBackend('/graph', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      'Service Unavailable: Failed to connect to the graph backend service.',
      { isUnavailable: true }
    );
  }

  if (!response.ok) {
    if ([502, 503, 504].includes(response.status)) {
      throw new ApiError(
        `Service Unavailable (HTTP ${response.status}): The graph backend service is temporarily offline.`,
        { status: response.status, isUnavailable: true }
      );
    }

    throw new ApiError(
      `Backend error (HTTP ${response.status}): ${response.statusText}`,
      { status: response.status }
    );
  }

  const rawJson = await readJson(response, 'Invalid graph response');
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

/** Fetch graph metadata for the freshness check. */
export async function getMetadata(): Promise<GraphMetadataResponse> {
  let response: Response;

  try {
    response = await fetchFromBackend('/graph/metadata', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Failed to fetch graph metadata: Service unavailable', {
      isUnavailable: true,
    });
  }

  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch graph metadata (HTTP ${response.status})`,
      { status: response.status }
    );
  }

  const rawJson = await readJson(response, 'Invalid metadata response');
  const parsed = GraphMetadataResponseSchema.safeParse(rawJson);

  if (!parsed.success) {
    throw new ApiError(`Invalid metadata response: ${parsed.error.message}`);
  }

  return parsed.data;
}

/** Fetch backend health status. */
export async function getHealth(): Promise<HealthResponse> {
  let response: Response;

  try {
    response = await fetchFromBackend('/health', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Health check failed: Service unavailable', {
      isUnavailable: true,
    });
  }

  if (!response.ok) {
    throw new ApiError(`Health check returned HTTP ${response.status}`, {
      status: response.status,
    });
  }

  const rawJson = await readJson(response, 'Invalid health check response');
  const parsed = HealthResponseSchema.safeParse(rawJson);

  if (!parsed.success) {
    throw new ApiError(`Invalid health check response: ${parsed.error.message}`);
  }

  return parsed.data;
}

/** Fetch a single node by ID. */
export async function getNode(id: string): Promise<GraphNode> {
  const encodedId = encodeURIComponent(id);
  const response = await fetchFromBackend(`/graph/node?id=${encodedId}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ApiError(`Failed to fetch node (HTTP ${response.status})`, {
      status: response.status,
    });
  }

  const rawJson = await readJson(response, 'Invalid node response');
  const parsed = GraphNodeSchema.safeParse(rawJson);

  if (!parsed.success) {
    throw new ApiError(`Invalid node data: ${parsed.error.message}`);
  }

  return parsed.data;
}
