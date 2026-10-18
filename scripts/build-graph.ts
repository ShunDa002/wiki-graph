import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import { parseMarkdownFile } from './parse-markdown';
import { LinkResolver } from './resolve-wikilinks';
import { WikiGraph, WikiNode, BuildReport } from '../features/graph/graph.types';
import { fetchWiki } from './fetch-wiki';

async function buildGraph() {
  console.log('🚀 Starting LLM Wiki Graph generation...');
  const startTime = Date.now();

  // Root directory of project
  const projectRoot = path.resolve(import.meta.dirname, '..');

  // Wiki target directory
  let wikiDir = path.join(projectRoot, '.wiki-temp');

  if (process.env.SKIP_WIKI_FETCH !== 'true') {
    try {
      wikiDir = await fetchWiki(wikiDir);
    } catch (fetchErr) {
      console.warn('⚠️ Warning: Failed to fetch remote wiki:', fetchErr);
      if (fs.existsSync(wikiDir) && fs.readdirSync(wikiDir).length > 0) {
        console.log(`📁 Falling back to existing cached content in: ${wikiDir}`);
      } else {
        const localWiki = path.join(projectRoot, 'wiki');
        if (fs.existsSync(localWiki)) {
          console.log(`📁 Falling back to local wiki directory: ${localWiki}`);
          wikiDir = localWiki;
        } else {
          throw fetchErr;
        }
      }
    }
  } else {
    console.log('⏩ Skipping remote wiki fetch (SKIP_WIKI_FETCH=true).');
    if (!fs.existsSync(wikiDir)) {
      const localWiki = path.join(projectRoot, 'wiki');
      if (fs.existsSync(localWiki)) {
        wikiDir = localWiki;
      }
    }
  }

  console.log(`📁 Scanning notes in: ${wikiDir}`);

  // Find all .md and .markdown files
  const pattern = '**/*.{md,markdown}';
  const fileEntries = await fg(pattern, {
    cwd: wikiDir,
    dot: false,
    onlyFiles: true,
  });

  console.log(`📄 Found ${fileEntries.length} markdown notes.`);

  // Parse all markdown files
  const parsedNotes = fileEntries.map(relPath => {
    const fullPath = path.join(wikiDir, relPath);
    return parseMarkdownFile(fullPath, relPath);
  });

  // Resolve links into graph edges
  const resolver = new LinkResolver(parsedNotes);
  const { edges, unresolved, ambiguous } = resolver.resolveAll(parsedNotes);

  // Compute incoming and outgoing degrees
  const outgoingCounts = new Map<string, number>();
  const incomingCounts = new Map<string, number>();

  for (const edge of edges) {
    outgoingCounts.set(edge.source, (outgoingCounts.get(edge.source) || 0) + 1);
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) || 0) + 1);
  }

  const orphans: string[] = [];
  const nodes: WikiNode[] = parsedNotes.map(note => {
    const outgoing = outgoingCounts.get(note.id) || 0;
    const incoming = incomingCounts.get(note.id) || 0;
    const isOrphan = outgoing === 0 && incoming === 0;

    if (isOrphan) {
      orphans.push(note.id);
    }

    return {
      id: note.id,
      title: note.title,
      path: note.filePath,
      folder: note.folder,
      tags: note.tags,
      aliases: note.aliases,
      excerpt: note.excerpt,
      outgoingCount: outgoing,
      incomingCount: incoming,
      isOrphan,
    };
  });

  const graph: WikiGraph = {
    generatedAt: new Date().toISOString(),
    metadata: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      orphanCount: orphans.length,
    },
    nodes,
    edges,
  };

  const report: BuildReport = {
    generatedAt: new Date().toISOString(),
    totalParsedNotes: nodes.length,
    totalEdges: edges.length,
    unresolvedLinks: unresolved,
    ambiguousLinks: ambiguous,
    orphans,
  };

  // Ensure public/generated directory exists
  const outputDir = path.join(projectRoot, 'public', 'generated');
  fs.mkdirSync(outputDir, { recursive: true });

  const graphPath = path.join(outputDir, 'graph.json');
  const reportPath = path.join(outputDir, 'build-report.json');

  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf-8');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Graph build complete in ${elapsed}s!`);
  console.log(`   - Nodes: ${nodes.length}`);
  console.log(`   - Edges: ${edges.length}`);
  console.log(`   - Orphans: ${orphans.length}`);
  console.log(`   - Unresolved links: ${unresolved.length}`);
  console.log(`   - Ambiguous links: ${ambiguous.length}`);
  console.log(`💾 Output saved to:`);
  console.log(`   - ${graphPath}`);
  console.log(`   - ${reportPath}`);
}

buildGraph().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
