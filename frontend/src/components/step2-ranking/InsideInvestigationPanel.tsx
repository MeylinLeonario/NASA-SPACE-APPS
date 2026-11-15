import React, { useRef } from "react";
import { Lock, SlidersHorizontal, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { useScenario } from "../../context/ScenarioContext";

const MicrogravityFlame = () => (
  <div className="relative mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#050A15] border border-slate-700/50 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#2563EB" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#050A15" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="45" r="30" fill="url(#blueGlow)" />
      <circle cx="50" cy="45" r="7" fill="#E0F2FE" />
      <rect x="48" y="55" width="4" height="20" fill="#475569" rx="1.5" />
    </svg>
  </div>
);

const RUNS_MOCK = [
  { id: 1, psi: "8.2 psi", mat: "GEL", env: "rover-like", status: "Siguió ardiendo", speed: "1.49 mm/s" },
  { id: 2, psi: "8.2 psi", mat: "Fabric", env: "rover-like", status: "Siguió ardiendo", speed: "6.69 mm/s" },
  { id: 3, psi: "10.2 psi", mat: "GEL", env: "lunar-like", status: "Siguió ardiendo", speed: "1.24 mm/s" },
  { id: 4, psi: "10.2 psi", mat: "Fabric", env: "lunar-like", status: "Siguió ardiendo", speed: "0.57 mm/s" },
  { id: 5, psi: "10.2 psi", mat: "Fabric", env: "Mars-like", status: "Siguió ardiendo", speed: "0.87 mm/s" },
  { id: 6, psi: "14.7 psi", mat: "Thin sheet", env: "ISS-like", status: "Siguió ardiendo", speed: "2.10 mm/s" },
];

export const InsideInvestigationPanel: React.FC = () => {
  const { lang } = useScenario();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      {/* Cabecera */}
      <h3 className="mb-1 text-lg font-bold text-white">
        {lang === "en" ? "What changed between runs and how the fire responded" : "Qué cambió entre pruebas y cómo respondió el fuego"}
      </h3>
      <p className="mb-5 text-[11px] text-slate-400">
        {lang === "en"
          ? "Variables are separated automatically: what didn't change are fixed conditions; what changed is what the crew iterated."
          : "Las variables se separan automáticamente: lo que no cambió son condiciones fijas; lo que cambió es lo que la tripulación iteró."}
      </p>

      {/* Selector e Info Box */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <label className="text-[11px] font-medium text-slate-400">
            {lang === "en" ? "Investigation" : "Investigación"}
          </label>
          <div className="relative w-48">
            <select className="w-full appearance-none rounded-lg border border-slate-700 bg-[#0A1224] px-3 py-1.5 text-xs font-bold text-white outline-none cursor-pointer pr-8 shadow-sm">
              <option>#1 - SoFIE</option>
              <option>#2 - BASS-II</option>
              <option>#3 - BASS</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-[11px] leading-relaxed text-white shadow-inner">
          <strong className="font-bold">SoFIE</strong> - 6 {lang === "en" ? "curated runs" : "corridas curadas"}.{" "}
          {lang === "en" ? "Main iterated variable:" : "Variable principal iterada:"} <strong className="font-bold">Presión</strong>{" "}
          <span className="font-mono text-slate-400">(8.2 psi → 10.2 psi → 14.7 psi)</span>.{" "}
          <strong className="font-bold">6</strong> {lang === "en" ? "kept burning" : "siguieron ardiendo"}, <strong className="font-bold">0</strong> {lang === "en" ? "self-extinguished" : "se autoextinguieron"}.
        </div>
      </div>

      {/* Tres Columnas: Fijo, Iterado, Respuesta */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Col 1: Se mantuvo fijo */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-[#08101E] p-4 shadow-sm">
          <div className="mb-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-white">
              <Lock size={16} className="text-slate-400" /> {lang === "en" ? "Kept fixed" : "Se mantuvo fijo"}
            </h4>
            <span className="text-[10px] text-slate-500">{lang === "en" ? "Controlled conditions" : "Condiciones controladas"}</span>
          </div>
          <div className="flex flex-col gap-3 font-mono text-[10px]">
            <div className="flex justify-between border-b border-slate-800/50 pb-2">
              <span className="text-slate-400">{lang === "en" ? "Gravity" : "Gravedad"}</span>
              <strong className="text-white">0.00 g</strong>
            </div>
            <div className="flex justify-between border-b border-slate-800/50 pb-2">
              <span className="text-slate-400">{lang === "en" ? "Diluent / suppressant" : "Diluyente / supresor"}</span>
              <strong className="text-white">N₂</strong>
            </div>
          </div>
        </div>

        {/* Col 2: Se iteró (Destacado) */}
        <div className="flex flex-col rounded-xl border border-[#38BDF8]/40 bg-[#0F1C36]/30 p-4 shadow-[0_0_15px_rgba(56,189,248,0.05)] relative overflow-hidden">
          <div className="mb-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-white">
              <SlidersHorizontal size={16} className="text-[#38BDF8]" /> {lang === "en" ? "Iterated" : "Se iteró"}
            </h4>
            <span className="text-[10px] text-slate-500">{lang === "en" ? "What changed between runs" : "Qué cambió entre pruebas"}</span>
          </div>
          <div className="flex flex-col gap-3 font-mono text-[10px]">
            <div>
              <span className="block text-slate-400 mb-1">{lang === "en" ? "Fuel / material" : "Combustible / material"}</span>
              <strong className="block text-white leading-relaxed">Cotton-fiberglass (SIBAL) - Nomex - PMMA</strong>
            </div>
            <div>
              <span className="block text-slate-400 mb-1">{lang === "en" ? "Sample geometry" : "Geometría de muestra"}</span>
              <strong className="block text-white leading-relaxed">Fabric - Thick sheet - Thin sheet</strong>
            </div>
            <div>
              <span className="block text-slate-400 mb-1">{lang === "en" ? "Oxygen" : "Oxígeno"}</span>
              <strong className="block text-white leading-relaxed">21 % O₂ - 26.5 % O₂ - 30 % O₂ - 34 % O₂</strong>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-400">{lang === "en" ? "Pressure" : "Presión"}</span>
                <span className="rounded bg-[#38BDF8] px-1.5 py-0.5 text-[8px] font-extrabold text-[#050A15]">{lang === "en" ? "PRIMARY" : "PRINCIPAL"}</span>
              </div>
              <strong className="block text-white leading-relaxed">8.2 psi - 10.2 psi - 14.7 psi</strong>
            </div>
            <div>
              <span className="block text-slate-400 mb-1">{lang === "en" ? "Airflow" : "Flujo de aire"}</span>
              <strong className="block text-white leading-relaxed">5 cm/s - 8 cm/s - 10 cm/s - 15 cm/s</strong>
            </div>
          </div>
        </div>

        {/* Col 3: Respuesta del fuego */}
        <div className="flex flex-col rounded-xl border border-slate-800 bg-[#08101E] p-4 shadow-sm">
          <div className="mb-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-white">
              <Activity size={16} className="text-slate-400" /> {lang === "en" ? "Fire's response" : "Respuesta del fuego"}
            </h4>
            <span className="text-[10px] text-slate-500">{lang === "en" ? "What the sensors measured" : "Qué midieron los sensores"}</span>
          </div>
          <div className="flex flex-col gap-3 font-mono text-[10px]">
            <div className="flex justify-between border-b border-slate-800/50 pb-2">
              <span className="text-slate-400">{lang === "en" ? "Spread rate" : "Propagación"}</span>
              <strong className="text-white">0.07 - 6.69 mm/s</strong>
            </div>
            <div className="flex justify-between border-b border-slate-800/50 pb-2">
              <span className="text-slate-400">{lang === "en" ? "Kept burning" : "Siguió ardiendo"}</span>
              <strong className="text-white">6/6</strong>
            </div>
            <div>
              <span className="block text-slate-400 mb-1">{lang === "en" ? "Sensors" : "Sensores"}</span>
              <span className="block text-slate-400 leading-relaxed font-sans text-[11px]">Video color e IR, radiómetros, termopares</span>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel: Corrida por corrida */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h4 className="text-sm font-bold text-white">{lang === "en" ? "Run by run" : "Corrida por corrida"}</h4>
          <span className="text-[11px] text-slate-500">{lang === "en" ? "ordered by pressure →" : "ordenado por presión →"}</span>
        </div>

        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {RUNS_MOCK.map((run) => (
              <div 
                key={run.id}
                className="flex min-w-[140px] snap-start flex-col items-center rounded-xl border border-slate-800 bg-[#091122] p-4 text-center transition-colors hover:bg-[#0B152A]"
              >
                <div className="w-full text-left font-mono text-[9px] font-bold text-slate-500 mb-2">
                  #{run.id}
                </div>
                <MicrogravityFlame />
                <strong className="mt-1 font-mono text-base font-extrabold text-white">{run.psi}</strong>
                <span className="font-mono text-[9px] text-slate-400 mb-3">{run.mat} - {run.env}</span>
                <span className="rounded bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 text-[9px] font-bold text-rose-300 mb-2 shadow-sm">
                  {run.status}
                </span>
                <span className="font-mono text-[10px] font-semibold text-slate-500">{run.speed}</span>
              </div>
            ))}
          </div>

          {/* Custom Scroll Buttons */}
          <div className="mt-1 flex items-center gap-2 px-2">
            <button 
              onClick={() => scroll("left")}
              className="rounded p-1 text-slate-500 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="h-1 flex-1 rounded-full bg-slate-800/80 overflow-hidden">
                {/* Decorative scroll track */}
                <div className="h-full w-1/3 rounded-full bg-slate-700/80"></div>
            </div>
            <button 
              onClick={() => scroll("right")}
              className="rounded p-1 text-slate-500 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
