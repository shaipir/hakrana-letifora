/**
 * Direct browser-side Gemini API call.
 * Bypasses Vercel function timeout entirely — browser has no 60s limit.
 */

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

export interface GeminiImageResult {
  url: string;       // data URL
  mimeType: string;
}

export async function generateImageWithGemini(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  prompt: string,
): Promise<GeminiImageResult> {
  if (!apiKey) throw new Error('No API key. Add your Gemini key in Settings.');

  console.log('[GeminiClient] Calling Gemini directly from browser...');
  console.log('[GeminiClient] Model:', GEMINI_IMAGE_MODEL);
  console.log('[GeminiClient] Prompt:', prompt.slice(0, 200));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('[GeminiClient] API error:', res.status, errText.slice(0, 300));
    throw new Error(`Gemini error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

  if (!imgPart) {
    console.error('[GeminiClient] No image in response:', JSON.stringify(json).slice(0, 300));
    throw new Error('Gemini returned no image. Try again or adjust settings.');
  }

  const dataUrl = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
  console.log('[GeminiClient] Success! Image received.');
  return { url: dataUrl, mimeType: imgPart.inlineData.mimeType };
}
