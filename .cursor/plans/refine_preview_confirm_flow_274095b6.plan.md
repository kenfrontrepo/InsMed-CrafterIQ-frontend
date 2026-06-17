---
name: Refine Preview Confirm Flow
overview: "Wire up the full refine flow: migrate chart options to React Query, add preview/confirm/discard with two new API routes, and show a preview overlay with action buttons on the PinCard."
todos:
  - id: api-preview
    content: Create POST proxy route at app/(app)/api/boards/reformat-preview/route.ts
    status: completed
  - id: api-updatevisual
    content: Create PUT proxy route at app/(app)/api/boards/updatevisual/route.ts
    status: completed
  - id: refine-popover-rq
    content: Migrate RefinePopover from manual fetch to React Query useQuery
    status: completed
  - id: pincard-preview
    content: Add preview state, preview mutation, confirm mutation, discard/confirm UI to PinCard
    status: completed
  - id: cleanup-onrefine
    content: Remove onRefine prop from PinGrid, PinCard props, and detail page handleRefine
    status: completed
isProject: false
---

# Refine: Preview, Discard, and Confirm Flow

## User Flow

```mermaid
sequenceDiagram
  participant User
  participant PinCard
  participant RefinePopover
  participant PreviewAPI as "reformat/preview API"
  participant UpdateAPI as "updatevisual API"

  User->>RefinePopover: Clicks sparkle icon
  RefinePopover->>RefinePopover: useQuery fetches chartoptions
  RefinePopover-->>User: Shows chart type grid
  User->>RefinePopover: Clicks a chart type
  RefinePopover->>PinCard: onSelect(chartType)
  PinCard->>PreviewAPI: POST reformat/preview
  PreviewAPI-->>PinCard: preview_spec
  PinCard-->>User: Renders preview + Discard/Confirm
  alt Discard
    User->>PinCard: Clicks Discard
    PinCard-->>User: Reverts to original
  else Confirm
    User->>PinCard: Clicks Confirm
    PinCard->>UpdateAPI: PUT updatevisual
    UpdateAPI-->>PinCard: success
    PinCard->>PinCard: Invalidates board-data query
    PinCard-->>User: Shows saved chart
  end
```



## Files to Change

### 1. New: `[app/(app)/api/boards/reformat-preview/route.ts](app/(app)/api/boards/reformat-preview/route.ts)`

POST proxy to `${API_BASE_URL}/crafteriq/boards/reformat/preview/{boardId}/{userId}` with body `{ pin_id, chart_type }`. Follows the same pattern as `[app/(app)/api/boards/update/route.ts](app/(app)/api/boards/update/route.ts)`.

### 2. New: `[app/(app)/api/boards/updatevisual/route.ts](app/(app)/api/boards/updatevisual/route.ts)`

PUT proxy to `${API_BASE_URL}/crafteriq/boards/updatevisual/{boardId}/{userId}` with body `{ pin_id, visual_spec }`.

### 3. Modify: `[components/boards/refine-popover.tsx](components/boards/refine-popover.tsx)`

Replace the manual `useState`/`useEffect`/`fetch` pattern with React Query `useQuery`:

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["chart-options", boardId, pinId, userId],
  queryFn: () => fetch(`/api/boards/chartoptions?...`).then(r => r.json()),
  enabled: open,  // only fetch when popover is open
});
```

Remove `chartOptions`, `loading`, `error` local states and the `fetchOptions` callback + `useEffect`. Derive `chartOptions` from `data?.compatible_charts`.

### 4. Modify: `[components/boards/pin-card.tsx](components/boards/pin-card.tsx)` -- main logic

This is the core change. Add preview state and mutation logic inside `PinCard`:

**New state:**

- `previewSpec: VisualSpec | null` -- holds the preview visual spec when a chart type is selected
- `isPreviewing: boolean` -- derived from `previewSpec !== null`

**Preview mutation** (`useMutation`):

- Calls `POST /api/boards/reformat-preview` with `{ boardId, userId, pin_id, chart_type }`
- On success, sets `previewSpec` to the returned `preview_spec` (as VisualSpec)

**Confirm mutation** (`useMutation`):

- Calls `PUT /api/boards/updatevisual` with `{ boardId, userId, pin_id, visual_spec: previewSpec }`
- On success, invalidates `["board-data"]` query via `useQueryClient()`, clears `previewSpec`

**Discard handler:** Simply sets `previewSpec` back to `null`.

**Rendering changes:**

- The `ChatChart` renders `previewSpec ?? visualSpec` -- so when previewing, the chart updates live
- When `previewSpec` is set, show a **Discard / Confirm button bar** at the bottom of the card (above the chart or below it, overlaying the card footer):

```
+-------------------------------+
| Title            [Refine] [..]|
|                               |
|     (chart preview area)      |
|                               |
| [Discard]           [Confirm] |
+-------------------------------+
```

- Discard button: outlined/ghost style
- Confirm button: primary style with loading spinner when confirming
- Both buttons appear with animation (slide in from bottom)

**Prop changes:**

- Remove `onRefine` prop (no longer needed -- PinCard handles everything internally)
- `boardId` and `userId` remain required for the mutations

### 5. Modify: `[components/boards/pin-grid.tsx](components/boards/pin-grid.tsx)`

Remove `onRefine` from `PinGridProps` and from the `PinCard` usage. Only `boardId` and `userId` need to be threaded through.

### 6. Modify: `[app/(app)/Boards/detail/page.tsx](app/(app)/Boards/detail/page.tsx)`

- Remove the `handleRefine` callback (no longer needed)
- Remove `onRefine` from the `PinGrid` props
- Keep passing `boardId` and `userId` to `PinGrid`

