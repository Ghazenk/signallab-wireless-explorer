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
          <div style="font-family: var(--font-heading); font-size: 0.85rem; font-weight: 700; color: var(--text-bright); margin-right: 12px; letter-spacing: 0.05em;">
            PACKET & RADIO FLOW
          </div>
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
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-dim);">
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #00e5ff; margin-right: 4px;"></span> RF Burst
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #00ff9d; margin: 0 4px 0 8px;"></span> Frame ACK
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #ffb703; margin: 0 4px 0 8px;"></span> Control Ch
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-bright);">
            <span style="color: var(--text-dim); font-size: 0.7rem; margin-right: 4px;">SIM T:</span>
            <span id="sim-clock-display" style="color: var(--accent-cyan); font-weight: 700;">00:00.000</span>
          </div>
        </div>
      </div>

      <!-- Protocol Explorer Wireshark-Style Live Packet Flow Table -->
      <div style="background: #020408; border-top: 1px solid var(--border-subtle); padding: 6px 16px; font-family: var(--font-mono); font-size: 0.75rem; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;" id="packet-flow-table">
          <thead>
            <tr style="color: #64748b; border-bottom: 1px solid #1e293b; font-size: 0.7rem;">
              <th style="padding: 4px 8px; width: 40px;">NO.</th>
              <th style="padding: 4px 8px; width: 80px;">TIME</th>
              <th style="padding: 4px 8px; width: 130px;">SOURCE</th>
              <th style="padding: 4px 8px; width: 130px;">DESTINATION</th>
              <th style="padding: 4px 8px; width: 90px;">PROTOCOL</th>
              <th style="padding: 4px 8px;">INFO</th>
              <th style="padding: 4px 8px; width: 60px; text-align: right;">SIZE</th>
            </tr>
          </thead>
          <tbody id="packet-flow-tbody" style="color: #cbd5e1;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
              <td style="padding: 4px 8px; color: #38bdf8;">1</td>
              <td style="padding: 4px 8px;">0.000s</td>
              <td style="padding: 4px 8px;">192.168.1.10</td>
              <td style="padding: 4px 8px;">BS-A (Cellular)</td>
              <td style="padding: 4px 8px;"><span style="background: rgba(0,229,255,0.15); color: #00e5ff; padding: 1px 5px; border-radius: 3px; font-size: 0.65rem;">RF-CDMA</span></td>
              <td style="padding: 4px 8px;">Forward Link Pilot Acquisition & Channel Request</td>
              <td style="padding: 4px 8px; text-align: right;">64 B</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
              <td style="padding: 4px 8px; color: #38bdf8;">2</td>
              <td style="padding: 4px 8px;">0.040s</td>
              <td style="padding: 4px 8px;">BS-A (Cellular)</td>
              <td style="padding: 4px 8px;">BSC / Router</td>
              <td style="padding: 4px 8px;"><span style="background: rgba(56,189,248,0.15); color: #38bdf8; padding: 1px 5px; border-radius: 3px; font-size: 0.65rem;">GTP-U</span></td>
              <td style="padding: 4px 8px;">Tunnel Setup & Call Paging Initiation</td>
              <td style="padding: 4px 8px; text-align: right;">96 B</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
              <td style="padding: 4px 8px; color: #38bdf8;">3</td>
              <td style="padding: 4px 8px;">0.085s</td>
              <td style="padding: 4px 8px;">10.0.0.1</td>
              <td style="padding: 4px 8px;">8.8.8.8</td>
              <td style="padding: 4px 8px;"><span style="background: rgba(0,255,157,0.15); color: #00ff9d; padding: 1px 5px; border-radius: 3px; font-size: 0.65rem;">UDP / DNS</span></td>
              <td style="padding: 4px 8px;">Standard query 0x1a4b A example.com</td>
              <td style="padding: 4px 8px; text-align: right;">75 B</td>
            </tr>
          </tbody>
        </table>
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
