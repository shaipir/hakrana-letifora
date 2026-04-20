import { NextRequest, NextResponse } from 'next/server';
import { DetectedZone } from '@/lib/mapping-types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GEMINI_MODEL = 'gemini-2.5-flash';

const DETECTION_PROMPT = `Analyze this image and identify all flat surfaces suitable for projection mapping (walls, floors, ceilings, facades, screens, panels, etc.).

For each surface, return a label and a polygon outline as normalized coordinates (x and y values between 0 and 1, where 0,0 is top-left and 1,1 is bottom-right).

Respond ONLY with valid JSON in this exact format, with no markdown or extra text:
{"surfaces": [{"label": "surface name", "points": [[x, y], [x, y], ...]}]}

Include at least 4 points per surface to define the polygon. Be precise and identify every distinct flat surface visible.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, apiKey } = body as {
      imageBase64: string;
      mimeType: string;
      apiKey?: string;
    };

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: 'imageBase64 and mimeType are required' },
        { status: 400 },
      );
    }

    const resolvedKey = apiKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!resolvedKey) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 400 });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${resolvedKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: imageBase64 } },
                { text: DETECTION_PROMPT },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[detect-surfaces] Gemini error', geminiRes.status, errText.slice(0, 300));
      return NextResponse.json(
        { error: `Gemini API error: ${geminiRes.status}` },
        { status: 502 },
      );
    }

    const geminiData = await geminiRes.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Extract JSON from the response (may be wrapped in markdown code block)
    let jsonStr = rawText.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    let parsed: { surfaces: Array<{ label: string; points: number[][] }> };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error('[detect-surfaces] Failed to parse Gemini JSON response:', rawText.slice(0, 500));
      return NextResponse.json(
        { error: 'Failed to parse Gemini response as JSON' },
        { status: 502 },
      );
    }

    const zones: DetectedZone[] = (parsed.surfaces ?? []).map((surface) => ({
      id: crypto.randomUUID(),
      label: surface.label ?? 'Unknown Surface',
      points: (surface.points ?? []).map(([x, y]: number[]) => ({ x, y })),
      accepted: false,
    }));

    return NextResponse.json({ zones });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Detection failed';
    console.error('[detect-surfaces] unhandled error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
