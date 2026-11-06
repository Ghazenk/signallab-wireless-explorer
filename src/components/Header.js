/**
 * SignalLab — Engineering Telemetry Header & Layout Controls Component
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
    this.setupLayoutControls();
    this.setupSeparatorDrag();
  }

  render() {
    const state = progressManager.getState();
    this.container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <button class="btn-ctrl" id="btn-toggle-nav" title="Toggle Curriculum Navigator (Left Panel)" style="font-size: 0.8rem; padding: 4px 10px; display: flex; align-items: center; gap: 5px;">
          <span>☰</span>
          <span class="btn-lbl-text">NAV</span>
        </button>

        <div class="brand-group">
          <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" stroke="#00e5ff" stroke-width="2"/>
            <line x1="12" y1="22" x2="12" y2="12" stroke="#00e5ff" stroke-width="1.5"/>
            <line x1="2" y1="8.5" x2="12" y2="12" stroke="#00e5ff" stroke-width="1.5"/>
            <line x1="22" y1="8.5" x2="12" y2="12" stroke="#00e5ff" stroke-width="1.5"/>
          </svg>
          <div>
            <span class="brand-title">SIGNALLAB</span>
            <span class="brand-subtitle">WIRELESS EXPLORER</span>
          </div>
        </div>
      </div>

      <!-- Layout Quick Toggles & Telemetry Bar -->
      <div class="header-telemetry">
        <div class="telemetry-item" style="border-right: 1px solid rgba(255,255,255,0.08); padding-right: 12px;">
          <span style="font-size: 0.65rem; color: var(--text-dim); display: block;">CURRICULUM FOCUS</span>
          <span class="telemetry-val" style="color: var(--accent-cyan); font-weight: 700;">CH 10 · CELLULAR WIRELESS</span>
        </div>

        <div class="telemetry-item" style="border-right: 1px solid rgba(255,255,255,0.08); padding-right: 12px;">
          <span style="font-size: 0.65rem; color: var(--text-dim); display: block;">RF CARRIER</span>
          <span class="telemetry-val" id="header-carrier-val">${formatFrequency(state.simParams.carrierFreqHz)}</span>
        </div>

        <div class="telemetry-item" style="border-right: 1px solid rgba(255,255,255,0.08); padding-right: 12px;">
          <span style="font-size: 0.65rem; color: var(--text-dim); display: block;">SIM CLOCK</span>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div class="status-dot"></div>
            <span class="telemetry-val" id="header-utc-clock" style="color: var(--text-bright); font-size: 0.75rem;">00:00:00</span>
          </div>
        </div>

        <!-- Panel Toggle Buttons -->
        <div style="display: flex; gap: 6px; align-items: center;">
          <button class="btn-ctrl" id="btn-toggle-concepts" title="Toggle Concept & Formulas Panel (Right Panel)" style="font-size: 0.75rem; padding: 4px 10px;">
            <span>ℹ</span>
            <span class="btn-lbl-text">THEORY</span>
          </button>
          <button class="btn-ctrl" id="btn-toggle-timeline" title="Toggle Timeline / Telemetry Drawer" style="font-size: 0.75rem; padding: 4px 10px;">
            <span>⏱</span>
            <span class="btn-lbl-text">LOGS</span>
          </button>
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

  setupLayoutControls() {
    const navEl = document.getElementById('nav-mount');
    const conceptEl = document.getElementById('concept-mount');
    const timelineEl = document.getElementById('timeline-mount');
    const backdropEl = document.getElementById('drawer-backdrop');

    const btnNav = document.getElementById('btn-toggle-nav');
    const btnConcepts = document.getElementById('btn-toggle-concepts');
    const btnTimeline = document.getElementById('btn-toggle-timeline');

    const isMobile = () => window.innerWidth <= 768;
    const isTablet = () => window.innerWidth <= 900;

    const closeAllDrawers = () => {
      if (navEl) navEl.classList.remove('open-drawer');
      if (conceptEl) conceptEl.classList.remove('open-drawer');
      if (backdropEl) backdropEl.classList.remove('active');
    };

    if (backdropEl) {
      backdropEl.addEventListener('click', closeAllDrawers);
    }

    if (btnNav && navEl) {
      btnNav.addEventListener('click', () => {
        if (isMobile()) {
          const isOpen = navEl.classList.toggle('open-drawer');
          if (conceptEl) conceptEl.classList.remove('open-drawer');
          if (backdropEl) backdropEl.classList.toggle('active', isOpen);
        } else {
          navEl.classList.toggle('collapsed');
          btnNav.classList.toggle('active', !navEl.classList.contains('collapsed'));
        }
      });
    }

    if (btnConcepts && conceptEl) {
      btnConcepts.addEventListener('click', () => {
        if (isTablet()) {
          const isOpen = conceptEl.classList.toggle('open-drawer');
          if (navEl) navEl.classList.remove('open-drawer');
          if (backdropEl) backdropEl.classList.toggle('active', isOpen);
        } else {
          conceptEl.classList.toggle('collapsed');
          btnConcepts.classList.toggle('active', !conceptEl.classList.contains('collapsed'));
        }
      });
    }

    if (btnTimeline && timelineEl) {
      btnTimeline.addEventListener('click', () => {
        timelineEl.classList.toggle('collapsed');
        btnTimeline.classList.toggle('active', !timelineEl.classList.contains('collapsed'));
      });
    }
  }

  setupSeparatorDrag() {
    const sepLeft = document.getElementById('separator-left');
    const sepRight = document.getElementById('separator-right');
    const navEl = document.getElementById('nav-mount');
    const conceptEl = document.getElementById('concept-mount');

    // Left Separator Drag (Resize Navigator)
    if (sepLeft && navEl) {
      let isDragging = false;
      let startX = 0;
      let startW = 320;

      sepLeft.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startW = navEl.getBoundingClientRect().width;
        sepLeft.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      });

      // Click to toggle collapse/expand
      sepLeft.addEventListener('dblclick', () => {
        navEl.classList.toggle('collapsed');
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const delta = e.clientX - startX;
        const newW = Math.max(200, Math.min(500, startW + delta));
        document.documentElement.style.setProperty('--nav-width', `${newW}px`);
        if (navEl.classList.contains('collapsed')) {
          navEl.classList.remove('collapsed');
        }
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          sepLeft.classList.remove('dragging');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      });
    }

    // Right Separator Drag (Resize Concept Panel)
    if (sepRight && conceptEl) {
      let isDragging = false;
      let startX = 0;
      let startW = 380;

      sepRight.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startW = conceptEl.getBoundingClientRect().width;
        sepRight.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      });

      sepRight.addEventListener('dblclick', () => {
        conceptEl.classList.toggle('collapsed');
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const delta = startX - e.clientX;
        const newW = Math.max(240, Math.min(550, startW + delta));
        document.documentElement.style.setProperty('--concept-width', `${newW}px`);
        if (conceptEl.classList.contains('collapsed')) {
          conceptEl.classList.remove('collapsed');
        }
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          sepRight.classList.remove('dragging');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      });
    }
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
