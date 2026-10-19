---
description: "Task list template for feature implementation"
---

# Tasks: AI Chat Widget UI

**Input**: Design documents from `/specs/002-ai-chat-widget/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install dependencies: `motion` and `lucide-react` via npm

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create `chat.types.ts` in `features/chat/chat.types.ts` defining `ChatMessage`, `Source`, and `ChatState`
- [x] T003 [P] Create `chat.reducer.ts` in `features/chat/chat.reducer.ts` to manage layout `mode`, `draft`, `messages`, `isTyping`, and `threadId`
- [x] T004 [P] Create `chat.storage.ts` in `features/chat/chat.storage.ts` to abstract `localStorage` and `sessionStorage` access

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Launch and Navigate Chat Widget (Priority: P1) 🎯 MVP

**Goal**: Users need to be able to open, collapse, and expand the chat widget without interfering with the main graph view.

**Independent Test**: Click the launcher, expand the widget, minimize it back to a launcher, and verify the graph view is unaffected.

### Implementation for User Story 1

- [x] T005 [P] [US1] Create `ChatLauncher.tsx` in `components/chat/ChatLauncher.tsx`
- [x] T006 [P] [US1] Create `ChatHeader.tsx` in `components/chat/ChatHeader.tsx` with expand/restore and minimize controls
- [x] T007 [US1] Create `ChatPanel.tsx` in `components/chat/ChatPanel.tsx` using Motion for React for transitions
- [x] T008 [US1] Create `useChat.ts` hook in `features/chat/useChat.ts` integrating the reducer for mode switching
- [x] T009 [US1] Create `ChatWidget.tsx` in `components/chat/ChatWidget.tsx` to compose launcher and panel based on state
- [x] T010 [US1] Mount `<ChatWidget />` in the main application layout (`app/layout.tsx` or equivalent root component)

**Checkpoint**: At this point, User Story 1 should be fully functional (UI navigation only).

---

## Phase 4: User Story 2 - Draft and Send Local Mock Messages (Priority: P1)

**Goal**: Users need to type messages, submit them, and receive an immediate local simulated response.

**Independent Test**: Type a message, press Enter, and observe the chat history update with a mock streaming response.

### Implementation for User Story 2

- [x] T011 [P] [US2] Create `chat.api.ts` in `features/chat/chat.api.ts` with custom fetch reader for `/ask` SSE stream parsing and GET `/random-topics`
- [x] T012 [P] [US2] Create `MessageComposer.tsx` in `components/chat/MessageComposer.tsx` (textarea, max 2000 chars limit constraint from data model, Enter to submit, Shift+Enter for newline, handle "Stop generating" button)
- [x] T013 [P] [US2] Create `MessageBubble.tsx` in `components/chat/MessageBubble.tsx` (render user/assistant messages, handle partial SSE text, inline citations, streaming errors)
- [x] T014 [P] [US2] Create `SuggestedPrompts.tsx` in `components/chat/SuggestedPrompts.tsx` (fetch from `/random-topics` initially and after messages, display skeleton loading)
- [x] T015 [P] [US2] Create `TypingIndicator.tsx` in `components/chat/TypingIndicator.tsx`
- [x] T016 [US2] Create `MessageViewport.tsx` in `components/chat/MessageViewport.tsx` (scrollable container, auto-scroll to bottom, display sources accordion collapsed by default)
- [x] T017 [US2] Update `useChat.ts` in `features/chat/useChat.ts` to handle message submission, UUID v4 `threadId` generation, typing indicator logic, and backend API integration
- [x] T018 [US2] Update `useChat.ts` to automatically insert the predefined welcome message on first load
- [x] T019 [US2] Integrate composer, viewport, and suggested prompts into `ChatPanel.tsx` in `components/chat/ChatPanel.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Persistence of Draft and History (Priority: P2)

**Goal**: Users should not lose their chat history or unsent draft if they minimize the widget or refresh the page.

**Independent Test**: Type a draft, minimize the chat, reopen it to verify draft remains. Receive mock responses, refresh page, verify history is restored.

### Implementation for User Story 3

- [x] T020 [P] [US3] Update `useChat.ts` in `features/chat/useChat.ts` to initialize state from `chat.storage.ts` (draft from localStorage, history from sessionStorage)
- [x] T021 [P] [US3] Update `useChat.ts` to sync draft changes to `localStorage` and message history to `sessionStorage`
- [x] T022 [US3] Add one-time non-blocking warning toast in `ChatWidget.tsx` if storage is disabled (graceful degradation)

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T023 [P] Add mobile overlay behavior and desktop overlay z-index behavior over note preview to `ChatWidget.tsx`
- [x] T024 [P] Add 'Simulated' badge next to the timestamp on assistant messages in `MessageBubble.tsx`
- [x] T025 [P] Implement keyboard accessibility and focus trapping in `ChatPanel.tsx` when the chat is expanded
- [x] T026 Run `quickstart.md` validation scenarios manually to verify end-to-end functionality

---

## Phase 7: User Story 1 Enhancement - Live Topic Suggestions & Retry Recovery (Priority: P1)

