import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { runGenerationPipeline } from "@/lib/doc-generator/pipeline";
import { setGenerationStatus } from "@/lib/doc-generator/status";
import path from "path";

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);

  if (payload.ref !== "refs/heads/main") {
    return NextResponse.json({ message: "Skipped: not main branch" });
  }

  const repoUrl = process.env.GITHUB_REPO
    ? `https://github.com/${process.env.GITHUB_REPO}`
    : payload.repository?.clone_url;

  if (!repoUrl) {
    return NextResponse.json({ error: "No repo URL" }, { status: 400 });
  }

  // Extract changed files from webhook payload commits
  const changedFiles: string[] = [];
  if (Array.isArray(payload.commits)) {
    for (const commit of payload.commits) {
      const added = commit.added as string[] | undefined;
      const modified = commit.modified as string[] | undefined;
      const removed = commit.removed as string[] | undefined;
      changedFiles.push(...(added ?? []), ...(modified ?? []), ...(removed ?? []));
    }
  }
  const uniqueChangedFiles = [...new Set(changedFiles)];

  const startedAt = new Date().toISOString();
  setGenerationStatus({ status: "running", startedAt });

  runGenerationPipeline({
    repoUrl,
    token: process.env.GITHUB_TOKEN,
    outputDir: path.join(process.cwd(), "src", "content", "generated"),
    changedFiles: uniqueChangedFiles,
  })
    .then((result) => {
      setGenerationStatus({
        status: "completed",
        startedAt,
        completedAt: new Date().toISOString(),
        result,
      });
    })
    .catch((err: Error) => {
      setGenerationStatus({
        status: "failed",
        startedAt,
        completedAt: new Date().toISOString(),
        error: err.message,
      });
    });

  return NextResponse.json({
    message: "Generation started",
    commit: payload.after?.slice(0, 8),
  });
}
