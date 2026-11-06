/**
 * SignalLab — Chapter 2: Transmission Fundamentals (Interactive Simulator & Lessons)
 * William Stallings, 2nd Edition (pp. 14-44)
 */

import { simEngine } from '../simulations/engine.js';
import { generateWaveformPoints, pointsToSvgPath } from '../utils/svgUtils.js';
import { calculateNyquistCapacity, calculateShannonCapacity } from '../utils/mathUtils.js';
import { formatFrequency, formatBitrate, formatDb } from '../utils/formatters.js';

export function renderChapter2(container, state, progressManager) {
  container.innerHTML = `
    <div class="lesson-container">
      <!-- Section Selector Tabs -->
      <div class="lesson-nav-tabs">
        <button class="lesson-tab-btn ${state.activeSectionId === 'sec-2.1' ? 'active' : ''}" data-sec="sec-2.1">
          2.1 Sinusoid & Fourier Synthesis
        </button>
        <button class="lesson-tab-btn ${state.activeSectionId === 'sec-2.3' ? 'active' : ''}" data-sec="sec-2.3">
          2.3 Nyquist vs Shannon Capacity
        </button>
        <button class="lesson-tab-btn ${state.activeSectionId === 'sec-2.2' ? 'active' : ''}" data-sec="sec-2.2">
          2.2 Analog vs Digital Signaling
        </button>
        <button class="lesson-tab-btn ${state.activeSectionId === 'sec-2.quiz' ? 'active' : ''}" data-sec="sec-2.quiz">
          Concept Check & Numerical Problems
        </button>
      </div>

      <div class="lesson-body" id="ch2-content">
        ${getSectionContent(state.activeSectionId || 'sec-2.1', state)}
      </div>
    </div>
  `;

  // Attach tab switching events
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

  attachSubEvents(container, state.activeSectionId || 'sec-2.1', progressManager);
}

