import { NextRequest, NextResponse } from "next/server";

const AI_URL = (process.env["AI_SERVICE_URL"] ?? "http://localhost:8000").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const { text, project_id } = await req.json();
  if (!text || !project_id) {
    return NextResponse.json({ error: "text and project_id required" }, { status: 400 });
  }
  try {
    const res = await fetch(`${AI_URL}/ingest/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, project_id }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Could not reach AI service" }, { status: 500 });
  }
}
