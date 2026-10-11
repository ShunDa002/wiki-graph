import { WikiGraph } from './graph.types';

export interface LoadGraphResult {
  graph: WikiGraph | null;
  error: string | null;
}

/**
 * Loads the pre-generated graph.json from the static public directory.
 */
export async function loadGraphData(basePath: string = ''): Promise<LoadGraphResult> {
  try {
    const url = `${basePath}/generated/graph.json`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      return {
        graph: null,
        error: `Failed to load graph data (HTTP ${response.status}: ${response.statusText}). Make sure "npm run build:graph" was executed.`,
      };
    }

    const data = await response.json();

    // Basic structure validation
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges) || !data.metadata) {
      return {
        graph: null,
        error: 'The loaded graph.json is malformed or missing required top-level fields (nodes, edges, metadata).',
      };
    }

    return {
      graph: data as WikiGraph,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      graph: null,
      error: `Network or parsing error while loading graph: ${message}`,
    };
  }
}
