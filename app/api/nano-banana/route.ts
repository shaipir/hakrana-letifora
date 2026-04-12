import { NextRequest, NextResponse } from 'next/server';

// ננו בננה style generation endpoint
// TODO: replace with real Nano Banana API when credentials available
export async function POST(req: NextRequest) {
  const { prompt, region, mood, intensity } = await req.json();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a Nano Banana visual style generator for projection mapping.

Generate 6 unique visual styles for projecting onto: "${region?.label || 'surface'}"
User style request: "${prompt}"
Mood: ${mood || 'any'}
Intensity: ${intensity || 'medium'}

Return ONLY valid JSON array of 6 style objects:
[{
  "id": "style_1",
  "name": "style name (creative, evocative)",
  "tagline": "one sentence tagline",
  "effect": "one of: kaleidoscope|fire|mirror|glitch|colorshift|tunnel|dream|cosmic|none",
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "animation": "description of movement/animation",
  "depth3D": 0.5,
  "intensity": 0.7,
  "tags": ["tag1", "tag2", "tag3"],
  "projectionTip": "practical tip for projecting this style"
}]`
      }]
    })
  });

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '[]';
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
    return NextResponse.json({ styles: parsed });
  } catch {
    return NextResponse.json({ styles: [], raw: text }, { status: 500 });
  }
}
