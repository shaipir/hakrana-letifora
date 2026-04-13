import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Try multiple Gemini image generation models in sequence
const IMAGE_GEN_MODELS = [
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp',
];

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

    // Build request — include source image if provided
    const parts: any[] = [];
    if (imageBase64 && mimeType) {
      parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });
    }
    parts.push({ text: prompt });

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        temperature: 0.9,
      },
    };

    let lastError = '';
    for (const model of IMAGE_GEN_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const text = await res.text();
        lastError = `${model}: ${text.slice(0, 200)}`;
        continue; // try next model
      }

      const json = await res.json();
      const candidates = json?.candidates ?? [];
      for (const candidate of candidates) {
        const imgPart = candidate?.content?.parts?.find(
          (p: any) => p.inline_data?.mime_type?.startsWith('image/')
        );
        if (imgPart) {
          const dataUrl = `data:${imgPart.inline_data.mime_type};base64,${imgPart.inline_data.data}`;
          return NextResponse.json({ url: dataUrl }, { status: 200 });
        }
      }
      lastError = `${model}: no image in response`;
    }

    return NextResponse.json(
      { error: `Gemini image generation failed. ${lastError}` },
      { status: 500 }
    );
  } catch (err: any) {
    console.error('[nano-banana]', err);
    return NextResponse.json({ error: err?.message ?? 'Generation failed' }, { status: 500 });
  }
}
