'use client';
import { useState } from 'react';
import type { PromoVideoProps } from './remotion/PromoVideo';

export type PromptData = PromoVideoProps['data'];

interface InputProps {
  onGenerate: (data: NonNullable<PromptData>) => void;
}

const Input = ({ onGenerate }: InputProps) => {
  const [promptValue, setPromptValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptValue }),
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Server error (${res.status}): ${text || "empty response"}`);
      }
      const data = JSON.parse(text);
      onGenerate(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <textarea
        value={promptValue}
        placeholder='Describe your video prompt...'
        onChange={(event) => setPromptValue(event.target.value)}
        className='h-32 w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500'
      />
      {error && <p className='mt-2 text-sm text-red-500'>{error}</p>}
      <button
        disabled={loading}
        className={`mt-3 w-full rounded-lg px-6 py-2.5 font-medium text-white transition-colors ${loading ? 'cursor-not-allowed bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'}`}
      >
        {loading ? 'Generating...' : 'Generate Video'}
      </button>
    </form>
  );
}
export default Input;
