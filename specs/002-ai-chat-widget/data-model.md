# Data Model: AI Chat Widget UI

## Entities

### ChatMessage
Represents a single message in the conversation.
- `id` (string): Unique identifier for the message.
- `role` ('user' | 'assistant'): The author of the message.
- `content` (string): The actual text content of the message.
- `timestamp` (number): Unix timestamp of when the message was sent/received.
- `sources` (Source[]): Optional list of sources returned by the backend for assistant messages.
- `status` ('streaming' | 'complete' | 'error'): Current state of the message.
- `error` (string): Optional error message if the stream failed partially.

### Source
Represents a retrieved source document for citations.
- `id` (string): Identifier for the source.
- `title` (string): Title of the wiki page.
- `url` (string): Link to the wiki page.

### ChatState
The global state for the chat widget, managed by a reducer.
- `mode` ('minimized' | 'standard' | 'expanded'): The layout state.
- `draft` (string): The current unsent text in the composer.
- `messages` (ChatMessage[]): History of messages in the current session.
- `isTyping` (boolean): Whether the assistant is currently typing or waiting for a response.
- `threadId` (string | null): The UUID for the current conversation session.

### SuggestedPromptsState
Component state managing dynamic prompt suggestions and retry recovery.
- `prompts` (string[]): List of formatted query prompt chips (max 3, formatted as "What is {topic}?").
- `isLoading` (boolean): Indicates whether a fetch or retry request to `/random-topics` is currently in progress.
- `hasError` (boolean): Indicates whether topic retrieval from `/random-topics` failed (non-200, network error, or empty list).

## State Transitions

### Layout State (`mode`)
- `minimized` -> `standard`: User clicks the launcher.
- `standard` -> `expanded`: User clicks the expand button.
- `expanded` -> `standard`: User clicks the restore button.
- `standard` -> `minimized`: User clicks the minimize button.

### Message State
- Submit: Add new User message.
- Receive Response: Add new Assistant message with status `streaming`.
- Receive Token: Append to Assistant message `content`.
- Receive Sources: Update Assistant message `sources`.
- Stream Done: Update Assistant message status to `complete`.
- Stream Error: Update Assistant message status to `error` and set `error` text.

### Suggested Prompts State
- Mount / Message Submit: `isLoading = true`, `hasError = false` -> render skeleton loading placeholders.
- Fetch Success (`200 OK` with topics): `prompts = formattedChips`, `isLoading = false`, `hasError = false` -> render prompt chips.
- Fetch Failure (`502` / network error / empty): `prompts = []`, `isLoading = false`, `hasError = true` -> render inline error notice with compact "Retry" button.
- Retry Click: `isLoading = true`, `hasError = false` -> render skeleton loading placeholders and dispatch new GET request to `/random-topics`.
