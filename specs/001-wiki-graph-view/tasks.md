# Implementation Tasks: LLM Wiki Graph View

**Feature**: LLM Wiki Graph View
**Spec**: [spec.md](spec.md)
**Plan**: [plan.md](plan.md)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [X] T001 [P] Install core graph dependencies: `reactflow`, `@tanstack/react-query`, `zustand`, `zod`, `dagre` in `package.json`
- [X] T002 [P] Install UI dependencies: `lucide-react`, `clsx`, `tailwind-merge` in `package.json`
- [X] T003 Update environment types and configuration for `NEXT_PUBLIC_BACKEND_URL` and `REBUILD_SECRET_KEY`

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

- [X] T022 [P] Create `app/api/rebuild/route.ts` to proxy POST requests to the FastAPI `/graph/rebuild` endpoint using `X-Graph-API-Key` derived from the `REBUILD_SECRET_KEY` environment variable.

---

## Phase 7: User Story 4 - Unified Neon Graph Theme & Multi-Layout Canvas Visualization (Priority: P1)

**Goal**: Deliver an interactive HTML5 Canvas visualization rendering all layouts (Force-Directed Organic, Hierarchical Top-Down, Hierarchical Left-Right, Grid Structure, Concentric Radial) using the luminescent Neon theme, degree centrality hierarchy, uniform straight Neon Blue edge vectors, smooth layout transition tweening, and unified overlay controls with continuous constrained physics across all layouts.

**Independent Test**: Switch through all 5 layout modes in the toolbar; verify all layouts render circular neon nodes on the Deep Navy canvas with straight Neon Blue links, smooth 500-600ms coordinate tweening, constrained organic breathing in non-force layouts (~30-50px max drift, perpetual min alpha), elastic drag snap-back, and simulation controls visible in all modes per `quickstart.md`.

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

### Sub-phase 7.3: Continuous Constrained Physics for All Layouts

