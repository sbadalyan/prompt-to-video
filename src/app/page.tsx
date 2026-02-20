"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Input from '../components/Input';
import type { PromoVideoProps } from '../components/remotion/PromoVideo';

const VideoPlayer = dynamic(() => import("../components/VideoPlayer").then(mod => mod.VideoPlayer), { ssr: false });

export default function Home() {
  const [promptData, setPromptData] = useState<PromoVideoProps["data"] | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
        <Input onGenerate={setPromptData} />
        {promptData && <VideoPlayer promptData={promptData} />}
      </main>
    </div>
  );
}
