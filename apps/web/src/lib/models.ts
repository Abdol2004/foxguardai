import { Schema, model, models, Types } from "mongoose";

const groupSettingsSchema = new Schema(
  {
    chatId: { type: String, required: true, unique: true },
    chatTitle: { type: String, default: "" },
    moderation: {
      deleteLinks: { type: Boolean, default: true },
      antiSpam: { type: Boolean, default: true },
      antiScam: { type: Boolean, default: true },
      floodProtection: { type: Boolean, default: true },
      floodThreshold: { type: Number, default: 5 },
      floodWindowSecs: { type: Number, default: 10 },
      muteOnSpam: { type: Boolean, default: true },
      muteDurationSecs: { type: Number, default: 300 },
      banOnScam: { type: Boolean, default: true },
      allowedDomains: { type: [String], default: [] },
      scamKeywords: { type: [String], default: [] },
    },
    welcome: {
      enabled: { type: Boolean, default: true },
      message: { type: String, default: "Welcome to {group_name}, {user_name}! 🦊" },
      deleteAfterSecs: { type: Number, default: 60 },
    },
    ai: {
      enabled: { type: Boolean, default: true },
      tone: { type: String, enum: ["formal", "casual", "degen", "corporate"], default: "casual" },
      language: { type: String, default: "en" },
      replyMode: { type: String, default: "all" },
      replyFrequency: { type: Number, default: 6 },
    },
    faq: [{ _id: String, question: String, answer: String }],
    projectId: { type: Types.ObjectId, ref: "Project", default: null },
  },
  { timestamps: true }
);

const projectSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: String, required: true },
    description: { type: String, default: "" },
    linkedChats: { type: [String], default: [] },
  },
  { timestamps: true }
);

const moderationEventSchema = new Schema(
  {
    chatId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, default: "" },
    action: { type: String, required: true },
    reason: { type: String, default: "" },
    messageText: { type: String, default: "" },
  },
  { timestamps: true }
);

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

const analyticsSchema = new Schema(
  {
    chatId: { type: String, required: true },
    date: { type: String, required: true },
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

const ownerSchema = new Schema(
  {
    telegramId: { type: String, required: true, unique: true },
    username:   { type: String, default: "" },
    firstName:  { type: String, default: "" },
    groups: [
      {
        chatId:    { type: String, required: true },
        title:     { type: String, default: "" },
        type:      { type: String, default: "group" },
        activated: { type: Boolean, default: false },
        addedAt:   { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Owner =
  models["Owner"] ?? model("Owner", ownerSchema);

export const GroupSettings =
  models["GroupSettings"] ?? model("GroupSettings", groupSettingsSchema);
export const Project = models["Project"] ?? model("Project", projectSchema);
export const ModerationEvent =
  models["ModerationEvent"] ?? model("ModerationEvent", moderationEventSchema);
export const Ticket = models["Ticket"] ?? model("Ticket", ticketSchema);
export const Analytics = models["Analytics"] ?? model("Analytics", analyticsSchema);

const userProfileSchema = new Schema(
  {
    chatId:   { type: String, required: true },
    userId:   { type: String, required: true },
    username: { type: String, default: "" },
    warnings: { type: Number, default: 0 },
    muted:    { type: Boolean, default: false },
    muteUntil:{ type: Date, default: null },
    banned:   { type: Boolean, default: false },
  },
  { timestamps: true }
);
userProfileSchema.index({ chatId: 1, userId: 1 }, { unique: true });

export const UserProfile =
  models["UserProfile"] ?? model("UserProfile", userProfileSchema);
