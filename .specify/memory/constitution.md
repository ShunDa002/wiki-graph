<!--
Sync Impact Report:
- Version change: 1.2.0 → 1.3.0
- Modified principles:
  - IV. Scalability & Performance → Replaced "physics MUST be suspended during static layouts" with continuous constrained spring physics (anchor spring ~0.03-0.05, perpetual minimum alpha ~0.01-0.02) across all layouts
- Added sections: None
- Removed sections: None
- Follow-up TODOs: None
-->
# LLM Wiki Graph-View Constitution

## Core Principles

### I. Dynamic Client Architecture
The graph system MUST be built to fetch data dynamically from the live FastAPI backend endpoints rather than relying on a statically generated JSON file. The frontend renders this data interactively and manages server state via TanStack Query.

### II. Strict Read-Only Boundaries (Security)
The public-facing website MUST have no write capability. It MUST NOT include GitHub tokens, expose filesystem APIs, or provide editing interfaces. Administrative operations (like graph rebuilds) MUST be protected behind a secure server-side boundary using an API key.

### III. Modern Tech Stack
The frontend MUST be built using Next.js, React, TypeScript, and Tailwind CSS. Graph visualization MUST utilize a high-performance HTML5 Canvas 2D engine supporting unified multi-layout rendering (Force-Directed Organic, Hierarchical, Grid, and Concentric Radial) with Dagre for hierarchical coordinate computation. React Flow MAY be retained as an optional fallback or hybrid component. Data fetching MUST use TanStack Query, and client state SHOULD use Zustand.

### IV. Scalability & Performance
The frontend MUST optimize for 60 FPS client-side Canvas rendering with dynamic degree centrality scaling and adaptive label level-of-detail. All layouts MUST run continuous physics simulation: unconstrained force-directed physics for Organic mode, and constrained spring physics (anchored to computed layout positions with collision avoidance, anchor spring constant ~0.03-0.05, max drift ~30-50px, perpetual minimum alpha ~0.01-0.02) for Hierarchical, Grid, and Radial modes.

### V. Maintainability
Code MUST remain well-structured to support future integrations, specifically the planned RAG chatbot. State management SHOULD rely on native React state initially, only introducing external stores like Zustand if interaction logic dictates.

## Architecture & Technology Guidelines

The repository architecture follows a clear separation of concerns:
- **FastAPI Backend:** Responsible for reading Markdown files, resolving links, exposing the `/graph` API, and handling authenticated rebuild requests.
- **Next.js Frontend:** A web application that consumes the FastAPI endpoints to render an interactive graph, search, and preview interface. It operates entirely statelessly without a local database.

The tech stack strictly aligns with:
- **Frameworks:** Next.js, React, TypeScript, Tailwind CSS
- **Data Fetching & State:** TanStack Query, Zustand
- **Graph Engine:** HTML5 Canvas 2D Engine (60 FPS multi-layout & Neon theme), Dagre (hierarchical coordinates), React Flow (optional fallback)
- **Testing:** Vitest, React Testing Library, Playwright, MSW

## Security & Data Policies

Data security and integrity are paramount:
- The website consumes a read-only snapshot of the repository. It has no mechanism to interact with the local Obsidian vault.
- No direct GitHub API calls for write access are permitted.
- Contents parsed from Markdown files must be sanitized before rendering.
- Build scripts must strictly process `wiki/**/*.md` and must explicitly reject or ignore `.obsidian/`, `node_modules/`, `.git/`, and any symbolic links.
- Read-only deployment credentials should be utilized if private repository access is required.

## Governance

All PRs and architectural changes MUST preserve the stateless, read-only nature of the frontend application. The frontend should act purely as a consumer of the FastAPI backend, ensuring that the system remains ready for future RAG chatbot integration. Amendments to this constitution require documentation, semantic version increment, and synchronization across all active specification artifacts.

**Version**: 1.3.0 | **Ratified**: 2026-10-06 | **Last Amended**: 2026-10-11
