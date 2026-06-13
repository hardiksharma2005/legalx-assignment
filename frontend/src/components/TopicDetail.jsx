import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTopicSummary, getTopicKeyInfo } from "../api/client.js";
import KeyInfo from "./KeyInfo.jsx";
import AudioPlayer from "./AudioPlayer.jsx";
import ChatAssistant from "./ChatAssistant.jsx";

const TOPIC_NAMES = {
  pocso: "POCSO Act",
  consumer_protection: "Consumer Protection Act",
  cyber_crime: "Cyber Crime (IT Act)",
  rti: "Right to Information Act",
  gst_registration: "GST Registration",
};

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "keyinfo", label: "Key Information" },
  { id: "askai", label: "Ask AI" },
  { id: "audio", label: "Audio" },
];

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
      <div
        style={{
          width: 40,
          height: 40,
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

export default function TopicDetail() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [summary, setSummary] = useState("");
  const [keyinfo, setKeyinfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([getTopicSummary(topicId), getTopicKeyInfo(topicId)])
      .then(([summaryData, keyinfoData]) => {
        setSummary(summaryData);
        setKeyinfo(keyinfoData);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.detail ||
            "Failed to load topic data. Run the pipeline first via POST /api/pipeline/run."
        );
        setLoading(false);
      });
  }, [topicId]);

  const topicTitle = TOPIC_NAMES[topicId] || topicId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: "#0f172a",
          borderBottom: "1px solid #1e293b",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              color: "#f59e0b",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#1e293b")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            ← Back
          </button>
          <span style={{ color: "#334155" }}>|</span>
          <h1 style={{ color: "#ffffff", fontWeight: 700, fontSize: 18 }}>
            {topicTitle}
          </h1>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: 4,
            backgroundColor: "#1e293b",
            borderRadius: 10,
            padding: 4,
            marginBottom: 32,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "10px 16px",
                border: "none",
                borderRadius: 7,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s ease",
                backgroundColor: activeTab === tab.id ? "#f59e0b" : "transparent",
                color: activeTab === tab.id ? "#0f172a" : "#94a3b8",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* States */}
        {loading && <Spinner />}

        {error && (() => {
          const isRateLimit = /429|rate.?limit/i.test(error);
          return isRateLimit ? (
            <div
              style={{
                backgroundColor: "#1c1500",
                border: "1px solid #92400e",
                borderRadius: 12,
                padding: "24px 32px",
                color: "#fde68a",
                lineHeight: 1.6,
              }}
            >
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                ⏳ AI Rate Limit Reached
              </p>
              <p style={{ fontSize: 14, marginBottom: 20 }}>
                The Groq API free tier limit has been reached. This is temporary — please wait
                1-2 minutes and refresh the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: "#f59e0b",
                  color: "#0f172a",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#1e0a0a",
                border: "1px solid #7f1d1d",
                borderRadius: 12,
                padding: "24px 32px",
                color: "#fca5a5",
                lineHeight: 1.6,
              }}
            >
              <p style={{ fontWeight: 700, marginBottom: 8 }}>Could not load topic data</p>
              <p style={{ fontSize: 14 }}>{error}</p>
            </div>
          );
        })()}

        {/* Tab content */}
        {!loading && !error && (
          <>
            {activeTab === "summary" && (
              <div
                style={{
                  backgroundColor: "#1e293b",
                  borderRadius: 12,
                  padding: "28px 32px",
                }}
              >
                <h2 style={{ color: "#f59e0b", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
                  Summary
                </h2>
                <p
                  style={{
                    color: "#e2e8f0",
                    lineHeight: 1.8,
                    fontSize: 15,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {summary}
                </p>
              </div>
            )}

            {activeTab === "keyinfo" && <KeyInfo keyinfo={keyinfo} />}

            {activeTab === "askai" && <ChatAssistant topicId={topicId} />}

            {activeTab === "audio" && <AudioPlayer summary={summary} />}
          </>
        )}
      </div>
    </div>
  );
}
