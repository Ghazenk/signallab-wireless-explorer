/**
 * SignalLab — Bottom Timeline & Event Telemetry Component
 */
import { simEngine } from '../simulations/engine.js';
import { progressManager } from '../state/learningProgress.js';
import { formatTime } from '../utils/formatters.js';

export class Timeline {
  constructor(containerEl) {
    this.container = containerEl;
    this.render();
    this.setupListeners();
  }

  render() {
    const state = progressManager.getState();

    this.container.innerHTML = `
      <div class="timeline-bar">
        <div class="timeline-controls">
          <button class="btn-ctrl ${state.simParams.isPlaying ? 'active' : ''}" id="btn-play-pause">
            <span id="play-pause-icon">${state.simParams.isPlaying ? '⏸ PAUSE' : '▶ PLAY'}</span>
          </button>
          <button class="btn-ctrl" id="btn-step" title="Advance one simulation frame">
            <span>⏯ STEP</span>
          </button>
          <button class="btn-ctrl" id="btn-reset" title="Reset simulation clock">
            <span>↺ RESET</span>
          </button>

          <div style="margin-left: 12px; display: flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 0.75rem;">
            <span style="color: var(--text-dim);">SPEED:</span>
            <button class="btn-ctrl speed-btn ${state.simParams.clockSpeed === 0.5 ? 'active' : ''}" data-speed="0.5">0.5x</button>
            <button class="btn-ctrl speed-btn ${state.simParams.clockSpeed === 1.0 ? 'active' : ''}" data-speed="1.0">1.0x</button>
            <button class="btn-ctrl speed-btn ${state.simParams.clockSpeed === 2.0 ? 'active' : ''}" data-speed="2.0">2.0x</button>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-bright);">
            <span style="color: var(--text-dim); font-size: 0.7rem; margin-right: 4px;">SIM T:</span>
            <span id="sim-clock-display" style="color: var(--accent-cyan); font-weight: 700;">00:00.000</span>
          </div>
        </div>
      </div>

      <!-- Real-Time Telemetry Stream Logger -->
      <div class="telemetry-logger" id="telemetry-log-container">
        ${this.buildLogsHtml(state.telemetryLogs)}
      </div>
    `;

    this.attachEvents();
  }

  buildLogsHtml(logs) {
    return logs.map(log => {
      const timeStr = log.timestamp.split('T')[1].slice(0, 8);
      return `
        <div class="log-entry">
          <span class="log-time">[${timeStr}]</span>
          <span class="log-source">&lt;${log.source}&gt;</span>
          <span class="log-msg">${log.message}</span>
        </div>
      `;
    }).join('');
  }

  attachEvents() {
    const playPauseBtn = this.container.querySelector('#btn-play-pause');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        progressManager.togglePlayPause();
        const state = progressManager.getState();
        simEngine.setRunning(state.simParams.isPlaying);
        this.render();
      });
    }

    const stepBtn = this.container.querySelector('#btn-step');
    if (stepBtn) {
      stepBtn.addEventListener('click', () => {
        simEngine.step(0.05);
      });
    }

    const resetBtn = this.container.querySelector('#btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        simEngine.reset();
        progressManager.addLog('SIM', 'Simulation clock reset to 00:00.000');
      });
    }

    const speedBtns = this.container.querySelectorAll('.speed-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.getAttribute('data-speed'));
        simEngine.setTimeScale(speed);
        progressManager.updateSimParams({ clockSpeed: speed });
        progressManager.addLog('CLOCK', `Simulation rate set to ${speed}x`);
        this.render();
      });
    });
  }

  setupListeners() {
    simEngine.subscribe((time) => {
      const clockEl = this.container.querySelector('#sim-clock-display');
      if (clockEl) {
        clockEl.textContent = formatTime(time);
      }
    });

    progressManager.subscribe((state) => {
      const logContainer = this.container.querySelector('#telemetry-log-container');
      if (logContainer) {
        logContainer.innerHTML = this.buildLogsHtml(state.telemetryLogs);
      }
    });
  }
}
