"use client";

import { useMemo, useState } from "react";
import { useDirectVanaConnect } from "@opendatalabs/vana-sdk/react";
import type { CommerceAnalysisResult } from "@/lib/commerce";
import { demoReceipts } from "@/lib/demo-data";
import { forecastSubscriptions, type SubscriptionForecast } from "@/lib/recurrence";
import type { CommerceSource } from "@/lib/vana";

function jsonFetch(path: string, init?: RequestInit) {
  return fetch(path, init).then(async (response) => {
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `${response.status} from ${path}`);
    return payload;
  });
}

function Icon({ name }: { name: "spark" | "shield" | "calendar" | "receipt" | "wallet" | "arrow" | "check" }) {
  const paths = {
    spark: <><path d="M12 2l1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
    shield: <path d="M12 3 5 6v5c0 4.4 2.9 8.5 7 10 4.1-1.5 7-5.6 7-10V6l-7-3Zm-3 9 2 2 4-4"/>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6.5A2.5 2.5 0 0 1 5.5 4H18"/><path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z"/></>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const sourceDetails: Record<CommerceSource, { name: string; mark: string; description: string }> = {
  amazon: { name: "Amazon", mark: "a", description: "Orders and repeat buys" },
  shop: { name: "Shop", mark: "S", description: "Merchant order history" },
  uber: { name: "Uber", mark: "U", description: "Trips and ride receipts" },
};

function SourceConnector({ source, connected, onResult }: {
  source: CommerceSource;
  connected: boolean;
  onResult: (result: CommerceAnalysisResult) => void;
}) {
  const detail = sourceDetails[source];
  const connect = useDirectVanaConnect({
    createRequest: () => jsonFetch("/api/vana/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source }),
    }),
    getStatus: (requestId: string) => jsonFetch(`/api/vana/status?source=${source}&requestId=${encodeURIComponent(requestId)}`),
    readResult: async (requestId: string) => {
      const result = await jsonFetch(`/api/vana/data?source=${source}&requestId=${encodeURIComponent(requestId)}`) as CommerceAnalysisResult;
      onResult(result);
      return result;
    },
    pollIntervalMs: 1800,
    timeoutMs: 300_000,
  });
  const busy = !["idle", "error", "done"].includes(connect.state.type);
  const label = connected || connect.state.type === "done"
    ? "Connected"
    : connect.state.type === "error"
      ? "Try again"
      : busy
        ? "Connecting…"
        : "Connect";

  return <div className={`source-row ${connected ? "connected" : ""}`}>
    <span className={`source-mark ${source}`}>{detail.mark}</span>
    <span className="source-copy"><b>{detail.name}</b><small>{detail.description}</small></span>
    <button onClick={() => connect.start()} disabled={busy || connected}>
      {connected ? <Icon name="check" /> : null}{label}
    </button>
    {connect.state.type === "error" ? <small className="source-error">{connect.state.error.message}</small> : null}
  </div>;
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function shortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

function daysUntil(date: string) {
  return Math.max(0, Math.ceil((Date.parse(date) - Date.now()) / 86_400_000));
}

export function SubscriptionDashboard() {
  const [results, setResults] = useState<Partial<Record<CommerceSource, CommerceAnalysisResult>>>({});
  const demoForecasts = useMemo(() => forecastSubscriptions(demoReceipts), []);
  const liveForecasts = Object.values(results).flatMap((result) => result?.forecasts ?? []);
  const forecasts = liveForecasts.length || Object.keys(results).length ? liveForecasts : demoForecasts;
  const connectedSources = Object.keys(results).length;
  const recordCount = Object.values(results).reduce((sum, result) => sum + (result?.recordCount ?? 0), 0);
  const monthly = forecasts.reduce((sum, item) => sum + item.amount * (item.cadence === "Annual" ? 1 / 12 : item.cadence === "Quarterly" ? 1 / 3 : item.cadence === "Weekly" ? 4.33 : 1), 0);
  const upcoming = forecasts.filter((item) => daysUntil(item.nextCharge) <= 30);
  const dataMode = connectedSources ? "vana" : "demo";
  const saveResult = (result: CommerceAnalysisResult) => setResults((current) => ({ ...current, [result.source]: result }));

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="ChargeSignal home"><span className="brand-mark"><Icon name="spark" /></span>ChargeSignal</a>
        <div className="nav-meta"><span><Icon name="shield" />Private spending analysis</span><span className="nav-badge">Powered by Vana</span></div>
      </nav>

      <section id="top" className="hero shell">
        <div className="lamp lamp-left" aria-hidden="true"><i></i></div>
        <div className="lamp lamp-right" aria-hidden="true"><i></i></div>
        <div className="hero-copy">
          <div className="eyebrow"><span></span> Your spending co-pilot</div>
          <h1>Know what you’ll<br /><em>spend next.</em></h1>
          <p>Bring your Amazon, Shop, and Uber history together. ChargeSignal privately finds repeat purchases, spending patterns, and the charges most likely to return.</p>
          <div className="hero-actions">
            <a className="primary" href="#connect"><Icon name="spark" />Build my signal<Icon name="arrow" /></a>
            <a className="text-button" href="#dashboard-title">Explore demo</a>
          </div>
          <div className="trust-row"><span><Icon name="check" />User-approved data</span><span><Icon name="check" />Backend analysis</span><span><Icon name="check" />Revoke anytime</span></div>
        </div>

        <div className="signal-card source-card" id="connect" aria-label="Connect spending data">
          <div className="signal-top"><span>Your data lineup</span><span className="live-dot">{connectedSources}/3 live</span></div>
          <div className="connect-heading"><span className="receipt-ribbon"><Icon name="shield" /> Vana-secured</span><h2>Connect what you use</h2><p>Every source adds a sharper spending signal.</p></div>
          <div className="source-list">
            {(["amazon", "shop", "uber"] as CommerceSource[]).map((source) =>
              <SourceConnector key={source} source={source} connected={Boolean(results[source])} onResult={saveResult} />,
            )}
          </div>
          <small className="connect-footnote">You approve each source separately. ChargeSignal never receives your login credentials.</small>
        </div>
      </section>

      <section className="dashboard shell" aria-labelledby="dashboard-title">
        <div className="section-heading">
          <div><span className="kicker">Your money map</span><h2 id="dashboard-title">Spending forecast</h2></div>
          <span className={`mode-pill ${dataMode}`}><i></i>{dataMode === "demo" ? "Demo preview" : `${connectedSources} source${connectedSources === 1 ? "" : "s"} live`}</span>
        </div>
        <div className="stats-grid">
          <article className="stat"><div className="stat-icon mint"><Icon name="wallet" /></div><div><span>Estimated recurring</span><strong>{money(monthly, forecasts[0]?.currency ?? "USD")}</strong><small>per month</small></div></article>
          <article className="stat"><div className="stat-icon peach"><Icon name="receipt" /></div><div><span>Data sources</span><strong>{connectedSources || 3}</strong><small>{connectedSources ? "securely connected" : "available to connect"}</small></div></article>
          <article className="stat"><div className="stat-icon yellow"><Icon name="calendar" /></div><div><span>Records analyzed</span><strong>{connectedSources ? recordCount : demoReceipts.length}</strong><small>private commerce events</small></div></article>
        </div>

        <div className="content-grid">
          <section className="panel upcoming-panel">
            <div className="panel-head"><div><span>Next 30 days</span><h3>Likely repeat spend</h3></div><span className="count">{upcoming.length} signals</span></div>
            <div className="charge-list">
              {upcoming.map((item: SubscriptionForecast, index) => <article className="charge" key={`${item.merchant}-${item.nextCharge}`}>
                <div className={`merchant-logo logo-${index % 4}`}>{item.merchant.slice(0, 1)}</div>
                <div className="charge-main"><strong>{item.merchant}</strong><span>{item.category} · {item.cadence}</span></div>
                <div className="charge-when"><strong>{shortDate(item.nextCharge)}</strong><span>in {daysUntil(item.nextCharge)} days</span></div>
                <div className="charge-price">{money(item.amount, item.currency)}</div>
              </article>)}
              {!upcoming.length ? <div className="empty-list">Your data is connected. Add another source or build more history to reveal reliable repeat-spend signals.</div> : null}
            </div>
          </section>

          <aside className="panel insight-panel">
            <span className="insight-icon"><Icon name="spark" /></span>
            <span className="kicker">Signal insight</span>
            <h3>{connectedSources ? "Your private spending map is taking shape." : "Three sources. One private money map."}</h3>
            <p>{connectedSources ? `ChargeSignal analyzed ${recordCount} commerce records across ${connectedSources} connected source${connectedSources === 1 ? "" : "s"}. Add another source to improve the picture.` : "Connect any source to replace this preview with your own repeat-purchase and recurring-spend signals."}</p>
            <div className="privacy-note"><Icon name="shield" /><span><b>Your data stays yours.</b> Access is limited to the commerce datasets you explicitly approve through Vana.</span></div>
          </aside>
        </div>
      </section>

      <section className="how shell">
        <span className="kicker">How it works</span><h2>From history to foresight.</h2>
        <div className="steps">
          <article><span>01</span><div className="step-icon"><Icon name="shield" /></div><h3>Choose a source</h3><p>Connect Amazon, Shop, or Uber through Vana’s user-controlled data flow.</p></article>
          <article><span>02</span><div className="step-icon"><Icon name="receipt" /></div><h3>We find repetition</h3><p>Timing, merchants, items, and amounts reveal recurring spending patterns.</p></article>
          <article><span>03</span><div className="step-icon"><Icon name="calendar" /></div><h3>You get the signal</h3><p>See likely dates and amounts before familiar spending returns.</p></article>
        </div>
      </section>

      <footer className="shell"><a className="brand" href="#top"><span className="brand-mark"><Icon name="spark" /></span>ChargeSignal</a><p>Vana-secured · Your data, your control.</p><span>Forecasts are estimates, not billing guarantees.</span></footer>
    </main>
  );
}
