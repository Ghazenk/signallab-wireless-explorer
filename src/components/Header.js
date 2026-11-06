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
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
          <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
        </svg>
        <div>
          <span class="brand-title">SIGNALLAB</span>
          <span class="brand-subtitle">WIRELESS EXPLORER</span>
        </div>
      </div>

      <div class="header-telemetry">
        <div class="telemetry-item" title="Verified Primary Reference Textbook">
          <span class="telemetry-label">SOURCE:</span>
          <span class="telemetry-val">STALLINGS 2E</span>
        </div>

        <div class="telemetry-item" title="Active Carrier Frequency">
          <span class="telemetry-label">CARRIER:</span>
          <span class="telemetry-val" id="header-carrier-val">${formatFrequency(state.simParams.carrierFreqHz)}</span>
        </div>

        <div class="telemetry-item" title="Engine Status">
          <div class="status-dot"></div>
          <span class="telemetry-val" style="color: var(--status-ready);">CALIBRATED</span>
        </div>

        <div class="telemetry-item" title="Simulation Master Clock (UTC)">
          <span class="telemetry-label">UTC:</span>
          <span class="telemetry-val" id="header-utc-clock">00:00:00</span>
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
