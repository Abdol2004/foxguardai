import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { GroupSettings } from "@/lib/models";

const AI_URL = (process.env["AI_SERVICE_URL"] ?? "http://localhost:8000").replace(/\/$/, "");

export async function GET(_: NextRequest, { params }: { params: { chatId: string } }) {
  await connectDB();
  const doc = await GroupSettings.findOne({ chatId: params.chatId }).lean() as any;
  return NextResponse.json(doc?.faq ?? []);
}

export async function POST(req: NextRequest, { params }: { params: { chatId: string } }) {
  const { question, answer } = await req.json();
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "question and answer required" }, { status: 400 });
  }

  await connectDB();

  const entry = { question: question.trim(), answer: answer.trim(), _id: Date.now().toString() };

  // Save to MongoDB
  await GroupSettings.findOneAndUpdate(
    { chatId: params.chatId },
    { $push: { faq: entry } },
    { upsert: true }
  );

  // Ingest to AI knowledge base
  const text = `Q: ${question.trim()}\nA: ${answer.trim()}`;
  await fetch(`${AI_URL}/ingest/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, project_id: params.chatId }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);

  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest, { params }: { params: { chatId: string } }) {
  const { id } = await req.json();
  await connectDB();
  await GroupSettings.findOneAndUpdate(
    { chatId: params.chatId },
    { $pull: { faq: { _id: id } } }
  );
  return NextResponse.json({ ok: true });
}
