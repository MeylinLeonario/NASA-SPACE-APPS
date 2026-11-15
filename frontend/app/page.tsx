// frontend/app/page.tsx
'use client';

import React, { useState } from 'react';
import CopilotDrawer from '../components/layout/copilot-drawer';
import Navbar from '../components/layout/navbar';
import ScenarioRibbon from '../components/layout/scenario-ribbon';
import { HABITAT_PRESETS } from '../data/mocks/flare.mock';
import { HabitatPreset, Language, ViewStep } from '../models/flare.model';
import HomeView from '../views/home-view';

// Importamos el ScenarioProvider global y tus vistas modulares
import { ScenarioProvider } from "../src/context/ScenarioContext";
import { Step1ScenarioView } from "../src/components/step1-scenario/Step1ScenarioView";
import { Step2RankingView } from "../src/components/step2-ranking/Step2RankingView";
import { Step3PredictorView } from "../src/components/step3-predictor/Step3PredictorView";

function MainAppContent() {
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
      <main className="flex-1 w-full">
        {activeStep === 'home' && (
          <HomeView
            onNavigateStep={setActiveStep}
            onQuickSelectHabitat={handleQuickSelectHabitat}
            activeHabitat={activeHabitat}
          />
        )}

        {/* Renderizado de tus componentes modulares envueltos correctamente */}
        {activeStep === 'scenario' && <Step1ScenarioView />}
        {activeStep === 'ranking' && <Step2RankingView />}
        {activeStep === 'predict' && <Step3PredictorView />}
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

export default function FlareAppPage() {
  return (
    <ScenarioProvider>
      <MainAppContent />
    </ScenarioProvider>
  );
}