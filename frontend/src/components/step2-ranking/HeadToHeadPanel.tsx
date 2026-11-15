import React, { useState } from "react";
import { useScenario } from "../../context/ScenarioContext";

// Nuestra "DB" local de investigaciones
const INVESTIGATIONS_DB = [
  {
    id: "sofie",
    acronym: "SoFIE",
    score: 100,
    pillars: "Prevención, Supresión",
    hardware: "CIR - SoFIE insert",
    platform: "ISS",
    phase: "Sólido",
    fuels: "PMMA, Nomex, algodón-fibra de vidrio",
    geometry: "Láminas delgadas y gruesas, canal angosto",
    o2_min: 14,
    o2_max: 40,
    psi_min: 7,
    psi_max: 14.7,
    flow_min: 0,
    flow_max: 25,
    grav_min: 0,
    grav_max: 0,
    sensors: "Video color e IR, radiómetros, termopares",
    agencies: "NASA",
    finding: "El análogo más cercano en PSI a las atmósferas de exploración previstas para hábitats y rovers lunares.",
  },
  {
    id: "bass2",
    acronym: "BASS-II",
    score: 48,
    pillars: "Prevención",
    hardware: "MSG - SPICE flow duct",
    platform: "ISS",
    phase: "Sólido",
    fuels: "Varillas y placas de PMMA, algodón-fibra de vidrio (SIBAL)",
    geometry: "Varillas, placas planas, esferas",
    o2_min: 15,
    o2_max: 21,
    psi_min: 14.7,
    psi_max: 14.7,
    flow_min: 0,
    flow_max: 40,
    grav_min: 0,
    grav_max: 0,
    sensors: "Dos cámaras de video, radiómetro, termopares",
    agencies: "ESA",
    finding: "Entre ~5 y 25 cm/s los materiales arden con MENOS oxígeno del que predicen las pruebas terrestres.",
  },
  {
    id: "flex",
    acronym: "FLEX",
    score: 80,
    pillars: "Supresión",
    hardware: "MDCA",
    platform: "ISS",
    phase: "Líquido",
    fuels: "Heptano, Metanol",
    geometry: "Gotas esféricas aisladas",
    o2_min: 21,
    o2_max: 30,
    psi_min: 7,
    psi_max: 14.7,
    flow_min: 0,
    flow_max: 10,
    grav_min: 0,
    grav_max: 0,
    sensors: "Radiómetros, cámaras UV, termopares",
    agencies: "NASA",
    finding: "Las gotas arden a menor temperatura y menor tasa de consumo de oxígeno que en la Tierra.",
  },
  {
    id: "saffire1",
    acronym: "Saffire-I",
    score: 65,
    pillars: "Detección, Supresión",
    hardware: "Cygnus resupply vehicle",
    platform: "Orbital ATK Cygnus",
    phase: "Sólido",
    fuels: "Tela algodón-fibra de vidrio (SIBAL)",
    geometry: "Muestras a gran escala (0.4 m x 1.0 m)",
    o2_min: 21,
    o2_max: 21,
    psi_min: 14.7,
    psi_max: 14.7,
    flow_min: 15,
    flow_max: 20,
    grav_min: 0,
    grav_max: 0,
    sensors: "HD video, termopares, sensores de radiación y O₂/CO₂",
    agencies: "NASA",
    finding: "Primera prueba a gran escala en microgravedad. El fuego se propagó en contra del flujo (flujo inverso) buscando oxígeno fresco.",
  }
];

