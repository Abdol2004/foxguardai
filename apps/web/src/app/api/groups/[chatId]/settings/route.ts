import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { GroupSettings } from "@/lib/models";

export async function GET(_: NextRequest, { params }: { params: { chatId: string } }) {
  await connectDB();
  const doc = await GroupSettings.findOne({ chatId: params.chatId }).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: { chatId: string } }) {
  await connectDB();
  const body = await req.json();
  const doc = await GroupSettings.findOneAndUpdate(
    { chatId: params.chatId },
    { $set: body },
    { new: true, upsert: true }
  ).lean();
  return NextResponse.json(doc);
}
