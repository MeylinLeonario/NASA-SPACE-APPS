import React, { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useScenario } from "../../context/ScenarioContext";
import { evaluateMaterialInAtmosphere } from "../../data/scenarioPresets";
import { HeadToHeadPanel } from "./HeadToHeadPanel";
import { InsideInvestigationPanel } from "./InsideInvestigationPanel";

const CustomTargetLabel = (props: any) => {
  const { viewBox, value } = props;
  return (
    <g transform={`translate(${viewBox.x}, 15)`}>
      <rect x="-65" y="-14" width="130" height="20" rx="4" fill="#F8FAFC" />
      <polygon points="-5,6 5,6 0,13" fill="#F8FAFC" />
      <text x="0" y="0" fill="#0F172A" fontSize="9" fontWeight="bold" textAnchor="middle">
        {value}
      </text>
    </g>
  );
};

export const DangerMapPanel: React.FC = () => {
  const { lang, conditions, selectedMaterial } = useScenario();
  const [activeTab, setActiveTab] = useState<"map" | "compare" | "inside">("map");

  // Dataset para la curva en forma de U de la gravedad seleccionada y Tierra (1g)
  const chartData = [];
  for (let x = 0; x <= 40; x += 1) {
    let flowOffset = 0;
    if (x < 10) flowOffset = 0.035 * Math.pow(10 - x, 1.35);
    else flowOffset = 0.0022 * Math.pow(x - 10, 1.6);

    const baseLoi0g = 16.3; // PMMA
    const baseEarth = 17.5; // PMMA

    const gravDelta = (baseEarth - baseLoi0g) * Math.pow(conditions.gravityG, 0.95);
    const pressDelta = 0.015 * (14.7 - conditions.pressurePsi);

    const loiTarget = baseLoi0g + flowOffset + gravDelta + pressDelta;
    const loi0g = baseLoi0g + flowOffset + pressDelta;

    chartData.push({
      flow: x,
      limit0g: Number(loi0g.toFixed(2)),
      limitTarget: Number(loiTarget.toFixed(2)),
      limitEarth: baseEarth,
    });
  }

  // Puntos experimentales dispersos (Mocks ajustados a la imagen de Figma)
  const scatterBurns = [
    { flow: 1.5, o2: 17.5, res: "burns" },
    { flow: 5, o2: 18.2, res: "burns" },
    { flow: 8, o2: 21.0, res: "burns" },
    { flow: 10, o2: 30.0, res: "burns" },
    { flow: 15, o2: 17.0, res: "burns" },
    { flow: 20, o2: 17.8, res: "burns" },
    { flow: 35, o2: 18.5, res: "burns" },
    { flow: 38, o2: 21.0, res: "burns" },
  ];
  const scatterSelfExt = [
    { flow: 2.5, o2: 16.2, res: "ext" },
    { flow: 4, o2: 15.5, res: "ext" },
    { flow: 9, o2: 14.8, res: "ext" },
    { flow: 13, o2: 15.0, res: "ext" },
    { flow: 25, o2: 16.5, res: "ext" },
  ];

  const evalRes = evaluateMaterialInAtmosphere(selectedMaterial, conditions);
  const isBurn = evalRes.burnMarginPts >= 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800/90 bg-[#0B1425] shadow-2xl overflow-hidden">
      {/* Tabs Superiores */}
      <div className="flex border-b border-slate-800/90 text-[11px] font-semibold text-slate-400">
        <button 
          onClick={() => setActiveTab("map")}
          className={`flex flex-1 items-center justify-center gap-2 py-3.5 transition ${
            activeTab === "map" ? "border-b-2 border-[#38BDF8] bg-[#0F1C36] text-white" : "hover:bg-[#0D182E] hover:text-slate-200"
          }`}
        >
          📈 {lang === "en" ? "Danger map" : "Mapa de peligro"}
        </button>
        <button 
          onClick={() => setActiveTab("compare")}
          className={`flex flex-1 items-center justify-center gap-2 py-3.5 transition ${
            activeTab === "compare" ? "border-b-2 border-[#38BDF8] bg-[#0F1C36] text-white" : "hover:bg-[#0D182E] hover:text-slate-200"
          }`}
        >
          ⚖️ {lang === "en" ? "Head-to-head" : "Cara a cara"}
        </button>
        <button 
          onClick={() => setActiveTab("inside")}
          className={`flex flex-1 items-center justify-center gap-2 py-3.5 transition ${
            activeTab === "inside" ? "border-b-2 border-[#38BDF8] bg-[#0F1C36] text-white" : "hover:bg-[#0D182E] hover:text-slate-200"
          }`}
        >
          🗂️ {lang === "en" ? "Inside one investigation" : "Dentro de una investigación"}
        </button>
      </div>

      {activeTab === "map" && (
        <div className="flex flex-1 flex-col p-6 overflow-y-auto">
          {/* Cabecera del Mapa */}
          <div className="mb-5">
            <h3 className="mb-2 text-lg font-bold text-white">
              {lang === "en" ? "Where fire becomes dangerous" : "Dónde el fuego se vuelve peligroso"}
            </h3>
            <p className="text-[11.5px] leading-relaxed text-slate-300">
              {lang === "en" ? "At" : "A"} {conditions.airflowCms.toFixed(1)} cm/s{" "}
              {lang === "en" ? "and" : "y"} {conditions.gravityG.toFixed(2)} g,{" "}
              {evalRes.shortName}{" "}
              {lang === "en" ? "keeps burning down to" : "sigue ardiendo hasta"}{" "}
              {evalRes.minO2ToBurnPct.toFixed(1)}% {lang === "en" ? "O₂" : "de O₂"},{" "}
              {evalRes.blindSpotPts.toFixed(1)} pts{" "}
              {lang === "en"
                ? "less than what an Earth test reports"
                : "menos de lo que reporta una prueba terrestre"}{" "}
              ({evalRes.earthTest1Pct.toFixed(1)}%).{" "}
              <strong className="text-white">
                {lang === "en" ? "Your cabin:" : "Tu cabina:"} {conditions.o2.toFixed(1)}% O₂ →{" "}
              </strong>
              <span
                className={`font-bold ${isBurn ? "text-rose-400" : "text-emerald-400"}`}
              >
                {isBurn ? (lang === "en" ? "Burns" : "Arde") : (lang === "en" ? "Safe" : "Seguro")}
              </span>{" "}
              ({isBurn ? "+" : ""}{evalRes.burnMarginPts.toFixed(1)} pts)
            </p>
          </div>

          {/* Sub-filtros */}
          <div className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[10px]">
            <button className="rounded border border-sky-400 bg-[#11244A] px-3 py-1 font-bold text-white shadow-sm">
              PMMA
            </button>
            <button className="rounded border border-slate-700 bg-[#0C1529] px-3 py-1 font-medium text-slate-400 hover:text-slate-200">
              SIBAL
            </button>
            <button className="rounded border border-slate-700 bg-[#0C1529] px-3 py-1 font-medium text-slate-400 hover:text-slate-200">
              Nomex
            </button>
            <span className="mx-1 h-3 w-px bg-slate-700" />
            <button className="rounded border border-slate-700 bg-[#0C1529] px-3 py-1 font-medium text-slate-400 hover:text-slate-200">
              {lang === "en" ? "All materials" : "Todos los materiales"}
            </button>
            <button className="flex items-center gap-1.5 rounded border border-slate-600 bg-slate-800/80 px-3 py-1 font-bold text-sky-300 hover:bg-slate-700">
              🔍 {lang === "en" ? "Zoom on limits" : "Zoom en límites"}
            </button>
            <button className="flex items-center gap-1.5 rounded border border-slate-700 bg-[#0C1529] px-3 py-1 font-medium text-slate-400 hover:text-slate-200">
              📄 {lang === "en" ? "Data table" : "Tabla"}
            </button>
          </div>

          {/* Recharts Area */}
          <div className="relative flex-1 min-h-[300px]">
            <svg width="0" height="0">
              <defs>
                <pattern id="hazardStripe" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                  <line x1="0" y="0" x2="0" y2="8" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.25" />
                </pattern>
              </defs>
            </svg>

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="flow"
                  type="number"
                  domain={[0, 40]}
                  ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40]}
                  tick={{ fill: "#64748B", fontSize: 10 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={{ stroke: "#334155" }}
                  label={{
                    value: lang === "en" ? "Ventilation airflow (cm/s) →" : "Flujo de ventilación (cm/s) →",
                    position: "bottom",
                    fill: "#94A3B8",
                    fontSize: 10,
                  }}
                />
                <YAxis
                  domain={[14, 23]}
                  ticks={[14, 16, 18, 20, 22]}
                  tick={{ fill: "#64748B", fontSize: 10 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={{ stroke: "#334155" }}
                  label={{
                    value: lang === "en" ? "Oxygen concentration (%) →" : "Concentración de oxígeno (%) →",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#94A3B8",
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F1C36", borderColor: "#1E293B", color: "#F8FAFC", fontSize: "11px" }}
                  itemStyle={{ color: "#38BDF8" }}
                />

                <ReferenceArea x1={3} x2={25} y1={14} y2={17.5} fill="url(#hazardStripe)" ifOverflow="hidden" />
                
                <ReferenceLine x={14} y={15} stroke="none" label={{ value: "PELIGRO OCULTO", fill: "#FBBF24", fontSize: 10, fontWeight: "bold" }} />
                <ReferenceLine x={14} y={14.5} stroke="none" label={{ value: "pasa en Tierra, arde en 0 g (3-25 cm/s)", fill: "#FBBF24", fontSize: 8 }} />
                
                <ReferenceLine x={14} y={14} stroke="none" label={{ value: "VENTILACIÓN TÍPICA", fill: "#64748B", fontSize: 9, fontWeight: "bold" }} />
                <ReferenceLine x={35} y={14.5} stroke="none" label={{ value: "Se autoextingue", fill: "#94A3B8", fontSize: 10, fontWeight: "bold" }} />
                <ReferenceLine x={35} y={22} stroke="none" label={{ value: "La llama sigue ardiendo", fill: "#F8FAFC", fontSize: 10, fontWeight: "bold" }} />
                <ReferenceLine x={35} y={21.5} stroke="none" label={{ value: "sobre la línea límite", fill: "#94A3B8", fontSize: 9 }} />
                <ReferenceLine x={35} y={17.2} stroke="none" label={{ value: "Prueba terrestre: límite 17.5%", fill: "#CBD5E1", fontSize: 9, fontWeight: "bold" }} />

                <Area type="monotone" dataKey="limit0g" stroke="#38BDF8" strokeWidth={2.5} fill="none" />
                <Area type="monotone" dataKey="limitEarth" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                <Area type="monotone" dataKey="limitTarget" stroke="#38BDF8" strokeWidth={1.5} strokeDasharray="2 4" fill="none" />

                <ReferenceLine 
                  x={conditions.airflowCms} 
                  stroke="#94A3B8" 
                  strokeDasharray="3 3" 
                  label={<CustomTargetLabel value={`TÚ: ${conditions.o2.toFixed(0)}% ↑ - ${conditions.airflowCms.toFixed(1)} cm/s`} />} 
                />

                <Scatter data={scatterBurns} fill="#F97316" />
                <Scatter data={scatterSelfExt} fill="transparent" stroke="#94A3B8" strokeWidth={1.5} shape="cross" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-800/80 pt-3 font-mono text-[9px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 bg-[#38BDF8]" />
              <span>Límite en microgravedad (0 g)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 border-t-2 border-dashed border-slate-300" />
              <span>Prueba terrestre (1 g)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 border-t-2 border-dotted border-[#38BDF8]" />
              <span>A {conditions.gravityG.toFixed(2)} g (predicción)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-4 rounded-sm bg-amber-500/20 border border-amber-500/40" />
              <span>Peligro oculto: pasa en la Tierra, arde en el espacio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span>Corrida siguió ardiendo</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span>✕</span>
              <span className="text-slate-400">Corrida se autoextinguió</span>
            </div>
            <div className="flex items-center gap-1.5 text-white">
              <div className="h-2 w-2 rounded-full bg-white" />
              <span>Tu escenario ↑ fuera del gráfico</span>
            </div>
          </div>
          <p className="mt-2 text-[8px] text-slate-500 leading-relaxed">
            Curvas: modelo de frontera representativo ajustado a la tendencia reportada por BASS, BASS-II y SoFIE. 
            Puntos: corridas curadas. Pasa el cursor, enfoca o toca un punto.
          </p>
        </div>
      )}

      {activeTab === "compare" && (
        <HeadToHeadPanel />
      )}
      
      {activeTab === "inside" && (
        <InsideInvestigationPanel />
      )}
    </div>
  );
};