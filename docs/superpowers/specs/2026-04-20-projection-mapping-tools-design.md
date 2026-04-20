# Projection Mapping Tools — Design Spec

**Date:** 2026-04-20
**Status:** Draft
**Scope:** Add HeavyM-style projection mapping capabilities to ArtRevive

## Overview

Add professional projection mapping tools to ArtRevive, enabling a full workflow from content creation through live performance. Users can define projection surfaces (2-4 simultaneously), warp content to fit real surfaces using GPU-accelerated deformation, and output to a projector in real-time.

## Use Case

Full design-to-live workflow. Users design projection mappings in advance (from photos or in-app), then execute live during performances/events. Target: artists, VJs, set designers, event producers working with 2-4 projection surfaces.

## Architecture

### Rendering Strategy: Hybrid Canvas 2D + WebGL

- **Canvas 2D:** Drawing tools, shape library, UI overlays, surface outlines, transform handles
- **WebGL:** Warp/deformation engine (mesh warp, bezier surface warp), live output rendering
- Extends existing `ProjectionCanvas.tsx` (Canvas 2D) and `GLCanvas.tsx` (WebGL)

### State Management

New Zustand store: `lib/mapping-store.ts`
- Separate from existing `artrevive-store.ts`
- Shared references for content ↔ surface linking
- Persists surface definitions, warp data, content assignments

## Section 1: Mode System & Navigation

Top tab bar replaces current mode selector. Four workflow stages:

### Create Tab
- All existing ArtRevive modes (Restyle, Glow Sculpture, House Projection, Loop) live here
- Upload/generate content that will later be mapped to surfaces
- Existing workspace UI stays mostly intact inside this tab

### Map Tab
- Upload reference photo of physical setup
- AI detects surfaces/edges, suggests projection zones
- Draw freehand zones with grid snapping
- Place shapes from typography library
- Define 2-4 named surfaces, assign content from Create tab

### Warp Tab
- Per-surface mesh warp (configurable grid density)
- Bezier surface warp for smooth curved surfaces
- Corner pin as simplest option
- Real-time preview of warped content on reference photo

### Live Tab
- Full-screen projector output (second window)
- Surface switching, opacity, blend controls
- Keyboard shortcuts for quick transitions
- Minimal UI — projection output + small control overlay

### Data Flow

```
Create (content) → Map (where) → Warp (fit) → Live (output)
```

Content produced in Create tab is assigned to surfaces in Map tab, deformed in Warp tab, and projected in Live tab.

## Section 2: Surface & Shape System

### Surface Data Model

```typescript
interface Surface {
  id: string
  name: string
  outline: SurfaceOutline       // Path data (freehand or shape-based)
  contentId: string | null      // Reference to generated artwork
  warpMode: 'corner-pin' | 'mesh' | 'bezier'
  warpData: CornerPin | MeshGrid | BezierSurface
  opacity: number               // 0-1
  blendMode: BlendMode
  visible: boolean
}

interface MeshGrid {
  cols: number                  // 2-8
  rows: number                  // 2-8
  points: Point[][]             // [row][col] control points
}

interface BezierHandle {
  inTangent: Point              // Incoming control handle offset
  outTangent: Point             // Outgoing control handle offset
}

interface BezierSurface {
  controlPoints: Point[][]      // 4x4 grid
  handles: BezierHandle[][]     // Tangent handles per point
}

interface SurfaceOutline {
  type: 'freehand' | 'shape' | 'detected'
  path: string                  // SVG path data
  points: Point[]               // Editable vertices
}
```

Maximum 4 surfaces per project.

### Shape Library — Typography Focus

- Hebrew letter outlines (alef through tav) as projection zones
- Latin letter outlines (A-Z)
- Text block shapes — type a word, get outline as projection zone
- Basic geometric frames (rectangle, circle, arch) for letter containment
- Custom text path — type text along a curve

Shapes stored as pre-built SVG path data (not runtime font parsing — ship as static asset library). Rendered to Path2D on canvas. Transform handles for scale/rotate/position.

### Freehand Drawing Tools

- **Polyline tool:** Click points, auto-close shape
- **Brush tool:** Smooth freehand, simplified to polygon on mouse release
- **Grid snapping:** Configurable (10/20/40/60px)
- **Edge snapping:** Snap to existing surface edges
- **Undo/redo:** Per-surface history stack

### Selection & Manipulation

- Click to select surface
- Transform handles: move, scale, rotate
- Double-click to edit individual points
- Shift-click for multi-select, group operations

## Section 3: Warp Engine (WebGL)

Three warp modes per surface, selectable in Warp tab:

### Corner Pin (Enhanced Existing)

- Current 4-point implementation stays as default
- Add numeric coordinate input for precision
- Preview gridlines showing perspective distortion

### Mesh Warp (New)

