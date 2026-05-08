import { NextResponse } from "next/server";

const AI_URL = (process.env["AI_SERVICE_URL"] ?? "http://localhost:8000").replace(/\/$/, "");

export async function GET() {
  try {
    const res = await fetch(`${AI_URL}/health`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) return NextResponse.json({ ok: true, url: AI_URL });
    return NextResponse.json({ ok: false, error: `AI service returned ${res.status}`, url: AI_URL });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message ?? "Cannot reach AI service",
      url: AI_URL,
      hint: AI_URL.includes("localhost")
        ? "AI_SERVICE_URL is not set. Add it in Render env vars: AI_SERVICE_URL=https://foxguardai.onrender.com"
        : "AI service may be sleeping (Render free tier). Try again in 30 seconds.",
    });
  }
}
