# Implementation Tasks: LLM Wiki Graph View

**Feature**: LLM Wiki Graph View
**Spec**: [spec.md](spec.md)
**Plan**: [plan.md](plan.md)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [X] T001 [P] Install core graph dependencies: `reactflow`, `@tanstack/react-query`, `zustand`, `zod`, `dagre` in `package.json`
- [X] T002 [P] Install UI dependencies: `lucide-react`, `clsx`, `tailwind-merge` in `package.json`
- [X] T003 Update environment types and configuration for `NEXT_PUBLIC_BACKEND_URL` and `GRAPH_REBUILD_SECRET_KEY`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Setup Zod schema validation in `lib/api.ts` representing `GraphNode`, `GraphEdge`, and `GraphResponse` (matching data-model.md constraints: e.g., canonical URL-encoded ID for id).
- [X] T005 Implement TanStack Query fetchers (`getGraph`, `getMetadata`) in `lib/api.ts` connecting to FastAPI.
- [X] T006 [P] Initialize global client state in `store/useGraphStore.ts` for selected node and active filters using Zustand.
- [X] T007 [P] Create base layout and structure for `app/graph/page.tsx` and integrate the React Query `<QueryClientProvider>`.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Explore Note Graph (Priority: P1) 🎯 MVP

**Goal**: Render an interactive visualization of all Markdown notes as nodes connected by links.

**Independent Test**: Load data from the FastAPI backend and verify that nodes and edges correctly represent the Markdown files and wikilinks.

### Implementation for User Story 1

- [X] T008 [P] [US1] Implement `lib/graph-transforms.ts` to transform FastAPI `GraphResponse` into React Flow nodes and edges.
- [X] T009 [P] [US1] Implement layout calculation logic in `lib/layout-engine.ts` using Dagre (or ELK.js).
- [X] T010 [US1] Implement `components/graph/GraphCanvas.tsx` to render the React Flow component with custom node styles based on `metadata.type` and `metadata.isOrphan`.
- [X] T011 [US1] Implement `components/graph/ErrorPanel.tsx` to display "Service Unavailable" error state with a manual retry button (FR-012) and unsupported `schemaVersion` blocker (FR-013).
- [X] T012 [US1] Update `app/graph/page.tsx` to integrate `getGraph` fetcher with `GraphCanvas.tsx` and handle loading/error states.
- [X] T013 [US1] Implement unresolved link diagnostics in `components/graph/GraphCanvas.tsx` visually associating them with source nodes.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Search and Filter Notes (Priority: P2)

**Goal**: Search notes by title/alias and filter the graph by folder or tag.

**Independent Test**: Provide a search term or select a folder filter and verify the graph updates to show only matching nodes.

### Implementation for User Story 2

- [X] T014 [P] [US2] Implement search and filter state actions in `store/useGraphStore.ts`.
- [X] T015 [P] [US2] Implement filtering logic in `lib/graph-transforms.ts` to derive the visible node and edge set based on active filters and search term.
- [X] T016 [US2] Create `components/graph/SearchBox.tsx` to allow searching titles, paths, and tags.
- [X] T017 [US2] Create `components/graph/FilterPanel.tsx` for folder and tag selection.
- [X] T018 [US2] Update `app/graph/page.tsx` to integrate `SearchBox` and `FilterPanel` alongside the graph canvas.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - View Note Details (Priority: P3)

**Goal**: Read a preview of a selected note including its excerpt, tags, and connections.

**Independent Test**: Click a node and verify the preview panel displays the correct title, tags, excerpt, and link counts.

### Implementation for User Story 3

- [X] T019 [P] [US3] Create `components/graph/NodePreview.tsx` to display node metadata, excerpt, incomingCount, and outgoingCount.
- [X] T020 [US3] Update `components/graph/GraphCanvas.tsx` to capture node click events and update the selected node in Zustand.
- [X] T021 [US3] Update `app/graph/page.tsx` to render `NodePreview.tsx` as a side panel or bottom sheet (on mobile) when a node is selected.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Secure Graph Rebuild (Administrative Proxy)

**Goal**: Provide a secure Next.js API proxy to trigger graph rebuilds on the backend, hidden from the frontend UI.

**Independent Test**: Run a POST request to the Next.js API route with the secret key and verify it reaches the FastAPI backend.

