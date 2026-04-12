'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AppShell from '@/components/navigation/AppShell';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

type Template = {
  id: string;
  name: string;
  type: string;
  thumbnail_url: string | null;
  config: Record<string, unknown>;
};

const TEMPLATE_EMOJIS: Record<string, string> = {
  face_mapping: '🎭',
  sculpture_mapping: '🗿',
  multi_surface: '🔳',
  flat_surface: '📐',
};

const TEMPLATE_GRADIENTS: Record<string, string> = {
  face_mapping: 'from-purple-700 to-pink-900',
  sculpture_mapping: 'from-amber-700 to-stone-900',
  multi_surface: 'from-blue-700 to-indigo-900',
  flat_surface: 'from-teal-700 to-cyan-900',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.from('templates').select('*').order('created_at').then(({ data }) => {
      setTemplates(data ?? []);
    });
  }, []);

  async function useTemplate(template: Template) {
    const { data } = await supabase
      .from('projects')
      .insert({
        name: template.name,
        type: template.type,
      })
      .select()
      .single();
    if (data) router.push(`/editor?project=${data.id}`);
  }

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-gray-400 text-sm mb-6">התחל מתבנית מוכנה עם הגדרות ומסכות</p>

        <div className="grid grid-cols-2 gap-3">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => useTemplate(t)}
              className="group text-right glass rounded-2xl overflow-hidden hover:border-accent/50 transition-all"
            >
              <div className={`h-28 bg-gradient-to-br ${TEMPLATE_GRADIENTS[t.type] ?? 'from-gray-700 to-gray-900'} flex items-center justify-center text-5xl`}>
                {TEMPLATE_EMOJIS[t.type] ?? '✨'}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm text-white group-hover:text-accent transition-colors">{t.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.type.replace('_', ' ')}</p>
              </div>
            </button>
          ))}

          {/* Blank */}
          <button
            onClick={() => router.push('/projects')}
            className="group text-right glass rounded-2xl overflow-hidden hover:border-accent/50 transition-all"
          >
            <div className="h-28 bg-white/5 flex items-center justify-center">
              <Plus size={32} className="text-gray-600 group-hover:text-accent transition-colors" />
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm text-gray-400 group-hover:text-white transition-colors">פרויקט ריק</p>
              <p className="text-xs text-gray-600 mt-0.5">blank project</p>
            </div>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
