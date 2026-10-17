# Phase 0: Research & Decisions

## 1. Unified Graph Rendering Engine (Canvas vs React Flow)
- **Decision**: HTML5 Canvas 2D Engine (`ForceGraphCanvas` / Canvas multi-layout pipeline).
- **Rationale**: Rendering all layouts (Force-Directed Organic, Hierarchical Top-Down, Hierarchical Left-Right, Grid Structure, Concentric Radial) within a single HTML5 Canvas engine ensures 100% visual parity: identical Deep Navy background (`#060b18`), ambient midnight glow, faint constellation lattice dots, circular nodes scaled by degree centrality (18-22px hubs vs 5.5-7px leaves), solid fluorescent colors, and Neon Blue (`#1f51ff`) link highlights. This avoids duplicating styling between Canvas and React Flow DOM components while guaranteeing 60 FPS performance across all layouts.
- **Alternatives Considered**: Re-theming React Flow custom SVG nodes and edges for static layouts (rejected due to inconsistent rendering, DOM overhead for 1,000+ notes, and fragmented camera/interaction models).

## 2. Geometric Coordinate Generation for Circular Nodes
- **Decision**: Refactor `lib/layout-engine.ts` to output deterministic $(x, y)$ coordinate mappings directly for circular Canvas nodes.
- **Rationale**: Dagre, Grid, and Concentric Radial layouts previously computed positions for fixed rectangular cards ($200 \times 70\text{px}$). Adapting the algorithms to use circular node dimensions ($r \approx 5.5 - 22\text{px}$) with appropriate node separation produces compact, aesthetically pleasing hierarchical and geometric diagrams.
- **Alternatives Considered**: Keeping layout positions tied to React Flow node dimensions (caused excessive blank space and mismatched alignment).

## 3. Positioning and Physics Behavior in Static Layouts
- **Decision**: Deterministic static geometric placement with physics simulation disabled for Hierarchical, Grid, and Radial modes.
- **Rationale**: Hierarchical and geometric layouts rely on strict spatial organization (ranks, rows, concentric rings). Running physics forces in these modes would pull nodes out of their designated slots. Users retain full camera pan and zoom, node hover, and selection capabilities.
- **Alternatives Considered**: Relaxed spring simulation on top of Dagre ranks (distorted hierarchical tree levels).

## 4. Edge Routing Across Layouts
- **Decision**: Straight directed vectors with arrowheads in Neon Blue (`#1f51ff`) for all layouts.
- **Rationale**: Standardizing on straight directed lines with directional arrowheads maintains the ethereal constellation aesthetic across all modes, maximizes Canvas rendering speed, and eliminates complex bezier collision calculations.
- **Alternatives Considered**: Smooth cubic bezier routing for hierarchical layouts (added visual clutter and clashed with the minimalist neon neural theme).

## 5. Layout Transition Animation
- **Decision**: 500-600ms coordinate tweening (using smooth easing) from current position $(x_0, y_0)$ to target position $(x_1, y_1)$, followed by an automatic camera fit-view animation.
- **Rationale**: Smoothly interpolating coordinates when switching layouts preserves the user's mental map of connected concepts and provides a fluid, polished user experience.
- **Alternatives Considered**: Instant coordinate snapping (abrupt and disorienting).

## 6. Uniform Canvas Overlay Controls Across Layouts
- **Decision**: Render simulation and layout controls (Play/Pause, Re-cluster) uniformly across all layout modes. In static layouts (Hierarchical, Grid, Radial), "Re-cluster" re-computes and smoothly animates nodes back to structured layout coordinates, while "Play/Pause" is rendered in a disabled state with an explanatory tooltip ("Physics simulation is inactive in static layouts").
- **Rationale**: Provides consistent visual UI across all graph views so the control HUD doesn't jarringly shift or hide buttons when changing layouts, while preserving strict static geometry without physics drift.
- **Alternatives Considered**: Conditionally hiding buttons (created an inconsistent toolbar footprint across layouts and removed the ability for users to reset or re-align static layouts).

## 7. AI Chat Widget Placement Above Category Legend
- **Decision**: Mount `ChatWidget` in `app/graph/page.tsx`, configuring the minimized launcher to float at `sm:bottom-16 bottom-5 right-5` on desktop and `bottom-5 right-5` on mobile. When opened into standard or expanded view, anchor the panel at `bottom-5 right-5` (z-50) floating over the category legend and Note Preview.
- **Rationale**: The category legend is anchored at `bottom-5 right-5` (approx 36px tall). Placing the minimized circular launcher directly above it at `sm:bottom-16` eliminates UI overlap while keeping both controls easily discoverable. Stacking the open chat panel over the legend at `bottom-5` maximizes vertical reading area for conversation history without cramping mobile or small-screen viewports.
- **Alternatives Considered**: Keeping both launcher and open panel permanently at `bottom-16` (sacrificed 44px of vertical height for the chat panel, making message reading cramped on smaller laptop screens).

## 8. AI Chat Inline Citation Click, Viewport Scrolling & Source Highlighting
- **Decision**: Wire click events on inline citation buttons `[N]` within assistant message bubbles to:
  1. Auto-expand the message's `SourcesAccordion` if closed (`isOpen = true`).
  2. Smoothly scroll the chat message viewport (`#chat-message-viewport`) to center the targeted `#source-item-${N}` element in view (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).
  3. Apply an animated pulsing neon/indigo border and glow ring (`ring-2 ring-indigo-400 border-indigo-400 bg-indigo-950/80 animate-pulse`) to the specific source card.
  4. Allow repeated clicks to re-focus and re-trigger the pulse animation via a reactive pulse trigger key, while gracefully ignoring citation numbers not present in the message's `sources` list.
  5. Confine all citation interactions strictly to the chat widget without mutating background graph state or Note Preview.
- **Rationale**:
  - In lengthy assistant responses, the sources accordion is scrolled far above the visible viewport. Centering the exact referenced source item guarantees that the user immediately spots the cited file without losing orientation.
  - Auto-expanding on click removes manual accordion toggling friction.
  - Using `block: 'center'` ensures the source card sits comfortably in the middle of `#chat-message-viewport` with surrounding context visible.
  - The pulsing glow provides instant visual feedback, resolving which source corresponds to the clicked citation number.
- **Alternatives Considered**:
  - *Scrolling only to the accordion toggle header*: Ambiguous when responses have multiple sources; user would still have to manually locate which item was `[N]`.
  - *Instant jumping without smooth scroll*: Jarring and disorienting for the user.
  - *Selecting the note in the background graph view on citation click*: Clashes with the user's intent to view the source in the chat and would disrupt their graph exploration position.
