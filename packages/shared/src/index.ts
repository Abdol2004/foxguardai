// ─── Moderation ───────────────────────────────────────────────────────────────

export type ModerationAction =
  | "delete_link"
  | "delete_spam"
  | "delete_scam"
  | "mute"
  | "ban"
  | "warn"
  | "flood";

export interface ModerationSettings {
  deleteLinks: boolean;
  antiSpam: boolean;
  antiScam: boolean;
  floodProtection: boolean;
  floodThreshold: number;
  floodWindowSecs: number;
  muteOnSpam: boolean;
  muteDurationSecs: number;
  banOnScam: boolean;
  allowedDomains: string[];
  scamKeywords: string[];
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

export interface WelcomeSettings {
  enabled: boolean;
  message: string;
  deleteAfterSecs: number;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export type AITone = "formal" | "casual" | "degen" | "corporate";

export interface AISettings {
  enabled: boolean;
  tone: AITone;
  language: string;
}

// ─── Group ────────────────────────────────────────────────────────────────────

export interface GroupSettings {
  chatId: string;
  chatTitle: string;
  moderation: ModerationSettings;
  welcome: WelcomeSettings;
  ai: AISettings;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DailyAnalytics {
  chatId: string;
  date: string;
  totalMessages: number;
  activeUsers: number;
  spamDeleted: number;
  linksDeleted: number;
  scamDeleted: number;
  aiReplies: number;
  newMembers: number;
}

// ─── Ticket ───────────────────────────────────────────────────────────────────

export interface Ticket {
  _id: string;
  chatId: string;
  userId: string;
  username: string;
  question: string;
  status: "open" | "resolved";
  resolvedBy: string | null;
  createdAt: string;
}

// ─── AI Service ───────────────────────────────────────────────────────────────

export interface AIQueryResponse {
  answer: string;
  confidence: number;
  sources: string[];
  escalate: boolean;
}
