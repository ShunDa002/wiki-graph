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

### Fetching Random Topics
- **Decision**: Fetch `/random-topics` on widget mount and on every message submission.
- **Rationale**: Fulfills the updated FR-005 requirement to renew topics after every user message.
