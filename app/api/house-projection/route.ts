import { NextRequest, NextResponse } from 'next/server';
import { HouseProjectionSettings } from '@/lib/types';
import { buildHouseProjectionPrompt } from '@/lib/house-projection/prompt-builder';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

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
                  { inlineData: { mimeType: mimeType, data: imageBase64 } },
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
            .find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
          if (imgPart) {
            console.log('HOUSE_PROJECTION_PROVIDER', 'google');
            console.log('HOUSE_PROJECTION_MODEL', GEMINI_IMAGE_MODEL);
            console.log('HOUSE_PROJECTION_FALLBACK', false);
            return NextResponse.json({
              url: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`,
              provider: 'google',
              model: GEMINI_IMAGE_MODEL,
            });
          }
          errors.push('gemini: no image in response');
        } else {
          const errText = await res.text(); console.error('GEMINI_ERROR', res.status, errText.slice(0,300)); errors.push(`gemini ${res.status}: ${errText.slice(0,300)}`);
        }
      } catch (e: any) { errors.push(`gemini: ${e?.message}`); }
    } else {
      errors.push('no API key');
    }

    // ── No fallback — log error and return failure ─────────────────────────
    const errorMsg = errors.join('; ');
    console.error('[house-projection] Generation failed:', errorMsg);
    return NextResponse.json({ error: `Generation failed: ${errorMsg}` }, { status: 502 });

  } catch (err: any) {
    console.error('[house-projection] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Transform failed' }, { status: 500 });
  }
}
