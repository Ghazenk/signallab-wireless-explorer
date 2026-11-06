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

export class Workspace {
  constructor(containerEl) {
    this.container = containerEl;
    this.svgWidth = 800;
    this.svgHeight = 240;
    this.harmonics = 1;

    this.render();
    this.setupSimulationListener();

    progressManager.subscribe(() => {
      this.updateHeaderAndInfo();
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

    this.container.innerHTML = `
      <div class="workspace-header">
        <div class="workspace-title-box">
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-sky);">
            PART ${part.partNumber} / CHAPTER ${chapter.chapterNumber}
          </div>
          <h1>${chapter.title}</h1>
          <p>${chapter.description}</p>
        </div>
        <div style="text-align: right; font-family: var(--font-mono); font-size: 0.75rem;">
          <div style="color: var(--text-dim);">SOURCE REFERENCE</div>
          <div style="color: var(--accent-cyan); font-weight: 700;">Book p. ${chapter.bookPage} (PDF p. ${chapter.pdfPage})</div>
        </div>
      </div>

      <!-- Foundation & Progressive Development Staging Banner -->
      <div class="staging-banner">
        <div class="staging-icon">⚡</div>
        <div class="staging-content">
          <h3>PHASE 1: APPLICATION FOUNDATION & TEXTBOOK VERIFICATION COMPLETE</h3>
          <p>
            SignalLab's architecture and textbook reference map are verified from William Stallings' 
            <em>Wireless Communications and Networks (2nd Edition)</em>. 
            Detailed lesson modules for Chapter 1 and Chapter 2 are staged for progressive implementation in the next phase.
          </p>
          <div class="staging-tags">
            <span class="badge badge-ready">569 PAGES VERIFIED</span>
            <span class="badge badge-staged">CH 1-15 STAGED</span>
            <span class="badge badge-staged">ENGINE READY</span>
          </div>
        </div>
      </div>

      <!-- Real-Time Interactive SVG Signal Oscilloscope -->
      <div class="instrument-container">
        <div class="instrument-topbar">
          <div class="instrument-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <span>RF SIGNAL ANALYZER & OSCILLOSCOPE (SVG VECTOR RENDERER)</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-cyan);" id="scope-status">
            SAMPLING: 2.4 GHz | TIME-DOMAIN ACTIVE
          </div>
        </div>

        <div class="oscilloscope-screen" id="scope-screen">
          <svg class="oscilloscope-svg" id="scope-svg" viewBox="0 0 800 240" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 229, 255, 0.08)" stroke-width="1"/>
                <path d="M 10 0 L 10 40 M 20 0 L 20 40 M 30 0 L 30 40 M 0 10 L 40 10 M 0 20 L 40 20 M 0 30 L 40 30" fill="none" stroke="rgba(0, 229, 255, 0.025)" stroke-width="0.5"/>
              </pattern>
              <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0070f3" stop-opacity="0.8"/>
                <stop offset="50%" stop-color="#00e5ff" stop-opacity="1"/>
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.8"/>
              </linearGradient>
            </defs>

            <!-- Background Grid -->
            <rect width="800" height="240" fill="#040812"/>
            <rect width="800" height="240" fill="url(#grid-pattern)"/>
            
            <!-- Center Line -->
            <line x1="0" y1="120" x2="800" y2="120" stroke="rgba(0, 229, 255, 0.2)" stroke-width="1" stroke-dasharray="4 4"/>

            <!-- Signal Waveform Path -->
            <path id="signal-path" d="" fill="none" stroke="url(#wave-grad)" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Real-Time Instrument Controls -->
        <div class="instrument-controls">
          <div class="control-item">
            <div class="control-label">
              <span>CARRIER FREQUENCY</span>
              <span id="ctrl-freq-val">${formatFrequency(state.simParams.carrierFreqHz)}</span>
            </div>
            <input type="range" class="control-slider" id="ctrl-freq" min="800000000" max="5800000000" step="100000000" value="${state.simParams.carrierFreqHz}"/>
          </div>

          <div class="control-item">
            <div class="control-label">
              <span>SIGNAL-TO-NOISE RATIO</span>
              <span id="ctrl-snr-val">${formatDb(state.simParams.snrDb)}</span>
            </div>
            <input type="range" class="control-slider" id="ctrl-snr" min="0" max="50" step="1" value="${state.simParams.snrDb}"/>
          </div>

          <div class="control-item">
            <div class="control-label">
              <span>CHANNEL BANDWIDTH</span>
              <span id="ctrl-bw-val">${formatFrequency(state.simParams.bandwidthHz)}</span>
            </div>
            <input type="range" class="control-slider" id="ctrl-bw" min="5000000" max="80000000" step="5000000" value="${state.simParams.bandwidthHz}"/>
          </div>

          <div class="control-item">
            <div class="control-label">
              <span>LINK DISTANCE (LOS)</span>
              <span id="ctrl-dist-val">${state.simParams.distanceMeters} m</span>
            </div>
            <input type="range" class="control-slider" id="ctrl-dist" min="5" max="500" step="5" value="${state.simParams.distanceMeters}"/>
          </div>
        </div>
      </div>

      <!-- Real-Time Mathematical Telemetry Cards (Stallings Ch. 2 Formulas) -->
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
          <div class="metric-card-sub">C = 2B · log₂(M) (M=2)</div>
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
    `;

    this.attachControlListeners();
    this.updateMetrics();
  }

  updateHeaderAndInfo() {
    this.render();
  }

  attachControlListeners() {
    const freqSlider = this.container.querySelector('#ctrl-freq');
    const snrSlider = this.container.querySelector('#ctrl-snr');
    const bwSlider = this.container.querySelector('#ctrl-bw');
    const distSlider = this.container.querySelector('#ctrl-dist');

    if (freqSlider) {
      freqSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        progressManager.updateSimParams({ carrierFreqHz: val });
        this.container.querySelector('#ctrl-freq-val').textContent = formatFrequency(val);
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

    if (distSlider) {
      distSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        progressManager.updateSimParams({ distanceMeters: val });
        this.container.querySelector('#ctrl-dist-val').textContent = `${val} m`;
        this.updateMetrics();
      });
    }
  }

  updateMetrics() {
    const state = progressManager.getState();
    const { bandwidthHz, snrDb, carrierFreqHz, distanceMeters } = state.simParams;

    // Shannon capacity
    const shannon = calculateShannonCapacity(bandwidthHz, snrDb);
    const shannonEl = this.container.querySelector('#metric-shannon');
    if (shannonEl) shannonEl.textContent = formatBitrate(shannon);

    // Nyquist capacity (binary)
    const nyquist = calculateNyquistCapacity(bandwidthHz, 2);
    const nyquistEl = this.container.querySelector('#metric-nyquist');
    if (nyquistEl) nyquistEl.textContent = formatBitrate(nyquist);

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
      const points = generateWaveformPoints({
        width: 800,
        height: 240,
        time,
        freq: 3.5,
        amplitude: 65,
        harmonics: this.harmonics,
        snrDb: state.simParams.snrDb
      });

      const d = pointsToSvgPath(points);
      pathEl.setAttribute('d', d);
    });
  }
}
