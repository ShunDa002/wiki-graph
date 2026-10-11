# Next.js Graph View Frontend Implementation Plan

## 1. Purpose and Scope

The frontend will provide an interactive graph view for exploring the LLM Wiki knowledge base. It will consume the existing FastAPI graph endpoints and present knowledge pages as nodes, relationships as edges, graph-level metrics, node details, filtering controls, and rebuild status.

The initial release should remain read-only from the user's perspective. The only server-changing operation is the protected graph rebuild request. Markdown content remains managed by the existing wiki workflow rather than edited through the graph interface.

## 2. Technology Stack

### Application Framework

Use Next.js with the App Router and TypeScript. Next.js will provide the application shell, routing, rendering boundaries, environment configuration, and production build workflow. TypeScript will define the graph API contracts and reduce errors when handling nodes, edges, metadata, and unresolved links.

The graph visualization should run as a client-side interactive view because layout calculations, zooming, panning, selection, and filtering depend on browser state and DOM interaction. Server-rendered UI can still be used for the surrounding application shell and non-interactive loading states.

### Graph Visualization

Use React Flow as the primary graph visualization library. It provides the interaction model needed for a knowledge graph, including custom nodes, custom edges, viewport controls, minimaps, selection, and programmatic viewport changes.

A separate graph layout engine, such as ELK.js or Dagre, should calculate readable node positions after graph data is loaded. The layout strategy should be replaceable so the interface can evolve from a simple hierarchical layout to layouts better suited to dense or highly connected knowledge graphs.

### Data Fetching and Server-State Management

Use TanStack Query for requests to the FastAPI service. It should manage loading state, caching, background refetching, request failures, and cache invalidation after a graph rebuild.

The full graph response should be treated as server state. Derived information such as filtered nodes, visible edges, selected neighborhoods, search matches, and display statistics should be calculated from the cached graph rather than fetched repeatedly.

### Client-State Management

Use React state for small local interactions such as the selected node, open panels, viewport preferences, and temporary filter controls. If state must be shared across many graph components, use a lightweight store such as Zustand.

Server data should not be duplicated into the client-state store. The store should contain only interface state and user preferences, while TanStack Query remains responsible for API data.

### Styling and Interface Components

Use Tailwind CSS for layout, spacing, responsive behavior, color themes, and graph-related visual states. A component system such as shadcn/ui can provide accessible controls for panels, dialogs, filters, tooltips, badges, command-style search, and notifications.

Node colors and visual markers should consistently reflect meaningful graph attributes such as page type, status, review requirement, broken-link involvement, and orphan status. Color must not be the only indicator, so labels, icons, borders, or badges should reinforce these distinctions.

### Validation and API Contracts

Represent the FastAPI response models as TypeScript types. Add runtime validation with Zod at the API boundary so malformed or incompatible responses fail clearly instead of producing unpredictable graph behavior.

The frontend should recognize the graph `schemaVersion`. Unsupported schema versions should produce a compatibility message and prevent rendering data under incorrect assumptions.

### Testing

Use Vitest and React Testing Library for data transformation, filtering, selection, and component behavior. Use Playwright for browser-level flows such as loading the graph, searching for a node, applying filters, opening node details, handling an unavailable API, and completing an authorized rebuild.

Mock Service Worker can simulate FastAPI responses during frontend tests without requiring the backend to run.

## 3. FastAPI Endpoint Integration

### Health Endpoint

Use `GET /health` for service-readiness feedback. The frontend may call it when the application starts or when a graph request fails, allowing it to distinguish an unavailable backend from an empty or invalid graph.

The health response can support a compact status indicator showing whether the graph is ready, how many wiki pages are available, and which source version is active.

### Full Graph Endpoint

Use `GET /graph` as the primary data source for the visualization. Its nodes and edges should be transformed into the visualization library's internal format without changing their canonical IDs.

The graph response should remain the authoritative source for:

- Nodes and node metadata
- Directed edges and relationship types
- Incoming and outgoing counts
- Orphan status
- Unresolved links
- Aggregate graph metadata
- Generation time and source version

The frontend should cache this response and derive filtered views locally. This avoids repeated full downloads whenever a user changes display filters.

### Metadata Endpoint

Use `GET /graph/metadata` for lightweight summary views or periodic freshness checks when loading the full graph is unnecessary. The frontend can compare `generatedAt` or `sourceVersion` with the currently cached graph and then refetch `GET /graph` only when the backend has a newer graph.

### Node Endpoint

Use `GET /graph/node?id=...` when a node must be addressed directly, such as through a bookmarked URL, shared link, or restored selection. The node ID must be URL-encoded because IDs contain folder separators and the `.md` extension.

For normal graph selection, the frontend should use the node already present in the full graph response. The individual-node endpoint is most useful for direct navigation and validation rather than every node click.

### Rebuild Endpoint

Use `POST /graph/rebuild` only from an administrative action. The frontend should send the rebuild credential through the `X-Graph-API-Key` header, show an in-progress state, prevent duplicate rebuild requests, and invalidate the cached graph and metadata after a successful response.

The rebuild API key must not be exposed in a public browser bundle. If rebuild functionality is available in a deployed frontend, the request should pass through a protected Next.js server-side boundary that obtains the secret from server-only environment configuration. Public users should receive a read-only graph experience.

## 4. Frontend Data Flow

When the graph view opens, the frontend should request `GET /graph`, validate the response, normalize it for the visualization library, calculate the layout, and render the result. The original response should remain unchanged in the query cache so all derived views share one authoritative dataset.

The normalization layer should:

