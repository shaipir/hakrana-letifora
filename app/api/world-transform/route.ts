import { NextRequest, NextResponse } from 'next/server';
import { RestyleSettings } from '@/lib/types';
import { buildWorldTransformPrompt } from '@/lib/restyle/prompt-builder';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
    const { transformPrompt, motionHint, debugInfo } = buildWorldTransformPrompt(settings);

    // ── Debug logging ──────────────────────────────────────────────────────
    console.log('WORLD_TRANSFORM_MODE', settings.mode);
    console.log('WORLD_TRANSFORM_WORLD', settings.worldPreset);
    console.log('WORLD_TRANSFORM_VISUAL_LANG', settings.visualLanguage);
    console.log('WORLD_TRANSFORM_PROMPT', transformPrompt.slice(0, 300));
    console.log('WORLD_TRANSFORM_MOTION_HINT', motionHint);
    console.log('WORLD_TRANSFORM_HAS_API_KEY', !!apiKey);

    const errors: string[] = [];
    let providerUsed = '';
    let modelUsed = '';
    let fallbackUsed = false;

    // ── Attempt 1: Gemini flash-preview image generation (image-to-image) ─
    if (apiKey) {
      try {
        const parts: any[] = [
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
          { text: transformPrompt },
        ];

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
            }),
          }
        );

        if (res.ok) {
          const json = await res.json();
          const imgPart = (json?.candidates?.[0]?.content?.parts ?? [])
            .find((p: any) => p.inline_data?.mime_type?.startsWith('image/'));
          if (imgPart) {
            providerUsed = 'google';
            modelUsed = 'gemini-2.0-flash-preview-image-generation';
            console.log('WORLD_TRANSFORM_PROVIDER', providerUsed);
            console.log('WORLD_TRANSFORM_MODEL', modelUsed);
            console.log('FALLBACK_USED', false);
            return NextResponse.json({
              url: `data:${imgPart.inline_data.mime_type};base64,${imgPart.inline_data.data}`,
              motionHint,
              provider: providerUsed,
              model: modelUsed,
            });
          }
          errors.push('flash-preview: no image in response');
        } else {
          errors.push(`flash-preview ${res.status}: ${(await res.text()).slice(0, 200)}`);
        }
      } catch (e: any) { errors.push(`flash-preview: ${e?.message}`); }
    }

    // ── Attempt 2: Pollinations.ai FLUX (free, no key needed) ─────────────
    fallbackUsed = true;
    try {
      const encodedPrompt = encodeURIComponent(transformPrompt.slice(0, 500));
      const seed = Math.floor(Math.random() * 99999);
      const pollUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;

      const imgRes = await fetch(pollUrl, {
        signal: AbortSignal.timeout(50000),
      });

      if (imgRes.ok) {
        providerUsed = 'pollinations';
        modelUsed = 'flux';
        const ct = imgRes.headers.get('content-type') ?? 'image/jpeg';
        const buf = Buffer.from(await imgRes.arrayBuffer());
        console.log('WORLD_TRANSFORM_PROVIDER', providerUsed);
        console.log('WORLD_TRANSFORM_MODEL', modelUsed);
        console.log('FALLBACK_USED', true);
        return NextResponse.json({
          url: `data:${ct};base64,${buf.toString('base64')}`,
          motionHint,
          provider: providerUsed,
          model: modelUsed,
          fallback: true,
          fallbackReason: errors.join('; ') || 'No Gemini API key',
        });
      }
      errors.push(`pollinations ${imgRes.status}`);
    } catch (e: any) { errors.push(`pollinations: ${e?.message}`); }

    console.log('WORLD_TRANSFORM_PROVIDER', 'none');
    console.log('FALLBACK_USED', true);
    return NextResponse.json({ error: errors.join(' | ') }, { status: 500 });

  } catch (err: any) {
    console.error('[world-transform] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Transform failed' }, { status: 500 });
  }
}
