# Implementation Plan: LLM Wiki Graph View

**Branch**: `001-wiki-graph-view` | **Date**: 2026-10-11 | **Spec**: [spec.md](file:///c/Data/ide-sbx-isolation/llm-wiki-graph/specs/001-wiki-graph-view/spec.md)

**Input**: Feature specification from `/specs/001-wiki-graph-view/spec.md` with unified Canvas multi-layout and continuous constrained physics clarifications.

## Summary

Implement a unified 60fps HTML5 Canvas graph view that renders all graph layout options (Force-Directed Organic, Hierarchical Top-Down, Hierarchical Left-Right, Grid Structure, and Concentric Radial) using the luminescent "Neon" theme on a deep navy canvas (`#060b18`). All layouts share pure flat categorical circular nodes scaled by degree centrality, uniform Neon Blue (`#1f51ff`) edge vectors with arrowheads, interactive selection/hover glows, smooth 500-600ms layout transition tweening, and unified overlay controls (Play/Pause and Reheat visible in all layouts).

**Physics Model**: All layouts run continuous physics simulation. Force-Directed Organic uses unconstrained force-directed physics. Hierarchical, Grid, and Radial use **constrained spring physics** — nodes are anchored to their computed layout positions (Dagre/Grid/Radial coordinates act as gravitational attractors, anchor spring constant ~0.03-0.05, max drift ~30-50px) with collision avoidance, gentle organic jitter, and a perpetual minimum alpha (~0.01-0.02) for continuous breathing. Dragging a node in constrained layouts creates an elastic rubber band snap-back to the anchor position on release.

The application consumes live FastAPI backend graph endpoints via TanStack Query and manages client state via Zustand.

## Technical Context

**Language/Version**: TypeScript / Node.js 20+

**Primary Dependencies**: Next.js, React, Tailwind CSS, Canvas 2D Rendering Engine, Dagre (layout calculations), TanStack Query, Zustand, Lucide React, Zod

**Storage**: None (Frontend is stateless; caching via TanStack Query)

**Testing**: Vitest, React Testing Library, Playwright, MSW (Mock Service Worker)

**Target Platform**: Node.js hosting (e.g., Vercel, Docker) to support the protected API route for rebuilds

**Project Type**: Next.js Web Application

**Performance Goals**: 60 FPS Canvas rendering for 1,000+ notes with continuous physics across all layouts; smooth 500-600ms tweening transitions between layouts; sub-50ms layout calculation using Dagre and deterministic math; degree centrality dynamic scaling and adaptive LoD label pills; perpetual minimum alpha ~0.01-0.02 for organic breathing in constrained modes.

**Constraints**: Frontend MUST be strictly read-only for public users. Pure flat color node bodies without radial gradients; interactive states and active links styled exclusively in high-contrast Neon Blue (`#1f51ff`). All layouts run continuous physics: unconstrained forces for Organic, constrained anchor-spring physics for Hierarchical/Grid/Radial (spring constant ~0.03-0.05, max drift ~30-50px, perpetual min alpha ~0.01-0.02). Node dragging in constrained layouts uses elastic rubber band snap-back. Reheat in constrained layouts re-computes layout coordinates and re-anchors.

**Scale/Scope**: Target MVP up to 1,000 notes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Dynamic Client Architecture**: PASS. The system fetches live graph data from FastAPI endpoints (`/graph`, `/graph/metadata`) rather than static JSON files, caching via TanStack Query.
- **Strict Read-Only Boundaries**: PASS. Frontend only displays data. Rebuild operations are secured behind a Next.js server boundary (`X-Graph-API-Key`).
- **Modern Tech Stack**: PASS. Using Next.js, TypeScript, Tailwind CSS, unified 60fps HTML5 Canvas with Dagre layout geometry, TanStack Query, and Zustand.
- **Scalability & Performance**: PASS. High-performance Canvas rendering eliminates DOM node thrashing from large graphs. All layouts run continuous physics: unconstrained force-directed for Organic, constrained anchor-spring for Hierarchical/Grid/Radial (spring constant ~0.03-0.05, perpetual min alpha ~0.01-0.02 for organic breathing). 60 FPS maintained via efficient N-body calculation and moderate drift constraints.
- **Maintainability**: PASS. Clean separation: layout calculations in `lib/layout-engine.ts`, physics simulation in `lib/force-simulation.ts` (including constrained anchor-spring mode), client state in `store/useGraphStore.ts`, and unified canvas view in `components/graph/ForceGraphCanvas.tsx` / `GraphCanvas.tsx`.

## Project Structure

### Documentation (this feature)

```text
specs/001-wiki-graph-view/
├── plan.md              
├── research.md          
├── data-model.md        
├── quickstart.md        
├── checklists/
│   └── requirements.md
├── contracts/
│   ├── backend-api.md
│   ├── environment.md
│   └── graph-schema.json
└── tasks.md             
```

### Source Code (repository root)

```text
├── app/
│   ├── graph/
│   │   └── page.tsx
│   ├── api/
│   │   └── rebuild/
│   │       └── route.ts
│   └── globals.css
├── components/
│   ├── graph/
│   │   ├── ForceGraphCanvas.tsx   # Unified 60fps Canvas multi-layout visualization, Neon theme & constrained physics
│   │   ├── GraphCanvas.tsx        # Canvas wrapper & layout bridge
│   │   ├── GraphToolbar.tsx       # Layout switcher & graph metrics
│   │   ├── SearchBox.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── NodePreview.tsx        # Metadata & deduplicated connection preview
│   │   └── ErrorPanel.tsx
├── lib/
│   ├── api.ts                     # Zod schemas & multi-endpoint FastAPI resolver
│   ├── force-simulation.ts        # Physics engine (unconstrained + constrained anchor-spring), degree centrality & Neon theme mapper
│   ├── layout-engine.ts           # Dagre, Grid, Radial coordinate algorithms for Canvas nodes
│   └── graph-transforms.ts        # Data filtering and graph transformation utilities
├── store/
│   └── useGraphStore.ts           # Zustand store for layoutAlgorithm, selection, and filters
```
