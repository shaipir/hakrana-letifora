'use client';
import Link from 'next/link';
import { Wand2, FolderOpen } from 'lucide-react';
import AppShell from '@/components/navigation/AppShell';

export default function ProjectsPage() {
  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">🎭 הקרנה לתפאורה</h1>

        {/* Studio - main CTA */}
        <Link href="/studio"
          className="block p-6 rounded-3xl bg-gradient-to-br from-violet-600/30 to-purple-900/30 border border-violet-500/30 hover:border-violet-500 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🎯
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Studio AI</h2>
              <p className="text-gray-400 text-sm mt-0.5">העלה תמונה → זהה אזורים → הקרן תלת מימד → צור סגנונות</p>
              <div className="flex gap-2 mt-2">
                {['זיהוי AI', 'תלת מימד', 'סגנונות', 'לופ וידאו'].map(t => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Link>

        {/* Editor */}
        <Link href="/editor"
          className="block p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
              🖥️
            </div>
            <div>
              <h3 className="font-bold text-white">Editor מתקדם</h3>
              <p className="text-gray-500 text-sm">Canvas עם WebGL, Corner Pin, הקלטת לופ</p>
            </div>
          </div>
        </Link>
      </div>
    </AppShell>
  );
}
