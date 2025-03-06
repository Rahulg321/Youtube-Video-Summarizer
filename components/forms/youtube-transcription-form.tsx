"use client";

import { useState, useTransition } from "react";
import axios from "axios";

export default function YouTubeTranscriptionForm() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTranscript("");
    setError("");

    // Use startTransition to mark the update as non-urgent.
    startTransition(async () => {
      try {
        const response = await axios.post("/api/transcript", { url });
        console.log("response", response);
        if (response.data.type === "success") {
          setTranscript(response.data.transcript);
        } else {
          setError("Failed to get transcript.");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
            "An error occurred while processing the video."
        );
      }
    });
  };

  const saveToKnowledgeBase = () => {
    startTransition(async () => {
      try {
        const response = await axios.post("/api/save-resource", { transcript });
        console.log("response", response);
        if (response.data.type === "success") {
          setTranscript(response.data.transcript);
        } else {
          setError("Failed to save transcript.");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error || "Failed to save transcript to knowledge"
        );
      }
    });
  };

  return (
    <div>
      {transcript && (
        <div className="mt-4 md:mt-6 lg:mt-8">
          <h2>Transcript</h2>
          <button className="bg-red-200">Save to Knowledge Base</button>
          <pre style={{ whiteSpace: "pre-wrap" }}>{transcript}</pre>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 600, margin: "2rem auto" }}
      >
        <div>
          <label htmlFor="youtube-url">YouTube URL:</label>
          <input
            id="youtube-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter YouTube video URL"
            style={{ width: "100%", padding: "0.5rem", margin: "0.5rem 0" }}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          style={{ padding: "0.5rem 1rem" }}
        >
          {isPending ? "Processing..." : "Get Transcript"}
        </button>
        {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
      </form>
    </div>
  );
}
