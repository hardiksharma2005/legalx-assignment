import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getTopics } from "../api/client.js";
import TopicCard from "./TopicCard.jsx";

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0" }}>
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid #1e293b",
          borderTop: "4px solid #f59e0b",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function isWarmingUp(err) {
  const msg = String(err?.message || err || "");
  return (
    msg.includes("Network Error") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ERR_CONNECTION_REFUSED") ||
    msg.includes("Failed to fetch")
  );
}

export default function HomePage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warmingUp, setWarmingUp] = useState(false);
  const retryTimerRef = useRef(null);

  function fetchTopics() {
    setLoading(true);
    setError(null);
    setWarmingUp(false);

    getTopics()
      .then((data) => {
        setTopics(data);
        setLoading(false);
      })
      .catch((err) => {
        if (isWarmingUp(err)) {
          setWarmingUp(true);
          setError(null);
        } else {
          setError(err?.response?.data?.detail || "Failed to load topics. Is the backend running?");
        }
        setLoading(false);
      });
  }

  // Initial fetch
  useEffect(() => {
    fetchTopics();
  }, []);

  // Auto-retry every 15 seconds while the server is warming up
  useEffect(() => {
    if (warmingUp) {
      retryTimerRef.current = setTimeout(() => {
        fetchTopics();
      }, 15000);
    }
    return () => clearTimeout(retryTimerRef.current);
  }, [warmingUp]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: "#0f172a",
          borderBottom: "1px solid #1e293b",
          padding: "24px 0",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 36 }}>⚖️</span>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#f59e0b",
                letterSpacing: "-0.5px",
              }}
            >
              LegalX Knowledge Centre
            </h1>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 16, marginTop: 4 }}>
            Your AI-powered guide to Indian Law
          </p>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        {loading && <Spinner />}

        {/* Warming-up state */}
        {!loading && warmingUp && (
          <div
            style={{
              backgroundColor: "#1c1500",
              border: "1px solid #92400e",
              borderRadius: 12,
              padding: "28px 32px",
              textAlign: "center",
              color: "#fde68a",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
              ⏳ Backend is warming up...
            </p>
            <p style={{ fontSize: 14, color: "#fcd34d", marginBottom: 24, lineHeight: 1.6 }}>
              The server is starting up (this takes ~30 seconds on free tier).
              Please wait and click Retry.
            </p>
            <button
              onClick={() => fetchTopics()}
              style={{
                backgroundColor: "#f59e0b",
                color: "#0f172a",
                border: "none",
                padding: "10px 28px",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Retry
            </button>
            <p style={{ marginTop: 16, fontSize: 12, color: "#92400e" }}>
              Auto-retrying in 15 seconds…
            </p>
          </div>
        )}

        {/* Generic error state */}
        {!loading && !warmingUp && error && (
          <div
            style={{
              backgroundColor: "#1e0a0a",
              border: "1px solid #7f1d1d",
              borderRadius: 12,
              padding: "24px 32px",
              textAlign: "center",
              color: "#fca5a5",
            }}
          >
            <p style={{ marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => fetchTopics()}
              style={{
                backgroundColor: "#f59e0b",
                color: "#0f172a",
                border: "none",
                padding: "10px 24px",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && !warmingUp && (
          <>
            <p
              style={{
                color: "#64748b",
                textAlign: "center",
                marginBottom: 40,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Select a topic to explore
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  id={topic.id}
                  name={topic.name}
                  short_description={topic.short_description}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          color: "#475569",
          fontSize: 13,
          borderTop: "1px solid #1e293b",
        }}
      >
        Powered by Groq AI + RAG Technology
        <br />
        <span style={{ fontSize: 11, color: "#334155", marginTop: 6, display: "inline-block" }}>
          Note: First load may take 30-60 seconds as the server wakes from sleep.
        </span>
      </footer>
    </div>
  );
}
