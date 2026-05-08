import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const AI_URL = process.env["AI_SERVICE_URL"] ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const projectId = form.get("project_id") as string | null;

  if (!file || !projectId) {
    return NextResponse.json({ error: "file and project_id required" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", file);
  upstream.append("project_id", projectId);

  const res = await axios.post(`${AI_URL}/ingest/file`, upstream, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000,
  }).catch((e) => ({ status: 500, data: { error: String(e.message) } }));

  return NextResponse.json((res as any).data, { status: (res as any).status });
}