- [X] T042 [P] [US4] Add `anchorX` and `anchorY` fields to the `SimNode` interface in `lib/force-simulation.ts` (type: `number | null`, default: `null`). These fields store the layout-computed anchor position for constrained spring physics in non-force modes.
- [X] T043 [P] [US4] Implement `stepConstrainedPhysics()` function in `lib/force-simulation.ts` that applies anchor-spring forces (spring constant ~0.03-0.05 per FR-015), collision avoidance, and centering — pulling each node toward its `anchorX`/`anchorY` while allowing max drift ~30-50px. Must accept the same `PhysicsParams` interface extended with `anchorSpring: number` (default ~0.04).
- [X] T044 [US4] Update the physics render loop in `components/graph/ForceGraphCanvas.tsx` to call `stepConstrainedPhysics()` instead of skipping physics entirely when `layoutAlgorithm !== 'force'`. Pass `simNodesRef.current` (which have `anchorX`/`anchorY` set) and current alpha. Remove the `isForceLayout` guard that currently prevents physics from running in non-force modes (around line 424-437).
- [X] T045 [US4] Implement perpetual minimum alpha floor in the render loop of `components/graph/ForceGraphCanvas.tsx`: when `layoutAlgorithm !== 'force'`, clamp `alphaRef.current` to never drop below ~0.015 (FR-022). In force mode, alpha continues to cool to zero as before.
- [X] T046 [US4] Update the layout transition effect in `components/graph/ForceGraphCanvas.tsx` (the `useEffect` at ~line 167) to set `anchorX`/`anchorY` on each `SimNode` when switching to a non-force layout. When switching to `'force'`, set `anchorX = null` and `anchorY = null` to disable anchor springs.
- [X] T047 [US4] Update the data initialization effect in `components/graph/ForceGraphCanvas.tsx` (the `useEffect` at ~line 109) to set `anchorX`/`anchorY` from `computeCanvasLayout()` results when `layoutAlgorithm !== 'force'`, so nodes have valid anchors on initial load.
- [X] T048 [US4] Implement elastic rubber band drag behavior in `components/graph/ForceGraphCanvas.tsx`: on `mouseup`/`pointerup`, when `layoutAlgorithm !== 'force'`, clear `fx`/`fy` (unpin the node) so the anchor spring pulls it back to its `anchorX`/`anchorY` position (FR-023). In `'force'` mode, preserve existing behavior where released nodes stay at their dropped position.
- [X] T049 [US4] Update the Reheat handler (`handleReheat`) in `components/graph/ForceGraphCanvas.tsx` to, when `layoutAlgorithm !== 'force'`: re-compute layout coordinates via `computeCanvasLayout()`, update `anchorX`/`anchorY` on all `SimNode`s to the new positions, and reset `alphaRef.current = 1.0` (FR-024). In `'force'` mode, preserve existing reheat behavior (alpha reset only).
- [X] T050 [US4] Update the canvas overlay controls in `components/graph/ForceGraphCanvas.tsx` to show Play/Pause and Reheat buttons in ALL layout modes (FR-021). Remove the `{layoutAlgorithm === 'force' && (...)}` conditional guard around the simulation control buttons (around line 940-963).
- [X] T051 [P] [US4] Add unit tests for `stepConstrainedPhysics()` in `tests/force-simulation.test.ts`: verify anchor-spring pull strength (~0.03-0.05), max drift constraint (~30-50px from anchor), collision avoidance between constrained nodes, and that nodes with `anchorX = null` are unaffected.
- [X] T052 [P] [US4] Update integration tests in `tests/canvas-multilayout.test.tsx` to verify: (a) simulation controls are visible in all layouts, (b) alpha floor is maintained in constrained layouts, (c) nodes have valid `anchorX`/`anchorY` after layout switch.
- [X] T053 [US4] Run end-to-end validation scenarios per updated `specs/001-wiki-graph-view/quickstart.md` across all 5 layouts, specifically verifying: constrained organic breathing (#2), unified overlay controls (#4), elastic drag snap-back (#5).

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
- **User Story 4 Sub-phase 7.1 (Force-Directed & Neon Theme)**: Completed
- **User Story 4 Sub-phase 7.2 (Multi-Layout Unification)**: Completed
- **User Story 4 Sub-phase 7.3 (Constrained Physics)**: Ready to execute
- **Polish (Final Phase)**: Completed

### Sub-phase 7.3 Dependencies

```
T042 (SimNode anchorX/anchorY) ──┐
                                 ├──► T044 (Render loop constrained physics)
T043 (stepConstrainedPhysics) ───┘         │
                                           ▼
                                    T045 (Perpetual min alpha floor)
                                           │
                                           ▼
                               ┌── T046 (Layout transition anchor setting)
                               │── T047 (Data init anchor setting)
                               │── T048 (Elastic drag snap-back)
                               │── T049 (Reheat recomputation)
                               └── T050 (Show controls in all layouts)
                                           │
                                           ▼
                               ┌── T051 (Unit tests) [P]
                               └── T052 (Integration tests) [P]
                                           │
                                           ▼
                                    T053 (E2E validation)
```

- **T042** and **T043** can proceed in parallel (different concerns: data model vs physics function).
- **T044** depends on both T042 and T043 (needs anchor fields and constrained physics function).
- **T045** depends on T044 (modifies alpha cooling in the same render loop).
- **T046**, **T047**, **T048**, **T049**, **T050** can proceed in parallel after T045 (each touches a distinct code section within `ForceGraphCanvas.tsx`).
- **T051** and **T052** can proceed in parallel after T046-T050.
- **T053** (E2E validation) depends on all implementation tasks being complete.

### Parallel Opportunities

- `T042` (data model) and `T043` (physics function) can be authored together in `lib/force-simulation.ts`.
- `T046` through `T050` touch distinct code sections within `ForceGraphCanvas.tsx` and can be authored as a single commit.
- `T051` and `T052` can run in parallel (different test files).

---

## Implementation Strategy

1. **Step 1: Physics Engine Extension**: Add `anchorX`/`anchorY` to `SimNode` and implement `stepConstrainedPhysics()` in `lib/force-simulation.ts` with anchor-spring (constant ~0.04), collision avoidance, and centering.
2. **Step 2: Render Loop Integration**: Replace the physics-skip guard in `ForceGraphCanvas.tsx` with a call to `stepConstrainedPhysics()` for non-force layouts. Add perpetual minimum alpha floor (~0.015).
3. **Step 3: Anchor Lifecycle Management**: Set `anchorX`/`anchorY` on layout transitions and data initialization; clear them when switching to force mode.
4. **Step 4: Interaction Updates**: Implement elastic drag snap-back (clear fx/fy on release in constrained modes), reheat recomputation (re-run layout algorithm + re-anchor), and show simulation controls in all layouts.
5. **Step 5: Testing & Validation**: Run unit tests for constrained physics, integration tests for control visibility and alpha floor, and E2E validation per `quickstart.md`.
