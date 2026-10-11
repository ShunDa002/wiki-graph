# Practical High-Level Plan for an LLM Wiki Graph-View Website

## 1. Target Outcome

Build a read-only website that:

- Reads only Markdown files under `wiki/`
- Converts Obsidian `[[wikilinks]]` into graph relationships
- Displays each Markdown note as a node
- Displays links between notes as edges
- Supports search, filters, zooming, navigation, and note previews
- Has no ability to modify the local vault or GitHub repository
- Updates only when changes are intentionally committed and pushed
- Remains ready for a future RAG chatbot integration

The first version should be entirely static. It will not require a database, application server, or access to the local PC at runtime.

---

## 2. Recommended Architecture

```text
Local PC
└── Obsidian vault
    └── wiki/**/*.md
            │
            │ git commit + git push
            ▼
GitHub repository
            │
            │ deployment build
            ▼
Graph build script
├── Discover Markdown files
├── Parse frontmatter
├── Extract wikilinks
├── Resolve note targets
├── Create nodes and edges
└── Save graph.json
            │
            ▼
Static website
├── Load graph.json
├── Render interactive graph
├── Search and filter nodes
└── Show selected note details
```

The deployed website must not connect directly to the local PC. It should only display the approved snapshot committed to GitHub.

### Core Architectural Principle

Parse the Obsidian notes during the build process, then provide the browser with a sanitized and precomputed `graph.json` file.

This creates a clear separation:

- **Local Obsidian vault:** Authoring and editing
- **GitHub repository:** Versioned publishing source
- **Build pipeline:** Graph extraction and validation
- **Website:** Read-only presentation

---

## 3. Recommended Technology Stack

### Frontend Framework

Use:

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**

Next.js is recommended because it provides:

- Static website generation
- Straightforward deployment
- Component-based development
- Routing support for future note pages
- A suitable foundation for a future RAG chatbot
- The option to add server or API routes later without replacing the frontend

If the project were guaranteed to remain graph-only, Vite with React would also be suitable. However, Next.js is the better long-term choice because a chatbot is planned.

### Graph Visualization

Use **Cytoscape.js** as the graph engine.

Suggested packages:

```text
cytoscape
cytoscape-fcose
react-cytoscapejs
```

Cytoscape.js provides:

- Interactive node and edge rendering
- Zooming and panning
- Node and edge styling
- Graph filtering
- Neighbour traversal
- Desktop and touch interactions
- Built-in graph algorithms
- Multiple layout options
- JSON-based graph data

Use **fCoSE** as the default force-directed layout because it produces a knowledge-graph appearance similar to an Obsidian graph.

### Markdown and Obsidian Parsing

Suggested packages:

```text
gray-matter
unified
remark-parse
remark-frontmatter
fast-glob
```

Responsibilities:

- `fast-glob`: Find all `wiki/**/*.md` files
- `gray-matter`: Extract YAML frontmatter
- `remark-parse`: Parse Markdown structure
- `remark-frontmatter`: Recognize frontmatter blocks
- A custom parser: Extract and normalize Obsidian wikilinks
- `unified`: Support future Markdown processing pipelines

The parser should recognize common Obsidian link formats:

```markdown
[[RAG]]
[[RAG|Retrieval-Augmented Generation]]
[[RAG#Chunking]]
[[Concepts/RAG]]
![[architecture.png]]
```

For the graph MVP, process note links and ignore embedded images or attachments.

### State Management

Start with ordinary React state:

```text
useState
useMemo
useCallback
```

Redux is unnecessary for the MVP.

If interaction logic becomes more complex, introduce **Zustand** to manage:

- Selected node
- Search query
- Active tags
- Active folders
- Graph depth
- Hidden nodes
- Selected layout
- Display settings

### Testing

Use:

```text
Vitest
React Testing Library
Playwright
```

Prioritize tests for:

