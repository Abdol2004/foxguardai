import axios from "axios";
import { config } from "../config.js";

interface AskResponse {
  answer: string;
  confidence: number;
  sources: string[];
  escalate: boolean;
}

export async function askAI(
  projectId: string,
  question: string,
  language = "en"
): Promise<AskResponse> {
  const res = await axios.post<AskResponse>(
    `${config.ai.serviceUrl}/query`,
    { project_id: projectId, question, language },
    { timeout: 15_000 }
  );
  return res.data;
}
