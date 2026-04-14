import { NextRequest, NextResponse } from 'next/server';
import { HouseProjectionSettings } from '@/lib/types';
import { buildHouseProjectionPrompt } from '@/lib/house-projection/prompt-builder';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-exp-image-generation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, settings, apiKey: bodyKey } = body as {
      imageBase64: string;
      mimeType: string;
      settings: HouseProjectionSettings;
      apiKey?: string;
    };

    if (!imageBase64 || !settings) {
      return NextResponse.json({ error: 'imageBase64 and settings required' }, { status: 400 });
    }

    const apiKey = bodyKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const { transformPrompt, debugInfo } = buildHouseProjectionPrompt(settings);

    console.log('HOUSE_PROJECTION_WORLD', debugInfo.worldPreset);
    console.log('HOUSE_PROJECTION_HAS_API_KEY', !!apiKey);
    console.log('HOUSE_PROJECTION_PROMPT', transformPrompt.slice(0, 300));

    const errors: string[] = [];

    // ── Attempt 1: Gemini image-to-image ─────────────────────────────────
    if (apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: mimeType, data: imageBase64 } },
                  { text: transformPrompt },
                ],
              }],
              generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
            }),
          }
        );
        if (res.ok) {
          const json = await res.json();
          const imgPart = (json?.candidates?.[0]?.content?.parts ?? [])
            .find((p: any) => p.inline_data?.mime_type?.startsWith('image/'));
          if (imgPart) {
            console.log('HOUSE_PROJECTION_PROVIDER', 'google');
            console.log('HOUSE_PROJECTION_MODEL', GEMINI_IMAGE_MODEL);
            console.log('HOUSE_PROJECTION_FALLBACK', false);
            return NextResponse.json({
              url: `data:${imgPart.inline_data.mime_type};base64,${imgPart.inline_data.data}`,
              provider: 'google',
              model: GEMINI_IMAGE_MODEL,
            });
          }
          errors.push('gemini: no image in response');
        } else {
          errors.push(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
        }
      } catch (e: any) { errors.push(`gemini: ${e?.message}`); }
    } else {
      errors.push('no API key');
    }

    // ── Fallback: Return Pollinations URL directly (browser fetches it) ────
    const encoded = encodeURIComponent(transformPrompt.slice(0, 500));
    const seed = Math.floor(Math.random() * 99999);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;

    console.log('HOUSE_PROJECTION_PROVIDER', 'pollinations');
    console.log('HOUSE_PROJECTION_MODEL', 'flux');
    console.log('HOUSE_PROJECTION_FALLBACK', true);

    return NextResponse.json({
      pollinationsUrl,
      provider: 'pollinations',
      model: 'flux',
      fallback: true,
      fallbackReason: errors.join('; '),
    });

  } catch (err: any) {
    console.error('[house-projection] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Transform failed' }, { status: 500 });
  }
}
