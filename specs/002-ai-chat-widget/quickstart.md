# Quickstart & Validation Guide: AI Chat Widget UI

## Prerequisites
- Node.js environment (v18+)
- Dependencies installed (`npm install`)
- A local Next.js development server running

## Setup
Start the local development server:
```bash
npm run dev
```

## Validation Scenarios

### Scenario 1: Initial Load & Launcher
1. Navigate to `http://localhost:3000`
2. Verify that a floating circular launcher appears in the bottom-right corner.
3. Click the launcher.
4. Verify the chat panel opens, animates smoothly, and displays the predefined welcome message.
5. Verify suggested topic chips (e.g., "What is [Topic]?") appear below the welcome message (or skeleton loaders if the `/random-topics` request is delayed).

### Scenario 2: Sending a Chat Message
1. Type a message in the input composer (e.g., "Hello world").
2. Press `Enter`.
3. Verify the message is added to the UI immediately.
4. Verify the typing indicator appears for a brief period.
5. Verify the streaming response appears incrementally in the message bubble.
6. Verify a new set of suggested topics is fetched and displayed.

### Scenario 3: State Persistence
1. Open the chat widget and type "test draft" in the composer without sending it.
2. Minimize the chat widget.
3. Refresh the page.
4. Reopen the chat widget.
5. Verify that "test draft" is still present in the composer.
6. Send a message to get a response, then refresh the page.
7. Verify that the message history is restored.

### Scenario 4: Stop Generating
1. Submit a long message to trigger an extended streaming response.
2. While the response is streaming, click the "Stop generating" button (which replaces the send button).
3. Verify the stream halts immediately and the message bubble stops updating.
4. Verify the "Stop generating" button reverts back to the standard submit button.

### Scenario 5: References & Sources
1. Send a query that returns sources (e.g., "What is useState?").
2. Verify the response includes an accordion for sources, collapsed by default.
3. Click the accordion to expand and view the list of retrieved pages.
4. Click an inline citation `[1]` within the assistant's text.
5. Verify the UI highlights or scrolls to the corresponding source in the accordion.

### Scenario 6: `/random-topics` Failure & Retry
1. Simulate a backend failure or unreachable backend (e.g. invalid `NEXT_PUBLIC_BACKEND_URL` or stopping the FastAPI server).
2. Open the chat widget.
3. Verify that no hardcoded/dummy topics are displayed.
4. Verify an inline error notice (e.g., "Failed to load suggested topics") and a compact "Retry" button appear in the suggested queries container.
5. Click the "Retry" button.
6. Verify skeleton loading chip placeholders appear immediately while the retry request is in-flight.
7. Restore backend connectivity and click "Retry" again.
8. Verify that 3 topic chips appear (formatted as "What is [Topic]?") and the error notice disappears.

### Scenario 7: View Wiki Source Button (FR-017)
1. Navigate to `http://localhost:3000`.
2. Click on any node in the graph to open the Node Preview panel.
3. In the preview header, verify a "View Wiki Source" button (external link icon) is visible next to the close button.
4. Click the button.
5. Verify a new browser tab opens with the URL `{NEXT_PUBLIC_ORIGINAL_WIKI_REPO}/{node.path}` (e.g., `https://github.com/ShunDa002/My-LLM-Wiki/tree/main/wiki/Artificial_Intelligence/Neural_Networks.md`).
6. Select a node that has an empty `path` property (if any exist).
7. Verify the "View Wiki Source" button is **not visible** in the header for that node.
