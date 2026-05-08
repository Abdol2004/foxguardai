import { Schema, model, Types } from "mongoose";

// ─── Group Settings ───────────────────────────────────────────────────────────
const groupSettingsSchema = new Schema(
  {
    chatId: { type: String, required: true, unique: true },
    chatTitle: { type: String, default: "" },

    moderation: {
      deleteLinks: { type: Boolean, default: true },
      antiSpam: { type: Boolean, default: true },
      antiScam: { type: Boolean, default: true },
      floodProtection: { type: Boolean, default: true },
      floodThreshold: { type: Number, default: 5 },    // msgs per window
      floodWindowSecs: { type: Number, default: 10 },
      muteOnSpam: { type: Boolean, default: true },
      muteDurationSecs: { type: Number, default: 300 },
      banOnScam: { type: Boolean, default: true },
      allowedDomains: { type: [String], default: [] },
      scamKeywords: {
        type: [String],
        default: ["airdrop", "giveaway", "dm me", "send eth", "free tokens", "click here", "investment guaranteed"],
      },
    },

    welcome: {
      enabled: { type: Boolean, default: true },
      message: {
        type: String,
        default: "Welcome to {group_name}, {user_name}! 🦊 Please read the rules before posting.",
      },
      deleteAfterSecs: { type: Number, default: 60 },
    },

    ai: {
      enabled: { type: Boolean, default: true },
      tone: { type: String, enum: ["formal", "casual", "degen", "corporate"], default: "casual" },
      language: { type: String, default: "en" },
    },

    projectId: { type: Types.ObjectId, ref: "Project", default: null },
  },
  { timestamps: true }
);

// ─── Project (knowledge base owner) ──────────────────────────────────────────
const projectSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: String, required: true },   // Telegram user ID of admin
    description: { type: String, default: "" },
    linkedChats: { type: [String], default: [] }, // chat IDs
  },
  { timestamps: true }
);

// ─── Moderation Event ─────────────────────────────────────────────────────────
const moderationEventSchema = new Schema(
  {
    chatId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, default: "" },
    action: {
      type: String,
      enum: ["delete_link", "delete_spam", "delete_scam", "mute", "ban", "warn", "flood"],
      required: true,
    },
    reason: { type: String, default: "" },
    messageText: { type: String, default: "" },
  },
  { timestamps: true }
);
moderationEventSchema.index({ chatId: 1, createdAt: -1 });

// ─── User Profile ─────────────────────────────────────────────────────────────
const userProfileSchema = new Schema(
  {
    chatId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, default: "" },
    warnings: { type: Number, default: 0 },
    muted: { type: Boolean, default: false },
    muteUntil: { type: Date, default: null },
    banned: { type: Boolean, default: false },
  },
  { timestamps: true }
);
userProfileSchema.index({ chatId: 1, userId: 1 }, { unique: true });

// ─── Flood Tracker (TTL) ──────────────────────────────────────────────────────
const floodTrackerSchema = new Schema({
  chatId: { type: String, required: true },
  userId: { type: String, required: true },
  count: { type: Number, default: 1 },
  windowStart: { type: Date, default: Date.now },
  expireAt: { type: Date, required: true },
});
floodTrackerSchema.index({ chatId: 1, userId: 1 }, { unique: true });
floodTrackerSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// ─── Ticket (escalation) ──────────────────────────────────────────────────────
const ticketSchema = new Schema(
  {
    chatId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, default: "" },
    question: { type: String, required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    resolvedBy: { type: String, default: null },
  },
  { timestamps: true }
);

// ─── Analytics Snapshot ───────────────────────────────────────────────────────
const analyticsSchema = new Schema(
  {
    chatId: { type: String, required: true },
    date: { type: String, required: true },         // "2026-05-08"
    totalMessages: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    spamDeleted: { type: Number, default: 0 },
    linksDeleted: { type: Number, default: 0 },
    scamDeleted: { type: Number, default: 0 },
    aiReplies: { type: Number, default: 0 },
    newMembers: { type: Number, default: 0 },
  },
  { timestamps: true }
);
analyticsSchema.index({ chatId: 1, date: 1 }, { unique: true });

export const GroupSettings = model("GroupSettings", groupSettingsSchema);
export const Project = model("Project", projectSchema);
export const ModerationEvent = model("ModerationEvent", moderationEventSchema);
export const UserProfile = model("UserProfile", userProfileSchema);
export const FloodTracker = model("FloodTracker", floodTrackerSchema);
export const Ticket = model("Ticket", ticketSchema);
export const Analytics = model("Analytics", analyticsSchema);
