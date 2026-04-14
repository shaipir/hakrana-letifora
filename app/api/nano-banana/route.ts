import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

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

    // ── Attempt 1: Gemini image generation ───────────────────────────────
    if (apiKey) {
      try {
        const parts: any[] = [];
        if (imageBase64 && mimeType) {
          parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });
        }
        parts.push({ text: prompt });

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`,
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
              provider: 'google',
              model: GEMINI_IMAGE_MODEL,
            });
          }
          errors.push(`gemini: no image in response`);
        } else {
          errors.push(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
        }
      } catch (e: any) { errors.push(`gemini: ${e?.message}`); }
    } else {
      errors.push('no API key');
    }

    // ── Fallback: return Pollinations URL (browser loads directly) ────────
    const encodedPrompt = encodeURIComponent(prompt.slice(0, 500));
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;

    return NextResponse.json({
      pollinationsUrl,
      provider: 'pollinations',
      model: 'flux',
      fallback: true,
      fallbackReason: errors.join('; '),
    });

  } catch (err: any) {
    console.error('[nano-banana] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Generation failed' }, { status: 500 });
  }
}
