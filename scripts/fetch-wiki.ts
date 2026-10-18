import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
  subpath: string;
  tarballUrl: string;
}

/**
 * Parses a GitHub repository URL into owner, repo, branch, subpath, and tarball API URL.
 * Defaults to https://github.com/ShunDa002/My-LLM-Wiki/tree/main/wiki
 */
export function parseWikiRepoUrl(urlStr?: string): RepoConfig {
  const defaultUrl = 'https://github.com/ShunDa002/My-LLM-Wiki/tree/main/wiki';
  const rawUrl = urlStr && urlStr.trim() ? urlStr.trim() : defaultUrl;

  try {
    const parsed = new URL(rawUrl);
    const pathname = parsed.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    const parts = pathname.split('/');

    // Direct GitHub REST API tarball URL: api.github.com/repos/:owner/:repo/tarball/:branch
    if (parsed.hostname === 'api.github.com') {
      const reposIdx = parts.indexOf('repos');
      const owner = parts[reposIdx + 1];
      const repo = parts[reposIdx + 2];
      const branch = parts[reposIdx + 4] || 'main';
      return {
        owner,
        repo,
        branch,
        subpath: '',
        tarballUrl: `https://api.github.com/repos/${owner}/${repo}/tarball/${branch}`,
      };
    }

    // Standard GitHub URL: github.com/:owner/:repo[/tree/:branch/:subpath*]
    const owner = parts[0];
    const repo = parts[1];
    let branch = 'main';
    let subpath = '';

    if (parts.length > 2 && parts[2] === 'tree') {
      branch = parts[3] || 'main';
      subpath = parts.slice(4).join('/');
    } else if (parts.length > 2) {
      subpath = parts.slice(2).join('/');
    }

    return {
      owner,
      repo,
      branch,
      subpath,
      tarballUrl: `https://api.github.com/repos/${owner}/${repo}/tarball/${branch}`,
    };
  } catch {
    throw new Error(
      `Invalid WIKI_REPO_URL: "${rawUrl}". Expected format: https://github.com/:owner/:repo/tree/:branch/:path`
    );
  }
}

/**
 * Fetches the wiki markdown files from the configured GitHub repository and extracts them to targetDir.
 */
export async function fetchWiki(targetDir?: string, repoUrl?: string): Promise<string> {
  const projectRoot = path.resolve(import.meta.dirname, '..');
  const outputDir = targetDir || path.join(projectRoot, '.wiki-temp');
  const urlToFetch = repoUrl || process.env.WIKI_REPO_URL;
  const config = parseWikiRepoUrl(urlToFetch);

  console.log(`📥 Fetching wiki from GitHub: ${config.owner}/${config.repo} (branch: ${config.branch}, path: ${config.subpath || 'root'})...`);
  console.log(`🔗 Tarball URL: ${config.tarballUrl}`);

  const stagingDir = path.join(projectRoot, '.wiki-temp-staging');
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  fs.mkdirSync(stagingDir, { recursive: true });

  const archivePath = path.join(stagingDir, 'repo.tar.gz');

  const headers: Record<string, string> = {
    'User-Agent': 'llm-wiki-graph-fetcher',
    Accept: 'application/vnd.github.v3+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(config.tarballUrl, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch tarball from ${config.tarballUrl}: HTTP ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error(`Response body is empty when downloading ${config.tarballUrl}`);
  }

  // Stream download to archivePath
  const fileStream = fs.createWriteStream(archivePath);
  await pipeline(Readable.fromWeb(response.body as unknown as Parameters<typeof Readable.fromWeb>[0]), fileStream);

  console.log(`📦 Download complete. Extracting archive...`);

  // Extract archive into stagingDir
  await tar.x({
    file: archivePath,
    cwd: stagingDir,
  });

  // Remove archive tar.gz
  fs.rmSync(archivePath, { force: true });

  // Find extracted root directory inside stagingDir (e.g., owner-repo-sha)
  const extractedEntries = fs.readdirSync(stagingDir).filter(name => {
    return fs.statSync(path.join(stagingDir, name)).isDirectory();
  });

  if (extractedEntries.length === 0) {
    throw new Error('Failed to find extracted root directory in archive.');
  }

  const rootExtractedDir = path.join(stagingDir, extractedEntries[0]);

  // Determine source folder to copy to outputDir
  let sourceDir = rootExtractedDir;
  if (config.subpath) {
    const candidate = path.join(rootExtractedDir, config.subpath);
    if (fs.existsSync(candidate)) {
      sourceDir = candidate;
    } else {
      console.warn(`⚠️ Warning: Specified subpath "${config.subpath}" not found in repository. Falling back to root.`);
    }
  } else {
    // If no subpath specified, check if 'wiki' directory exists
    const candidateWiki = path.join(rootExtractedDir, 'wiki');
    if (fs.existsSync(candidateWiki)) {
      sourceDir = candidateWiki;
    }
  }

  // Prepare outputDir
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // Copy files to outputDir
  fs.cpSync(sourceDir, outputDir, { recursive: true });

  // Clean up stagingDir
  fs.rmSync(stagingDir, { recursive: true, force: true });

  console.log(`✅ Wiki fetched successfully to ${outputDir}`);
  return outputDir;
}

// Allow direct CLI execution: tsx scripts/fetch-wiki.ts
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename
)) {
  fetchWiki().catch(err => {
    console.error('❌ Error fetching wiki:', err);
    process.exit(1);
  });
}
