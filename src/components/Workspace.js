/**
 * SignalLab — Central Engineering Workspace Component
 * Hosts the interactive SVG oscilloscope, RF parameter controls, and foundation status.
 */
import { CURRICULUM, TEXTBOOK_META } from '../data/textbookData.js';
import { progressManager } from '../state/learningProgress.js';
import { simEngine } from '../simulations/engine.js';
import { generateWaveformPoints, pointsToSvgPath, createSvgGrid } from '../utils/svgUtils.js';
import { calculateNyquistCapacity, calculateShannonCapacity, calculateFreeSpaceLoss } from '../utils/mathUtils.js';
import { formatFrequency, formatBitrate, formatDb } from '../utils/formatters.js';
import { renderChapter1 } from './Chapter1Lesson.js';
import { renderChapter2 } from './Chapter2Lesson.js';
import { renderChapter10 } from './Chapter10Lesson.js';
import { D3SignalVisualizer } from './D3SignalVisualizer.js';

export class Workspace {
  constructor(containerEl) {
    this.container = containerEl;
    this.svgWidth = 800;
    this.svgHeight = 240;
    this.renderedChapterId = null;

    this.render();
    this.setupSimulationListener();

    progressManager.subscribe((state) => {
      if (this.renderedChapterId !== state.activeChapterId) {
        this.render();
      } else {
        this.updateMetrics();
      }
    });
  }

  getActiveChapter() {
    const state = progressManager.getState();
    for (const part of CURRICULUM) {
      if (part.chapters) {
        const found = part.chapters.find(c => c.id === state.activeChapterId);
        if (found) return { chapter: found, part };
      }
    }
    return { chapter: CURRICULUM[0].chapters[0], part: CURRICULUM[0] };
  }

  render() {
    const { chapter, part } = this.getActiveChapter();
    const state = progressManager.getState();
    this.renderedChapterId = state.activeChapterId;

    this.container.innerHTML = `
      <div class="workspace-header">
        <div class="workspace-title-box">
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-sky);">
            PART ${part.partNumber} / CHAPTER ${chapter.chapterNumber}
          </div>
          <h1>${chapter.title}</h1>
          <p>${chapter.description}</p>
        </div>
        <div style="text-align: right; font-family: var(--font-mono); font-size: 0.75rem; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <div>
            <span style="color: var(--text-dim);">SOURCE REFERENCE: </span>
            <span style="color: var(--accent-cyan); font-weight: 700;">Book p. ${chapter.bookPage} (PDF p. ${chapter.pdfPage})</span>
          </div>
          <!-- Quick Instrument Drawer Toggles -->
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <button class="btn-ctrl active" id="btn-toggle-d3-top" title="Toggle D3 Signal Oscilloscope & Control Systems Suite">
              📡 D3 WAVE & CONTROL LAB
            </button>
            <button class="btn-ctrl" id="btn-toggle-metrics-top" title="Toggle Shannon & Nyquist RF Capacity Cards">
              📊 LINK CAPACITY CARDS
            </button>
          </div>
        </div>
      </div>

      <!-- Theory & Chapter Interactive Learning Modules Prominently on Top -->
      <div id="chapter-lesson-mount" class="chapter-lesson-wrapper"></div>

      <!-- Toggleable D3 Oscilloscope, Modulation & Control Systems Laboratory Drawer -->
      <div class="workspace-drawer-toggle-bar" id="drawer-bar-d3" title="Click to collapse or expand D3 Oscilloscope & Control Systems Suite">
        <div class="workspace-drawer-toggle-title">
          <span class="workspace-drawer-chevron" id="chevron-d3">▼</span>
          <span>📡 D3.JS OSCILLOSCOPE, MODULATION & CONTROL SYSTEMS LABORATORY</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="workspace-drawer-status-pill" id="status-pill-d3">EXPANDED</span>
          <span style="font-size: 0.7rem; color: var(--text-dim); font-family: var(--font-mono);">CLICK TO TOGGLE</span>
        </div>
      </div>
      <div id="d3-drawer-wrapper" class="workspace-drawer-content">
        <div id="d3-signal-visualizer-mount"></div>
      </div>

      <!-- Toggleable Real-Time Mathematical Telemetry Cards (Stallings Ch. 2 & 5) -->
      <div class="workspace-drawer-toggle-bar" id="drawer-bar-metrics" title="Click to collapse or expand Shannon Capacity & Path Loss Telemetry">
        <div class="workspace-drawer-toggle-title">
          <span class="workspace-drawer-chevron" id="chevron-metrics">▶</span>
          <span>📊 RF LINK CAPACITY & PATH LOSS TELEMETRY (EQ. 2.12, 2.13 & 5.2)</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="workspace-drawer-status-pill" id="status-pill-metrics" style="color: var(--text-dim); border-color: var(--border-subtle);">COLLAPSED</span>
          <span style="font-size: 0.7rem; color: var(--text-dim); font-family: var(--font-mono);">CLICK TO EXPAND</span>
        </div>
      </div>
      <div id="metrics-drawer-content" class="workspace-drawer-content" style="display: none;">
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-card-header">
              <span>SHANNON CAPACITY (LIMIT)</span>
              <span>EQ. 2.13</span>
            </div>
            <div class="metric-card-val" id="metric-shannon">--</div>
            <div class="metric-card-sub">C = B · log₂(1 + SNR)</div>
          </div>

          <div class="metric-card">
            <div class="metric-card-header">
              <span>NYQUIST MAXIMUM RATE</span>
              <span>EQ. 2.12</span>
            </div>
            <div class="metric-card-val" id="metric-nyquist">--</div>
            <div class="metric-card-sub" id="metric-nyquist-sub">C = 2B · log₂(M)</div>
          </div>

          <div class="metric-card">
            <div class="metric-card-header">
              <span>FREE SPACE PATH LOSS</span>
              <span>EQ. 5.2</span>
            </div>
            <div class="metric-card-val" id="metric-fspl">--</div>
            <div class="metric-card-sub">L = (4πd / λ)²</div>
          </div>

          <div class="metric-card">
            <div class="metric-card-header">
              <span>TRANSMIT POWER (EIRP)</span>
              <span>PARAM</span>
            </div>
            <div class="metric-card-val">${state.simParams.txPowerDbm} dBm</div>
            <div class="metric-card-sub">100.0 mW Radiated Power</div>
          </div>
        </div>
      </div>
    `;

    // Instantiate D3 Signal Visualization & Modulation Module
    if (this.d3Visualizer) {
      this.d3Visualizer.destroy();
      this.d3Visualizer = null;
    }
    const d3Mount = this.container.querySelector('#d3-signal-visualizer-mount');
    if (d3Mount) {
      this.d3Visualizer = new D3SignalVisualizer(d3Mount);
    }

    this.attachDrawerListeners();
    this.attachControlListeners();
    this.updateMetrics();
    this.renderActiveChapterModule();
  }

