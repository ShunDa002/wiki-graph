export const dynamic = 'force-static';

export async function GET() {
  return Response.json([
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
  ]);
}

