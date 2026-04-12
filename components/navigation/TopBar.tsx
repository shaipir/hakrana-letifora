'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, Download, LayoutTemplate, ChevronLeft } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/projects':  '📁 פרויקטים',
  '/create':    '✨ יצירה',
  '/edit':      '✏️ עריכה',
  '/animate':   '⚡ אנימציה',
  '/map':       '🗺️ מיפוי',
  '/live':      '🟥 Live',
  '/templates': '🎭 תבניות',
  '/export':    '⬇️ ייצוא',
  '/settings':  '⚙️ הגדרות',
};

export default function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const base = '/' + (path.split('/')[1] || '');
  const title = TITLES[base] || 'הקרנה לתפאורה';
  const isEditor = base === '/editor';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 glass border-b border-white/10">
      {isEditor ? (
        <button onClick={() => router.push('/projects')} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          <ChevronLeft size={18} />
        </button>
      ) : (
        <span className="text-base font-semibold">{title}</span>
      )}

      <div className="flex items-center gap-1">
        <button onClick={() => router.push('/templates')} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="תבניות">
          <LayoutTemplate size={17} />
        </button>
        <button onClick={() => router.push('/export')} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="ייצוא">
          <Download size={17} />
        </button>
        <button onClick={() => router.push('/settings')} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="הגדרות">
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}
