// lib/mapping/live-output.ts
// Manages the projector popup window for live performance output.

let projectorWindow: Window | null = null;

/**
 * Opens a popup window sized for a projector (1920×1080) and writes a
 * minimal HTML document containing a full-viewport canvas element.
 * Returns the new Window object (or the existing one if already open).
 */
export function openProjectorWindow(): Window {
  if (projectorWindow && !projectorWindow.closed) {
    projectorWindow.focus();
    return projectorWindow;
  }

  const features = [
    'width=1920',
    'height=1080',
    'left=0',
    'top=0',
    'menubar=no',
    'toolbar=no',
    'location=no',
    'status=no',
    'scrollbars=no',
    'resizable=yes',
  ].join(',');

  const win = window.open('', 'projector', features);
  if (!win) {
    throw new Error('Failed to open projector window. Check popup blocker settings.');
  }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Projector Output</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    canvas { display: block; width: 100%; height: 100%; cursor: none; }
  </style>
</head>
<body>
  <canvas id="projector-canvas"></canvas>
  <script>
    const canvas = document.getElementById('projector-canvas');
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
  </script>
</body>
</html>`);
  win.document.close();

  projectorWindow = win;
  return win;
}

/**
 * Closes the projector window if it is open and clears the module-level ref.
 */
export function closeProjectorWindow(): void {
  if (projectorWindow && !projectorWindow.closed) {
    projectorWindow.close();
  }
  projectorWindow = null;
}

/**
 * Returns the <canvas id="projector-canvas"> element from the projector
 * window, or null if the window is closed or the element is not yet ready.
 */
export function getProjectorCanvas(): HTMLCanvasElement | null {
  if (!projectorWindow || projectorWindow.closed) return null;
  try {
    return projectorWindow.document.getElementById(
      'projector-canvas',
    ) as HTMLCanvasElement | null;
  } catch {
    return null;
  }
}

/**
 * Returns true when the projector window is open and not closed.
 */
export function isProjectorOpen(): boolean {
  return projectorWindow !== null && !projectorWindow.closed;
}
