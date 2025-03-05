import SummarizeUrlForm from "@/components/forms/summarize-url-form";
import YouTubeTranscriptionForm from "@/components/forms/youtube-transcription-form";
import React from "react";
import ytpl from "ytpl";

const PLAYLIST_URL =
  "https://www.youtube.com/playlist?list=PLHxLVfTCdGiq8ABmm40aVn8RXX-Nxn-e7";

const AboutUsPage = async () => {
  return (
    <div className="max-w-md mx-auto text-wrap pt-12">
      <h1>Youtube Transition Form</h1>
      {/* <SummarizeUrlForm /> */}
      {/* <YouTubeTranscriptionForm /> */}
    </div>
  );
};

export default AboutUsPage;
