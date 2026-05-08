import { config } from "../config.js";

const BASE = config.ai.serviceUrl.replace(/\/$/, "");

async function post<T>(path: string, body: unknown, timeoutMs = 20_000): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export interface AskResponse {
  answer: string;
  confidence: number;
  sources: string[];
  escalate: boolean;
}

export interface ConversationResponse {
  reply: string | null;
  action: "reply" | "warn" | "ignore";
  message_type?: string;
  reason?: string;
}

export function askAI(projectId: string, question: string, language = "en") {
  return post<AskResponse>("/query", { project_id: projectId, question, language }, 20_000);
}

export function sendToConversation(
  projectId: string,
  projectName: string,
  message: string,
  senderName = ""
) {
  return post<ConversationResponse>(
    "/conversation",
    { project_id: projectId, project_name: projectName, message, sender_name: senderName },
    25_000
  );
}

export function checkToxic(message: string) {
  return post<{ is_toxic: boolean }>("/toxic-check", { message }, 10_000);
}
