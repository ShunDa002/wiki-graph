# Phase 0: Research & Decisions

## 1. Unified Graph Rendering Engine (Canvas vs React Flow)
- **Decision**: HTML5 Canvas 2D Engine (`ForceGraphCanvas` / Canvas multi-layout pipeline).
- **Rationale**: Rendering all layouts (Force-Directed Organic, Hierarchical Top-Down, Hierarchical Left-Right, Grid Structure, Concentric Radial) within a single HTML5 Canvas engine ensures 100% visual parity: identical Deep Navy background (`#060b18`), ambient midnight glow, faint constellation lattice dots, circular nodes scaled by degree centrality (18-22px hubs vs 5.5-7px leaves), solid fluorescent colors, and Neon Blue (`#1f51ff`) link highlights. This avoids duplicating styling between Canvas and React Flow DOM components while guaranteeing 60 FPS performance across all layouts.
- **Alternatives Considered**: Re-theming React Flow custom SVG nodes and edges for static layouts (rejected due to inconsistent rendering, DOM overhead for 1,000+ notes, and fragmented camera/interaction models).

## 2. Geometric Coordinate Generation for Circular Nodes
- **Decision**: Refactor `lib/layout-engine.ts` to output deterministic $(x, y)$ coordinate mappings directly for circular Canvas nodes.
- **Rationale**: Dagre, Grid, and Concentric Radial layouts previously computed positions for fixed rectangular cards ($200 \times 70\text{px}$). Adapting the algorithms to use circular node dimensions ($r \approx 5.5 - 22\text{px}$) with appropriate node separation produces compact, aesthetically pleasing hierarchical and geometric diagrams.
- **Alternatives Considered**: Keeping layout positions tied to React Flow node dimensions (caused excessive blank space and mismatched alignment).

## 3. Positioning and Physics Behavior in Non-Force Layouts
- **Decision**: Constrained spring physics anchoring nodes to their computed layout positions (Dagre/Grid/Radial coordinates act as gravitational attractors) with collision avoidance and gentle organic jitter.
- **Rationale**: Rather than freezing nodes at fixed geometric positions, constrained anchor-spring physics creates a "living, breathing" graph effect across all layouts. Nodes settle near their geometric target (hierarchy ranks, grid rows, concentric rings) but exhibit subtle organic micro-movement, making the interface feel alive and responsive. The moderate anchor spring constant (~0.03-0.05) allows ~30-50px maximum drift, keeping the layout clearly recognizable while adding visual depth. A perpetual minimum alpha (~0.01-0.02) ensures the breathing effect never fully stops.
- **Alternatives Considered**:
  - Deterministic static placement with physics disabled (rejected — felt lifeless and static, no visual distinction from a static SVG diagram).
  - Full unconstrained force-directed physics (rejected — would destroy hierarchical/grid/radial structural patterns).
  - Hybrid warm-up: compute positions then run physics for 2-3 seconds before freezing (rejected — breathing stops abruptly, feels inconsistent).

## 4. Edge Routing Across Layouts
- **Decision**: Straight directed vectors with arrowheads in Neon Blue (`#1f51ff`) for all layouts.
- **Rationale**: Standardizing on straight directed lines with directional arrowheads maintains the ethereal constellation aesthetic across all modes, maximizes Canvas rendering speed, and eliminates complex bezier collision calculations.
- **Alternatives Considered**: Smooth cubic bezier routing for hierarchical layouts (added visual clutter and clashed with the minimalist neon neural theme).

## 5. Layout Transition Animation
- **Decision**: 500-600ms coordinate tweening (using smooth easing) from current position $(x_0, y_0)$ to target position $(x_1, y_1)$, followed by an automatic camera fit-view animation.
- **Rationale**: Smoothly interpolating coordinates when switching layouts preserves the user's mental map of connected concepts and provides a fluid, polished user experience.
- **Alternatives Considered**: Instant coordinate snapping (abrupt and disorienting).

## 6. Canvas Overlay Controls
- **Decision**: Show Play/Pause and Reheat simulation controls in all layout modes.
- **Rationale**: Since continuous constrained physics runs in every layout, Play/Pause allows users to freeze the organic breathing and Reheat triggers a full re-layout computation. This provides consistent control surfaces regardless of active layout. Zoom In, Zoom Out, Fit View, and Toggle Labels remain accessible across all modes.
- **Alternatives Considered**: Hiding physics controls in non-force layouts (rejected — now that physics runs everywhere, controls are relevant in all modes).

## 7. Reheat Behavior in Constrained Layouts
- **Decision**: Reheat re-computes layout coordinates first (re-running Dagre/Grid/Radial algorithms), then re-anchors all nodes to their new computed positions and resets alpha to 1.0 for a full re-cluster effect.
- **Rationale**: A simple alpha reset without recomputation would only re-scatter nodes around their existing anchors. Re-computing ensures the layout adapts to any data changes (new/removed nodes from filter changes) and provides a visually satisfying "settle into formation" animation.
- **Alternatives Considered**: Alpha-only reset (nodes would drift back to stale positions, not accounting for filter changes).

## 8. Node Drag Interaction in Constrained Layouts
- **Decision**: Elastic rubber band snap-back — while dragging, the node follows the cursor (fx/fy pinned); on release, the node snaps back toward its layout-computed position via the anchor spring.
- **Rationale**: The elastic snap-back creates a playful, discoverable interaction that reinforces the constrained physics model. Users can explore node positions interactively while the layout's structural integrity self-restores.
- **Alternatives Considered**:
  - Permanent relocation (rejected — undermines layout structure, confusing when mixed with automatic re-layout on reheat).
  - Disabled dragging (rejected — removes interactivity that users expect from the Organic layout).

## 9. Perpetual Minimum Alpha for Organic Breathing
- **Decision**: Maintain a perpetual minimum alpha (~0.01-0.02) so the constrained physics never fully cools to zero.
- **Rationale**: A continuously breathing graph feels alive and premium. The subtle micro-movement differentiates the interactive Canvas visualization from static diagrams, encouraging exploration. The very low alpha floor ensures minimal computational overhead while keeping the animation loop running.
- **Alternatives Considered**: Alpha cooling to zero with periodic auto-reheat pulses (rejected — rhythmic pulsing felt mechanical rather than organic).