1. Wikilink extraction
2. Link target resolution
3. Duplicate title handling
4. Broken-link detection
5. Graph filtering
6. Node selection
7. Desktop and mobile interactions

### Deployment

Recommended options:

- **Vercel:** Simplest Next.js deployment
- **Cloudflare Pages:** Strong static-hosting option
- **GitHub Pages:** Possible when using a complete static export

The first version requires no database and no persistent backend.

---

## 4. Proposed Project Structure

Add a `site/` directory to the existing repository:

```text
My-LLM-Wiki/
├── wiki/
│   ├── Concepts/
│   ├── Models/
│   └── Tools/
│
├── site/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── GraphCanvas.tsx
│   │   ├── GraphToolbar.tsx
│   │   ├── SearchBox.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── NotePreview.tsx
│   │   └── GraphLegend.tsx
│   │
│   ├── lib/
│   │   ├── graph-types.ts
│   │   ├── graph-loader.ts
│   │   ├── graph-filter.ts
│   │   └── cytoscape-style.ts
│   │
│   ├── public/
│   │   └── generated/
│   │       ├── graph.json
│   │       └── build-report.json
│   │
│   ├── scripts/
│   │   ├── build-graph.ts
│   │   ├── parse-markdown.ts
│   │   └── resolve-wikilinks.ts
│   │
│   ├── tests/
│   ├── package.json
│   └── next.config.ts
│
└── .github/
    └── workflows/
        └── deploy-graph.yml
```

The build process should be:

```text
Build graph data
      ↓
Generate graph.json
      ↓
Validate graph output
      ↓
Build Next.js application
      ↓
Deploy static output
```

---

## 5. Graph Data Model

The frontend should not parse the vault at runtime. A build script should create a browser-friendly JSON file.

### Node Model

```typescript
interface WikiNode {
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
```

Example:

```json
{
  "id": "concepts/rag",
  "title": "Retrieval-Augmented Generation",
  "path": "wiki/Concepts/RAG.md",
  "folder": "Concepts",
  "tags": ["rag", "llm"],
  "aliases": ["RAG"],
  "excerpt": "Retrieval-Augmented Generation combines retrieval...",
  "outgoingCount": 4,
  "incomingCount": 7,
  "isOrphan": false
}
```

### Edge Model

```typescript
interface WikiEdge {
  id: string;
  source: string;
  target: string;
  type: "wikilink" | "markdown-link";
  heading?: string;
}
```

Example:

```json
{
  "id": "concepts/rag--concepts/embeddings",
  "source": "concepts/rag",
  "target": "concepts/embeddings",
  "type": "wikilink"
}
```

### Complete Graph Model

```typescript
interface WikiGraph {
  generatedAt: string;
  sourceCommit?: string;
  nodes: WikiNode[];
  edges: WikiEdge[];
  unresolvedLinks: UnresolvedLink[];
  metadata: {
    nodeCount: number;
    edgeCount: number;
    orphanCount: number;
  };
}
```

Including `sourceCommit` makes it possible to identify the exact Git commit used to generate the visible graph.

---

## 6. Build-Time Graph Generation Logic

### Step 1: Discover Markdown Files

Scan only:

```text
wiki/**/*.md
```

Explicitly exclude:

```text
.obsidian/**
templates/**
node_modules/**
.git/**
```

Do not follow symbolic links. This prevents a symlink inside `wiki/` from causing the build script to read files outside the intended directory.

### Step 2: Create a Note Registry

Before resolving links, create lookup indexes:

```text
Normalized path → node
Filename stem → possible nodes
Alias → possible nodes
```

Example:

```text
concepts/rag → RAG node
rag → RAG node
retrieval augmented generation → RAG node
```

This registry allows consistent Obsidian link resolution.

### Step 3: Extract Metadata

For each note, extract:

- Title
- Relative path
- Folder
- Frontmatter aliases
- Tags
- First meaningful paragraph
- Wikilinks
- Standard relative Markdown links

