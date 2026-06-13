const SECTIONS = [
  {
    key: "key_rights",
    label: "Key Rights",
    icon: "🛡️",
    accentColor: "#3b82f6",
    bgColor: "#0f172a",
    borderColor: "#1e3a5f",
  },
  {
    key: "important_provisions",
    label: "Important Provisions",
    icon: "📖",
    accentColor: "#22c55e",
    bgColor: "#0f172a",
    borderColor: "#14532d",
  },
  {
    key: "important_penalties",
    label: "Important Penalties",
    icon: "⚠️",
    accentColor: "#ef4444",
    bgColor: "#0f172a",
    borderColor: "#7f1d1d",
  },
  {
    key: "who_can_benefit",
    label: "Who Can Benefit",
    icon: "👥",
    accentColor: "#a855f7",
    bgColor: "#0f172a",
    borderColor: "#581c87",
  },
];

function Section({ section, items }) {
  return (
    <div
      style={{
        backgroundColor: "#1e293b",
        borderRadius: 12,
        padding: "20px 24px",
        border: `1px solid ${section.borderColor}`,
      }}
    >
      <h3
        style={{
          color: section.accentColor,
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{section.icon}</span>
        {section.label}
      </h3>
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {(items || []).map((item, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 14,
              lineHeight: 1.6,
              color: "#e2e8f0",
            }}
          >
            <span
              style={{
                backgroundColor: section.accentColor,
                color: "#0f172a",
                fontWeight: 700,
                fontSize: 11,
                minWidth: 22,
                height: 22,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function KeyInfo({ keyinfo }) {
  if (!keyinfo) {
    return (
      <p style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>
        Loading key information...
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
        gap: 20,
      }}
    >
      {SECTIONS.map((section) => (
        <Section
          key={section.key}
          section={section}
          items={keyinfo[section.key] || []}
        />
      ))}
    </div>
  );
}