  attachDrawerListeners() {
    // 1. D3 Drawer Toggle
    const barD3 = this.container.querySelector('#drawer-bar-d3');
    const wrapD3 = this.container.querySelector('#d3-drawer-wrapper');
    const chevronD3 = this.container.querySelector('#chevron-d3');
    const pillD3 = this.container.querySelector('#status-pill-d3');
    const btnTopD3 = this.container.querySelector('#btn-toggle-d3-top');

    const toggleD3 = () => {
      const isVisible = wrapD3 && wrapD3.style.display !== 'none';
      if (wrapD3) wrapD3.style.display = isVisible ? 'none' : 'block';
      if (chevronD3) chevronD3.textContent = isVisible ? '▶' : '▼';
      if (pillD3) {
        pillD3.textContent = isVisible ? 'COLLAPSED' : 'EXPANDED';
        pillD3.style.color = isVisible ? 'var(--text-dim)' : 'var(--accent-cyan)';
      }
      if (btnTopD3) {
        btnTopD3.classList.toggle('active', !isVisible);
      }
    };

    if (barD3) barD3.addEventListener('click', toggleD3);
    if (btnTopD3) btnTopD3.addEventListener('click', toggleD3);

    // 2. Metrics Drawer Toggle
    const barMetrics = this.container.querySelector('#drawer-bar-metrics');
    const wrapMetrics = this.container.querySelector('#metrics-drawer-content');
    const chevronMetrics = this.container.querySelector('#chevron-metrics');
    const pillMetrics = this.container.querySelector('#status-pill-metrics');
    const btnTopMetrics = this.container.querySelector('#btn-toggle-metrics-top');

    const toggleMetrics = () => {
      const isVisible = wrapMetrics && wrapMetrics.style.display !== 'none';
      if (wrapMetrics) wrapMetrics.style.display = isVisible ? 'none' : 'block';
      if (chevronMetrics) chevronMetrics.textContent = isVisible ? '▶' : '▼';
      if (pillMetrics) {
        pillMetrics.textContent = isVisible ? 'COLLAPSED' : 'EXPANDED';
        pillMetrics.style.color = isVisible ? 'var(--text-dim)' : '#00ff9d';
      }
      if (btnTopMetrics) {
        btnTopMetrics.classList.toggle('active', !isVisible);
      }
    };

    if (barMetrics) barMetrics.addEventListener('click', toggleMetrics);
    if (btnTopMetrics) btnTopMetrics.addEventListener('click', toggleMetrics);
  }

