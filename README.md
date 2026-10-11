# LLM Wiki Graph View

An interactive, static knowledge graph visualization for Markdown wikis. Built with **Next.js**, **React**, **Cytoscape.js**, and **Tailwind CSS**.

The graph visualizes interlinked Markdown notes as nodes connected by wikilinks (`[[Note]]`) and standard markdown links, dynamically fetched at build-time from a GitHub repository.

---

## Features

- 🌐 **Dynamic GitHub Fetching**: Downloads and parses markdown notes directly from a GitHub repository archive at build time.
- 🕸️ **Interactive Graph Visualization**: High-performance canvas powered by Cytoscape.js with multiple layout algorithms (fCoSE, CoSE, Concentric, Circle, Breadth-First).
- 🔍 **Real-Time Search & Filtering**: Search notes by title, alias, or tag with real-time graph dimming and highlighting.
- 📁 **Folder & Tag Segmentation**: Filter notes by directory (e.g. `concepts`, `sources`, `root`) or tag metadata.
- 📑 **Note Inspection & 1-Hop Neighbor Preview**: View note details, excerpt, incoming/outgoing link counts, and navigate connections directly from the graph view.
- ⚡ **Zero-Runtime Backend**: Pure static web application reading pre-compiled `graph.json`.

---

## Environment Variables

Configure external repository fetching via environment variables:

| Variable | Description | Default | Required |
|---|---|---|---|
| `WIKI_REPO_URL` | Full URL to the GitHub repository directory containing the markdown files. | `https://github.com/ShunDa002/My-LLM-Wiki/tree/main/wiki` | No |
| `GITHUB_TOKEN` | Optional GitHub Personal Access Token to avoid REST API rate limits. | `None` | No |
| `SKIP_WIKI_FETCH` | Set to `true` to skip fetching and use existing `.wiki-temp` or local `wiki/` directory. | `false` | No |

### Supported `WIKI_REPO_URL` Formats:
- Subfolder branch view: `https://github.com/{owner}/{repo}/tree/{branch}/{subpath}`
- Repository root: `https://github.com/{owner}/{repo}`
- Direct GitHub tarball API: `https://api.github.com/repos/{owner}/{repo}/tarball/{branch}`

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Fetch Wiki & Generate Graph
Fetch the markdown notes from GitHub and compile the static graph:
```bash
# Optional: customize target repository
export WIKI_REPO_URL="https://github.com/ShunDa002/My-LLM-Wiki/tree/main/wiki"

# Fetch and build graph dataset (public/generated/graph.json)
npm run build:graph
```

Or just fetch the wiki files into `.wiki-temp`:
```bash
npm run fetch:wiki
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build

When building for static deployment:
```bash
npm run build
```
*(Note: `npm run build` runs `npm run build:graph` automatically before `next build`)*

---

## Project Structure

```text
├── .wiki-temp/                 # Temporary directory for downloaded wiki markdown files (gitignored)
├── app/
│   ├── layout.tsx              # Root Next.js layout
│   └── page.tsx                # Main graph page & state orchestration
├── components/
│   ├── GraphCanvas.tsx         # Cytoscape.js canvas implementation
│   ├── GraphToolbar.tsx        # Layout controls, zoom & fit buttons
│   ├── SearchBox.tsx           # Search input with match count badge
│   ├── FilterPanel.tsx         # Folder, tag, and orphan filter drawers
│   └── NotePreview.tsx         # Note details and link navigation drawer
├── lib/
│   ├── graph-types.ts          # TypeScript interfaces for nodes, edges, graph
│   └── graph-loader.ts         # Client-side static graph loader
├── public/
│   └── generated/
│       ├── graph.json          # Compiled static graph dataset
│       └── build-report.json   # Diagnostics (unresolved/ambiguous links, orphans)
├── scripts/
│   ├── fetch-wiki.ts           # GitHub tarball download & extraction pipeline
│   ├── build-graph.ts          # Main orchestrator for build-time graph generation
│   ├── parse-markdown.ts       # Remark & frontmatter parser for markdown files
│   └── resolve-wikilinks.ts    # Link resolution engine (wikilinks & markdown links)
└── specs/                      # Feature specifications and task plans
```
