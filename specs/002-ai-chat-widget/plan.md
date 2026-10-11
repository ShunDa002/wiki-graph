# Implementation Plan: AI Chat Widget UI

**Branch**: `[002-ai-chat-widget]` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-ai-chat-widget/spec.md`

## Summary

Add the frontend UI for the AI chat widget, designed as a client-side component that connects to a backend RAG chatbot API. It floats above the graph view, handles layout transitions via animations, persists drafts locally, handles SSE (Server-Sent Events) for real-time text streaming, and displays retrieved sources in a collapsible accordion.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, Motion for React, Lucide React

**Storage**: `localStorage` (drafts and panel state), `sessionStorage` (message history)

**Testing**: Vitest, React Testing Library, Playwright

**Target Platform**: Modern Web Browsers (Desktop & Mobile)

**Project Type**: Static Web Application (Frontend connecting to external API)

**Performance Goals**: < 300ms for layout transition animations

**Constraints**: Must parse custom SSE text stream manually (not using native EventSource due to POST payload).

**Scale/Scope**: Local client widget with max 2000-character input, streaming text support.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Build Architecture**: PASS (Frontend remains statically built, calling `/ask` at runtime on the client)
- **II. Strict Read-Only Boundaries (Security)**: PASS (No direct repository edits; calling external query API)
- **III. Modern Static Tech Stack**: PASS (Next.js, React, TypeScript, Tailwind)
- **IV. Scalability & Performance**: PASS (Progressive SSE rendering ensures low memory overhead)
- **V. Maintainability**: PASS (RAG chatbot integration aligns directly with the documented future goal)

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-chat-widget/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (to be generated)
```

### Source Code (repository root)

```text
site/
├── components/
│   └── chat/
│       ├── ChatWidget.tsx
│       ├── ChatLauncher.tsx
│       ├── ChatPanel.tsx
│       ├── ChatHeader.tsx
│       ├── MessageViewport.tsx
│       ├── MessageBubble.tsx
│       ├── SuggestedPrompts.tsx
│       ├── TypingIndicator.tsx
│       └── MessageComposer.tsx
├── features/
│   └── chat/
│       ├── chat.types.ts
│       ├── chat.reducer.ts
│       ├── chat.storage.ts
│       ├── chat.api.ts          # Handles POST to /ask and SSE stream parsing
│       └── useChat.ts
└── tests/
    └── e2e/
        └── chat.spec.ts
```

**Structure Decision**: A Next.js feature-sliced approach where `components/chat` contains the presentational components and `features/chat` holds all the business logic, types, and persistence layer.

## Complexity Tracking

No violations found.
