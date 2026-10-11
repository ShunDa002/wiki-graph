# Feature Specification: AI Chat Widget UI

**Feature Branch**: `[002-ai-chat-widget]`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "Add the frontend ui for the ai chat widget, design dummy data if needed, ignoring the backend functionalities. Refer the plan llm-wiki-combined-frontend-plan.md"

## Clarifications

### Session 2026-10-10
- Q: What should happen to the suggested prompts when a user submits a message? → A: They should be renewed by sending a GET request to `/random-topics` to retrieve a new list.
- Q: How should the sources accordion be displayed by default when it receives the `sources` event? → A: Collapsed initially, expanding only if clicked.
- Q: How should inline citations (e.g., `[1]`) within the LLM answer be rendered and behave? → A: Clickable links that scroll to or highlight the corresponding source in the accordion.
- Q: How should a backend streaming error be visualized if the answer is only partially completed? → A: Display an inline red error banner immediately below the partial text within the bubble.
- Q: How should the `thread_id` be generated for a new conversation session? → A: Generate a UUID v4 on the client when the chat widget is first opened.
- Q: How should the user intentionally cancel an active request (abort the stream)? → A: Provide a "Stop generating" button replacing the submit button while streaming.

### Session 2026-10-09
- Q: What should happen if the `/random-topics` endpoint fails or times out? → A: Show no suggested prompts.
- Q: What should be displayed in the suggested prompts area while the topics are being fetched from the endpoint? → A: Show skeleton loading placeholders for the chips.
- Q: When the Chat Widget is opened into the standard panel, how should it visually behave if the Note Preview is also open on the right side? → A: Overlay: The chat panel floats on top of the note preview.
- Q: What is the preferred UI method to clearly indicate to users that chat responses are purely simulated in this prototype phase? → A: Badge: A small 'Simulated' badge next to the timestamp on each assistant message.

### Session 2026-10-07
- Q: Should the mock transport layer introduce an artificial delay before responding? → A: Implement a random artificial delay (e.g., 1-3 seconds) to realistically simulate backend processing and validate the typing indicator.
- Q: How should the widget handle browser environments where `localStorage` or `sessionStorage` is disabled? → A: Degrade gracefully by falling back to in-memory state (losing history on refresh) and showing a one-time non-blocking warning toast.
- Q: How should the widget handle extremely long messages typed by the user? → A: Enforce a hard 2000-character limit on the composer input field to prevent abuse and UI breakage.
- Q: How should the widget handle background graph interactions when the chat is fully expanded on mobile devices? → A: Treat the expanded mobile chat as a modal overlay; block background graph interactions entirely to prevent accidental navigation while typing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Launch and Navigate Chat Widget (Priority: P1)

Users need to be able to open, collapse, and expand the chat widget without interfering with the main graph view.

**Why this priority**: Without a functional shell and predictable display states, users cannot interact with the widget at all.

**Independent Test**: Can be fully tested by clicking the launcher, expanding the widget, minimizing it back to a launcher, and verifying the graph view is unaffected.

**Acceptance Scenarios**:

1. **Given** the chat is minimized as a launcher, **When** the user clicks it, **Then** the chat smoothly animates into a standard panel and displays a welcome message and suggested prompts.
2. **Given** the chat is in standard mode, **When** the user clicks the "Expand" button, **Then** the panel transitions to an expanded overlay.
3. **Given** the chat is open, **When** the user clicks the "Minimize" button, **Then** the chat collapses into the launcher without losing any internal state.

---

### User Story 2 - Draft and Send Local Mock Messages (Priority: P1)

Users need to type messages, submit them, and receive an immediate local simulated response.

**Why this priority**: Simulating chat interaction is the core functionality of this frontend prototype.

**Independent Test**: Can be fully tested by typing a message, pressing Enter, and observing the chat history update with a mock response.

**Acceptance Scenarios**:

1. **Given** the chat panel is open, **When** the user types "hello" and presses Enter, **Then** the message is added to the history, the draft is cleared, a typing indicator appears, and a mock response is appended shortly after.
2. **Given** the chat composer is focused, **When** the user presses Shift+Enter, **Then** a new line is added to the draft instead of submitting.
3. **Given** the draft is empty or only whitespace, **When** the user presses Enter, **Then** no message is sent.

---

### User Story 3 - Persistence of Draft and History (Priority: P2)

Users should not lose their chat history or unsent draft if they minimize the widget or refresh the page.

