import React, { useState } from "react";
import { Send } from "lucide-react";
import { useScenario } from "../../context/ScenarioContext";

export const CopilotChatPanel: React.FC = () => {
  const { lang, activeHabitat, conditions } = useScenario();
  const [question, setQuestion] = useState("");

  const suggestedQs = [
    "¿Por qué Acrílico (PMMA) pasa pruebas terrestres pero arde en el espacio?",
    "¿Qué materiales son riesgosos en Base Lunar Artemis con 30% O₂?",
    "¿Qué son las llamas frías y por qué son peligrosas?",
  ];

  return (
    <div className="flex h-full w-[400px] shrink-0 flex-col rounded-xl border border-slate-800 bg-[#0C1529] shadow-2xl">
      <div className="flex items-center gap-3 border-b border-slate-800/80 p-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11244A] text-[#38BDF8] border border-sky-900/50">
          ✨
        </span>
        <div>
          <h3 className="font-bold text-white">Copilot</h3>
          <p className="text-[10px] text-slate-400">
            {lang === "en" ? "Ask why a phenomenon occurs. Every response cites PSI evidence." : "Pregunta por qué ocurre un fenómeno. Cada respuesta cita evidencia PSI."}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex-1 overflow-y-auto">
          <div className="mb-4 rounded-xl border border-slate-700 bg-[#08101E] p-4 text-[11px] leading-relaxed text-slate-300">
            <span className="text-slate-500">{lang === "en" ? "Loaded context:" : "Contexto cargado:"}</span>{" "}
            <strong className="text-white">{activeHabitat.name[lang]}</strong>{" "}
            <span className="font-mono text-slate-400">({conditions.o2.toFixed(0)}% O₂ · {conditions.pressurePsi.toFixed(1)} psi · {conditions.airflowCms.toFixed(1)} cm/s · {conditions.gravityG.toFixed(2)} g)</span>
          </div>
        </div>

        <div>
          <div className="mb-3">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-slate-500">
              {lang === "en" ? "SUGGESTED QUESTIONS" : "PREGUNTAS SUGERIDAS"}
            </span>
            <div className="flex flex-col gap-2">
              {suggestedQs.map((q, i) => (
                <button key={i} className="flex items-center justify-between rounded-lg border border-slate-700 bg-[#0A1224] px-3 py-2 text-left text-[11px] font-medium text-slate-300 hover:border-slate-500 hover:text-white transition">
                  <span>{q}</span>
                  <span className="text-slate-500">↗</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <input 
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={lang === "en" ? "e.g. Why does fire spread toward the fan?" : "ej. ¿Por qué el fuego avanza hacia el ventilador?"}
              className="w-full rounded-xl border border-slate-600 bg-[#050B15] py-3 pl-4 pr-12 text-[11px] text-white placeholder-slate-500 outline-none focus:border-sky-500 transition"
            />
            <button className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-slate-900 transition hover:bg-slate-200">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};