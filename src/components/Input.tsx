'use client';
import { useState } from 'react';

export type VideoType = 'promo' | 'chart';

interface InputProps {
  onSubmit: (prompt: string, type: VideoType) => void;
}

const Input = ({ onSubmit }: InputProps) => {
  const [promptValue, setPromptValue] = useState('');
  const [videoType, setVideoType] = useState<VideoType>('promo');

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (promptValue.trim()) {
      onSubmit(promptValue.trim(), videoType);
    }
  };

  const placeholder =
    videoType === 'chart'
      ? 'e.g. Top 10 most subscribed YouTube channels 2005–2024'
      : 'Describe your video idea...';

  const buttonLabel =
    videoType === 'chart' ? 'Generate Chart →' : 'Choose Style →';

  const TYPE_LABELS: Record<VideoType, string> = {
    promo: 'Presentation',
    chart: 'Bar Chart Race',
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Type tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 self-start">
        {(['promo', 'chart'] as VideoType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setVideoType(type)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              videoType === type
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <textarea
        value={promptValue}
        placeholder={placeholder}
        onChange={(e) => setPromptValue(e.target.value)}
        className="h-32 w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
      />
      <button
        type="submit"
        disabled={!promptValue.trim()}
        className="w-full rounded-lg px-6 py-2.5 font-medium text-white transition-colors bg-blue-500 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {buttonLabel}
      </button>
    </form>
  );
};

export default Input;
