import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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

  // Trigger Vercel redeploy — generation runs during build
  const deployHook = process.env.VERCEL_DEPLOY_HOOK;
  if (!deployHook) {
    return NextResponse.json({ error: "VERCEL_DEPLOY_HOOK not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(deployHook, { method: "POST" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Deploy hook failed: ${res.status}` },
        { status: 502 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Deploy hook error: ${message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    message: "Redeploy triggered",
    commit: payload.after?.slice(0, 8),
  });
}
