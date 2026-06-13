import { useState, useEffect, useRef } from "react";

export default function AudioPlayer({ summary }) {
  const [supported, setSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
    return () => {
      // Stop speech when navigating away
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Reset state if summary changes
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, [summary]);

  function handlePlay() {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.lang = "en-IN";

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function handlePause() {
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }

  if (!supported) {
    return (
      <div
        style={{
          backgroundColor: "#1e293b",
          borderRadius: 12,
          padding: "28px 32px",
          color: "#94a3b8",
          textAlign: "center",
        }}
      >
        Audio not supported in this browser.
      </div>
    );
  }

  const btnBase = {
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    transition: "opacity 0.15s ease",
  };

  return (
    <div
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 12,
        padding: "28px 32px",
      }}
    >
      <h2
        style={{
          color: "#f59e0b",
          fontWeight: 700,
          fontSize: 18,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>🎙️</span> Audio Summary
      </h2>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
        Audio generated using your browser's built-in Text-to-Speech
      </p>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          style={{
            ...btnBase,
            backgroundColor: "#f59e0b",
            color: "#0f172a",
            opacity: isPlaying ? 0.5 : 1,
            cursor: isPlaying ? "not-allowed" : "pointer",
          }}
        >
          ▶ {isPaused ? "Resume" : "Play"}
        </button>

        <button
          onClick={handlePause}
          disabled={!isPlaying}
          style={{
            ...btnBase,
            backgroundColor: "#334155",
            color: "#e2e8f0",
            opacity: !isPlaying ? 0.5 : 1,
            cursor: !isPlaying ? "not-allowed" : "pointer",
          }}
        >
          ⏸ Pause
        </button>

        <button
          onClick={handleStop}
          disabled={!isPlaying && !isPaused}
          style={{
            ...btnBase,
            backgroundColor: "#334155",
            color: "#e2e8f0",
            opacity: !isPlaying && !isPaused ? 0.5 : 1,
            cursor: !isPlaying && !isPaused ? "not-allowed" : "pointer",
          }}
        >
          ⏹ Stop
        </button>

        {isPlaying && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#f59e0b",
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#f59e0b",
                animation: "pulse 1s infinite",
              }}
            />
            Playing…
            <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }`}</style>
          </span>
        )}
        {isPaused && (
          <span style={{ color: "#64748b", fontSize: 13 }}>Paused</span>
        )}
      </div>

      {/* Summary preview */}
      <div
        style={{
          backgroundColor: "#0f172a",
          borderRadius: 8,
          padding: "16px",
          maxHeight: 160,
          overflowY: "auto",
          border: "1px solid #334155",
        }}
      >
        <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.7 }}>{summary}</p>
      </div>
    </div>
  );
}
