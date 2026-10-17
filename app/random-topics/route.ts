export const dynamic = 'force-dynamic';

export const DEFAULT_TOPICS = [
  'Graph Layouts',
  'Wikilinks',
  'Obsidian Notes',
  'Knowledge Vaults',
  'Semantic Search',
  'Cytoscape Engine',
  'Markdown Parsing',
  'Tag Filtering',
  'Note Previews',
  'Vector Embeddings',
  'Backlinks Analysis',
  'Clustering Algorithms',
];

export async function GET() {
  const backendBase = (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ''
  ).replace(/\/+$/, '');

  if (backendBase) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${backendBase}/random-topics`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return Response.json(data);
        }
        if (data && Array.isArray(data.topics) && data.topics.length > 0) {
          return Response.json(data.topics);
        }
      }
    } catch {
      // Backend unreachable or does not provide /random-topics, fall back to default
    }
  }

  return Response.json(DEFAULT_TOPICS);
}

