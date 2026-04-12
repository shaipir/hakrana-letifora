import { NextRequest, NextResponse } from 'next/server';
import { ExportRequest, ExportResult } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 30;

/**
 * POST /api/export
 *
 * Fetches a generated asset URL, converts to the requested format (PNG/JPG/WebP),
 * and returns a download URL.
 *
 * For MVP: re-serves the blob URL with appropriate headers.
 * Future: transcode via sharp or a dedicated service.
 */
export async function POST(req: NextRequest) {
  try {
    const body: ExportRequest = await req.json();
    const { assetId, format = 'png', quality = 0.92 } = body;

    if (!assetId) {
      return NextResponse.json({ error: 'assetId is required' }, { status: 400 });
    }

    // In MVP, the client passes the full URL in assetId for simplicity.
    // A production version would look up the asset in a database.
    const assetUrl = assetId.startsWith('http') ? assetId : null;

    if (!assetUrl) {
      return NextResponse.json({ error: 'Invalid asset reference' }, { status: 400 });
    }

    const filename = `artrevive-export-${Date.now()}.${format}`;

    const result: ExportResult = {
      success: true,
      url: assetUrl,
      filename,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[api/export]', err);
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Export failed' } satisfies ExportResult,
      { status: 500 }
    );
  }
}
