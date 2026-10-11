# Combined High-Level Frontend Plan: LLM Wiki Graph View and AI Chat Widget

## 1. Purpose

Build a single read-only web experience with two complementary interfaces:

1. **LLM Wiki Graph View:** Visualizes notes under `wiki/` as an interactive knowledge graph.
2. **LLM Wiki AI Chat Widget:** Provides the chatbot interface only. At this stage, it uses local mock interactions and has no RAG, LLM, API, database, repository access, or other backend functionality.

The graph is the primary page experience. The chat widget floats above it in the bottom-right corner and can be minimized, opened, or expanded without disrupting graph interaction or losing local chat state.

---

## 2. Scope

### 2.1 Included

#### Graph View

- Read generated graph data derived from `wiki/**/*.md`
- Render notes as nodes and links as edges
- Zoom, pan, search, filter, and change graph layouts
- Select a node and inspect its metadata and excerpt
- Highlight direct neighbours and connecting edges
- Support desktop and mobile layouts
- Synchronize useful graph state with URL parameters
- Show loading, empty, and error states

#### AI Chat Widget Frontend

- Floating circular launcher in the bottom-right corner
- Animated transition between minimized, standard, and expanded states
- Header with expand, centered `LLM Wiki AI` title, and minimize controls
- Automated welcome message shown once
- Suggested prompt chips
- Message list and local mock responses
- Multiline message composer
- Preservation of unsent draft and local message history
- Responsive, keyboard-accessible, and reduced-motion behavior
- Replaceable transport interface for future backend integration

### 2.2 Explicitly Excluded for Now

- RAG retrieval
- LLM or embedding APIs
- Vector database
- Chat backend or server-side chat history
- User accounts and authentication
- Real chatbot answers
- Chat access to Markdown, GitHub, or local files
- Chat citations and feedback submission
- Graph or note editing
- Direct access to the local Obsidian vault
- Real-time synchronization with the local PC

---

## 3. Key Architectural Decisions

### 3.1 Shared Frontend Foundation

Use one Next.js application for both interfaces. The graph and chat widget share design tokens, responsive breakpoints, testing tools, and deployment configuration.

### 3.2 Graph Data Is Generated Before Runtime

The browser must not parse the Obsidian vault or access the local PC. A build-time process converts the approved `wiki/` snapshot into sanitized graph data:

```text
Local Obsidian vault
    ↓ intentional Git commit and push
GitHub repository
    ↓ build-time parsing and validation
public/generated/graph.json
    ↓ browser fetch
Interactive graph frontend
```

### 3.3 Chat Is Frontend-Only

The chat widget must not read `graph.json`, Markdown files, the GitHub repository, or the local filesystem during this stage. It uses predefined welcome content and clearly simulated responses.

### 3.4 Independent UI State

Graph state and chat state remain separate:

- Graph actions must not reset the chat.
- Chat expansion must not reset graph selection or filters.
- Minimizing the chat must not unmount it or clear its draft.

### 3.5 Read-Only Website

The deployed website has no editing, save, upload, or repository write functions. It consumes only generated static graph artifacts and frontend assets.

---

## 4. Recommended Technology Stack

```text
Framework:              Next.js App Router + React
Language:               TypeScript
Styling:                Tailwind CSS + CSS custom properties
Graph rendering:         Cytoscape.js
Default graph layout:    cytoscape-fcose
Animation:               Motion for React
Icons:                   Lucide React
Graph data validation:   Zod or equivalent runtime schema validation
Markdown build parsing:  fast-glob, gray-matter, unified, remark-parse
Frontend state:          React hooks and useReducer
Optional later state:    Zustand only if cross-component state becomes complex
Draft persistence:       localStorage
Chat session history:    sessionStorage
Unit/component tests:    Vitest + React Testing Library
End-to-end tests:        Playwright
Deployment:              Vercel or Cloudflare Pages
```

Redux is unnecessary for the initial scope. The graph may use focused React hooks, while the chat should use `useReducer` because it has explicit lifecycle transitions.

---

## 5. Frontend Layers

