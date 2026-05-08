import { NextRequest, NextResponse } from "next/server";

const AI_URL = (process.env["AI_SERVICE_URL"] ?? "http://localhost:8000").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const projectId = form.get("project_id") as string | null;

  if (!file || !projectId) {
    return NextResponse.json({ error: "file and project_id required" }, { status: 400 });
  }

  // Forward the file directly to the AI service
  const upstream = new FormData();
  upstream.append("file", file, file.name);
  upstream.append("project_id", projectId);

  try {
    const res = await fetch(`${AI_URL}/ingest/file`, {
      method: "POST",
      body: upstream,
      signal: AbortSignal.timeout(120_000),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.detail ?? data.error ?? "AI service error" }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    const msg = err?.message ?? "Could not reach AI service";
    // Helpful hint if it's a connection error
    const hint = msg.includes("fetch") || msg.includes("connect")
      ? " — Make sure AI_SERVICE_URL is set correctly in Render env vars."
      : "";
    return NextResponse.json({ error: msg + hint }, { status: 500 });
  }
}
