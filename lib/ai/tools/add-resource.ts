import { createResource } from "@/lib/actions/resources";
import { tool } from "ai";
import { z } from "zod";

export const addResource = tool({
  description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
  parameters: z.object({
    content: z.string().describe("the content to save in the knowledge base"),
  }),
  execute: async ({ content }) => {
    console.log("content to save is", content);
    return createResource({ content });
  },
});
