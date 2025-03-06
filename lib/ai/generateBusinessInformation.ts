import { generateObject } from "ai";
import { z } from "zod";
import { openai } from "./openai";

const responseSchema = z.object({
  video: z.object({
    id: z.string().describe("The YouTube video ID"),
    title: z.string().describe("The title of the video"),
    url: z.string().describe("The URL of the video"),
  }),
  data: z.object({
    company_name: z.string().describe("The name of the company"),
    received_funding: z
      .boolean()
      .describe("Whether the company received funding"),
    funding_details: z.object({
      amount: z
        .string()
        .nullable()
        .describe("The funding amount as mentioned (e.g., '50 lakh')"),
      amount_numeric: z
        .number()
        .nullable()
        .describe("The funding amount in numeric form (e.g., 5000000.0)"),
      valuation: z
        .string()
        .nullable()
        .describe("The company valuation as mentioned (e.g., '2.5 crore')"),
      valuation_numeric: z
        .number()
        .nullable()
        .describe("The company valuation in numeric form (e.g., 25000000.0)"),
      equity: z
        .string()
        .nullable()
        .describe("The equity percentage offered (e.g., '20%')"),
      equity_numeric: z
        .number()
        .nullable()
        .describe("The equity percentage in numeric form (e.g., 20.0)"),
      sharks: z
        .array(z.string())
        .describe("The names of the sharks involved in the deal"),
      deal_description: z
        .string()
        .nullable()
        .describe("A description of the deal"),
      deal_type: z
        .string()
        .nullable()
        .describe("The type of deal (e.g., 'equity')"),
    }),
    previously_funded: z
      .boolean()
      .describe("Whether the company was previously funded"),
    previous_funding: z.object({
      investors: z.array(z.string()).describe("Previous investors"),
      vcs: z
        .array(z.string())
        .describe("Venture capital firms involved in previous funding"),
      rounds: z.array(z.string()).describe("Previous funding rounds"),
      total_raised: z
        .string()
        .nullable()
        .describe("Total amount raised previously (e.g., '25 lakh')"),
      total_raised_numeric: z
        .number()
        .nullable()
        .describe(
          "Total amount raised previously in numeric form (e.g., 2500000.0)"
        ),
      valuation: z.string().nullable().describe("Previous valuation"),
      valuation_numeric: z
        .number()
        .nullable()
        .describe("Previous valuation in numeric form"),
      equity: z.string().nullable().describe("Previous equity offered"),
      equity_numeric: z
        .number()
        .nullable()
        .describe("Previous equity in numeric form"),
    }),
    business_description: z
      .string()
      .describe("A description of the company's business"),
    founder_names: z
      .array(z.string())
      .describe("The names of the company's founders"),
    deal_offer: z
      .string()
      .nullable()
      .describe("The deal offer statement, possibly in Hindi"),
    deal_acceptance: z.boolean().describe("Whether the deal was accepted"),
    confidence_score: z
      .number()
      .describe(
        "A confidence score between 0 and 1 indicating the certainty of the extracted data"
      ),
    extraction_notes: z
      .string()
      .describe(
        "Notes on the extraction process, including any assumptions or observations"
      ),
  }),
});

/**
 * Generates a structured deal response from a Shark Tank video summary.
 * @param videoSummary - A string containing the summary of a Shark Tank YouTube video.
 * @returns A promise resolving to the structured deal response or null if an error occurs.
 */

export async function generatedStructuredDealFromSummary(videoSummary: string) {
  try {
    const prompt = `
You are an AI assistant tasked with extracting structured deal information from a summary of a Shark Tank video. Shark Tank is a television show where entrepreneurs pitch their businesses to a panel of investors, known as 'sharks,' in hopes of securing investment deals.

From the provided summary, extract the following information:

- Video details: ID, title, and URL.
- Company name.
- Whether the company received funding (true/false).
- Funding details: amount (e.g., '50 lakh'), amount in numeric form (e.g., 5000000.0), valuation (e.g., '2.5 crore'), valuation numeric (e.g., 25000000.0), equity percentage (e.g., '20%'), equity numeric (e.g., 20.0), names of sharks involved, deal description, and deal type (e.g., 'equity').
- Whether the company was previously funded (true/false).
- Previous funding details: investors, venture capital firms, funding rounds, total raised (e.g., '25 lakh'), total raised numeric (e.g., 2500000.0), previous valuation, valuation numeric, equity, equity numeric.
- Business description.
- Founder names.
- Deal offer statement (in Hindi, if available).
- Whether the deal was accepted (true/false).
- A confidence score (0 to 1) indicating your certainty in the extracted data.
- Extraction notes with any observations or assumptions made.

If any information is not present in the summary, set the corresponding field to null or an appropriate default (e.g., empty array for lists, false for booleans unless inferred otherwise).

For numeric fields, convert textual amounts to numbers, assuming Indian Rupees. For example, '50 lakh' is 5000000.0, '2.5 crore' is 25000000.0.

For boolean fields, infer the value based on the summary context.

Summary:
${videoSummary}
`;

    const { object } = await generateObject({
      model: openai("gpt-4o-2024-11-20"),
      // system: "",
      schema: responseSchema,
      prompt,
    });

    return object;
  } catch (error) {
    console.error(
      "an error occured while generating structured data from deal",
      error
    );
    throw error;
  }
}
