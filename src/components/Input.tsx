'use client';
import { useState } from 'react';

interface InputProps {
  onSubmit: (prompt: string) => void;
}

const Input = ({ onSubmit }: InputProps) => {
  const [promptValue, setPromptValue] = useState('');

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (promptValue.trim()) {
      onSubmit(promptValue.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={promptValue}
        placeholder="Describe your video..."
        onChange={(e) => setPromptValue(e.target.value)}
        className="h-32 w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
      />
      <button
        type="submit"
        disabled={!promptValue.trim()}
        className="mt-3 w-full rounded-lg px-6 py-2.5 font-medium text-white transition-colors bg-blue-500 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        Find Templates →
      </button>
    </form>
  );
};

export default Input;
