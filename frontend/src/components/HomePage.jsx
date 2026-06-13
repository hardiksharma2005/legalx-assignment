import { useState, useEffect } from "react";
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

export default function HomePage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTopics()
      .then((data) => {
        setTopics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.detail ||
            "Failed to load topics. Is the backend running?"
        );
        setLoading(false);
      });
  }, []);

  function handleRetry() {
    setError(null);
    setLoading(true);
    getTopics()
      .then((data) => {
        setTopics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.detail ||
            "Failed to load topics. Is the backend running?"
        );
        setLoading(false);
      });
  }

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

        {error && (
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
              onClick={handleRetry}
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

        {!loading && !error && (
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
      </footer>
    </div>
  );
}