export const HeadToHeadPanel: React.FC = () => {
  const { lang, conditions } = useScenario();

  const [selectedIdA, setSelectedIdA] = useState<string>("sofie");
  const [selectedIdB, setSelectedIdB] = useState<string>("bass2");

  const invA = INVESTIGATIONS_DB.find((inv) => inv.id === selectedIdA) || INVESTIGATIONS_DB[0];
  const invB = INVESTIGATIONS_DB.find((inv) => inv.id === selectedIdB) || INVESTIGATIONS_DB[1];

  const RangeBar = (props: { min: number; max: number; current: number; globalMin: number; globalMax: number; unit: string; labelOk: string; labelNo: string }) => {
    const { min, max, current, globalMin, globalMax, unit, labelOk, labelNo } = props;
    
    const isCovered = current >= min && current <= max;
    const leftPct = ((min - globalMin) / (globalMax - globalMin)) * 100;
    const widthPct = max === min ? 2 : ((max - min) / (globalMax - globalMin)) * 100;
    const currentPct = ((current - globalMin) / (globalMax - globalMin)) * 100;

    return (
      <div className="relative mt-3 h-1 w-full rounded-full bg-slate-800">
        <div 
          className="absolute h-full rounded-full bg-[#60A5FA]" 
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        <div 
          className="absolute h-3 w-[2px] bg-white -translate-y-1" 
          style={{ left: `${currentPct}%` }}
        />
        <div className="absolute top-2 flex w-full justify-between font-mono text-[8px] tracking-wide text-slate-500">
          <span>{min}{min !== max ? `-${max}` : ""} {unit}</span>
          <span className={`font-bold ${isCovered ? "text-emerald-500" : "text-amber-500"}`}>
            {isCovered ? labelOk : labelNo}
          </span>
        </div>
      </div>
    );
  };

  const getDiffText = (valA: string | number, valB: string | number) => {
    if (valA === valB) {
      return <div className="text-center font-bold text-emerald-400">{lang === "en" ? "Equal" : "Igual"}</div>;
    }
    return <div className="text-center font-bold text-amber-500">{lang === "en" ? "Differs" : "Difiere"}</div>;
  };

  const isO2Covered = (conditions.o2 >= invA.o2_min && conditions.o2 <= invA.o2_max) || 
                      (conditions.o2 >= invB.o2_min && conditions.o2 <= invB.o2_max);
  
  const isPsiCovered = (conditions.pressurePsi >= invA.psi_min && conditions.pressurePsi <= invA.psi_max) || 
                       (conditions.pressurePsi >= invB.psi_min && conditions.pressurePsi <= invB.psi_max);
                       
  const isFlowCovered = (conditions.airflowCms >= invA.flow_min && conditions.airflowCms <= invA.flow_max) || 
                        (conditions.airflowCms >= invB.flow_min && conditions.airflowCms <= invB.flow_max);
                        
  const isGravCovered = (conditions.gravityG >= invA.grav_min && conditions.gravityG <= invA.grav_max) || 
                        (conditions.gravityG >= invB.grav_min && conditions.gravityG <= invB.grav_max);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <h3 className="mb-5 text-lg font-bold text-white">
        {lang === "en" ? "Compare two investigations head-to-head" : "Compara dos investigaciones cara a cara"}
      </h3>

      {/* Selectores superiores dinámicos con FLECHA visible */}
      <div className="mb-6 grid grid-cols-[120px_1fr_1fr_60px] items-start gap-4">
        <div />
        
        {/* Columna Investigación A */}
        <div className="rounded-xl border border-sky-400/40 bg-[#0F1C36]/50 p-3">
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {lang === "en" ? "INVESTIGATION A" : "INVESTIGACIÓN A"}
          </label>
          <div className="relative mb-2">
            <select 
              className="w-full appearance-none bg-transparent text-sm font-bold text-white outline-none cursor-pointer pr-6"
              value={selectedIdA}
              onChange={(e) => setSelectedIdA(e.target.value)}
            >
              {INVESTIGATIONS_DB.map(inv => (
                <option key={`A-${inv.id}`} value={inv.id} className="bg-slate-900">{inv.acronym}</option>
              ))}
            </select>
            {/* Flecha personalizada */}
            <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-sky-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            {lang === "en" ? "Score" : "Puntaje"} <span className="text-white">{invA.score}</span>
          </div>
        </div>

        {/* Columna Investigación B */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3">
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {lang === "en" ? "INVESTIGATION B" : "INVESTIGACIÓN B"}
          </label>
          <div className="relative mb-2">
            <select 
              className="w-full appearance-none bg-transparent text-sm font-bold text-white outline-none cursor-pointer pr-6"
              value={selectedIdB}
              onChange={(e) => setSelectedIdB(e.target.value)}
            >
              {INVESTIGATIONS_DB.map(inv => (
                <option key={`B-${inv.id}`} value={inv.id} className="bg-slate-900">{inv.acronym}</option>
              ))}
            </select>
            {/* Flecha personalizada */}
            <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-amber-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            {lang === "en" ? "Score" : "Puntaje"} <span className="text-white">{invB.score}</span>
          </div>
        </div>

        <div />
      </div>

      {/* Filas comparativas dinámicas */}
      <div className="space-y-2 text-[11px]">
        {/* Pilar */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400">{lang === "en" ? "Safety pillar" : "Pilar de seguridad"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-slate-200">{invA.pillars}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-slate-200">{invB.pillars}</div>
          {getDiffText(invA.pillars, invB.pillars)}
        </div>

        {/* Hardware */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400">{lang === "en" ? "Hardware" : "Hardware"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-white font-bold">{invA.hardware}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-white font-bold">{invB.hardware}</div>
          {getDiffText(invA.hardware, invB.hardware)}
        </div>

        {/* Plataforma */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400">{lang === "en" ? "Platform" : "Plataforma"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-white font-bold">{invA.platform}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-white font-bold">{invB.platform}</div>
          {getDiffText(invA.platform, invB.platform)}
        </div>

        {/* Fase */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400">{lang === "en" ? "Fuel phase" : "Estado del combustible"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-slate-200">{invA.phase}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-slate-200">{invB.phase}</div>
          {getDiffText(invA.phase, invB.phase)}
        </div>

        {/* Materiales */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400 leading-snug">{lang === "en" ? "Fuels / materials" : "Combustibles / materiales"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-white font-bold">{invA.fuels}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-white font-bold">{invB.fuels}</div>
          {getDiffText(invA.fuels, invB.fuels)}
        </div>

        {/* Geometría */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400">{lang === "en" ? "Geometry" : "Geometría"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-slate-200">{invA.geometry}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-slate-200">{invB.geometry}</div>
          {getDiffText(invA.geometry, invB.geometry)}
        </div>

        {/* O2 */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4 pt-1">
          <div className="text-slate-400">{lang === "en" ? "Oxygen tested" : "Oxígeno probado"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] px-4 py-3 h-[52px]">
            <RangeBar min={invA.o2_min} max={invA.o2_max} current={conditions.o2} globalMin={0} globalMax={100} unit="%" labelOk={lang === "en" ? "covers you" : "te cubre"} labelNo={lang === "en" ? "doesn't cover" : "no te cubre"} />
          </div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] px-4 py-3 h-[52px]">
            <RangeBar min={invB.o2_min} max={invB.o2_max} current={conditions.o2} globalMin={0} globalMax={100} unit="%" labelOk={lang === "en" ? "covers you" : "te cubre"} labelNo={lang === "en" ? "doesn't cover" : "no te cubre"} />
          </div>
          {getDiffText(`${invA.o2_min}-${invA.o2_max}`, `${invB.o2_min}-${invB.o2_max}`)}
        </div>

        {/* Presion */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400">{lang === "en" ? "Pressure tested" : "Presión probada"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] px-4 py-3 h-[52px]">
            <RangeBar min={invA.psi_min} max={invA.psi_max} current={conditions.pressurePsi} globalMin={0} globalMax={18} unit="psi" labelOk={lang === "en" ? "covers you" : "te cubre"} labelNo={lang === "en" ? "doesn't cover" : "no te cubre"} />
          </div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] px-4 py-3 h-[52px]">
            <RangeBar min={invB.psi_min} max={invB.psi_max} current={conditions.pressurePsi} globalMin={0} globalMax={18} unit="psi" labelOk={lang === "en" ? "covers you" : "te cubre"} labelNo={lang === "en" ? "doesn't cover" : "no te cubre"} />
          </div>
          {getDiffText(`${invA.psi_min}-${invA.psi_max}`, `${invB.psi_min}-${invB.psi_max}`)}
        </div>

        {/* Flujo */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400">{lang === "en" ? "Airflow tested" : "Flujo probado"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] px-4 py-3 h-[52px]">
            <RangeBar min={invA.flow_min} max={invA.flow_max} current={conditions.airflowCms} globalMin={0} globalMax={40} unit="cm/s" labelOk={lang === "en" ? "covers you" : "te cubre"} labelNo={lang === "en" ? "doesn't cover" : "no te cubre"} />
          </div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] px-4 py-3 h-[52px]">
            <RangeBar min={invB.flow_min} max={invB.flow_max} current={conditions.airflowCms} globalMin={0} globalMax={40} unit="cm/s" labelOk={lang === "en" ? "covers you" : "te cubre"} labelNo={lang === "en" ? "doesn't cover" : "no te cubre"} />
          </div>
          {getDiffText(`${invA.flow_min}-${invA.flow_max}`, `${invB.flow_min}-${invB.flow_max}`)}
        </div>

        {/* Gravedad */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400">{lang === "en" ? "Gravity tested" : "Gravedad"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] px-4 py-3 h-[52px]">
            <RangeBar min={invA.grav_min} max={invA.grav_max} current={conditions.gravityG} globalMin={0} globalMax={1} unit="g" labelOk={lang === "en" ? "covers you" : "te cubre"} labelNo={lang === "en" ? "doesn't cover" : "no te cubre"} />
          </div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] px-4 py-3 h-[52px]">
            <RangeBar min={invB.grav_min} max={invB.grav_max} current={conditions.gravityG} globalMin={0} globalMax={1} unit="g" labelOk={lang === "en" ? "covers you" : "te cubre"} labelNo={lang === "en" ? "doesn't cover" : "no te cubre"} />
          </div>
          {getDiffText(`${invA.grav_min}-${invA.grav_max}`, `${invB.grav_min}-${invB.grav_max}`)}
        </div>

        {/* Sensores */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4 pt-1">
          <div className="text-slate-400">{lang === "en" ? "Sensors" : "Sensores"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-slate-200">{invA.sensors}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-slate-200">{invB.sensors}</div>
          {getDiffText(invA.sensors, invB.sensors)}
        </div>

        {/* Agencias */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400">{lang === "en" ? "Agencies" : "Agencias"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-white font-bold">{invA.agencies}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-white font-bold">{invB.agencies}</div>
          {getDiffText(invA.agencies, invB.agencies)}
        </div>

        {/* Hallazgo */}
        <div className="grid grid-cols-[120px_1fr_1fr_60px] items-center gap-4">
          <div className="text-slate-400">{lang === "en" ? "Key finding" : "Hallazgo clave"}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-slate-200">{invA.finding}</div>
          <div className="rounded-lg border border-slate-700 bg-[#0A1224] p-3 text-slate-200">{invB.finding}</div>
          {getDiffText(invA.finding, invB.finding)}
        </div>
      </div>

      {/* Resumen Final: ¿Juntas cubren tu escenario? */}
      <div className="mt-8 rounded-xl border border-slate-800 bg-[#091124] p-5">
        <h4 className="mb-4 flex items-center gap-2 text-[13px] font-bold text-white">
          <span className="text-sky-400">🔗</span> {lang === "en" ? "Do they together cover your scenario?" : "¿Juntas cubren tu escenario?"}
        </h4>
        <div className="grid grid-cols-4 gap-3 text-center font-mono text-[10px]">
          <div className={`rounded-lg py-2.5 ${isO2Covered ? 'border border-emerald-500/40 bg-emerald-950/20' : 'border border-rose-500/40 bg-rose-950/20'}`}>
            <div className="text-slate-300 mb-0.5">{lang === "en" ? "Oxygen tested" : "Oxígeno probado"}</div>
            <div className={`font-bold ${isO2Covered ? 'text-emerald-400' : 'text-rose-400'}`}>{isO2Covered ? (lang === "en" ? "Covered" : "Cubierto") : (lang === "en" ? "Gap" : "Brecha")}</div>
          </div>
          <div className={`rounded-lg py-2.5 ${isPsiCovered ? 'border border-emerald-500/40 bg-emerald-950/20' : 'border border-rose-500/40 bg-rose-950/20'}`}>
            <div className="text-slate-300 mb-0.5">{lang === "en" ? "Pressure tested" : "Presión probada"}</div>
            <div className={`font-bold ${isPsiCovered ? 'text-emerald-400' : 'text-rose-400'}`}>{isPsiCovered ? (lang === "en" ? "Covered" : "Cubierto") : (lang === "en" ? "Gap" : "Brecha")}</div>
          </div>
          <div className={`rounded-lg py-2.5 ${isFlowCovered ? 'border border-emerald-500/40 bg-emerald-950/20' : 'border border-rose-500/40 bg-rose-950/20'}`}>
            <div className="text-slate-300 mb-0.5">{lang === "en" ? "Airflow tested" : "Flujo probado"}</div>
            <div className={`font-bold ${isFlowCovered ? 'text-emerald-400' : 'text-rose-400'}`}>{isFlowCovered ? (lang === "en" ? "Covered" : "Cubierto") : (lang === "en" ? "Gap" : "Brecha")}</div>
          </div>
          <div className={`rounded-lg py-2.5 ${isGravCovered ? 'border border-emerald-500/40 bg-emerald-950/20' : 'border border-rose-500/40 bg-rose-950/20'}`}>
            <div className="text-slate-300 mb-0.5">{lang === "en" ? "Gravity tested" : "Gravedad"}</div>
            <div className={`font-bold ${isGravCovered ? 'text-emerald-400' : 'text-rose-400'}`}>{isGravCovered ? (lang === "en" ? "Covered" : "Cubierto") : (lang === "en" ? "Gap" : "Brecha")}</div>
          </div>
        </div>
      </div>

    </div>
  );
};