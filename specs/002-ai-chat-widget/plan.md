# Implementation Plan: AI Chat Widget UI

**Branch**: `[002-ai-chat-widget]` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-ai-chat-widget/spec.md`

## Summary

Add the frontend UI for the AI chat widget, designed as a client-side component that connects to a backend RAG chatbot API. It floats above the graph view, handles layout transitions via animations, persists drafts locally, handles SSE (Server-Sent Events) for real-time text streaming, displays retrieved sources in a collapsible accordion, and dynamically fetches suggested query prompts from `/random-topics` without dummy topic fallbacks, providing an inline error notice and a manual "Retry" button when upstream retrieval fails. Additionally, the node preview panel header includes a "View Wiki Source" button that links to the original wiki Markdown file on GitHub using `NEXT_PUBLIC_ORIGINAL_WIKI_REPO` and the node's `path` metadata.

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, Motion for React, Lucide React

**Storage**: `localStorage` (drafts and panel state), `sessionStorage` (message history)

**Testing**: Vitest, React Testing Library, Playwright

**Target Platform**: Modern Web Browsers (Desktop & Mobile)

**Project Type**: Dynamic Web Application (Frontend connecting to live FastAPI backend)

**Performance Goals**: < 300ms for layout transition animations; < 200ms transition to retry error state

**Constraints**: Must parse custom SSE text stream manually (not using native EventSource due to POST payload). Must not fallback to hardcoded/dummy topics (`DEFAULT_SUGGESTED_TOPICS` / `DEFAULT_TOPICS`); must surface live backend errors via HTTP 502 Bad Gateway proxy response and render inline retry button.

**Scale/Scope**: Local client widget with max 2000-character input, streaming text support, and live topic suggestions with retry.

**Environment Variables**: `ORIGINAL_WIKI_REPO` in `.env` must be renamed to `NEXT_PUBLIC_ORIGINAL_WIKI_REPO` so it is accessible from client components (Next.js convention).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dynamic Client Architecture**: PASS (Frontend and route proxy fetch dynamically from live FastAPI backend `/random-topics`, strictly eliminating static/dummy fallbacks)
- **II. Strict Read-Only Boundaries (Security)**: PASS (No direct repository edits; calling external query API)
- **III. Modern Static Tech Stack**: PASS (Next.js, React, TypeScript, Tailwind)
- **IV. Scalability & Performance**: PASS (Progressive SSE rendering ensures low memory overhead; skeleton loading prevents layout shifts during retry)
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
├── app/
│   └── random-topics/
│       └── route.ts             # Server-side proxy returning topics or HTTP 502 on backend failure
├── components/
│   ├── chat/
│   │   ├── ChatWidget.tsx
│   │   ├── ChatLauncher.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── MessageViewport.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── SuggestedPrompts.tsx  # Dynamic prompt chips with inline error & retry button
│   │   ├── TypingIndicator.tsx
│   │   └── MessageComposer.tsx
│   └── graph/
│       └── NodePreview.tsx      # Add "View Wiki Source" button (FR-017)
├── features/
│   └── chat/
│       ├── chat.types.ts
│       ├── chat.reducer.ts
│       ├── chat.storage.ts
│       ├── chat.api.ts          # Handles POST to /ask and SSE stream parsing
│       └── useChat.ts
└── tests/
    ├── suggested-prompts.test.tsx  # Unit/integration tests for SuggestedPrompts & retry flow
    └── e2e/
        └── chat.spec.ts
```

**Structure Decision**: A Next.js feature-sliced approach where `components/chat` contains the presentational components, `features/chat` holds all the business logic, types, and persistence layer, and `app/random-topics/route.ts` provides a clean upstream proxy without dummy data.

## Complexity Tracking

No violations found.
