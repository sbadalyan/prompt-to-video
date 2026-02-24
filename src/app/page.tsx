"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Input, { type VideoType } from '../components/Input';
import TemplateSelector from '../components/TemplateSelector';
import { TEMPLATES } from '../lib/templates';
import type { Template } from '../lib/templates';
import type { VideoResult } from '../components/VideoPlayer';

const VideoPlayer = dynamic(
  () => import("../components/VideoPlayer").then((mod) => mod.VideoPlayer),
  { ssr: false }
);

type Step = 'prompt' | 'templates' | 'generating' | 'video';

export default function Home() {
  const [step, setStep] = useState<Step>('prompt');
  const [prompt, setPrompt] = useState('');
  const [promptData, setPromptData] = useState<VideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = async (promptValue: string, template: Template, errorStep: Step = 'templates') => {
    setStep('generating');
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptValue, template }),
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Server error (${res.status}): ${text || "empty response"}`);
      }
      const data = JSON.parse(text);
      setPromptData(data.result);
      setStep('video');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep(errorStep);
    }
  };

  const handlePromptSubmit = (value: string, type: VideoType) => {
    setPrompt(value);
    setError(null);

    if (type === 'chart') {
      const chartTemplate = TEMPLATES.find((t) => t.type === 'chart');
      if (chartTemplate) {
        generateVideo(value, chartTemplate, 'prompt');
      }
    } else {
      setStep('templates');
    }
  };

  const handleTemplateSelect = (template: Template) => {
    generateVideo(prompt, template, 'templates');
  };

  return (
    <div className="flex min-h-screen justify-center font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-6 py-16">

        {step === 'prompt' && (
          <>
            <div className="text-center">Turn your idea into stunning videos in seconds</div>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}
            <Input onSubmit={handlePromptSubmit} />
          </>
        )}

        {step === 'templates' && (
          <TemplateSelector
            prompt={prompt}
            onSelect={handleTemplateSelect}
            onBack={() => setStep('prompt')}
            disabled={false}
            error={error}
          />
        )}

        {step === 'generating' && (
          <div className="flex flex-col items-center gap-4 py-16">
            <svg
              className="animate-spin w-10 h-10 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <div className="text-center">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Generating your video</p>
              <p className="text-sm text-zinc-500 mt-1">This may take a minute…</p>
            </div>
          </div>
        )}

        {step === 'video' && promptData && (
          <div className="flex flex-col gap-6">
            <VideoPlayer promptData={promptData} />
            <button
              onClick={() => { setStep('prompt'); setPromptData(null); setError(null); }}
              className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-center"
            >
              ← Create another video
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
