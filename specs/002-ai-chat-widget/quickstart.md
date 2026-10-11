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

### Scenario 2: Sending a Local Mock Message
*(Requires the mock backend or simulated endpoints)*
1. Type a message in the input composer (e.g., "Hello world").
2. Press `Enter`.
3. Verify the message is added to the UI immediately.
4. Verify the typing indicator appears for a brief period (1-3 seconds).
5. Verify the simulated streaming response appears incrementally in the message bubble.
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
1. Submit a long message to trigger a simulated long response.
2. While the response is streaming, click the "Stop generating" button (which replaces the send button).
3. Verify the stream halts immediately and the message bubble stops updating.
4. Verify the "Stop generating" button reverts back to the standard submit button.

### Scenario 5: References & Sources
1. Send a query that triggers a mocked source response.
2. Verify the response includes an accordion for sources, collapsed by default.
3. Click the accordion to expand and view the list of retrieved pages.
4. Click an inline citation `[1]` within the assistant's text.
5. Verify the UI highlights or scrolls to the corresponding source in the accordion.
