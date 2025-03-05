import { customAlphabet } from "nanoid";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { YoutubeTranscript } from "youtube-transcript";
import ytdl from "@distube/ytdl-core";
import { downloadAudioAsMP3 } from "./youtube";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractVideoId(youtube_url: string): string {
  const patterns = [
    /(?:v=|\/)([0-9A-Za-z_-]{11}).*/, // Standard and shared URLs
    /(?:embed\/)([0-9A-Za-z_-]{11})/, // Embed URLs
    /(?:youtu\.be\/)([0-9A-Za-z_-]{11})/, // Shortened URLs
    /(?:shorts\/)([0-9A-Za-z_-]{11})/, // YouTube Shorts
    /^([0-9A-Za-z_-]{11})$/, // Just the video ID
  ];

  const url = youtube_url.trim();

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  throw new Error("Could not extract video ID from URL");
}

export const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789");

/**
 *
 * @param youtube_url url of the youtube video
 * @returns
 */
export const getAudioFromYoutubeVideo = async (youtube_url: string) => {
  try {
    const videoId = extractVideoId(youtube_url);
    console.log("extracted videoId", videoId);
    const vercelBlobUrl = await downloadAudioAsMP3(videoId);
    console.log("vercel blob url is", vercelBlobUrl);

    // const outputPath = await downloadAudio(videoId);
    return {
      type: "success",
      vercelBlobUrl,
    };
  } catch (error) {
    return {
      type: "error",
      message: "Could not generate audio from video",
    };
  }
};

export const getTranscript = async (youtube_url: string) => {
  try {
    const videoId = extractVideoId(youtube_url);
    console.log("extracted videoId", videoId);
    const fetchedTranscript = await YoutubeTranscript.fetchTranscript(videoId);

    const firstFewLines = fetchedTranscript
      .slice(0, 5)
      .map((item) => item.text)
      .join(" ");

    let title = firstFewLines.split(".")[0].trim();
    if (title.length > 100) {
      title = title.substring(0, 97) + "...";
    }
    if (title.length < 10) {
      title = `YouTube Video Summary`;
    }

    let slicedTranscript = fetchedTranscript.map((item) => item.text).join(" ");

    return {
      type: "success",
      transcript: slicedTranscript,
    };
  } catch (error) {
    console.log("error fetching transcript", error);
    return {
      type: "error",
      transcript: "Could not find transcript",
    };
  }
};

export const getTranscriptFromVideoId = async (videoId: string) => {
  try {
    console.log("extracted videoId", videoId);
    const fetchedTranscript = await YoutubeTranscript.fetchTranscript(videoId);

    const firstFewLines = fetchedTranscript
      .slice(0, 5)
      .map((item) => item.text)
      .join(" ");

    let title = firstFewLines.split(".")[0].trim();
    if (title.length > 100) {
      title = title.substring(0, 97) + "...";
    }
    if (title.length < 10) {
      title = `YouTube Video Summary`;
    }

    let slicedTranscript = fetchedTranscript.map((item) => item.text).join(" ");

    return {
      type: "success",
      title,
      source: "youtube",
      transcript: slicedTranscript,
    };
  } catch (error) {
    console.log("error fetching transcript", error);
    return {
      type: "error",
      transcript: "Could not find transcript",
    };
  }
};

// export const getVideoTranscript = async (videoId: string) => {
//   try {
//     const videoInfo = await ytdl.getInfo(videoId);

//     console.log("video information", videoInfo);
//     return {
//       videoInfo,
//     };
//   } catch (error) {
//     console.error("could not generate");
//     return {
//       videoInfo: "Error, could not generate video Information",
//     };
//   }
// };

export const getVideoInformation = async (youtube_url: string) => {
  try {
    const videoId = extractVideoId(youtube_url);
    console.log("extracted videoId", videoId);

    const videoInfo = await ytdl.getInfo(videoId);

    console.log("video information", videoInfo);
    return {
      videoInfo,
    };
  } catch (error) {
    console.error("could not generate video information", error);
    return {
      videoInfo: "Error, could not generate video Information",
    };
  }
};
