# ArtRevive MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the existing Hakrana Letifora projection-mapping app into ArtRevive MVP — a creative visual tool for reviving still images into projection-ready digital art.

**Architecture:** Single-page workspace layout with dark UI. Two modes: Restyle (AI-powered stylization via Google Imagen) and Neon Contour (Canvas 2D pipeline). Vercel Blob for storage. Provider abstraction for AI (easy to swap).

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS 3, Zustand, Canvas 2D API, Vercel Blob, Google Gemini/Imagen API, Anthropic Claude API (optional).

---

## Phase 1 — Foundation
- Types (lib/types.ts extended)
- Store (lib/artrevive-store.ts)
- Layout (app/layout.tsx, app/globals.css)

## Phase 2 — Upload & Storage
- POST /api/upload (Vercel Blob)
- UploadZone component

## Phase 3 — Neon Contour Engine
- lib/neon-contour/pipeline.ts
- lib/neon-contour/animator.ts
- components/canvas/NeonContourCanvas.tsx

## Phase 4 — Restyle Mode
- lib/restyle/provider.ts + mock
- POST /api/restyle
- POST /api/neon-contour
- POST /api/export

## Phase 5 — Workspace UI
- components/workspace/TopBar.tsx
- components/workspace/RestylePanel.tsx
- components/workspace/NeonContourPanel.tsx
- components/workspace/CanvasArea.tsx
- components/workspace/HistoryPanel.tsx
- app/page.tsx (main workspace)

## Phase 6 — Export
- Still export for both modes

## Phase 7 — Polish
- Empty state, loading states, error states
