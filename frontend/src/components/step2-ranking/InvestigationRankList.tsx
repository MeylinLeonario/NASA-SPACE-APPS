import React, { useState } from "react";
import { useScenario } from "../../context/ScenarioContext";

const MOCK_RANKING = [
  {
    id: "sofie",
    rank: 1,
    score: 96,
    acronym: "SoFIE",
    years: "2022-",
    name: { en: "Solid Fuel Ignition and Extinction", es: "Ignición y Extinción de Combustibles Sólidos" },
    pillars: ["Prevención", "Supresión"],
    platform: "ISS",
    hardware: "CIR - SoFIE Insert",
    phase: "Sólido",
    quote: {
      en: "The closest PSI analog to the Exploration Atmospheres planned for lunar habitats and rovers.",
      es: "El análogo más cercano en PSI a las Atmósferas de Exploración previstas para hábitats y rovers lunares.",
    },
    objective: {
      en: "Ignition, growth and extinction limits of solids at reduced pressure and elevated O₂.",
      es: "Límites de ignición, crecimiento y extinción de sólidos a presión reducida y O₂ elevado.",
    },
    sensors: {
      en: "Color & IR video, radiometers, thermocouples",
      es: "Video color e IR, radiómetros, termopares",
    },
    metrics: [
      { label: "Coincidencia O₂", en: "Oxygen match", val: 30, total: 30 },
      { label: "Coincidencia flujo", en: "Airflow match", val: 20, total: 20 },
      { label: "Coincidencia presión", en: "Pressure match", val: 15, total: 15 },
      { label: "Coincidencia gravedad", en: "Gravity match", val: 7, total: 10 },
      { label: "Relevancia seguridad", en: "Fire-safety relevance", val: 24, total: 25 },
    ],
  },
  {
    id: "bass2",
    rank: 2,
    score: 81,
    acronym: "BASS-II",
    years: "2013-2015",
    name: { en: "Burning and Suppression of Solids II", es: "Combustión y Supresión de Sólidos II" },
    desc: { en: "Cubre tu flujo - probó PMMA - brecha: O₂ 9.0 pts, presión 4.5 psi", es: "Cubre tu flujo - probó PMMA - brecha: O₂ 9.0 pts, presión 4.5 psi" }
  },
  {
    id: "bass",
    rank: 3,
    score: 81,
    acronym: "BASS",
    years: "2011-2012",
    name: { en: "Burning and Suppression of Solids", es: "Combustión y Supresión de Sólidos" },
    desc: { en: "Cubre tu flujo - probó PMMA - brecha: O₂ 9.0 pts, presión 4.5 psi", es: "Cubre tu flujo - probó PMMA - brecha: O₂ 9.0 pts, presión 4.5 psi" }
  },
  {
    id: "flex",
    rank: 4,
    score: 80,
    acronym: "FLEX",
    years: "2009-2012",
    name: { en: "Flame Extinguishment Experiment", es: "Experimento de Extinción de Llamas" },
    desc: { en: "Cubre tu O₂, presión - brecha: flujo 10.0 cm/s, gravedad 0.17 g", es: "Cubre tu O₂, presión - brecha: flujo 10.0 cm/s, gravedad 0.17 g" }
  },
  {
    id: "flex2",
    rank: 5,
    score: 78,
    acronym: "FLEX-2",
    years: "2012-2016",
    name: { en: "Flame Extinguishment Experiment 2", es: "Experimento de Extinción de Llamas 2" },
    desc: { en: "Cubre tu O₂, presión - brecha: flujo 10.0 cm/s, gravedad 0.17 g", es: "Cubre tu O₂, presión - brecha: flujo 10.0 cm/s, gravedad 0.17 g" }
  },
];

