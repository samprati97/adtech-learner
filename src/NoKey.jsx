export default function NoKey() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F8FAFC", padding: 24
    }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
          API Key Required
        </h1>
        <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginBottom: 24 }}>
          This app uses the Anthropic API for AI-powered quizzes and interview practice.
          Add your key to get started.
        </p>
        <div style={{
          background: "#0F172A", borderRadius: 10, padding: 16, textAlign: "left",
          fontFamily: "monospace", fontSize: 13, color: "#E2E8F0", marginBottom: 24
        }}>
          <div style={{ color: "#94A3B8", marginBottom: 8 }}># Create a .env file in the project root:</div>
          <div style={{ color: "#86EFAC" }}>VITE_ANTHROPIC_API_KEY=sk-ant-...</div>
        </div>
        <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
          Get your key at{" "}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer"
             style={{ color: "#4F46E5" }}>console.anthropic.com</a>
          {" "}→ API Keys. Then restart the dev server.
        </p>
      </div>
    </div>
  )
}