Use this title priority:

```text
Frontmatter title
    ↓
First H1 heading
    ↓
Filename without .md
```

### Step 4: Resolve Wikilinks

Use this resolution order:

1. Exact relative path
2. Exact vault-relative path
3. Exact filename
4. Exact alias
5. Case-insensitive filename
6. Unresolved link

If two notes have the same filename, do not silently select one. Record the link as ambiguous unless the source note uses a folder-qualified path.

For example, this link may be ambiguous:

```markdown
[[RAG]]
```

If both of these files exist:

```text
wiki/Concepts/RAG.md
wiki/Projects/RAG.md
```

The source note should instead use:

```markdown
[[Concepts/RAG]]
```

### Step 5: Calculate Graph Properties

After creating the edge list, calculate:

- Incoming-link count
- Outgoing-link count
- Orphan status
- Node degree
- Folder counts
- Tag counts
- Connected components, optionally

These values allow the frontend to style and filter the graph without recalculating all graph metrics.

### Step 6: Write Generated Output

Generate:

```text
site/public/generated/graph.json
```

Also generate a validation report:

```text
site/public/generated/build-report.json
```

The report should include:

- Unresolved links
- Ambiguous links
- Duplicate aliases
- Duplicate titles
- Notes without links
- Broken relative Markdown links

This report provides a practical way to maintain the quality of the wiki.

---

## 7. Frontend Layout

### Desktop Layout

```text
┌───────────────────────────────────────────────────────┐
│ Logo        Search notes...       Filters   Settings │
├──────────────┬────────────────────────┬───────────────┤
│              │                        │               │
│ Filters      │                        │ Note preview  │
│              │     Graph canvas       │               │
│ Folders      │                        │ Title         │
│ Tags         │                        │ Tags          │
│ Connections  │                        │ Links         │
│              │                        │ Excerpt       │
│              │                        │               │
├──────────────┴────────────────────────┴───────────────┤
│ 125 notes · 314 links · Layout: fCoSE · Reset view   │
└───────────────────────────────────────────────────────┘
```

### Mobile Layout

- Let the graph occupy the full screen
- Keep search at the top
- Open filters in a side drawer
- Open the note preview as a bottom sheet
- Keep zoom, reset, and layout controls compact
- Support touch selection, pinch zoom, and dragging

---

## 8. Frontend Logic

### Initial Load

When the page opens:

1. Fetch `/generated/graph.json`
2. Validate the expected schema
3. Convert nodes and edges into Cytoscape elements
4. Initialize the Cytoscape instance
5. Apply graph styles
6. Run the selected layout
7. Fit the graph to the viewport
8. Update the loading state

```text
Page mounted
    ↓
Fetch graph.json
    ↓
Validate data
    ↓
Transform into Cytoscape elements
    ↓
Create graph instance
    ↓
Apply styles and layout
    ↓
Display graph
```

Display a loading interface while the JSON is loading and while the initial graph layout is running.

### Node Selection

When the user clicks a node:

1. Set it as the selected node
2. Open the note preview panel
3. Highlight the selected node
4. Highlight its direct neighbours
5. Highlight the connecting edges
6. Dim unrelated nodes and edges
7. Update the URL with the selected node ID

Example URL:

```text
/graph?note=concepts%2Frag
```

This allows users to bookmark or share a graph focused on a particular note.

### Background Click

When the user clicks the graph background:

1. Clear the selected node
2. Close or minimize the preview
3. Remove neighbour highlighting
4. Restore normal graph opacity
5. Remove the note parameter from the URL

### Search

Search should match:

- Note title
- Filename
- Alias
- Tag
- Folder

Recommended behavior:

1. The user enters text
2. Matching results appear below the search input
3. Matching graph nodes are highlighted
4. Selecting a result centers and zooms to the node
5. The selected node's preview opens

