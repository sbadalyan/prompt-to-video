import OpenAI from "openai";
import { NextResponse } from "next/server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // 1. Spin up the Remotion MCP server
    const transport = new StdioClientTransport({
      command: "npx",
      args: ["@remotion/mcp@latest"],
    });
    const client = new Client({ name: "my-app", version: "1.0.0" });
    await client.connect(transport);

    // 2. Query Remotion docs for context
    const docsResult = await client.callTool({
      name: "remotion-documentation",
      arguments: { query: prompt },
    });
    const firstBlock = Array.isArray(docsResult.content)
      ? docsResult.content[0]
      : undefined;
    const remotionDocs =
      firstBlock && "text" in firstBlock ? (firstBlock.text as string) : "";

    await client.close();

    // 3. Generate video script with Remotion context
    const message = await openrouter.chat.completions.create({
      model: "meta-llama/llama-4-scout",
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `You are a Remotion scene generator.

Your task:
Generate structured JSON describing animated video scenes with multiple elements per scene.

Return ONLY valid JSON in this exact format:

{
  "title": "My Video",
  "fps": 30,
  "scenes": [
    {
      "id": 1,
      "duration": 150,
      "layout": "absolute",
      "elements": [
        {
          "type": "background",
          "style": {
            "color": "#1a1a2e"
          }
        },
        {
          "type": "text",
          "content": "Hello World",
          "position": "center",
          "style": {
            "fontSize": 64,
            "color": "#ffffff",
            "fontWeight": "bold"
          },
          "animation": {
            "enter": "fade",
            "duration": 20
          }
        },
        {
          "type": "image",
          "searchQuery": "sunset over mountains",
          "position": "bottom-center",
          "animation": {
            "enter": "fade",
            "duration": 20
          }
        }
      ]
    }
  ]
}



Rules:
- fps is always 30
- 3–6 scenes
- "duration" is always in frames (not seconds). Each scene duration: 90–180 frames (3–6 seconds at 30fps)
- Animation "duration" is also in frames: 15–30 frames
- Every scene must have a "background" element as its first element
- Use dark or vivid background colors (never white/light backgrounds like #ffffff or #f0f0f0)
- Text color must contrast with the background (e.g. white text on dark background)
- Each scene should have at least one "text" element with a "style" object containing fontSize, color, and fontWeight
- Short, punchy text (max 12 words)
- Scene 1 = hook
- Last scene = call to action
- Valid positions are ONLY: "top-left", "top-center", "top-right", "center", "bottom-left", "bottom-center", "bottom-right"
- Use varied positions and animations across scenes
- Each scene should have at most 2 text elements, placed at DIFFERENT positions to avoid overlap
- You may optionally include ONE "image" element per scene (not required in every scene)
- Image elements use "searchQuery" (a short English phrase describing the photo, 2–5 words) — NEVER use "src" or a URL
- Images work best in middle scenes, not the hook (scene 1) or call-to-action (last scene)
- When a scene has an image, ALWAYS place the image at "bottom-center" and text at "top-left" or "top-center"
- Do not place an image at the same position as a text element
- No extra commentary, no markdown, no explanation — only JSON

Here are remotion docs:
${remotionDocs}`,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = message.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "The AI returned malformed JSON. Please try again with a simpler prompt." },
        { status: 502 },
      );
    }

    // Resolve image searchQuery fields via Unsplash API
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    if (unsplashKey && Array.isArray(parsed.scenes)) {
      const imageElements: { element: Record<string, unknown>; query: string }[] = [];
      for (const scene of parsed.scenes) {
        if (!Array.isArray(scene.elements)) continue;
        for (const el of scene.elements) {
          if (
            el.type === "image" &&
            typeof el.searchQuery === "string" &&
            el.searchQuery.length > 0
          ) {
            imageElements.push({ element: el, query: el.searchQuery });
          }
        }
      }

      await Promise.allSettled(
        imageElements.map(async ({ element, query }) => {
          const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${unsplashKey}`;
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          const photo = data.results?.[0];
          if (photo?.urls?.regular) {
            element.src = photo.urls.regular;
          }
          delete element.searchQuery;
        })
      );
    }

    // Sanitize scenes
    if (Array.isArray(parsed.scenes)) {
      for (const scene of parsed.scenes) {
        // Default missing duration to 150 frames (5s)
        if (!scene.duration || typeof scene.duration !== "number") {
          scene.duration = 150;
        }
        // Default missing elements to empty array
        if (!Array.isArray(scene.elements)) {
          scene.elements = [];
        }
        // Strip image elements that have no valid src
        scene.elements = scene.elements.filter(
          (el: { type: string; src?: string }) =>
            el.type !== "image" || (typeof el.src === "string" && el.src.length > 0)
        );
      }
    }

    console.log(parsed);

    return NextResponse.json({ result: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log(error, 'error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}