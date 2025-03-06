import { createResource } from "@/lib/actions/resources";
import { tool } from "ai";
import { z } from "zod";
import { generatedStructuredDealFromSummary } from "../generateBusinessInformation";

export const extractDealInformationFromSummary = tool({
  description: `extract deal information given a summary of an youtube video. Given a summary of an youtube video this tool can extract all valuable information from that summary in the form of structured data`,
  parameters: z.object({
    summary: z.string().describe("The summary of the youtube video generated"),
  }),
  execute: async ({ summary }) => {
    console.log(
      "summary recived inside extract deal information tool ",
      summary
    );

    const structuredDealObject = await generatedStructuredDealFromSummary(
      summary
    );

    return structuredDealObject;
  },
});
