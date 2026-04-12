import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('image') as File | null;
  if (!file) return NextResponse.json({ error: 'no image' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
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
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: `Analyze this image for projection mapping. Return ONLY valid JSON:
{
  "subject": "what is in the image (face/sculpture/wall/object etc.)",
  "suggestedEffects": ["effect1","effect2","effect3"],
  "suggestedStyles": ["style1","style2","style3"],
  "mappingType": "face_mapping|sculpture_mapping|flat_surface|multi_surface",
  "keyZones": ["zone1","zone2"],
  "mood": "the mood/atmosphere",
  "colors": ["#hex1","#hex2","#hex3"]
}` }
        ]
      }]
    })
  });

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '{}';
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'parse failed', raw: text });
  }
}
