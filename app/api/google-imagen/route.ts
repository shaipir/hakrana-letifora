import { NextRequest, NextResponse } from 'next/server';

// Google Gemini API - Image Generation & Editing (Imagen 3)
// Free tier via Google AI Studio: aistudio.google.com
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const prompt = formData.get('prompt') as string;
  const style = formData.get('style') as string;
  const regionLabel = formData.get('regionLabel') as string;
  const imageFile = formData.get('image') as File | null;
  const apiKey = formData.get('apiKey') as string;

  if (!apiKey) return NextResponse.json({ error: 'Google API Key required' }, { status: 400 });

  const fullPrompt = `Projection mapping visual art for ${regionLabel || 'a surface'}. Style: ${style || prompt}. Dark/black background, high contrast, dramatic lighting, suitable for projection. ${prompt}`;

  try {
    let body: object;
    let imageBase64: string | null = null;
    let imageMime = 'image/jpeg';

    // If image provided — use Gemini for image editing (inpainting style)
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer();
      imageBase64 = Buffer.from(bytes).toString('base64');
      imageMime = imageFile.type || 'image/jpeg';
    }

    if (imageBase64) {
      // Gemini 2.0 Flash with image input + generation
      body = {
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: imageMime,
                data: imageBase64,
              }
            },
            {
              text: `Transform this image into a projection mapping visual. ${fullPrompt}. Keep the subject recognizable but apply dramatic visual effects. Black background. High contrast colors.`
            }
          ]
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
          temperature: 0.9,
        }
      };
    } else {
      // Text-to-image generation
      body = {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
          temperature: 0.9,
        }
      };
    }

    // Try Gemini 2.0 Flash (image generation)
    const model = 'gemini-2.5-flash-preview-04-17';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      // Try fallback to Imagen 3
      return tryImagen3(apiKey, fullPrompt);
    }

    const data = await res.json();

    // Extract generated image from response
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData?.mimeType?.startsWith('image/'));

    if (imagePart?.inlineData) {
      return NextResponse.json({
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
        imageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      });
    }

    return tryImagen3(apiKey, fullPrompt);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

async function tryImagen3(apiKey: string, prompt: string) {
  // Fallback: Imagen 3 via Google AI Studio
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: '16:9' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Google API error: ${err}` }, { status: 500 });
  }

  const data = await res.json();
  const pred = data.predictions?.[0];
  if (pred?.bytesBase64Encoded) {
    return NextResponse.json({
      imageBase64: pred.bytesBase64Encoded,
      mimeType: pred.mimeType || 'image/png',
      imageUrl: `data:${pred.mimeType || 'image/png'};base64,${pred.bytesBase64Encoded}`,
    });
  }

  return NextResponse.json({ error: 'No image generated' }, { status: 500 });
}
