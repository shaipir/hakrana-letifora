import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Project = {
  id: string;
  name: string;
  type: 'flat_surface' | 'face_mapping' | 'sculpture_mapping' | 'multi_surface';
  thumbnail_url: string | null;
  canvas_width: number;
  canvas_height: number;
  frame_rate: number;
  loop_duration: number;
  created_at: string;
  updated_at: string;
};

export type Scene = {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
};

export type DBLayer = {
  id: string;
  scene_id: string;
  name: string;
  type: string;
  visible: boolean;
  opacity: number;
  blend_mode: string;
  effect: string;
  effect_params: Record<string, number>;
  corner_pin: Record<string, unknown>;
  mask_points: unknown[];
  media_url: string | null;
  media_type: string | null;
  theme: string | null;
  animation_preset: string | null;
  order_index: number;
};
