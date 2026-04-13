import { NextRequest, NextResponse } from 'next/server';
import { HouseProjectionSettings } from '@/lib/types';
import { buildHouseProjectionPrompt } from '@/lib/house-projection/prompt-builder';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

    // ── Debug logging ──────────────────────────────────────────────────────
    console.log('HOUSE_PROJECTION_WORLD', debugInfo.worldPreset);
    console.log('HOUSE_PROJECTION_GEO_PRESERVE', debugInfo.geometryPreservation);
    console.log('HOUSE_PROJECTION_HAS_API_KEY', !!apiKey);
    console.log('HOUSE_PROJECTION_PROMPT', transformPrompt.slice(0, 400));

    const errors: string[] = [];
    let providerUsed = '';
    let modelUsed = '';
    let fallbackUsed = false;

    // ── Attempt 1: Gemini flash-preview image-to-image ────────────────────
    if (apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`,
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
            .find((p: unknown) => (p as { inline_data?: { mime_type?: string } })?.inline_data?.mime_type?.startsWith('image/'));
          if (imgPart) {
            providerUsed = 'google';
            modelUsed = 'gemini-2.5-flash-preview-04-17';
            console.log('HOUSE_PROJECTION_PROVIDER', providerUsed);
            console.log('HOUSE_PROJECTION_MODEL', modelUsed);
            console.log('HOUSE_PROJECTION_FALLBACK', false);
            return NextResponse.json({
              url: `data:${(imgPart as { inline_data: { mime_type: string; data: string } }).inline_data.mime_type};base64,${(imgPart as { inline_data: { mime_type: string; data: string } }).inline_data.data}`,
              provider: providerUsed,
              model: modelUsed,
            });
          }
          errors.push('flash-preview: no image in response');
        } else {
          errors.push(`flash-preview ${res.status}: ${(await res.text()).slice(0, 200)}`);
        }
      } catch (e: unknown) { errors.push(`flash-preview: ${(e as Error)?.message}`); }
    }

    // ── Fallback: Pollinations FLUX ────────────────────────────────────────
    fallbackUsed = true;
    try {
      const encoded = encodeURIComponent(transformPrompt.slice(0, 500));
      const seed = Math.floor(Math.random() * 99999);
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;
      const imgRes = await fetch(url, { signal: AbortSignal.timeout(50000) });
      if (imgRes.ok) {
        providerUsed = 'pollinations';
        modelUsed = 'flux';
        const ct = imgRes.headers.get('content-type') ?? 'image/jpeg';
        const buf = Buffer.from(await imgRes.arrayBuffer());
        console.log('HOUSE_PROJECTION_PROVIDER', providerUsed);
        console.log('HOUSE_PROJECTION_MODEL', modelUsed);
        console.log('HOUSE_PROJECTION_FALLBACK', true);
        return NextResponse.json({
          url: `data:${ct};base64,${buf.toString('base64')}`,
          provider: providerUsed,
          model: modelUsed,
          fallback: true,
          fallbackReason: errors.join('; ') || 'No Gemini API key',
        });
      }
      errors.push(`pollinations ${imgRes.status}`);
    } catch (e: unknown) { errors.push(`pollinations: ${(e as Error)?.message}`); }

    void fallbackUsed;

    return NextResponse.json({ error: errors.join(' | ') }, { status: 500 });
  } catch (err: unknown) {
    console.error('[house-projection] unhandled:', err);
    return NextResponse.json({ error: (err as Error)?.message ?? 'Transform failed' }, { status: 500 });
  }
}
