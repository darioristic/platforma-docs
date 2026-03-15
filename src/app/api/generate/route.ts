import { NextRequest, NextResponse } from "next/server";
import { runGenerationPipeline } from "@/lib/doc-generator/pipeline";
import path from "path";

export async function POST(request: NextRequest) {
  // Verify API key
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.GENERATOR_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repoUrl = process.env.GITHUB_REPO
    ? `https://github.com/${process.env.GITHUB_REPO}`
    : null;

  if (!repoUrl) {
    return NextResponse.json({ error: "GITHUB_REPO not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({})) as { since?: string };

  const result = await runGenerationPipeline({
    repoUrl,
    token: process.env.GITHUB_TOKEN,
    outputDir: path.join(process.cwd(), "src", "content", "generated"),
    changelogSince: body.since,
  });

  return NextResponse.json(result);
}
