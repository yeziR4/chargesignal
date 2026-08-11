"use client";

import { useMemo, useState } from "react";
import { useDirectVanaConnect } from "@opendatalabs/vana-sdk/react";
import { demoPassport, type ContextPassportResult } from "@/lib/context-passport";
import type { AiSource } from "@/lib/vana";

function jsonFetch(path: string, init?: RequestInit) {
  return fetch(path, init).then(async (response) => {
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `${response.status} from ${path}`);
    return payload;
  });
}

function Icon({ name }: { name: "spark" | "shield" | "brain" | "message" | "layers" | "arrow" | "check" }) {
  const paths = {
    spark: <><path d="M12 2l1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
    shield: <path d="M12 3 5 6v5c0 4.4 2.9 8.5 7 10 4.1-1.5 7-5.6 7-10V6l-7-3Zm-3 9 2 2 4-4"/>,
    brain: <><path d="M9.5 4.5A3 3 0 0 0 4 6.2a3.2 3.2 0 0 0 .7 6.1A3.5 3.5 0 0 0 9 18.5"/><path d="M14.5 4.5A3 3 0 0 1 20 6.2a3.2 3.2 0 0 1-.7 6.1 3.5 3.5 0 0 1-4.3 6.2M12 3v18M8 9h4M12 14h4"/></>,
    message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 9h8M8 13h5"/></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
    arrow: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const sourceDetails: Record<AiSource, { name: string; mark: string; description: string; note: string }> = {
  chatgpt: { name: "ChatGPT", mark: "◎", description: "Conversations + memories", note: "Best place to start" },
  claude: { name: "Claude", mark: "C", description: "Conversations + projects", note: "Optional second perspective" },
  youtube: { name: "YouTube", mark: "YT", description: "Watch history + interests", note: "Taste & discovery" },
};

function SourceConnector({ source, connected, onResult }: {
  source: AiSource;
  connected: boolean;
  onResult: (result: ContextPassportResult) => void;
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
      const result = await jsonFetch(`/api/vana/data?source=${source}&requestId=${encodeURIComponent(requestId)}`) as ContextPassportResult;
      onResult(result);
      return result;
    },
    pollIntervalMs: 1800,
    timeoutMs: 300_000,
  });
  const busy = !["idle", "error", "done"].includes(connect.state.type);
  const label = connected || connect.state.type === "done" ? "Added"
    : connect.state.type === "error" ? "Try again"
      : busy ? "Waiting…"
        : source === "chatgpt" ? "Start with ChatGPT" : `Add ${detail.name}`;

  return <div className={`source-row ${connected ? "connected" : ""}`}>
    <span className={`source-mark ${source}`}>{detail.mark}</span>
    <span className="source-copy">
      <span className="source-name"><b>{detail.name}</b><i>{detail.note}</i></span>
      <small>{detail.description}</small>
    </span>
    <button
      id={`${source}-connect-button`}
      type="button"
      onClick={() => connect.start()}
      disabled={busy || connected}
    >
      {connected ? <Icon name="check" /> : null}{label}
    </button>
    {connect.state.type === "error" ? <small className="source-error">{connect.state.error.message}</small> : null}
  </div>;
}