**Goal**: Eliminate all dummy topic fallbacks (`DEFAULT_SUGGESTED_TOPICS` and `DEFAULT_TOPICS`), return HTTP 502 Bad Gateway on backend proxy failures, and provide an inline error notice with a compact "Retry" button that re-fetches `/random-topics` with in-flight skeleton loaders.

**Independent Test**: Load the chat widget when the live backend is unreachable; verify no dummy fallback topics appear, verify an inline error message and "Retry" button are displayed, verify clicking "Retry" triggers skeleton loaders while sending a new GET request to `/random-topics`, and verify that restoring the backend allows topics to load cleanly.

### Implementation for User Story 1 Enhancement

- [x] T027 [P] [US1] Remove DEFAULT_TOPICS and return HTTP 502 Bad Gateway with JSON error on backend failure in app/random-topics/route.ts
- [x] T028 [US1] Remove DEFAULT_SUGGESTED_TOPICS fallback, implement error state with inline notice, and add compact "Retry" button with in-flight skeleton loading in components/chat/SuggestedPrompts.tsx
- [x] T029 [P] [US1] Update tests to remove dummy fallback tests and add error notice, retry button click, and re-fetch tests in tests/suggested-prompts.test.tsx
- [x] T030 [US1] Run unit tests via npm test to verify SuggestedPrompts component and route proxy pass cleanly in tests/suggested-prompts.test.tsx
- [x] T031 [US1] Validate /random-topics failure and retry flow against specs/002-ai-chat-widget/quickstart.md Scenario 6

---

## Phase 8: View Wiki Source Button (FR-017)

**Goal**: Add a "View Wiki Source" button to the node preview panel header that links to the original wiki Markdown file on GitHub, constructed from `NEXT_PUBLIC_ORIGINAL_WIKI_REPO` and the node's `path` metadata.

**Independent Test**: Click any node in the graph to open the Node Preview panel; verify a "View Wiki Source" button is visible in the header; click it and verify a new browser tab opens with the correct GitHub URL (`{NEXT_PUBLIC_ORIGINAL_WIKI_REPO}/{node.path}`). Select a node with an empty `path` and verify the button is hidden.

### Implementation for View Wiki Source Button

- [x] T032 [US1] Rename `ORIGINAL_WIKI_REPO` to `NEXT_PUBLIC_ORIGINAL_WIKI_REPO` in `.env` so it is accessible from client components (Next.js convention requires `NEXT_PUBLIC_` prefix for browser-exposed variables)
- [x] T033 [US1] Add "View Wiki Source" button to the header section of `components/graph/NodePreview.tsx`: read `process.env.NEXT_PUBLIC_ORIGINAL_WIKI_REPO`, construct URL as `{NEXT_PUBLIC_ORIGINAL_WIKI_REPO}/{path}` using the node's `metadata.path`, render as an anchor (`<a>`) with `target="_blank"` and `rel="noopener noreferrer"`, use the `ExternalLink` icon from `lucide-react`, and conditionally hide the button when `path` is empty or falsy
- [x] T034 [US1] Validate View Wiki Source button against `specs/002-ai-chat-widget/quickstart.md` Scenario 7

**Checkpoint**: View Wiki Source button is functional and validated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Completed
- **Foundational (Phase 2)**: Completed
- **User Stories (Phase 3–5)**: Completed
- **Polish (Phase 6)**: Completed
- **Phase 7 (US1 Enhancement)**: Completed
- **Phase 8 (FR-017 View Wiki Source)**: Depends on existing `NodePreview.tsx` and `.env` — no blockers from other phases

### User Story Dependencies

- **T032 (Env Rename)**: Renames `ORIGINAL_WIKI_REPO` → `NEXT_PUBLIC_ORIGINAL_WIKI_REPO` in `.env`. No code depends on the old name.
- **T033 (Button Implementation)**: Depends on T032 (env variable must be renamed before the component can read it). Modifies `components/graph/NodePreview.tsx`.
- **T034 (Scenario Validation)**: Depends on T032 + T033 being complete.

### Parallel Opportunities

- `T032` (`.env` rename) is a trivial one-line change and can be done instantly before T033.
- T033 is the main implementation task — single file change to `NodePreview.tsx`.
- T034 validates the completed feature.

---

## Parallel Example: View Wiki Source Button

```bash
# Sequential — small feature, minimal parallelism:
Task: "T032 [US1] Rename ORIGINAL_WIKI_REPO to NEXT_PUBLIC_ORIGINAL_WIKI_REPO in .env"
Task: "T033 [US1] Add View Wiki Source button to components/graph/NodePreview.tsx"
Task: "T034 [US1] Validate against quickstart.md Scenario 7"
```

---

## Implementation Strategy

### Incremental Delivery for Phase 8

1. **Step 1 (T032)**: Rename the environment variable in `.env` to use the `NEXT_PUBLIC_` prefix.
2. **Step 2 (T033)**: Add the button to `NodePreview.tsx` header — conditionally rendered, opens in new tab, uses `ExternalLink` icon.
3. **Step 3 (T034)**: Validate against `quickstart.md` Scenario 7 by clicking nodes and verifying the link URL and visibility behavior.
