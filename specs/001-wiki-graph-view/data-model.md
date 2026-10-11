# Data Model

## GraphNode
Represents a Markdown note fetched from the API. Attributes may be supplied directly as flat properties on the node (standard FastAPI format) or nested within `metadata`.
- `id`: string (Canonical node ID / path, e.g., `concepts/Agentic AI.md`)
- `title` / `label`: string (Note title; `label` defaults to `title` or `id` if omitted)
- `type`: string (e.g., 'concept', 'source', 'note', 'index')
- `path`: string (File path relative to wiki root)
- `folder`: string (Folder grouping, e.g. `concepts`, `sources`)
- `tags`: string[]
- `aliases`: string[]
- `excerpt`: string
- `status`: string (e.g. 'active', 'draft')
- `incomingCount`: number
- `outgoingCount`: number
- `isOrphan`: boolean
- `metadata`: object (contains the canonical normalized metadata fields above for UI components)

## GraphEdge
Represents a connection between two notes.
- `id`: string (e.g. `source->target`)
- `source`: string (Source Node ID)
- `target`: string (Target Node ID)
- `type`: string (wikilink, markdown, embed)

## UnresolvedLink / BrokenLink
Represents a broken or ambiguous link.
- `source` / `sourceId`: string (Source Node ID)
- `target` / `linkText` / `rawTarget`: string (Attempted link text)
- `type`: string

## GraphResponse
The expected payload from `GET /graph`.
- `schemaVersion`: string
- `generatedAt`: string
- `sourceVersion`: string
- `metadata`: object (e.g., nodeCount, edgeCount, brokenLinkCount, orphanCount)
- `nodes`: GraphNode[]
- `edges`: GraphEdge[]
- `unresolvedLinks` / `brokenLinks`: UnresolvedLink[]

## LayoutAlgorithm
Supported spatial arrangement strategies rendered in the HTML5 Canvas engine:
- `'force'`: Force-directed organic physics simulation (spring attraction, Barnes-Hut repulsion, velocity damping)
- `'dagre-tb'`: Hierarchical top-down directed acyclic graph layout
- `'dagre-lr'`: Hierarchical left-right directed acyclic graph layout
- `'grid'`: Deterministic 2D grid matrix ordered by degree centrality
- `'radial'`: Concentric radial rings expanding from core hubs outward

## LayoutCoordinates
Computed spatial coordinates for Canvas nodes:
- `id`: string (Node ID)
- `x`: number (Target X coordinate in Canvas world space)
- `y`: number (Target Y coordinate in Canvas world space)

## SimNode (Unified Canvas Node Entity)
Extended node model for the 60fps HTML5 Canvas physics & multi-layout engine:
- `id`, `label`, `type`, `folder`, `tags`, `excerpt`: string / string[]
- `incomingCount`, `outgoingCount`, `degree`: number (Calculated degree centrality)
- `radius`: number (Dynamic visual hierarchy scale: 5.5px - 22.0px)
- `isIndex`: boolean (Flag for root index / Map of Content pillars)
- `isOrphan`: boolean (Isolated node status)
- `x`, `y`: number (Current active world space coordinates)
- `vx`, `vy`: number (Physics velocity vectors, used during `'force'` mode)
- `fx`, `fy`: number | null (Optional pin coordinates during user dragging)
- `startX`, `startY`: number (Origin coordinates during layout transition tweening)
- `targetX`, `targetY`: number (Destination coordinates during layout transition tweening)
- `mass`: number (Inertial mass scaling with degree)

## SimEdge (Canvas Connection Entity)
- `id`: string
- `source`, `target`: string (Node IDs)
- `type`: string
- `sourceNode`, `targetNode`: SimNode (Resolved reference pointers)

## DegreeStats
Graph-wide degree distribution metrics used for adaptive label placement and radius scaling:
- `minDegree`, `maxDegree`, `medianDegree`, `averageDegree`: number

## NeonNodeTheme & NeonColorCategory
Visual contract for the "Neon" theme:
- `category`: `'cyan' | 'magenta' | 'yellow' | 'blue' | 'amber'`
- `categoryLabel`: string (`'Hub'`, `'Concept'`, `'Source'`, `'Note'`, `'Orphan'`)
- `accentHex`: string (Pure solid fluorescent color: `#00f0ff`, `#ff2a85`, `#ffe600`, `#38bdf8`, `#fb923c`)
- `glowRgba`: string (Soft bloom aura)
- `borderRgba`: string (Delicate perimeter rim)
- `textColor`: string (Label typography color)
- `pillBg`: string (Translucent deep navy label pill background)
