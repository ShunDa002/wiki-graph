# Backend API Contracts

## `GET /health`
Returns service readiness and graph stats.
- Response: `{ status: "ok", graphReady: true, nodeCount: number, sourceVersion: string }`

## `GET /graph/metadata`
Lightweight check for freshness.
- Response: `{ schemaVersion: string, generatedAt: string, sourceVersion: string }`

## `GET /graph`
Full graph response.
- Response: `GraphResponse` (see data-model.md)

## `GET /graph/node?id=...`
Direct node lookup.
- Response: `GraphNode`

## `POST /graph/rebuild`
Administrative endpoint to trigger graph rebuild.
- Headers: `X-Graph-API-Key`
- Response: `{ status: "processing" | "success", message: string }`
