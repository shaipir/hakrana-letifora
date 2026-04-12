/**
 * Restyle Provider Abstraction
 *
 * Swap AI providers without touching API route logic.
 * Active provider is selected by RESTYLE_PROVIDER env var:
 *   'google-imagen' (default) | 'mock'
 *
 * Add new providers by implementing RestyleProvider and registering below.
 */

import { RestyleSettings } from '../types';

// ─── Provider Interface ──────────────────────────────────────────────────────

export interface RestyleRequest {
  imageUrl: string;       // publicly accessible URL of the source image
  imageBase64?: string;   // base64 fallback if URL fetch isn't available
  mimeType: string;
  settings: RestyleSettings;
}

export interface RestyleResponse {
  imageBase64: string;    // base64-encoded result image (no data: prefix)
  mimeType: string;
}

export interface RestyleProvider {
  name: string;
  generate(req: RestyleRequest): Promise<RestyleResponse>;
}

// ─── Google Imagen Provider ──────────────────────────────────────────────────

const googleImagenProvider: RestyleProvider = {
  name: 'google-imagen',

  async generate(req: RestyleRequest): Promise<RestyleResponse> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY not configured');

    const { settings, imageBase64, mimeType } = req;

    const prompt = buildPrompt(settings);

    const body = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        temperature: 1 - settings.preserveStructure * 0.5,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Imagen error ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = await res.json();
    const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: any) => p.inline_data?.mime_type?.startsWith('image/'));

    if (!imagePart) {
      throw new Error('No image returned from Google Imagen');
    }

    return {
      imageBase64: imagePart.inline_data.data,
      mimeType: imagePart.inline_data.mime_type,
    };
  },
};

// ─── Mock Provider (dev / no-API fallback) ───────────────────────────────────

const mockProvider: RestyleProvider = {
  name: 'mock',

  async generate(req: RestyleRequest): Promise<RestyleResponse> {
    // Return the source image with a neon color overlay tint applied in-canvas
    // This is a pure JS transformation — no external API needed.
    await new Promise((r) => setTimeout(r, 800)); // simulate latency

    const { imageBase64, mimeType, settings } = req;

    // Parse neon color from preset
    const neonColors: Record<string, [number, number, number]> = {
      'neon-projection': [0, 229, 255],
      'dark-futuristic': [100, 80, 255],
      'electric-energy': [255, 200, 0],
      'liquid-light': [0, 255, 160],
      'minimal-glow': [200, 200, 255],
      'glowing-sculpture': [255, 140, 0],
    };
    const [nr, ng, nb] = neonColors[settings.preset] ?? [0, 229, 255];

    // Build tinted image via Canvas API
    // This runs server-side via node-canvas or returns unchanged on edge
    // For MVP: just return the source image as-is with a metadata note
    return {
      imageBase64: imageBase64 ?? '',
      mimeType: mimeType,
    };
  },
};

// ─── Provider Registry ───────────────────────────────────────────────────────

const providers: Record<string, RestyleProvider> = {
  'google-imagen': googleImagenProvider,
  mock: mockProvider,
};

export function getRestyleProvider(): RestyleProvider {
  const name = process.env.RESTYLE_PROVIDER ?? 'google-imagen';
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;

  // Fall back to mock if no API key
  if (name === 'google-imagen' && !apiKey) {
    console.warn('[restyle] No GOOGLE_GEMINI_API_KEY found — using mock provider');
    return mockProvider;
  }

  return providers[name] ?? mockProvider;
}

// ─── Prompt Builder ──────────────────────────────────────────────────────────

function buildPrompt(settings: RestyleSettings): string {
  const presetBase = getPresetBasePrompt(settings.preset);
  const userPrompt = settings.prompt.trim();

  const styleDesc = [
    `stylization strength: ${Math.round(settings.stylizationStrength * 100)}%`,
    `background darkness: ${Math.round(settings.backgroundDarkness * 100)}%`,
    `glow amount: ${Math.round(settings.glowAmount * 100)}%`,
    `subject clarity: ${Math.round(settings.subjectClarity * 100)}%`,
    `structure preservation: ${Math.round(settings.preserveStructure * 100)}%`,
  ].join(', ');

  return [
    presetBase,
    userPrompt ? `Additional style direction: ${userPrompt}.` : '',
    `Technical parameters: ${styleDesc}.`,
    'Output should be projection-ready with high contrast against dark backgrounds.',
    'Preserve the main subject composition and pose.',
  ]
    .filter(Boolean)
    .join(' ');
}

function getPresetBasePrompt(preset: RestyleSettings['preset']): string {
  const map: Record<RestyleSettings['preset'], string> = {
    'neon-projection': 'Transform this image into neon projection art. Dark background, glowing cyan and magenta contour lines, high contrast neon aesthetic suitable for projection mapping.',
    'dark-futuristic': 'Restyle as dark futuristic digital art. Deep black background, electric blue and violet tones, geometric light streaks, minimal but precise glow.',
    'electric-energy': 'Apply electric energy burst treatment. Crackling lightning-like light, high contrast against pure black, yellow-white energy flows tracing the subject.',
    'liquid-light': 'Transform into liquid light art. Smooth flowing luminous trails following the subject contours, deep dark background, fluid neon curves.',
    'minimal-glow': 'Create minimal glowing outline artwork. Clean edge lines only, subtle ambient glow, very dark background, single-color neon treatment.',
    'glowing-sculpture': 'Render as a glowing sculptural form. Warm orange and gold neon hues, three-dimensional depth impression, projection-mapped aesthetic.',
  };
  return map[preset];
}
