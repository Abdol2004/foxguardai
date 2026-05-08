import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const AI_URL = process.env["AI_SERVICE_URL"] ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { text, project_id } = await req.json();
  if (!text || !project_id) {
    return NextResponse.json({ error: "text and project_id required" }, { status: 400 });
  }
  const res = await axios
    .post(`${AI_URL}/ingest/text`, { text, project_id }, { timeout: 30_000 })
    .catch((e) => ({ status: 500, data: { error: e.message } }));
  return NextResponse.json((res as any).data, { status: (res as any).status });
}
