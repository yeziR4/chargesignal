"use client";

import { useMemo, useState } from "react";
import { useDirectVanaConnect } from "@opendatalabs/vana-sdk/react";
import { demoReceipts } from "@/lib/demo-data";
import { forecastSubscriptions, type GmailReceipt, type ReceiptAnalysisResult, type SubscriptionForecast } from "@/lib/recurrence";

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

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function shortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

function daysUntil(date: string) {
  return Math.max(0, Math.ceil((Date.parse(date) - Date.now()) / 86_400_000));
}

export function SubscriptionDashboard() {
  const [receipts, setReceipts] = useState<GmailReceipt[]>(demoReceipts);
  const [liveForecasts, setLiveForecasts] = useState<SubscriptionForecast[] | null>(null);
  const [receiptCount, setReceiptCount] = useState(demoReceipts.length);
  const [dataMode, setDataMode] = useState<"demo" | "vana">("demo");
  const connect = useDirectVanaConnect({
    createRequest: () => jsonFetch("/api/vana/request", { method: "POST" }),
    getStatus: (requestId: string) => jsonFetch(`/api/vana/status?requestId=${encodeURIComponent(requestId)}`),
    readResult: async (requestId: string) => {
      const result = await jsonFetch(`/api/vana/data?requestId=${encodeURIComponent(requestId)}`) as ReceiptAnalysisResult;
      if (!result.receiptCount) throw new Error("No Gmail receipt rows were returned for this grant.");
      setLiveForecasts(result.forecasts);
      setReceiptCount(result.receiptCount);
      setDataMode("vana");
      return result;
    },
    pollIntervalMs: 1800,
    timeoutMs: 300_000,
  });

  const demoForecasts = useMemo(() => forecastSubscriptions(receipts), [receipts]);
  const forecasts = liveForecasts ?? demoForecasts;
  const monthly = forecasts.reduce((sum, item) => sum + item.amount * (item.cadence === "Annual" ? 1 / 12 : item.cadence === "Quarterly" ? 1 / 3 : item.cadence === "Weekly" ? 4.33 : 1), 0);
  const upcoming = forecasts.filter((item) => daysUntil(item.nextCharge) <= 30);
  const next = forecasts[0];
  const stateLabel = connect.state.type === "idle" ? "Connect Gmail" : connect.state.type === "done" ? "Gmail connected" : connect.state.type === "error" ? "Try Gmail connection" : "Securely connecting…";

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="ChargeSignal home"><span className="brand-mark"><Icon name="spark" /></span>ChargeSignal</a>
        <div className="nav-meta"><span><Icon name="shield" />Private receipt analysis</span><span className="nav-badge">Powered by Vana</span></div>
      </nav>

      <section id="top" className="hero shell">
        <div className="lamp lamp-left" aria-hidden="true"><i></i></div>
        <div className="lamp lamp-right" aria-hidden="true"><i></i></div>
        <div className="hero-copy">
          <div className="eyebrow"><span></span> Your subscription co-pilot</div>
          <h1>Know what’s<br /><em>charging next.</em></h1>
          <p>Connect Gmail once. ChargeSignal securely finds receipts and recurring payments, understands their context, and forecasts what is likely to charge again.</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => connect.start()} disabled={!(["idle", "error"].includes(connect.state.type))}>
              <span className="gmail-dot">M</span>{stateLabel}<Icon name="arrow" />
            </button>
            <button className="text-button" onClick={() => { setReceipts(demoReceipts); setLiveForecasts(null); setReceiptCount(demoReceipts.length); setDataMode("demo"); }}>Explore demo</button>
          </div>
          {connect.state.type === "error" ? <p className="connect-error" role="alert">{connect.state.error.message}</p> : null}
          <div className="trust-row"><span><Icon name="check" />Read-only receipt access</span><span><Icon name="check" />Backend analysis</span><span><Icon name="check" />Revoke anytime</span></div>
        </div>
        <div className="signal-card" aria-label="Next predicted charge">
          <div className="signal-top"><span>Charge forecast</span><span className="live-dot">Context analyzed</span></div>
          {next ? <>
            <div className="receipt-ribbon"><Icon name="receipt" /> Smart receipt scan</div>
            <div className="merchant-orbit"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><span>{next.merchant.slice(0, 1)}</span></div>
            <div className="signal-merchant">{next.merchant}</div>
            <div className="signal-price">{money(next.amount, next.currency)}</div>
            <div className="signal-date"><Icon name="calendar" />Expected {shortDate(next.nextCharge)} · {daysUntil(next.nextCharge)} days</div>
            <div className="confidence"><div><span style={{ width: `${next.confidence}%` }}></span></div><b>{next.confidence}% confidence</b></div>
          </> : <div className="empty-forecast">Connect a receipt history with at least two matching charges to generate a forecast.</div>}
        </div>
      </section>

      <section className="dashboard shell" aria-labelledby="dashboard-title">
        <div className="section-heading">
          <div><span className="kicker">Your money map</span><h2 id="dashboard-title">Subscription forecast</h2></div>
          <span className={`mode-pill ${dataMode}`}><i></i>{dataMode === "demo" ? "Demo data" : "Vana data"}</span>
        </div>
        <div className="stats-grid">
          <article className="stat"><div className="stat-icon mint"><Icon name="wallet" /></div><div><span>Estimated monthly</span><strong>{money(monthly, "USD")}</strong><small>Across recurring charges</small></div></article>
          <article className="stat"><div className="stat-icon peach"><Icon name="receipt" /></div><div><span>Subscriptions found</span><strong>{forecasts.length}</strong><small>From {receiptCount} receipt emails</small></div></article>
          <article className="stat"><div className="stat-icon yellow"><Icon name="calendar" /></div><div><span>Due in 30 days</span><strong>{upcoming.length}</strong><small>{money(upcoming.reduce((sum, item) => sum + item.amount, 0), "USD")} projected</small></div></article>
        </div>

        <div className="content-grid">
          <section className="panel upcoming-panel">
            <div className="panel-head"><div><span>Next 30 days</span><h3>Upcoming charges</h3></div><span className="count">{upcoming.length} expected</span></div>
            <div className="charge-list">
              {upcoming.map((item, index) => <article className="charge" key={`${item.merchant}-${item.nextCharge}`}>
                <div className={`merchant-logo logo-${index % 4}`}>{item.merchant.slice(0, 1)}</div>
                <div className="charge-main"><strong>{item.merchant}</strong><span>{item.category} · {item.cadence}</span></div>
                <div className="charge-when"><strong>{shortDate(item.nextCharge)}</strong><span>in {daysUntil(item.nextCharge)} days</span></div>
                <div className="charge-price">{money(item.amount, item.currency)}</div>
              </article>)}
              {!upcoming.length ? <div className="empty-list">No reliable charges are predicted in the next 30 days.</div> : null}
            </div>
          </section>

          <aside className="panel insight-panel">
            <span className="insight-icon"><Icon name="spark" /></span>
            <span className="kicker">Signal insight</span>
            <h3>Your subscriptions look steady.</h3>
            <p>We found {forecasts.length} repeating patterns. Forecasts use charge timing, merchant context, and amount consistency—not unrelated personal email.</p>
            <div className="privacy-note"><Icon name="shield" /><span><b>Your inbox stays yours.</b> Access is scoped to the Gmail receipts dataset you approve through Vana.</span></div>
          </aside>
        </div>
      </section>

      <section className="how shell">
        <span className="kicker">How it works</span><h2>From receipts to foresight.</h2>
        <div className="steps">
          <article><span>01</span><div className="step-icon"><Icon name="shield" /></div><h3>Connect Gmail</h3><p>One secure flow requests only the receipt data needed. Vana handles the approval layer underneath.</p></article>
          <article><span>02</span><div className="step-icon"><Icon name="receipt" /></div><h3>We read the context</h3><p>Merchant, amount, receipt language, and timing reveal recurring payment patterns.</p></article>
          <article><span>03</span><div className="step-icon"><Icon name="calendar" /></div><h3>You get the signal</h3><p>See likely dates and amounts before the next charge reaches your card.</p></article>
        </div>
      </section>

      <footer className="shell"><a className="brand" href="#top"><span className="brand-mark"><Icon name="spark" /></span>ChargeSignal</a><p>Vana-secured · Your data, your control.</p><span>Forecasts are estimates, not billing guarantees.</span></footer>
    </main>
  );
}
