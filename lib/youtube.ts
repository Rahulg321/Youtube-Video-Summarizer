import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import ytdl from "@distube/ytdl-core";
import { getOpenAIClient, openai } from "./ai/openai";
import * as os from "os";
const execAsync = promisify(exec);

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
  const tempDir = os.tmpdir();
  const tempPath = path.join(tempDir, `${videoId}.mp3`); // Changed to .mp3 as final output

  try {
    logger.info(`Starting audio download for video ${videoId}`);

    // Download the audio
    await new Promise<void>((resolve, reject) => {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      logger.debug(`Downloading from URL: ${videoUrl}`);

      ytdl
        .getInfo(videoUrl)
        .then((info) => {
          logger.info("Video info retrieved:", {
            title: info.videoDetails.title,
            duration: info.videoDetails.lengthSeconds,
          });

          const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
          const format = audioFormats.sort((a, b) => {
            if (a.codecs?.includes("opus") && !b.codecs?.includes("opus"))
              return -1;
            if (!a.codecs?.includes("opus") && b.codecs?.includes("opus"))
              return 1;
            return (b.audioBitrate || 0) - (a.audioBitrate || 0);
          })[0];

          if (!format) {
            reject(new Error("No suitable audio format found"));
            return;
          }

          logger.info("Selected audio format:", {
            container: format.container,
            codec: format.codecs,
            quality: format.quality,
            bitrate: format.audioBitrate,
          });

          const stream = ytdl.downloadFromInfo(info, { format });

          stream.on("error", (error) => {
            logger.error("Error in ytdl stream:", {
              error: error.message,
              stack: error.stack,
              videoId,
            });
            reject(error);
          });

          const writeStream = fs.createWriteStream(tempPath);

          writeStream.on("error", (error) => {
            logger.error("Error in write stream:", {
              error: error.message,
              path: tempPath,
            });
            reject(error);
          });

          stream
            .pipe(writeStream)
            .on("finish", async () => {
              // await new Promise((resolve) => resolve(2000));

              const stats = await fs.statSync(tempPath);
              logger.info(`Audio download completed: ${tempPath}`, {
                fileSize: stats.size,
              });
              resolve();
            })
            .on("error", (error) => {
              logger.error("Error during audio download:", {
                error: error.message,
                stack: error.stack,
              });
              reject(error);
            });
        })
        .catch((error) => {
          logger.error("Failed to get video info:", {
            error: error.message,
            stack: error.stack,
            videoId,
          });
          reject(error);
        });
    });

    // Verify the file exists and has content
    const stats = fs.statSync(tempPath);
    if (stats.size === 0) {
      throw new Error("Downloaded audio file is empty");
    }
    logger.info("File verification:", {
      size: stats.size,
      path: tempPath,
    });

    return tempPath; // Return MP3 path directly
  } catch (error) {
    logger.error("Error in downloadAudio:", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
      videoId,
      tempPath,
    });
    // Clean up on error
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
        logger.info("Cleaned up MP3 file after error");
      } catch (cleanupError) {
        logger.error("Failed to cleanup MP3 file:", cleanupError);
      }
    }
    throw error;
  }
}

/**
 *
 * @param videoId the video id of the youtube video we are trying to download the audio of
 * @returns
 */
