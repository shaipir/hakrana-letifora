'use client';

import { useState } from 'react';
import { Clock, Trash2, RotateCcw, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { GenerationHistoryItem } from '@/lib/types';
import { deleteHistoryItem, clearAllHistory } from '@/lib/project-persistence';

const MODE_LABELS: Record<string, string> = {
  'restyle': 'World Transform',
  'glow-sculpture': 'Glow Sculpture',
  'house-projection': 'House Projection',
};

const MODE_COLORS: Record<string, string> = {
  'restyle': 'text-ar-violet bg-ar-violet/20',
  'glow-sculpture': 'text-ar-accent bg-ar-accent/20',
  'house-projection': 'text-orange-400 bg-orange-400/20',
};

function HistoryItem({
  item,
  onDelete,
}: {
  item: GenerationHistoryItem;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(item.createdAt);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="border border-ar-border rounded-md bg-ar-surface overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-2.5 py-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${MODE_COLORS[item.mode] ?? 'text-ar-text-muted bg-ar-border'}`}>
              {MODE_LABELS[item.mode] ?? item.mode}
            </span>
            {item.outputType === 'loop' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-ar-border text-ar-text-dim">loop</span>
            )}
            {item.fallbackUsed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">fallback</span>
            )}
          </div>
          <p className="text-[10px] text-ar-text-dim">{dateStr} {timeStr}</p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-ar-text-dim hover:text-ar-text transition-colors p-0.5"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onDelete}
          className="text-ar-text-dim hover:text-ar-neon-pink transition-colors p-0.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-2.5 pb-2.5 border-t border-ar-border space-y-1.5">
          {item.prompt && (
            <div>
              <span className="text-[10px] text-ar-text-dim uppercase tracking-widest">Prompt</span>
              <p className="text-xs text-ar-text-muted mt-0.5 line-clamp-3">{item.prompt}</p>
            </div>
          )}
          {item.model && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-ar-text-dim">Model:</span>
              <span className="text-[10px] text-ar-text-muted font-mono">{item.model}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-ar-text-dim">Outputs:</span>
            <span className="text-[10px] text-ar-text-muted">{item.resultAssetIds.length} asset(s)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectHistoryPanel() {
  const { project, removeGenerationHistory, clearGenerationHistory, renameProject } = useArtReviveStore();
  const { generationHistory, name } = project;
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  function handleDeleteItem(id: string) {
    deleteHistoryItem(id);
    removeGenerationHistory(id);
  }

  function handleClearAll() {
    if (!window.confirm('Clear all generation history? This cannot be undone.')) return;
    clearAllHistory();
    clearGenerationHistory();
  }

  function handleRename() {
    if (nameInput.trim()) renameProject(nameInput.trim());
    setEditingName(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project name */}
      <div className="px-3 py-2.5 border-b border-ar-border">
        {editingName ? (
          <input
            autoFocus
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false); }}
            className="w-full bg-ar-surface border border-ar-accent/50 rounded px-2 py-0.5 text-xs text-ar-text focus:outline-none"
          />
        ) : (
          <button
            onClick={() => { setNameInput(name); setEditingName(true); }}
            className="text-xs text-ar-text hover:text-ar-accent transition-colors font-medium text-left truncate w-full"
            title="Click to rename project"
          >
            {name}
          </button>
        )}
        <p className="text-[10px] text-ar-text-dim mt-0.5">{generationHistory.length} generation{generationHistory.length !== 1 ? 's' : ''}</p>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {generationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-2">
            <Clock className="w-6 h-6 text-ar-text-dim opacity-30" />
            <p className="text-xs text-ar-text-dim text-center px-4">
              Every generation is saved here automatically
            </p>
          </div>
        ) : (
          generationHistory.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))
        )}
      </div>

      {/* Clear button */}
      {generationHistory.length > 0 && (
        <div className="px-3 py-2 border-t border-ar-border">
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-ar-border text-xs text-ar-text-muted hover:text-ar-neon-pink hover:border-ar-neon-pink/40 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Clear History
          </button>
        </div>
      )}
    </div>
  );
}
