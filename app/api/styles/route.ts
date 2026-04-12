import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, style, mood } = await req.json();

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
        content: `You are an expert in projection mapping and visual art. Generate 4 creative style concepts for projection mapping.
Subject/prompt: "${prompt}"
Style: ${style || 'any'}
Mood: ${mood || 'any'}

Return ONLY valid JSON array of 4 objects:
[{
  "name": "style name",
  "description": "2 sentence description",
  "effect": "one of: kaleidoscope|fire|mirror|glitch|colorshift|tunnel|dream|cosmic",
  "palette": ["#hex1","#hex2","#hex3"],
  "intensity": "low|medium|high",
  "tags": ["tag1","tag2"]
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
    return NextResponse.json({ styles: [], error: text });
  }
}
