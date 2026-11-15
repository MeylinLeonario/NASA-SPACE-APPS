import React from "react";
import { useScenario } from "../../context/ScenarioContext";
import { GravityPredictorChart } from "./GravityPredictorChart";
import { CopilotChatPanel } from "./CopilotChatPanel";
import { DecisionBriefModal } from "./DecisionBriefModal";

export const Step3PredictorView: React.FC = () => {
  const { lang, setActiveStep } = useScenario();

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-6 pb-20">
      {/* Encabezado */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span className="rounded bg-[#11244A] px-1.5 py-0.5 text-sky-400 border border-sky-500/30">
            3/3
          </span>
          <span>
            {lang === "en"
              ? "STEP 3 OF 3 · PREDICT, EXTRACT OR ASK"
              : "PASO 3 DE 3 · PREDECIR, EXTRAER O PREGUNTAR"}
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {lang === "en" ? "Go beyond what's tested" : "Ve más allá de lo probado"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          {lang === "en"
            ? "Predict untested gravities, download a clean table for your models, or ask Copilot why a phenomenon occurs. Then take away a decision brief."
            : "Predice gravedades no probadas, descarga una tabla limpia para tus modelos o pregunta a Copilot por qué ocurre un fenómeno. Luego llévate un informe de decisión."}
        </p>
      </div>

      {/* Tabs visuales de modo de predicción */}
      <div className="mb-6 flex overflow-hidden rounded-xl border border-slate-700 bg-[#08101E] text-[11px] font-bold text-slate-400">
        <button className="flex flex-1 items-center justify-center gap-2 bg-[#11244A] py-3 text-white border-b-2 border-sky-400">
          📈 {lang === "en" ? "Predict partial gravity" : "Predecir gravedad parcial"}
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 hover:bg-[#0A1529] hover:text-white transition">
          🗃️ {lang === "en" ? "Extract clean data" : "Extraer datos limpios"}
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 py-3 hover:bg-[#0A1529] hover:text-white transition">
          🌍 {lang === "en" ? "Earth spinoff" : "Spinoff terrestre"}
        </button>
      </div>

      {/* Grid Principal: Chart (izq) y Copilot (der) */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
        <div className="flex-1">
          <GravityPredictorChart />
        </div>
        <CopilotChatPanel />
      </div>

      {/* Informe de Decisión */}
      <DecisionBriefModal />

      {/* Navegación Inferior */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-800/80 pt-6">
        <button
          onClick={() => setActiveStep(2)}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs font-bold text-slate-300 hover:border-slate-500 hover:text-white transition"
        >
          ← {lang === "en" ? "Back to ranking" : "Volver al ranking"}
        </button>
      </div>
    </section>
  );
};