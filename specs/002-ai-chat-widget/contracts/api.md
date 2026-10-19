# API Contracts: AI Chat Widget UI

## Endpoints

### POST `/ask`
Handles the submission of a user message and returns a streamed Server-Sent Events (SSE) response.

#### Request
- **URL**: `/ask`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "thread_id": "uuid-v4-string",
    "user_input": "string (max 2000 chars)"
  }
  ```

#### Response (SSE Stream)
- **Content-Type**: `text/event-stream`
- **Events**:
  - `event: sources`: Sent before any token events. Contains a JSON array of sources used for the response.
    ```json
    [
      { "id": "1", "title": "Setup Guide", "url": "/wiki/setup-guide" }
    ]
    ```
  - `event: token`: Sent continuously as the model generates the response. Contains raw markdown text fragments.
    ```text
    data: This is a
    ```
  - `event: done`: Signals the completion of the stream.
  - `event: error`: Signals a backend error during streaming.
    ```text
    data: Connection to inference server lost.
    ```

### GET `/random-topics`
Retrieves a list of suggested topics dynamically from the live backend to display to the user.

#### Request
- **URL**: `/random-topics`
- **Method**: `GET`
- **Headers**:
  - `Accept: application/json`

#### Response: Success (200 OK)
- **Content-Type**: `application/json`
- **Body**:
  ```json
  [
    "Project Architecture",
    "Markdown Parsing",
    "Authentication"
  ]
  ```
  *(Or object format: `{"topics": ["Topic 1", "Topic 2"]}`)*

#### Response: Upstream Failure (502 Bad Gateway)
Returned when the live backend is unreachable, times out, or fails to provide valid topics.
- **Status**: `502 Bad Gateway`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "error": "Failed to fetch topics from backend"
  }
  ```