For a small or medium graph, in-memory search is sufficient. A dedicated search engine is unnecessary for the MVP.

### Folder and Tag Filters

Do not recreate the Cytoscape graph instance every time a filter changes.

Instead:

1. Keep the complete graph in memory
2. Calculate the matching node IDs
3. Hide nonmatching nodes
4. Hide edges whose source or target is hidden
5. Re-run the layout only when necessary

Useful filters include:

- Folder
- Tag
- Linked notes only
- Orphan notes only
- Minimum number of connections
- Incoming or outgoing relationships
- Distance from the selected note

### Neighbour-Depth Control

Allow the user to choose:

```text
All notes
1 hop
2 hops
3 hops
```

If a note is selected and `2 hops` is active:

1. Start from the selected node
2. Find its direct neighbours
3. Find the neighbours of those nodes
4. Display only the resulting subgraph

This becomes increasingly useful as the vault grows.

### Graph Layout Control

Start with these layout options:

- `fCoSE`: Default knowledge-graph layout
- `concentric`: Places the selected or highly connected nodes near the center
- `breadthfirst`: Shows more hierarchical relationships
- `circle`: Useful for small filtered sets
- `grid`: Useful for reviewing all visible notes

Changing the layout should:

1. Stop the current layout
2. Run the selected layout
3. Animate nodes into their new positions
4. Fit visible elements into the viewport

### Note Preview

For the MVP, the note panel does not need to render the entire Markdown document.

Display:

- Note title
- Folder
- Tags
- Excerpt
- Incoming links
- Outgoing links
- Number of connections
- A `Focus graph here` action
- An optional GitHub source link

Full Markdown rendering can be added later.

### URL State

Synchronize important state with URL parameters where practical:

```text
?note=concepts%2Frag
&folder=Concepts
&tag=llm
&depth=2
&layout=fcose
```

This makes graph views shareable and improves browser back-and-forward navigation.

### Error States

The frontend should handle:

- Failure to load `graph.json`
- Invalid graph schema
- Empty graph
- Missing node from a bookmarked URL
- Layout failure
- Graph with nodes but no edges

Errors should be displayed in a readable panel with an option to retry or reset the view.

---

## 9. Visual Styling Rules

Use meaningful and consistent styling rather than random colors.

### Node Color

Color nodes by top-level folder:

```text
Concepts → blue
Models   → purple
Tools    → green
Projects → orange
Other    → gray
```

Generate colors from a stable folder-to-color map so a folder retains the same color across builds.

### Node Size

Base node size on connection count:

```text
size = baseSize + scaledDegree
```

Apply sensible minimum and maximum values so highly connected nodes do not dominate the graph.

### Node States

```text
Normal node       Full folder color
Hovered node      Brighter border
Selected node     Strong border and glow
Neighbour node    Full opacity
Unrelated node    Reduced opacity
Orphan node       Distinct border or smaller size
```

### Edge States

```text
Normal edge       Thin and muted
Connected edge    Brighter and wider
Outgoing edge     Optional arrow
Incoming edge     Optional alternate color
```

### Label Behavior

Avoid displaying every node label when zoomed out.

Recommended behavior:

- Always show the selected node label
- Show a label for the hovered node
- Show labels above a zoom threshold
- Optionally show labels for highly connected nodes
- Hide most labels when the graph is dense

---

## 10. Performance Strategy

### Up to Approximately 1,000 Notes

Use:

- Full graph loaded in the browser
- Client-side filtering
- Force-directed layout
- Labels controlled by zoom level
- Precomputed graph metrics

### Approximately 1,000 to 5,000 Notes

Add:

- Reduced label rendering
- Debounced search
- Conditional layout reruns
- Folder-based or tag-based initial filtering
- Cached visibility calculations
- A Web Worker for expensive transformations, if necessary

### Very Large Graphs

Consider:

- Server-generated node positions
- Progressive graph loading
- Folder-level graph clusters
- WebGL-oriented rendering
- Loading only nearby nodes

