// frontend/components/layout/scenario-ribbon.tsx
'use client';

import React from 'react';
import { AlertTriangle, Flame, SlidersHorizontal } from 'lucide-react';
import { HabitatPreset, ViewStep } from '../../models/flare.model';

interface ScenarioRibbonProps {
  habitat: HabitatPreset;
  activeStep: ViewStep;
  onEditScenario: () => void;
}

export default function ScenarioRibbon({
  habitat,
  activeStep,
  onEditScenario,
}: ScenarioRibbonProps) {
  const pmma = habitat.materials.pmma;

  return (
    <div className="border-b border-slate-800/70 bg-[#090e1a]/90 px-4 py-2 text-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 sm:px-2 lg:px-4">
        {/* Lectura de condiciones atmosféricas activas */}
        <div className="flex flex-wrap items-center gap-2 text-slate-300">
          <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
          <strong className="font-semibold text-white">{habitat.name}</strong>
          <span className="font-mono text-[11px] text-slate-400">
            {habitat.o2Pct.toFixed(1)}% O₂ · {habitat.pressurePsi.toFixed(1)} psi ·{' '}
            {habitat.airflowCms.toFixed(1)} cm/s · {habitat.gravityG.toFixed(2)} g
          </span>
          {activeStep !== 'scenario' && (
            <button
              type="button"
              onClick={onEditScenario}
              className="ml-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-sky-400 hover:bg-sky-500/10"
            >
              <SlidersHorizontal className="h-3 w-3" />
              Editar
            </button>
          )}
        </div>

        {/* Píldoras semánticas de riesgo (con ícono + texto según guía WCAG de la NASA) */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 ${
              pmma.burnsInScenario
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            <Flame className="h-3 w-3" />
            PMMA: {pmma.burnsInScenario ? `Arde +${pmma.marginPts.toFixed(1)} pts` : 'Seguro'}
          </span>

          {habitat.earthTestGapPts > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              Prueba terrestre optimista por {habitat.earthTestGapPts.toFixed(1)} pts
            </span>
          )}

          <span className="hidden lg:inline-flex items-center rounded-full border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-slate-300">
            O₂ {habitat.o2VsEarthPct >= 0 ? `+${habitat.o2VsEarthPct}%` : `${habitat.o2VsEarthPct}%`} vs Tierra
          </span>

          <span className="hidden sm:inline-flex items-center rounded-full border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-slate-300">
            {habitat.matchingInvestigations}/{habitat.totalInvestigations} muy afines
          </span>
        </div>
      </div>
    </div>
  );
}