### Implementation for Secure Graph Rebuild

- [X] T022 [P] Create `app/api/rebuild/route.ts` to proxy POST requests to the FastAPI `/graph/rebuild` endpoint using `X-Graph-API-Key` derived from the `GRAPH_REBUILD_SECRET_KEY` environment variable.

---

## Phase 7: User Story 4 - Unified Neon Graph Theme & Multi-Layout Canvas Visualization (Priority: P1)

**Goal**: Deliver an interactive HTML5 Canvas visualization rendering all layouts (Force-Directed Organic, Hierarchical Top-Down, Hierarchical Left-Right, Grid Structure, Concentric Radial) using the luminescent Neon theme, degree centrality hierarchy, uniform straight Neon Blue edge vectors, smooth layout transition tweening, and contextual overlay controls.

**Independent Test**: Switch through all 5 layout modes in the toolbar; verify all layouts render circular neon nodes on the Deep Navy canvas with straight Neon Blue links, smooth 500-600ms coordinate tweening, zero physics drift in static layouts, and contextual visibility of simulation controls per `quickstart.md`.

### Sub-phase 7.1: Force-Directed Physics & Baseline Neon Theme (Completed)

- [X] T026 [P] [US4] Implement force-directed physics engine and degree centrality in `lib/force-simulation.ts`.
- [X] T027 [P] [US4] Implement 60fps HTML5 Canvas component `components/graph/ForceGraphCanvas.tsx` with pan/zoom/drag physics.
- [X] T028 [US4] Implement "Neon" graph theme: Deep Navy backdrop (`#060b18`), radial ambient substrate, and celestial lattice in `components/graph/ForceGraphCanvas.tsx`.
- [X] T029 [US4] Render pure flat solid color nodes without radial gradients (`theme.accentHex`) across categorical neon hues in `components/graph/ForceGraphCanvas.tsx`.
- [X] T030 [US4] Implement Neon Blue (`#1f51ff`) interaction effects: active connecting edges, arrowheads, selection halos, hover rings, and neighbor highlights in `components/graph/ForceGraphCanvas.tsx`.
- [X] T031 [US4] Remove extraneous cyan halos around nodes (`theme.category === 'cyan'`) to maintain clean node boundaries in `components/graph/ForceGraphCanvas.tsx`.
- [X] T032 [US4] Deduplicate incoming and outgoing neighbor collections in `app/graph/page.tsx` and `components/graph/NodePreview.tsx` to prevent duplicate React keys.
- [X] T033 [US4] Implement unit tests in `tests/force-simulation.test.ts` covering degree centrality, physics steps, level-of-detail labels, and Neon theme categorization.

### Sub-phase 7.2: Multi-Layout Canvas Unification & Transition Tweening (Completed)

- [X] T034 [P] [US4] Implement circular node coordinate calculators for Dagre (Top-Down, Left-Right), Grid, and Concentric Radial layouts in `lib/layout-engine.ts`.
- [X] T035 [P] [US4] Implement unit tests for Canvas layout coordinate calculations in `tests/layout-engine.test.ts`.
- [X] T036 [US4] Integrate layout coordinate computation and 500-600ms coordinate tweening transition into `components/graph/ForceGraphCanvas.tsx`.
- [X] T037 [US4] Implement conditional physics simulation suspension for static layouts (`dagre-tb`, `dagre-lr`, `grid`, `radial`) in `components/graph/ForceGraphCanvas.tsx`.
- [X] T038 [US4] Update canvas overlay controls to conditionally display simulation buttons (Play/Pause, Reheat) only in Organic mode in `components/graph/ForceGraphCanvas.tsx`.
- [X] T039 [US4] Unify all layouts in `components/graph/GraphCanvas.tsx` to render via the Canvas engine instead of falling back to React Flow DOM nodes.
- [X] T040 [US4] Implement integration/component tests for multi-layout Canvas switching and contextual controls in `tests/canvas-multilayout.test.tsx`.
- [X] T041 [US4] Run end-to-end multi-layout validation scenarios per `specs/001-wiki-graph-view/quickstart.md` across all 5 layouts.

### Sub-phase 7.3: Uniform HUD Controls Across Layouts & Static Re-alignment (Completed)

