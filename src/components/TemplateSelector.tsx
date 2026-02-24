'use client';
import { TEMPLATES } from '../lib/templates';
import type { Template } from '../lib/templates';
import TemplateCard from './TemplateCard';

interface Props {
  prompt: string;
  onSelect: (template: Template) => void;
  onBack: () => void;
  disabled: boolean;
  error: string | null;
}

export default function TemplateSelector({ prompt, onSelect, onBack, disabled, error }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={disabled}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors disabled:opacity-40"
        >
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-100">Choose a template</h2>
          <p className="text-xs text-zinc-400 truncate">"{prompt}"</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
