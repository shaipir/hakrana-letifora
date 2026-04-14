import { NextRequest, NextResponse } from 'next/server';
import { GlowSculptureSettings } from '@/lib/types';
import { buildGlowSculpturePrompt } from '@/lib/glow-sculpture/prompt-builder';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, settings, apiKey: bodyKey } = body as {
      imageBase64: string;
      mimeType: string;
      settings: GlowSculptureSettings;
      apiKey?: string;
    };

    if (!imageBase64 || !settings) {
      return NextResponse.json({ error: 'imageBase64 and settings required' }, { status: 400 });
    }

    const apiKey = bodyKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const { transformPrompt, motionHint } = buildGlowSculpturePrompt(settings);

    console.log('GLOW_SCULPTURE_STYLE', settings.contourStyle);
    console.log('GLOW_SCULPTURE_HAS_API_KEY', !!apiKey);
    console.log('GLOW_SCULPTURE_PROMPT', transformPrompt.slice(0, 300));

    const errors: string[] = [];

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
            console.log('GLOW_SCULPTURE_PROVIDER', 'google');
            console.log('GLOW_SCULPTURE_MODEL', GEMINI_IMAGE_MODEL);
            return NextResponse.json({
              url: `data:${imgPart.inline_data.mime_type};base64,${imgPart.inline_data.data}`,
              motionHint,
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

    const encoded = encodeURIComponent(transformPrompt.slice(0, 500));
    const seed = Math.floor(Math.random() * 99999);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;

    console.log('GLOW_SCULPTURE_PROVIDER', 'pollinations');
    console.log('GLOW_SCULPTURE_FALLBACK', true);

    return NextResponse.json({
      pollinationsUrl,
      motionHint,
      provider: 'pollinations',
      model: 'flux',
      fallback: true,
      fallbackReason: errors.join('; '),
    });

  } catch (err: any) {
    console.error('[glow-sculpture] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Generation failed' }, { status: 500 });
  }
}
