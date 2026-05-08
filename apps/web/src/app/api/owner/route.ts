import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Owner } from "@/lib/models";

export async function GET(req: NextRequest) {
  const telegramId = req.nextUrl.searchParams.get("telegramId");
  if (!telegramId) return NextResponse.json({ error: "telegramId required" }, { status: 400 });
  await connectDB();
  const owner = await Owner.findOne({ telegramId }).lean();
  if (!owner) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(owner);
}

export async function POST(req: NextRequest) {
  const { telegramId, username, firstName } = await req.json();
  if (!telegramId) return NextResponse.json({ error: "telegramId required" }, { status: 400 });
  await connectDB();
  const owner = await Owner.findOneAndUpdate(
    { telegramId },
    { $setOnInsert: { username: username ?? "", firstName: firstName ?? "" } },
    { upsert: true, new: true }
  );
  return NextResponse.json(owner);
}
