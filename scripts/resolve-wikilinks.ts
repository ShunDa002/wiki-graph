import path from 'path';
import { ParsedMarkdownNote, RawLink } from './parse-markdown';
import { WikiEdge, UnresolvedLink, AmbiguousLink } from '../features/graph/graph.types';

export interface ResolutionResult {
  edges: WikiEdge[];
  unresolved: UnresolvedLink[];
  ambiguous: AmbiguousLink[];
}

export class LinkResolver {
  private notesById = new Map<string, ParsedMarkdownNote>();
  private notesByBasename = new Map<string, ParsedMarkdownNote[]>();
  private notesByAlias = new Map<string, ParsedMarkdownNote[]>();
  private notesByTitle = new Map<string, ParsedMarkdownNote[]>();

  constructor(notes: ParsedMarkdownNote[]) {
    for (const note of notes) {
      const lowerId = note.id.toLowerCase();
      this.notesById.set(lowerId, note);

      const baseName = note.fileName.replace(/\.(md|markdown)$/i, '').toLowerCase();
      const existingBase = this.notesByBasename.get(baseName) || [];
      existingBase.push(note);
      this.notesByBasename.set(baseName, existingBase);

      const lowerTitle = note.title.toLowerCase();
      const existingTitle = this.notesByTitle.get(lowerTitle) || [];
      existingTitle.push(note);
      this.notesByTitle.set(lowerTitle, existingTitle);

      for (const alias of note.aliases) {
        const lowerAlias = alias.toLowerCase();
        const existingAlias = this.notesByAlias.get(lowerAlias) || [];
        existingAlias.push(note);
        this.notesByAlias.set(lowerAlias, existingAlias);
      }
    }
  }

  public resolveLink(sourceNote: ParsedMarkdownNote, link: RawLink): { targetId?: string; isAmbiguous?: boolean; candidates?: string[] } {
    let cleanTarget = link.rawTarget.replace(/\\/g, '/').trim();
    cleanTarget = cleanTarget.replace(/\.(md|markdown)$/i, '');

    // 1. If target includes path separators (e.g. "concepts/rag" or "../concepts/rag" or "./rag")
    if (cleanTarget.includes('/')) {
      // Check relative path resolution from source file's directory
      const sourceDir = path.dirname(sourceNote.filePath).replace(/\\/g, '/');
      const resolvedRelative = path.posix.normalize(path.posix.join(sourceDir === '.' ? '' : sourceDir, cleanTarget));
      if (this.notesById.has(resolvedRelative.toLowerCase())) {
        return { targetId: this.notesById.get(resolvedRelative.toLowerCase())!.id };
      }

      // Check root-relative path resolution
      const strippedLeading = cleanTarget.replace(/^\/+/, '');
      if (this.notesById.has(strippedLeading.toLowerCase())) {
        return { targetId: this.notesById.get(strippedLeading.toLowerCase())!.id };
      }
    }

    const lowerTarget = cleanTarget.toLowerCase();

    // 2. Direct match by exact ID
    if (this.notesById.has(lowerTarget)) {
      return { targetId: this.notesById.get(lowerTarget)!.id };
    }

    // 3. Basename match
    const baseMatches = this.notesByBasename.get(lowerTarget) || [];
    if (baseMatches.length === 1) {
      return { targetId: baseMatches[0].id };
    } else if (baseMatches.length > 1) {
      return {
        isAmbiguous: true,
        candidates: baseMatches.map(n => n.id),
      };
    }

    // 4. Title match
    const titleMatches = this.notesByTitle.get(lowerTarget) || [];
    if (titleMatches.length === 1) {
      return { targetId: titleMatches[0].id };
    } else if (titleMatches.length > 1) {
      return {
        isAmbiguous: true,
        candidates: titleMatches.map(n => n.id),
      };
    }

    // 5. Alias match
    const aliasMatches = this.notesByAlias.get(lowerTarget) || [];
    if (aliasMatches.length === 1) {
      return { targetId: aliasMatches[0].id };
    } else if (aliasMatches.length > 1) {
      return {
        isAmbiguous: true,
        candidates: aliasMatches.map(n => n.id),
      };
    }

    return {};
  }

  public resolveAll(notes: ParsedMarkdownNote[]): ResolutionResult {
    const edges: WikiEdge[] = [];
    const unresolved: UnresolvedLink[] = [];
    const ambiguous: AmbiguousLink[] = [];
    const seenEdges = new Set<string>();

    for (const sourceNote of notes) {
      for (const link of sourceNote.rawLinks) {
        const result = this.resolveLink(sourceNote, link);

        if (result.targetId) {
          // Avoid duplicate edges between same source and target
          const edgeId = `${sourceNote.id}->${result.targetId}`;
          if (!seenEdges.has(edgeId)) {
            seenEdges.add(edgeId);
            edges.push({
              id: edgeId,
              source: sourceNote.id,
              target: result.targetId,
              type: link.type,
            });
          }
        } else if (result.isAmbiguous && result.candidates) {
          ambiguous.push({
            sourceId: sourceNote.id,
            sourcePath: sourceNote.filePath,
            linkText: link.displayText || link.rawTarget,
            rawTarget: link.rawTarget,
            candidates: result.candidates,
          });
        } else {
          unresolved.push({
            sourceId: sourceNote.id,
            sourcePath: sourceNote.filePath,
            linkText: link.displayText || link.rawTarget,
            rawTarget: link.rawTarget,
          });
        }
      }
    }

    return { edges, unresolved, ambiguous };
  }
}
