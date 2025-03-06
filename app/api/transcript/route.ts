import {
  extractVideoId,
  getAudioFromYoutubeVideo,
  getTranscriptFromVideoId,
} from "@/lib/utils";
import { transcribeBlobUrlWithWhisper } from "@/lib/youtube";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        {
          error: "NO URL Provided",
        },
        {
          status: 400,
        }
      );
    }

    const videoId = extractVideoId(url);

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL provided" },
        { status: 400 }
      );
    }

    const transcriptVideoResponse = await getTranscriptFromVideoId(videoId);

    if (transcriptVideoResponse.type === "success") {
      return NextResponse.json(
        {
          ...transcriptVideoResponse,
        },
        {
          status: 200,
        }
      );
    }

    const uploadedAudioBlobUrl = await getAudioFromYoutubeVideo(url);

    if (uploadedAudioBlobUrl.type === "error") {
      return NextResponse.json(
        { error: "Could not generate audio from YouTube video" },
        { status: 500 }
      );
    }

    const generatedTranscript = await transcribeBlobUrlWithWhisper(
      uploadedAudioBlobUrl.vercelBlobUrl!
    );

    if (!generatedTranscript) {
      return NextResponse.json(
        { error: "Could not generate transcript from audio" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      type: "success",
      transcript: generatedTranscript,
    });
  } catch (error) {
    console.log("an error occured", error);
    return NextResponse.json(
      {
        error: "An error occured while trying to summarize youtube video",
      },
      {
        status: 400,
      }
    );
  }
}