function getSectionContent(secId, state) {
  switch (secId) {
    case 'sec-2.1':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 2.1 — TEXTBOOK PP. 15–22</div>
          <h2 class="lesson-title">Signals for Conveying Information: Equation 2.1 & Fourier Series</h2>
          <p class="lesson-text">
            According to Stallings, the fundamental building block of all communications signals is the continuous sinusoid:
          </p>
          <div class="formula-box-large">
            s(t) = A · sin(2π f t + φ)  [Equation 2.1]
          </div>
          <p class="lesson-text">
            Where <strong>A</strong> is Peak Amplitude (Volts), <strong>f</strong> is Frequency (Hz), and <strong>φ</strong> is Phase Shift (Radians).
            Any periodic signal can be decomposed into an infinite sum of harmonically related sine waves via <strong>Fourier Analysis</strong> (Appendix B):
          </p>
          <div class="formula-box-large">
            s(t) = (4/π) · [ sin(2πft) + (1/3)sin(6πft) + (1/5)sin(10πft) + ... ]
          </div>

          <!-- Interactive Sinusoid & Fourier Oscilloscope -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>REAL-TIME DUAL-DOMAIN WAVEFORM & SPECTRUM ENGINE</span>
              <span class="panel-tag" id="ch2-engine-status">ACTIVE VECTOR CLOCK</span>
            </div>

            <div class="ch2-oscilloscope-box">
              <svg viewBox="0 0 760 220" class="ch2-svg" id="ch2-scope-svg">
                <defs>
                  <pattern id="ch2-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 229, 255, 0.08)" stroke-width="1"/>
                  </pattern>
                </defs>
                <rect width="760" height="220" fill="#040812"/>
                <rect width="760" height="220" fill="url(#ch2-grid)"/>
                <line x1="0" y1="110" x2="760" y2="110" stroke="rgba(0, 229, 255, 0.25)" stroke-dasharray="4 4"/>
                <path id="ch2-wave-path" d="" fill="none" stroke="#00e5ff" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </div>

            <!-- Waveform Controls: Amplitude, Frequency, Phase, Harmonics -->
            <div class="ch2-controls-grid">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>AMPLITUDE (A)</span>
                  <span id="ch2-val-amp">1.00 V</span>
                </div>
                <input type="range" id="ch2-slider-amp" min="10" max="90" value="50" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>FREQUENCY (f)</span>
                  <span id="ch2-val-freq">2.00 Hz</span>
                </div>
                <input type="range" id="ch2-slider-freq" min="1" max="10" step="0.5" value="2" class="control-slider"/>
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
                  <span>FOURIER HARMONICS</span>
                  <span id="ch2-val-harm">1 (Pure Sine)</span>
                </div>
                <select id="ch2-select-harm" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="1">1 Harmonic (Pure Fundamental Sine)</option>
                  <option value="3">3 Harmonics (Fundamental + 3f)</option>
                  <option value="5">5 Harmonics (Fundamental + 3f + 5f)</option>
                  <option value="11">11 Harmonics (Approximating Square Wave)</option>
                  <option value="25">25 Harmonics (Sharp Pulse Wave)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'sec-2.3':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 2.3 — TEXTBOOK PP. 27–31</div>
          <h2 class="lesson-title">Channel Capacity: Nyquist Limit vs. Shannon Capacity Formula</h2>
          <p class="lesson-text">
            In data communications, the ultimate physical limit on the maximum transmission speed (bit rate in bps) over a communication channel is governed by two fundamental theorems:
          </p>

          <div class="comparison-cards-grid">
            <div class="comp-card">
              <div class="comp-header nyquist-header">
                <span>NYQUIST FORMULATION</span>
                <span class="comp-eq">EQ. 2.12</span>
              </div>
              <div class="comp-body">
                <div class="comp-formula">C = 2 · B · log₂(M)</div>
                <p><strong>Applies To:</strong> Noiseless channels where the only limitation is intersymbol interference (ISI).</p>
                <p><strong>Significance:</strong> Shows that data rate can be doubled either by doubling Bandwidth $B$ or by encoding multiple bits per signal element ($M$-ary signaling).</p>
              </div>
            </div>

            <div class="comp-card">
              <div class="comp-header shannon-header">
                <span>SHANNON CAPACITY LIMIT</span>
                <span class="comp-eq">EQ. 2.13</span>
              </div>
              <div class="comp-body">
                <div class="comp-formula">C = B · log₂(1 + SNR)</div>
                <p><strong>Applies To:</strong> Real-world physical channels corrupted by thermal Gaussian noise (AWGN).</p>
                <p><strong>Significance:</strong> Establishes the theoretical maximum error-free data rate achievable regardless of the encoding scheme or modulation complexity.</p>
              </div>
            </div>
          </div>

          <!-- Interactive Capacity Calculator -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>WORKED EXAMPLE CALCULATOR (STALLINGS EXAMPLE 2.4 & 2.5)</span>
              <span class="panel-tag">LIVE BOUNDARY COMPARISON</span>
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
                  <span>DISCRETE SIGNAL LEVELS (M)</span>
                  <span id="ch2-calc-m-val">4 (2 bits/symbol)</span>
                </div>
                <select id="ch2-calc-m" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="2">M=2 (Binary: 1 bit/symbol)</option>
                  <option value="4" selected>M=4 (QPSK: 2 bits/symbol)</option>
                  <option value="8">M=8 (8-PSK: 3 bits/symbol)</option>
                  <option value="16">M=16 (16-QAM: 4 bits/symbol)</option>
                  <option value="64">M=64 (64-QAM: 6 bits/symbol)</option>
                </select>
              </div>
            </div>

            <!-- Dynamic Comparison Outputs -->
            <div class="calc-results-grid">
              <div class="res-card">
                <div class="res-title">NYQUIST THEORETICAL RATE</div>
                <div class="res-val" id="ch2-out-nyquist">80.00 Mbps</div>
                <div class="res-sub">C = 2 · 20MHz · log₂(4) = 80 Mbps</div>
              </div>

              <div class="res-card highlight">
                <div class="res-title">SHANNON GAUSSIAN CAPACITY CEILING</div>
                <div class="res-val" id="ch2-out-shannon">166.11 Mbps</div>
                <div class="res-sub">Maximum error-free rate given +25 dB SNR</div>
              </div>

              <div class="res-card">
                <div class="res-title">SPECTRAL EFFICIENCY</div>
                <div class="res-val" id="ch2-out-eff">8.31 bps/Hz</div>
                <div class="res-sub">Normalized throughput density (C / B)</div>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'sec-2.2':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 2.2 — TEXTBOOK PP. 22–27</div>
          <h2 class="lesson-title">Analog vs Digital: Data, Signaling, and Transmission</h2>
          <p class="lesson-text">
            Stallings emphasizes a critical three-way taxonomy in wireless engineering: distinguishing between the nature of the <strong>data</strong> (entities that convey meaning), the <strong>signaling</strong> (electromagnetic representations of data), and the <strong>transmission</strong> (the propagation method).
          </p>

          <div class="taxonomy-table-container">
            <table class="taxonomy-table">
              <thead>
                <tr>
                  <th>Concept</th>
                  <th>Analog Representation</th>
                  <th>Digital Representation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Data (§2.2.1)</strong></td>
                  <td>Continuous values over an interval (e.g., human voice acoustics, physical temperature).</td>
                  <td>Discrete values (e.g., binary integers, ASCII text characters).</td>
                </tr>
                <tr>
                  <td><strong>Signaling (§2.2.2)</strong></td>
                  <td>Continuously varying electromagnetic waves; can propagate over multiple media (wire, radio).</td>
                  <td>Sequence of discrete, discontinuous voltage pulses (e.g., +5V and 0V).</td>
                </tr>
                <tr>
                  <td><strong>Transmission (§2.2.3)</strong></td>
                  <td>Transmitted via amplifiers. Boosts signal along with accumulated noise; causes distortion.</td>
                  <td>Transmitted via repeaters. Recovers 1s and 0s and generates a clean new signal; eliminates noise accumulation!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

    case 'sec-2.quiz':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">CHAPTER 2 REVIEW & QUANTITATIVE PROBLEMS</div>
          <h2 class="lesson-title">Stallings Numerical Problems & Review Questions</h2>
          <p class="lesson-text">
            Solve these real numerical questions taken directly from Stallings Chapter 2 Section 2.7.
          </p>

          <div class="quiz-container">
            <div class="quiz-question-box" data-q="ch2-1">
              <div class="q-number">PROBLEM 2.1 (STALLINGS PROBLEM 2.10)</div>
              <div class="q-text">A noiseless 4-kHz channel transmits using discrete signal levels with M = 8. What is the maximum Nyquist data rate?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="false">A. 12 kbps</button>
                <button class="q-opt" data-correct="true">B. 24 kbps (C = 2 · 4000 · log₂(8) = 2 · 4000 · 3 = 24,000 bps)</button>
                <button class="q-opt" data-correct="false">C. 32 kbps</button>
                <button class="q-opt" data-correct="false">D. 64 kbps</button>
              </div>
              <div class="q-feedback"></div>
            </div>

            <div class="quiz-question-box" data-q="ch2-2" style="margin-top: 16px;">
              <div class="q-number">PROBLEM 2.2 (STALLINGS EXAMPLE 2.5)</div>
              <div class="q-text">Given a channel bandwidth of 3 kHz and a Signal-to-Noise Ratio (SNR) of 30 dB (SNR_linear = 1000). What is the Shannon channel capacity?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="false">A. 10 kbps</button>
                <button class="q-opt" data-correct="false">B. 19.8 kbps</button>
                <button class="q-opt" data-correct="true">C. ~29.9 kbps (C = 3000 · log₂(1 + 1000) ≈ 3000 · 9.967 = 29,901 bps)</button>
                <button class="q-opt" data-correct="false">D. 60 kbps</button>
              </div>
              <div class="q-feedback"></div>
            </div>
          </div>
        </div>
      `;
    default:
      return `<p>Select a section from the tabs above.</p>`;
  }
}

// Variables for Chapter 2 interactive oscilloscope
let ch2State = {
  amp: 50,
  freq: 2,
  phase: 0,
  harmonics: 1,
  calcBw: 20000000,
  calcSnr: 25,
  calcM: 4
};

function attachSubEvents(container, secId, progressManager) {
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
        if (valAmp) valAmp.textContent = `${(ch2State.amp / 50).toFixed(2)} V`;
      });
    }

    if (sliderFreq) {
      sliderFreq.addEventListener('input', (e) => {
        ch2State.freq = Number(e.target.value);
        if (valFreq) valFreq.textContent = `${ch2State.freq.toFixed(1)} Hz`;
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
      });
    }

    // Subscribe to simulation engine clock
    const pathEl = container.querySelector('#ch2-wave-path');
    if (pathEl) {
      simEngine.subscribe((time) => {
        const path = container.querySelector('#ch2-wave-path');
        if (!path) return;
        const width = 760;
        const height = 220;
        const midY = height / 2;
        const points = [];
        const numSamples = 200;

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
          points.push([x, Math.max(5, Math.min(height - 5, y))]);
        }

        path.setAttribute('d', pointsToSvgPath(points));
      });
    }
  }

  if (secId === 'sec-2.3') {
    const sliderBw = container.querySelector('#ch2-calc-bw');
    const sliderSnr = container.querySelector('#ch2-calc-snr');
    const selectM = container.querySelector('#ch2-calc-m');

    const valBw = container.querySelector('#ch2-calc-bw-val');
    const valSnr = container.querySelector('#ch2-calc-snr-val');
    const valM = container.querySelector('#ch2-calc-m-val');

    const outNyquist = container.querySelector('#ch2-out-nyquist');
    const outShannon = container.querySelector('#ch2-out-shannon');
    const outEff = container.querySelector('#ch2-out-eff');

    const updateCalc = () => {
      if (valBw) valBw.textContent = formatFrequency(ch2State.calcBw);
      if (valSnr) valSnr.textContent = formatDb(ch2State.calcSnr);
      if (valM) valM.textContent = `M=${ch2State.calcM} (${Math.log2(ch2State.calcM)} bits/sym)`;

      const nyqRate = calculateNyquistCapacity(ch2State.calcBw, ch2State.calcM);
      const shanRate = calculateShannonCapacity(ch2State.calcBw, ch2State.calcSnr);
      const eff = shanRate / ch2State.calcBw;

      if (outNyquist) outNyquist.textContent = formatBitrate(nyqRate);
      if (outShannon) outShannon.textContent = formatBitrate(shanRate);
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

  // Quiz evaluation
  if (secId === 'sec-2.quiz') {
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
            fb.innerHTML = `<span style="color: var(--status-ready); font-weight: 600;">✓ Correct!</span> Exactly matches William Stallings Eq. 2.12 / 2.13.`;
          } else {
            opt.classList.add('wrong');
            fb.innerHTML = `<span style="color: var(--status-danger); font-weight: 600;">✗ Incorrect.</span> Re-calculate using Nyquist / Shannon formula.`;
          }
        });
      });
    });
  }
}
