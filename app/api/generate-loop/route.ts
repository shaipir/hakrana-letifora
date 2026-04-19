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
export const maxDuration = 180;

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

// Recommended frame counts for smooth playback
// 12 frames @ 10fps = 1.2s smooth loop (recommended default)
// 16 frames @ 10fps = 1.6s (cinematic feel)
// 20 frames @ 10fps = 2s (slow reveal loops)
const MAX_FRAMES = 20;

function extractBase64FromDataUrl(dataUrl: string): { base64: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

async function generateFrame(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  apiKey: string,
): Promise<{ url?: string; error?: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: imageBase64 } },
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
    return { error: `gemini ${res.status}: ${errText.slice(0, 120)}` };
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
    if (!apiKey) {
      return NextResponse.json({ error: 'Loop generation requires a Gemini API key. Add one in Settings.' }, { status: 422 });
    }

    const frameCount = Math.max(4, Math.min(loopSettings.frameCount, MAX_FRAMES));

    // Build base style prompt
    let basePrompt: string;
    let worldPreset: WorldPreset | null = null;

    if (mode === 'restyle') {
      const rs = settings as RestyleSettings;
      worldPreset = rs.worldPreset ?? null;
      basePrompt = buildWorldTransformPrompt(rs).transformPrompt;
    } else if (mode === 'glow-sculpture') {
      basePrompt = buildGlowSculpturePrompt(settings as GlowSculptureSettings).transformPrompt;
    } else {
      const hp = settings as HouseProjectionSettings;
      worldPreset = hp.worldPreset ?? null;
      basePrompt = buildHouseProjectionPrompt(hp).transformPrompt;
    }

    console.log('LOOP_GEN mode=%s frames=%d motionType=%s', mode, frameCount, loopSettings.motionType);

    const frames: string[] = new Array(frameCount).fill('');
    let prevBase64 = imageBase64;
    let prevMimeType = mimeType;
    let firstFrameBase64 = imageBase64;
    let firstFrameMimeType = mimeType;

    // ── Sequential generation with seamless loop closure ──────────────────────
    //
    // Strategy:
    //   Frames 0..N-3  → sequential, each using previous as input
    //   Frame N-2      → "bridge start": begin returning toward opening state
    //   Frame N-1      → generated from FIRST FRAME (not previous) with
    //                    explicit instruction to match opening — closes the loop
    //
    for (let i = 0; i < frameCount; i++) {
      const isClosingFrame = i === frameCount - 1;

      // For the very last frame: use the FIRST generated frame as input
      // so Gemini can bridge the gap back to frame 0
      const inputBase64 = isClosingFrame ? firstFrameBase64 : prevBase64;
      const inputMimeType = isClosingFrame ? firstFrameMimeType : prevMimeType;

      const prompt = isClosingFrame
        ? buildLoopClosePrompt(basePrompt, loopSettings, frameCount, worldPreset, mode)
        : buildFrameMotionPrompt(basePrompt, loopSettings, i, frameCount, worldPreset, mode, i === 0);

      const result = await generateFrame(inputBase64, inputMimeType, prompt, apiKey);

      if (result.url) {
        frames[i] = result.url;

        const extracted = extractBase64FromDataUrl(result.url);
        if (extracted) {
          // Save first frame as loop anchor
          if (i === 0) {
            firstFrameBase64 = extracted.base64;
            firstFrameMimeType = extracted.mimeType;
          }
          prevBase64 = extracted.base64;
          prevMimeType = extracted.mimeType;
        }
      } else {
        console.warn('LOOP_GEN frame %d failed: %s', i, result.error);
        // On failure: keep last successful frame as fallback (don't show blank)
        frames[i] = frames[Math.max(0, i - 1)] || '';
        // Don't advance prev — retry from same anchor
      }
    }

    // Filter out any blank frames
    const validFrames = frames.filter(Boolean);

    console.log('LOOP_GEN complete: %d/%d frames generated', validFrames.length, frameCount);

    return NextResponse.json({
      frames: validFrames,
      frameCount: validFrames.length,
      motionType: loopSettings.motionType,
      transitionMode: loopSettings.transitionMode ?? 'dissolve',
      fallbackUsed: false,
    });

  } catch (err: any) {
    console.error('[generate-loop] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Loop generation failed' }, { status: 500 });
  }
}

// ─── Loop close prompt ────────────────────────────────────────────────────────
// Used for the LAST frame. Input image = first frame.
// Goal: produce a frame that sits visually between the previous frame
// and frame 0, so the loop plays back smoothly.

function buildLoopClosePrompt(
  basePrompt: string,
  loopSettings: LoopSettings,
  totalFrames: number,
  worldPreset: WorldPreset | null,
  mode: ArtReviveMode,
): string {
  return [
    basePrompt,
    [
      `ANIMATION FRAME ${totalFrames} OF ${totalFrames} — SEAMLESS LOOP CLOSURE.`,
      `The input image is FRAME 1 (the opening state of the loop).`,
      `Your task: produce a frame that visually bridges the gap between the previous frame and this opening state.`,
      `The result must feel like a natural transition BACK TO the beginning so the loop plays seamlessly.`,
      `Match the exact composition, subject, lighting mood, and world-style of the input (frame 1).`,
      `Only the world-animation energy level should be slightly lower / returning to the resting opening state.`,
      `Do NOT introduce any new elements. Do NOT change the subject or composition.`,
      `This frame must make the loop feel like it never ends — continuous, smooth, infinite.`,
    ].join(' '),
    `Loop softness ${Math.round(loopSettings.loopSoftness * 100)}% — maximum visual continuity required.`,
    worldPreset ? `World style returning to opening resting state of the ${worldPreset} world.` : '',
  ].filter(Boolean).join('\n\n');
}
