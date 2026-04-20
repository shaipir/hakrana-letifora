import { NextRequest, NextResponse } from 'next/server';
import {
  ArtReviveMode, LoopSettings, RestyleSettings,
  GlowSculptureSettings, HouseProjectionSettings, WorldPreset,
} from '@/lib/types';
import { buildWorldTransformPrompt } from '@/lib/restyle/prompt-builder';
import { buildGlowSculpturePrompt } from '@/lib/glow-sculpture/prompt-builder';
import { buildHouseProjectionPrompt } from '@/lib/house-projection/prompt-builder';
import { buildFrameMotionPrompt } from '@/lib/loop/frame-prompt-builder';

export const runtime = 'nodejs';
export const maxDuration = 120;

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const BATCH_SIZE = 5;

async function generateFrame(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  apiKey: string,
): Promise<{ url?: string; pollinationsUrl?: string; error?: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: mimeType, data: imageBase64 } },
              { text: prompt },
            ],
          }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    );
    if (res.ok) {
      const json = await res.json();
      const imgPart = (json?.candidates?.[0]?.content?.parts ?? [])
        .find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
      if (imgPart) {
        return { url: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}` };
      }
      return { error: 'no image in response' };
    }
    const errText = await res.text();
    return { error: `gemini ${res.status}: ${errText.slice(0, 100)}` };
  } catch (e: any) {
    return { error: e?.message };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageBase64, mimeType, mode,
      settings, loopSettings, apiKey: bodyKey,
    } = body as {
      imageBase64: string;
      mimeType: string;
      mode: ArtReviveMode;
      settings: RestyleSettings | GlowSculptureSettings | HouseProjectionSettings;
      loopSettings: LoopSettings;
      apiKey?: string;
    };

    if (!imageBase64 || !settings || !loopSettings) {
      return NextResponse.json({ error: 'imageBase64, settings, loopSettings required' }, { status: 400 });
    }

    const apiKey = bodyKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const frameCount = Math.min(loopSettings.frameCount, 15);

    // Build base prompt
    let basePrompt: string;
    let worldPreset: WorldPreset | null = null;

    if (mode === 'restyle') {
      const rs = settings as RestyleSettings;
      worldPreset = rs.worldPreset ?? null;
      const built = buildWorldTransformPrompt(rs);
      basePrompt = built.transformPrompt;
    } else if (mode === 'glow-sculpture') {
      const gs = settings as GlowSculptureSettings;
      const built = buildGlowSculpturePrompt(gs);
      basePrompt = built.transformPrompt;
    } else {
      const hp = settings as HouseProjectionSettings;
      worldPreset = hp.worldPreset ?? null;
      const built = buildHouseProjectionPrompt(hp);
      basePrompt = built.transformPrompt;
    }

    console.log('LOOP_GEN_MODE', mode);
    console.log('LOOP_GEN_FRAMES', frameCount);
    console.log('LOOP_GEN_MOTION_TYPE', loopSettings.motionType);
    console.log('LOOP_GEN_HAS_API_KEY', !!apiKey);

    // Build frame prompts
    const framePrompts = Array.from({ length: frameCount }, (_, i) =>
      buildFrameMotionPrompt(basePrompt, loopSettings, i, frameCount, worldPreset, mode)
    );

    const frames: string[] = new Array(frameCount).fill('');

    if (apiKey) {
      // Generate in batches of BATCH_SIZE
      for (let batchStart = 0; batchStart < frameCount; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, frameCount);
        const batchIndices = Array.from({ length: batchEnd - batchStart }, (_, i) => batchStart + i);

        const batchResults = await Promise.allSettled(
          batchIndices.map((frameIdx) =>
            generateFrame(imageBase64, mimeType, framePrompts[frameIdx], apiKey)
          )
        );

        const failedFrames: number[] = [];
        batchResults.forEach((result, i) => {
          const frameIdx = batchIndices[i];
          if (result.status === 'fulfilled' && result.value.url) {
            frames[frameIdx] = result.value.url;
          } else {
            const reason = result.status === 'rejected' ? result.reason?.message : 'no url returned';
            console.error(`[generate-loop] Frame ${frameIdx} failed:`, reason);
            failedFrames.push(frameIdx);
          }
        });

        if (failedFrames.length > 0) {
          console.error('[generate-loop] Failed frames:', failedFrames.length, '/', batchIndices.length);
        }
      }
    } else {
      // No API key — return error
      console.error('[generate-loop] No API key provided');
      return NextResponse.json({ error: 'Generation failed: no API key' }, { status: 400 });
    }

    // Filter out empty frames
    const successFrames = frames.filter((f) => f.length > 0);
    if (successFrames.length === 0) {
      console.error('[generate-loop] All frames failed to generate');
      return NextResponse.json({ error: 'Generation failed: all frames failed' }, { status: 502 });
    }

    console.log('[generate-loop] Frames generated:', successFrames.length, '/', frameCount);
    return NextResponse.json({ frames: successFrames, frameCount: successFrames.length, motionType: loopSettings.motionType });

  } catch (err: any) {
    console.error('[generate-loop] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Loop generation failed' }, { status: 500 });
  }
}
