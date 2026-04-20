# Edge-Based Frame Alignment

## Problem

Generated frames drift in position/scale/perspective between frames and vs the original photo. For projection mapping, the building must stay pixel-locked across all outputs.

## Solution

Automatic edge-based registration. After each frame generates, detect building bounds via Sobel edge detection at 512px, compute alignment transform relative to original, apply at full res, crop overflow.

## Architecture

### New Module: `lib/alignment/edge-register.ts`

Three functions:

1. **`extractBuildingBounds(imageDataUrl: string): Promise<BuildingBounds>`**
   - Load image onto 512px-wide canvas
   - Run Sobel edge detection (reuse logic from canvas-transform.ts)
   - Find largest edge-dense bounding box (building region)
   - Return `{ bbox: {x, y, w, h}, scale: ratio-to-original }`

2. **`computeAlignment(originalBounds: BBox, frameBounds: BBox): AlignTransform`**
   - Calculate translate (tx, ty) and scale (sx, sy) to map frameBounds onto originalBounds
   - Return `{ tx, ty, sx, sy }`

3. **`applyAlignment(frameDataUrl: string, transform: AlignTransform, originalSize: {w, h}): Promise<string>`**
   - Draw frame on canvas with transform applied (translate + scale)
   - Crop to original image dimensions
   - Return aligned dataUrl

### Types

```typescript
interface BBox { x: number; y: number; w: number; h: number }
interface BuildingBounds { bbox: BBox; scale: number }
interface AlignTransform { tx: number; ty: number; sx: number; sy: number }
```

### Store Changes: `lib/artrevive-store.ts`

- Add `originalBounds: BuildingBounds | null` to state
- Set on upload (extract once, cache)
- Clear on `clearUploadedAsset`

### Integration: `components/workspace/TopBar.tsx`

- After single generation: align frame before `addGeneratedAsset`
- After loop generation: align each frame before `setGeneratedLoop`

### Edge Detection

Reuse Sobel approach from `lib/restyle/canvas-transform.ts` (lines 259-271). Extract into shared utility or duplicate the ~20 lines into edge-register.

### Bounding Box Detection

- Threshold edge map (pixel intensity > threshold = edge pixel)
- Find connected regions or use simple row/col scan to find outermost edge pixels
- Return bounding box of the dominant edge cluster (largest contiguous area)

### Overflow Handling

After alignment transform, any content outside original image dimensions is clipped by the canvas crop. Building stays locked; artistic overflow gets cut.

## Performance

- 512px edge detection: ~30-50ms per frame
- 10-frame loop: ~500ms total
- Negligible vs 3-10s generation time per frame

## Files Changed

| File | Change |
|------|--------|
| `lib/alignment/edge-register.ts` | NEW — alignment engine |
| `lib/artrevive-store.ts` | Add `originalBounds` to state |
| `lib/types.ts` | Add alignment types |
| `components/workspace/TopBar.tsx` | Call alignment after generation |
| `components/canvas/LoopPlayer.tsx` | No change (receives pre-aligned frames) |
