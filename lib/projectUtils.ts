import { supabase } from './supabase';
import type { Layer } from './types';

export async function saveProject(projectId: string, name: string, layers: Layer[]) {
  // Update project name and timestamp
  await supabase
    .from('projects')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  // Get or create scene
  let sceneId: string;
  const { data: scenes } = await supabase
    .from('scenes')
    .select('id')
    .eq('project_id', projectId)
    .limit(1);

  if (scenes && scenes.length > 0) {
    sceneId = scenes[0].id;
    // Delete existing layers
    await supabase.from('layers').delete().eq('scene_id', sceneId);
  } else {
    const { data: newScene } = await supabase
      .from('scenes')
      .insert({ project_id: projectId, name: 'Scene 1' })
      .select('id')
      .single();
    sceneId = newScene?.id;
  }

  if (!sceneId) return false;

  // Save all layers
  const layerRows = layers.map((l, i) => ({
    scene_id: sceneId,
    name: l.name,
    type: l.type,
    visible: l.visible,
    opacity: l.opacity,
    blend_mode: l.blendMode,
    effect: l.effect,
    effect_params: l.effectParams,
    corner_pin: l.cornerPin,
    mask_points: l.mask ?? [],
    media_url: l.mediaUrl,
    media_type: l.mediaType,
    theme: l.theme,
    animation_preset: l.animationPreset,
    order_index: i,
  }));

  if (layerRows.length > 0) {
    await supabase.from('layers').insert(layerRows);
  }

  return true;
}

export async function loadProject(projectId: string) {
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (!project) return null;

  const { data: scenes } = await supabase
    .from('scenes')
    .select('*, layers(*)')
    .eq('project_id', projectId)
    .order('order_index')
    .limit(1);

  return { project, scene: scenes?.[0] ?? null };
}
