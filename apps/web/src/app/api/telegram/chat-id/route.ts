import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });

  const handle = username.startsWith("@") ? username : `@${username}`;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(handle)}`
  );
  const data = await res.json();

  if (!data.ok) {
    return NextResponse.json({ error: data.description ?? "Chat not found" }, { status: 404 });
  }

  const chat = data.result;
  return NextResponse.json({
    id:       chat.id,
    title:    chat.title ?? chat.username ?? "",
    type:     chat.type,
    username: chat.username ?? null,
  });
}
