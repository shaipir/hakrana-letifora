import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, imageBase64, mimeType, apiKey: bodyKey } = body as {
      prompt: string;
      imageBase64?: string;
      mimeType?: string;
      apiKey?: string;
    };

    const apiKey = bodyKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No Gemini API key. Add it in Settings (⚙).' }, { status: 400 });
    }
    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const errors: string[] = [];

    // Build parts — include resized image if provided
    const parts: any[] = [];
    if (imageBase64 && mimeType) {
      parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });
    }
    parts.push({ text: prompt });

    // ── Attempt 1: gemini-2.0-flash-preview-image-generation ─────────────
    try {
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
          return NextResponse.json({
            url: `data:${imgPart.inline_data.mime_type};base64,${imgPart.inline_data.data}`,
          });
        }
        errors.push(`flash-preview: no image in response`);
      } else {
        errors.push(`flash-preview ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
    } catch (e: any) { errors.push(`flash-preview: ${e?.message}`); }

    // ── Attempt 2: imagen-3.0-generate-002 (text-to-image) ───────────────
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1, aspectRatio: '1:1' },
          }),
        }
      );
      if (res.ok) {
        const json = await res.json();
        const pred = json?.predictions?.[0];
        if (pred?.bytesBase64Encoded) {
          return NextResponse.json({
            url: `data:${pred.mimeType ?? 'image/png'};base64,${pred.bytesBase64Encoded}`,
          });
        }
        errors.push(`imagen-3: no image in response`);
      } else {
        errors.push(`imagen-3 ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
    } catch (e: any) { errors.push(`imagen-3: ${e?.message}`); }

    // ── Attempt 3: imagen-3.0-fast-generate-001 ───────────────────────────
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1 },
          }),
        }
      );
      if (res.ok) {
        const json = await res.json();
        const pred = json?.predictions?.[0];
        if (pred?.bytesBase64Encoded) {
          return NextResponse.json({
            url: `data:${pred.mimeType ?? 'image/png'};base64,${pred.bytesBase64Encoded}`,
          });
        }
        errors.push(`imagen-3-fast: no image in response`);
      } else {
        errors.push(`imagen-3-fast ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
    } catch (e: any) { errors.push(`imagen-3-fast: ${e?.message}`); }

    console.error('[nano-banana] all models failed:', errors);
    return NextResponse.json({ error: errors.join(' | ') }, { status: 500 });
  } catch (err: any) {
    console.error('[nano-banana] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Generation failed' }, { status: 500 });
  }
}
