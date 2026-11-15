// frontend/app/page.tsx
'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import CopilotDrawer from '../components/layout/copilot-drawer';
import Navbar from '../components/layout/navbar';
import ScenarioRibbon from '../components/layout/scenario-ribbon';
import { HABITAT_PRESETS } from '../data/mocks/flare.mock';
import { HabitatPreset, Language, ViewStep } from '../models/flare.model';
import HomeView from '../views/home-view';

export default function FlareAppPage() {
  const [activeStep, setActiveStep] = useState<ViewStep>('home');
  const [activeHabitat, setActiveHabitat] = useState<HabitatPreset>(HABITAT_PRESETS[0]); // Base Lunar Artemis por defecto
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('es');

  const handleQuickSelectHabitat = (habitat: HabitatPreset) => {
    setActiveHabitat(habitat);
    setActiveStep('scenario');
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(14,116,144,0.18),transparent)]">
      {/* Navbar Global Fija */}
      <Navbar
        activeStep={activeStep}
        onSelectStep={setActiveStep}
        onOpenCopilot={() => setCopilotOpen(true)}
        language={language}
        onToggleLanguage={setLanguage}
      />

      {/* Cinta de Telemetría del Escenario (visible en los Pasos 1, 2 y 3) */}
      {activeStep !== 'home' && (
        <ScenarioRibbon
          habitat={activeHabitat}
          activeStep={activeStep}
          onEditScenario={() => setActiveStep('scenario')}
        />
      )}

      {/* Contenido Principal por Vista */}
      <main className="flex-1">
        {activeStep === 'home' && (
          <HomeView
            onNavigateStep={setActiveStep}
            onQuickSelectHabitat={handleQuickSelectHabitat}
            activeHabitat={activeHabitat}
          />
        )}

        {/* Contenedores listos para las Vistas 1, 2 y 3 que enviaremos en los siguientes pasos */}
        {activeStep !== 'home' && (
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-800 bg-[#0b101e]/90 p-8">
              <span className="font-mono text-xs uppercase tracking-wider text-sky-400">
                {activeStep === 'scenario'
                  ? 'PASO 1 DE 3 · CONFIGURA EL ESCENARIO'
                  : activeStep === 'ranking'
                  ? 'PASO 2 DE 3 · EXPLORA EL RANKING Y LAS ALERTAS FÍSICAS'
                  : 'PASO 3 DE 3 · PREDECIR Y PREGUNTAR'}
              </span>
              <h1 className="mt-2 text-2xl font-bold text-white">
                {activeStep === 'scenario'
                  ? `Escenario activo: ${activeHabitat.name}`
                  : activeStep === 'ranking'
                  ? `Evidencia para ${activeHabitat.name}`
                  : 'Ve más allá de lo probado'}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Vista conectada al estado global ({activeHabitat.o2Pct}% O₂,{' '}
                {activeHabitat.pressurePsi} psi, {activeHabitat.airflowCms} cm/s,{' '}
                {activeHabitat.gravityG} g). Envía los mockups de este módulo para inyectar su
                componente completo en <code className="text-sky-300">views/</code>.
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep('home')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver al Home
                </button>
                {activeStep === 'scenario' && (
                  <button
                    type="button"
                    onClick={() => setActiveStep('ranking')}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200"
                  >
                    Ver evidencia y alertas
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Cajón Lateral del Copiloto SI */}
      <CopilotDrawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        activeHabitat={activeHabitat}
      />
    </div>
  );
}