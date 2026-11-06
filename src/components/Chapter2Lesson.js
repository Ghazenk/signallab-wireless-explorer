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

          <!-- Interactive Repeater vs Amplifier Simulator -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>ANIMATED DEMONSTRATION: NOISE PROPAGATION IN ANALOG AMPLIFIERS VS DIGITAL REPEATERS</span>
              <span class="panel-tag">CLICK 'CASCADE STAGES' TO OBSERVE RECOVERY</span>
            </div>

            <div style="background: #03060c; border: 1px solid var(--border-subtle); border-radius: 4px; padding: 14px; margin-bottom: 12px;">
              <svg viewBox="0 0 700 160" style="width: 100%; height: 160px;" id="amp-rep-svg">
                <!-- Transmitter -->
                <rect x="20" y="30" width="80" height="40" fill="#101932" stroke="#00e5ff" rx="4"/>
                <text x="30" y="55" fill="#fff" font-size="10" font-family="monospace">TX SOURCE</text>
                
                <!-- Stage 1 Cable -->
                <line x1="100" y1="50" x2="220" y2="50" stroke="#64748b" stroke-width="2"/>
                <text x="125" y="42" fill="#ffb703" font-size="9" font-family="monospace">+ AWGN Noise</text>

                <!-- Stage 1 Device (Amplifier / Repeater) -->
                <polygon points="220,30 290,50 220,70" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
                <text x="228" y="54" fill="#38bdf8" font-size="9" font-family="monospace" id="stage-device-name">ANALOG AMP</text>

                <!-- Stage 2 Cable -->
                <line x1="290" y1="50" x2="440" y2="50" stroke="#64748b" stroke-width="2"/>
                <text x="325" y="42" fill="#ffb703" font-size="9" font-family="monospace">+ More Noise</text>

                <!-- Stage 2 Device -->
                <polygon points="440,30 510,50 440,70" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
                <text x="448" y="54" fill="#38bdf8" font-size="9" font-family="monospace">STAGE 2</text>

                <!-- Stage 3 Output Receiver -->
                <line x1="510" y1="50" x2="600" y2="50" stroke="#64748b" stroke-width="2"/>
                <rect x="600" y="30" width="80" height="40" fill="#101932" stroke="#00ff9d" rx="4"/>
                <text x="618" y="55" fill="#fff" font-size="10" font-family="monospace">RX SINK</text>

                <!-- Live Waveform Preview Path -->
                <path id="transmission-demo-wave" d="M 20 130 Q 50 100, 80 130 T 140 130 T 200 130 T 260 130 T 320 130 T 380 130 T 440 130 T 500 130 T 560 130 T 620 130 T 680 130" fill="none" stroke="#ff0055" stroke-width="2"/>
                <text x="20" y="150" fill="#94a3b8" font-size="10" font-family="monospace" id="transmission-state-lbl">MODE: Analog Amplifiers — Compounding noise distortion across hops</text>
              </svg>
            </div>

            <div style="display: flex; gap: 10px;">
              <button class="btn-ctrl active" id="btn-mode-amp" style="flex: 1;">⚡ SIMULATE ANALOG AMPLIFIERS (NOISE ACCUMULATION)</button>
              <button class="btn-ctrl" id="btn-mode-rep" style="flex: 1;">🛡️ SIMULATE DIGITAL REPEATERS (CLEAN RE-GENERATION)</button>
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

  // --- Section 2.2 Events (Amplifier vs Repeater) ---
  if (secId === 'sec-2.2') {
    const btnAmp = container.querySelector('#btn-mode-amp');
    const btnRep = container.querySelector('#btn-mode-rep');
    const stateLbl = container.querySelector('#transmission-state-lbl');
    const deviceName = container.querySelector('#stage-device-name');
    const wavePath = container.querySelector('#transmission-demo-wave');

    const updateWaveform = (mode) => {
      ch2State.transmissionMode = mode;
      if (mode === 'amp') {
        if (btnAmp) btnAmp.classList.add('active');
        if (btnRep) btnRep.classList.remove('active');
        if (stateLbl) stateLbl.textContent = 'MODE: Analog Amplifiers — Compounding noise distortion across cascaded hops (signal degraded)';
        if (deviceName) deviceName.textContent = 'ANALOG AMP';
        if (wavePath) wavePath.setAttribute('stroke', '#ff0055');
      } else {
        if (btnRep) btnRep.classList.add('active');
        if (btnAmp) btnAmp.classList.remove('active');
        if (stateLbl) stateLbl.textContent = 'MODE: Digital Repeaters — Pulses sampled & regenerated cleanly at each repeater hop! (error eliminated)';
        if (deviceName) deviceName.textContent = 'DIGITAL REP';
        if (wavePath) wavePath.setAttribute('stroke', '#00ff9d');
      }
    };

    if (btnAmp) btnAmp.addEventListener('click', () => updateWaveform('amp'));
    if (btnRep) btnRep.addEventListener('click', () => updateWaveform('rep'));

    simEngine.subscribe((time) => {
      const path = container.querySelector('#transmission-demo-wave');
      if (!path) return;
      const points = [];
      const width = 700;
      const midY = 125;

      for (let i = 0; i < 140; i++) {
        const x = (i / 139) * width;
        const t = time * 2 + (x / width) * 4;
        let y = 0;
        if (ch2State.transmissionMode === 'amp') {
          // Accumulating noise across x
          const noiseFactor = (x / width) * 18;
          const noise = (Math.sin(x * 15.3 + t * 45) * noiseFactor);
          y = midY - (Math.sin(2 * Math.PI * 1.5 * t) * 20 + noise);
        } else {
          // Clean square wave regenerated
          const raw = Math.sin(2 * Math.PI * 1.5 * t);
          y = midY - (raw > 0 ? 18 : -18);
        }
        points.push([x, Math.max(95, Math.min(155, y))]);
      }
      path.setAttribute('d', pointsToSvgPath(points));
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
