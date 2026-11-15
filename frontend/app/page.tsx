// frontend/app/page.tsx
'use client';

import React, { useState } from 'react';
import CopilotDrawer from '../components/layout/copilot-drawer';
import Navbar from '../components/layout/navbar';
import ScenarioRibbon from '../components/layout/scenario-ribbon';
import { HABITAT_PRESETS } from '../data/mocks/flare.mock';
import { HabitatPreset, ViewStep } from '../models/flare.model';
import HomeView from '../views/home-view';
import { HABITAT_PRESETS as scenarioPresets } from '../src/data/scenarioPresets';

// Importamos el ScenarioProvider global y tus vistas modulares
import { useScenario, ScenarioProvider } from "../src/context/ScenarioContext";
import { Step1ScenarioView } from "../src/components/step1-scenario/Step1ScenarioView";
import { Step2RankingView } from "../src/components/step2-ranking/Step2RankingView";
import { Step3PredictorView } from "../src/components/step3-predictor/Step3PredictorView";

function MainAppContent() {
  const scenario = useScenario();
  const [home, setHome] = useState(true);
  const steps: ViewStep[] = ['scenario', 'ranking', 'predict'];
  const activeStep: ViewStep = home ? 'home' : steps[scenario.activeStep - 1];
  const setActiveStep = (step: ViewStep) => {
    setHome(step === 'home');
    if (step !== 'home') scenario.setActiveStep((steps.indexOf(step) + 1) as 1 | 2 | 3);
  };
  const [activeHabitat, setActiveHabitat] = useState<HabitatPreset>(HABITAT_PRESETS[0]); // Base Lunar Artemis por defecto
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false);
  const language = scenario.lang;
  const setLanguage = scenario.setLang;

  const handleQuickSelectHabitat = (habitat: HabitatPreset) => {
    setActiveHabitat(habitat);
    const preset = scenarioPresets.find(item => item.backendId === habitat.id);
    if (preset) scenario.selectHabitat(preset.id);
    setActiveStep('scenario');
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(14,116,144,0.18),transparent)]">
      <Navbar
        activeStep={currentViewStep}
        onSelectStep={handleSelectStep}
        onOpenCopilot={() => setCopilotOpen(true)}
        language={lang}
        onToggleLanguage={setLang}
      />

      {/* Cinta de Telemetría del Escenario (visible en los Pasos 1, 2 y 3) */}
      {activeStep !== 'home' && activeStep !== 'predict' && (
        <ScenarioRibbon
          habitat={syncedRibbonHabitat}
          activeStep={currentViewStep}
          onEditScenario={() => handleSelectStep('scenario')}
        />
      )}

      {activeStep === 'predict' && <div className="border-b border-slate-800 px-6 py-3 text-sm text-slate-300">
        {scenario.activeHabitat.name[language]} · {scenario.conditions.o2}% O₂ · {scenario.conditions.pressurePsi} psi · {scenario.conditions.airflowCms} cm/s · {scenario.conditions.gravityG} g
      </div>}
      {/* Contenido Principal por Vista */}
      <main className="flex-1 w-full">
        {currentViewStep === 'home' && (
          <HomeView
            onNavigateStep={handleSelectStep}
            onQuickSelectHabitat={handleQuickSelectFromHome}
            activeHabitat={syncedRibbonHabitat}
          />
        )}

        {currentViewStep === 'scenario' && <Step1ScenarioView />}
        {currentViewStep === 'ranking' && <Step2RankingView />}
        {currentViewStep === 'predict' && <Step3PredictorView />}
      </main>

      <CopilotDrawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
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