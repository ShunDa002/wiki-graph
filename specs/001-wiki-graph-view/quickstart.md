# Quickstart & Validation Guide

## Setup
1. Define local environment variables:
   - `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`
   - `GRAPH_REBUILD_SECRET_KEY=local_dev_secret`
2. Start the FastAPI backend on port 8000 (or use development proxy).
3. Install dependencies: `npm install`
4. Start Next.js dev server: `npm run dev`

## Validation Scenarios

### 1. Initial Load & Force-Directed (Organic) Baseline
- Navigate to `http://localhost:3000/graph`.
- Verify the graph visualization renders on the Deep Navy backdrop (`#060b18`) with ambient midnight-blue glow and neural constellation lattice dots.
- Verify nodes render as solid flat circular discs sized dynamically by degree centrality (hubs 18–22px in Electric Cyan, concepts in Magenta, sources in Yellow, leaf notes in Pale Blue, orphans with dashed orange perimeter).
- Verify edges are straight directed vectors with arrowheads in Neon Blue (`#1f51ff`).
- Verify simulation settles organically at 60 FPS.

### 2. Multi-Layout Switching & Neon Theme Parity
- In the top toolbar, switch the layout dropdown to:
  - **Hierarchical (Top-Down)** (`dagre-tb`)
  - **Hierarchical (Left-Right)** (`dagre-lr`)
  - **Grid Structure** (`grid`)
  - **Concentric Radial** (`radial`)
- **Visual Parity**: Verify that in all layouts, nodes remain circular discs with identical degree-centrality scaling and pure neon colors, edges remain Neon Blue straight vectors with arrows, and the background remains Deep Navy.
- **Static Positioning**: Verify that in Hierarchical, Grid, and Radial modes, nodes stay locked to their geometric layout positions with zero physics drifting.
- **Pan & Zoom**: Verify camera pan, zoom, and fit-view work identically across all layouts.

### 3. Smooth Layout Transition Tweening
- Switch between any two layouts (e.g. from Force-Directed to Hierarchical Top-Down, or Grid to Concentric Radial).
- Verify nodes smoothly tween/interpolate from their origin coordinates to target coordinates over 500–600ms without visual snapping.
- Verify the camera viewport automatically fits to encompass the new layout bounds.

### 4. Uniform Canvas Overlay Controls
- While in **Force-Directed (Organic)** layout:
  - Verify bottom-left HUD controls display active Pause/Resume (toggles physics simulation), Refresh Graph (re-heats simulation with alpha=1.0), Fit View, Zoom In/Out, and Toggle Labels.
- While in **Hierarchical, Grid, or Radial** layouts:
  - Verify the Pause/Resume and Refresh Graph buttons remain visible in the HUD for visual consistency.
  - Verify Pause/Resume is rendered disabled with a tooltip indicating physics engine is inactive in static layouts.
  - Verify clicking Refresh Graph re-computes static layout coordinates and smoothly animates nodes back into their structured positions.

### 5. Interactive Selection, Neighbor Glow, and Node Preview
- Hover over any node in any layout: verify the node illuminates with a Neon Blue hover ring, connected edges illuminate in Neon Blue, and the hover tooltip card appears.
- Click any node: verify the selected node displays a pulsing Neon Blue ring, direct neighbors display neon cyan rings, incident edges glow intensely, and the node preview side panel opens.
- Click the canvas backdrop: verify selection and neighbor highlights are cleared and the preview panel closes.

### 6. AI Chat Widget Floating Above Category Legend
- Navigate to `http://localhost:3000/graph`.
- On desktop screens (`>=640px`):
  - Verify the circular chat launcher button floats at `bottom-16 right-5` directly above the category legend (`bottom-5 right-5`) without overlapping.
  - Verify clicking the chat launcher smoothly opens the chat panel into standard view, anchoring at `bottom-5 right-5` (z-50) floating over the category legend.
  - Click minimize: verify the panel smoothly collapses back to the launcher positioned at `bottom-16 right-5`.
- On mobile screens (`<640px`):
  - Verify the category legend is hidden and the chat launcher sits cleanly at `bottom-5 right-5`.
  - Verify clicking the launcher opens the chat panel cleanly on mobile.

### 7. AI Chat Inline Citation Click, Viewport Scroll & Pulse Highlighting
- Navigate to `http://localhost:3000/graph` and open the AI chat widget.
- Submit a query that produces an assistant response with sources and bracketed citations (e.g. `[1]`, `[2]`).
- Verify that before clicking citations, the `SourcesAccordion` toggle indicates the number of sources and can be collapsed/expanded.
- Ensure the chat message history is scrolled down into the assistant response text.
- Click an inline citation button `[1]` in the message bubble:
  - Verify the Sources Accordion automatically expands if it was collapsed.
  - Verify `#chat-message-viewport` smoothly scrolls up to center `#source-item-1` directly in view.
  - Verify `#source-item-1` illuminates with an animated pulsing highlight (`ring-2 ring-indigo-400 bg-indigo-950/80 animate-pulse`).
- Click another citation button `[2]`:
  - Verify `#chat-message-viewport` smoothly scrolls to center `#source-item-2` and transfers the pulsing highlight to it.
- Repeatedly click citation `[2]`:
  - Verify `#source-item-2` re-centers and re-triggers the pulsing animation without toggling the accordion closed.
- Verify that background graph nodes, camera viewport, and Note Preview panel remain completely unchanged throughout citation interactions.
