import { generateText } from "ai";
import { openai } from "./openai";

export default async function generateContent(prompt: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system:
        "You are a direct and concise summarizer. Respond only with the summary, without any prefixes or meta-commentary. Keep all markdown formatting intact.",
    });

    return text;
  } catch (error) {
    console.log("an error occured while trying to generate content", error);
    console.log(error);
    throw error;
  }
}
