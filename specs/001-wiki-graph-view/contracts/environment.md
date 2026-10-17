# Environment Configuration Contract

The frontend and graph pipeline rely on the following environment variables to configure external dependencies and backend communication.

## Variables

### `NEXT_PUBLIC_BACKEND_URL`
- **Description**: Base URL for the external FastAPI backend endpoints (`/graph`, `/graph/metadata`, `/health`, `/graph/node`).
- **Required**: Yes
- **Default**: `http://localhost:8000` (or `http://127.0.0.1:8000`)
- **Format**: `http(s)://<host>:<port>`

### `GRAPH_REBUILD_SECRET_KEY`
- **Description**: Server-side secret key used by the Next.js `/api/rebuild` route proxy to authorize requests to FastAPI `/graph/rebuild` with `X-Graph-API-Key`.
- **Required**: Yes
- **Default**: `local_dev_secret`

### `WIKI_REPO_URL`
- **Description**: The full URL to the GitHub repository directory containing the markdown files to be parsed (legacy static build fallback). The script extracts the owner, repo, and branch from this URL to interact with the GitHub REST API (`https://api.github.com/repos/{owner}/{repo}/tarball/{branch}`).
- **Required**: No
- **Default**: `https://github.com/ShunDa002/My-LLM-Wiki/tree/main/wiki`
- **Format**: `https://github.com/{owner}/{repo}/tree/{branch}/{path}`

*(Note: Currently, no authentication tokens are required as the target repository is public.)*