```text
Application Shell
├── Graph Feature
│   ├── Graph data loader and validator
│   ├── Graph state and filtering logic
│   ├── Cytoscape adapter
│   └── Graph UI components
├── Chat Feature
│   ├── Chat reducer and state
│   ├── Browser persistence adapter
│   ├── Mock transport adapter
│   └── Chat UI components
└── Shared UI
    ├── Design tokens
    ├── Buttons, tooltips, and drawers
    ├── Error and loading states
    └── Accessibility utilities
```

Dependencies should remain one-directional. Presentational components receive state and callbacks; they should not directly access storage, generated files, or future APIs.

---

## 6. Suggested Project Structure

```text
site/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── graph/
│   │   ├── GraphCanvas.tsx
│   │   ├── GraphToolbar.tsx
│   │   ├── SearchBox.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── NotePreview.tsx
│   │   └── GraphLegend.tsx
│   ├── chat/
│   │   ├── ChatWidget.tsx
│   │   ├── ChatLauncher.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── MessageViewport.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── SuggestedPrompts.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── MessageComposer.tsx
│   └── shared/
├── features/
│   ├── graph/
│   │   ├── graph.types.ts
│   │   ├── graph.schema.ts
│   │   ├── graph.loader.ts
│   │   ├── graph.filter.ts
│   │   └── graph.styles.ts
│   └── chat/
│       ├── chat.types.ts
│       ├── chat.reducer.ts
│       ├── chat.storage.ts
│       ├── mock-chat.transport.ts
│       └── chat hooks
├── public/generated/
│   ├── graph.json
│   └── build-report.json
├── scripts/
│   ├── build-graph.ts
│   ├── parse-markdown.ts
│   └── resolve-wikilinks.ts
└── tests/
```

---

## 7. Combined Page Layout

### Desktop

```text
┌───────────────────────────────────────────────────────────┐
│ Logo        Search notes...        Filters     Settings  │
├──────────────┬──────────────────────────┬─────────────────┤
│ Filters      │                          │ Note preview    │
│ Folders      │       Graph canvas       │ Title / tags    │
│ Tags         │                          │ Links / excerpt │
├──────────────┴──────────────────────────┴─────────────────┤
│ Graph status and layout controls              [Chat ◉]   │
└───────────────────────────────────────────────────────────┘
```

The minimized chat launcher floats above the page. The standard panel opens from the bottom-right without replacing the graph. Expanded chat may cover more of the page or use a modal-like overlay.

### Mobile

- Graph uses the available viewport.
- Search remains near the top.
- Filters open in a drawer.
- Note preview opens as a bottom sheet.
- Chat launcher remains reachable without covering key graph controls.
- Open chat uses nearly the full viewport and respects safe-area insets and the on-screen keyboard.

---

## 8. Graph-View Frontend Logic

### 8.1 Initial Load

1. Fetch `/generated/graph.json`.
2. Validate its schema.
3. Convert nodes and edges to Cytoscape elements.
4. Initialize one Cytoscape instance.
5. Apply styles and run fCoSE.
6. Fit visible elements to the viewport.
7. Replace the loading state with the graph.

### 8.2 Selection

When a node is selected:

- Store its ID as the active node.
- Open the note preview.
- Highlight the node, its neighbours, and connecting edges.
- Dim unrelated elements.
- Optionally write the node ID to `?note=` in the URL.

Clicking the graph background clears selection and restores normal opacity.

### 8.3 Search and Filtering

Search matches title, filename, alias, tag, and folder. Selecting a result centers the graph on the matching node.

Keep the complete graph in memory. Filters should hide nonmatching nodes and their edges rather than recreate the Cytoscape instance. Initially support:

- Folder
- Tag
- Orphan notes
- Minimum connection count
- One-hop or two-hop neighbourhood

### 8.4 Layouts and Preview

- Default layout: fCoSE
- Alternatives: concentric, breadth-first, circle, and grid
- Note preview: title, folder, tags, excerpt, incoming links, outgoing links, and connection count
- Defer full Markdown rendering

### 8.5 Presentation Rules