- [X] T042 [US4] Update HUD controls in `components/graph/ForceGraphCanvas.tsx` to display Pause/Resume and Refresh Graph buttons across all layouts; in static layouts, disable simulation controls with an explanatory tooltip ("Physics engine is inactive in static layouts").
- [X] T043 [US4] Implement static layout re-alignment in `components/graph/ForceGraphCanvas.tsx` so clicking Refresh Graph in static layouts re-computes coordinates and smoothly tweens nodes back to structured positions.
- [X] T044 [P] [US4] Update component and integration tests in `tests/canvas-multilayout.test.tsx` to verify uniform HUD control rendering, disabled simulation control tooltip in static layouts, and Refresh Graph re-alignment.
- [X] T045 [US4] Validate uniform HUD controls and static layout re-alignment against `specs/001-wiki-graph-view/quickstart.md` across all 5 layouts.

---

## Phase 8: User Story 5 - AI Chat Widget Integration (Priority: P2)

**Goal**: Mount the floating AI Chat Widget in the graph view, positioning the minimized launcher above the category legend (`sm:bottom-16 bottom-5 right-5`) on desktop and `bottom-5 right-5` on mobile, while allowing the open chat panel to anchor at `bottom-5 right-5` (z-50) floating over background elements. Within the assistant message bubbles, clicking inline citation buttons `[N]` auto-expands the `SourcesAccordion`, smoothly scrolls the chat message viewport (`#chat-message-viewport`) to center the referenced `#source-item-${N}` in view, and triggers an animated pulsing highlight on that source card.

**Independent Test**: Load the graph view on desktop; verify the launcher button floats at `bottom-16 right-5` directly above the category legend without collision, clicking it opens the chat panel anchored at `bottom-5 right-5`, and minimizing returns it to `bottom-16 right-5` per Scenario 6 in `quickstart.md`. In an assistant message bubble with sources, verify clicking inline citation `[N]` auto-expands the accordion, smooth-scrolls `#chat-message-viewport` to center `#source-item-${N}`, and applies pulsing highlight per Scenario 7 in `quickstart.md`.

### Sub-phase 8.1: AI Chat Widget Launcher Placement & Mounting (Completed)

- [X] T046 [P] [US5] Update ChatWidget outer positioning container to use `sm:bottom-16 bottom-5 right-5` for the minimized launcher in `components/chat/ChatWidget.tsx`
- [X] T047 [P] [US5] Mount `<ChatWidget />` component inside main graph page container in `app/graph/page.tsx`
- [X] T048 [P] [US5] Implement component and integration tests verifying launcher desktop and mobile positioning classes, panel open/minimize transitions, and legend clearance in `tests/chat-widget.test.tsx`
- [X] T049 [US5] Validate AI Chat Widget integration and positioning against `specs/001-wiki-graph-view/quickstart.md` Scenario 6

### Sub-phase 8.2: Inline Citation Click, Viewport Scroll & Pulse Highlighting (Completed)

- [X] T050 [P] [US5] Add `pulseTrigger?: number` prop, animated pulsing highlight classes (`ring-2 ring-indigo-400 border-l-2 border-indigo-400 bg-indigo-950/80 animate-pulse`), and smooth scroll-into-view centering on `#source-item-${citation}` in `components/chat/SourcesAccordion.tsx`
- [X] T051 [P] [US5] Wire inline citation click handlers in `components/chat/MessageBubble.tsx` to validate citation existence against `message.sources`, auto-expand `SourcesAccordion`, increment `pulseTrigger`, set `activeCitation`, and gracefully ignore clicks on missing citations
- [X] T052 [P] [US5] Implement unit and integration tests for citation button clicks, auto-expansion, scrollIntoView centering, pulse animation classes, repeated clicks, and missing citation handling in `tests/chat-citations.test.tsx`
- [X] T053 [US5] Validate AI Chat citation click, smooth viewport scroll, and pulsing highlight against `specs/001-wiki-graph-view/quickstart.md` Scenario 7

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T023 [P] Implement metadata freshness check (`GET /graph/metadata`) in `app/graph/page.tsx` on initial load (FR-011).
- [X] T024 Write or update tests in `tests/` using Vitest and React Testing Library for the new graph components.
- [X] T025 Run `quickstart.md` validation to ensure end-to-end functionality.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Completed
- **Foundational (Phase 2)**: Completed
- **User Stories (Phase 3–6)**: Completed
- **User Story 4 Multi-Layout Canvas (Phase 7.1–7.3)**: Completed
- **User Story 5 AI Chat Widget Integration (Phase 8)**: Sub-phase 8.1 Completed; Sub-phase 8.2 Ready to execute
- **Polish (Final Phase)**: Completed

