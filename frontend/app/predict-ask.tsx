"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Download, Send } from "lucide-react";
import { useScenario } from "../src/context/ScenarioContext";
import OODPanel, { type InitialConditions } from "./ood/ood-panel";

type Answer = {
  answer: string;
  citations: { id: string; title: string; page: number; text: string }[];
  limitations: string[];
  conflicts: string[];
  insufficient_evidence: boolean;
};

export default function PredictAsk({
  initialConditions,
}: {
  initialConditions: InitialConditions;
}) {
  const {lang} = useScenario();
  const en = lang === "en";
  const tabLabels: Record<string, string> = {"Predict partial gravity": en ? "Estimate properties" : "Estimar propiedades", "Extract clean data": en ? "Download observations" : "Descargar observaciones", "Ask Copilot": en ? "Ask the assistant" : "Preguntar al asistente"};
  const [tab, setTab] = useState("Predict partial gravity");
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || busy) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    setAnswer(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: question.trim(),
          limit: 5,
          filters: {},
          language: "auto",
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error?.message || "Research assistant unavailable");
      if (!controller.signal.aborted) setAnswer(data);
    } catch (reason) {
      if (!controller.signal.aborted) setError((reason as Error).message);
    } finally {
      if (request.current === controller && !controller.signal.aborted)
        setBusy(false);
    }
  }

  async function downloadDataset() {
    setBusy(true);
    setError("");
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await fetch("/api/ood/dataset", {
        signal: controller.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw Error(data?.error?.message || "Observation dataset unavailable");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "combustion-observations.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      if (!controller.signal.aborted) setError((reason as Error).message);
    } finally {
      if (request.current === controller && !controller.signal.aborted)
        setBusy(false);
    }
  }

  return (
    <section className="sf-panel sf-predict" aria-label="Predict & Ask">
      <div className="sf-segments sf-view-tabs">
        {["Predict partial gravity", "Extract clean data", "Ask Copilot"].map(
          (name) => (
            <button
              key={name}
              type="button"
              aria-pressed={tab === name}
              onClick={() => {
                setTab(name);
                setError("");
              }}
            >
              {tabLabels[name]}
            </button>
          ),
        )}
      </div>
      <p className="sf-footnote">
        Predictions and evidence use the backend’s combustion-observations.json.
        Cohorts, units, review status and provenance are preserved. Experimental configurations are filtered by your scenario material.
      </p>
      <details className="sf-api-access">
        <summary>API access token (if required)</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            request.current?.abort();
            setBusy(false);
            setAnswer(null);
            setError("");
            setToken(tokenInput);
          }}
        >
          <input
            aria-label="API access token"
            type="password"
            autoComplete="off"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
          />
          <button type="submit">Apply token</button>
        </form>
      </details>
      <div hidden={tab !== "Predict partial gravity"}>
        <OODPanel token={token} initialConditions={initialConditions} />
      </div>
      {tab === "Extract clean data" && (
        <>
          <h2>Export the observation dataset</h2>
          <p>
            Download the exact dataset used by the prediction service, including
            citations, measurements, units and review flags. No scenario mock
            values are added.
          </p>
          <button
            className="sf-primary"
            disabled={busy}
            onClick={() => void downloadDataset()}
          >
            <Download size={16} />
            {busy ? "Downloading…" : "Download observations JSON"}
          </button>
        </>
      )}
      {tab === "Ask Copilot" && (
        <>
          <h2>Ask the research assistant</h2>
          <p>
            Answers come from the existing research API and include its source
            citations and limitations.
          </p>
          <form className="sf-ask" onSubmit={(event) => void ask(event)}>
            <input
              aria-label="Ask Copilot"
              placeholder="Why does gravity change flame behavior?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button
              disabled={busy || !question.trim()}
              aria-label="Send question"
            >
              <Send size={18} />
            </button>
          </form>
          {busy && <p role="status">Searching research evidence…</p>}
          {answer && (
            <div className="sf-answer" role="status">
              <p style={{ whiteSpace: "pre-wrap" }}>{answer.answer}</p>
              {answer.insufficient_evidence && (
                <p>Insufficient evidence for a complete answer.</p>
              )}
              {answer.citations.map((citation) => (
                <details key={citation.id}>
                  <summary>
                    {citation.id} · {citation.title} · p. {citation.page}
                  </summary>
                  <blockquote>{citation.text}</blockquote>
                </details>
              ))}
              {answer.limitations.length > 0 && (
                <>
                  <h3>Limitations</h3>
                  <ul>
                    {answer.limitations.map((text, index) => (
                      <li key={index}>{text}</li>
                    ))}
                  </ul>
                </>
              )}
              {answer.conflicts.length > 0 && (
                <>
                  <h3>Conflicting evidence</h3>
                  <ul>
                    {answer.conflicts.map((text, index) => (
                      <li key={index}>{text}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </>
      )}
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
