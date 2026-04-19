import { NextRequest, NextResponse } from 'next/server';
import { RestyleSettings } from '@/lib/types';
import { buildWorldTransformPrompt } from '@/lib/restyle/prompt-builder';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Gemini model that supports image generation output
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, settings, apiKey: bodyKey } = body as {
      imageBase64: string;
      mimeType: string;
      settings: RestyleSettings;
      apiKey?: string;
    };

    if (!imageBase64 || !settings) {
      return NextResponse.json({ error: 'imageBase64 and settings required' }, { status: 400 });
    }

    const apiKey = bodyKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const { transformPrompt, motionHint } = buildWorldTransformPrompt(settings);

    console.log('WORLD_TRANSFORM_MODE', settings.mode);
    console.log('WORLD_TRANSFORM_WORLD', settings.worldPreset);
    console.log('WORLD_TRANSFORM_HAS_API_KEY', !!apiKey);
    console.log('WORLD_TRANSFORM_PROMPT', transformPrompt.slice(0, 300));

    const errors: string[] = [];

    // ── Attempt 1: Gemini image generation (image-to-image) ───────────────
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
            console.log('WORLD_TRANSFORM_PROVIDER', 'google');
            console.log('WORLD_TRANSFORM_MODEL', GEMINI_IMAGE_MODEL);
            console.log('FALLBACK_USED', false);
            return NextResponse.json({
              url: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`,
              motionHint,
              provider: 'google',
              model: GEMINI_IMAGE_MODEL,
            });
          }
          const fullResp = JSON.stringify(json).slice(0, 300);
          console.error('GEMINI_NO_IMAGE', fullResp);
          errors.push(`gemini: no image in response — ${fullResp}`);
        } else {
          const errText = await res.text();
          console.error('GEMINI_ERROR', res.status, errText.slice(0, 300));
          errors.push(`gemini ${res.status}: ${errText.slice(0, 300)}`);
        }
      } catch (e: any) {
        console.error('GEMINI_EXCEPTION', e?.message);
        errors.push(`gemini: ${e?.message}`);
      }
    } else {
      errors.push('no API key');
    }

    // No fallback — return clear error so the client shows a message
    return NextResponse.json({
      error: errors.length
        ? `Generation failed: ${errors.join('; ')}`
        : 'Generation requires a Gemini API key. Add one in Settings.',
      requiresApiKey: !errors.some((e) => !e.includes('no API key')),
    }, { status: 422 });

  } catch (err: any) {
    console.error('[world-transform] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Transform failed' }, { status: 500 });
  }
}
