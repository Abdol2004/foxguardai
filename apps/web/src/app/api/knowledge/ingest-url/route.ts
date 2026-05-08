import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const AI_URL = process.env["AI_SERVICE_URL"] ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { url, project_id } = await req.json();
  if (!url || !project_id) {
    return NextResponse.json({ error: "url and project_id required" }, { status: 400 });
  }
  const res = await axios
    .post(`${AI_URL}/ingest/url`, { url, project_id }, { timeout: 60_000 })
    .catch((e) => ({ status: 500, data: { error: e.message } }));
  return NextResponse.json((res as any).data, { status: (res as any).status });
}