- Stable colors by top-level folder
- Bounded node size based on degree
- Strong selected state
- Dim unrelated nodes
- Reduce labels at low zoom levels
- Always show selected and hovered labels

### 8.6 Performance

For the initial small-to-medium vault, load the full graph and use in-memory search and filtering. Introduce debouncing, label reduction, cached calculations, or Web Workers only when measurements justify them.

---

## 9. Compact AI Chat Widget Frontend Plan

### 9.1 State Model

```typescript
type WidgetView = "minimized" | "standard" | "expanded";

type ChatState = {
  view: WidgetView;
  hydrated: boolean;
  initialized: boolean;
  draft: string;
  messages: ChatMessage[];
  mockTyping: boolean;
  unreadCount: number;
};
```

The display mode must be independent of `draft` and `messages`. Changing between minimized, standard, and expanded states must never clear chat data.

### 9.2 Launch and Greeting

1. Initially show a circular launcher in the bottom-right corner.
2. On click, animate it into the standard chat panel.
3. Insert the automated `LLM Wiki AI` welcome message once.
4. Display suggested prompts.
5. Move focus to the composer.

Suggested greeting:

> Welcome to LLM Wiki AI. I can help you explore the concepts and relationships in your LLM Wiki. What would you like to understand or work on today?

The prototype should clearly indicate that responses are simulated.

### 9.3 Header Controls

```text
[Expand]              LLM Wiki AI              [Minimize]
```

- Expand changes `standard` to `expanded`.
- Restore changes `expanded` to `standard`.
- Minimize returns to the launcher.
- No control clears the draft or messages.

### 9.4 Composer and Mock Flow

- `Enter`: submit locally
- `Shift + Enter`: new line
- Empty or whitespace-only drafts cannot be sent
- On local submission, append the user message, clear the draft, show a typing indicator, then append a clearly simulated assistant response
- Use a replaceable `ChatTransport` interface with `MockChatTransport` now and a possible API implementation later

### 9.5 Persistence

Keep the widget mounted while minimized. Persist:

- Draft and preferred panel mode in `localStorage`
- Message history and initialization state in `sessionStorage`

Access browser storage only after the client component mounts. Validate versions and recover safely from malformed or unavailable storage.

Primary acceptance flow:

```text
Open chat → type "hello" → minimize → reopen
→ history remains and composer still contains "hello"
```

### 9.6 Animation and Responsive Behavior

- Use a 200 to 300 ms scale, opacity, and layout transition
- Expand or collapse from the bottom-right transform origin
- Respect `prefers-reduced-motion`
- Standard desktop panel: approximately 380 to 420 px wide and 560 to 680 px high
- Expanded desktop panel: wider and approximately 75 to 85 viewport height
- Mobile panel: nearly full-screen with safe-area and virtual-keyboard support

---

## 10. Accessibility

### Shared Requirements

- Keyboard-accessible controls
- Visible focus indicators
- Sufficient contrast
- Reduced-motion support
- Clear loading, empty, and error states
- Touch targets of at least approximately 44 by 44 pixels

### Graph

- Provide an accessible search or list-based route to notes because a canvas graph alone is insufficient for all users.
- Label graph controls and preserve a logical tab order.
- Do not rely on color alone for selected or related nodes.

### Chat

- Accessible launcher, expand, restore, and minimize labels
- `aria-live="polite"` for new assistant messages
- Restore focus to the launcher after minimizing
- Restore focus to the composer after reopening
- `Escape` minimizes when focus is inside the widget
- Trap focus only if expanded mode behaves as a true modal dialog

---

## 11. Security and Privacy Boundaries

### Graph

- Read only generated JSON in the browser
- No GitHub write token or filesystem API
- Build only from approved `wiki/**/*.md`
- Reject or ignore symbolic links during generation
- Sanitize excerpts and any future rendered Markdown
- Never execute HTML or scripts from notes

### Chat Frontend

- No API keys or secrets
- No repository, graph data, Markdown, or local-file access
- Render user and mock message content as text by default
- Limit persisted draft and message sizes
- Do not store sensitive content in URLs
- Do not imply that mock responses are grounded AI answers

