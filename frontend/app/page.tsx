// frontend/app/page.tsx
'use client';

import React, { useState } from 'react';
import CopilotDrawer from '../components/layout/copilot-drawer';
import Navbar from '../components/layout/navbar';
import ScenarioRibbon from '../components/layout/scenario-ribbon';
import { HABITAT_PRESETS as HOME_HABITAT_PRESETS } from '../data/mocks/flare.mock';
import { HabitatPreset as HomeHabitatPreset, ViewStep } from '../models/flare.model';
import HomeView from '../views/home-view';

import { ScenarioProvider, useScenario } from '../src/context/ScenarioContext';
import { HabitatId } from '../src/Models/scenario';
import { Step1ScenarioView } from '../src/components/step1-scenario/Step1ScenarioView';
import { Step2RankingView } from '../src/components/step2-ranking/Step2RankingView';
import { Step3PredictorView } from '../src/components/step3-predictor/Step3PredictorView';

const HOME_TO_CONTEXT_HABITAT_MAP: Record<string, HabitatId> = {
  luna: 'artemis_lunar_base',
  rover: 'pressurized_rover',
  marte: 'mars_habitat',
  iss: 'iss_cabin',
  traje: 'spacesuit_eva',
  mina_tierra: 'earth_mine',
};

function MainAppContent() {
  const [viewMode, setViewMode] = useState<'home' | 'workspace'>('home');
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false);

  const {
    lang,
    setLang,
    activeStep,
    setActiveStep,
    activeHabitat: ctxHabitat,
    selectHabitat,
    conditions,
    allMaterialsEvaluation,
    o2VsEarthPct,
  } = useScenario();

  const currentViewStep: ViewStep =
    viewMode === 'home'
      ? 'home'
      : activeStep === 1
      ? 'scenario'
      : activeStep === 2
      ? 'ranking'
      : 'predict';

  const handleSelectStep = (step: ViewStep) => {
    if (step === 'home') {
      setViewMode('home');
      return;
    }
    setViewMode('workspace');
    if (step === 'scenario') setActiveStep(1);
    else if (step === 'ranking') setActiveStep(2);
    else if (step === 'predict') setActiveStep(3);
  };

  const handleQuickSelectFromHome = (homePreset: HomeHabitatPreset) => {
    const mappedId = HOME_TO_CONTEXT_HABITAT_MAP[homePreset.id] || 'artemis_lunar_base';
    selectHabitat(mappedId);
    setViewMode('workspace');
    setActiveStep(1);
  };

  // Adaptador en tiempo real para que ScenarioRibbon muestre exactamente los sliders actuales
  const syncedRibbonHabitat: HomeHabitatPreset = {
    ...(HOME_HABITAT_PRESETS.find((h) => h.id === ctxHabitat.backendId) ||
      HOME_HABITAT_PRESETS[0]),
    name: ctxHabitat.name[lang],
    o2Pct: conditions.o2,
    pressurePsi: conditions.pressurePsi,
    pressureKpa: Number((conditions.pressurePsi * 6.89476).toFixed(1)),
    airflowCms: conditions.airflowCms,
    gravityG: conditions.gravityG,
    o2VsEarthPct,
    earthTestGapPts: allMaterialsEvaluation.pmma.blindSpotPts,
    matchingInvestigations: ctxHabitat.strongMatchesCount,
    materials: {
      pmma: {
        ...HOME_HABITAT_PRESETS[0].materials.pmma,
        earthLoiPct: allMaterialsEvaluation.pmma.earthTest1Pct,
        scenarioLoiPct: allMaterialsEvaluation.pmma.minO2ToBurnPct,
        marginPts: allMaterialsEvaluation.pmma.burnMarginPts,
        burnsInScenario: allMaterialsEvaluation.pmma.burns,
      },
      sibal: {
        ...HOME_HABITAT_PRESETS[0].materials.sibal,
        earthLoiPct: allMaterialsEvaluation.sibal.earthTest1Pct,
        scenarioLoiPct: allMaterialsEvaluation.sibal.minO2ToBurnPct,
        marginPts: allMaterialsEvaluation.sibal.burnMarginPts,
        burnsInScenario: allMaterialsEvaluation.sibal.burns,
      },
      nomex: {
        ...HOME_HABITAT_PRESETS[0].materials.nomex,
        earthLoiPct: allMaterialsEvaluation.nomex.earthTest1Pct,
        scenarioLoiPct: allMaterialsEvaluation.nomex.minO2ToBurnPct,
        marginPts: allMaterialsEvaluation.nomex.burnMarginPts,
        burnsInScenario: allMaterialsEvaluation.nomex.burns,
      },
    },
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

      {currentViewStep !== 'home' && (
        <ScenarioRibbon
          habitat={syncedRibbonHabitat}
          activeStep={currentViewStep}
          onEditScenario={() => handleSelectStep('scenario')}
        />
      )}

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