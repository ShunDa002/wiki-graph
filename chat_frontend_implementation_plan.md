# Chat Frontend Implementation Plan

## Purpose

Build a Next.js frontend that submits Wiki questions to the FastAPI chatbot endpoint and displays the answer progressively as Server-Sent Events (SSE) arrive. The frontend should also expose the Wiki sources returned for the current answer and communicate loading, completion, and error states clearly.

## Technology Stack

- **Next.js with the App Router** for the frontend application and page lifecycle.
- **React and TypeScript** for typed components, request data, SSE events, and UI state.
- **Native Fetch API** for sending the `POST` request and reading the streaming response body.
- **ReadableStream API** with `TextDecoder` for incrementally decoding response chunks.
- **React state hooks** for the current question, generated answer, sources, request status, and errors.
- **AbortController** for cancelling an active stream when the user stops a request, starts another request, or leaves the relevant interface.
- **A styling solution compatible with Next.js**, such as Tailwind CSS, for the chat form, streamed answer, source list, loading state, and error feedback.

A native `EventSource` connection is not the preferred approach because the FastAPI endpoint expects a `POST` request with a JSON body. The frontend should use `fetch()` and parse the SSE-formatted response stream manually.

## Backend Request Contract

The frontend sends a `POST` request to the FastAPI endpoint:

```text
POST /ask
```

The request body must be JSON with these arguments:

```json
{
  "thread_id": "conversation-identifier",
  "user_input": "The user's Wiki question"
}
```

### Expected arguments

- `thread_id`: A non-empty string with a maximum length of 128 characters. The frontend should create or retain a stable identifier for the active conversation.
- `user_input`: The user's trimmed question. It must be non-empty and no longer than 10,000 characters.

The request should include the following header:

```http
Content-Type: application/json
```

The FastAPI base URL should be provided through frontend environment configuration rather than embedded directly in the UI logic. The configured frontend origin must also be accepted by the backend's CORS policy.

## SSE Fetching Logic

When the user submits a valid question, the frontend should:

1. Prevent duplicate submission and ignore blank input.
2. Reset the answer, sources, and previous error state for the new request.
3. Mark the request as active and create an `AbortController`.
4. Call the FastAPI `/ask` endpoint with `fetch()`, using `POST`, the JSON request body, and the abort signal.
5. Check the HTTP response status before attempting to process the stream.
6. Obtain a reader from the response body and decode incoming byte chunks incrementally with `TextDecoder`.
7. Keep an incomplete text buffer between reads because an SSE event may be split across multiple network chunks.
8. Separate complete SSE records using the blank-line boundary that terminates each event.
9. Parse the `event:` field as the event type and the `data:` field as JSON.
10. Apply each parsed event to the appropriate frontend state.
11. Continue reading until the server emits a terminal event or the response stream closes.
12. Release request state and stream resources when processing finishes, fails, or is cancelled.

The parser should not assume that one network chunk equals one SSE event. A chunk may contain part of an event, one complete event, or several events.

## Expected SSE Events

### `sources`

This event is expected before answer tokens. Its JSON data contains the current `thread_id` and the list of retrieved Wiki sources.

Each source may include:

- `citation`
- `path`
- `title`
- `reviewed`
- `confidence`
- `status`
- `score`

The frontend should store these sources for citation display and use the numeric `citation` value to associate answer references such as `[1]` with their corresponding source.

### `token`

This event contains:

```json
{
  "content": "incremental answer text"
}
```

The frontend should append `content` to the existing answer in arrival order. It should not replace the accumulated answer with each token.

### `done`

This event indicates that normal generation has completed. Its data includes the `thread_id`. The frontend should stop showing the active streaming state while preserving the completed answer and sources.

### `error`

This event indicates that the backend encountered an error during generation. Its data contains a `message`. The frontend should stop the active streaming state and show a safe, user-readable error without discarding any answer text that was already received.

## Frontend State Model

The interface should maintain, at minimum:

- The current input value.
- The stable conversation or thread identifier.
- The accumulated answer text.
- The retrieved source metadata.
- A request status such as idle, connecting, streaming, completed, cancelled, or failed.
- A user-readable error message.
- The active abort controller or an equivalent cancellation reference.

Derived UI behavior, such as disabling the submit action or displaying a progress indicator, should be based on this request status rather than dispersed boolean flags where possible.

## Error and Cancellation Behavior

The frontend should distinguish between:

- An HTTP error returned before streaming begins.
- A malformed or unavailable response body.
- A backend `error` SSE event.
- A network interruption during streaming.
- Invalid JSON in an SSE event.
- A deliberate cancellation through `AbortController`.

Cancellation should be treated as an expected state rather than a server failure. Regardless of the outcome, cleanup logic should ensure that the interface does not remain stuck in a loading state.

## User Experience Principles

- Display answer text as soon as `token` events arrive.
- Show sources independently from the generated answer once the `sources` event is received.
- Prevent accidental parallel requests unless the interface intentionally supports multiple independent conversations.
- Allow the user to stop an active response.
- Preserve partial output if streaming fails after some content has arrived.
- Keep citation labels consistent with the source numbering supplied by the backend.
- Present clear states for connecting, streaming, completed, cancelled, and failed requests.

## Scope Boundary

This plan describes the general frontend stack and data flow only. It does not prescribe a directory structure, component hierarchy, visual design, deployment model, or concrete source-code implementation.