---

## 12. Testing Priorities

### Graph

- Graph schema validation
- Node and edge transformation
- Selection and neighbour highlighting
- Search and filters
- URL-state restoration
- Empty, invalid, and failed data states
- Desktop and mobile interactions

### Chat

- Launcher opens the panel
- Greeting appears once
- Header controls change view without losing state
- Draft updates correctly
- `Enter` and `Shift + Enter` behavior
- Typing `hello`, minimizing, and reopening preserves the draft
- Session restoration does not duplicate the greeting
- Invalid browser storage is ignored safely
- Focus restoration and reduced-motion behavior

Use Playwright for the full combined page, including verifying that opening and expanding chat does not reset graph state.

---

## 13. Implementation Phases

### Phase 1: Shared Application Shell

- Create Next.js, TypeScript, and Tailwind foundation
- Define shared design tokens and responsive layout
- Add placeholder graph and chat regions

### Phase 2: Graph MVP

- Load and validate generated graph data
- Render Cytoscape graph
- Add zoom, pan, selection, neighbour highlighting, and basic preview

### Phase 3: Graph Navigation

- Add search, folder and tag filters, depth control, layout selection, URL state, and responsive drawers

### Phase 4: Chat Visual Shell

- Build launcher, panel, header, welcome message, message list, suggestions, and composer
- Add standard, minimized, and expanded layouts

### Phase 5: Chat Local Interaction

- Add reducer, mock transport, typing indicator, keyboard behavior, animations, and browser persistence
- Verify the `hello` draft persistence acceptance flow

### Phase 6: Quality and Integration

- Accessibility review
- Responsive polish
- Loading and error states
- Unit, component, and end-to-end tests
- Confirm that graph and chat state remain independent

### Phase 7: Deployment

- Generate and validate `graph.json`
- Build the static-compatible frontend
- Deploy through Vercel or Cloudflare Pages
- Keep chatbot backend integration deferred

---

## 14. MVP Acceptance Criteria

### Graph View

- Displays nodes and edges from valid generated graph data
- Supports zoom, pan, search, folder filtering, node selection, and neighbour highlighting
- Shows basic note metadata and excerpts
- Works on desktop and mobile
- Has no editing or write capability

### AI Chat Widget Frontend

- Initially displays a circular bottom-right launcher
- Opens with a smooth animation
- Shows the required header control arrangement
- Shows one automated welcome message
- Accepts multiline draft input
- Preserves unsent `hello` after minimize and reopen
- Preserves local message history during the tab session
- Supports standard and expanded modes without resetting state
- Uses only simulated local responses
- Makes no backend, LLM, RAG, repository, or filesystem request

### Combined Experience

- Chat does not obscure critical graph controls in its minimized state
- Graph selection and filters survive chat open, minimize, and expand operations
- Chat draft and history survive graph interactions
- Both interfaces share a coherent visual system
- Both interfaces meet baseline accessibility and responsive requirements

---

## 15. Deferred Decisions

Record but postpone:

- RAG architecture and retrieval index
- Model, embedding, and vector-database providers
- Chat API protocol and streaming
- Grounded citations and answer feedback
- Authentication and server-side chat history
- Full Markdown note reader
- Chat context derived from a selected graph node
- Advanced graph analytics
- Progressive loading for very large graphs

---

## 16. Conclusion

Build one Next.js frontend with two isolated feature domains. The graph view consumes sanitized, generated `graph.json` data and provides read-only exploration of the published wiki. The chat widget is currently a frontend prototype that demonstrates launch, greeting, messaging, minimization, expansion, animation, accessibility, and local persistence without implementing chatbot intelligence or backend access.

The critical implementation rules are:

1. Generate graph data before browser runtime.
2. Keep the deployed website read-only.
3. Keep graph and chat state independent.
4. Keep the chat mounted while minimized so drafts and messages survive.
5. Clearly distinguish simulated chat behavior from future grounded AI functionality.
6. Preserve clean adapter boundaries so a future backend can be added without rebuilding the interface.
