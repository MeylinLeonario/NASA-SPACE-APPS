// frontend/components/layout/copilot-drawer.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, BookOpen, ExternalLink, Loader2, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import { HabitatPreset } from '../../models/flare.model';

interface CopilotDrawerProps {
  open: boolean;
  onClose: () => void;
  activeHabitat: HabitatPreset;
}

// Response of the backend RAG (POST /api/chat): papers + PSI catalog, citations validated server-side.
type Citation = { id: string; title: string; source_file: string; page: number; text: string; url: string };
type ChatAnswer = {
  answer: string;
  executive_summary?: string | null;
  physical_alert?: string | null;
  citations: Citation[];
  limitations: string[];
  conflicts: string[];
  mode: string;
  insufficient_evidence: boolean;
};

export default function CopilotDrawer({ open, onClose, activeHabitat }: CopilotDrawerProps) {
  const [input, setInput] = useState('');
  const [asked, setAsked] = useState('');
  const [answer, setAnswer] = useState<ChatAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setAsked(question);
    setInput('');
    setAnswer(null);
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question, limit: 5, filters: {}, language: 'auto' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message || data?.detail || `Error del servidor (${res.status})`);
      }
      setAnswer(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar el copiloto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <aside
        role="dialog"
        aria-label="Copiloto Científico SI"
        className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-[#0b1120] text-slate-100 shadow-2xl"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/15 text-sky-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">Copilot Científico SI</h2>
              <p className="text-[11px] text-slate-400">Cada respuesta cita papers y fichas de NASA PSI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Copilot"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contexto del escenario */}
        <div className="border-b border-slate-800/80 bg-[#0f172a] px-5 py-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400">
            ⚡ SI-Generated Interpretation · Grounded in PSI
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Escenario: <strong className="text-white">{activeHabitat.name}</strong> (
            <span className="font-mono text-[11px]">
              {activeHabitat.o2Pct}% O₂ · {activeHabitat.pressurePsi} psi · {activeHabitat.airflowCms} cm/s ·{' '}
              {activeHabitat.gravityG} g
            </span>
            )
          </p>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
          {!asked && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-slate-300">
              <p className="font-medium text-white">Pregunta sobre seguridad contra incendios en microgravedad.</p>
              <p className="mt-1.5 leading-relaxed text-slate-400">
                Busco en los papers del equipo y en el catálogo de investigaciones PSI, y respondo solo con lo que
                encuentro: resumen ejecutivo, síntesis, alerta física y citas verificables. Si no hay evidencia, lo digo.
              </p>
            </div>
          )}

          {asked && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">PREGUNTA ACTIVA</span>
              <p className="mt-1 text-sm font-medium text-white">{asked}</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando evidencia y redactando…
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-200">{error}</div>
          )}

          {answer && (
            <div className="space-y-3 rounded-xl border border-slate-800/90 bg-[#0e1628] p-4">
              {answer.executive_summary && (
                <div className="rounded-lg border border-sky-400/50 bg-sky-500/15 p-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                    Resumen ejecutivo
                  </span>
                  <p className="mt-1 text-[13px] leading-relaxed text-white">{answer.executive_summary}</p>
                </div>
              )}

              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                  {answer.mode === 'evidence_only' ? 'Evidencia encontrada' : '1. Síntesis basada en evidencia'}
                </span>
                <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-slate-200">{answer.answer}</p>
              </div>

              {answer.physical_alert && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>2. Alerta de física contraintuitiva</span>
                  </div>
                  <p className="mt-1 leading-relaxed text-amber-100/90">{answer.physical_alert}</p>
                </div>
              )}

              {answer.citations.length > 0 && (
                <div className="pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    CITAS TRAZABLES
                  </span>
                  <div className="mt-2 space-y-2">
                    {answer.citations.map((cit, i) => (
                      <details key={cit.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
                        <summary className="flex cursor-pointer items-start gap-2.5">
                          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                          <span>
                            <span className="font-mono text-[11px] font-semibold text-sky-300">[{i + 1}]</span>{' '}
                            <strong className="text-slate-200">{cit.title}</strong>
                            <span className="mt-0.5 block text-[11px] text-slate-400">
                              {cit.page > 0 ? `Pág. ${cit.page} · ` : ''}
                              {cit.source_file}
                            </span>
                          </span>
                        </summary>
                        <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-sky-500/40 pl-2.5 text-[11px] leading-relaxed text-slate-300">
                          {cit.text}
                        </blockquote>
                        {cit.url && (
                          <a
                            href={cit.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[11px] text-sky-300 hover:text-sky-200"
                          >
                            Abrir fuente <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {answer.conflicts.length > 0 && (
                <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-slate-300">
                  <span className="font-semibold text-slate-200">Evidencia en conflicto</span>
                  {answer.conflicts.map((c, i) => (
                    <p key={i} className="mt-1">{c}</p>
                  ))}
                </div>
              )}

              {answer.limitations.length > 0 && (
                <details className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-slate-400">
                  <summary className="cursor-pointer font-semibold text-slate-300">
                    Limitaciones de la evidencia ({answer.limitations.length})
                  </summary>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4">
                    {answer.limitations.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={ask} className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre fuego en microgravedad…"
              maxLength={2000}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Enviar consulta"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-sky-400 p-1.5 text-slate-950 transition hover:bg-sky-300 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Solo evidencia citada · se descartan afirmaciones con citas no verificables</span>
          </div>
        </form>
      </aside>
    </div>
  );
}