**Why this priority**: Protects user context and demonstrates the separation of graph vs. chat state.

**Independent Test**: Can be fully tested by typing a draft, minimizing the chat, and reopening it to verify the draft remains.

**Acceptance Scenarios**:

1. **Given** the user has typed an unsent draft, **When** they minimize and reopen the chat, **Then** the draft text is fully preserved.
2. **Given** the user has received mock responses, **When** they refresh the page, **Then** their chat history is restored from session storage.

### Edge Cases

- **Message Length Limit**: The system enforces a hard 2000-character limit on the composer input field to prevent UI breakage and performance issues.
- **Disabled Storage**: If `localStorage` or `sessionStorage` are disabled or inaccessible, the widget degrades gracefully by using in-memory state (history will not survive a refresh) and displays a one-time non-blocking warning toast.
- **Mobile Expanded Overlay**: When expanded on mobile devices, the widget acts as a modal overlay, blocking background graph interactions to prevent accidental layout shifts or navigation.
- **Endpoint Failure**: If the `/random-topics` endpoint fails or times out when fetching suggested prompts, the system gracefully degrades by showing no suggested prompts instead of crashing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a floating circular launcher in the bottom-right corner of the application shell.
- **FR-002**: The system MUST animate transitions between minimized, standard, and expanded chat states (respecting `prefers-reduced-motion`).
- **FR-003**: The chat widget MUST display a header containing an expand/restore control, a title ("LLM Wiki AI"), and a minimize control.
- **FR-004**: The system MUST automatically insert a predefined welcome message the first time the chat is opened in a session.
- **FR-005**: The system MUST fetch suggested topics dynamically via a GET request to `/random-topics` initially and after every user message submission, mapping the first 3 topics into prompt chips formatted as "What is {topic}?". While fetching, it MUST display skeleton loading placeholders.
- **FR-006**: The system MUST persist unsent drafts and layout preferences using `localStorage`.
- **FR-007**: The system MUST persist chat message history within the active browser session using `sessionStorage`.
- **FR-008**: The system MUST connect to the backend `/ask` endpoint, sending a POST request with `thread_id` and `user_input`. It MUST parse SSE events (`sources`, `token`, `done`, `error`).
- **FR-009**: The system MUST render the streamed LLM answer progressively in a message bubble.
- **FR-012**: The system MUST render referred wiki pages in a collapsible accordion (received via `sources` event) that is collapsed by default, expanding only if clicked.
- **FR-013**: The system MUST render inline citations (e.g., `[1]`) in the LLM answer as clickable links that scroll to or highlight the corresponding source in the accordion.
- **FR-014**: The system MUST display backend streaming errors as an inline red error banner immediately below any partially received text within the message bubble.
- **FR-015**: The system MUST generate a UUID v4 on the client for the `thread_id` when the chat widget is first opened.
- **FR-016**: The system MUST replace the submit button with a "Stop generating" button during active streaming, which triggers the AbortController to cancel the request.
- **FR-010**: The chat UI MUST NOT reset or block interactions with the background graph canvas on desktop (but MUST act as a blocking modal overlay when fully expanded on mobile). When opened into the standard panel on desktop, the chat MUST float as an overlay on top of the note preview if it is open.
- **FR-011**: The system MUST be fully accessible via keyboard, trapping focus appropriately when necessary.

### Key Entities

- **ChatMessage**: Represents a single message bubble, containing an ID, role (user/assistant), content, and timestamp.
- **ChatState**: The reducer state managing the widget's layout mode (minimized/standard/expanded), draft content, message history, and typing indicator status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visual transitions between chat states complete in 200-300ms smoothly on desktop devices.
- **SC-002**: An unsent draft (e.g., "hello") perfectly survives a minimize/reopen sequence and a page refresh.
- **SC-003**: Users can submit a message and view a mock response using only the keyboard (`Tab`, `Enter`, `Shift+Enter`).
- **SC-004**: A user interacting with the main graph (panning/zooming) does not cause the chat widget's state to reset or clear.

## Assumptions

- The widget will eventually connect to a real RAG backend; therefore, a clear mock transport adapter boundary is required.
- Session storage is adequate for history retention in this read-only static prototype (no remote user profiles or database synchronization are expected).
- The chat responses in this phase are purely simulated (hardcoded or locally generated dummy text) and do not reflect real knowledge graph embeddings.
