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
export const maxDuration = 120;  // extended for sequential generation

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Route ────────────────────────────────────────────────────────────────────

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

    console.log('LOOP_GEN mode=%s frames=%d motionType=%s hasKey=%s', mode, frameCount, loopSettings.motionType, !!apiKey);

    const frames: string[] = new Array(frameCount).fill('');
    const fallbackCount = { n: 0 };

    if (apiKey) {
      // ── Sequential generation: each frame uses the PREVIOUS frame as input ──
      // This is the key mechanism for temporal continuity.
      let prevBase64 = imageBase64;
      let prevMimeType = mimeType;

      for (let i = 0; i < frameCount; i++) {
        const prompt = buildFrameMotionPrompt(
          basePrompt, loopSettings, i, frameCount, worldPreset, mode, i === 0
        );

        const result = await generateFrame(prevBase64, prevMimeType, prompt, apiKey);

        if (result.url) {
          frames[i] = result.url;
          // Feed this frame's output into the next frame's input
          const extracted = extractBase64FromDataUrl(result.url);
          if (extracted) {
            prevBase64 = extracted.base64;
            prevMimeType = extracted.mimeType;
          }
          // If extraction fails, fall back to original image for next frame
        } else {
          console.warn('LOOP_GEN frame %d failed: %s', i, result.error);
          // Fallback: keep original image as anchor for next frame
          const seed = Math.floor(Math.random() * 99999);
          const encoded = encodeURIComponent(prompt.slice(0, 500));
          frames[i] = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;
          fallbackCount.n++;
          // Reset to original image to maintain anchor on failure
          prevBase64 = imageBase64;
          prevMimeType = mimeType;
        }
      }
    } else {
      // No API key — Pollinations fallback.
      // Use seeded prompts with rising frame index so there's at least some
      // intentional progression in the returned images.
      const baseSeed = Math.floor(Math.random() * 90000) + 10000;
      for (let i = 0; i < frameCount; i++) {
        const prompt = buildFrameMotionPrompt(
          basePrompt, loopSettings, i, frameCount, worldPreset, mode, i === 0
        );
        const encoded = encodeURIComponent(prompt.slice(0, 500));
        // Use sequential seeds from same base so pollinations results are more consistent
        frames[i] = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${baseSeed + i}`;
        fallbackCount.n++;
      }
    }

    console.log('LOOP_GEN complete: %d gemini, %d fallback', frameCount - fallbackCount.n, fallbackCount.n);

    return NextResponse.json({
      frames,
      frameCount,
      motionType: loopSettings.motionType,
      transitionMode: loopSettings.transitionMode ?? 'dissolve',
      fallbackUsed: fallbackCount.n > 0,
    });

  } catch (err: any) {
    console.error('[generate-loop] unhandled:', err);
    return NextResponse.json({ error: err?.message ?? 'Loop generation failed' }, { status: 500 });
  }
}
