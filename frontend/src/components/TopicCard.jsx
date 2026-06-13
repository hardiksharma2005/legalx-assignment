import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TopicCard({ id, name, short_description }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 12,
        padding: "24px",
        boxShadow: hovered
          ? "0 12px 32px rgba(0,0,0,0.4)"
          : "0 4px 12px rgba(0,0,0,0.2)",
        borderLeft: "4px solid #f59e0b",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "default",
      }}
    >
      <h2
        style={{
          color: "#ffffff",
          fontWeight: 700,
          fontSize: 18,
          lineHeight: 1.3,
        }}
      >
        {name}
      </h2>

      <p
        style={{
          color: "#94a3b8",
          fontSize: 14,
          lineHeight: 1.6,
          flexGrow: 1,
        }}
      >
        {short_description}
      </p>

      <button
        onClick={() => navigate(`/topic/${id}`)}
        style={{
          backgroundColor: "#f59e0b",
          color: "#0f172a",
          border: "none",
          padding: "10px 20px",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          width: "100%",
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "#fbbf24")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "#f59e0b")}
      >
        Read More →
      </button>
    </div>
  );
}
