/**
 * SignalLab — Chapter 2: Transmission Fundamentals (Complete Interactive Mastery Module)
 * William Stallings, Wireless Communications and Networks, 2nd Edition (pp. 14–45)
 * 
 * Fully Covers:
 * - §2.1 Signals for Conveying Information (Time & Frequency Domain, Fourier Decomposition, Data Rate vs Bandwidth)
 * - §2.2 Analog and Digital Data Transmission (Data vs Signaling vs Transmission, Amplifiers vs Repeaters)
 * - §2.3 Channel Capacity (Nyquist Bandwidth vs Shannon Capacity, Noise/Error Relationship)
 * - §2.4 Transmission Media (Terrestrial Microwave, Satellite 4/6 & 12/14 GHz, Broadcast Radio, Infrared)
 * - §2.5 Multiplexing (Frequency Division Multiplexing FDM vs Synchronous Time Division Multiplexing TDM)
 * - Appendix 2A Decibels & Signal Strength (dB, dBW, dBm, Attenuation, Power Ratios)
 * - §2.7 Key Terms, Review Questions & Numerical Problems (Stallings 2.1 – 2.17)
 */

import { simEngine } from '../simulations/engine.js';
import { generateWaveformPoints, pointsToSvgPath } from '../utils/svgUtils.js';
import { calculateNyquistCapacity, calculateShannonCapacity, calculateFreeSpaceLoss } from '../utils/mathUtils.js';
import { formatFrequency, formatBitrate, formatDb } from '../utils/formatters.js';
import { drawIsometricLaptop, drawIsometricRouter, drawIsometricBaseStation, drawIsometricServer, drawIsometricCloud, drawIsometricPhone } from '../utils/isoGraphics.js';

export function renderChapter2(container, state, progressManager) {
  const currentSec = state.activeSectionId && state.activeSectionId.startsWith('sec-2')
    ? state.activeSectionId
    : 'sec-2.1';

  container.innerHTML = `
    <div class="lesson-container">
      <!-- Complete Section Selector Navigation -->
      <div class="lesson-nav-tabs">
        <button class="lesson-tab-btn ${currentSec === 'sec-2.1' ? 'active' : ''}" data-sec="sec-2.1">
          2.1 Signals & Fourier Synthesis
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-2.2' ? 'active' : ''}" data-sec="sec-2.2">
          2.2 Analog & Digital Transmission
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-2.3' ? 'active' : ''}" data-sec="sec-2.3">
          2.3 Nyquist & Shannon Capacity
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-2.4' ? 'active' : ''}" data-sec="sec-2.4">
          2.4 Wireless Media Explorer
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-2.5' ? 'active' : ''}" data-sec="sec-2.5">
          2.5 Multiplexing: FDM vs TDM
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-2.app' ? 'active' : ''}" data-sec="sec-2.app">
          App. 2A Decibels & Link Budget
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-2.problems' ? 'active' : ''}" data-sec="sec-2.problems">
          2.7 Numerical Problems & Review
        </button>
      </div>

      <div class="lesson-body" id="ch2-content">
        ${getSectionContent(currentSec, state)}
      </div>
    </div>
  `;

  // Attach tab switching listeners
  const tabs = container.querySelectorAll('.lesson-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const secId = e.currentTarget.getAttribute('data-sec');
      progressManager.setActiveSection(secId);
      tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-sec') === secId));
      const contentEl = container.querySelector('#ch2-content');
      if (contentEl) {
        contentEl.innerHTML = getSectionContent(secId, progressManager.getState());
        attachSubEvents(container, secId, progressManager);
      }
    });
  });

  attachSubEvents(container, currentSec, progressManager);
}

