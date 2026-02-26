import OpenAI from "openai";
import { NextResponse } from "next/server";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function handleChartGeneration(prompt: string) {
  const message = await openrouter.chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    max_tokens: 16000,
    messages: [
      {
        role: "system",
        content: `You are a data visualization expert that generates animated bar chart race data.

Your task: Generate structured JSON for an animated bar chart race video based on the user's topic.

Return ONLY valid JSON with this exact structure:
{
  "type": "chart",
  "title": "Chart Title",
  "subtitle": "Date range or context (e.g. '2005 – 2024')",
  "unit": "Unit label shown beneath title (e.g. 'Monthly Active Users', 'Revenue (USD)', 'Subscribers')",
  "valueFormat": "millions",
  "framesPerPeriod": 60,
  "maxBars": 10,
  "frames": [
    {
      "label": "2005",
      "items": [
        { "name": "Item Name", "value": 1500000 },
        { "name": "Item Name 2", "value": 1200000 }
      ]
    }
  ]
}

Rules:
- "valueFormat": one of "number", "millions", "billions", "percentage" — choose what best fits the values
- CRITICAL: ALL "value" fields must ALWAYS be raw absolute numbers, never pre-divided. Examples: 57 million subscribers = 57000000, NOT 57. $3.2 billion revenue = 3200000000, NOT 3.2. 45% market share = 45, NOT 0.45.
- "framesPerPeriod": always 60
- "maxBars": always 10
- "frames": 15–25 time periods, sorted chronologically by label
- Each frame must have exactly 10–12 items sorted by value descending (highest first)
- Values must be realistic and change meaningfully between periods
- Items can enter and exit the top 10 as real rankings change — do NOT keep the same 10 items across all frames
- Use accurate historical data if the topic is well-known; otherwise generate plausible fictional data
- "label" is a short string: a year ("2005"), month+year ("Jan 2020"), or quarter ("Q1 2022")
- No markdown fences, no explanation — only the JSON object`,
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
  } catch (e) {
    console.error("Chart JSON parse failed:", e);
    return NextResponse.json(
      { error: "The AI returned malformed JSON. Please try again with a simpler prompt." },
      { status: 502 },
    );
  }

  // Validate and sanitize frames — handle common nesting patterns
  if (!Array.isArray(parsed.frames)) {
    // Some models nest the chart under a key like parsed.chart or parsed.data
    const nested = parsed.chart ?? parsed.data ?? parsed.result;
    if (nested && Array.isArray(nested.frames)) {
      Object.assign(parsed, nested);
    } else {
      console.error("Missing frames. Parsed keys:", Object.keys(parsed));
      return NextResponse.json({ error: "AI did not return chart frames." }, { status: 502 });
    }
  }

  for (const frame of parsed.frames) {
    if (!Array.isArray(frame.items)) frame.items = [];
    // Ensure values are numbers and sorted descending
    frame.items = frame.items
      .filter((item: { name?: unknown; value?: unknown }) => typeof item.name === "string" && typeof item.value === "number")
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
      .slice(0, 12);
  }

  // Remove empty frames
  parsed.frames = parsed.frames.filter((f: { items: unknown[] }) => f.items.length > 0);

  console.log("chart result", { type: parsed.type, title: parsed.title, periods: parsed.frames.length });

  return NextResponse.json({ result: parsed });
}

export async function POST(req: Request) {
  try {
    const { prompt, template } = await req.json();

    // Chart template: separate AI prompt and response structure
    if (template?.type === "chart") {
      return handleChartGeneration(prompt);
    }

    const styleGuidance = template?.styleHint
      ? `\n\nStyle guidance for this video:\n${template.styleHint}`
      : '';

    // Generate video script
    const message = await openrouter.chat.completions.create({
      model: "meta-llama/llama-4-scout",
      max_tokens: 16000,
      messages: [
        {
          role: "system",
          content: `You are a Remotion scene generator.

Your task:
Generate structured JSON describing animated video scenes with multiple elements per scene.

Return ONLY valid JSON with this exact top-level structure:
{
  "title": "Video Title",
  "fps": 30,
  "scenes": [ ...scene objects here... ]
}

Four supported scene layouts:

LAYOUT "title" — large centered title on white background, used for opening/closing:
{
  "id": 1,
  "duration": 150,
  "layout": "title",
  "elements": [
    { "type": "background", "style": { "color": "#ffffff" } },
    {
      "type": "text",
      "role": "title",
      "content": "Your Big Headline Here",
      "align": "center",
      "style": { "fontSize": 120, "color": "#111111", "fontWeight": 300 },
      "animation": { "enter": "fade", "duration": 25 }
    },
    {
      "type": "text",
      "role": "body",
      "content": "A short punchy subtitle that sets the tone.",
      "align": "center",
      "style": { "fontSize": 52, "color": "#555555", "fontWeight": 400 },
      "animation": { "enter": "fade", "duration": 30 }
    }
  ]
}

LAYOUT "split-left" — image fills left half, white content panel on right:
{
  "id": 1,
  "duration": 150,
  "layout": "split-left",
  "elements": [
    { "type": "background", "style": { "color": "#cccccc" } },
    { "type": "image", "searchQuery": "ocean waves calm" },
    {
      "type": "text",
      "role": "title",
      "content": "A Compelling Title",
      "align": "left",
      "style": { "fontSize": 80, "color": "#111111", "fontWeight": 300 },
      "animation": { "enter": "fade", "duration": 20 }
    },
    {
      "type": "text",
      "role": "body",
      "content": "Supporting text that elaborates on the main point with clarity.",
      "align": "left",
      "style": { "fontSize": 48, "color": "#444444", "fontWeight": 400 },
      "animation": { "enter": "fade", "duration": 30 }
    }
  ]
}

LAYOUT "split-right" — image fills right half, white content panel on left:
{
  "id": 2,
  "duration": 150,
  "layout": "split-right",
  "elements": [
    { "type": "background", "style": { "color": "#cccccc" } },
    { "type": "image", "searchQuery": "city skyline sunset" },
    {
      "type": "text",
      "role": "title",
      "content": "Another Great Title",
      "align": "left",
      "style": { "fontSize": 80, "color": "#111111", "fontWeight": 300 },
      "animation": { "enter": "fade", "duration": 20 }
    },
    {
      "type": "text",
      "role": "body",
      "content": "More detail about this section here.",
      "align": "left",
      "style": { "fontSize": 48, "color": "#444444", "fontWeight": 400 },
      "animation": { "enter": "fade", "duration": 30 }
    }
  ]
}

LAYOUT "text-only" — clean white background with title and body text, no image:
{
  "id": 3,
  "duration": 150,
  "layout": "text-only",
  "elements": [
    { "type": "background", "style": { "color": "#ffffff" } },
    {
      "type": "text",
      "role": "title",
      "content": "The Topic",
      "align": "left",
      "style": { "fontSize": 80, "color": "#111111", "fontWeight": 300 },
      "animation": { "enter": "fade", "duration": 20 }
    },
    {
      "type": "text",
      "role": "body",
      "content": "Supporting paragraph that describes the topic in thoughtful detail.",
      "align": "left",
      "style": { "fontSize": 48, "color": "#333333", "fontWeight": 400 },
      "animation": { "enter": "fade", "duration": 30 }
    }
  ]
}

Rules:
- fps is always 30
- 15–19 scenes
- "duration" is always in frames (not seconds). Each scene duration: 90–180 frames (3–6 seconds at 30fps)
- Animation "duration" is also in frames: 15–30 frames
- Every scene must have a "background" element as its first element
- Valid layout values: "title", "split-left", "split-right", "text-only" — no other values allowed
- Scene 1 must always use "title" layout; last scene should also use "title" layout
- For middle scenes: at least 75% must use "split-left" or "split-right" — alternate between them frequently; use "text-only" for at most 2–3 scenes total
- All layouts use white backgrounds; text must always be dark (#111111, #222222, #333333, #444444)
- For "split-left" / "split-right" layout: the content panel is always white — background element is used only as the image panel fallback color
- For "split-left" / "split-right" layout: include exactly 1 "image" element with "searchQuery" only (no "position" field)
- For "split-left" / "split-right" layout: 1–2 "text" elements with "role": "title" or "role": "body" and "align": "left"
- For "title" layout: title fontSize 100–140, fontWeight 200–300, lineHeight 1.1–1.2; subtitle fontSize 48–60, fontWeight 400, lineHeight 1.4–1.5; subtitle is 1 short punchy sentence only
- For "text-only" layout: background color must be "#ffffff" — no "image" elements
- For "text-only" layout: 1–2 "text" elements with "role": "title" and/or "role": "body" and "align": "left"
- Title fontSize 70–100, fontWeight 300–400 (light weight for clean elegant look)
- Body fontSize 45–55, fontWeight 400, lineHeight 1.7–1.9; for "text-only" scenes body must be 8–10 full sentences (never bullet-only, never sparse); for split scenes body must be 3–5 full sentences or 4–6 bullet points
- Each scene needs at least one "text" element with fontSize, color, and fontWeight
- Image elements use "searchQuery" (2–5 word English phrase) — NEVER use "src" or a URL
- No extra commentary, no markdown, no explanation — only JSON${styleGuidance}`,
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
    } catch (e) {
      console.error("JSON parse failed:", e);
      console.error("Raw response:", raw);
      return NextResponse.json(
        { error: "The AI returned malformed JSON. Please try again with a simpler prompt." },
        { status: 502 },
      );
    }

    // Normalize: if AI returned a single scene or nested structure without top-level wrapper
    if (!Array.isArray(parsed.scenes)) {
      if (Array.isArray(parsed.video?.scenes)) {
        parsed = parsed.video;
      } else if (parsed.id && parsed.layout) {
        // AI returned a single bare scene — wrap it
        parsed = { title: "", fps: 30, scenes: [parsed] };
      }
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

    // Fetch a cover image from Unsplash based on the video title
    if (unsplashKey && parsed.title) {
      const coverQuery = encodeURIComponent(parsed.title);
      const coverRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${coverQuery}&per_page=1&orientation=landscape&client_id=${unsplashKey}`
      );
      if (coverRes.ok) {
        const coverData = await coverRes.json();
        const coverPhoto = coverData.results?.[0];
        if (coverPhoto?.urls?.regular) {
          parsed.coverImage = coverPhoto.urls.regular;
        }
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