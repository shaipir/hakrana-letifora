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

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = bodyKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const errors: string[] = [];

    // Build Gemini parts with image
    const parts: any[] = [];
    if (imageBase64 && mimeType) {
      parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });
    }
    parts.push({ text: prompt });

    // ── Attempt 1: Gemini flash-preview image generation ─────────────────
    if (apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`,
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

      // ── Attempt 2: Imagen 3 ─────────────────────────────────────────────
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
    }

    // ── Fallback: Pollinations.ai (free, no key, FLUX model) ─────────────
    // Always available — guarantees a result
    try {
      const encodedPrompt = encodeURIComponent(prompt.slice(0, 500));
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;

      const imgRes = await fetch(pollinationsUrl, {
        headers: { 'Accept': 'image/*' },
        // Pollinations can be slow — give it 50s
        signal: AbortSignal.timeout(55000),
      });

      if (imgRes.ok) {
        const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg';
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const base64 = buffer.toString('base64');
        return NextResponse.json({
          url: `data:${contentType};base64,${base64}`,
          via: 'pollinations',
        });
      }
      errors.push(`pollinations ${imgRes.status}`);
    } catch (e: any) { errors.push(`pollinations: ${e?.message}`); }

    console.error('[nano-banana] all failed:', errors);
    return NextResponse.json({ error: errors.join(' | ') }, { status: 500 });
  } catch (err: any) {
    console.error('[nano-banana] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Generation failed' }, { status: 500 });
  }
}