export async function downloadAudio(videoId: string): Promise<string> {
  const tempDir = os.tmpdir();

  const tempPath = path.join(tempDir, `${videoId}_temp.mp3`);
  const outputPath = path.join(tempDir, `${videoId}.flac`);

  try {
    console.log(`Starting audio download for video ${videoId}`);

    // First download the audio
    await new Promise<void>((resolve, reject) => {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`Downloading from URL: ${videoUrl}`);

      // Get video info first
      ytdl
        .getInfo(videoUrl)
        .then((info) => {
          console.log("Video info retrieved:", {
            title: info.videoDetails.title,
            duration: info.videoDetails.lengthSeconds,
          });

          // Select the best audio format
          const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
          const format = audioFormats.sort((a, b) => {
            // Prefer opus/webm formats
            if (a.codecs?.includes("opus") && !b.codecs?.includes("opus"))
              return -1;
            if (!a.codecs?.includes("opus") && b.codecs?.includes("opus"))
              return 1;
            // Then sort by audio quality (bitrate)
            return (b.audioBitrate || 0) - (a.audioBitrate || 0);
          })[0];

          if (!format) {
            reject(new Error("No suitable audio format found"));
            return;
          }

          console.log("selected audio format", format);

          const stream = ytdl.downloadFromInfo(info, { format });

          stream.on("error", (error) => {
            reject(error);
          });

          const writeStream = fs.createWriteStream(tempPath);

          writeStream.on("error", (error) => {
            console.log("an error occured in write stream");
            reject(error);
          });

          stream
            .pipe(writeStream)
            .on("finish", () => {
              const stats = fs.statSync(tempPath);
              console.log(`Audio download completed: ${tempPath}`, {
                fileSize: stats.size,
              });
              resolve();
            })
            .on("error", (error) => {
              console.log("Error during audio download:", {
                error: error.message,
                stack: error.stack,
              });
              reject(error);
            });
        })
        .catch((error) => {
          console.log("Failed to get video info:", {
            error: error.message,
            stack: error.stack,
            videoId,
          });
          reject(error);
        });
    });

    // Verify the temp file exists and has content
    const tempStats = fs.statSync(tempPath);
    if (tempStats.size === 0) {
      throw new Error("Downloaded audio file is empty");
    }
    console.log("Temp file verification:", {
      size: tempStats.size,
      path: tempPath,
    });

    // Convert to optimal format for Whisper
    console.log("Converting audio to FLAC format...");
    try {
      const { stdout, stderr } = await execAsync(
        `ffmpeg -i ${tempPath} -ar 16000 -ac 1 -c:a flac ${outputPath}`
      );
      console.log("FFmpeg output:", { stdout, stderr });
    } catch (error: any) {
      console.log("FFmpeg conversion failed:", {
        error: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
      });
      throw error;
    }

    // Verify the output file
    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error("Converted FLAC file is empty");
    }
    console.log("Audio conversion completed successfully:", {
      inputSize: tempStats.size,
      outputSize: stats.size,
      outputPath,
    });

    // Clean up temp file
    fs.unlinkSync(tempPath);
    console.log("Temporary MP3 file cleaned up");

    return outputPath;
  } catch (error) {
    console.log("Error in downloadAudio:", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
      videoId,
      tempPath,
      outputPath,
    });
    // Clean up any files in case of error
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
        console.log("Cleaned up temp MP3 file after error");
      } catch (cleanupError) {
        console.log("Failed to cleanup temp MP3 file:", cleanupError);
      }
    }
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
        console.log("Cleaned up FLAC file after error");
      } catch (cleanupError) {
        console.log("Failed to cleanup FLAC file:", cleanupError);
      }
    }
    throw error;
  }
}

async function transcribeWithWhisper(audioPath: string): Promise<string> {
  try {
    console.log("Starting transcription process with OpenAI Whisper");

    // Verify input file
    const inputStats = fs.statSync(audioPath);
    console.log("Input file details:", {
      size: inputStats.size,
      path: audioPath,
    });

    // Read file as buffer
    const audioBuffer = await fs.promises.readFile(audioPath);
    console.log(`Read audio file of size: ${audioBuffer.length} bytes`);

    const openai = getOpenAIClient();

    if (!openai) {
      throw new Error("could not create open ai client");
    }

    try {
      console.log("Sending request to OpenAI Whisper API...");
      const transcription = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], "audio.flac", { type: "audio/flac" }),
        model: "whisper-1",
        language: "auto",
      });

      console.log(
        "Successfully received transcription from Whisper",
        transcription
      );
      return transcription.text;
    } catch (error: any) {
      console.log("Transcription request failed:", error);
      throw new Error(
        `Whisper transcription failed: ${error.message || "Unknown error"}`
      );
    }
  } finally {
    // Cleanup: Delete the temporary audio file
    try {
      await fs.promises.unlink(audioPath);
      console.log("Cleaned up temporary audio file");
    } catch (error) {
      console.log("Failed to delete temporary audio file:", error);
    }
  }
}

export async function transcribeMP3WithWhisper(
  audioPath: string
): Promise<string> {
  try {
    console.log("Starting transcription process with OpenAI Whisper");

    if (!audioPath) {
      throw new Error("Audio path does not exist");
    }
    // Verify file exists
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio path does not exist: ${audioPath}`);
    }
    // Verify input file
    const inputStats = fs.statSync(audioPath);
    console.log("Input file details:", {
      size: inputStats.size,
      path: audioPath,
    });

    // Read file as buffer
    const audioBuffer = await fs.promises.readFile(audioPath);
    console.log(`Read audio file of size: ${audioBuffer.length} bytes`);

    const openai = getOpenAIClient();

    if (!openai) {
      throw new Error("could not create open ai client");
    }

    try {
      console.log("Sending request to OpenAI Whisper API...");
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-1",
        language: "en",
      });

      console.log(
        "Successfully received transcription from Whisper",
        transcription
      );
      return transcription.text;
    } catch (error: any) {
      console.log("Transcription request failed:", error);
      throw new Error(`Whisper transcription failed: ${error.message}`, {
        cause: error,
      });
    }
  } finally {
    // Cleanup: Delete the temporary audio file
    try {
      await fs.promises.unlink(audioPath);
      console.log("Cleaned up temporary audio file");
    } catch (error) {
      console.log("Failed to delete temporary audio file:", error);
    }
  }
}
