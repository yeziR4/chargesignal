export default function ConnectReturnPage() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
    <section className="signal-card" style={{ maxWidth: 480, minHeight: 0, padding: 48 }}>
      <span className="brand-mark" style={{ margin: "0 auto 20px" }}>✓</span>
      <h1 style={{ font: "500 36px Georgia, serif" }}>Approval complete</h1>
      <p style={{ color: "#6b7e78", lineHeight: 1.6 }}>You can close this tab. Threadprint is privately analyzing only the AI history you approved.</p>
    </section>
  </main>;
}
