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

    // Step 1: Use Gemini vision to describe the image so we can feed it into Imagen 3
    const describeBody = {
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
          { text: 'Describe this image in detail: the subject, pose, composition, setting, colors, and any notable visual elements. Be specific and concise (3-4 sentences).' },
        ],
      }],
    };

    const describeRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(describeBody) }
    );
    if (!describeRes.ok) {
      const t = await describeRes.text();
      throw new Error(`Gemini vision error ${describeRes.status}: ${t.slice(0, 300)}`);
    }
    const describeJson = await describeRes.json();
    const description = describeJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'a person in an artistic pose';

    // Step 2: Generate styled image with Imagen 3 using the description + style prompt
    const stylePrompt = buildPrompt(settings, description);

    const imagenBody = {
      instances: [{ prompt: stylePrompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
      },
    };

    const imagenRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(imagenBody) }
    );

    if (!imagenRes.ok) {
      const t = await imagenRes.text();
      throw new Error(`Imagen 3 error ${imagenRes.status}: ${t.slice(0, 300)}`);
    }

    const imagenJson = await imagenRes.json();
    const prediction = imagenJson?.predictions?.[0];
    if (!prediction?.bytesBase64Encoded) {
      throw new Error('No image returned from Imagen 3');
    }

    return {
      imageBase64: prediction.bytesBase64Encoded,
      mimeType: prediction.mimeType ?? 'image/png',
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

function buildPrompt(settings: RestyleSettings, imageDescription?: string): string {
  const presetBase = getPresetBasePrompt(settings.preset);
  const userPrompt = settings.prompt.trim();
  const subject = imageDescription ? `Subject: ${imageDescription}.` : '';

  return [
    presetBase,
    subject,
    userPrompt ? `Additional style direction: ${userPrompt}.` : '',
    'Output should be projection-ready with high contrast against dark backgrounds.',
    'Maintain the original subject composition and pose faithfully.',
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
