'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Copy, Clock, Film, User, Layers, Grid } from 'lucide-react';
import { supabase, type Project } from '@/lib/supabase';
import AppShell from '@/components/navigation/AppShell';

const TYPE_LABELS: Record<string, string> = {
  flat_surface: 'Flat Surface',
  face_mapping: 'Face Mapping',
  sculpture_mapping: 'Sculpture',
  multi_surface: 'Multi-Surface',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flat_surface: <Grid size={14} />,
  face_mapping: <User size={14} />,
  sculpture_mapping: <Layers size={14} />,
  multi_surface: <Film size={14} />,
};

const TYPE_COLORS: Record<string, string> = {
  flat_surface: 'bg-blue-500/20 text-blue-300',
  face_mapping: 'bg-purple-500/20 text-purple-300',
  sculpture_mapping: 'bg-amber-500/20 text-amber-300',
  multi_surface: 'bg-teal-500/20 text-teal-300',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('פרויקט חדש');
  const [newType, setNewType] = useState<Project['type']>('flat_surface');

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  }

  async function createProject() {
    const { data } = await supabase.from('projects').insert({ name: newName, type: newType }).select().single();
    if (data) { setProjects(p => [data, ...p]); setShowNew(false); setNewName('פרויקט חדש'); }
  }

  async function deleteProject(id: string) {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(p => p.filter(x => x.id !== id));
  }

  async function duplicateProject(project: Project) {
    const { data } = await supabase.from('projects').insert({ ...project, id: undefined, name: project.name + ' עותק' }).select().single();
    if (data) setProjects(p => [data, ...p]);
  }

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">הפרויקטים שלי</h1>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors accent-glow"
          >
            <Plus size={16} /> פרויקט חדש
          </button>
        </div>

        {/* New project modal */}
        {showNew && (
          <div className="mb-6 p-4 glass rounded-2xl">
            <h3 className="font-semibold mb-3">פרויקט חדש</h3>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm mb-3"
              placeholder="שם הפרויקט"
            />
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.keys(TYPE_LABELS) as Project['type'][]).map(t => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
                    newType === t ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {TYPE_ICONS[t]} {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={createProject} className="flex-1 py-2 bg-accent rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors">צור</button>
              <button onClick={() => setShowNew(false)} className="flex-1 py-2 bg-white/5 rounded-lg text-sm text-gray-400 hover:bg-white/10 transition-colors">בטל</button>
            </div>
          </div>
        )}

        {/* Projects list */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">טוען...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎭</div>
            <p className="text-gray-400">אין פרויקטים עדיין. צור אחד!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map(project => (
              <div key={project.id} className="glass rounded-2xl p-4 flex items-center gap-4 hover:border-white/20 transition-all">
                {/* Thumbnail */}
                <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-accent/30 to-purple-900/50 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🎭</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/editor?project=${project.id}`} className="font-semibold text-white hover:text-accent transition-colors block truncate">
                    {project.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${TYPE_COLORS[project.type]}`}>
                      {TYPE_ICONS[project.type]} {TYPE_LABELS[project.type]}
                    </span>
                    <span className="text-gray-600 text-xs flex items-center gap-1">
                      <Clock size={10} /> {new Date(project.updated_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => duplicateProject(project)} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                    <Copy size={15} />
                  </button>
                  <button onClick={() => deleteProject(project.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
