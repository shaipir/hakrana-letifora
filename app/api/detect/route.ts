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
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: `Analyze this image carefully for projection mapping. Detect all meaningful regions/objects.

Return ONLY valid JSON with this exact structure:
{
  "subject": "brief description of the whole image",
  "regions": [
    {
      "id": "region_1",
      "label": "human readable name (e.g. 'face', 'left eye', 'stone sculpture', 'wall', 'body')",
      "type": "face|eye|mouth|body|object|sculpture|wall|background|other",
      "bbox": {
        "x": 0.0,
        "y": 0.0,
        "width": 1.0,
        "height": 1.0
      },
      "description": "what this region contains",
      "projectionPotential": "high|medium|low",
      "suggestedStyles": ["style1", "style2"]
    }
  ],
  "mappingType": "face_mapping|sculpture|wall|object|multi_surface",
  "dominantColors": ["#hex1", "#hex2", "#hex3"],
  "mood": "description of mood/atmosphere"
}

BBOX values are normalized 0.0-1.0 (x,y from top-left). Be precise with bounding boxes. Include 2-8 regions.` }
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
    return NextResponse.json({ error: 'parse failed', raw: text }, { status: 500 });
  }
}
