import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, count = 4, theme, mood } = await req.json();

  const fullPrompt = `Create a ${theme || ''} ${mood || ''} projection mapping visual: ${prompt}. Dark background, high contrast, suitable for projecting onto physical surfaces. Cinematic, detailed, dramatic lighting.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are an AI art director for projection mapping. Describe ${count} distinct visual concepts for: "${fullPrompt}". 
For each, respond with a JSON array of objects with keys: "title" (string), "description" (string, 2-3 sentences), "colorPalette" (array of 3 hex colors), "mood" (string). 
Return ONLY valid JSON array, no markdown.`
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '[]';
    const concepts = JSON.parse(text.replace(/```json|```/g, '').trim());

    return NextResponse.json({ concepts, images: [] });
  } catch {
    return NextResponse.json({ concepts: [], images: [], error: 'Generation failed' }, { status: 500 });
  }
}
