/**
 * SignalLab — Main Application Bootstrap
 */
import './styles/theme.css';
import './styles/layout.css';
import './styles/components.css';

import { Header } from './components/Header.js';
import { Navigator } from './components/Navigator.js';
import { Workspace } from './components/Workspace.js';
import { ConceptPanel } from './components/ConceptPanel.js';
import { Timeline } from './components/Timeline.js';
import { simEngine } from './simulations/engine.js';
import { progressManager } from './state/learningProgress.js';

document.addEventListener('DOMContentLoaded', () => {
  const headerContainer = document.getElementById('header-mount');
  const navContainer = document.getElementById('nav-mount');
  const workspaceContainer = document.getElementById('workspace-mount');
  const conceptContainer = document.getElementById('concept-mount');
  const timelineContainer = document.getElementById('timeline-mount');

  // Initialize modular components
  new Header(headerContainer);
  new Navigator(navContainer);
  new Workspace(workspaceContainer);
  new ConceptPanel(conceptContainer);
  new Timeline(timelineContainer);

  // Start simulation engine
  simEngine.start();

  console.log('SignalLab — Wireless Communications Explorer initialized successfully.');
  progressManager.addLog('SYSTEM', 'Dashboard components mounted and synchronized.');
});
