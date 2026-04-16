import { BeatDivision, BpmSyncSettings } from './types';

const BEAT_DIVISION_FACTORS: Record<BeatDivision, number> = {
  '1/4': 0.25,
  '1/2': 0.5,
  '1':   1,
  '2':   2,
  '4':   4,
};

/**
 * Returns the frame interval in ms for a given BPM + beat division.
 * e.g. 120 BPM + "1" division = 500ms per frame
 *      120 BPM + "1/2" division = 250ms per frame
 */
export function bpmToFrameIntervalMs(bpm: number, beatDivision: BeatDivision): number {
  const msPerBeat = 60000 / bpm;
  return msPerBeat * BEAT_DIVISION_FACTORS[beatDivision];
}

/**
 * Converts BPM + beat division to FPS equivalent.
 */
export function bpmToFps(bpm: number, beatDivision: BeatDivision): number {
  return 1000 / bpmToFrameIntervalMs(bpm, beatDivision);
}

/**
 * Calculates total loop duration in ms given frame count and BPM settings.
 */
export function loopDurationMs(frameCount: number, bpm: number, beatDivision: BeatDivision): number {
  return bpmToFrameIntervalMs(bpm, beatDivision) * frameCount;
}

/**
 * Given an array of tap timestamps (Date.now()), estimates BPM.
 * Returns null if fewer than 2 taps.
 * Clamps to [60, 200].
 */
export function tapTempoToBpm(timestamps: number[]): number | null {
  if (timestamps.length < 2) return null;
  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round(60000 / avgInterval);
  return Math.min(200, Math.max(60, bpm));
}

export const BPM_PRESETS = [90, 100, 110, 120, 128, 140, 150, 160] as const;

export const BEAT_DIVISIONS: { value: BeatDivision; label: string }[] = [
  { value: '1/4', label: '¼ beat' },
  { value: '1/2', label: '½ beat' },
  { value: '1',   label: '1 beat' },
  { value: '2',   label: '2 beats' },
  { value: '4',   label: '4 beats' },
];

/**
 * Returns effective FPS for LoopPlayer: BPM-derived if sync enabled, else passed-in fps.
 */
export function effectiveFps(fps: number, bpmSync?: BpmSyncSettings): number {
  if (!bpmSync?.enabled) return fps;
  return bpmToFps(bpmSync.bpm, bpmSync.beatDivision);
}
