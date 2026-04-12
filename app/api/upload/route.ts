import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { UploadedAsset } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Use JPEG, PNG, WebP, or GIF.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 20 MB.` },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const pathname = `uploads/${id}.${ext}`;

    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
    });

    // Get image dimensions from the file (edge-compatible approach)
    let width = 0;
    let height = 0;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const dimensions = getImageDimensions(new Uint8Array(arrayBuffer), file.type);
      width = dimensions.width;
      height = dimensions.height;
    } catch {
      // Non-critical — dimensions fallback to 0
    }

    const asset: UploadedAsset = {
      id,
      url: blob.url,
      originalName: file.name,
      mimeType: file.type,
      width,
      height,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({ asset }, { status: 201 });
  } catch (err) {
    console.error('[api/upload]', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}

// ── Lightweight dimension parsing (no sharp, edge-compatible) ──────────────

function getImageDimensions(bytes: Uint8Array, mimeType: string): { width: number; height: number } {
  if (mimeType === 'image/png') {
    // PNG: width at byte 16–19, height at 20–23
    if (bytes.length < 24) return { width: 0, height: 0 };
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { width, height };
  }

  if (mimeType === 'image/jpeg') {
    // JPEG: scan for SOF marker
    let i = 2;
    while (i < bytes.length - 8) {
      if (bytes[i] === 0xff && (bytes[i + 1] === 0xc0 || bytes[i + 1] === 0xc2)) {
        const height = (bytes[i + 5] << 8) | bytes[i + 6];
        const width = (bytes[i + 7] << 8) | bytes[i + 8];
        return { width, height };
      }
      i++;
    }
  }

  if (mimeType === 'image/webp') {
    // WebP: VP8 chunk at byte 12+
    if (bytes.length < 30) return { width: 0, height: 0 };
    // Simple VP8 format
    if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
      const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
      const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
      return { width: width + 1, height: height + 1 };
    }
  }

  return { width: 0, height: 0 };
}
