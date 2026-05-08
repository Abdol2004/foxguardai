import "dotenv/config";

function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const config = {
  telegram: {
    token: require_env("TELEGRAM_BOT_TOKEN"),
  },
  mongodb: {
    uri: require_env("MONGODB_URI"),
    dbName: process.env["MONGODB_DB_NAME"] ?? "foxguard",
  },
  ai: {
    serviceUrl: process.env["AI_SERVICE_URL"] ?? "http://localhost:8000",
  },
  // Bot owner Telegram user ID — only this ID can use /admin
  ownerId: process.env["BOT_OWNER_ID"] ?? "",
  // Official channel username or chat ID for alerts (e.g. @foxguardaigroup)
  officialChannel: process.env["OFFICIAL_CHANNEL"] ?? "@foxguardaigroup",
  env: (process.env["NODE_ENV"] ?? "development") as "development" | "production",
};
