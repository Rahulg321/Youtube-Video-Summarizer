import SummarizeUrlForm from "@/components/forms/summarize-url-form";
import YouTubeTranscriptionForm from "@/components/forms/youtube-transcription-form";
import React from "react";

const AboutUsPage = async () => {
  return (
    <div className="max-w-md mx-auto text-wrap pt-12">
      <h1>Youtube Transition Form</h1>
      {/* <SummarizeUrlForm /> */}
      <YouTubeTranscriptionForm />
    </div>
  );
};

export default AboutUsPage;
