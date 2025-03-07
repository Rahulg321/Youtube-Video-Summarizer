import generateContent from "@/lib/ai/generateContent";
import {
  extractVideoId,
  getAudioFromYoutubeVideo,
  getTranscript,
  splitTranscriptIntoChunks,
} from "@/lib/utils";
import {
  createSummaryPrompt,
  transcribeBlobUrlWithWhisper,
} from "@/lib/youtube";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("inside playlist get request");
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          message: "No Valid Url provided",
        },
        {
          status: 400,
        }
      );
    }

    console.log("found url", url);

    let finalVideoTranscript;

    const videoTranscript = await getTranscript(url);

    if (videoTranscript.type === "error") {
      const { vercelBlobUrl } = await getAudioFromYoutubeVideo(url);

      if (!vercelBlobUrl) {
        return NextResponse.json(
          {
            message: "Error Occured generated vercel blob url",
            type: "error",
          },
          {
            status: 400,
          }
        );
      }
      const transcription = await transcribeBlobUrlWithWhisper(vercelBlobUrl);
      finalVideoTranscript = transcription;
    } else {
      finalVideoTranscript = videoTranscript.transcript;
    }

    if (!finalVideoTranscript) {
      console.log("final video transcript was not generated");
      return NextResponse.json({
        errorMessage: "Final Video transcript was not generated",
        type: "error",
      });
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

    return NextResponse.json({
      summary,
      type: "success",
    });
  } catch (error) {
    console.error("an error occured while trying to generate summaries");
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({
      errorMessage,
      type: "error",
    });
  }
}
