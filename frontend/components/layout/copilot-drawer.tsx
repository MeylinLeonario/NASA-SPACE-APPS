// frontend/components/layout/copilot-drawer.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, BookOpen, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import { COPILOT_PRESET_QA } from '../../data/mocks/flare.mock';
import { CopilotPresetQuestion, HabitatPreset } from '../../models/flare.model';

interface CopilotDrawerProps {
  open: boolean;
  onClose: () => void;
  activeHabitat: HabitatPreset;
}

export default function CopilotDrawer({
  open,
  onClose,
  activeHabitat,
}: CopilotDrawerProps) {
  const [selectedQa, setSelectedQa] = useState<CopilotPresetQuestion>(COPILOT_PRESET_QA[0]);
  const [customInput, setCustomInput] = useState('');

  if (!open) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const lower = customInput.toLowerCase();
    const matched =
      COPILOT_PRESET_QA.find(
        (item) =>
          (lower.includes('fría') || lower.includes('cool') || lower.includes('flex')) &&
          item.id === 'cool-flames'
      ) ||
      COPILOT_PRESET_QA.find(
        (item) =>
          (lower.includes('luna') || lower.includes('30%') || lower.includes('material')) &&
          item.id === 'lunar-30-o2'
      ) ||
      COPILOT_PRESET_QA[0];
    setSelectedQa(matched);
    setCustomInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <aside
        role="dialog"
        aria-label="Copiloto Científico SI"
        className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-[#0b1120] text-slate-100 shadow-2xl"
      >
        {/* Cabecera del Copiloto con sello de gobernanza SI */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">Copilot Científico SI</h2>
              <p className="text-[11px] text-slate-400">
                Cada respuesta cita evidencia verificada de NASA PSI
              </p>
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

        {/* Contexto del escenario cargado */}
        <div className="border-b border-slate-800/80 bg-[#0f172a] px-5 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-sky-400">
            <span>⚡ SI-Generated Interpretation · Grounded in PSI</span>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Contexto cargado: <strong className="text-white">{activeHabitat.name}</strong> (
            <span className="font-mono text-[11px]">
              {activeHabitat.o2Pct}% O₂ · {activeHabitat.pressurePsi} psi ·{' '}
              {activeHabitat.airflowCms} cm/s · {activeHabitat.gravityG} g
            </span>
            )
          </p>
        </div>

        {/* Cuerpo de respuesta estructurada en 3 bloques (Síntesis, Alerta Física, Citas) */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              PREGUNTA ACTIVA
            </span>
            <p className="mt-1 text-sm font-medium text-white">{selectedQa.question}</p>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800/90 bg-[#0e1628] p-4">
            <div>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                1. Síntesis Basada en Evidencia
              </span>
              <p className="mt-1.5 leading-relaxed text-slate-200">{selectedQa.synthesis}</p>
            </div>

            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>2. Alerta de Física Contraintuitiva</span>
              </div>
              <p className="mt-1 leading-relaxed text-amber-100/90">{selectedQa.physicalAlert}</p>
            </div>

            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
              <span className="font-semibold text-sky-300">
                3. Recomendación de Ingeniería (Criterios NASA)
              </span>
              <p className="mt-1 leading-relaxed text-slate-200">
                {selectedQa.engineeringRecommendation}
              </p>
            </div>

            {/* Citas verificadas */}
            <div className="pt-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                CITAS TRAZABLES DEL REPOSITORIO PSI
              </span>
              <div className="mt-2 space-y-2">
                {selectedQa.citations.map((cit) => (
                  <div
                    key={cit.code}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5"
                  >
                    <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                    <div>
                      <span className="font-mono text-[11px] font-semibold text-sky-300">
                        [{cit.code}]
                      </span>{' '}
                      <strong className="text-slate-200">{cit.title}</strong>
                      <p className="mt-0.5 text-[11px] text-slate-400">{cit.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chips de preguntas sugeridas */}
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              PREGUNTAS SUGERIDAS
            </span>
            <div className="mt-2 flex flex-col gap-2">
              {COPILOT_PRESET_QA.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedQa(item)}
                  className={`rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${
                    selectedQa.id === item.id
                      ? 'border-sky-500/60 bg-sky-500/15 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {item.question}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Formulario inferior */}
        <form onSubmit={handleCustomSubmit} className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Pregunta por qué ocurre un fenómeno en PSI..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Enviar consulta"
              className="rounded-lg bg-sky-400 p-1.5 text-slate-950 transition hover:bg-sky-300"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Modo determinista activado · Cero invención fuera del corpus PSI</span>
          </div>
        </form>
      </aside>
    </div>
  );
}