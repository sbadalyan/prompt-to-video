'use client';
import { useState, useRef } from 'react';

export type VideoType = 'promo' | 'chart' | 'line-chart';

interface InputProps {
  onSubmit: (prompt: string, type: VideoType) => void;
}

const TabIcons: Record<VideoType, React.ReactNode> = {
  promo: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
    </svg>
  ),
  chart: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-8 4 4 4-6 4 10" />
    </svg>
  ),
  'line-chart': (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline strokeLinecap="round" strokeLinejoin="round" points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

const TYPE_LABELS: Record<VideoType, string> = {
  promo: 'Presentation',
  chart: 'Bar Chart Race',
  'line-chart': 'Line Chart',
};

const PLACEHOLDERS: Record<VideoType, string> = {
  chart: 'e.g. Top 10 most subscribed YouTube channels 2005–2024',
  'line-chart': 'e.g. Revenue growth of Apple, Google, and Microsoft 2010–2024',
  promo: 'Describe your video idea…',
};

const Input = ({ onSubmit }: InputProps) => {
  const [promptValue, setPromptValue] = useState('');
  const [videoType, setVideoType] = useState<VideoType>('promo');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (promptValue.trim()) {
      onSubmit(promptValue.trim(), videoType);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && promptValue.trim()) {
      onSubmit(promptValue.trim(), videoType);
    }
  };

  const buttonLabel = videoType === 'promo' ? 'Choose Style' : 'Generate Chart';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Type tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 self-start">
        {(['promo', 'chart', 'line-chart'] as VideoType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setVideoType(type);
              textareaRef.current?.focus();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              videoType === type
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {TabIcons[type]}
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={promptValue}
          placeholder={PLACEHOLDERS[videoType]}
          onChange={(e) => setPromptValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 transition-all"
        />
        <div className="absolute bottom-3 right-3 text-[10px] text-zinc-300 dark:text-zinc-600 select-none pointer-events-none">
          ⌘↵
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!promptValue.trim()}
        className="flex items-center justify-center gap-2 w-full rounded-xl px-6 py-3 font-semibold text-white transition-all bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 disabled:from-blue-300 disabled:to-violet-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.99]"
      >
        {buttonLabel}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </form>
  );
};

export default Input;
