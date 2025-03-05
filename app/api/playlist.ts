// import { NextRequest, NextResponse } from "next/server";
// import ytpl from "ytpl";

// export async function POST(req: NextRequest, res: NextResponse) {
//   const { url } = await req.json();

//   if (!url) {
//     return res.status(400).json({ error: "Playlist URL is required" });
//   }

//   try {
//     // Fetch the full playlist data (pages: Infinity to get all videos)
//     const playlist = await ytpl(url, { pages: Infinity });
//     const videos = playlist.items.map((video) => ({
//       videoId: video.id,
//       title: video.title,
//     }));
//     res.status(200).json({ videos });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }
