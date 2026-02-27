import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";

// Cache the bundle across requests in the same server process
let cachedBundleLocation: string | null = null;

async function getBundle(): Promise<string> {
  if (cachedBundleLocation) return cachedBundleLocation;
  cachedBundleLocation = await bundle({
    entryPoint: path.resolve("./src/remotion/index.ts"),
  });
  return cachedBundleLocation;
}

export async function POST(req: Request) {
  try {
    const { data } = await req.json();

    const dataType =
      data && typeof data === "object" && "type" in data
        ? (data as { type: string }).type
        : null;

    const compositionId =
      dataType === "chart"
        ? "ChartVideo"
        : dataType === "line-chart"
        ? "LineChartVideo"
        : "PromoVideo";

    const serveUrl = await getBundle();

    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps: { data },
    });

    const outputPath = path.join(os.tmpdir(), `render-${Date.now()}.mp4`);

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: { data },
    });

    const fileBuffer = fs.readFileSync(outputPath);
    fs.unlinkSync(outputPath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="video.mp4"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Render failed";
    console.error("Render error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
