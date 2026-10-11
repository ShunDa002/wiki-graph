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

## 6. Contextual Canvas Overlay Controls
- **Decision**: Conditionally hide physics simulation controls (Play/Pause, Reheat) in the top-right overlay when any static layout is selected.
- **Rationale**: Prevents confusion since physics simulation does not apply to deterministic hierarchical, grid, or radial layouts. Controls for Zoom In, Zoom Out, Fit View, and Toggle Labels remain accessible across all modes.
- **Alternatives Considered**: Showing disabled/greyed-out buttons with tooltips (adds visual noise).
