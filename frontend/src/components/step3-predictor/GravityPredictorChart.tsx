//frontend/src/components/step3-predictor/GravityPredictorChart.tsx
import React, { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import { useScenario } from "../../context/ScenarioContext";
import { evaluateMaterialInAtmosphere } from "../../data/scenarioPresets";

export const GravityPredictorChart: React.FC = () => {
  const { lang, conditions, selectedMaterial, updateCondition } = useScenario();
  
  const [metricTab, setMetricTab] = useState<"o2" | "spread">("o2");
  const [ventTab, setVentTab] = useState<"on" | "off">("on");

  const isPMMA = selectedMaterial === "pmma";
  const o2At0g = isPMMA ? 16.6 : 14.8;
  const o2At1g = isPMMA ? 17.6 : 17.3;
  const currentO2 = conditions.o2;

  const generateData = () => {
    const data = [];
    for (let g = 0; g <= 1.0; g += 0.05) {
      const baseO2 = o2At0g + (o2At1g - o2At0g) * Math.pow(g, 0.7);
      const uncertainty = 0.2 + (0.5 * Math.sin(g * Math.PI));
      
      data.push({
        g: Number(g.toFixed(2)),
        mean: Number(baseO2.toFixed(2)),
        band: [Number((baseO2 - uncertainty).toFixed(2)), Number((baseO2 + uncertainty).toFixed(2))],
      });
    }
    return data;
  };

  const chartData = generateData();
  const currentPoint = chartData.find(d => Math.abs(d.g - conditions.gravityG) < 0.03) || chartData[0];
  const evalRes = evaluateMaterialInAtmosphere(selectedMaterial, conditions);
  const isBurn = evalRes.burnMarginPts >= 0;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-[#0A1224] p-5 shadow-lg">
      <h3 className="text-[15px] font-bold text-white">
        {lang === "en" ? "Predict fire at untested gravities" : "Predice el fuego en gravedades nunca probadas"}
      </h3>
      <p className="mt-1.5 mb-4 text-[11px] leading-relaxed text-slate-400">
        {lang === "en"
          ? "Bounded between 0 g (ISS) and 1 g (Earth), with ionic wind E-FIELD runs as partial-gravity analogs. Drag on the chart to explore any gravity."
          : "Acotado entre datos de 0 g (ISS) y 1 g (Tierra), con corridas de viento iónico de E-FIELD como análogos de gravedad parcial. Arrastra sobre el gráfico para explorar cualquier gravedad."}
      </p>

      <div className="mb-4 flex flex-wrap gap-2 font-mono text-[10px]">
        <button 
          onClick={() => setMetricTab("o2")}
          className={`rounded-lg border px-3 py-1.5 font-bold transition ${
            metricTab === "o2" ? "border-sky-400 bg-[#11244A] text-white" : "border-slate-700 bg-[#0C1529] text-slate-400 hover:text-slate-200"
          }`}
        >
          {lang === "en" ? "Minimum O₂" : "O₂ mínimo"}
        </button>
        <button 
          onClick={() => setMetricTab("spread")}
          className={`rounded-lg border px-3 py-1.5 font-bold transition ${
            metricTab === "spread" ? "border-sky-400 bg-[#11244A] text-white" : "border-slate-700 bg-[#0C1529] text-slate-400 hover:text-slate-200"
          }`}
        >
          {lang === "en" ? "Spread rate" : "Propagación"}
        </button>
        <span className="mx-1 flex h-6 items-center text-slate-700">|</span>
        <button 
          onClick={() => setVentTab("on")}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-bold transition ${
            ventTab === "on" ? "border-sky-400 bg-[#11244A] text-white" : "border-slate-700 bg-[#0C1529] text-slate-400 hover:text-slate-200"
          }`}
        >
          💨 {lang === "en" ? `Ventilation ${conditions.airflowCms} cm/s` : `Ventilación ${conditions.airflowCms} cm/s`}
        </button>
        <button 
          onClick={() => setVentTab("off")}
          className={`rounded-lg border px-3 py-1.5 font-bold transition ${
            ventTab === "off" ? "border-sky-400 bg-[#11244A] text-white" : "border-slate-700 bg-[#0C1529] text-slate-400 hover:text-slate-200"
          }`}
        >
          {lang === "en" ? "No ventilation" : "Sin ventilación"}
        </button>
      </div>

      <div className="flex flex-1 gap-6">
        <div className="flex-1 relative min-h-[250px]">
          <div className="absolute top-0 left-0 w-full flex justify-between px-10 font-mono text-[9px] font-bold text-white z-10 pointer-events-none">
            <span className="absolute left-[3%]">ÓRBITA</span>
            <span className="absolute left-[17%]">LUNA</span>
            <span className="absolute left-[38%]">MARTE</span>
            <span className="absolute right-[3%]">TIERRA</span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="g" 
                type="number" 
                domain={[0, 1]} 
                ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]} 
                tick={{ fill: "#64748B", fontSize: 10 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
                label={{ value: lang === "en" ? "Gravity level →" : "Nivel de gravedad →", position: "bottom", fill: "#94A3B8", fontSize: 10 }}
              />
              <YAxis 
                domain={[15, 19]} 
                ticks={[15, 16, 17, 18, 19]}
                tick={{ fill: "#64748B", fontSize: 10 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
                label={{ value: lang === "en" ? "Minimum O₂ to burn (%)" : "O₂ mínimo para arder (%)", angle: -90, position: "insideLeft", fill: "#94A3B8", fontSize: 10 }}
              />
              
              <ReferenceLine x={conditions.gravityG} stroke="#F8FAFC" strokeWidth={1.5} />
              <ReferenceLine x={conditions.gravityG} y={15.2} stroke="none" label={{ 
                position: "insideBottom", 
                value: conditions.gravityG.toFixed(2) + " g", 
                fill: "#F8FAFC", 
                fontSize: 10, 
                fontWeight: "bold",
              }} />

              <ReferenceLine y={18.6} stroke="none" label={{ 
                position: "insideTopLeft", 
                value: `↑ Tu cabina ${conditions.o2.toFixed(1)}% O₂ (fuera): arde en toda gravedad`, 
                fill: "#F8FAFC", 
                fontSize: 10,
                fontWeight: "bold",
              }} />

              <Area type="monotone" dataKey="band" stroke="none" fill="#38BDF8" fillOpacity={0.2} />
              <Area type="monotone" dataKey="mean" stroke="#38BDF8" strokeWidth={2.5} fill="none" />
              
              <Scatter data={[{ g: 0, mean: o2At0g }]} fill="#F8FAFC" />
              <Scatter data={[{ g: 1, mean: o2At1g }]} fill="#F8FAFC" shape="square" />
              <Scatter data={[{ g: 0.1, mean: 16.3 }, { g: 0.17, mean: 16.4 }, { g: 0.25, mean: 16.6 }]} fill="#050B15" stroke="#F8FAFC" strokeWidth={1.5} shape="diamond" />
              <Scatter data={[{ g: 0, mean: 16.0 }]} fill="#F59E0B" shape="triangle" />
              
              <ReferenceLine x={0.6} y={15.2} stroke="none" label={{ value: lang === "en" ? "NO DIRECT PSI DATA - PREDICTION" : "SIN DATOS PSI DIRECTOS - PREDICCIÓN", fill: "#64748B", fontSize: 9, fontWeight: "bold" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="w-[180px] shrink-0 rounded-xl border border-slate-700 bg-[#08101E] p-4 shadow-inner">
          <div className="mb-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {lang === "en" ? `A ${conditions.gravityG.toFixed(2)} G - TARGET` : `A ${conditions.gravityG.toFixed(2)} G - LUNA`}
          </div>
          
          <div className="mb-4">
            <span className="block text-[10px] text-slate-400">{lang === "en" ? "Minimum O₂ to burn" : "O₂ mínimo para arder"}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">{currentPoint.mean}</span>
              <span className="text-lg font-bold text-white">%</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">± {(currentPoint.band[1] - currentPoint.mean).toFixed(1)}</span>
          </div>

          <div className="mb-4 border-t border-slate-800/80 pt-3">
            <span className="block text-[10px] text-slate-400">{lang === "en" ? "Spread rate" : "Propagación"}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">1.21</span>
              <span className="text-[10px] text-slate-400 font-mono">mm/s (1.18-1.24)</span>
            </div>
          </div>

          <div className="mb-4 border-t border-slate-800/80 pt-3">
            <div className="inline-block rounded bg-sky-950/50 border border-sky-800 px-2 py-1 text-[9px] font-bold text-sky-400 mb-3 shadow-sm">
              ✨ {lang === "en" ? "Prediction, not in PSI" : "Predicción, no está en PSI"}
            </div>
            <p className="text-[11px] leading-snug text-slate-300">
              {lang === "en" ? "Your cabin" : "Tu cabina"} <strong className="text-white">{currentO2.toFixed(1)}% O₂</strong>:{" "}
              <span className={`rounded-sm px-1 font-bold text-rose-950 ${isBurn ? 'bg-rose-400' : 'bg-emerald-400 text-emerald-950'}`}>
                {isBurn ? (lang === "en" ? "burns" : "arde") : (lang === "en" ? "safe" : "seguro")}
              </span>{" "}
              <span className="font-mono text-[9px]">({isBurn ? "+" : ""}{evalRes.burnMarginPts.toFixed(1)} pts)</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-3">
        <input 
          type="range" 
          min={0} 
          max={1} 
          step={0.01} 
          value={conditions.gravityG}
          onChange={(e) => updateCondition("gravityG", parseFloat(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#1E293B] accent-[#38BDF8]"
        />
        <div className="flex flex-wrap gap-2 font-mono text-[9px]">
          <button className="rounded border border-slate-700 bg-[#0C1529] px-2 py-1 font-medium text-slate-400 hover:text-white">ÓRBITA 0.00</button>
          <button className="rounded border border-[#38BDF8] bg-[#11244A] px-2 py-1 font-bold text-white">LUNA 0.17</button>
          <button className="rounded border border-slate-700 bg-[#0C1529] px-2 py-1 font-medium text-slate-400 hover:text-white">MARTE 0.38</button>
          <button className="rounded border border-slate-700 bg-[#0C1529] px-2 py-1 font-medium text-slate-400 hover:text-white">TIERRA 1.00</button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-900/50 bg-[#0C1529] p-4 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1 bg-amber-500"></div>
        <div className="flex items-start gap-3">
          <span className="text-amber-500 mt-0.5">⚡</span>
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              {lang === "en" ? "FINDING" : "HALLAZGO"}
            </span>
            <p className="text-xs font-bold leading-relaxed text-white">
              {lang === "en"
                ? `With ${conditions.airflowCms.toFixed(1)} cm/s flow, ${evalRes.shortName} is most flammable in orbit (0 g); buoyancy increases the oxygen it needs. Test "Fans off" to simulate ventilation failure.`
                : `Con ${conditions.airflowCms.toFixed(1)} cm/s de flujo, ${evalRes.shortName} es más inflamable en órbita (0 g); la flotabilidad aumenta el oxígeno que necesita. Prueba "Ventiladores apagados" para simular una falla de ventilación.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};