export const InvestigationRankList: React.FC = () => {
  const { lang } = useScenario();
  const [expandedId, setExpandedId] = useState<string>("sofie");

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">
            {lang === "en" ? "Most useful NASA Investigations" : "Investigaciones NASA más útiles"}
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {lang === "en"
              ? "Ranked 1-15 for your conditions. Select one to see its runs."
              : "Ordenadas del 1 al 15 para tus condiciones. Elige una para ver sus corridas."}
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white">
          <span className="text-[10px]">ℹ️</span> {lang === "en" ? "How scoring works" : "Cómo se calcula"}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-slate-800/90 bg-[#081022] p-1 text-[11px]">
          <button className="rounded-full bg-slate-700/80 px-3 py-1 font-semibold text-white">
            {lang === "en" ? "All pillars" : "Todos"}
          </button>
          <button className="px-3 py-1 font-medium text-slate-400 hover:text-slate-200">
            🛡️ {lang === "en" ? "Prevention" : "Prevención"}
          </button>
          <button className="px-3 py-1 font-medium text-slate-400 hover:text-slate-200">
            📡 {lang === "en" ? "Detection" : "Detección"}
          </button>
          <button className="px-3 py-1 font-medium text-slate-400 hover:text-slate-200">
            🧯 {lang === "en" ? "Suppression" : "Supresión"}
          </button>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>{lang === "en" ? "Fuel type" : "Combustible"}</span>
          <select className="rounded-md border border-slate-700 bg-[#0A1224] px-2 py-1 font-medium text-white outline-none">
            <option>{lang === "en" ? "All fuels" : "Todos"}</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        {MOCK_RANKING.map((item) => {
          const isExpanded = expandedId === item.id;

          if (!isExpanded) {
            return (
              <button
                key={item.id}
                onClick={() => setExpandedId(item.id)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-[#0A1224] p-3.5 text-left transition hover:border-slate-600 hover:bg-[#0C1529]"
              >
                <div className="flex items-center gap-3.5">
                  <span className="font-mono text-base font-bold text-white">{item.rank}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.acronym}</span>
                      <span className="font-mono text-[9px] text-slate-500">{item.years}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-300">{item.name[lang]}</p>
                    <p className="mt-1 text-[9px] text-slate-500">{item.desc?.[lang]}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-xl font-bold text-white">{item.score}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[8px] font-medium tracking-widest text-slate-400">
                    👁️ VR
                  </span>
                </div>
              </button>
            );
          }

          // Expanded Card
          return (
            <div
              key={item.id}
              className="rounded-xl border border-[#38BDF8]/60 bg-[#0A1224] p-4 shadow-[0_0_20px_rgba(56,189,248,0.1)] transition-all"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="font-mono text-base font-bold text-white">{item.rank}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.acronym}</span>
                      <span className="font-mono text-[9px] text-slate-500">{item.years}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-300">{item.name[lang]}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-2xl font-bold text-white">{item.score}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[8px] font-medium tracking-widest text-slate-400">
                    👁️ VR
                  </span>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-1.5 font-mono text-[9px]">
                {item.pillars?.map((p, i) => (
                  <span key={i} className="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-slate-300">
                    🛡️ {p}
                  </span>
                ))}
                <span className="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-slate-300">
                  {item.hardware}
                </span>
                <span className="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-slate-300">
                  {item.platform}
                </span>
                <span className="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-slate-300">
                  {item.phase}
                </span>
              </div>

              <blockquote className="mb-4 border-l-2 border-[#38BDF8] pl-3 text-[11px] font-medium italic leading-relaxed text-sky-100">
                "{item.quote?.[lang]}"
              </blockquote>

              <div className="mb-4 space-y-1.5 text-[10px] leading-relaxed text-slate-300">
                <p>
                  <strong className="text-white">{lang === "en" ? "Objective:" : "Objetivo:"}</strong> {item.objective?.[lang]}
                </p>
                <p>
                  <strong className="text-white">{lang === "en" ? "Sensors:" : "Sensores:"}</strong> {item.sensors?.[lang]}
                </p>
              </div>

              <div className="mb-5 border-t border-slate-800/80 pt-3">
                <span className="mb-2 block font-mono text-[8px] font-bold uppercase tracking-widest text-slate-400">
                  {lang === "en" ? "WHY IT RANKS HERE" : "POR QUÉ ESTÁ AQUÍ"}
                </span>
                <div className="space-y-2">
                  {item.metrics?.map((m, i) => {
                    const pct = (m.val / m.total) * 100;
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 text-[10px]">
                        <span className="w-32 text-slate-300 truncate">{lang === "en" ? m.en : m.label}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#11244A]">
                          <div
                            className="h-full rounded-full bg-[#38BDF8]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono font-bold text-white">
                          {m.val}/{m.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#38BDF8]/40 bg-[#11244A]/50 py-2 text-[10px] font-bold text-white hover:bg-[#11244A] transition">
                  📈 {lang === "en" ? "Show on danger map" : "Ver en mapa de peligro"}
                </button>
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 py-2 text-[10px] font-bold text-white hover:bg-slate-700 transition">
                  🗂️ {lang === "en" ? "What changed between tests" : "Qué cambió entre sus pruebas"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};