### User Story 5 Dependencies

- **Sub-phase 8.1 (Launcher Placement & Mounting)**: Completed (T046–T049).
- **T050 (SourcesAccordion Pulse & Scroll)** implements `pulseTrigger`, pulsing styles, and `scrollIntoView({ behavior: 'smooth', block: 'center' })` in `components/chat/SourcesAccordion.tsx`.
- **T051 (MessageBubble Citation Click Event)** wires citation button clicks, existence check, pulse triggering, and `data-citation` attributes in `components/chat/MessageBubble.tsx`.
- **T052 (Citation Navigation Tests)** creates test suite covering click handling, auto-expansion, `scrollIntoView` calls, pulsing classes, and repeated click stability in `tests/chat-citations.test.tsx`.
- **T053 (Scenario 7 E2E Validation)** validates end-to-end citation navigation and highlight behavior against `quickstart.md` Scenario 7.

### Parallel Opportunities

- `T050` (`components/chat/SourcesAccordion.tsx`), `T051` (`components/chat/MessageBubble.tsx`), and `T052` (`tests/chat-citations.test.tsx`) touch distinct files and can proceed in parallel.
- `T053` runs once implementation and tests are complete.

---

## Parallel Example: User Story 5 Sub-phase 8.2

```bash
# Launch implementation and test tasks for User Story 5 Sub-phase 8.2 together:
Task: "Add pulseTrigger prop, animated pulsing highlight classes, and smooth scroll-into-view centering on #source-item-${citation} in components/chat/SourcesAccordion.tsx"
Task: "Wire inline citation click handlers to validate citation existence, auto-expand SourcesAccordion, increment pulseTrigger, and set activeCitation in components/chat/MessageBubble.tsx"
Task: "Implement unit and integration tests for citation button clicks, auto-expansion, scrollIntoView centering, pulse animation, and repeated clicks in tests/chat-citations.test.tsx"
```

---

## Implementation Strategy

1. **Step 1: ChatWidget Positioning Adjustments (T046)**: Update `components/chat/ChatWidget.tsx` so `isMinimized` applies `sm:bottom-16 bottom-5 right-5 pointer-events-auto`, clearing the desktop category legend while remaining at `bottom-5 right-5` on mobile screens where the legend is hidden.
2. **Step 2: Mount ChatWidget in Graph View (T047)**: Import `<ChatWidget />` in `app/graph/page.tsx` and mount it inside the graph view layout overlay.
3. **Step 3: Component and Integration Testing (T048)**: Add unit/integration tests in `tests/chat-widget.test.tsx` verifying launcher rendering, desktop/mobile responsive positioning classes, open/minimize state transitions, and z-index ordering above NotePreview.
4. **Step 4: End-to-End Validation (T049)**: Validate all criteria in Scenario 6 of `quickstart.md` across desktop and mobile viewport widths.
5. **Step 5: SourcesAccordion Pulse & Scroll (T050)**: Update `components/chat/SourcesAccordion.tsx` to accept `pulseTrigger`, auto-expand on active citation, smooth-scroll `#source-item-${citation}` into view centered, and apply the pulsing neon/indigo ring animation.
6. **Step 6: MessageBubble Citation Clicks (T051)**: Update `components/chat/MessageBubble.tsx` to handle inline citation clicks, verify the citation exists in `message.sources`, pass `pulseTrigger` to `SourcesAccordion`, and safely ignore clicks on missing citations.
7. **Step 7: Component & Integration Testing (T052)**: Create `tests/chat-citations.test.tsx` verifying click events, auto-expansion, spy on `Element.prototype.scrollIntoView`, pulsing highlight classes, repeated click re-triggering, and graceful error avoidance on missing citation numbers.
8. **Step 8: End-to-End Validation (T053)**: Validate all criteria in Scenario 7 of `quickstart.md`.

