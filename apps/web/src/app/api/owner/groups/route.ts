import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Owner, GroupSettings } from "@/lib/models";

export async function POST(req: NextRequest) {
  const { telegramId, chatId, title, type } = await req.json();
  if (!telegramId || !chatId) {
    return NextResponse.json({ error: "telegramId and chatId required" }, { status: 400 });
  }
  await connectDB();

  await Owner.findOneAndUpdate(
    { telegramId, "groups.chatId": { $ne: chatId } },
    { $push: { groups: { chatId, title: title ?? "", type: type ?? "group", activated: false } } }
  );

  await GroupSettings.findOneAndUpdate(
    { chatId },
    { $setOnInsert: { chatTitle: title ?? "" } },
    { upsert: true }
  );

  const owner = await Owner.findOne({ telegramId }).lean();
  return NextResponse.json(owner);
}

export async function DELETE(req: NextRequest) {
  const { telegramId, chatId } = await req.json();
  await connectDB();
  await Owner.findOneAndUpdate(
    { telegramId },
    { $pull: { groups: { chatId } } }
  );
  return NextResponse.json({ ok: true });
}
