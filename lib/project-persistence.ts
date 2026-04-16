import { ArtworkProject, GenerationHistoryItem } from './types';

const STORAGE_KEY = 'artrevive_project_v2';
const HISTORY_KEY = 'artrevive_history_v2';
const MAX_HISTORY_ITEMS = 50;
// localStorage quota guard: ~4MB conservative limit
const MAX_STORAGE_BYTES = 4 * 1024 * 1024;

/** Estimate rough byte size of a string */
function byteSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Strip large data URLs from generatedAssets to keep storage size manageable.
 * Each asset keeps a tiny 80px thumbnail for history display.
 */
async function compressAssetUrl(dataUrl: string): Promise<string> {
  if (typeof window === 'undefined') return dataUrl;
  if (!dataUrl.startsWith('data:image/')) return dataUrl;
  try {
    return await new Promise<string>((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 80 / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  } catch {
    return dataUrl;
  }
}

/** Prepare project for storage: compress asset thumbnails to save space */
async function prepareForStorage(project: ArtworkProject): Promise<ArtworkProject> {
  const compressedAssets = await Promise.all(
    project.generatedAssets.map(async (a) => ({
      ...a,
      url: await compressAssetUrl(a.url),
    }))
  );

  const uploadedAsset = project.uploadedAsset
    ? { ...project.uploadedAsset, url: await compressAssetUrl(project.uploadedAsset.url) }
    : null;

  return { ...project, generatedAssets: compressedAssets, uploadedAsset };
}

/** Save current project to localStorage. Non-blocking — errors are swallowed. */
export async function saveProjectToStorage(project: ArtworkProject): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const prepared = await prepareForStorage(project);
    const json = JSON.stringify(prepared);
    if (byteSize(json) > MAX_STORAGE_BYTES) {
      // Strip assets entirely if still too big
      const stripped = { ...prepared, generatedAssets: [], uploadedAsset: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    } else {
      localStorage.setItem(STORAGE_KEY, json);
    }
  } catch (e) {
    console.warn('[ArtRevive] Failed to save project to localStorage:', e);
  }
}

/** Load project from localStorage. Returns null if nothing saved. */
export function loadProjectFromStorage(): ArtworkProject | null {
  if (typeof window === 'undefined') return null;
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as ArtworkProject;
  } catch {
    return null;
  }
}

/** Clear saved project */
export function clearProjectFromStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Save a generation history item to the history list */
export function appendGenerationHistory(item: GenerationHistoryItem): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadGenerationHistory();
    const updated = [item, ...existing].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[ArtRevive] Failed to save history:', e);
  }
}

/** Load all generation history items */
export function loadGenerationHistory(): GenerationHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const json = localStorage.getItem(HISTORY_KEY);
    if (!json) return [];
    return JSON.parse(json) as GenerationHistoryItem[];
  } catch {
    return [];
  }
}

/** Delete a single history item by id */
export function deleteHistoryItem(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadGenerationHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.filter((h) => h.id !== id)));
  } catch { /* ignore */ }
}

/** Clear all history */
export function clearAllHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}
