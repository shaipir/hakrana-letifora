'use client';

import { useMappingStore } from '@/lib/mapping-store';
import { MappingTab } from '@/lib/mapping-types';

const TABS: { id: MappingTab; label: string }[] = [
  { id: 'create', label: 'Create' },
  { id: 'map', label: 'Map' },
  { id: 'warp', label: 'Warp' },
  { id: 'live', label: 'Live' },
];

export default function ModeTabBar() {
  const { activeTab, setActiveTab } = useMappingStore();

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 border-b border-ar-border bg-ar-panel">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-1.5 rounded text-xs font-medium tracking-wide transition-all ${
            activeTab === tab.id
              ? 'bg-ar-accent/15 text-ar-accent border border-ar-accent/40 shadow-ar-glow-sm'
              : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-surface border border-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
      <div className="ml-2 flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-ar-accent/40" />
        <span className="text-[10px] text-ar-text-dim uppercase tracking-wider">
          {activeTab}
        </span>
      </div>
    </div>
  );
}
