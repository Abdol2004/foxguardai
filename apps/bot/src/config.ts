import { config as dotenvConfig } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dirname, "../../../.env") });

function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const config = {
  telegram: {
    token: require_env("TELEGRAM_BOT_TOKEN"),
    webhookSecret: process.env["TELEGRAM_WEBHOOK_SECRET"] ?? "",
  },
  mongodb: {
    uri: require_env("MONGODB_URI"),
    dbName: process.env["MONGODB_DB_NAME"] ?? "foxguard",
  },
  ai: {
    serviceUrl: process.env["AI_SERVICE_URL"] ?? "http://localhost:8000",
  },
  env: (process.env["NODE_ENV"] ?? "development") as "development" | "production",
};
