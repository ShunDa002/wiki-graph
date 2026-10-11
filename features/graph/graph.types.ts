export type LinkType = 'wikilink' | 'markdown-link';

export interface WikiNode {
  id: string;
  title: string;
  path: string;
  folder: string;
  tags: string[];
  aliases: string[];
  excerpt: string;
  outgoingCount: number;
  incomingCount: number;
  isOrphan: boolean;
}

export interface WikiEdge {
  id: string;
  source: string;
  target: string;
  type: LinkType;
}

export interface GraphMetadata {
  nodeCount: number;
  edgeCount: number;
  orphanCount: number;
}

export interface WikiGraph {
  generatedAt: string;
  metadata: GraphMetadata;
  nodes: WikiNode[];
  edges: WikiEdge[];
}

export interface UnresolvedLink {
  sourceId: string;
  sourcePath: string;
  linkText: string;
  rawTarget: string;
}

export interface AmbiguousLink {
  sourceId: string;
  sourcePath: string;
  linkText: string;
  rawTarget: string;
  candidates: string[];
}

export interface BuildReport {
  generatedAt: string;
  totalParsedNotes: number;
  totalEdges: number;
  unresolvedLinks: UnresolvedLink[];
  ambiguousLinks: AmbiguousLink[];
  orphans: string[];
}
