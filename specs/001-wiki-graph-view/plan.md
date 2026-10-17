# Implementation Plan: LLM Wiki Graph View

**Branch**: `001-wiki-graph-view` | **Date**: 2026-10-13 | **Spec**: [spec.md](file:///c/Data/ide-sbx-isolation/llm-wiki-graph/specs/001-wiki-graph-view/spec.md)

**Input**: Feature specification from `/specs/001-wiki-graph-view/spec.md` with unified Canvas multi-layout, uniform HUD controls, and AI chat citation click, viewport scroll & pulse highlighting clarifications.

## Summary

Implement a unified 60fps HTML5 Canvas graph view that renders all graph layout options (Force-Directed Organic, Hierarchical Top-Down, Hierarchical Left-Right, Grid Structure, and Concentric Radial) using the luminescent "Neon" theme on a deep navy canvas (`#060b18`). All layouts share pure flat categorical circular nodes scaled by degree centrality, uniform Neon Blue (`#1f51ff`) edge vectors with arrowheads, interactive selection/hover glows, smooth 500-600ms layout transition tweening, and uniform overlay controls across all layouts. Mount the AI Chat Widget (`ChatWidget.tsx` from `components/chat/`) in the graph view, positioning the minimized launcher above the category legend (`sm:bottom-16 bottom-5 right-5`) on desktop and `bottom-5 right-5` on mobile, while allowing the open chat panel to anchor at `bottom-5 right-5` (z-50) floating over background elements. 

Within the AI chat conversation, wire inline citation buttons `[N]` inside assistant message bubbles (`MessageBubble.tsx`) to auto-expand the `SourcesAccordion` if closed, smoothly scroll the message history viewport (`#chat-message-viewport`) to center the referenced `#source-item-${N}` in view, and apply an animated pulsing neon/indigo highlight to that source card. Repeated clicks re-focus and re-trigger the pulse without collapsing the accordion, and clicks on citations not present in the message's source list are gracefully ignored. The application consumes live FastAPI backend graph endpoints via TanStack Query and manages client state via Zustand.

## Technical Context

**Language/Version**: TypeScript / Node.js 20+

**Primary Dependencies**: Next.js, React, Tailwind CSS, Canvas 2D Rendering Engine, Dagre (layout calculations), TanStack Query, Zustand, Lucide React, Zod, Motion (`motion/react`)

**Storage**: None (Frontend is stateless; caching via TanStack Query; chat session/draft persistence in storage)

**Testing**: Vitest, React Testing Library, Playwright, MSW (Mock Service Worker)

**Target Platform**: Node.js hosting (e.g., Vercel, Docker) to support the protected API route for rebuilds

**Project Type**: Next.js Web Application

**Performance Goals**: 60 FPS Canvas rendering for 1,000+ notes; smooth 500-600ms tweening transitions between layouts; sub-50ms layout calculation using Dagre and deterministic math; sub-300ms smooth scroll and pulsing highlight trigger for inline citation clicks.

**Constraints**: Frontend MUST be strictly read-only for public users. Pure flat color node bodies without radial gradients; interactive states and active links styled exclusively in high-contrast Neon Blue (`#1f51ff`). Static layouts (Hierarchical, Grid, Radial) must maintain strict geometric coordinates with zero physics displacement while enabling camera pan, zoom, and node selection. Minimized chat launcher must float directly above category legend without collision. Inline citation clicks and source item selections MUST remain strictly self-contained within the chat widget with zero mutations to the background graph canvas or Note Preview panel.

**Scale/Scope**: Target MVP up to 1,000 notes; conversational responses with 1 to 10 source citations.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Dynamic Client Architecture**: PASS. The system fetches live graph data from FastAPI endpoints (`/graph`, `/graph/metadata`) rather than static JSON files, caching via TanStack Query.
- **Strict Read-Only Boundaries**: PASS. Frontend only displays data. Rebuild operations are secured behind a Next.js server boundary (`X-Graph-API-Key`).
- **Modern Tech Stack**: PASS. Using Next.js, TypeScript, Tailwind CSS, unified 60fps HTML5 Canvas with Dagre layout geometry, TanStack Query, and Zustand.
- **Scalability & Performance**: PASS. High-performance Canvas rendering eliminates DOM node thrashing from large graphs; static coordinates computed deterministically; spring physics isolated exclusively to Organic mode, with Re-cluster in static layouts performing clean deterministic re-alignment and smooth tweening without physics drift. Citation scrolling operates via native DOM `scrollIntoView` inside `#chat-message-viewport` without forcing graph re-renders.
- **Maintainability & RAG Integration**: PASS. Clean separation: layout calculations in `lib/layout-engine.ts`, physics simulation in `lib/force-simulation.ts`, client state in `store/useGraphStore.ts`, unified canvas view in `components/graph/ForceGraphCanvas.tsx` / `GraphCanvas.tsx`, and RAG chatbot interface cleanly mounted via `components/chat/ChatWidget.tsx` with self-contained citation navigation in `components/chat/MessageBubble.tsx` and `components/chat/SourcesAccordion.tsx` complying with Constitution Principle V.

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
│   ├── chat-citations.md
│   ├── environment.md
│   └── graph-schema.json
└── tasks.md             
```

### Source Code (repository root)

```text
├── app/
│   ├── graph/
│   │   └── page.tsx               # Graph page mounting GraphCanvas, NodePreview, and ChatWidget
│   ├── api/
│   │   └── rebuild/
│   │       └── route.ts
│   └── globals.css
├── components/
│   ├── chat/
│   │   ├── ChatWidget.tsx         # Floating chat container & layout coordinator
│   │   ├── ChatLauncher.tsx       # Minimized circular launcher
│   │   ├── ChatPanel.tsx          # Standard & expanded chat panel
│   │   ├── ChatHeader.tsx
│   │   ├── MessageComposer.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── SourcesAccordion.tsx
│   │   └── SuggestedPrompts.tsx
│   ├── graph/
│   │   ├── ForceGraphCanvas.tsx   # Unified 60fps Canvas multi-layout visualization & Neon theme
│   │   ├── GraphCanvas.tsx        # Canvas wrapper & layout bridge
│   │   ├── GraphToolbar.tsx       # Layout switcher & graph metrics
│   │   ├── SearchBox.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── NodePreview.tsx        # Metadata & deduplicated connection preview
│   │   └── ErrorPanel.tsx
├── features/
│   └── chat/                      # Chat state, storage, API transport & mock fallback
├── lib/
│   ├── api.ts                     # Zod schemas & multi-endpoint FastAPI resolver
│   ├── force-simulation.ts        # Physics engine, degree centrality & Neon theme mapper
│   ├── layout-engine.ts           # Dagre, Grid, Radial coordinate algorithms for Canvas nodes
│   └── graph-transforms.ts        # Data filtering and graph transformation utilities
├── store/
│   └── useGraphStore.ts           # Zustand store for layoutAlgorithm, selection, and filters
```