function getSectionContent(secId, state) {
  switch (secId) {
    case 'sec-2.1':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 2.1 — TEXTBOOK PP. 15–22</div>
          <h2 class="lesson-title">Signals for Conveying Information: Time vs. Frequency Domain & Fourier Decomposition</h2>
          <p class="lesson-text">
            In wireless telecommunications, an electromagnetic signal is fundamentally a function of time, but its <strong>frequency domain</strong> view is far more critical to understanding channel transmission characteristics, attenuation, and bandwidth requirements.
          </p>

          <div class="formula-box-large">
            s(t) = A · sin(2π f t + φ)   [Equation 2.1: Fundamental Sinusoid]
          </div>
          <p class="lesson-text">
            Where <strong>A</strong> is Peak Amplitude (Volts), <strong>f = 1/T</strong> is Frequency in Hertz (cycles per second), and <strong>φ</strong> is Phase Shift in Radians ($2\pi\text{ rad} = 360^\circ$).
          </p>

          <!-- Dual-Domain Live Animated Lab -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>INTERACTIVE FOURIER HARMONICS SYNTHESIZER (TIME & FREQUENCY DOMAINS)</span>
              <span class="panel-tag" id="ch2-engine-status">LIVE SYNTHESIS ENGINE</span>
            </div>

            <!-- Oscilloscope Canvas for Time Domain & Frequency Spectrum -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div class="ch2-oscilloscope-box" style="margin-bottom: 0;">
                <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-cyan); padding: 6px 10px; background: rgba(0,229,255,0.05); border-bottom: 1px solid rgba(0,229,255,0.1);">
                  TIME DOMAIN: s(t) WAVEFORM SYNTHESIS
                </div>
                <svg viewBox="0 0 500 180" class="ch2-svg" id="ch2-scope-svg" style="height: 180px;">
                  <defs>
                    <pattern id="ch2-grid-small" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 229, 255, 0.08)" stroke-width="1"/>
                    </pattern>
                  </defs>
                  <rect width="500" height="180" fill="#040812"/>
                  <rect width="500" height="180" fill="url(#ch2-grid-small)"/>
                  <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(0, 229, 255, 0.25)" stroke-dasharray="4 4"/>
                  <path id="ch2-wave-path" d="" fill="none" stroke="#00e5ff" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>

              <div class="ch2-oscilloscope-box" style="margin-bottom: 0;">
                <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-sky); padding: 6px 10px; background: rgba(56,189,248,0.05); border-bottom: 1px solid rgba(56,189,248,0.1);">
                  FREQUENCY DOMAIN: DISCRETE SPECTRUM
                </div>
                <svg viewBox="0 0 250 180" class="ch2-svg" id="ch2-spectrum-svg" style="height: 180px;">
                  <rect width="250" height="180" fill="#040812"/>
                  <line x1="20" y1="160" x2="240" y2="160" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
                  <line x1="20" y1="20" x2="20" y2="160" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
                  <!-- Discrete Fourier Harmonic Bars -->
                  <g id="ch2-spectrum-bars"></g>
                  <text x="210" y="174" fill="#64748b" font-size="9" font-family="monospace">Freq</text>
                  <text x="25" y="30" fill="#64748b" font-size="9" font-family="monospace">Amp</text>
                </svg>
              </div>
            </div>

            <!-- Waveform Controls: Amplitude, Frequency, Phase, Harmonics -->
            <div class="ch2-controls-grid">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>AMPLITUDE (A)</span>
                  <span id="ch2-val-amp">1.00 V</span>
                </div>
                <input type="range" id="ch2-slider-amp" min="10" max="80" value="45" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>FREQUENCY (f)</span>
                  <span id="ch2-val-freq">2.00 Hz</span>
                </div>
                <input type="range" id="ch2-slider-freq" min="1" max="8" step="0.5" value="2" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>PHASE SHIFT (φ)</span>
                  <span id="ch2-val-phase">0.00 rad (0°)</span>
                </div>
                <input type="range" id="ch2-slider-phase" min="0" max="6.28" step="0.314" value="0" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>FOURIER HARMONICS (Odd n)</span>
                  <span id="ch2-val-harm">1 Harmonic (Pure Sine)</span>
                </div>
                <select id="ch2-select-harm" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="1">1 Harmonic: Fundamental sin(2πft)</option>
                  <option value="3">3 Harmonics: + (1/3)sin(6πft)</option>
                  <option value="5">5 Harmonics: + (1/5)sin(10πft)</option>
                  <option value="9">9 Harmonics: Approximating Square Wave</option>
                  <option value="25">25 Harmonics: Sharp Digital Pulse</option>
                </select>
              </div>
            </div>

            <div class="callout-box" style="margin-top: 14px;">
              <strong>Relationship between Data Rate and Bandwidth (Stallings p. 21):</strong> The greater the channel bandwidth, the more Fourier harmonics can pass through without attenuation. Retaining higher harmonics sharpens pulse transitions, reducing bit-detection errors at high data rates.
            </div>
          </div>
        </div>
      `;

    case 'sec-2.2':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 2.2 — TEXTBOOK PP. 22–27</div>
          <h2 class="lesson-title">Analog and Digital Data Transmission: Data, Signaling, and Transmission</h2>
          <p class="lesson-text">
            Stallings highlights a critical engineering taxonomy often confused by newcomers: the precise distinction between <strong>Data</strong> (the information entity), <strong>Signaling</strong> (the physical electromagnetic waveform), and <strong>Transmission</strong> (the repeaters/amplifiers propagation infrastructure).
          </p>

          <!-- Interactive Taxonomy Matrix -->
          <div class="taxonomy-table-container">
            <table class="taxonomy-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Analog Representation</th>
                  <th>Digital Representation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Data (§2.2.1)</strong></td>
                  <td>Continuous acoustic or sensory intensity (e.g., human speech 100 Hz–7 kHz, 25 dB dynamic range).</td>
                  <td>Discrete symbolic values (e.g., binary bitstrings, ASCII alphanumeric text).</td>
                </tr>
                <tr>
                  <td><strong>Signaling (§2.2.2)</strong></td>
                  <td>Continuously varying electromagnetic wave modulated across wireless RF spectrum.</td>
                  <td>Discrete sequence of discontinuous voltage levels (e.g. NRZ high/low levels).</td>
                </tr>
                <tr>
                  <td><strong>Transmission (§2.2.3)</strong></td>
                  <td>Propagated via <strong>Amplifiers</strong>. Amplifiers indiscriminately amplify both signal and noise, compounding distortion over distance.</td>
                  <td>Propagated via <strong>Regenerative Repeaters</strong>. A repeater samples the incoming pulses, recovers 1s and 0s, and re-radiates a brand new clean digital pulse stream!</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Real-World Engineering Transmission System Simulator -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>REAL-WORLD HARDWARE TRANSMISSION SIMULATION: TX CHASSIS, CASCADED CHANNEL HOPS & RECOVERY</span>
              <span class="panel-tag" id="transmission-clock-tag">MULTI-STAGE PROPAGATION ACTIVE</span>
            </div>

            <!-- Mode Selection & Channel Noise Control -->
            <div style="display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;">
              <button class="btn-ctrl active" id="btn-mode-amp" style="flex: 1; min-width: 260px;">
                ⚡ ANALOG TRANSMISSION: CASCADED RF AMPLIFIERS (NOISE COMPOUNDING)
              </button>
              <button class="btn-ctrl" id="btn-mode-rep" style="flex: 1; min-width: 260px;">
                🛡️ DIGITAL TRANSMISSION: REGENERATIVE REPEATERS (RE-CLOCK & RE-SHAPE)
              </button>
            </div>

            <!-- Advanced Real-World Device Rack Architecture SVG -->
            <div style="background: #03060c; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; overflow-x: auto;">
              <svg viewBox="0 0 920 380" style="width: 100%; min-width: 820px; height: 380px;" id="amp-rep-svg">
                <defs>
                  <linearGradient id="chassis-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#1e293b"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                  </linearGradient>
                  <linearGradient id="cable-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#00e5ff"/>
                    <stop offset="100%" stop-color="#38bdf8"/>
                  </linearGradient>
                  <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                  </filter>
                  <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                  </filter>
                </defs>

                <!-- ================= 1. TX TRANSMITTER CHASSIS ================= -->
                <g id="rack-tx">
                  <!-- Chassis Box -->
                  <rect x="15" y="20" width="160" height="95" fill="url(#chassis-grad)" stroke="#00e5ff" stroke-width="1.5" rx="6"/>
                  <!-- Rack Screws -->
                  <circle cx="25" cy="30" r="3" fill="#64748b"/>
                  <circle cx="25" cy="105" r="3" fill="#64748b"/>
                  <circle cx="165" cy="30" r="3" fill="#64748b"/>
                  <circle cx="165" cy="105" r="3" fill="#64748b"/>
                  <!-- Header & Status -->
                  <text x="35" y="42" fill="#00e5ff" font-size="11" font-family="monospace" font-weight="700">TX GENERATOR</text>
                  <circle cx="145" cy="38" r="4" fill="#00ff9d" id="tx-led-pulse"/>
                  <!-- LCD Display Window -->
                  <rect x="35" y="52" width="120" height="32" fill="#02040a" stroke="rgba(0,229,255,0.2)" rx="2"/>
                  <text x="42" y="66" fill="#38bdf8" font-size="9" font-family="monospace" id="tx-display-mode">SIG: CLEAN SINE</text>
                  <text x="42" y="78" fill="#94a3b8" font-size="8" font-family="monospace">PWR: +20 dBm 50Ω</text>
                  <!-- Output BNC Connector Port -->
                  <rect x="170" y="60" width="10" height="14" fill="#94a3b8" rx="1"/>
                  <circle cx="175" cy="67" r="3" fill="#00e5ff"/>
                  <text x="135" y="100" fill="#64748b" font-size="8" font-family="monospace">OUT 1</text>
                </g>

                <!-- Stage 1 Transmission Line (Cable/Atmosphere with noise injection) -->
                <line x1="180" y1="67" x2="310" y2="67" stroke="#334155" stroke-width="4"/>
                <line x1="180" y1="67" x2="310" y2="67" stroke="#00e5ff" stroke-width="2" stroke-dasharray="6 4" id="line-flow-1"/>
                <rect x="205" y="32" width="80" height="20" fill="#0b1122" stroke="rgba(255,183,3,0.3)" rx="3"/>
                <text x="212" y="45" fill="#ffb703" font-size="8" font-family="monospace">⚡ AWGN HOP 1</text>

                <!-- ================= 2. INTERMEDIATE HOP 1 (AMP or REPEATER) ================= -->
                <g id="rack-stage-1">
                  <rect x="310" y="20" width="165" height="95" fill="url(#chassis-grad)" stroke="#38bdf8" stroke-width="1.5" rx="6"/>
                  <circle cx="320" cy="30" r="3" fill="#64748b"/>
                  <circle cx="320" cy="105" r="3" fill="#64748b"/>
                  <circle cx="465" cy="30" r="3" fill="#64748b"/>
                  <circle cx="465" cy="105" r="3" fill="#64748b"/>
                  <text x="330" y="42" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="700" id="stage1-hw-name">ANALOG AMP #1</text>
                  <circle cx="445" cy="38" r="4" fill="#00ff9d" id="stage1-led"/>
                  <rect x="330" y="52" width="125" height="32" fill="#02040a" stroke="rgba(56,189,248,0.2)" rx="2"/>
                  <text x="338" y="66" fill="#ffb703" font-size="9" font-family="monospace" id="stage1-display-line1">GAIN: +12 dB</text>
                  <text x="338" y="78" fill="#94a3b8" font-size="8" font-family="monospace" id="stage1-display-line2">BOOSTS NOISE</text>
                  <rect x="300" y="60" width="10" height="14" fill="#94a3b8" rx="1"/>
                  <rect x="470" y="60" width="10" height="14" fill="#94a3b8" rx="1"/>
                </g>

                <!-- Stage 2 Transmission Line -->
                <line x1="480" y1="67" x2="610" y2="67" stroke="#334155" stroke-width="4"/>
                <line x1="480" y1="67" x2="610" y2="67" stroke="#00e5ff" stroke-width="2" stroke-dasharray="6 4" id="line-flow-2"/>
                <rect x="505" y="32" width="80" height="20" fill="#0b1122" stroke="rgba(255,183,3,0.3)" rx="3"/>
                <text x="512" y="45" fill="#ffb703" font-size="8" font-family="monospace">⚡ AWGN HOP 2</text>

                <!-- ================= 3. INTERMEDIATE HOP 2 (AMP or REPEATER) ================= -->
                <g id="rack-stage-2">
                  <rect x="610" y="20" width="165" height="95" fill="url(#chassis-grad)" stroke="#38bdf8" stroke-width="1.5" rx="6"/>
                  <circle cx="620" cy="30" r="3" fill="#64748b"/>
                  <circle cx="620" cy="105" r="3" fill="#64748b"/>
                  <circle cx="765" cy="30" r="3" fill="#64748b"/>
                  <circle cx="765" cy="105" r="3" fill="#64748b"/>
                  <text x="630" y="42" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="700" id="stage2-hw-name">ANALOG AMP #2</text>
                  <circle cx="745" cy="38" r="4" fill="#00ff9d" id="stage2-led"/>
                  <rect x="630" y="52" width="125" height="32" fill="#02040a" stroke="rgba(56,189,248,0.2)" rx="2"/>
                  <text x="638" y="66" fill="#ff0055" font-size="9" font-family="monospace" id="stage2-display-line1">COMPOUNDED NOISE</text>
                  <text x="638" y="78" fill="#94a3b8" font-size="8" font-family="monospace" id="stage2-display-line2">SNR DROPS TO 8dB</text>
                  <rect x="600" y="60" width="10" height="14" fill="#94a3b8" rx="1"/>
                  <rect x="770" y="60" width="10" height="14" fill="#94a3b8" rx="1"/>
                </g>

                <!-- Line to RX -->
                <line x1="780" y1="67" x2="840" y2="67" stroke="#334155" stroke-width="4"/>
                <line x1="780" y1="67" x2="840" y2="67" stroke="#00e5ff" stroke-width="2" stroke-dasharray="6 4" id="line-flow-3"/>

                <!-- ================= 4. RX SINK RECEIVER ================= -->
                <g id="rack-rx">
                  <rect x="840" y="20" width="65" height="95" fill="url(#chassis-grad)" stroke="#00ff9d" stroke-width="1.5" rx="6"/>
                  <text x="850" y="42" fill="#00ff9d" font-size="10" font-family="monospace" font-weight="700">RX SINK</text>
                  <rect x="846" y="52" width="52" height="32" fill="#02040a" stroke="rgba(0,255,157,0.2)" rx="2"/>
                  <text x="850" y="67" fill="#00ff9d" font-size="9" font-family="monospace" id="rx-display-status">DEC: OK</text>
                  <circle cx="872" cy="98" r="4" fill="#00ff9d" id="rx-decision-led"/>
                </g>

                <!-- ================= 5. LIVE REAL-TIME OSCILLOSCOPE TAP TRACES ================= -->
                <!-- Oscilloscope Enclosure Background -->
                <rect x="15" y="130" width="890" height="235" fill="#020408" stroke="rgba(0,229,255,0.2)" rx="6"/>

                <!-- Oscilloscope Division Grid -->
                <g opacity="0.12">
                  <line x1="15" y1="185" x2="905" y2="185" stroke="#00e5ff" stroke-width="1"/>
                  <line x1="15" y1="245" x2="905" y2="245" stroke="#00e5ff" stroke-width="1"/>
                  <line x1="15" y1="305" x2="905" y2="305" stroke="#00e5ff" stroke-width="1"/>
                  <line x1="240" y1="130" x2="240" y2="365" stroke="#00e5ff" stroke-width="1"/>
                  <line x1="470" y1="130" x2="470" y2="365" stroke="#00e5ff" stroke-width="1"/>
                  <line x1="700" y1="130" x2="700" y2="365" stroke="#00e5ff" stroke-width="1"/>
                </g>

                <!-- Probe 1 (At TX Output) -->
                <g id="probe-1-view">
                  <text x="25" y="148" fill="#00e5ff" font-size="10" font-family="monospace" font-weight="700">PROBE A: TRANSMITTER OUTPUT</text>
                  <text x="25" y="160" fill="#64748b" font-size="8" font-family="monospace">Clean Pure Signal (No channel distortion)</text>
                  <path id="wave-probe-a" d="" fill="none" stroke="#00e5ff" stroke-width="2.2" stroke-linecap="round"/>
                </g>

                <!-- Probe 2 (After Hop 1) -->
                <g id="probe-2-view">
                  <text x="250" y="148" fill="#38bdf8" font-size="10" font-family="monospace" font-weight="700">PROBE B: POST-STAGE 1</text>
                  <text x="250" y="160" fill="#64748b" font-size="8" font-family="monospace" id="probe-b-desc">Amplified + First Noise Layer</text>
                  <path id="wave-probe-b" d="" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"/>
                </g>

                <!-- Probe 3 (After Hop 2) -->
                <g id="probe-3-view">
                  <text x="480" y="148" fill="#ffb703" font-size="10" font-family="monospace" font-weight="700">PROBE C: POST-STAGE 2</text>
                  <text x="480" y="160" fill="#64748b" font-size="8" font-family="monospace" id="probe-c-desc">Cascaded Compounded Noise</text>
                  <path id="wave-probe-c" d="" fill="none" stroke="#ffb703" stroke-width="2.2" stroke-linecap="round"/>
                </g>

                <!-- Probe 4 (At Receiver Sink Decision Point) -->
                <g id="probe-4-view">
                  <text x="710" y="148" fill="#00ff9d" font-size="10" font-family="monospace" font-weight="700">PROBE D: RX SINK RECOVERY</text>
                  <text x="710" y="160" fill="#64748b" font-size="8" font-family="monospace" id="probe-d-desc">Severe Distortion / Signal Degraded</text>
                  <path id="wave-probe-d" d="" fill="none" stroke="#00ff9d" stroke-width="2.2" stroke-linecap="round"/>
                </g>

                <!-- Real-time Status Banner at bottom of Oscilloscope -->
                <rect x="25" y="325" width="870" height="30" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.08)" rx="3"/>
                <text x="35" y="344" fill="#e2e8f0" font-size="10" font-family="monospace" id="transmission-telemetry-banner">
                  STATUS: Analog Mode Active — Amplifiers boost signal along with accumulated channel noise; severe cascaded SNR degradation.
                </text>
              </svg>
            </div>
          </div>
        </div>
      `;

    case 'sec-2.3':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 2.3 — TEXTBOOK PP. 27–31</div>
          <h2 class="lesson-title">Channel Capacity: Nyquist Formulation vs. Shannon Capacity Limit</h2>
          <p class="lesson-text">
            In wireless transmission, the maximum theoretical data rate achievable over any physical link is constrained by two foundational laws of information theory:
          </p>

          <div class="comparison-cards-grid">
            <div class="comp-card">
              <div class="comp-header nyquist-header">
                <span>NYQUIST FORMULATION</span>
                <span class="comp-eq">EQ. 2.12</span>
              </div>
              <div class="comp-body">
                <div class="comp-formula">C = 2 · B · log₂(M)</div>
                <p><strong>Condition:</strong> Noiseless channel limited purely by intersymbol interference (delay distortion).</p>
                <p><strong>Stallings Principle:</strong> For binary signals ($M=2$), capacity $C = 2B$. Using $M$-level signaling ($M=4$ for QPSK, $M=16$ for 16-QAM, $M=64$ for 64-QAM) increases capacity by encoding $\log_2(M)$ bits per signal pulse.</p>
              </div>
            </div>

            <div class="comp-card">
              <div class="comp-header shannon-header">
                <span>SHANNON CAPACITY FORMULA</span>
                <span class="comp-eq">EQ. 2.13</span>
              </div>
              <div class="comp-body">
                <div class="comp-formula">C = B · log₂(1 + SNR)</div>
                <p><strong>Condition:</strong> Channel corrupted by Additive White Gaussian Noise (AWGN).</p>
                <p><strong>Stallings Principle:</strong> Represents the absolute theoretical upper bound on error-free data transmission. As bandwidth $B$ increases, noise power admitted ($N = kTB$) increases, causing SNR to drop.</p>
              </div>
            </div>
          </div>

          <!-- Interactive Channel Capacity Benchmarking Engine -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>WORKED EXAMPLE CALCULATOR & BENCHMARK (STALLINGS EXAMPLES 2.4 & 2.5)</span>
              <span class="panel-tag">LIVE DYNAMIC EVALUATION</span>
            </div>

            <div class="ch2-controls-grid">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>CHANNEL BANDWIDTH (B)</span>
                  <span id="ch2-calc-bw-val">20.0 MHz</span>
                </div>
                <input type="range" id="ch2-calc-bw" min="1000000" max="100000000" step="1000000" value="20000000" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>SIGNAL-TO-NOISE RATIO (SNR)</span>
                  <span id="ch2-calc-snr-val">+25.0 dB</span>
                </div>
                <input type="range" id="ch2-calc-snr" min="0" max="50" step="1" value="25" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>MODULATION LEVELS (M)</span>
                  <span id="ch2-calc-m-val">M=4 (2 bits/sym)</span>
                </div>
                <select id="ch2-calc-m" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="2">M=2 (Binary BPSK: 1 bit/sym)</option>
                  <option value="4" selected>M=4 (QPSK: 2 bits/sym)</option>
                  <option value="8">M=8 (8-PSK: 3 bits/sym)</option>
                  <option value="16">M=16 (16-QAM: 4 bits/sym)</option>
                  <option value="64">M=64 (64-QAM: 6 bits/sym)</option>
                </select>
              </div>
            </div>

            <div class="calc-results-grid">
              <div class="res-card">
                <div class="res-title">NYQUIST BIT RATE (NOISELESS)</div>
                <div class="res-val" id="ch2-out-nyquist">80.00 Mbps</div>
                <div class="res-sub" id="ch2-out-nyquist-sub">C = 2 · 20MHz · 2 = 80.0 Mbps</div>
              </div>

              <div class="res-card highlight">
                <div class="res-title">SHANNON CAPACITY LIMIT (WITH NOISE)</div>
                <div class="res-val" id="ch2-out-shannon">166.11 Mbps</div>
                <div class="res-sub" id="ch2-out-shannon-sub">C = 20MHz · log₂(1 + 316.23)</div>
              </div>

              <div class="res-card">
                <div class="res-title">SPECTRAL EFFICIENCY (C / B)</div>
                <div class="res-val" id="ch2-out-eff">8.31 bps/Hz</div>
                <div class="res-sub">Throughput density per Hertz of spectrum</div>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'sec-2.4':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 2.4 — TEXTBOOK PP. 31–36</div>
          <h2 class="lesson-title">Wireless Transmission Media: Terrestrial Microwave, Satellite, Broadcast Radio & Infrared</h2>
          <p class="lesson-text">
            For unguided (wireless) transmission, electromagnetic waves radiate through the atmosphere or space. The frequency band determines propagation behavior, antenna design, atmospheric attenuation, and line-of-sight constraints.
          </p>

          <!-- Interactive Wireless Media Selector -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>EXPLORE WIRELESS TRANSMISSION MEDIA CHARACTERISTICS</span>
              <span class="panel-tag">CLICK A MEDIUM TO INSPECT RF PARAMETERS</span>
            </div>

            <div class="spectrum-interactive-grid">
              <div class="milestone-btn active" id="btn-media-terrestrial" data-media="terrestrial">
                <span class="m-year">2–40 GHz</span>
                <span class="m-tech">Terrestrial Microwave</span>
                <span class="m-freq">Directional Dishes (10–100 km)</span>
              </div>
              <div class="milestone-btn" id="btn-media-satellite" data-media="satellite">
                <span class="m-year">4/6 & 12/14 GHz</span>
                <span class="m-tech">Satellite Microwave</span>
                <span class="m-freq">GEO Relay (250 ms delay)</span>
              </div>
              <div class="milestone-btn" id="btn-media-radio" data-media="radio">
                <span class="m-year">30 MHz–1 GHz</span>
                <span class="m-tech">Broadcast Radio</span>
                <span class="m-freq">Omnidirectional VHF/UHF</span>
              </div>
              <div class="milestone-btn" id="btn-media-infrared" data-media="infrared">
                <span class="m-year">300 GHz–400 THz</span>
                <span class="m-tech">Infrared (IR)</span>
                <span class="m-freq">Non-penetrating Line-of-Sight</span>
              </div>
            </div>

            <!-- Dynamic Media Specification Card -->
            <div class="spectrum-detail-card" id="media-detail-box">
              <div class="detail-header">
                <span class="detail-title" id="media-spec-title">Terrestrial Microwave (2 GHz – 40 GHz)</span>
                <span class="detail-badge" id="media-spec-band">BANDWIDTH: Up to 274 Mbps</span>
              </div>
              <div class="detail-desc" id="media-spec-body" style="font-size: 0.85rem; line-height: 1.6;">
                • <strong>Antenna Type:</strong> Parabolic dish antennas (typically 3–4m diameter) rigidly aligned for narrow point-to-point beam.<br/>
                • <strong>Loss Formula:</strong> Free space loss $L = 10 \\log_{10}(4\\pi d / \\lambda)^2 \\text{ dB}$ (attenuation increases with square of distance).<br/>
                • <strong>Impairments:</strong> Rain attenuation becomes severe above 10 GHz; multipath fading over ground reflections.<br/>
                • <strong>Applications:</strong> Long-haul telephone voice/video trunks, cellular base station backhaul, bypass links.
              </div>
            </div>

            <!-- Protocol Explorer 3D Hardware Simulation for Wireless Media -->
            <div style="margin-top: 16px; background: #020408; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px; position: relative;">
              <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-cyan); margin-bottom: 8px;">
                ISOMETRIC HARDWARE REAL-WORLD LINK: CLIENT LAPTOP & ROUTER ⇄ ATMOSPHERIC PROPAGATION
              </div>
              <svg viewBox="0 0 820 220" style="width: 100%; height: 220px;" id="media-iso-svg">
                <!-- Subtle Ground Grid -->
                <g opacity="0.08" stroke="#00e5ff" stroke-width="1">
                  <line x1="0" y1="110" x2="820" y2="110"/>
                  <line x1="0" y1="160" x2="820" y2="160"/>
                  <line x1="100" y1="50" x2="100" y2="220"/>
                  <line x1="300" y1="50" x2="300" y2="220"/>
                  <line x1="520" y1="50" x2="520" y2="220"/>
                  <line x1="720" y1="50" x2="720" y2="220"/>
                </g>

                <!-- 1. Client Laptop Terminal -->
                <g id="iso-media-client">
                  ${drawIsometricLaptop(100, 140, 0.9, '#38bdf8')}
                  <text x="60" y="195" fill="#fff" font-size="10" font-family="monospace" font-weight="700">Client Terminal</text>
                  <text x="65" y="208" fill="#38bdf8" font-size="8" font-family="monospace">192.168.1.15</text>
                </g>

                <!-- 2. Wireless Access Router / Gateway -->
                <g id="iso-media-router">
                  ${drawIsometricRouter(300, 145, 0.9, '#38bdf8')}
                  <text x="260" y="195" fill="#fff" font-size="10" font-family="monospace" font-weight="700">Wi-Fi Gateway</text>
                  <text x="270" y="208" fill="#ffb703" font-size="8" font-family="monospace">2.4 / 5.8 GHz</text>
                </g>

                <!-- Link between Laptop and Router -->
                <path d="M 140 125 Q 220 95, 270 125" fill="none" stroke="#00e5ff" stroke-width="2" stroke-dasharray="4 4" id="media-link-local"/>

                <!-- 3. Long-Haul Point-to-Point Antenna Tower -->
                <g id="iso-media-tower">
                  ${drawIsometricBaseStation(520, 145, 0.95, '#00ff9d')}
                  <text x="470" y="195" fill="#fff" font-size="10" font-family="monospace" font-weight="700">Microwave Relay</text>
                  <text x="480" y="208" fill="#00ff9d" font-size="8" font-family="monospace">18 GHz LOS Link</text>
                </g>

                <!-- 4. Destination Cloud / Satellite Relay -->
                <g id="iso-media-cloud">
                  ${drawIsometricCloud(720, 120, 1.0, '#38bdf8')}
                  <text x="680" y="165" fill="#fff" font-size="10" font-family="monospace" font-weight="700">Global WAN / Core</text>
                  <text x="690" y="178" fill="#38bdf8" font-size="8" font-family="monospace">GEO Satellite Relay</text>
                </g>

                <!-- Long-haul wireless path -->
                <line x1="335" y1="145" x2="490" y2="135" stroke="#334155" stroke-width="2"/>
                <line x1="335" y1="145" x2="490" y2="135" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="6 3"/>
                <line x1="550" y1="110" x2="680" y2="105" stroke="#334155" stroke-width="2"/>
                <line x1="550" y1="110" x2="680" y2="105" stroke="#00ff9d" stroke-width="1.5" stroke-dasharray="6 3"/>

                <!-- Live Animated Burst Bubble -->
                <rect id="media-pkt-bubble" x="140" y="115" width="85" height="20" fill="#0b1329" stroke="#00e5ff" stroke-width="1.5" rx="3"/>
                <text id="media-pkt-text" x="146" y="129" fill="#00e5ff" font-size="8" font-family="monospace" font-weight="700">2.4 GHz BURST</text>
              </svg>
            </div>
          </div>
        </div>
      `;

    case 'sec-2.5':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 2.5 — TEXTBOOK PP. 36–40</div>
          <h2 class="lesson-title">Multiplexing: Frequency Division Multiplexing (FDM) vs Synchronous Time Division Multiplexing (TDM)</h2>
          <p class="lesson-text">
            Because physical transmission facilities have high capacity, transmitting only a single data stream would be economically wasteful. <strong>Multiplexing</strong> allows $n$ independent data channels to share a single transmission link.
          </p>

          <!-- Interactive Multiplexing Visualizer -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>INTERACTIVE MULTIPLEXING ENGINE (FIGURES 2.12 & 2.13)</span>
              <span class="panel-tag">SWITCH BETWEEN FDM SPECTRUM AND TDM FRAMING</span>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 12px;">
              <button class="btn-ctrl active" id="btn-show-fdm" style="flex: 1;">📡 FREQUENCY DIVISION MULTIPLEXING (FDM)</button>
              <button class="btn-ctrl" id="btn-show-tdm" style="flex: 1;">⏱️ TIME DIVISION MULTIPLEXING (TDM)</button>
            </div>

            <!-- Animated Multiplexer SVG -->
            <div style="background: #03060c; border: 1px solid var(--border-subtle); border-radius: 4px; padding: 16px;">
              <svg viewBox="0 0 720 180" style="width: 100%; height: 180px;" id="mux-svg">
                <!-- Inputs -->
                <text x="20" y="30" fill="#38bdf8" font-size="11" font-family="monospace">Channel 1 (f₁ / Slot 1)</text>
                <text x="20" y="75" fill="#00e5ff" font-size="11" font-family="monospace">Channel 2 (f₂ / Slot 2)</text>
                <text x="20" y="120" fill="#00ff9d" font-size="11" font-family="monospace">Channel 3 (f₃ / Slot 3)</text>
                <text x="20" y="165" fill="#ffb703" font-size="11" font-family="monospace">Channel 4 (f₄ / Slot 4)</text>

                <!-- Input Lines -->
                <line x1="180" y1="26" x2="280" y2="70" stroke="#38bdf8" stroke-width="2"/>
                <line x1="180" y1="71" x2="280" y2="80" stroke="#00e5ff" stroke-width="2"/>
                <line x1="180" y1="116" x2="280" y2="90" stroke="#00ff9d" stroke-width="2"/>
                <line x1="180" y1="161" x2="280" y2="100" stroke="#ffb703" stroke-width="2"/>

                <!-- Multiplexer Block -->
                <rect x="280" y="45" width="80" height="80" fill="#101932" stroke="#00e5ff" stroke-width="2" rx="4"/>
                <text x="302" y="90" fill="#fff" font-size="13" font-family="monospace" font-weight="700">MUX</text>

                <!-- Composite Transmission Medium -->
                <line x1="360" y1="85" x2="520" y2="85" stroke="#fff" stroke-width="3"/>
                <g id="mux-composite-visual"></g>

                <!-- Demultiplexer Block -->
                <rect x="520" y="45" width="80" height="80" fill="#101932" stroke="#00e5ff" stroke-width="2" rx="4"/>
                <text x="535" y="90" fill="#fff" font-size="13" font-family="monospace" font-weight="700">DEMUX</text>

                <!-- Outputs -->
                <line x1="600" y1="70" x2="680" y2="26" stroke="#38bdf8" stroke-width="2"/>
                <line x1="600" y1="80" x2="680" y2="71" stroke="#00e5ff" stroke-width="2"/>
                <line x1="600" y1="90" x2="680" y2="116" stroke="#00ff9d" stroke-width="2"/>
                <line x1="600" y1="100" x2="680" y2="161" stroke="#ffb703" stroke-width="2"/>
              </svg>
            </div>

            <div class="callout-box" id="mux-explanation-box">
              <strong>FDM Principles:</strong> Useful channel bandwidth is split into distinct carrier frequencies separated by protective guard bands. E.g., AT&T standard groups twelve 4-kHz analog voice channels into a single 60–108 kHz composite band.
            </div>
          </div>
        </div>
      `;

    case 'sec-2.app':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">APPENDIX 2A — TEXTBOOK PP. 43–45</div>
          <h2 class="lesson-title">Decibels and Signal Strength: dB, dBW, dBm, and Link Budget Calculation</h2>
          <p class="lesson-text">
            Because signal attenuation across wireless links varies exponentially with distance, telecommunications engineers express signal strength, gains, and losses in logarithmic <strong>Decibels (dB)</strong>. Cascaded path budgets can then be calculated using simple addition and subtraction!
          </p>

          <div class="formula-box-large">
            G_dB = 10 · log₁₀(P_out / P_in)  |  P_dBm = 10 · log₁₀(P_mW / 1 mW)  |  P_dBW = 10 · log₁₀(P_W / 1 W)
          </div>

          <!-- Interactive Decibel Calculator & Converter -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>INTERACTIVE DECIBEL CONVERTER & RF LINK BUDGET CALCULATOR</span>
              <span class="panel-tag">INSTANT CONVERSION</span>
            </div>

            <div class="ch2-controls-grid">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>TRANSMIT POWER (P_TX)</span>
                  <span id="app-val-mw">100.0 mW</span>
                </div>
                <input type="range" id="app-slider-mw" min="1" max="1000" value="100" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>LINK DISTANCE (d)</span>
                  <span id="app-val-dist">50 m</span>
                </div>
                <input type="range" id="app-slider-dist" min="5" max="500" step="5" value="50" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>CARRIER FREQUENCY (f)</span>
                  <span id="app-val-freq">2.4 GHz</span>
                </div>
                <select id="app-select-freq" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="900000000">900 MHz (Cellular / ISM)</option>
                  <option value="2400000000" selected>2.4 GHz (Wi-Fi 802.11b/g)</option>
                  <option value="5800000000">5.8 GHz (Wi-Fi 802.11a/ac)</option>
                </select>
              </div>
            </div>

            <!-- Link Budget Outputs -->
            <div class="calc-results-grid">
              <div class="res-card">
                <div class="res-title">TX POWER IN dBm & dBW</div>
                <div class="res-val" id="app-out-tx-dbm">+20.0 dBm</div>
                <div class="res-sub" id="app-out-tx-dbw">-10.0 dBW (0.1 W)</div>
              </div>

              <div class="res-card">
                <div class="res-title">FREE SPACE PATH LOSS (L_dB)</div>
                <div class="res-val" id="app-out-loss">-74.0 dB</div>
                <div class="res-sub">L = 20log₁₀(4πdf / c)</div>
              </div>

              <div class="res-card highlight">
                <div class="res-title">RECEIVED POWER (P_RX)</div>
                <div class="res-val" id="app-out-rx-dbm">-54.0 dBm</div>
                <div class="res-sub" id="app-out-rx-sub">3.98 × 10⁻⁶ mW (Excellent Signal)</div>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'sec-2.problems':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 2.7 — TEXTBOOK PP. 41–43</div>
          <h2 class="lesson-title">William Stallings Chapter 2: Review Questions & Numerical Problem Solutions</h2>
          <p class="lesson-text">
            Test your comprehension against actual quantitative homework problems and exam questions assigned in university wireless communications courses from Stallings 2e.
          </p>

          <div class="quiz-container">
            <div class="quiz-question-box" data-q="p2.1">
              <div class="q-number">PROBLEM 2.1 (STALLINGS TEXTBOOK P. 42)</div>
              <div class="q-text">A periodic electromagnetic signal has a fundamental frequency of 1000 Hz. What is its period T?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="true">A. 0.001 s (1 ms) — Since T = 1/f = 1/1000 = 0.001 s</button>
                <button class="q-opt" data-correct="false">B. 0.01 s</button>
                <button class="q-opt" data-correct="false">C. 1000 s</button>
                <button class="q-opt" data-correct="false">D. 3.14 ms</button>
              </div>
              <div class="q-feedback"></div>
            </div>

            <div class="quiz-question-box" data-q="p2.9" style="margin-top: 14px;">
              <div class="q-number">PROBLEM 2.9 (STALLINGS TEXTBOOK P. 43)</div>
              <div class="q-text">What is the channel capacity for a teleprinter channel with a 300-Hz bandwidth and a signal-to-noise ratio of 3 dB?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="false">A. 300 bps</button>
                <button class="q-opt" data-correct="true">B. ~475 bps — Since SNR_linear = 10^(3/10) = 1.995 ≈ 2. C = 300 · log₂(1 + 2) = 300 · 1.585 = 475.5 bps</button>
                <button class="q-opt" data-correct="false">C. 900 bps</button>
                <button class="q-opt" data-correct="false">D. 600 bps</button>
              </div>
              <div class="q-feedback"></div>
            </div>

            <div class="quiz-question-box" data-q="p2.10" style="margin-top: 14px;">
              <div class="q-number">PROBLEM 2.10 (STALLINGS TEXTBOOK P. 43)</div>
              <div class="q-text">A digital signaling system is required to operate at 9600 bps. If each signal element encodes an 8-bit word (M = 256), what is the minimum required Nyquist bandwidth?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="false">A. 4800 Hz</button>
                <button class="q-opt" data-correct="false">B. 1200 Hz</button>
                <button class="q-opt" data-correct="true">C. 600 Hz — Since C = 2B · log₂(M) → 9600 = 2B · 8 → B = 9600 / 16 = 600 Hz</button>
                <button class="q-opt" data-correct="false">D. 2400 Hz</button>
              </div>
              <div class="q-feedback"></div>
            </div>

            <div class="quiz-question-box" data-q="p2.14" style="margin-top: 14px;">
              <div class="q-number">PROBLEM 2.14 (STALLINGS TEXTBOOK P. 43)</div>
              <div class="q-text">Show that doubling the transmission distance d between transmitting antenna and receiving antenna attenuates the received power by what decibel amount?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="false">A. 3 dB loss</button>
                <button class="q-opt" data-correct="true">B. 6 dB loss — Since L_dB = 20 log₁₀(2d) = 20 log₁₀(d) + 20 log₁₀(2) = L_old + 20(0.301) ≈ +6.02 dB loss</button>
                <button class="q-opt" data-correct="false">C. 12 dB loss</button>
                <button class="q-opt" data-correct="false">D. 20 dB loss</button>
              </div>
              <div class="q-feedback"></div>
            </div>
          </div>
        </div>
      `;
    default:
      return `<p>Select a section tab above.</p>`;
  }
}

// Global state tracking for Chapter 2 interactive controls
const ch2State = {
  amp: 45,
  freq: 2,
  phase: 0,
  harmonics: 1,
  calcBw: 20000000,
  calcSnr: 25,
  calcM: 4,
  appMw: 100,
  appDist: 50,
  appFreq: 2400000000,
  muxMode: 'fdm',
  transmissionMode: 'amp'
};

function attachSubEvents(container, secId, progressManager) {
  // --- Section 2.1 Events ---
  if (secId === 'sec-2.1') {
    const sliderAmp = container.querySelector('#ch2-slider-amp');
    const sliderFreq = container.querySelector('#ch2-slider-freq');
    const sliderPhase = container.querySelector('#ch2-slider-phase');
    const selectHarm = container.querySelector('#ch2-select-harm');

    const valAmp = container.querySelector('#ch2-val-amp');
    const valFreq = container.querySelector('#ch2-val-freq');
    const valPhase = container.querySelector('#ch2-val-phase');
    const valHarm = container.querySelector('#ch2-val-harm');

    if (sliderAmp) {
      sliderAmp.addEventListener('input', (e) => {
        ch2State.amp = Number(e.target.value);
        if (valAmp) valAmp.textContent = `${(ch2State.amp / 45).toFixed(2)} V`;
        updateSpectrum();
      });
    }

    if (sliderFreq) {
      sliderFreq.addEventListener('input', (e) => {
        ch2State.freq = Number(e.target.value);
        if (valFreq) valFreq.textContent = `${ch2State.freq.toFixed(1)} Hz`;
        updateSpectrum();
      });
    }

    if (sliderPhase) {
      sliderPhase.addEventListener('input', (e) => {
        ch2State.phase = Number(e.target.value);
        const deg = Math.round((ch2State.phase / (2 * Math.PI)) * 360);
        if (valPhase) valPhase.textContent = `${ch2State.phase.toFixed(2)} rad (${deg}°)`;
      });
    }

    if (selectHarm) {
      selectHarm.addEventListener('change', (e) => {
        ch2State.harmonics = Number(e.target.value);
        if (valHarm) valHarm.textContent = `${ch2State.harmonics} Harmonic${ch2State.harmonics > 1 ? 's' : ''}`;
        updateSpectrum();
      });
    }

    const updateSpectrum = () => {
      const g = container.querySelector('#ch2-spectrum-bars');
      if (!g) return;
      let bars = '';
      const baseAmp = ch2State.amp * 1.5;
      for (let n = 1; n <= ch2State.harmonics; n += 2) {
        const barHeight = Math.max(4, (baseAmp / n));
        const x = 30 + (n * 8);
        const y = 160 - barHeight;
        bars += `
          <line x1="${x}" y1="160" x2="${x}" y2="${y}" stroke="#38bdf8" stroke-width="3"/>
          <circle cx="${x}" cy="${y}" r="2.5" fill="#00e5ff"/>
          <text x="${x-4}" y="172" fill="#64748b" font-size="8" font-family="monospace">${n}f</text>
        `;
      }
      g.innerHTML = bars;
    };

    updateSpectrum();

    // Live Vector Animation Loop
    simEngine.subscribe((time) => {
      const path = container.querySelector('#ch2-wave-path');
      if (!path) return;
      const width = 500;
      const height = 180;
      const midY = height / 2;
      const points = [];
      const numSamples = 160;

      for (let i = 0; i < numSamples; i++) {
        const x = (i / (numSamples - 1)) * width;
        const t = time + (x / width) * 2;
        
        let yVal = 0;
        for (let n = 1; n <= ch2State.harmonics; n += 2) {
          yVal += (1 / n) * Math.sin(2 * Math.PI * ch2State.freq * n * t + ch2State.phase);
        }
        if (ch2State.harmonics > 1) {
          yVal *= (4 / Math.PI);
        }

        const y = midY - (yVal * ch2State.amp);
        points.push([x, Math.max(4, Math.min(height - 4, y))]);
      }

      path.setAttribute('d', pointsToSvgPath(points));
    });
  }

  // --- Section 2.2 Events (Amplifier vs Repeater Real-World Simulator) ---
  if (secId === 'sec-2.2') {
    const btnAmp = container.querySelector('#btn-mode-amp');
    const btnRep = container.querySelector('#btn-mode-rep');

    const txMode = container.querySelector('#tx-display-mode');
    const stage1Name = container.querySelector('#stage1-hw-name');
    const stage1Line1 = container.querySelector('#stage1-display-line1');
    const stage1Line2 = container.querySelector('#stage1-display-line2');

    const stage2Name = container.querySelector('#stage2-hw-name');
    const stage2Line1 = container.querySelector('#stage2-display-line1');
    const stage2Line2 = container.querySelector('#stage2-display-line2');

    const rxStatus = container.querySelector('#rx-display-status');
    const rxLed = container.querySelector('#rx-decision-led');

    const probeBDesc = container.querySelector('#probe-b-desc');
    const probeCDesc = container.querySelector('#probe-c-desc');
    const probeDDesc = container.querySelector('#probe-d-desc');
    const banner = container.querySelector('#transmission-telemetry-banner');

    const updateWaveform = (mode) => {
      ch2State.transmissionMode = mode;
      if (mode === 'amp') {
        if (btnAmp) btnAmp.classList.add('active');
        if (btnRep) btnRep.classList.remove('active');
        if (txMode) txMode.textContent = 'SIG: ANALOG SINE';
        if (stage1Name) stage1Name.textContent = 'ANALOG AMP #1';
        if (stage1Line1) { stage1Line1.textContent = 'GAIN: +12 dB'; stage1Line1.setAttribute('fill', '#ffb703'); }
        if (stage1Line2) stage1Line2.textContent = 'BOOSTS NOISE';

        if (stage2Name) stage2Name.textContent = 'ANALOG AMP #2';
        if (stage2Line1) { stage2Line1.textContent = 'COMPOUND NOISE'; stage2Line1.setAttribute('fill', '#ff0055'); }
        if (stage2Line2) stage2Line2.textContent = 'SNR DROPS: 8 dB';

        if (rxStatus) { rxStatus.textContent = 'DEC: ERR'; rxStatus.setAttribute('fill', '#ff0055'); }
        if (rxLed) rxLed.setAttribute('fill', '#ff0055');

        if (probeBDesc) probeBDesc.textContent = 'Amplified signal + First AWGN noise layer';
        if (probeCDesc) probeCDesc.textContent = 'Compounded amplified noise (Severe jitter)';
        if (probeDDesc) probeDDesc.textContent = 'Distorted waveform: decision errors occur!';
        if (banner) banner.textContent = 'STATUS: Analog Mode Active — Amplifiers indiscriminately amplify signal + accumulated channel noise across hops.';
      } else {
        if (btnRep) btnRep.classList.add('active');
        if (btnAmp) btnAmp.classList.remove('active');
        if (txMode) txMode.textContent = 'SIG: DIGITAL PULSE';
        if (stage1Name) stage1Name.textContent = 'DIGITAL REP #1';
        if (stage1Line1) { stage1Line1.textContent = 'RE-CLOCK & RE-GEN'; stage1Line1.setAttribute('fill', '#00ff9d'); }
        if (stage1Line2) stage1Line2.textContent = 'NOISE ELIMINATED';

        if (stage2Name) stage2Name.textContent = 'DIGITAL REP #2';
        if (stage2Line1) { stage2Line1.textContent = 'NEW PULSES SENT'; stage2Line1.setAttribute('fill', '#00ff9d'); }
        if (stage2Line2) stage2Line2.textContent = 'BER: 0 (CLEAN)';

        if (rxStatus) { rxStatus.textContent = 'DEC: 100%'; rxStatus.setAttribute('fill', '#00ff9d'); }
        if (rxLed) rxLed.setAttribute('fill', '#00ff9d');

        if (probeBDesc) probeBDesc.textContent = 'Sampled 1s/0s; New clean pulse stream radiated!';
        if (probeCDesc) probeCDesc.textContent = 'Sampled & regenerated again; Zero noise buildup!';
        if (probeDDesc) probeDDesc.textContent = 'Pristine reconstructed bitstream at RX Sink!';
        if (banner) banner.textContent = 'STATUS: Digital Mode Active — Regenerative repeaters detect bit values, discard noise, and transmit brand-new clean pulses.';
      }
    };

    if (btnAmp) btnAmp.addEventListener('click', () => updateWaveform('amp'));
    if (btnRep) btnRep.addEventListener('click', () => updateWaveform('rep'));

    // Real-Time Multi-Tap Oscilloscope Animation Loop
    simEngine.subscribe((time) => {
      const pA = container.querySelector('#wave-probe-a');
      const pB = container.querySelector('#wave-probe-b');
      const pC = container.querySelector('#wave-probe-c');
      const pD = container.querySelector('#wave-probe-d');
      if (!pA || !pB || !pC || !pD) return;

      const numSamples = 60;
      const isAnalog = ch2State.transmissionMode === 'amp';

      // Probe A: Transmitter Output (Clean)
      const pointsA = [];
      const midA = 240;
      for (let i = 0; i < numSamples; i++) {
        const x = 25 + (i / (numSamples - 1)) * 200;
        const t = time * 2 + (i / numSamples) * 2.5;
        let yVal = 0;
        if (isAnalog) {
          yVal = Math.sin(2 * Math.PI * 1.5 * t) * 32;
        } else {
          yVal = (Math.sin(2 * Math.PI * 1.5 * t) > 0 ? 30 : -30);
        }
        pointsA.push([x, midA - yVal]);
      }
      pA.setAttribute('d', pointsToSvgPath(pointsA));
      pA.setAttribute('stroke', isAnalog ? '#00e5ff' : '#00ff9d');

      // Probe B: Post-Stage 1 (Channel noise added, then amplified OR regenerated)
      const pointsB = [];
      const midB = 240;
      for (let i = 0; i < numSamples; i++) {
        const x = 255 + (i / (numSamples - 1)) * 200;
        const t = (time - 0.2) * 2 + (i / numSamples) * 2.5;
        let yVal = 0;
        if (isAnalog) {
          // Analog: Signal amplified + First noise layer
          const noise = (Math.sin(i * 12.5 + time * 30) * 10);
          yVal = Math.sin(2 * Math.PI * 1.5 * t) * 34 + noise;
        } else {
          // Digital: Repeater recovers 1s and 0s and outputs fresh clean pulses!
          yVal = (Math.sin(2 * Math.PI * 1.5 * t) > 0 ? 30 : -30);
        }
        pointsB.push([x, midB - yVal]);
      }
      pB.setAttribute('d', pointsToSvgPath(pointsB));
      pB.setAttribute('stroke', isAnalog ? '#38bdf8' : '#00ff9d');

      // Probe C: Post-Stage 2 (Second noise layer compounded)
      const pointsC = [];
      const midC = 240;
      for (let i = 0; i < numSamples; i++) {
        const x = 485 + (i / (numSamples - 1)) * 200;
        const t = (time - 0.4) * 2 + (i / numSamples) * 2.5;
        let yVal = 0;
        if (isAnalog) {
          // Analog: First amplified noise boosted again + Second noise layer added!
          const noise1 = (Math.sin(i * 12.5 + time * 30) * 16);
          const noise2 = (Math.cos(i * 24.1 + time * 50) * 12);
          yVal = Math.sin(2 * Math.PI * 1.5 * t) * 36 + noise1 + noise2;
        } else {
          // Digital: Second repeater regenerates clean pulses again!
          yVal = (Math.sin(2 * Math.PI * 1.5 * t) > 0 ? 30 : -30);
        }
        pointsC.push([x, midC - yVal]);
      }
      pC.setAttribute('d', pointsToSvgPath(pointsC));
      pC.setAttribute('stroke', isAnalog ? '#ffb703' : '#00ff9d');

      // Probe D: At Receiver Sink
      const pointsD = [];
      const midD = 240;
      for (let i = 0; i < numSamples; i++) {
        const x = 715 + (i / (numSamples - 1)) * 180;
        const t = (time - 0.6) * 2 + (i / numSamples) * 2.5;
        let yVal = 0;
        if (isAnalog) {
          // Severe distortion on analog channel at destination
          const heavyNoise = (Math.sin(i * 12.5 + time * 30) * 20) + (Math.cos(i * 35.2 + time * 60) * 14);
          yVal = Math.sin(2 * Math.PI * 1.5 * t) * 32 + heavyNoise;
        } else {
          // Perfect clean bitstream received
          yVal = (Math.sin(2 * Math.PI * 1.5 * t) > 0 ? 30 : -30);
        }
        pointsD.push([x, Math.max(170, Math.min(310, midD - yVal))]);
      }
      pD.setAttribute('d', pointsToSvgPath(pointsD));
      pD.setAttribute('stroke', isAnalog ? '#ff0055' : '#00ff9d');
    });
  }

  // --- Section 2.3 Events (Channel Capacity) ---
  if (secId === 'sec-2.3') {
    const sliderBw = container.querySelector('#ch2-calc-bw');
    const sliderSnr = container.querySelector('#ch2-calc-snr');
    const selectM = container.querySelector('#ch2-calc-m');

    const valBw = container.querySelector('#ch2-calc-bw-val');
    const valSnr = container.querySelector('#ch2-calc-snr-val');
    const valM = container.querySelector('#ch2-calc-m-val');

    const outNyquist = container.querySelector('#ch2-out-nyquist');
    const outNyquistSub = container.querySelector('#ch2-out-nyquist-sub');
    const outShannon = container.querySelector('#ch2-out-shannon');
    const outShannonSub = container.querySelector('#ch2-out-shannon-sub');
    const outEff = container.querySelector('#ch2-out-eff');

    const updateCalc = () => {
      if (valBw) valBw.textContent = formatFrequency(ch2State.calcBw);
      if (valSnr) valSnr.textContent = formatDb(ch2State.calcSnr);
      if (valM) valM.textContent = `M=${ch2State.calcM} (${Math.log2(ch2State.calcM)} bits/sym)`;

      const nyqRate = calculateNyquistCapacity(ch2State.calcBw, ch2State.calcM);
      const shanRate = calculateShannonCapacity(ch2State.calcBw, ch2State.calcSnr);
      const eff = shanRate / ch2State.calcBw;

      if (outNyquist) outNyquist.textContent = formatBitrate(nyqRate);
      if (outNyquistSub) outNyquistSub.textContent = `C = 2 · ${formatFrequency(ch2State.calcBw)} · ${Math.log2(ch2State.calcM)} = ${formatBitrate(nyqRate)}`;

      if (outShannon) outShannon.textContent = formatBitrate(shanRate);
      const snrLin = Math.pow(10, ch2State.calcSnr / 10).toFixed(1);
      if (outShannonSub) outShannonSub.textContent = `C = ${formatFrequency(ch2State.calcBw)} · log₂(1 + ${snrLin})`;

      if (outEff) outEff.textContent = `${eff.toFixed(2)} bps/Hz`;
    };

    if (sliderBw) {
      sliderBw.addEventListener('input', (e) => {
        ch2State.calcBw = Number(e.target.value);
        updateCalc();
      });
    }

    if (sliderSnr) {
      sliderSnr.addEventListener('input', (e) => {
        ch2State.calcSnr = Number(e.target.value);
        updateCalc();
      });
    }

    if (selectM) {
      selectM.addEventListener('change', (e) => {
        ch2State.calcM = Number(e.target.value);
        updateCalc();
      });
    }

    updateCalc();
  }

  // --- Section 2.4 Events (Media Explorer) ---
  if (secId === 'sec-2.4') {
    const btns = container.querySelectorAll('[data-media]');
    const specTitle = container.querySelector('#media-spec-title');
    const specBand = container.querySelector('#media-spec-band');
    const specBody = container.querySelector('#media-spec-body');

    const mediaData = {
      terrestrial: {
        title: 'Terrestrial Microwave (2 GHz – 40 GHz)',
        band: 'DATA RATE: Up to 274 Mbps',
        body: `• <strong>Antenna Type:</strong> Parabolic dish antennas (typically 3–4m diameter) rigidly aligned for narrow line-of-sight beams.<br/>
               • <strong>Path Loss:</strong> Follows $L = 10 \\log_{10}(4\\pi d / \\lambda)^2 \\text{ dB}$. Attenuation increases with distance squared ($1/d^2$). Repeaters spaced 10–100 km apart.<br/>
               • <strong>Atmospheric Effects:</strong> Rainfall attenuation becomes severe above 10 GHz.<br/>
               • <strong>Common Bands:</strong> 4–6 GHz for long-haul phone/TV; 11 GHz for cable TV feeds; 18–22 GHz for short-haul building links.`
      },
      satellite: {
        title: 'Satellite Microwave (4/6 GHz, 12/14 GHz, 20/30 GHz)',
        band: 'DELAY: ~250 ms GEO propagation',
        body: `• <strong>Configuration:</strong> Geosynchronous orbit (GEO at 35,784 km). Satellite acts as an active transponder relay station.<br/>
               • <strong>Frequency Separation:</strong> Separate uplink (earth-to-satellite) and downlink (satellite-to-earth) prevent self-interference.<br/>
               • <strong>Key Bands:</strong> 4/6 GHz (Uplink 5.9–6.4 GHz, Downlink 3.7–4.2 GHz); 12/14 GHz for direct broadcast satellite (DBS); 20/30 GHz for high-throughput broadband.<br/>
               • <strong>Broadcast Nature:</strong> Inherently broadcast medium; one transmission reaches thousands of earth stations simultaneously.`
      },
      radio: {
        title: 'Broadcast Radio (30 MHz – 1 GHz VHF / UHF)',
        band: 'PROPAGATION: Omnidirectional Line-of-Sight',
        body: `• <strong>Antenna Design:</strong> Omnidirectional dipoles and whip antennas; rigid alignment is not required.<br/>
               • <strong>Ionospheric Behavior:</strong> Transparent to the ionosphere (unlike HF shortwave). Distant transmitters do not interfere via atmospheric bounce.<br/>
               • <strong>Impairments:</strong> Multipath interference caused by reflection from buildings, terrain, and aircraft.<br/>
               • <strong>Applications:</strong> FM radio (88–108 MHz), VHF/UHF broadcast television, mobile two-way voice.`
      },
      infrared: {
        title: 'Infrared Communication (300 GHz – 400 THz)',
        band: 'REGULATION: Unlicensed Spectrum Worldwide',
        body: `• <strong>Transceivers:</strong> Non-coherent modulated infrared light emitters (LEDs / laser diodes) and photodiodes.<br/>
               • <strong>Wall Non-Penetration:</strong> IR cannot penetrate opaque walls, offering inherent privacy, zero cross-room interference, and no regulatory licensing requirements.<br/>
               • <strong>Propagation Modes:</strong> Point-to-point line-of-sight or diffuse room reflection off light ceilings.<br/>
               • <strong>Applications:</strong> Consumer TV remote controls, short-range IrDA data exchange, secure in-room wireless LANs.`
      }
    };

    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        btns.forEach(b => b.classList.remove('active'));
        const cur = e.currentTarget;
        cur.classList.add('active');
        const key = cur.getAttribute('data-media');
        const info = mediaData[key];
        if (info && specTitle) {
          specTitle.textContent = info.title;
          if (specBand) specBand.textContent = info.band;
          if (specBody) specBody.innerHTML = info.body;
        }
      });
    });
  }

  // --- Section 2.5 Events (Multiplexing FDM vs TDM) ---
  if (secId === 'sec-2.5') {
    const btnFdm = container.querySelector('#btn-show-fdm');
    const btnTdm = container.querySelector('#btn-show-tdm');
    const compG = container.querySelector('#mux-composite-visual');
    const explBox = container.querySelector('#mux-explanation-box');

    const setMux = (mode) => {
      ch2State.muxMode = mode;
      if (mode === 'fdm') {
        if (btnFdm) btnFdm.classList.add('active');
        if (btnTdm) btnTdm.classList.remove('active');
        if (explBox) {
          explBox.innerHTML = `<strong>Frequency Division Multiplexing (FDM):</strong> Useful channel bandwidth is split into distinct subcarrier bands separated by protective guard bands. All channels transmit continuously at the same time across different frequencies (e.g. 12 voice channels grouped into 60–108 kHz band).`;
        }
      } else {
        if (btnTdm) btnTdm.classList.add('active');
        if (btnFdm) btnFdm.classList.remove('active');
        if (explBox) {
          explBox.innerHTML = `<strong>Synchronous Time Division Multiplexing (TDM):</strong> Transmission medium capacity is shared by allocating cyclic, pre-assigned time slots across a single shared frequency band. E.g., AT&T T1 carrier multiplexes 24 digitized voice channels into 193-bit frames at 1.544 Mbps.`;
        }
      }
    };

    if (btnFdm) btnFdm.addEventListener('click', () => setMux('fdm'));
    if (btnTdm) btnTdm.addEventListener('click', () => setMux('tdm'));

    // Animated packets on link
    simEngine.subscribe((time) => {
      if (!compG) return;
      if (ch2State.muxMode === 'fdm') {
        // Render 4 parallel colored frequency sub-streams
        compG.innerHTML = `
          <line x1="360" y1="73" x2="520" y2="73" stroke="#38bdf8" stroke-width="2"/>
          <line x1="360" y1="81" x2="520" y2="81" stroke="#00e5ff" stroke-width="2"/>
          <line x1="360" y1="89" x2="520" y2="89" stroke="#00ff9d" stroke-width="2"/>
          <line x1="360" y1="97" x2="520" y2="97" stroke="#ffb703" stroke-width="2"/>
        `;
      } else {
        // Render discrete interleaved time slots moving across the link
        const colors = ['#38bdf8', '#00e5ff', '#00ff9d', '#ffb703'];
        const offset = (time * 80) % 160;
        let rects = '';
        for (let i = 0; i < 4; i++) {
          const x = 360 + ((offset + i * 40) % 160);
          rects += `<rect x="${x}" y="75" width="22" height="20" fill="${colors[i]}" rx="2"/>`;
        }
        compG.innerHTML = rects;
      }
    });
  }

  // --- Appendix 2A Events (Decibels & Link Budget) ---
  if (secId === 'sec-2.app') {
    const sliderMw = container.querySelector('#app-slider-mw');
    const sliderDist = container.querySelector('#app-slider-dist');
    const selectFreq = container.querySelector('#app-select-freq');

    const valMw = container.querySelector('#app-val-mw');
    const valDist = container.querySelector('#app-val-dist');
    const valFreq = container.querySelector('#app-val-freq');

    const outTxDbm = container.querySelector('#app-out-tx-dbm');
    const outTxDbw = container.querySelector('#app-out-tx-dbw');
    const outLoss = container.querySelector('#app-out-loss');
    const outRxDbm = container.querySelector('#app-out-rx-dbm');
    const outRxSub = container.querySelector('#app-out-rx-sub');

    const updateBudget = () => {
      if (valMw) valMw.textContent = `${ch2State.appMw.toFixed(1)} mW`;
      if (valDist) valDist.textContent = `${ch2State.appDist} m`;
      if (valFreq) valFreq.textContent = formatFrequency(ch2State.appFreq);

      const txDbm = 10 * Math.log10(ch2State.appMw);
      const txDbw = txDbm - 30;
      const fspl = calculateFreeSpaceLoss(ch2State.appDist, ch2State.appFreq);
      const rxDbm = txDbm - fspl;
      const rxMw = Math.pow(10, rxDbm / 10);

      if (outTxDbm) outTxDbm.textContent = `${txDbm >= 0 ? '+' : ''}${txDbm.toFixed(1)} dBm`;
      if (outTxDbw) outTxDbw.textContent = `${txDbw >= 0 ? '+' : ''}${txDbw.toFixed(1)} dBW (${(ch2State.appMw / 1000).toFixed(3)} W)`;
      if (outLoss) outLoss.textContent = `-${fspl.toFixed(1)} dB`;
      if (outRxDbm) outRxDbm.textContent = `${rxDbm.toFixed(1)} dBm`;
      if (outRxSub) outRxSub.textContent = `${rxMw.toExponential(2)} mW (RSSI Target)`;
    };

    if (sliderMw) {
      sliderMw.addEventListener('input', (e) => {
        ch2State.appMw = Number(e.target.value);
        updateBudget();
      });
    }

    if (sliderDist) {
      sliderDist.addEventListener('input', (e) => {
        ch2State.appDist = Number(e.target.value);
        updateBudget();
      });
    }

    if (selectFreq) {
      selectFreq.addEventListener('change', (e) => {
        ch2State.appFreq = Number(e.target.value);
        updateBudget();
      });
    }

    updateBudget();
  }

  // --- Section 2.7 Events (Numerical Problems & Quiz) ---
  if (secId === 'sec-2.problems') {
    const qBoxes = container.querySelectorAll('.quiz-question-box');
    qBoxes.forEach(box => {
      const opts = box.querySelectorAll('.q-opt');
      const fb = box.querySelector('.q-feedback');
      opts.forEach(opt => {
        opt.addEventListener('click', () => {
          opts.forEach(o => o.classList.remove('selected', 'correct', 'wrong'));
          const isCorrect = opt.getAttribute('data-correct') === 'true';
          opt.classList.add('selected');
          if (isCorrect) {
            opt.classList.add('correct');
            fb.innerHTML = `<span style="color: var(--status-ready); font-weight: 600;">✓ Correct!</span> Solution verified directly from William Stallings Chapter 2 solutions.`;
          } else {
            opt.classList.add('wrong');
            fb.innerHTML = `<span style="color: var(--status-danger); font-weight: 600;">✗ Incorrect.</span> Review the formulas in Sections 2.1, 2.3, and Appendix 2A.`;
          }
        });
      });
    });
  }
}
