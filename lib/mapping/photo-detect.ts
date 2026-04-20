import { DetectedZone } from '@/lib/mapping-types';

export interface DetectionResult {
  zones: DetectedZone[];
  method: 'ai' | 'edge' | 'both';
}

export async function detectSurfaces(
  imageBase64: string,
  mimeType: string,
  apiKey?: string,
): Promise<DetectionResult> {
  const zones: DetectedZone[] = [];
  if (apiKey) {
    try {
      const res = await fetch('/api/detect-surfaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, apiKey }),
      });
      if (res.ok) {
        const data = await res.json();
        zones.push(...data.zones);
      }
    } catch (e) {
      console.warn('AI detection failed');
    }
  }
  return { zones, method: zones.length > 0 ? 'ai' : 'edge' };
}
