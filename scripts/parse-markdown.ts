import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface RawLink {
  rawTarget: string;
  displayText?: string;
  type: 'wikilink' | 'markdown-link';
}

export interface ParsedMarkdownNote {
  id: string; // e.g. "concepts/rag" or "index"
  filePath: string; // relative to repo root or wiki dir
  fileName: string; // e.g. "rag.md"
  folder: string; // e.g. "concepts" or "root"
  title: string;
  tags: string[];
  aliases: string[];
  excerpt: string;
  rawLinks: RawLink[];
}

/**
 * Normalizes a relative path to standard POSIX-like ID without extension.
 * e.g. "concepts/rag.md" -> "concepts/rag"
 */
export function normalizeNoteId(relPath: string): string {
  const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  return normalized.replace(/\.(md|markdown)$/i, '');
}

/**
 * Extracts plain text excerpt from markdown body.
 */
function extractExcerpt(body: string, maxLength: number = 200): string {
  // Strip code blocks
  let text = body.replace(/```[\s\S]*?```/g, '');
  // Strip inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  // Strip images
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  // Strip headings
  text = text.replace(/^#+\s+.*$/gm, '');
  // Strip wikilinks brackets [[Target|Label]] -> Label or Target
  text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target);
  // Strip markdown links [Label](url) -> Label
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Strip bold/italics/HTML tags
  text = text.replace(/[*_~`#]/g, '').replace(/<[^>]+>/g, '');

  // Find first non-empty paragraph
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const firstPara = paragraphs[0] || '';
  const singleLine = firstPara.replace(/\s+/g, ' ').trim();

  if (singleLine.length <= maxLength) {
    return singleLine;
  }
  return singleLine.slice(0, maxLength).trim() + '...';
}

/**
 * Extracts H1 heading from markdown body if any.
 */
function extractFirstH1(body: string): string | null {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Extracts wikilinks [[Target]] or [[Target|Label]] and Markdown links [Label](target.md)
 */
function extractLinks(content: string): RawLink[] {
  const links: RawLink[] = [];

  // Match wikilinks: [[Target#Anchor|Display Label]]
  // Regex handles [[Target]], [[Target|Display]], [[Target#Anchor|Display]]
  const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = wikilinkRegex.exec(content)) !== null) {
    const rawInside = match[1].trim();
    if (!rawInside) continue;

    const parts = rawInside.split('|');
    const targetWithAnchor = parts[0].trim();
    const displayText = parts.length > 1 ? parts[1].trim() : undefined;

    // Strip section anchors like Target#Section
    const cleanTarget = targetWithAnchor.split('#')[0].trim();
    if (cleanTarget) {
      links.push({
        rawTarget: cleanTarget,
        displayText,
        type: 'wikilink',
      });
    }
  }

  // Match markdown links pointing to markdown files: [Label](target.md)
  const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const label = match[1].trim();
    let targetUrl = match[2].trim();

    // Ignore web links (http, https, mailto, etc.) and anchors
    if (/^(https?:|\/\/|mailto:|#)/i.test(targetUrl)) {
      continue;
    }

    // Strip anchor and query if present
    targetUrl = targetUrl.split('#')[0].split('?')[0].trim();

    // If it's a markdown file link
    if (/\.(md|markdown)$/i.test(targetUrl)) {
      links.push({
        rawTarget: targetUrl,
        displayText: label,
        type: 'markdown-link',
      });
    }
  }

  return links;
}

/**
 * Parses a single Markdown file.
 */
export function parseMarkdownFile(fullPath: string, relativeWikiPath: string): ParsedMarkdownNote {
  const fileContent = fs.readFileSync(fullPath, 'utf-8');
  const parsedMatter = matter(fileContent);

  const normalizedId = normalizeNoteId(relativeWikiPath);
  const fileName = path.basename(relativeWikiPath);
  const dirName = path.dirname(relativeWikiPath).replace(/\\/g, '/');
  const folder = dirName === '.' || dirName === '' ? 'root' : dirName.split('/')[0];

  // Resolve Title
  let title = '';
  if (parsedMatter.data && typeof parsedMatter.data.title === 'string' && parsedMatter.data.title.trim()) {
    title = parsedMatter.data.title.trim();
  } else {
    const firstH1 = extractFirstH1(parsedMatter.content);
    if (firstH1) {
      title = firstH1;
    } else {
      title = fileName.replace(/\.(md|markdown)$/i, '');
    }
  }

  // Resolve Tags
  let tags: string[] = [];
  if (parsedMatter.data) {
    if (Array.isArray(parsedMatter.data.tags)) {
      tags = parsedMatter.data.tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof parsedMatter.data.tags === 'string') {
      tags = parsedMatter.data.tags.split(',').map(t => t.trim()).filter(Boolean);
    } else if (typeof parsedMatter.data.tag === 'string') {
      tags = parsedMatter.data.tag.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  // Resolve Aliases
  let aliases: string[] = [];
  if (parsedMatter.data) {
    if (Array.isArray(parsedMatter.data.aliases)) {
      aliases = parsedMatter.data.aliases.map(a => String(a).trim()).filter(Boolean);
    } else if (typeof parsedMatter.data.aliases === 'string') {
      aliases = [parsedMatter.data.aliases.trim()].filter(Boolean);
    } else if (typeof parsedMatter.data.alias === 'string') {
      aliases = [parsedMatter.data.alias.trim()].filter(Boolean);
    }
  }

  const excerpt = extractExcerpt(parsedMatter.content);
  const rawLinks = extractLinks(parsedMatter.content);

  return {
    id: normalizedId,
    filePath: relativeWikiPath.replace(/\\/g, '/'),
    fileName,
    folder,
    title,
    tags,
    aliases,
    excerpt,
    rawLinks,
  };
}
