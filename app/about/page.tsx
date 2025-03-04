import {
  extractVideoId,
  getAudioFromYoutubeVideo,
  getTranscript,
  getVideoInformation,
} from "@/lib/utils";
import { downloadAudio, transcribeMP3WithWhisper } from "@/lib/youtube";
import React from "react";

import { YoutubeTranscript } from "youtube-transcript";

const YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v=HOJS3qQlVjE";

const AboutUsPage = async () => {
  // const videoId = extractVideoId(YOUTUBE_VIDEO_URL);

  const downloadedAudioFilePath = await getAudioFromYoutubeVideo(
    YOUTUBE_VIDEO_URL
  );

  console.log("downloaded Audio file path ", downloadedAudioFilePath);
  const generatedAudioTranscription = await transcribeMP3WithWhisper(
    downloadedAudioFilePath.outputPath!
  );

  console.log("generated Audio Transcription", generatedAudioTranscription);

  // const fetchedTranscript = await getTranscript(
  //   "https://www.youtube.com/watch?v=HOJS3qQlVjE"
  // );

  // const videoInformation = await getVideoInformation(
  //   "https://www.youtube.com/watch?v=HOJS3qQlVjE"
  // );

  return (
    <div className="max-w-md mx-auto pt-12">
      <h1>AboutUsPage</h1>

      {JSON.stringify(generatedAudioTranscription)}

      {/* <div>
        <h3>Downloaded Audio</h3>
        {JSON.stringify(downloadedAudioFilePath)}
      </div> */}
      {/*
      <div>
        <h3>Video Information</h3>
        <span className="">{JSON.stringify(videoInformation)}</span>
      </div>
      <div className="">
        <h3>Fetched Transcript</h3>

        <span>{JSON.stringify(fetchedTranscript)}</span>
      </div> */}
    </div>
  );
};

export default AboutUsPage;
