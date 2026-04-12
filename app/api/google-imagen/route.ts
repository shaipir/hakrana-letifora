import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const prompt = String(formData.get('prompt') || '').trim();
    const style = String(formData.get('style') || '').trim();
    const regionLabel = String(formData.get('regionLabel') || '').trim();
    const imageFile = formData.get('image') as File | null;

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GOOGLE_API_KEY in environment variables' },
        { status: 500 }
      );
    }

    if (!prompt && !style) {
      return NextResponse.json(
        { error: 'Prompt or style is required' },
        { status: 400 }
      );
    }

    const fullPrompt =
      `Projection mapping visual art for ${regionLabel || 'a surface'}. ` +
      `Style: ${style || prompt}. ` +
      `Dark/black background, high contrast, dramatic lighting, suitable for projection. ` +
      `${prompt}`;

    let imageBase64: string | null = null;
    let imageMime = 'image/jpeg';

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      imageBase64 = Buffer.from(bytes).toString('base64');
      imageMime = imageFile.type || 'image/jpeg';
    }

    const model = 'gemini-2.0-flash-preview-image-generation';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = imageBase64
      ? {
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
                  text:
                    `Create a new image based on this input image and the following prompt: ${fullPrompt}. ` +
                    `Keep the main subject recognizable, but transform it clearly according to the prompt. ` +
                    `The result should feel like a newly generated image, not just a tiny edit. ` +
                    `Use dramatic visual effects, strong contrast, and a dark background suitable for projection mapping.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            temperature: 0.9,
          },
        }
      : {
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            temperature: 0.9,
          },
        };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const rawText = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'Google API request failed',
          status: res.status,
          details: rawText,
        },
        { status: 500 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          error: 'Google API returned non-JSON response',
          details: rawText,
        },
        { status: 500 }
      );
    }

    const parts = data?.candidates?.[0]?.content?.parts ?? [];

    const imagePart =
      parts.find((p: any) => p?.inlineData?.mimeType?.startsWith('image/')) ||
      parts.find((p: any) => p?.inline_data?.mime_type?.startsWith('image/'));

    const base64 =
      imagePart?.inlineData?.data ||
      imagePart?.inline_data?.data ||
      null;

    const mimeType =
      imagePart?.inlineData?.mimeType ||
      imagePart?.inline_data?.mime_type ||
      'image/png';

    if (!base64) {
      return NextResponse.json(
        {
          error: 'No image returned from Google',
          debug: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageBase64: base64,
      mimeType,
      imageUrl: `data:${mimeType};base64,${base64}`,
      provider: 'gemini',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}