Do not optimize for very large scale in the first version unless the current `wiki/` already contains thousands of notes.

---

## 11. Security and Read-Only Boundaries

The graph site should have no write capability by design.

Implement these controls:

- Do not include a GitHub personal access token in frontend code
- Do not expose a local filesystem API
- Do not make GitHub write API calls
- Do not provide an editing or save interface
- Build only from `wiki/**/*.md`
- Reject or ignore symbolic links
- Escape content derived from Markdown
- Sanitize any rendered Markdown or HTML
- Do not execute scripts found inside notes
- Use a read-only deployment credential if private repository access is needed
- Provide the browser with generated JSON instead of filesystem access

The website should consume a published snapshot, never the live local vault.

---

## 12. Implementation Phases

### Phase 1: Graph Generator

Deliverables:

- Markdown discovery
- Frontmatter extraction
- Wikilink extraction
- Link resolution
- Node and edge generation
- `graph.json` output
- Unresolved-link report

Success condition:

> Running one command converts `wiki/` into a valid graph data file.

### Phase 2: Graph MVP

Deliverables:

- Next.js application
- Cytoscape.js canvas
- Node and edge rendering
- Zoom and pan
- Node selection
- Basic note preview
- Responsive page structure

Success condition:

> The browser displays the complete wiki graph and allows the user to inspect individual notes.

### Phase 3: Navigation and Filtering

Deliverables:

- Search
- Folder filters
- Tag filters
- Orphan filter
- Neighbour highlighting
- Graph-depth control
- Layout selector
- Reset-view button
- URL state

Success condition:

> The user can quickly find a note and isolate related knowledge.

### Phase 4: Publishing Automation

Deliverables:

- GitHub Actions workflow
- Automatic graph regeneration
- Schema validation
- Static production build
- Deployment to the chosen hosting provider
- Build failure when graph generation or validation fails

Success condition:

> Pushing an approved commit automatically updates the deployed graph.

### Phase 5: Quality and Polish

Deliverables:

- Mobile interactions
- Loading and error states
- Keyboard navigation
- Accessibility improvements
- Better graph styling
- Broken-link report
- Performance testing
- Automated frontend tests

Success condition:

> The graph is reliable, readable, and usable across desktop and mobile devices.

---

## 13. Recommended MVP Scope

### Include in the First Release

- Read `wiki/**/*.md`
- Extract titles, tags, folders, aliases, and wikilinks
- Generate `graph.json`
- Render with Cytoscape.js
- Use the fCoSE layout
- Search by title and alias
- Filter by folder
- Click a node to show metadata and an excerpt
- Highlight direct neighbours
- Reset and fit the graph view
- Deploy as a static website

### Defer Until Later

- Full Markdown reader
- Graph editing
- Authentication
- RAG chatbot
- Vector database
- Collaborative features
- Real-time local-PC synchronization
- Live GitHub polling
- Advanced graph analytics
- Very-large-graph optimizations

---

## 14. Final Stack Recommendation

```text
Framework:          Next.js + React
Language:           TypeScript
Styling:            Tailwind CSS
Graph engine:       Cytoscape.js
Default layout:     fCoSE
Markdown parsing:   unified + remark-parse
Frontmatter:        gray-matter
File discovery:     fast-glob
State management:   React state, then Zustand if needed
Testing:            Vitest + React Testing Library + Playwright
Deployment:         Vercel or Cloudflare Pages
Graph data source:  Generated static graph.json
```

## 15. Final Recommendation

Build the graph system as two separate layers:

1. A build-time parser that converts the approved `wiki/` snapshot into validated graph data
2. A static frontend that renders and explores that data without write access

This approach keeps the initial website simple, fast, inexpensive, and secure. It also creates a reusable data foundation for the future chatbot, where the selected graph node and surrounding notes can later be used as retrieval context.
