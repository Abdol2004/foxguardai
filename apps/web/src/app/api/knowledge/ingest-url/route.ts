import { NextRequest, NextResponse } from "next/server";

const AI_URL = (process.env["AI_SERVICE_URL"] ?? "http://localhost:8000").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const { url, project_id } = await req.json();
  if (!url || !project_id) {
    return NextResponse.json({ error: "url and project_id required" }, { status: 400 });
  }
  try {
    const res = await fetch(`${AI_URL}/ingest/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, project_id }),
      signal: AbortSignal.timeout(60_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Could not reach AI service" }, { status: 500 });
  }
}
