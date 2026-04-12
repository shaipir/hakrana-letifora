'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderOpen, Sparkles, Pencil, Zap, Map, Radio } from 'lucide-react';
import clsx from 'clsx';

const NAV = [
  { href: '/projects', icon: FolderOpen, label: 'פרויקטים' },
  { href: '/create',   icon: Sparkles,   label: 'יצירה'   },
  { href: '/edit',     icon: Pencil,      label: 'עריכה'   },
  { href: '/animate',  icon: Zap,         label: 'אנימציה' },
  { href: '/map',      icon: Map,         label: 'מיפוי'    },
  { href: '/live',     icon: Radio,       label: 'שידור'    },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 glass border-t border-white/10">
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = path.startsWith(href);
        return (
          <Link key={href} href={href} className={clsx(
            'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all',
            active ? 'text-accent' : 'text-gray-500 hover:text-gray-300'
          )}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
