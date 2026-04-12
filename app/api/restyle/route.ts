import { NextRequest, NextResponse } from 'next/server';
import { getRestyleProvider } from '@/lib/restyle/provider';
import { put } from '@vercel/blob';
import { GeneratedAsset, RestyleSettings } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, mimeType, settings } = body as {
      imageUrl: string;
      mimeType: string;
      settings: RestyleSettings;
      sourceAssetId: string;
    };

    if (!imageUrl || !settings) {
      return NextResponse.json({ error: 'imageUrl and settings are required' }, { status: 400 });
    }

    // Fetch source image to base64
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch source image: ${imgRes.status}`);
    const imgBuffer = await imgRes.arrayBuffer();
    const imageBase64 = Buffer.from(imgBuffer).toString('base64');
    const resolvedMime = mimeType || imgRes.headers.get('content-type') || 'image/jpeg';

    // Call provider
    const provider = getRestyleProvider();
    const result = await provider.generate({
      imageUrl,
      imageBase64,
      mimeType: resolvedMime,
      settings,
    });

    // Upload result to Vercel Blob
    const id = crypto.randomUUID();
    const ext = result.mimeType.split('/')[1] ?? 'jpg';
    const imgBytes = Buffer.from(result.imageBase64, 'base64');
    const blob = await put(`generated/restyle/${id}.${ext}`, imgBytes, {
      access: 'public',
      contentType: result.mimeType,
    });

    const asset: GeneratedAsset = {
      id,
      url: blob.url,
      mode: 'restyle',
      settings,
      sourceAssetId: body.sourceAssetId ?? '',
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
