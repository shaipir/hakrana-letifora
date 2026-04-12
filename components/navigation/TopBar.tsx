'use client';
import { usePathname } from 'next/navigation';
import { Settings, HelpCircle } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/projects': '📁 פרויקטים',
  '/create':   '✨ יצירה',
  '/edit':     '✏️ עריכה',
  '/animate':  '⚡ אנימציה',
  '/map':      '🗺️ מיפוי',
  '/live':     '🟥 Live',
};

export default function TopBar() {
  const path = usePathname();
  const base = '/' + (path.split('/')[1] || '');
  const title = TITLES[base] || 'הקרנה לתפאורה';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 glass border-b border-white/10">
      <span className="text-base font-semibold">{title}</span>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          <HelpCircle size={18} />
        </button>
        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
