# Quickstart & Validation Guide

## Setup
1. Define local environment variables:
   - `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`
   - `REBUILD_SECRET_KEY=local_dev_secret`
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

### 4. Contextual Canvas Overlay Controls
- While in **Force-Directed (Organic)** layout:
  - Verify top-right canvas controls display Play/Pause, Reheat, Fit View, Zoom In/Out, and Toggle Labels.
- While in **Hierarchical, Grid, or Radial** layouts:
  - Verify the Play/Pause and Reheat simulation buttons are hidden, showing only Zoom In/Out, Fit View, and Toggle Labels.

### 5. Interactive Selection, Neighbor Glow, and Node Preview
- Hover over any node in any layout: verify the node illuminates with a Neon Blue hover ring, connected edges illuminate in Neon Blue, and the hover tooltip card appears.
- Click any node: verify the selected node displays a pulsing Neon Blue ring, direct neighbors display neon cyan rings, incident edges glow intensely, and the node preview side panel opens.
- Click the canvas backdrop: verify selection and neighbor highlights are cleared and the preview panel closes.
