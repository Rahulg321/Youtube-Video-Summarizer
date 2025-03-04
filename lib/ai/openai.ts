import { createOpenAI } from "@ai-sdk/openai";
import OpenAI from "openai";

export const openai = createOpenAI({
  apiKey: process.env.AI_API_KEY,
});

export function getOpenAIClient() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
