# Research & Technical Decisions: AI Chat Widget UI

## Dependencies & Technologies

### Next.js App Router & React
- **Decision**: Use Next.js App Router with React client components (`"use client"`) for the chat widget logic.
- **Rationale**: The chat widget relies heavily on client-side state (`localStorage`, `sessionStorage`, streaming). It must be a client component to manage `useEffect` and `useState`.
- **Alternatives considered**: Server Actions were considered but rejected because streaming text and managing local state are better suited for standard client-side fetch calls in this architecture.

### Motion for React
- **Decision**: Use Motion for React (formerly Framer Motion) for layout transitions (minimized/standard/expanded).
- **Rationale**: It provides high-performance, declarative animations that respect `prefers-reduced-motion` easily.
- **Alternatives considered**: CSS transitions (too complex for dynamic layout mounting/unmounting).

### Storage (localStorage & sessionStorage)
- **Decision**: `chat.storage.ts` will abstract browser storage calls. Handle cases where storage is disabled gracefully.
- **Rationale**: Keeps `chat.reducer.ts` pure. Ensures we meet the FR-006 and FR-007 requirements.

## Integration Patterns

### Custom SSE Stream Parsing
- **Decision**: Implement a custom fetch reader for Server-Sent Events since native `EventSource` does not support POST requests with a body.
- **Rationale**: The `/ask` endpoint requires sending a POST payload (`thread_id` and `user_input`). Native `EventSource` is strictly GET.
- **Implementation Note**: Read from `response.body.getReader()`, use a `TextDecoder`, and manually parse `data: ...` lines. Handle events: `token`, `sources`, `done`, `error`.

### Fetching Random Topics & Retry Handling
- **Decision**: Fetch `/random-topics` dynamically from the live backend without hardcoded dummy topic fallback constants (`DEFAULT_SUGGESTED_TOPICS` and `DEFAULT_TOPICS`). If the backend request fails or times out, the Next.js API route returns HTTP 502 Bad Gateway (`{"error": "Failed to fetch topics from backend"}`).
- **Retry Mechanism**: If the client fetch fails (`!res.ok` or network error), the component enters an error state displaying an inline error notice (e.g., "Failed to load suggested topics") with a compact "Retry" button. Clicking "Retry" resets error state, activates skeleton loading chip placeholders, and re-triggers the GET request to `/random-topics`.
- **Rationale**: Eliminates misleading mock/dummy topics, complies with the constitution's dynamic client architecture principle, and gives users direct control to re-request suggested topics when the backend becomes reachable.
- **Alternatives considered**:
  - Silently hiding the prompt container on failure: Rejected because users have no visibility or means to recover when the backend temporarily fails.
  - Retaining a fallback list of hardcoded topics: Explicitly rejected by user requirement to ensure all presented topics reflect live wiki knowledge.

### View Wiki Source Button (FR-017)
- **Decision**: Add a "View Wiki Source" button to the `NodePreview` header that constructs a URL from `NEXT_PUBLIC_ORIGINAL_WIKI_REPO` and the node's `path` metadata property, opening it in a new browser tab.
- **Rationale**: Allows users to quickly navigate to the original Markdown source on GitHub for any wiki node they are previewing in the graph, without losing their in-app graph state.
- **Environment Variable**: The `.env` file currently defines `ORIGINAL_WIKI_REPO` (without `NEXT_PUBLIC_` prefix). Since `NodePreview` is a `'use client'` component, Next.js requires the `NEXT_PUBLIC_` prefix for client-side access. The variable must be renamed to `NEXT_PUBLIC_ORIGINAL_WIKI_REPO` in `.env` and accessed as `process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO` in the component.
- **URL Construction**: `{NEXT_PUBLIC_ORIGINAL_WIKI_REPO}/{node.metadata.path}` — the `path` field on `GraphNode.metadata` contains the relative file path (e.g., `Artificial_Intelligence/Neural_Networks.md`), which appended to the repo tree URL produces a valid GitHub link.
- **Edge Case**: The button is hidden when `path` is empty or falsy, preventing navigation to an invalid URL.
- **Alternatives considered**:
  - Using a server-side API route to construct the URL: Rejected as unnecessarily complex for a simple string concatenation with a public env variable.
  - Keeping `ORIGINAL_WIKI_REPO` without `NEXT_PUBLIC_` prefix and passing it via props from a server component: Rejected because the `NodePreview` component is deeply nested in the client-side graph rendering pipeline and prop-drilling would be invasive.
