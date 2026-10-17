# UI Contract: AI Chat Citation Click, Scroll & Pulse Highlighting

## Overview
Defines the component contract, DOM identifiers, and event behavior for clicking inline citation buttons in assistant message bubbles, auto-expanding the `SourcesAccordion`, smooth scrolling `#chat-message-viewport`, and applying animated pulsing highlights to the corresponding source item.

---

## Component Interfaces

### `SourcesAccordionProps`
```typescript
interface SourcesAccordionProps {
  sources: Source[];
  activeCitation?: number | null;
  pulseTrigger?: number; // Sequence counter to trigger re-scroll and pulse on repeated clicks
  onSelectSource?: (source: Source) => void;
}
```

---

## DOM Identifiers

| Identifier | Type | Description |
|---|---|---|
| `#chat-message-viewport` | Container | Scrollable message history viewport (`overflow-y-auto`) |
| `#sources-accordion` | Component Container | Outer container of the sources accordion |
| `#sources-accordion-toggle` | Button | Toggle button expanding/collapsing the source items |
| `#sources-accordion-content` | Motion Container | Collapsible panel containing individual source items |
| `#source-item-${citation}` | Item Card | Individual source entry element corresponding to citation number `${citation}` |
| `button[data-citation="${citation}"]` | Button | Inline bracket button `[N]` in assistant message text |

---

## Event & State Flow

1. **Inline Citation Click (`[N]`)**:
   - When an inline citation button `[N]` is clicked in an assistant message:
     - Check if `sources.some(s => s.citation === N)`.
     - **If found**:
       1. Set `activeCitation = N`.
       2. Increment `pulseTrigger`.
       3. If `SourcesAccordion` is closed (`isOpen === false`), trigger auto-expansion (`setIsOpen(true)`).
       4. Target `#source-item-${N}` and call `element.scrollIntoView({ behavior: 'smooth', block: 'center' })`.
       5. Apply pulsing highlight classes: `ring-2 ring-indigo-400 border-l-2 border-indigo-400 bg-indigo-950/80 animate-pulse`.
     - **If NOT found**:
       - Gracefully ignore the click event (no-op; do not throw errors or alter viewport scroll).

2. **Repeated Clicks**:
   - When the user clicks the active citation `[N]` again:
     - `pulseTrigger` increments.
     - Accordion remains open (does NOT collapse).
     - `#source-item-${N}` re-centers in viewport and restarts the pulsing highlight animation.

3. **Isolation Guarantee**:
   - Clicking citation buttons or source items MUST NOT mutate graph store state (`useGraphStore`), camera position, or Note Preview panel.
