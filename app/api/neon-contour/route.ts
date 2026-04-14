/**
 * Deprecated — replaced by /api/glow-sculpture
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: 'This endpoint is deprecated. Use /api/glow-sculpture instead.' }, { status: 410 });
}
