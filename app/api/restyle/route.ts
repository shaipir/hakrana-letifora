import { NextRequest, NextResponse } from 'next/server';
import { getRestyleProvider } from '@/lib/restyle/provider';
import { GeneratedAsset, RestyleSettings } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, mimeType, settings, sourceAssetId } = body as {
      imageUrl: string;
      mimeType: string;
      settings: RestyleSettings;
      sourceAssetId: string;
    };

    if (!imageUrl || !settings) {
      return NextResponse.json({ error: 'imageUrl and settings are required' }, { status: 400 });
    }

    // Support both data URLs and remote URLs
    let imageBase64: string;
    let resolvedMime: string;

    if (imageUrl.startsWith('data:')) {
      const comma = imageUrl.indexOf(',');
      imageBase64 = imageUrl.slice(comma + 1);
      resolvedMime = imageUrl.slice(5, imageUrl.indexOf(';')) || mimeType || 'image/jpeg';
    } else {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Failed to fetch source image: ${imgRes.status}`);
      imageBase64 = Buffer.from(await imgRes.arrayBuffer()).toString('base64');
      resolvedMime = mimeType || imgRes.headers.get('content-type') || 'image/jpeg';
    }

    // Call provider
    const provider = getRestyleProvider();
    const result = await provider.generate({
      imageUrl,
      imageBase64,
      mimeType: resolvedMime,
      settings,
    });

    // Return as data URL — no Blob storage needed
    const id = crypto.randomUUID();
    const resultDataUrl = `data:${result.mimeType};base64,${result.imageBase64}`;

    const asset: GeneratedAsset = {
      id,
      url: resultDataUrl,
      mode: 'restyle',
      settings,
      sourceAssetId: sourceAssetId ?? '',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ asset }, { status: 201 });
  } catch (err: any) {
    console.error('[api/restyle]', err);
    const message = err?.message ?? 'Restyle generation failed';
    const status = message.includes('quota') || message.includes('429') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
