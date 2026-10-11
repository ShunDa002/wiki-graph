# Contract: POST /ask

## Request
**Method**: `POST`
**Headers**: `Content-Type: application/json`

**Body**:
```json
{
  "thread_id": "uuid-v4-string",
  "user_input": "The user's question"
}
```

## Response (Server-Sent Events)

The response streams as `text/event-stream` format chunks.

**Events**:

1. `sources`: Emitted before tokens.
```text
event: sources
data: {"thread_id": "...", "sources": [{"citation": 1, "path": "...", "title": "..."}]}
```

2. `token`: Incremental answer text.
```text
event: token
data: {"content": "Hello"}
```

3. `done`: Generation completed.
```text
event: done
data: {"thread_id": "..."}
```

4. `error`: Generation failed mid-stream or initially.
```text
event: error
data: {"message": "Error details..."}
```
