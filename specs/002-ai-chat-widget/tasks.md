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

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in sequentially (US1 → US2 → US3) or in parallel if isolated components are worked on.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Integrates into US1 UI shell, so `ChatPanel.tsx` must exist.
- **User Story 3 (P2)**: Integrates into `useChat.ts`, so US1 and US2 hook structure must exist.

### Parallel Opportunities

- All Foundational tasks [T002-T004] marked [P] can run in parallel
- UI components in US1 [T005-T006] can run in parallel
- UI components in US2 [T011-T015] can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch isolated UI components together:
Task: "T012 [P] [US2] Create MessageComposer.tsx..."
Task: "T013 [P] [US2] Create MessageBubble.tsx..."
Task: "T014 [P] [US2] Create SuggestedPrompts.tsx..."
Task: "T015 [P] [US2] Create TypingIndicator.tsx..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 → Test UI shell
3. Add User Story 2 → Test chatting capabilities
4. Add User Story 3 → Test persistence
5. Complete Polish phase
