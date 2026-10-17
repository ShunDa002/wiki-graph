# Feature Specification: LLM Wiki Graph View

**Feature Branch**: `001-wiki-graph-view`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "Build the LLM Wiki graph view based on the plan `llm-wiki-graph-view-plan.md`"

## Clarifications

### Session 2026-10-06
- Q: How should the build script handle ambiguous wikilinks when multiple notes have the same filename? → A: Leave unresolved and record in a validation report (Obsolete, moved to backend)
- Q: Should the wiki files be fetched from the GitHub repository at build time or at runtime? → A: Fetch at build time during static site generation (Obsolete, now fetched dynamically from backend)
- Q: Does the GitHub repository require authentication to fetch the wiki files during the build? → A: No authentication needed (the repository is public)
- Q: Should the GitHub repository URL be hardcoded or configurable via an environment variable? → A: Configurable via environment variable (default: https://github.com/ShunDa002/My-LLM-Wiki/tree/main/wiki)

### Session 2026-10-10
- Q: How should the frontend verify the user is authorized to trigger a rebuild? → A: Hide the rebuild button entirely on the frontend and trigger rebuilds only via external CI/webhook.
- Q: When should the frontend perform graph data freshness checks (`GET /graph/metadata`)? → A: Check metadata on initial load and when the user clicks a manual "Refresh" button.
- Q: What is the expected fallback behavior if the backend is unavailable and no cache exists? → A: Display a distinct "Service Unavailable" error state with a manual retry button.
- Q: How should the frontend handle an unsupported `schemaVersion` from the backend? → A: Block rendering entirely and display a compatibility error prompting the user to refresh the client.

### Session 2026-10-11
- Q: How should all graph layouts (Hierarchical, Grid, Radial) be unified with the Force-Directed (Organic) visual design? → A: Migrate all layouts into the unified HTML5 Canvas engine so every layout shares identical neon aesthetics, circular nodes, glowing links, and 60fps performance.
- Q: How should node positioning and physics behave in Hierarchical, Grid, and Radial layouts? → A: Fixed geometric positioning without physics forces, preserving strict hierarchy, rows, or concentric rings while allowing camera pan, zoom, and node interaction.
- Q: How should edge links be rendered in Hierarchical (Top-Down and Left-Right) layouts? → A: Straight directed vectors with arrowheads, maintaining identical glowing neon link styles and high performance across all layouts.
- Q: When switching between layouts, how should node positions and the camera transition? → A: Smoothly animate (tween) node positions over 500-600ms to their new coordinates and smoothly fit the camera view to the layout bounds.
- Q: How should the canvas overlay controls handle simulation buttons (Play/Pause, Reheat) in static layouts? → A: Retain simulation and layout buttons across all layouts for visual consistency, adapting their behavior in static layouts ("Re-cluster" re-aligns layout, "Play/Pause" is disabled with a tooltip). (Formerly: Hide physics controls in static layouts)

### Session 2026-10-12
- Q: How should the "Pause Simulation" and "Re-cluster" buttons behave when clicked in static layouts (Hierarchical, Grid, and Radial)? → A: Display both buttons uniformly across all layouts for toolbar consistency; in static layouts, "Re-cluster" re-computes and smoothly animates nodes back to structured layout coordinates, while "Pause Simulation" is disabled with an explanatory tooltip indicating physics is inactive in static layouts.
- Q: How should the chat widget launcher and open panel be positioned relative to the category legend? → A: Minimized launcher floats at sm:bottom-16 bottom-5 right-5 directly above the category legend on desktop; when opened, the chat panel anchors at bottom-5 right-5 floating over the background legend to maximize vertical reading area.

### Session 2026-10-13
- Q: How should the chat viewport scroll to the source and visually emphasize the clicked citation? → A: Auto-expand the accordion, smooth-scroll the specific source item into view centered in the chat viewport, and apply a pulsing highlight to that exact source item.
- Q: Should clicking a citation or source item also interact with the background graph view or Note Preview panel? → A: Keep citation interaction purely within the chat widget (expanding accordion, scrolling, and highlighting the source item without changing graph state).
- Q: How should the citation button behave when clicked repeatedly or if a cited number has no matching source in the accordion? → A: Re-focus and re-pulse the matching source item on repeated clicks; gracefully ignore clicks if the citation number is not found in the sources list.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore Note Graph (Priority: P1)

As a user, I want to see an interactive visualization of all my Markdown notes as nodes connected by links, so that I can understand the relationships between different concepts.

**Why this priority**: Core value proposition of the graph view. Without seeing the connections, the site is just a list of files.

**Independent Test**: Can be tested by loading data from the FastAPI backend and verifying that nodes and edges correctly represent the Markdown files and wikilinks.

**Acceptance Scenarios**:

1. **Given** the backend serves a valid graph response, **When** the page loads, **Then** an interactive graph is rendered showing nodes (notes) and edges (wikilinks).
2. **Given** the graph is visible, **When** I click a node, **Then** the node is highlighted, direct neighbors are highlighted, and a note preview panel opens.
3. **Given** a note preview is open, **When** I click the background, **Then** the note preview closes and highlighting is removed.

---

### User Story 2 - Search and Filter Notes (Priority: P2)

As a user, I want to search notes by title/alias and filter the graph by folder or tag, so that I can easily find specific information in a large graph.

**Why this priority**: Critical for usability as the vault grows beyond a few dozen notes.

**Independent Test**: Can be tested by providing a search term or selecting a folder filter and verifying the graph updates to show only matching nodes.

**Acceptance Scenarios**:

1. **Given** the graph is loaded, **When** I enter a search term, **Then** matching nodes are highlighted and selecting a result centers the graph on it.
2. **Given** the graph is loaded, **When** I select a folder filter, **Then** only nodes within that folder (and their edges) remain visible.

---

### User Story 3 - View Note Details (Priority: P3)

As a user, I want to read a preview of a selected note including its excerpt, tags, and connections, so that I can quickly assess its content without leaving the graph view.

**Why this priority**: Enhances the exploration experience, but the graph itself is primary.

**Independent Test**: Can be tested by clicking a node and verifying the preview panel displays the correct title, tags, excerpt, and link counts.

**Acceptance Scenarios**:

1. **Given** a node is selected, **When** the preview panel opens, **Then** it displays the note's title, folder, tags, excerpt, and connection counts.

### User Story 4 - Unified Neon Graph Theme & Multi-Layout Canvas Visualization (Priority: P1)

As a user, I want all graph layout views (Force-Directed Organic, Hierarchical Top-Down, Hierarchical Left-Right, Grid Structure, and Concentric Radial) rendered within a unified HTML5 Canvas styled with a luminescent "Neon" theme on a deep navy canvas, so that structural hubs pop prominently, categories are instantly identifiable by fluorescent hues, and interacting with nodes creates vivid Neon Blue link highlights across every layout.

**Why this priority**: Core visual and cognitive improvement for knowledge exploration, transforming flat diagrams into an intuitive, neural-style constellation.

**Independent Test**: Verify physics clustering settles organically, degree centrality correctly sizes hubs ($r \approx 18-22\text{px}$) versus leaf notes ($r \approx 5.5-7\text{px}$), nodes render in solid pure colors (no radial gradients), and selection/hover states illuminate in Neon Blue (`#1f51ff`).

**Acceptance Scenarios**:

1. **Given** notes of varying degree centrality, **When** rendered, **Then** core hubs scale up to 18-22px while leaf notes stay compact (5.5-7px).
2. **Given** notes across concepts, sources, and meta hubs, **When** rendered on the `#060b18` Deep Navy canvas, **Then** they display pure solid colors (Cyan `#00f0ff` for hubs, Magenta `#ff2a85` for concepts, Yellow `#ffe600` for sources, Blue `#38bdf8` for leaf notes, Amber `#fb923c` for orphans) with no radial gradient or extra cyan halo.
3. **Given** any node, **When** hovered or selected, **Then** the node, its direct neighbors, and all incident connecting edges illuminate in vivid Neon Blue (`#1f51ff`).
4. **Given** any layout (Organic, Hierarchical, Grid, or Radial), **When** viewing the HUD controls, **Then** Play/Pause and Re-cluster buttons are visible; in static layouts, clicking Re-cluster smoothly re-aligns nodes to their structured positions, and Play/Pause remains disabled with an informative tooltip.

---

### User Story 5 - AI Chat Widget Integration (Priority: P2)

As a user, I want an AI chat launcher floating above the category legend in the bottom-right corner of the graph view, so that I can open an AI assistant to query wiki concepts without obscuring or conflicting with the graph legend.

**Why this priority**: Enhances exploratory knowledge discovery by integrating the conversational chatbot into the primary graph view.

**Independent Test**: Load the graph view; verify the floating chat launcher sits above the category legend on desktop (`sm:bottom-16`), opens smoothly into the standard chat panel anchored at `bottom-5`, and minimizes cleanly back to `sm:bottom-16`.

**Acceptance Scenarios**:

1. **Given** the graph view is loaded on desktop, **When** the chat is minimized, **Then** the launcher floats at `bottom-16 right-5` directly above the category legend without overlapping.
2. **Given** the chat is minimized on mobile screens (`<640px`), **When** viewed, **Then** the launcher floats at `bottom-5 right-5` (since the category legend is hidden on mobile).
3. **Given** the chat launcher is clicked, **When** opening to standard or expanded view, **Then** the chat panel smoothly opens, anchoring at `bottom-5 right-5` (z-50) floating over the category legend and Note Preview panel.
4. **Given** an AI response with source citations in square brackets `[N]`, **When** the user clicks an inline citation button `[N]`, **Then** the chat viewport smoothly scrolls up to center the specific source item `[N]` in view within the auto-expanded sources accordion, and visually emphasizes it with an animated pulsing highlight. Repeated clicks re-focus and re-trigger the pulse, and clicks on citations not present in the sources list are gracefully ignored.

---

### Edge Cases

- What happens when the backend graph response is empty or malformed? -> Display a readable error panel.
- How does the system handle an unsupported `schemaVersion` from the backend? -> Block rendering entirely and display a compatibility error prompting the user to refresh the client.
- What happens if the backend is unavailable? -> Display a distinct "Service Unavailable" error state with a manual retry button.
- How does the system handle isolated notes (orphans) with no links? -> Display them distinctly with dashed borders and allow filtering them out.
- How does the system behave on mobile devices? -> Open the preview as a bottom sheet, let the graph occupy full screen, support touch/pinch interactions.
- How does the system handle ambiguous wikilinks? -> It displays them as diagnostics associated with the source node in the UI.
- How does the system handle notes linking multiple times to the same target? -> Deduplicate neighbors before rendering to eliminate duplicate React key warnings.
- What happens when clicking simulation controls in static layouts? -> "Re-cluster" smoothly animates nodes back to deterministic layout coordinates, while "Play/Pause" is disabled with an explanatory tooltip indicating physics is inactive in static layouts.
- How does the chat launcher avoid collision with the category legend? -> On desktop, the minimized launcher is positioned at sm:bottom-16 right-5 directly above the legend; on mobile screens where the legend is hidden, it settles at bottom-5 right-5.
- What happens when a user clicks a citation button `[N]`? -> The chat viewport smoothly scrolls up to center the matching source item inside the Sources Accordion, auto-expanding the accordion if closed, and triggers a pulsing highlight on that source card.
- What happens if the user clicks a citation number that does not exist in the message's source list? -> The click is gracefully ignored without scrolling or throwing errors.
- Does clicking a chat citation or source item alter the background graph view? -> No, citation interactions remain strictly self-contained within the chat assistant widget.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch graph data dynamically from the FastAPI backend endpoints (`/graph`, `/graph/metadata`) rather than relying on a statically generated JSON file.
- **FR-002**: System MUST render an interactive graph where nodes represent notes and edges represent wikilinks.
- **FR-003**: Users MUST be able to pan and zoom the graph.
- **FR-004**: System MUST allow users to select a specific node, updating the URL to reflect the selection.
- **FR-005**: System MUST provide a search input that matches note titles, filenames, aliases, and tags.
- **FR-006**: System MUST allow filtering visible nodes by folder and tag.
- **FR-007**: System MUST display a note preview panel showing metadata and an excerpt when a node is selected.
- **FR-008**: System MUST support multiple layout algorithms (Force-Directed Organic, Hierarchical Top-Down, Hierarchical Left-Right, Grid, and Concentric Radial), rendered within the unified HTML5 Canvas engine with a default layout optimized for knowledge graphs.
- **FR-009**: System MUST display unresolved and ambiguous links as diagnostics associated with their source nodes.
- **FR-010**: System MUST configure the FastAPI backend URL via an environment variable (`NEXT_PUBLIC_BACKEND_URL`) and Next.js backend proxy rewrite.
- **FR-011**: System MUST check metadata freshness (`GET /graph/metadata`) on initial load and when the user clicks a manual "Refresh" button.
- **FR-012**: System MUST display a "Service Unavailable" error state with a manual retry button if the backend is unavailable and no cache exists.
- **FR-013**: System MUST block rendering and display a compatibility error if the backend returns an unsupported `schemaVersion`.
- **FR-014**: The frontend MUST NOT expose a rebuild button; graph rebuilds MUST be triggered exclusively via external CI/webhook to the backend.
- **FR-015**: System MUST implement a unified 60fps HTML5 Canvas engine rendering all layouts with degree centrality scaling (leaf notes 5.5-7px, hubs 18-22px), utilizing physics simulation for Organic mode and deterministic fixed geometric coordinates without physics displacement for Hierarchical, Grid, and Radial modes.
- **FR-016**: System MUST render the visualization on a Deep Navy backdrop (`#060b18`) with ambient midnight-blue radial glow and faint constellation lattice.
- **FR-017**: System MUST render nodes as pure, flat solid color discs without radial gradients ("radiant"), categorized into Electric Cyan hubs (`#00f0ff`), Magenta concepts (`#ff2a85`), Neon Yellow sources (`#ffe600`), Pale Blue leaf notes (`#38bdf8`), and Neon Amber orphans (`#fb923c`).
- **FR-018**: System MUST render all node selection, node hover, connected neighbor rings, and active edge link effects as straight directed vectors with arrowheads in high-contrast Neon Blue (`#1f51ff`) uniformly across all layouts, with no residual cyan circles surrounding nodes.
- **FR-019**: System MUST deduplicate multi-linked neighbors in node details and preview panels to guarantee unique React keys.
- **FR-020**: System MUST smoothly animate node coordinates over 500-600ms and smoothly fit camera viewport bounds whenever switching between layout algorithms.
- **FR-021**: Canvas overlay controls MUST display simulation and layout control buttons (Play/Pause, Re-cluster / Re-heat) uniformly across all layouts; in Force-Directed Organic mode they control physics simulation, and in static layouts (Hierarchical, Grid, Radial), "Re-cluster" re-computes and smoothly animates nodes back to structured layout coordinates while "Play/Pause" is disabled with an explanatory tooltip indicating physics is inactive.
- **FR-022**: The system MUST mount the AI Chat Widget (`ChatWidget`) in the graph view, positioning the minimized launcher above the category legend (`sm:bottom-16 bottom-5 right-5`) on desktop and `bottom-5 right-5` on mobile, while allowing the open chat panel to anchor at `bottom-5 right-5` (z-50) floating over background elements.
- **FR-023**: When an inline citation button `[N]` within an assistant message bubble is clicked, the system MUST auto-expand the message's `SourcesAccordion` if closed, smoothly scroll the chat message viewport (`#chat-message-viewport`) to center the matching source item `[N]` in view, and apply an animated pulsing highlight to that source item.
- **FR-024**: Repeated clicks on an inline citation button MUST re-focus and re-trigger the pulsing animation on the matching source item. If a citation number has no corresponding entry in the message's source list, the click event MUST be gracefully ignored without side effects.
- **FR-025**: Citation and source item interactions MUST remain self-contained within the chat assistant widget and MUST NOT mutate background graph selection, camera position, or Note Preview state.

### Key Entities *(include if feature involves data)*

- **WikiNode**: Represents a Markdown note. Contains id, title, path, folder, tags, aliases, excerpt, connection counts, and orphan status.
- **WikiEdge**: Represents a connection between two notes. Contains source id, target id, and link type (wikilink or standard markdown link).
- **SimNode**: Simulation entity extending note data with physics vectors ($x, y, v_x, v_y$), mass, degree centrality, dynamic radius, and category theme.
- **NeonNodeTheme**: Visual styling contract defining category, category label, pure accent hex, glowing aura, perimeter rim, text color, and label pill backdrop.
- **WikiGraph**: Represents the complete graph dataset generated at build time, containing all nodes and edges.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The frontend successfully fetches and renders a graph from the backend API for 1000 notes in under 2 seconds.
- **SC-002**: The frontend correctly falls back to a "Service Unavailable" state if the backend is unreachable.
- **SC-003**: Users can search for a note and see matching results in under 1 second.
- **SC-004**: Clicking a node updates the UI to show the preview panel and highlight neighbors within 500ms.
- **SC-005**: The Canvas force simulation maintains 60 FPS during standard pan, zoom, and reheat interactions.
- **SC-006**: Hovering or selecting any node highlights incident connections and neighbor rings in Neon Blue (`#1f51ff`) without visual artifacts or duplicate React key console warnings.
- **SC-007**: Clicking an inline citation button `[N]` scrolls the viewport and centers the target source item with its pulsing highlight active within 300ms.

## Assumptions

- Read-only experience: The frontend will only display data from the backend and will not modify the graph or expose administrative endpoints.
- The remote GitHub repository contains valid Markdown files in its `wiki/` folder with optional YAML frontmatter.
- The remote GitHub repository remains publicly accessible without authentication.
- Mobile experience will be optimized for viewing rather than deep exploration if screen real estate is limited.
