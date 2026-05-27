# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DanpentekiBoard is a whiteboard-style dialogue flow editor for game/story scenario writing. Users place conversation nodes (fields) on a canvas, connect them to define flow, and preview dialogue sequences. All data is stored client-side in IndexedDB — there is no backend.

## Commands

```bash
npm run dev          # Start dev server (Turbopack) at localhost:3000
npm run build        # Production build (Next.js)
npm run lint         # ESLint
```

No test framework is configured.

## Architecture

**Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict)  
**Canvas**: @xyflow/react v12 (React Flow) for node graph rendering  
**Path alias**: `@/*` → `src/*`

### State Flow

```
page.tsx (orchestrator)
  └─ useWorkspace() hook — single source of truth for all workspace data
       ├─ useUndoRedo() — snapshot-based history (50 max)
       └─ IndexedDB (idb) — auto-save with 500ms debounce
```

`useWorkspace` holds the entire `Workspace` object (fields, connections, characters, groups, viewport) and exposes CRUD operations. Components receive data and callbacks as props from `page.tsx`.

### Data Model Hierarchy

```
Workspace
  ├─ Character[] (name, emotions, icon)
  ├─ DialogueField[] (label, position, width, blocks[])
  │    └─ DialogueBlock[] (characterId, emotion, text)
  ├─ Connection[] (source/target field + handle)
  └─ FieldGroup[] (name, color, fieldIds[])
```

### Key Component Relationships

- **WhiteboardCanvas** — React Flow wrapper. Converts workspace fields to React Flow nodes, handles selection, pan/zoom, drag-to-connect, and double-click-to-create.
- **DialogueFieldNode** — Custom React Flow node rendering a single field card with blocks, handles, and resize control.
- **GroupNode** — Non-interactive React Flow node (zIndex -1) that renders a dashed colored border around grouped fields.
- **SelectionToolbar** — Floating menu above multi-selected nodes (group create, bulk delete).
- **PreviewPane** — Right panel showing connected dialogue flow from selected field.
- **BlockTextarea** — Debounced (300ms) textarea with IME composition handling and keyboard shortcuts.

### Canvas Interaction Model

- Left drag on empty canvas = rectangle selection
- Middle/Right button drag = pan
- Shift+click = add to selection
- Double-click canvas = create new field
- Drag handle to empty space = create connected field
- Alt+click handle = remove connection
- Field right edge drag = resize width (NodeResizeControl)

### Storage Layer (`src/lib/storage.ts`)

IndexedDB stores: `workspaces` (full Workspace objects) and `images` (Blob for character icons). `migrateWorkspace()` handles backward compatibility for schema additions.

### Undo/Redo (`src/hooks/useUndoRedo.ts`)

Snapshot-based: captures `{ fields, connections, characters, groups }`. Viewport and metadata are excluded. Max 50 history entries.

## Style Conventions

- UI language is Japanese
- Visual theme: analog/paper aesthetic (CSS variables: `--paper-*`, `--ink-*`, `--rule`)
- Font classes: `.hand` (display), `.mono` (code)
- Component-scoped inline styles are common; globals.css for framework overrides and shared utilities