- Configurable grid density: 2x2, 3x3, 4x4, 6x6, 8x8
- Each grid intersection is a draggable control point
- GPU shader performs texture mapping per quad cell
- Bilinear interpolation within each cell
- Shift-constrain to axis movement

### Bezier Surface Warp (New)

- 4x4 control point grid with bezier tangent handles
- Smooth curved deformation without hard cell edges
- Suited for cylindrical/organic surfaces (pillars, domes, curved walls)
- GPU tessellates bezier patch into triangle mesh, samples source texture

### WebGL Implementation

- Extend existing `GLCanvas.tsx` with new shader programs
- Vertex shader: receives control points as uniforms, computes deformed UV coordinates
- Fragment shader: samples source texture at deformed coordinates
- One draw call per surface (4 surfaces max = 4 draw calls)
- Performance target: 60fps with 4 active surfaces at 1080p

### Reference Photo Overlay

- Photo from Map tab displayed as semi-transparent background in Warp tab
- Warped content composited on top for alignment verification
- Opacity slider for reference visibility
- Hotkey toggle on/off

## Section 4: Photo Mapping (AI-Assisted)

### Detection Flow (Map Tab)

1. User uploads photo of physical setup (stage, wall, objects)
2. Two detection paths run in parallel:
   - **Local edge detection:** Existing Sobel pipeline from `lib/alignment/edge-register.ts` — instant results
   - **AI detection:** Gemini request with structured prompt to identify flat surfaces and return bounding polygons
3. Detected zones appear as editable overlays on photo
4. User adjusts, deletes, or adds zones manually

### AI Integration

- Uses existing Gemini API integration (same key, same Pollinations fallback)
- Prompt requests structured JSON output: array of polygons with labels
- Response format: `[{label: "left wall", points: [[x,y],...]}, ...]`
- Parse polygons into Surface objects with detected outlines

### Manual Adjustment

- Each detected zone is an editable polygon
- Drag points to refine boundaries
- Delete false detections
- Add missed surfaces with freehand/shape tools
- Accept/reject individual detections independently

### No-Detection Mode

- Skip AI entirely — photo as reference backdrop only
- Draw surfaces manually on top
- For users without API key or who prefer full manual control

## Section 5: Live Performance Mode

### Projector Output

- Opens second browser window/tab — full-screen, no UI chrome
- Renders only warped surfaces on black background
- User drags window to projector display, enters fullscreen (F11)
- Main window stays on control screen for operator

### Control Overlay (Main Window)

Minimal, low-distraction UI:
- Per-surface: opacity slider, visible toggle, blend mode selector
- Master brightness control
- Blackout button (panic key)

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-4` | Toggle surface visibility |
| `B` | Blackout all surfaces |
| `Space` | Freeze/unfreeze output |
| `F` | Fade transition between content |
| `Arrow keys` | Cycle content on selected surface |

### Content Switching

- Each surface can queue multiple content pieces
- Arrow keys cycle through content on selected surface
- Crossfade transition with configurable duration (default: 500ms, range: 0-3000ms)

### Performance Budget

- Render loop: `requestAnimationFrame`, target 60fps
- Projector window: OffscreenCanvas or shared WebGL context
- No AI calls during live mode — all content pre-baked
- Minimal DOM updates, pure canvas rendering

## Out of Scope

- MIDI control (architecture allows future addition)
- Audio reactive mode (planned, separate spec)
- DMX/lighting protocol integration
- Multi-projector edge blending
- 3D object mapping (curved 3D meshes beyond bezier surfaces)

## File Structure (New/Modified)

```
lib/
  mapping-store.ts              # New Zustand store for mapping state
  mapping/
    surface.ts                  # Surface CRUD, outline management
    shapes.ts                   # Shape library (SVG paths, typography)
    warp-engine.ts              # Mesh + bezier warp math
    photo-detect.ts             # AI + edge detection orchestrator
    live-output.ts              # Projector window management

components/
  mapping/
    ModeTabBar.tsx              # Create|Map|Warp|Live tabs
    MapCanvas.tsx               # Surface drawing/editing canvas (Canvas 2D)
    WarpCanvas.tsx              # Warp preview canvas (WebGL)
    LiveCanvas.tsx              # Projector output canvas (WebGL)
    SurfacePanel.tsx            # Surface list, properties
    ShapeLibrary.tsx            # Typography shape picker
    DrawingToolbar.tsx          # Freehand/shape/select tools
    WarpControls.tsx            # Warp mode selector, grid density
    LiveControls.tsx            # Performance controls, shortcuts
    PhotoUpload.tsx             # Reference photo upload + detection UI
    DetectionOverlay.tsx        # AI-detected zones overlay

app/
  api/
    detect-surfaces/
      route.ts                  # Gemini surface detection endpoint

shaders/
  mesh-warp.vert                # Mesh warp vertex shader
  mesh-warp.frag                # Mesh warp fragment shader
  bezier-warp.vert              # Bezier surface vertex shader
  bezier-warp.frag              # Bezier surface fragment shader
```
