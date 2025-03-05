import { promisify } from "util";
import ytdl from "@distube/ytdl-core";
import { getOpenAIClient, openai } from "./ai/openai";
import * as os from "os";
import { head, put, del } from "@vercel/blob";
import { PassThrough } from "stream";
import { Readable } from "stream";

export function createSummaryPrompt(
  text: string,
  targetLanguage: string,
  mode: "video" | "podcast" = "video"
) {
  const languagePrompts = {
    en: {
      title: "TITLE",
      overview: "OVERVIEW",
      keyPoints: "KEY POINTS",
      takeaways: "MAIN TAKEAWAYS",
      context: "CONTEXT & IMPLICATIONS",
    },
  };

  const prompts =
    languagePrompts[targetLanguage as keyof typeof languagePrompts] ||
    languagePrompts.en;

  if (mode === "podcast") {
    return `Please provide a detailed podcast-style summary of the following content in ${targetLanguage}.
    Structure your response as follows:

    🎙️ ${prompts.title}: Create an engaging title

    🎧 ${prompts.overview} (3-5 sentences):
    - Provide a detailed context and main purpose

    🔍 ${prompts.keyPoints}:
    - Deep dive into the main arguments
    - Include specific examples and anecdotes
    - Highlight unique perspectives and expert opinions

    📈 ${prompts.takeaways}:
    - List 5-7 practical insights
    - Explain their significance and potential impact

    🌐 ${prompts.context}:
    - Broader context discussion
    - Future implications and expert predictions

    Text to summarize: ${text}

    Ensure the summary is comprehensive enough for someone who hasn't seen the original content.`;
  }

  return `Please provide a detailed summary of the following content in ${targetLanguage}.
  Structure your response as follows:

  🎯 ${prompts.title}: Create a descriptive title

  📝 ${prompts.overview} (2-3 sentences):
  - Provide a brief context and main purpose

  🔑 ${prompts.keyPoints}:
  - Extract and explain the main arguments
  - Include specific examples
  - Highlight unique perspectives

  💡 ${prompts.takeaways}:
  - List 3-5 practical insights
  - Explain their significance

  🔄 ${prompts.context}:
  - Broader context discussion
  - Future implications

  Text to summarize: ${text}

  Ensure the summary is comprehensive enough for someone who hasn't seen the original content.`;
}

const logger = console;

export async function downloadAudioAsMP3(videoId: string): Promise<string> {
  const blobPath = `audio/${videoId}.mp3`; // Unique path in Blob store

  try {
    logger.info(`Starting audio download for video ${videoId}`);

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const info = await ytdl.getInfo(videoUrl);

    const format = ytdl
      .filterFormats(info.formats, "audioonly")
      .sort((a, b) => {
        if (a.codecs?.includes("opus") && !b.codecs?.includes("opus"))
          return -1;
        if (!a.codecs?.includes("opus") && b.codecs?.includes("opus")) return 1;
        return (b.audioBitrate || 0) - (a.audioBitrate || 0);
      })[0];

    if (!format) {
      throw new Error("No suitable audio format found");
    }

    logger.info("Selected audio format:", {
      container: format.container,
      codec: format.codecs,
      bitrate: format.audioBitrate,
    });

    // Stream audio to Vercel Blob
    const stream = ytdl.downloadFromInfo(info, { format });
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    const blob = await put(blobPath, audioBuffer, {
      access: "public", // Adjust to 'private' if needed
      contentType: "audio/mp3",
    });

    logger.info(`Audio uploaded to Vercel Blob: ${blob.url} ${blob}`);

    return blob.url; // Return the Blob URL
  } catch (error) {
    logger.error("Error in downloadAudio:", { error, videoId, blobPath });
    throw error;
  }
}
export const transcribeBlobUrlWithWhisper = async (blobUrl: string) => {
  try {
    logger.info("Starting transcription process with OpenAI Whisper");
    // Verify Blob exists and get metadata
    const metadata = await head(blobUrl);

    console.log("metadata is", metadata);

    if (!metadata || metadata.size === 0) {
      throw new Error(`Blob at ${blobUrl} does not exist or is empty`);
    }
    logger.info("Blob metadata:", { size: metadata.size, url: blobUrl });

    // Fetch audio from Blob URL as a stream
    const response = await fetch(blobUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch Blob: ${response.statusText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    // Create a File object using fetch-blob
    const audioFile = new File([audioBuffer], "audio.mp3", {
      type: "audio/mp3",
    });

    const openai = getOpenAIClient();

    if (!openai) {
      throw new Error("Could not initialize openai client");
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile, // OpenAI SDK accepts ReadableStream
      model: "whisper-1",
      language: "en",
    });

    logger.info("Transcription successful:", transcription);
    return transcription.text;
  } catch (error: any) {
    logger.error("Transcription failed:", error);
    throw new Error(`Whisper transcription failed: ${error.message}`, {
      cause: error,
    });
  } finally {
    // Cleanup: Delete the Blob
    // try {
    //   await del(blobUrl);
    //   logger.info(`Cleaned up Blob: ${blobUrl}`);
    // } catch (cleanupError) {
    //   logger.error("Failed to delete Blob:", cleanupError);
    // }
  }
};
