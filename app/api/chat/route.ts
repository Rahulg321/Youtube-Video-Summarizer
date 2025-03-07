import { findRelevantContent } from "@/lib/ai/embedding";
import { openai } from "@/lib/ai/openai";
import { addResource } from "@/lib/ai/tools/add-resource";
import { extractDealInformationFromSummary } from "@/lib/ai/tools/extract-deal-information";
import { extractSummaryFromYoutubeUrl } from "@/lib/ai/tools/extract-summary";
import { streamText, tool } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log("messages", messages);

  const result = streamText({
    model: openai("gpt-4o-2024-11-20"),
    system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    messages,
    tools: {
      extractSummaryFromYoutubeUrl,
      extractDealInformationFromSummary,
      addResource,
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
  });

  return result.toDataStreamResponse();
}
