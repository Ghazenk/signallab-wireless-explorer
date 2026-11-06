/**
 * SignalLab — Engineering Telemetry Header Component
 */
import { TEXTBOOK_META } from '../data/textbookData.js';
import { progressManager } from '../state/learningProgress.js';
import { formatFrequency } from '../utils/formatters.js';

export class Header {
  constructor(containerEl) {
    this.container = containerEl;
    this.clockInterval = null;
    this.render();
    this.startUtcClock();
  }

  render() {
    const state = progressManager.getState();
    this.container.innerHTML = `
      <div class="brand-group">
        <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" stroke="#00e5ff" stroke-width="2"/>
          <line x1="12" y1="22" x2="12" y2="12" stroke="#00e5ff" stroke-width="1.5"/>
          <line x1="2" y1="8.5" x2="12" y2="12" stroke="#00e5ff" stroke-width="1.5"/>
          <line x1="22" y1="8.5" x2="12" y2="12" stroke="#00e5ff" stroke-width="1.5"/>
        </svg>
        <div>
          <span class="brand-title">SIGNALLAB</span>
          <span class="brand-subtitle">WIRELESS COMMUNICATIONS EXPLORER</span>
        </div>
      </div>

      <!-- Protocol Explorer Style Telemetry Bar -->
      <div class="header-telemetry">
        <div class="telemetry-item" style="border-right: 1px solid rgba(255,255,255,0.08); padding-right: 14px;">
          <span style="font-size: 0.65rem; color: var(--text-dim); display: block;">NOW EXPLORING</span>
          <span class="telemetry-val" style="color: var(--accent-cyan); font-weight: 700;">CH 10 · CELLULAR WIRELESS</span>
        </div>

        <div class="telemetry-item" style="border-right: 1px solid rgba(255,255,255,0.08); padding-right: 14px;">
          <span style="font-size: 0.65rem; color: var(--text-dim); display: block;">RF FREQUENCY</span>
          <span class="telemetry-val" id="header-carrier-val">${formatFrequency(state.simParams.carrierFreqHz)}</span>
        </div>

        <div class="telemetry-item" style="border-right: 1px solid rgba(255,255,255,0.08); padding-right: 14px;">
          <span style="font-size: 0.65rem; color: var(--text-dim); display: block;">SIM ENGINE</span>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div class="status-dot"></div>
            <span class="telemetry-val" style="color: var(--status-ready); font-size: 0.75rem;">SYNCHRONIZED</span>
          </div>
        </div>

        <div class="telemetry-item">
          <span style="font-size: 0.65rem; color: var(--text-dim); display: block;">MASTER CLOCK</span>
          <span class="telemetry-val" id="header-utc-clock" style="color: var(--text-bright);">00:00:00 UTC</span>
        </div>
      </div>
    `;

    // Subscribe to state updates
    progressManager.subscribe(newState => {
      const carrierEl = document.getElementById('header-carrier-val');
      if (carrierEl) {
        carrierEl.textContent = formatFrequency(newState.simParams.carrierFreqHz);
      }
    });
  }

  startUtcClock() {
    const update = () => {
      const clockEl = document.getElementById('header-utc-clock');
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toTimeString().split(' ')[0];
      }
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  }

  destroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }
}
