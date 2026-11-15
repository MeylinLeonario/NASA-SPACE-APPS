// frontend/src/components/step3-predictor/CopilotChatPanel.tsx
'use client';

import React from 'react';
import { RagCopilotWorkspace } from '../../components/copilot/RagCopilotWorkspace';

export const CopilotChatPanel: React.FC = () => {
  return <RagCopilotWorkspace variant="embedded" />;
};