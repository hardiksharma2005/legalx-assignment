import { useState, useEffect, useRef } from "react";
import { askQuestion } from "../api/client.js";

function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
      <div
        style={{
          backgroundColor: "#1e293b",
          borderRadius: "12px 12px 12px 2px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#64748b",
              display: "inline-block",
              animation: `bounce 1s ${delay}ms infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "12px 16px",
          borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          backgroundColor: isUser ? "#f59e0b" : "#1e293b",
          color: isUser ? "#0f172a" : "#e2e8f0",
          fontSize: 14,
          lineHeight: 1.6,
          fontWeight: isUser ? 600 : 400,
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default function ChatAssistant({ topicId }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI legal assistant. Ask me anything about this topic.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const answer = await askQuestion(topicId, question);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      const errorMsg =
        err?.response?.data?.detail ||
        "Sorry, something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #334155",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 20 }}>🤖</span>
        <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 16 }}>
          AI Legal Assistant
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          padding: "16px 20px",
          overflowY: "auto",
          maxHeight: 384,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #334155",
          display: "flex",
          gap: 10,
          backgroundColor: "#0f172a",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Ask a question about this law…"
          style={{
            flex: 1,
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#e2e8f0",
            fontSize: 14,
            outline: "none",
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            backgroundColor: "#f59e0b",
            color: "#0f172a",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 700,
            fontSize: 14,
            cursor: !input.trim() || loading ? "not-allowed" : "pointer",
            opacity: !input.trim() || loading ? 0.5 : 1,
            transition: "opacity 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
