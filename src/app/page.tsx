"use client";
import { useState, useEffect } from "react";
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

const GENERATING_MESSAGES = [
  "Crafting your story…",
  "Fetching visuals…",
  "Composing scenes…",
  "Adding animations…",
  "Almost ready…",
];

function GeneratingState() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % GENERATING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-20">
      {/* Animated ring */}
      <div className="relative w-16 h-16">
        <svg
          className="absolute inset-0 animate-spin w-16 h-16 text-blue-500"
          fill="none"
          viewBox="0 0 64 64"
        >
          <circle
            cx="32" cy="32" r="28"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="88 88"
            className="opacity-20"
          />
          <circle
            cx="32" cy="32" r="28"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="44 132"
            className="opacity-80"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
        </div>
      </div>

      <div className="text-center">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
          Generating your video
        </p>
        <p
          key={msgIndex}
          className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-opacity duration-500"
        >
          {GENERATING_MESSAGES[msgIndex]}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1.5">
        {GENERATING_MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === msgIndex
                ? 'w-6 bg-blue-500'
                : i < msgIndex
                ? 'w-2 bg-blue-300 dark:bg-blue-700'
                : 'w-2 bg-zinc-200 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

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
      if (chartTemplate) generateVideo(value, chartTemplate, 'prompt');
    } else if (type === 'line-chart') {
      const lineChartTemplate = TEMPLATES.find((t) => t.type === 'line-chart');
      if (lineChartTemplate) generateVideo(value, lineChartTemplate, 'prompt');
    } else {
      setStep('templates');
    }
  };

  const handleTemplateSelect = (template: Template) => {
    generateVideo(prompt, template, 'templates');
  };

  return (
    <div className="flex min-h-screen flex-col items-center font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-6 py-16">

        {step === 'prompt' && (
          <>
            {/* Hero */}
            <div className="text-center flex flex-col gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                Turn any idea into a{' '}
                <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
                  stunning video
                </span>
              </h1>
              <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Describe what you want — AI handles the rest. Presentations, bar chart races, line charts, and more.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-4 py-3">
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

        {step === 'generating' && <GeneratingState />}

        {step === 'video' && promptData && (
          <div className="flex flex-col gap-6">
            <VideoPlayer promptData={promptData} />
            <button
              onClick={() => { setStep('prompt'); setPromptData(null); setError(null); }}
              className="flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors mx-auto group"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Create another video
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
