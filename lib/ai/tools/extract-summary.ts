import { createResource } from "@/lib/actions/resources";
import {
  getAudioFromYoutubeVideo,
  getTranscript,
  splitTranscriptIntoChunks,
} from "@/lib/utils";
import {
  createSummaryPrompt,
  transcribeBlobUrlWithWhisper,
} from "@/lib/youtube";
import { tool } from "ai";
import { z } from "zod";
import generateContent from "../generateContent";

export const extractSummaryFromYoutubeUrl = tool({
  description: `given a youtube url, extract summary of the entire youtube video. Given a youtube video url, use this tool to extract summary of the video`,
  parameters: z.object({
    youtubeUrl: z.string().describe("The youtube url to extract summary of"),
  }),
  execute: async ({ youtubeUrl }) => {
    console.log("inside playlist get request");

    if (!youtubeUrl || typeof youtubeUrl !== "string") {
      throw new Error("youtube url is not valid and is not available");
    }

    console.log("found url inside extract summary youtube tool", youtubeUrl);

    let finalVideoTranscript;

    const videoTranscript = await getTranscript(youtubeUrl);

    if (videoTranscript.type === "error") {
      const { vercelBlobUrl } = await getAudioFromYoutubeVideo(youtubeUrl);

      if (!vercelBlobUrl) {
        throw new Error(
          "Audio generated file could not be generated and uploaded to vercel blob"
        );
      }
      const transcription = await transcribeBlobUrlWithWhisper(vercelBlobUrl);
      finalVideoTranscript = transcription;
    } else {
      finalVideoTranscript = videoTranscript.transcript;
    }

    if (!finalVideoTranscript) {
      console.log("final video transcript was not generated");
      throw new Error(
        "final video transcript could not be generated and an error occured"
      );
    }

    const chunks = await splitTranscriptIntoChunks(finalVideoTranscript);
    console.log("chunks generated was", chunks);
    const totalChunks = chunks.length;
    const intermediateSummaries = [];

    for (let i = 0; i < totalChunks; i++) {
      const prompt = `Create a detailed summary of section ${i + 1} in English.
        Maintain all important information, arguments, and connections.
        Pay special attention to:
        - Main topics and arguments
        - Important details and examples
        - Connections with other mentioned topics
        - Key statements and conclusions

        Text: ${chunks[i]}`;

      const text = await generateContent(prompt);

      console.log("text generated from prompt", text);
      intermediateSummaries.push(text);
    }

    const combinedSummary = intermediateSummaries.join(
      "\n\n=== Next Section ===\n\n"
    );
    const finalPrompt = createSummaryPrompt(combinedSummary, "en", "podcast");

    const summary = await generateContent(finalPrompt);

    if (!summary) {
      throw new Error("No summary content generated");
    }

    return summary;
  },
});
