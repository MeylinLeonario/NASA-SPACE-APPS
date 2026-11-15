import React from "react";
import { useScenario } from "../../context/ScenarioContext";
import { AlertsStrip } from "./AlertsStrip";
import { InvestigationRankList } from "./InvestigationRankList";
import { DangerMapPanel } from "./DangerMapPanel";

export const Step2RankingView: React.FC = () => {
  const { lang, activeHabitat, setActiveStep } = useScenario();

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-6">
      {/* Encabezado */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span className="rounded bg-[#11244A] px-1.5 py-0.5 text-sky-400 border border-sky-500/30">
            2/3
          </span>
          <span>
            {lang === "en"
              ? "STEP 2 OF 3 · EXPLORE THE RANKING & PHYSICAL ALERTS"
              : "PASO 2 DE 3 · EXPLORA EL RANKING Y LAS ALERTAS FÍSICAS"}
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {lang === "en" ? "Evidence for" : "Evidencia para"}{" "}
          <span className="text-[#38BDF8]">{activeHabitat.name[lang]}</span>
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {lang === "en" ? "Read first:" : "Lee primero:"}{" "}
          <strong className="text-white">SoFIE (96)</strong>, BASS-II (81), BASS (81).{" "}
          {lang === "en"
            ? "The ranking, the danger map and the alerts update live with your scenario."
            : "El ranking, el mapa de peligro y las alertas se actualizan en vivo con tu escenario."}
        </p>
      </div>

      {/* Alertas Físicas Superiores */}
      <AlertsStrip />

      {/* Grilla Principal: Ranking a la izquierda, Mapa a la derecha */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 h-[750px]">
          <InvestigationRankList />
        </div>
        <div className="lg:col-span-8 h-[750px]">
          <DangerMapPanel />
        </div>
      </div>

      {/* Navegación Inferior */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-6">
        <button
          onClick={() => setActiveStep(1)}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs font-bold text-slate-300 hover:border-slate-500 hover:text-white transition"
        >
          ← {lang === "en" ? "Change scenario" : "Cambiar escenario"}
        </button>
        <button
          onClick={() => setActiveStep(3)}
          className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-slate-950 shadow-lg hover:bg-slate-100 transition"
        >
          {lang === "en" ? "Predict, extract or ask" : "Predecir, extraer o preguntar"}{" "}
          →
        </button>
      </div>
    </section>
  );
};