import { connectDB } from "./db/index.js";
import { createBot } from "./bot.js";
import { config } from "./config.js";

async function main() {
  await connectDB();

  const bot = createBot();

  if (config.env === "production") {
    console.log("[Bot] Starting in webhook mode");
    // Webhook setup handled by apps/web API route
    await bot.start({ drop_pending_updates: true });
  } else {
    console.log("[Bot] Starting in polling mode");
    await bot.start({
      drop_pending_updates: true,
      onStart: (info) => console.log(`[Bot] @${info.username} is running`),
    });
  }
}

main().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});
