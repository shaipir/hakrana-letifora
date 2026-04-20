import { NextRequest, NextResponse } from 'next/server';

// Stable image model (Nano Banana) — the free-tier path for actual image output.
// Note: gemini-2.5-flash (base Flash) is text-only and cannot return images.
// See https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image
const IMAGE_MODEL = 'gemini-2.5-flash-image';

type InlineImagePart = {
  inlineData?: { data: string; mimeType?: string };
  inline_data?: { data: string; mime_type?: string };
};

function pickImageFromParts(parts: InlineImagePart[]) {
  for (const p of parts) {
    const id = p.inlineData ?? p.inline_data;
    if (!id?.data) continue;
    const mime = id.mimeType ?? id.mime_type ?? 'image/png';
    if (mime.startsWith('image/')) {
      return { data: id.data, mime };
    }
  }
  return null;
}

function parseErrorBody(raw: string): { code?: number; message?: string } {
  try {
    const j = JSON.parse(raw) as { error?: { code?: number; message?: string } };
    return j.error ?? {};
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const prompt = formData.get('prompt') as string;
  const style = formData.get('style') as string;
  const regionLabel = formData.get('regionLabel') as string;
  const imageFile = formData.get('image') as File | null;
  const apiKey = formData.get('apiKey') as string;

  if (!apiKey) return NextResponse.json({ error: 'Google API Key required' }, { status: 400 });

  const fullPrompt = `Projection mapping visual art for ${regionLabel || 'a surface'}. Style: ${style || prompt}. Dark/black background, high contrast, dramatic lighting, suitable for projection. ${prompt}`;

  let body: object;

  if (imageFile) {
    const bytes = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(bytes).toString('base64');
    const imageMime = imageFile.type || 'image/jpeg';
    body = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: imageMime,
                data: imageBase64,
              },
            },
            {
              text: `Transform this image into a projection mapping visual. ${fullPrompt}. Keep the subject recognizable but apply dramatic visual effects. Black background. High contrast colors.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 0.9,
      },
    };
  } else {
    body = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 0.9,
      },
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${apiKey}`;

  let res: Response;
  let raw: string;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    raw = await res.text();
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  if (res.status === 429) {
    const first = parseErrorBody(raw);
    return NextResponse.json(
      {
        error:
          'נגמרה מכסת יצירת התמונה בחשבון Google (בדרך כלל לדקה או ליום בשכבה החינמית). ' +
          'אפשר לחכות ולנסות שוב, לבדוק מכסות בקישורים למטה, או להפעיל חיוב ב-Google.',
        errorCode: 'GEMINI_QUOTA_EXCEEDED',
        detailsUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits',
        billingUrl: 'https://ai.google.dev/gemini-api/docs/billing',
        upstreamMessage: first.message,
      },
      { status: 429 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `Google API error (${IMAGE_MODEL}): ${raw}` },
      { status: 500 },
    );
  }

  const data = JSON.parse(raw) as {
    candidates?: Array<{ content?: { parts?: InlineImagePart[] } }>;
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const img = pickImageFromParts(parts);

  if (img) {
    return NextResponse.json({
      imageBase64: img.data,
      mimeType: img.mime,
      imageUrl: `data:${img.mime};base64,${img.data}`,
    });
  }

  return NextResponse.json(
    { error: `${IMAGE_MODEL}: no image in model response` },
    { status: 500 },
  );
}