function mergePassports(results: Partial<Record<AiSource, ContextPassportResult>>) {
  const live = Object.values(results).filter((result): result is ContextPassportResult => Boolean(result));
  if (!live.length) return demoPassport;
  if (live.length === 1) return live[0];

  const weight = (result: ContextPassportResult) => Math.max(result.userMessageCount, 1);
  const totalWeight = live.reduce((sum, result) => sum + weight(result), 0);
  const weighted = (get: (result: ContextPassportResult) => number) =>
    Math.round(live.reduce((sum, result) => sum + get(result) * weight(result), 0) / totalWeight);
  const themes = new Map<string, number[]>();
  live.forEach((result) => result.focusAreas.forEach((area) => {
    themes.set(area.name, [...(themes.get(area.name) ?? []), area.score]);
  }));
  const focusAreas = [...themes].map(([name, scores]) => ({
    name,
    score: Math.round(scores.reduce((sum, score) => sum + score, 0) / live.length),
  })).sort((a, b) => b.score - a.score).slice(0, 5);
  const strongest = [...live].sort((a, b) => b.signalStrength - a.signalStrength)[0];

  return {
    ...strongest,
    conversationCount: live.reduce((sum, result) => sum + result.conversationCount, 0),
    userMessageCount: live.reduce((sum, result) => sum + result.userMessageCount, 0),
    contextItemCount: live.reduce((sum, result) => sum + result.contextItemCount, 0),
    wordCount: live.reduce((sum, result) => sum + result.wordCount, 0),
    signalStrength: Math.min(99, weighted((result) => result.signalStrength) + 5),
    focusAreas,
    behaviorSignals: {
      depth: weighted((result) => result.behaviorSignals.depth),
      actionOrientation: weighted((result) => result.behaviorSignals.actionOrientation),
      curiosity: weighted((result) => result.behaviorSignals.curiosity),
      iteration: weighted((result) => result.behaviorSignals.iteration),
    },
    collaborationGuide: [...new Set(live.flatMap((result) => result.collaborationGuide))].slice(0, 4),
  };
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function ContextPassportApp() {
  const [results, setResults] = useState<Partial<Record<AiSource, ContextPassportResult>>>({});
  const passport = useMemo(() => mergePassports(results), [results]);
  const connectedSources = Object.keys(results).length;
  const dataMode = connectedSources ? "vana" : "demo";
  const hasYoutube = Boolean(results.youtube);
  const youtubeOnly = connectedSources === 1 && Boolean(results.youtube);
  const saveResult = (result: ContextPassportResult) => setResults((current) => ({ ...current, [result.source]: result }));
  const signals = youtubeOnly ? [
    ["Exploration depth", passport.behaviorSignals.depth],
    ["Active interest", passport.behaviorSignals.actionOrientation],
    ["Channel variety", passport.behaviorSignals.curiosity],
    ["Curation", passport.behaviorSignals.iteration],
  ] as const : [
    ["Context depth", passport.behaviorSignals.depth],
    ["Action bias", passport.behaviorSignals.actionOrientation],
    ["Curiosity", passport.behaviorSignals.curiosity],
    [hasYoutube ? "Curation & iteration" : "Iteration", passport.behaviorSignals.iteration],
  ] as const;

  return <main>
    <nav className="nav shell">
      <a className="brand" href="#top" aria-label="Context Passport home"><span className="brand-mark"><Icon name="spark" /></span>Context Passport</a>
      <div className="nav-meta"><span><Icon name="shield" />Private by design</span><span className="nav-badge">Powered by Vana</span></div>
    </nav>

    <section id="top" className="hero shell">
      <div className="lamp lamp-left" aria-hidden="true"><i></i></div>
      <div className="lamp lamp-right" aria-hidden="true"><i></i></div>
      <div className="hero-copy">
        <div className="eyebrow"><span></span> Your portable digital context</div>
        <h1>Your history<br /><em>already knows you.</em></h1>
        <p>Turn the history you choose from ChatGPT, Claude, and YouTube into a private, portable guide to your interests, goals, and best ways to collaborate.</p>
        <div className="hero-actions">
          <button
            className="primary"
            type="button"
            onClick={() => document.getElementById("connect")?.scrollIntoView({ behavior: "smooth", block: "center" })}
          >
            <Icon name="spark" />Build my passport<Icon name="arrow" />
          </button>
          <a className="text-button" href="#passport-title">Explore demo</a>
        </div>
        <div className="trust-row"><span><Icon name="check" />One Vana approval flow</span><span><Icon name="check" />No raw history in your browser</span><span><Icon name="check" />Revoke anytime</span></div>
      </div>

      <div className="signal-card source-card" id="connect" aria-label="Connect your history">
        <div className="signal-top"><span>Your context sources</span><span className="live-dot">{connectedSources}/3 live</span></div>
        <div className="connect-heading"><span className="receipt-ribbon"><Icon name="shield" /> Vana-secured</span><h2>Choose your history</h2><p>Use AI conversations, YouTube interests, or combine them for a richer passport.</p></div>
        <div className="source-list">
          {(["chatgpt", "youtube", "claude"] as AiSource[]).map((source) =>
            <SourceConnector key={source} source={source} connected={Boolean(results[source])} onResult={saveResult} />,
          )}
        </div>
        <small className="connect-footnote">You approve the datasets through Vana. Context Passport receives temporary access, analyzes them on the backend, and sends only the derived profile to this page.</small>
      </div>
    </section>

    <section className="dashboard shell" aria-labelledby="passport-title">
      <div className="section-heading">
        <div><span className="kicker">Your collaboration manual</span><h2 id="passport-title">Context Passport</h2></div>
        <span className={`mode-pill ${dataMode}`}><i></i>{dataMode === "demo" ? "Demo passport" : `${connectedSources} source${connectedSources === 1 ? "" : "s"} live`}</span>
      </div>

      <div className="passport-hero">
        <div>
          <span className="passport-label">Your context archetype</span>
          <h3>{passport.archetype}</h3>
          <p>{connectedSources ? "Built from the history you approved through Vana." : "A preview of the profile your history can create."}</p>
          <div className="source-badges">
            {(connectedSources ? Object.keys(results) as AiSource[] : ["chatgpt", "youtube", "claude"]).map((source) =>
              <span key={source}>{sourceDetails[source].name}{!connectedSources ? " preview" : ""}</span>,
            )}
          </div>
        </div>
        <div className="passport-score"><strong>{passport.signalStrength}</strong><span>/100</span><small>signal strength</small></div>
      </div>

      <div className="stats-grid">
        <article className="stat"><div className="stat-icon mint"><Icon name="message" /></div><div><span>{youtubeOnly ? "Videos mapped" : hasYoutube ? "History items" : "Conversations"}</span><strong>{compactNumber(passport.conversationCount)}</strong><small>{youtubeOnly ? "watch signals understood" : hasYoutube ? "threads & videos understood" : "threads understood"}</small></div></article>
        <article className="stat"><div className="stat-icon peach"><Icon name="brain" /></div><div><span>{youtubeOnly ? "Taste signals" : hasYoutube ? "Preference signals" : "Your messages"}</span><strong>{compactNumber(passport.userMessageCount)}</strong><small>{youtubeOnly ? "likes, follows & playlists" : hasYoutube ? "messages, likes & follows" : "signals analyzed"}</small></div></article>
        <article className="stat"><div className="stat-icon yellow"><Icon name="layers" /></div><div><span>Context volume</span><strong>{compactNumber(passport.wordCount)}</strong><small>words mapped</small></div></article>
      </div>

      <div className="passport-grid">
        <section className="panel profile-panel">
          <div className="panel-head"><div><span>What you return to</span><h3>Focus areas</h3></div><span className="count">{passport.focusAreas.length} themes</span></div>
          <div className="theme-list">
            {passport.focusAreas.map((area, index) => <div className="theme-row" key={area.name}>
              <span className="theme-rank">0{index + 1}</span>
              <div><b>{area.name}</b><span><i style={{ width: `${area.score}%` }} /></span></div>
              <strong>{area.score}</strong>
            </div>)}
          </div>
        </section>

        <aside className="panel behavior-panel">
          <span className="kicker">How you operate</span>
          <h3>Behavior signals</h3>
          <div className="behavior-list">
            {signals.map(([label, value]) => <div key={label}><span><b>{label}</b><em>{value}</em></span><i><b style={{ width: `${value}%` }} /></i></div>)}
          </div>
          <small>Signals describe patterns in the history you approved—not fixed personality traits.</small>
        </aside>
      </div>

      <section className="guide-panel">
        <div className="guide-intro"><span className="insight-icon"><Icon name="spark" /></span><span className="kicker">Take this anywhere</span><h3>How to work with me</h3><p>Paste this guide into a new AI tool, project brief, or collaborator handoff.</p></div>
        <ol>{passport.collaborationGuide.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
      </section>
    </section>

    <section className="how shell">
      <span className="kicker">How it works</span><h2>History becomes useful context.</h2>
      <div className="steps">
        <article><span>01</span><div className="step-icon"><Icon name="shield" /></div><h3>Approve with Vana</h3><p>Choose ChatGPT, Claude, or YouTube data through a user-controlled Vana flow.</p></article>
        <article><span>02</span><div className="step-icon"><Icon name="brain" /></div><h3>Map your patterns</h3><p>Private backend analysis finds recurring goals, interests, and collaboration preferences.</p></article>
        <article><span>03</span><div className="step-icon"><Icon name="layers" /></div><h3>Carry context forward</h3><p>Get a clean personal guide you can use with any AI or human collaborator.</p></article>
      </div>
    </section>

    <footer className="shell"><a className="brand" href="#top"><span className="brand-mark"><Icon name="spark" /></span>Context Passport</a><p>Vana-secured · Your data, your control.</p><span>Patterns are informative, not psychological assessments.</span></footer>
  </main>;
}
