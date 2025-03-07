import { NextRequest } from "next/server";
import ytpl from "ytpl";

/**
 *
 * Get all videos inside a youtube Video
 *
 * @param req
 * @param res
 * @returns
 */

export async function POST(req: NextRequest) {
  console.log("inside playlist get request");
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return Response.json(
      {
        message: "No Valid Url provided",
      },
      {
        status: 400,
      }
    );
  }

  console.log("found url", url);

  try {
    // Fetch the full playlist data (pages: Infinity to get all videos)
    const playlist = await ytpl(url, { pages: Infinity });

    console.log("playlist", playlist);

    const videos = playlist.items.map((video) => ({
      videoId: video.id,
      title: video.title,
    }));

    console.log("videos from playlist", videos);

    return Response.json(
      {
        videos,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log("an error occured trying to get playlist", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return Response.json(
      {
        error,
        errorMessage,
      },
      {
        status: 400,
      }
    );
  }
}