1. Preserve backend node and edge IDs.
2. Map page metadata into node labels and visual variants.
3. Preserve edge direction and relationship type.
4. Build lookup maps for fast node and adjacency access.
5. Associate unresolved-link diagnostics with their source nodes.
6. Produce layout input separately from business metadata.

This separation keeps API concerns, graph calculations, and presentation behavior independent.

## 5. Graph Interaction Logic

### Navigation and Selection

Selecting a node should highlight the node and its immediate incoming and outgoing relationships. Unrelated elements may be dimmed rather than removed so users retain context.

The node detail panel should display the page title, relative path, type, status, tags, excerpt, dates, ownership metadata, incoming and outgoing counts, orphan status, and any unresolved links originating from that page.

The browser URL may store the selected node ID as a query parameter. This allows refreshable and shareable graph selections without creating a dedicated route for every wiki page.

### Search

Search should operate locally over the loaded graph and consider title, path, aliases, tags, type, and status. Selecting a search result should clear incompatible filters if necessary, reveal the node, center the viewport on it, and open its details.

### Filtering

Filters should support page type, folder, tag, status, review requirement, orphan state, and relationship type. Multiple active filters should produce a derived visible-node set, followed by a visible-edge set containing only relationships whose endpoints remain visible.

The interface should clearly distinguish between the total graph and the currently visible subgraph. Counts should update as filters change.

### Relationship Exploration

Users should be able to focus on a selected node's neighborhood. The first version can support one-hop incoming, outgoing, or combined neighborhoods. This should be calculated from adjacency maps derived from the full graph response, without additional backend requests.

Edge styling should distinguish wikilinks, Markdown links, embeds, and frontmatter relationships. Edge labels should be shown selectively to avoid visual overload, for example on selection, hover, or at higher zoom levels.

### Orphans and Broken Links

Orphan nodes should be visually identifiable and available through a dedicated filter. Unresolved links should not be rendered as ordinary edges because no valid target node exists. Instead, they should appear as diagnostics associated with the source node and in an optional broken-link panel.

This preserves the backend distinction between valid graph relationships and link-quality issues.

## 6. Loading, Empty, and Error States

The frontend should provide distinct states for:

- Initial graph loading
- Layout calculation
- Empty knowledge graph
- No results after filtering
- Backend unavailable
- Invalid or incompatible graph response
- Unauthorized rebuild request
- Failed rebuild operation

A large graph may take noticeable time to lay out even after the API request completes. Network loading and layout processing should therefore be represented separately.

If a refresh fails while cached graph data exists, the frontend should continue displaying the last successful graph and show a non-blocking stale-data warning. If no valid graph has ever loaded, the error state should provide a retry action and backend health information where available.

## 7. Performance Strategy

The frontend should avoid rerunning graph normalization and layout on every render. Expensive transformations should be memoized and recomputed only when the graph data or layout-affecting filters change.

For large graphs:

- Render labels selectively based on zoom or selection.
- Debounce search and rapidly changing filters.
- Build adjacency and node lookup maps once per graph version.
- Keep detail-panel updates independent from full layout calculation.
- Avoid recalculating positions when only visual highlighting changes.
- Consider web-worker-based layout calculation if the graph grows enough to block the browser's main thread.

The backend's `generatedAt` and `sourceVersion` values should be used as graph-version signals for frontend caching and layout reuse.

## 8. Security and Configuration

The FastAPI base URL should come from environment-specific configuration. Browser-visible configuration may include the public read-only API URL, but secrets must remain server-only.

CORS origins on FastAPI must include the actual deployed frontend origin. Development and production origins should be explicit rather than using a wildcard, especially because the application supports a credential-bearing administrative operation.

The frontend must treat all Markdown-derived fields as untrusted content. Excerpts and metadata should render as plain text unless a deliberate sanitization pipeline is introduced. Node IDs should always be URL-encoded when sent through query parameters.

The rebuild key must never be stored in browser storage, embedded in client-side environment variables, or committed to source control.

## 9. Accessibility and Responsive Behavior

The graph canvas should be supplemented by accessible controls and a textual representation of the selected node. Search, filters, node details, graph metrics, and rebuild feedback should remain usable by keyboard.

Graph navigation should include visible focus states, accessible labels, and alternatives to pointer-only gestures. A list or results panel should allow users to locate and select nodes without interacting directly with the canvas.

On smaller screens, the graph should remain the primary surface while filters and node details move into drawers or sheets. Dense administrative and diagnostic information should not permanently reduce the usable canvas area.

## 10. Observability and Compatibility

Frontend error reporting should distinguish network failures, response-validation failures, layout failures, and rendering failures. Diagnostic context may include the graph schema version, generation timestamp, source version, node count, and edge count, but must not include the rebuild credential.

The frontend and backend should evolve through the graph `schemaVersion`. Additive backend fields should be tolerated where possible, while breaking contract changes should require a new supported schema version and corresponding frontend normalization logic.

## 11. Initial Release Outcome

The first frontend release should provide a responsive, read-only graph explorer that:

- Loads and validates the FastAPI graph response.
- Visualizes the seven-folder knowledge base as nodes and directed edges.
- Supports search, filters, node selection, and neighborhood exploration.
- Presents graph metadata and node details without re-fetching unnecessarily.
- Surfaces orphan pages and unresolved-link diagnostics clearly.
- Supports secure administrative rebuilds through a server-side boundary.
- Handles loading, stale data, backend failures, and schema incompatibility gracefully.

This approach keeps the frontend aligned with the existing FastAPI contract while leaving room for larger graphs, additional analytics, and richer navigation in later releases.