  renderActiveChapterModule() {
    const lessonMount = this.container.querySelector('#chapter-lesson-mount');
    if (!lessonMount) return;

    const state = progressManager.getState();
    if (state.activeChapterId === 'ch-01') {
      renderChapter1(lessonMount, state, progressManager);
    } else if (state.activeChapterId === 'ch-02') {
      renderChapter2(lessonMount, state, progressManager);
    } else if (state.activeChapterId === 'ch-10') {
      renderChapter10(lessonMount, state, progressManager);
    } else {
      const { chapter } = this.getActiveChapter();
      lessonMount.innerHTML = `
        <div class="staging-banner">
          <div class="staging-icon">📡</div>
          <div class="staging-content">
            <h3>CHAPTER ${chapter.chapterNumber}: ${chapter.title.toUpperCase()}</h3>
            <p>
              ${chapter.description} Reference textbook print pages: pp. ${chapter.bookPage}–${chapter.bookPage + 30}.
            </p>
            <div class="staging-tags">
              <span class="badge badge-staged">STALLINGS 2E CURRICULUM READY</span>
              <span class="badge badge-ready">CORE SIMULATOR ACTIVE BELOW</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  updateHeaderAndInfo() {
    this.render();
  }

  attachControlListeners() {
    const freqSlider = this.container.querySelector('#ctrl-freq');
    const snrSlider = this.container.querySelector('#ctrl-snr');
    const bwSlider = this.container.querySelector('#ctrl-bw');
    const modSelect = this.container.querySelector('#ctrl-mod');

    if (freqSlider) {
      freqSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        progressManager.updateSimParams({ carrierFreqHz: val });
        this.container.querySelector('#ctrl-freq-val').textContent = formatFrequency(val);
        const statusEl = this.container.querySelector('#scope-status');
        if (statusEl) statusEl.textContent = `CARRIER: ${formatFrequency(val)} | TIME-DOMAIN ACTIVE`;
        this.updateMetrics();
      });
    }

    if (snrSlider) {
      snrSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        progressManager.updateSimParams({ snrDb: val });
        this.container.querySelector('#ctrl-snr-val').textContent = formatDb(val);
        this.updateMetrics();
      });
    }

    if (bwSlider) {
      bwSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        progressManager.updateSimParams({ bandwidthHz: val });
        this.container.querySelector('#ctrl-bw-val').textContent = formatFrequency(val);
        this.updateMetrics();
      });
    }

    if (modSelect) {
      modSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        progressManager.updateSimParams({ modulationScheme: val });
        this.container.querySelector('#ctrl-mod-val').textContent = val;
        this.updateMetrics();
      });
    }
  }

  updateMetrics() {
    const state = progressManager.getState();
    const { bandwidthHz, snrDb, carrierFreqHz, distanceMeters, modulationScheme } = state.simParams;

    // Shannon capacity
    const shannon = calculateShannonCapacity(bandwidthHz, snrDb);
    const shannonEl = this.container.querySelector('#metric-shannon');
    if (shannonEl) shannonEl.textContent = formatBitrate(shannon);

    // M-ary level lookup for Nyquist capacity
    const mLevels = {
      'BPSK': 2,
      'QPSK': 4,
      '16-QAM': 16,
      '64-QAM': 64
    };
    const M = mLevels[modulationScheme] || 2;
    const nyquist = calculateNyquistCapacity(bandwidthHz, M);
    const nyquistEl = this.container.querySelector('#metric-nyquist');
    if (nyquistEl) nyquistEl.textContent = formatBitrate(nyquist);
    const nyquistSubEl = this.container.querySelector('#metric-nyquist-sub');
    if (nyquistSubEl) nyquistSubEl.textContent = `C = 2B · log₂(M) (M=${M}, ${Math.log2(M)}b/s)`;

    // Free space path loss
    const fspl = calculateFreeSpaceLoss(distanceMeters, carrierFreqHz);
    const fsplEl = this.container.querySelector('#metric-fspl');
    if (fsplEl) fsplEl.textContent = formatDb(fspl);
  }

  setupSimulationListener() {
    simEngine.subscribe((time) => {
      const pathEl = this.container.querySelector('#signal-path');
      if (!pathEl) return;

      const state = progressManager.getState();
      // Map carrier frequency range [800 MHz, 5.8 GHz] to [1.2, 8.0] visual display cycles
      const minF = 800000000;
      const maxF = 5800000000;
      const normF = (state.simParams.carrierFreqHz - minF) / (maxF - minF);
      const displayFreq = 1.2 + Math.max(0, Math.min(1, normF)) * 6.8;

      const points = generateWaveformPoints({
        width: 800,
        height: 240,
        time,
        freq: displayFreq,
        amplitude: 65,
        harmonics: this.harmonics,
        snrDb: state.simParams.snrDb
      });

      const d = pointsToSvgPath(points);
      pathEl.setAttribute('d', d);
    });
  }
}
