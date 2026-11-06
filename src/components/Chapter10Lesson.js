/**
 * SignalLab — Chapter 10: Cellular Wireless Networks (Comprehensive Interactive Engineering Suite)
 * William Stallings, Wireless Communications and Networks, 2nd Edition (pp. 264–325)
 *
 * Full Analytical & Animated Coverage:
 * - §10.1 Principles of Cellular Networks: Hexagonal geometry (d = √3R), cluster size N = i² + j² + ij (N=3,4,7,12,19),
 *         co-channel reuse distance D = R√(3N), cell splitting/sectoring, handoff mechanisms (Hysteresis H + Threshold Th),
 *         power control (open vs closed loop), traffic engineering (Erlang B loss formula P = (A^N / N!) / sum(A^k / k!)).
 * - §10.2 1G Analog Systems (AMPS): FDMA channel allocation (30 kHz channels, 21 control channels, RCC/FCC framing).
 * - §10.3 2G TDMA Systems (GSM): TDMA frame hierarchy (8 slots/frame, 4.615 ms, slow frequency hopping, GMSK).
 * - §10.4 2G CDMA Systems (IS-95): Direct-sequence spread spectrum (1.2288 Mcps), orthogonal Walsh 64 codes, RAKE receiver, soft handoff.
 * - §10.5 3G Systems (W-CDMA & CDMA2000 1xEV-DO): 5 MHz carriers, adaptive modulation (QPSK/16-QAM), high data rate scheduling.
 * - §10.7 Stallings Numerical Problems & Review (Problems 10.1, 10.5, 10.7, 10.8).
 */

import { simEngine } from '../simulations/engine.js';
import { pointsToSvgPath } from '../utils/svgUtils.js';
import { formatFrequency, formatBitrate, formatDb } from '../utils/formatters.js';

export function renderChapter10(container, state, progressManager) {
  const currentSec = state.activeSectionId && state.activeSectionId.startsWith('sec-10')
    ? state.activeSectionId
    : 'sec-10.1';

  container.innerHTML = `
    <div class="lesson-container">
      <!-- Section Navigation Tabs -->
      <div class="lesson-nav-tabs">
        <button class="lesson-tab-btn ${currentSec === 'sec-10.1' ? 'active' : ''}" data-sec="sec-10.1">
          10.1 Cellular Geometry & Handoff
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.erlang' ? 'active' : ''}" data-sec="sec-10.erlang">
          10.1 Traffic Engineering (Erlang B)
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.access' ? 'active' : ''}" data-sec="sec-10.access">
          Multiple Access: FDMA vs TDMA vs CDMA
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.cdma' ? 'active' : ''}" data-sec="sec-10.cdma">
          10.4 CDMA, Walsh Codes & RAKE
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.3g' ? 'active' : ''}" data-sec="sec-10.3g">
          10.5 3G W-CDMA & 1xEV-DO
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.problems' ? 'active' : ''}" data-sec="sec-10.problems">
          10.7 Problems & Calculations
        </button>
      </div>

      <div class="lesson-body" id="ch10-content">
        ${getSectionContent(currentSec, state)}
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
      const contentEl = container.querySelector('#ch10-content');
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
    case 'sec-10.1':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.1 — TEXTBOOK PP. 265–277</div>
          <h2 class="lesson-title">Principles of Cellular Networks: Hexagonal Clusters, Frequency Reuse, & Handoff Hysteresis</h2>
          <p class="lesson-text">
            Prior to cellular radio, high-power mobile systems supported only ~25 channels across an 80-km radius. Cellular design achieves immense capacity by deploying a grid of low-power base stations ($\le 100\text{ W}$) and reusing frequency bands across spatially separated cells.
          </p>

          <div class="formula-box-large">
            N = i² + j² + i·j  (Possible N = 1, 3, 4, 7, 9, 12, 19...)  |  D = R · √(3N)  |  D/d = √N
          </div>
          <p class="lesson-text">
            Where <strong>R</strong> is cell radius, <strong>d = √3·R</strong> is distance between adjacent cell centers, <strong>D</strong> is co-channel reuse distance, and <strong>N</strong> is the cluster reuse factor.
          </p>

          <!-- Interactive Hexagonal Cluster & Handoff Simulator -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>LIVE ANIMATED LAB: FREQUENCY REUSE CLUSTER & REAL-TIME HANDOFF HYSTERESIS ENGINE</span>
              <span class="panel-tag" id="ch10-handoff-status">MOBILE SPEED: 60 km/h</span>
            </div>

            <!-- Two-Column Interactive View: Hex Map + Signal Handoff Graph -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
              <!-- Left: Hexagonal Grid with moving vehicle -->
              <div style="background: #03060c; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px; height: 260px; position: relative;">
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan); margin-bottom: 6px;">
                  HEXAGONAL CELL CLUSTER (N=7 REUSE PATTERN)
                </div>
                <svg viewBox="0 0 380 220" style="width: 100%; height: 210px;" id="hex-cluster-svg">
                  <!-- Hexagons (A through G) -->
                  <g id="hex-cells-group"></g>
                  <!-- Moving Mobile Vehicle with Signal Radiation Vector -->
                  <circle id="mobile-vehicle-dot" cx="120" cy="110" r="6" fill="#ff0055" stroke="#ffffff" stroke-width="2"/>
                  <line id="mobile-serving-link" x1="120" y1="110" x2="110" y2="110" stroke="#00e5ff" stroke-width="2" stroke-dasharray="3 3"/>
                  <text id="mobile-vehicle-label" x="128" y="114" fill="#ffffff" font-size="9" font-family="monospace">MS-1</text>
                </svg>
              </div>

              <!-- Right: Real-Time Handoff Signal Strengths (Figure 10.7) -->
              <div style="background: #03060c; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px; height: 260px;">
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-sky); margin-bottom: 6px;">
                  DYNAMIC RSSI & HANDOFF DECISION GRAPH (FIG. 10.7)
                </div>
                <svg viewBox="0 0 380 200" style="width: 100%; height: 200px;" id="handoff-graph-svg">
                  <!-- Grid -->
                  <line x1="40" y1="20" x2="360" y2="20" stroke="rgba(255,255,255,0.06)"/>
                  <line x1="40" y1="80" x2="360" y2="80" stroke="rgba(255,255,255,0.06)"/>
                  <line x1="40" y1="140" x2="360" y2="140" stroke="rgba(255,255,255,0.06)"/>
                  <line x1="40" y1="170" x2="360" y2="170" stroke="rgba(255,255,255,0.2)"/>
                  <!-- Base Station A Power Curve (Blue) -->
                  <path d="M 40 40 Q 200 90, 360 160" fill="none" stroke="#0070f3" stroke-width="2.5"/>
                  <text x="45" y="35" fill="#38bdf8" font-size="9" font-family="monospace">BS-A Power</text>
                  <!-- Base Station B Power Curve (Green) -->
                  <path d="M 40 160 Q 200 90, 360 40" fill="none" stroke="#00ff9d" stroke-width="2.5"/>
                  <text x="300" y="35" fill="#00ff9d" font-size="9" font-family="monospace">BS-B Power</text>
                  <!-- Hysteresis Margin H -->
                  <line x1="40" y1="125" x2="360" y2="125" stroke="#ffb703" stroke-width="1.5" stroke-dasharray="4 4"/>
                  <text x="45" y="120" fill="#ffb703" font-size="8" font-family="monospace">Threshold Th (-95 dBm)</text>
                  <!-- Current Car Position Line on Graph -->
                  <line id="graph-car-pos" x1="120" y1="20" x2="120" y2="170" stroke="#ff0055" stroke-width="2"/>
                </svg>
              </div>
            </div>

            <!-- Interactive Parameters: Cluster Size N, Hysteresis Margin H, Mobile Speed -->
            <div class="ch2-controls-grid">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>CLUSTER REUSE FACTOR (N)</span>
                  <span id="ch10-val-n">N = 7</span>
                </div>
                <select id="ch10-select-n" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="3">N = 3 (Aggressive Reuse, D = 3.00 R)</option>
                  <option value="4">N = 4 (D = 3.46 R)</option>
                  <option value="7" selected>N = 7 (AMPS / GSM Standard, D = 4.58 R)</option>
                  <option value="12">N = 12 (Conservative, D = 6.00 R)</option>
                  <option value="19">N = 19 (High Isolation, D = 7.55 R)</option>
                </select>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>HYSTERESIS MARGIN (ΔH)</span>
                  <span id="ch10-val-h">4.0 dB</span>
                </div>
                <input type="range" id="ch10-slider-h" min="0" max="10" step="0.5" value="4" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>HANDOFF STRATEGY</span>
                  <span id="ch10-val-strat">Hysteresis + Th</span>
                </div>
                <select id="ch10-select-strat" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="rel">Relative Signal Strength (Ping-Pong Risk!)</option>
                  <option value="th">Relative Signal with Threshold Th</option>
                  <option value="h" selected>Relative Signal with Hysteresis (H)</option>
                  <option value="h_th">Hysteresis (H) + Threshold (Th) (Standard)</option>
                </select>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>MOBILE TRAJECTORY SPEED</span>
                  <span id="ch10-val-speed">60 km/h</span>
                </div>
                <input type="range" id="ch10-slider-speed" min="10" max="140" step="5" value="60" class="control-slider"/>
              </div>
            </div>

            <!-- Live Telemetry Results -->
            <div class="calc-results-grid" style="margin-top: 14px;">
              <div class="res-card">
                <div class="res-title">CO-CHANNEL REUSE DISTANCE (D)</div>
                <div class="res-val" id="ch10-out-d">4.58 · R</div>
                <div class="res-sub">D = R · √(3 · 7) = 4.58 R</div>
              </div>

              <div class="res-card highlight">
                <div class="res-title">SERVING BASE STATION</div>
                <div class="res-val" id="ch10-out-serving">CELL A (BS-A)</div>
                <div class="res-sub" id="ch10-out-rssi">RSSI: -68.4 dBm | Target BS-B: -82.1 dBm</div>
              </div>

              <div class="res-card">
                <div class="res-title">HANDOFF DECISION STATE</div>
                <div class="res-val" id="ch10-out-handstate" style="color: var(--status-ready);">LOCKED TO BS-A</div>
                <div class="res-sub" id="ch10-out-pingpong">Ping-Pong Flaps: 0</div>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'sec-10.erlang':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.1.5 — TEXTBOOK PP. 278–282</div>
          <h2 class="lesson-title">Traffic Engineering: Erlang B Blocking Probability Formula & Capacity Sizing</h2>
          <p class="lesson-text">
            Because subscriber traffic fluctuates randomly, sizing a cellular system to accommodate the peak possible load would be economically prohibitive. Cellular systems are engineered based on <strong>Blocked Calls Cleared</strong> using the <strong>Erlang B loss formula</strong>.
          </p>

          <div class="formula-box-large">
            P = \\frac{A^N / N!}{\\sum_{k=0}^{N} (A^k / k!)}   [Erlang B Equation 10.1]
          </div>
          <p class="lesson-text">
            Where <strong>A = λ · h</strong> is Traffic Intensity in Erlangs, <strong>λ</strong> is mean call arrival rate (calls/sec), <strong>h</strong> is mean call holding duration (seconds), <strong>N</strong> is total number of allocated traffic radio channels (trunks), and <strong>P</strong> is the call blocking probability (Grade of Service $GOS \le 2\%$).
          </p>

          <!-- Interactive Erlang B Sizing Workbench -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>WORKED TRAFFIC SIZING CALCULATOR (STALLINGS TABLE 10.3 & PROBLEM 10.8)</span>
              <span class="panel-tag">NUMERICAL ERLANG B ENGINE</span>
            </div>

            <div class="ch2-controls-grid">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>ALLOCATED CHANNELS PER CELL (N)</span>
                  <span id="erlang-val-n">25 Channels</span>
                </div>
                <input type="range" id="erlang-slider-n" min="1" max="100" value="25" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>BUSY-HOUR ARRIVAL RATE (λ)</span>
                  <span id="erlang-val-lambda">1.2 calls/user-hr</span>
                </div>
                <input type="range" id="erlang-slider-lambda" min="0.2" max="5.0" step="0.1" value="1.2" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>AVERAGE CALL DURATION (h)</span>
                  <span id="erlang-val-h">120 seconds</span>
                </div>
                <input type="range" id="erlang-slider-h" min="30" max="360" step="10" value="120" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>CELL SUBSCRIBER COUNT</span>
                  <span id="erlang-val-users">500 Users</span>
                </div>
                <input type="range" id="erlang-slider-users" min="50" max="2000" step="25" value="500" class="control-slider"/>
              </div>
            </div>

            <!-- Dynamic Capacity Telemetry -->
            <div class="calc-results-grid" style="margin-top: 14px;">
              <div class="res-card">
                <div class="res-title">OFFERED TRAFFIC LOAD (A)</div>
                <div class="res-val" id="erlang-out-a">20.00 Erlangs</div>
                <div class="res-sub">A = (500 users · 1.2 calls/hr · 120s) / 3600s</div>
              </div>

              <div class="res-card highlight">
                <div class="res-title">BLOCKING PROBABILITY (P)</div>
                <div class="res-val" id="erlang-out-p">4.28%</div>
                <div class="res-sub" id="erlang-out-gos">Grade of Service: Unsatisfactory (&gt; 2% Target)</div>
              </div>

              <div class="res-card">
                <div class="res-title">CARRIED TRAFFIC</div>
                <div class="res-val" id="erlang-out-carried">19.14 Erlangs</div>
                <div class="res-sub">A_carried = A · (1 - P)</div>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'sec-10.access':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTIONS 10.2, 10.3, 10.4 — TEXTBOOK PP. 282–304</div>
          <h2 class="lesson-title">Comprehensive Multiple Access Matrix: FDMA vs. TDMA vs. CDMA Architecture</h2>
          <p class="lesson-text">
            Cellular generations represent fundamentally different approaches to multiplexing multiple mobile subscribers across the electromagnetic spectrum:
          </p>

          <!-- 3-Way Multiple Access Visual Comparison -->
          <div class="comparison-cards-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
            <div class="comp-card">
              <div class="comp-header nyquist-header">
                <span>1G: FDMA (AMPS)</span>
                <span class="comp-eq">FREQ SLICED</span>
              </div>
              <div class="comp-body">
                <p><strong>Principle:</strong> Total bandwidth is divided into narrow frequency slices (30 kHz simplex in AMPS). Each user is assigned an exclusive carrier pair for the entire call.</p>
                <p><strong>Limitation:</strong> Inefficient when callers are silent; hard handoff required; no encryption.</p>
              </div>
            </div>

            <div class="comp-card">
              <div class="comp-header shannon-header">
                <span>2G: TDMA (GSM)</span>
                <span class="comp-eq">TIME SLICED</span>
              </div>
              <div class="comp-body">
                <p><strong>Principle:</strong> 200 kHz carriers are cyclically subdivided into 8 time slots (577 µs each, 4.615 ms frame). Each user transmits digital speech bursts in their pre-assigned slot.</p>
                <p><strong>Advantage:</strong> Efficient digital compression (13 kbps RPE-LPC), slow frequency hopping.</p>
              </div>
            </div>

            <div class="comp-card">
              <div class="comp-header" style="background: rgba(255, 0, 85, 0.2); border-bottom: 1px solid #ff0055; color: #ff0055;">
                <span>2G/3G: CDMA (IS-95)</span>
                <span class="comp-eq">CODE SLICED</span>
              </div>
              <div class="comp-body">
                <p><strong>Principle:</strong> All users share the entire 1.25 MHz / 5 MHz bandwidth simultaneously all the time! Transmissions are separated by orthogonal 64-bit Walsh chipping codes.</p>
                <p><strong>Advantage:</strong> Universal frequency reuse ($N=1$), soft handoff, RAKE multipath combining.</p>
              </div>
            </div>
          </div>

          <!-- Live Interactive Animated Multi-Access Dimension Visualizer -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>REAL-TIME 3D SPECTRUM MULTIPLEXING ENGINE (TIME × FREQUENCY × CODE DIMENSIONS)</span>
              <span class="panel-tag">CLICK TABS TO SWITCH MULTIPLEXING DIMENSION</span>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <button class="btn-ctrl active" id="btn-access-fdma" style="flex: 1;">📡 FDMA (FREQUENCY SEPARATION)</button>
              <button class="btn-ctrl" id="btn-access-tdma" style="flex: 1;">⏱️ TDMA (TIME SLOT BURSTS)</button>
              <button class="btn-ctrl" id="btn-access-cdma" style="flex: 1;">🧬 CDMA (ORTHOGONAL CODES)</button>
            </div>

            <!-- Dynamic Access Mode Canvas -->
            <div style="background: #03060c; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px;">
              <svg viewBox="0 0 760 220" style="width: 100%; height: 220px;" id="access-visual-svg">
                <!-- Axes -->
                <line x1="60" y1="180" x2="720" y2="180" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                <line x1="60" y1="20" x2="60" y2="180" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                <text x="680" y="198" fill="#64748b" font-size="11" font-family="monospace">TIME (t)</text>
                <text x="15" y="30" fill="#64748b" font-size="11" font-family="monospace">FREQ (f)</text>
                <!-- Dynamic Content Container -->
                <g id="access-dynamic-shapes"></g>
              </svg>
            </div>

            <div class="callout-box" id="access-desc-box">
              <strong>FDMA Mode:</strong> Dedicated continuous frequency channels $f_1, f_2, f_3, f_4$. No user shares frequency; guard bands prevent crosstalk.
            </div>
          </div>
        </div>
      `;

    case 'sec-10.cdma':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.4 — TEXTBOOK PP. 298–304</div>
          <h2 class="lesson-title">CDMA & Spread Spectrum: Orthogonal Walsh 64 Codes, Soft Handoff, & RAKE Receiver</h2>
          <p class="lesson-text">
            In second-generation CDMA (IS-95), transmissions are spread by direct sequence (DS-SS) using 64 orthogonal 64-bit Walsh codes derived from a $64 \times 64$ Hadamard matrix. The chipping rate is <strong>1.2288 Mcps</strong> (spreading a 19.2 ksps symbol stream by a factor of 64).
          </p>

          <!-- Interactive Walsh Code Orthogonality Tester -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>INTERACTIVE WALSH CODE ORTHOGONALITY & CHIPPING RECOVERY ENGINE</span>
              <span class="panel-tag">INNER PRODUCT DE-SPREADING</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>DESIRED USER (WALSH CODE 1)</span>
                  <span id="walsh-user-lbl">USER 1: W₂(1, -1, 1, -1)</span>
                </div>
                <select id="walsh-select-user" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="1">User 1 [Code W₁: +1, +1, +1, +1]</option>
                  <option value="2" selected>User 2 [Code W₂: +1, -1, +1, -1]</option>
                  <option value="3">User 3 [Code W₃: +1, +1, -1, -1]</option>
                  <option value="4">User 4 [Code W₄: +1, -1, -1, +1]</option>
                </select>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>INTERFERING USERS ON AIR</span>
                  <span id="walsh-users-active">4 Active Users</span>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 6px;">
                  <label style="font-size: 0.8rem; color: #fff;"><input type="checkbox" id="chk-u1" checked/> U1</label>
                  <label style="font-size: 0.8rem; color: #fff;"><input type="checkbox" id="chk-u2" checked/> U2</label>
                  <label style="font-size: 0.8rem; color: #fff;"><input type="checkbox" id="chk-u3" checked/> U3</label>
                  <label style="font-size: 0.8rem; color: #fff;"><input type="checkbox" id="chk-u4" checked/> U4</label>
                </div>
              </div>
            </div>

            <!-- Composite Waveform & Correlator Output Display -->
            <div style="background: #03060c; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; margin-top: 12px;">
              <svg viewBox="0 0 720 160" style="width: 100%; height: 160px;" id="walsh-svg">
                <!-- Composite Waveform -->
                <text x="20" y="24" fill="#64748b" font-size="10" font-family="monospace">COMPOSITE AIR SIGNAL (SUM OF USERS)</text>
                <path id="walsh-composite-wave" d="" fill="none" stroke="#ffb703" stroke-width="2.5"/>
                <!-- De-spread Correlator Integral -->
                <line x1="20" y1="100" x2="700" y2="100" stroke="rgba(255,255,255,0.15)"/>
                <text x="20" y="118" fill="#00ff9d" font-size="10" font-family="monospace" id="walsh-correlator-text">
                  CORRELATOR OUTPUT (⟨Composite, W_k⟩): +4.0 → RECOVERED BIT = 1 (100% ORTHOGONAL)
                </text>
              </svg>
            </div>

            <!-- RAKE Receiver Principle (Figure 10.17) -->
            <div class="callout-box" style="margin-top: 12px;">
              <strong>RAKE Receiver Principle (Stallings Figure 10.17):</strong> In multipath environments, reflections arriving $\gt 1\text{ chip}$ apart are resolved as independent echoes. A RAKE receiver assigns independent correlator "fingers" to each delayed path ($\tau_1, \tau_2, \tau_3$) and performs maximal ratio combining to dramatically improve signal SNR.
            </div>
          </div>
        </div>
      `;

    case 'sec-10.3g':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.5 — TEXTBOOK PP. 304–314</div>
          <h2 class="lesson-title">Third-Generation Systems (3G): W-CDMA & CDMA2000 1xEV-DO Architecture</h2>
          <p class="lesson-text">
            Third-generation (3G) systems transitioned cellular networks from voice-centric circuits to broadband packet-switched multimedia data. Two dominant standards emerged under ITU IMT-2000: European <strong>W-CDMA (UMTS)</strong> and North American <strong>CDMA2000 1xEV-DO</strong>.
          </p>

          <!-- 3G Technology Breakdown Table -->
          <div class="taxonomy-table-container">
            <table class="taxonomy-table">
              <thead>
                <tr>
                  <th>Design Feature</th>
                  <th>W-CDMA (UMTS) Table 10.8</th>
                  <th>CDMA2000 1xEV-DO Table 10.9</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Channel Bandwidth</strong></td>
                  <td>5.0 MHz carrier</td>
                  <td>1.25 MHz (matches 1x IS-95 carrier)</td>
                </tr>
                <tr>
                  <td><strong>Chip Rate</strong></td>
                  <td>3.84 Mcps</td>
                  <td>1.2288 Mcps</td>
                </tr>
                <tr>
                  <td><strong>Peak Downlink Rate</strong></td>
                  <td>Up to 2.0 Mbps (384 kbps wide-area)</td>
                  <td>Up to 2.4576 Mbps (using adaptive 16-QAM)</td>
                </tr>
                <tr>
                  <td><strong>Design Philosophy</strong></td>
                  <td>Dual voice + multimedia packet transmission.</td>
                  <td><strong>Data-Only (DO):</strong> Optimized strictly for IP packets; voice carried via VoIP.</td>
                </tr>
                <tr>
                  <td><strong>Adaptation Method</strong></td>
                  <td>Fast closed-loop power control (1,500 Hz).</td>
                  <td><strong>Adaptive Modulation & Coding:</strong> Alters data rate (QPSK, 8-PSK, 16-QAM) rather than RF power!</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Interactive 1xEV-DO Adaptive Rate Engine -->
          <div class="interactive-panel" style="margin-top: 14px;">
            <div class="panel-header">
              <span>CDMA2000 1xEV-DO ADAPTIVE MODULATION & CODING SIMULATOR (TABLE 10.9)</span>
              <span class="panel-tag">DYNAMIC SNR RATE SELECTION</span>
            </div>

            <div class="ch2-controls-grid">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>MOBILE RECEIVED SNR</span>
                  <span id="evdo-val-snr">+14.0 dB</span>
                </div>
                <input type="range" id="evdo-slider-snr" min="-5" max="25" step="1" value="14" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>SELECTED MODULATION</span>
                  <span id="evdo-val-mod">16-QAM</span>
                </div>
                <div id="evdo-mod-badge" style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-cyan); margin-top: 6px;">
                  16-QAM (4 bits/symbol)
                </div>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>TURBO CODE RATE</span>
                  <span id="evdo-val-coderate">Code Rate 1/3</span>
                </div>
                <div id="evdo-code-desc" style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-main); margin-top: 6px;">
                  Heavy Error Correction
                </div>
              </div>
            </div>

            <div class="calc-results-grid" style="margin-top: 14px;">
              <div class="res-card">
                <div class="res-title">SCHEDULED PACKET SLOTS</div>
                <div class="res-val" id="evdo-out-slots">1 Slot (1.67 ms)</div>
                <div class="res-sub">High SNR allows single-slot burst</div>
              </div>

              <div class="res-card highlight">
                <div class="res-title">EFFECTIVE FORWARD DATA RATE</div>
                <div class="res-val" id="evdo-out-rate">2457.6 kbps (2.46 Mbps)</div>
                <div class="res-sub">Maximum Peak 1xEV-DO Throughput</div>
              </div>

              <div class="res-card">
                <div class="res-title">PACKET SIZE DELIVERED</div>
                <div class="res-val" id="evdo-out-size">512 Bytes</div>
                <div class="res-sub">Delivered in 1.67 ms duration</div>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'sec-10.problems':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.7 — TEXTBOOK PP. 314–315</div>
          <h2 class="lesson-title">William Stallings Chapter 10: Quantitative Problems & Calculations</h2>
          <p class="lesson-text">
            Solve these real cellular network homework and exam problems taken directly from Stallings Chapter 10.
          </p>

          <div class="quiz-container">
            <div class="quiz-question-box" data-q="p10.1">
              <div class="q-number">PROBLEM 10.1 (STALLINGS TEXTBOOK P. 314)</div>
              <div class="q-text">A cellular system operates with 825–845 MHz (mobile TX) and 870–890 MHz (BS TX) with 30-kHz duplex channels (total K = 666 channels). For a frequency reuse factor N = 7, how many simultaneous channels can be supported in a single cell?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="false">A. 19 channels</button>
                <button class="q-opt" data-correct="false">B. 57 channels</button>
                <button class="q-opt" data-correct="true">C. ~95 channels (K/N = 666 / 7 ≈ 95.14 channels per cell)</button>
                <button class="q-opt" data-correct="false">D. 120 channels</button>
              </div>
              <div class="q-feedback"></div>
            </div>

            <div class="quiz-question-box" data-q="p10.5" style="margin-top: 14px;">
              <div class="q-number">PROBLEM 10.5 (STALLINGS TEXTBOOK P. 315)</div>
              <div class="q-text">A telephony connection has a duration of 23 minutes. This is the only connection made by this caller during the course of a 1-hour observation window. What is the traffic load in Erlangs?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="false">A. 0.23 Erlangs</button>
                <button class="q-opt" data-correct="true">B. 0.383 Erlangs — Since A = h / T = 23 min / 60 min = 0.3833 Erlangs</button>
                <button class="q-opt" data-correct="false">C. 1.00 Erlang</button>
                <button class="q-opt" data-correct="false">D. 0.50 Erlangs</button>
              </div>
              <div class="q-feedback"></div>
            </div>

            <div class="quiz-question-box" data-q="p10.14" style="margin-top: 14px;">
              <div class="q-number">PROBLEM 10.7 (STALLINGS TEXTBOOK P. 315)</div>
              <div class="q-text">An analog cellular system has 33 MHz total bandwidth using 25-kHz simplex channels (50 kHz per full-duplex circuit). What is the total number of duplex channels available per cell for N = 7?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="false">A. 47 channels</button>
                <button class="q-opt" data-correct="true">B. 94 channels — Total channels K = 33,000 kHz / (2 · 25 kHz) = 660. Channels per cell = 660 / 7 ≈ 94.28</button>
                <button class="q-opt" data-correct="false">C. 165 channels</button>
                <button class="q-opt" data-correct="false">D. 330 channels</button>
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

// Chapter 10 State & Simulation Logic
const ch10State = {
  n: 7,
  h: 4.0,
  strategy: 'h_th',
  speed: 60,
  carT: 0,
  accessMode: 'fdma',
  evdoSnr: 14
};

function attachSubEvents(container, secId, progressManager) {
  // --- Section 10.1: Hex Cluster & Handoff Events ---
  if (secId === 'sec-10.1') {
    const selectN = container.querySelector('#ch10-select-n');
    const sliderH = container.querySelector('#ch10-slider-h');
    const selectStrat = container.querySelector('#ch10-select-strat');
    const sliderSpeed = container.querySelector('#ch10-slider-speed');

    const valN = container.querySelector('#ch10-val-n');
    const valH = container.querySelector('#ch10-val-h');
    const valSpeed = container.querySelector('#ch10-val-speed');

    const outD = container.querySelector('#ch10-out-d');
    const outServing = container.querySelector('#ch10-out-serving');
    const outRssi = container.querySelector('#ch10-out-rssi');
    const outHandstate = container.querySelector('#ch10-out-handstate');

    const hexGroup = container.querySelector('#hex-cells-group');
    const renderHexGrid = (N) => {
      if (!hexGroup) return;
      const R = 32;
      // Hexagon coordinates builder helper
      const hexPoints = (cx, cy, r) => {
        let pts = [];
        for (let a = 0; a < 6; a++) {
          const angle = (Math.PI / 3) * a;
          pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
        }
        return pts.join(' ');
      };

      const cells = [
        { name: 'Cell A (BS-A)', cx: 120, cy: 110, color: '#0070f3' },
        { name: 'Cell B (BS-B)', cx: 200, cy: 110, color: '#00ff9d' },
        { name: 'Cell C', cx: 160, cy: 45, color: '#38bdf8' },
        { name: 'Cell D', cx: 240, cy: 45, color: '#ffb703' },
        { name: 'Cell E', cx: 160, cy: 175, color: '#818cf8' },
        { name: 'Cell F', cx: 240, cy: 175, color: '#f43f5e' },
        { name: 'Cell G', cx: 280, cy: 110, color: '#a855f7' }
      ];

      let svg = '';
      cells.forEach(c => {
        svg += `
          <polygon points="${hexPoints(c.cx, c.cy, R)}" fill="${c.color}" fill-opacity="0.15" stroke="${c.color}" stroke-width="1.5"/>
          <circle cx="${c.cx}" cy="${c.cy}" r="3" fill="${c.color}"/>
          <text x="${c.cx - 16}" y="${c.cy - 6}" fill="#fff" font-size="8" font-family="monospace">${c.name.split(' ')[1] || c.name}</text>
        `;
      });
      hexGroup.innerHTML = svg;
    };

    renderHexGrid(ch10State.n);

    if (selectN) {
      selectN.addEventListener('change', (e) => {
        ch10State.n = Number(e.target.value);
        if (valN) valN.textContent = `N = ${ch10State.n}`;
        const dRatio = Math.sqrt(3 * ch10State.n).toFixed(2);
        if (outD) outD.textContent = `${dRatio} · R`;
        renderHexGrid(ch10State.n);
      });
    }

    if (sliderH) {
      sliderH.addEventListener('input', (e) => {
        ch10State.h = Number(e.target.value);
        if (valH) valH.textContent = `${ch10State.h.toFixed(1)} dB`;
      });
    }

    if (selectStrat) {
      selectStrat.addEventListener('change', (e) => {
        ch10State.strategy = e.target.value;
      });
    }

    if (sliderSpeed) {
      sliderSpeed.addEventListener('input', (e) => {
        ch10State.speed = Number(e.target.value);
        if (valSpeed) valSpeed.textContent = `${ch10State.speed} km/h`;
      });
    }

    let servingCell = 'A';
    let flaps = 0;

    // Simulation Clock for Mobile Moving between BS-A (x=120) and BS-B (x=200)
    simEngine.subscribe((time, dt) => {
      const carDot = container.querySelector('#mobile-vehicle-dot');
      const carLink = container.querySelector('#mobile-serving-link');
      const graphPos = container.querySelector('#graph-car-pos');
      if (!carDot) return;

      const cycle = (time * (ch10State.speed / 50)) % 10;
      // Normalised position 0 -> 1 -> 0
      const normPos = cycle <= 5 ? (cycle / 5) : (1 - (cycle - 5) / 5);
      const carX = 120 + normPos * 80;
      carDot.setAttribute('cx', carX);

      // Distances from BS-A and BS-B
      const distA = Math.max(5, carX - 120);
      const distB = Math.max(5, 200 - carX);

      // Received Signal Strengths (dBm) with path loss 1/d^3.5 + simulated shadowing
      const noiseFluct = Math.sin(time * 8) * 1.5;
      const rssiA = -40 - 32 * Math.log10(distA / 5) + noiseFluct;
      const rssiB = -40 - 32 * Math.log10(distB / 5) - noiseFluct;

      // Handoff Decision Logic
      const thresholdTh = -95;
      let shouldHandoff = false;

      if (servingCell === 'A') {
        if (ch10State.strategy === 'rel') {
          shouldHandoff = rssiB > rssiA;
        } else if (ch10State.strategy === 'th') {
          shouldHandoff = rssiA < thresholdTh && rssiB > rssiA;
        } else if (ch10State.strategy === 'h') {
          shouldHandoff = rssiB > (rssiA + ch10State.h);
        } else {
          // Hysteresis + Threshold
          shouldHandoff = rssiA < thresholdTh && rssiB > (rssiA + ch10State.h);
        }

        if (shouldHandoff) {
          servingCell = 'B';
          flaps++;
        }
      } else {
        // Serving Cell is B
        let handoffBack = false;
        if (ch10State.strategy === 'rel') {
          handoffBack = rssiA > rssiB;
        } else if (ch10State.strategy === 'th') {
          handoffBack = rssiB < thresholdTh && rssiA > rssiB;
        } else if (ch10State.strategy === 'h') {
          handoffBack = rssiA > (rssiB + ch10State.h);
        } else {
          handoffBack = rssiB < thresholdTh && rssiA > (rssiB + ch10State.h);
        }

        if (handoffBack) {
          servingCell = 'A';
          flaps++;
        }
      }

      // Update Visuals
      if (servingCell === 'A') {
        carLink.setAttribute('x1', carX);
        carLink.setAttribute('x2', 120);
        carLink.setAttribute('stroke', '#0070f3');
        if (outServing) outServing.textContent = 'CELL A (BS-A)';
        if (outHandstate) {
          outHandstate.textContent = 'CONNECTED: BS-A';
          outHandstate.style.color = '#38bdf8';
        }
      } else {
        carLink.setAttribute('x1', carX);
        carLink.setAttribute('x2', 200);
        carLink.setAttribute('stroke', '#00ff9d');
        if (outServing) outServing.textContent = 'CELL B (BS-B)';
        if (outHandstate) {
          outHandstate.textContent = 'CONNECTED: BS-B';
          outHandstate.style.color = '#00ff9d';
        }
      }

      if (outRssi) outRssi.textContent = `RSSI BS-A: ${rssiA.toFixed(1)} dBm | BS-B: ${rssiB.toFixed(1)} dBm`;

      // Update position line on Graph (40 to 360 px)
      if (graphPos) {
        const gx = 40 + normPos * 320;
        graphPos.setAttribute('x1', gx);
        graphPos.setAttribute('x2', gx);
      }
    });
  }

  // --- Section 10.1.5: Erlang B Traffic Calculator ---
  if (secId === 'sec-10.erlang') {
    const sN = container.querySelector('#erlang-slider-n');
    const sL = container.querySelector('#erlang-slider-lambda');
    const sH = container.querySelector('#erlang-slider-h');
    const sU = container.querySelector('#erlang-slider-users');

    const vN = container.querySelector('#erlang-val-n');
    const vL = container.querySelector('#erlang-val-lambda');
    const vH = container.querySelector('#erlang-val-h');
    const vU = container.querySelector('#erlang-val-users');

    const outA = container.querySelector('#erlang-out-a');
    const outP = container.querySelector('#erlang-out-p');
    const outGos = container.querySelector('#erlang-out-gos');
    const outCarried = container.querySelector('#erlang-out-carried');

    // Erlang B Iterative Numerical Solver (avoids float overflow with large factorials)
    const computeErlangB = (A, N) => {
      let B = 1.0;
      for (let i = 1; i <= N; i++) {
        B = (A * B) / (i + A * B);
      }
      return B;
    };

    const updateErlang = () => {
      const N = Number(sN.value);
      const lam = Number(sL.value);
      const h = Number(sH.value);
      const users = Number(sU.value);

      if (vN) vN.textContent = `${N} Channels`;
      if (vL) vL.textContent = `${lam.toFixed(1)} calls/user-hr`;
      if (vH) vH.textContent = `${h} seconds`;
      if (vU) vU.textContent = `${users} Users`;

      // Total offered traffic A = (Users * calls/hr * (h/3600))
      const totalArrivalsPerHour = users * lam;
      const A = (totalArrivalsPerHour * (h / 3600));

      const P = computeErlangB(A, N);
      const carried = A * (1 - P);

      if (outA) outA.textContent = `${A.toFixed(2)} Erlangs`;
      if (outP) {
        outP.textContent = `${(P * 100).toFixed(2)}%`;
        outP.style.color = P <= 0.02 ? '#00ff9d' : '#ff0055';
      }
      if (outGos) {
        outGos.textContent = P <= 0.02
          ? 'Grade of Service: Excellent (≤ 2% Target)'
          : 'Grade of Service: Congested (> 2% Target)';
      }
      if (outCarried) outCarried.textContent = `${carried.toFixed(2)} Erlangs`;
    };

    [sN, sL, sH, sU].forEach(s => {
      if (s) s.addEventListener('input', updateErlang);
    });

    updateErlang();
  }

  // --- Multiple Access Modes (FDMA vs TDMA vs CDMA) ---
  if (secId === 'sec-10.access') {
    const btnF = container.querySelector('#btn-access-fdma');
    const btnT = container.querySelector('#btn-access-tdma');
    const btnC = container.querySelector('#btn-access-cdma');
    const shapes = container.querySelector('#access-dynamic-shapes');
    const desc = container.querySelector('#access-desc-box');

    const setAccessMode = (m) => {
      ch10State.accessMode = m;
      [btnF, btnT, btnC].forEach(b => b.classList.remove('active'));

      if (m === 'fdma') {
        btnF.classList.add('active');
        if (desc) desc.innerHTML = `<strong>1G FDMA (Frequency Division):</strong> Bandwidth is divided into narrow independent sub-channels ($f_1, f_2, f_3, f_4$). Each channel is exclusively dedicated to one caller for the entire duration of the connection.`;
      } else if (m === 'tdma') {
        btnT.classList.add('active');
        if (desc) desc.innerHTML = `<strong>2G TDMA (Time Division):</strong> Multiple users share the same RF frequency channel but transmit in interleaved time slots ($t_1, t_2, t_3, t_4$) within repeating frames (e.g. GSM 8-slot frame).`;
      } else {
        btnC.classList.add('active');
        if (desc) desc.innerHTML = `<strong>2G/3G CDMA (Code Division):</strong> All callers transmit simultaneously across the entire frequency band at all times! Transmissions are separated mathematically by assigning orthogonal 64-bit Walsh codes.`;
      }
    };

    if (btnF) btnF.addEventListener('click', () => setAccessMode('fdma'));
    if (btnT) btnT.addEventListener('click', () => setAccessMode('tdma'));
    if (btnC) btnC.addEventListener('click', () => setAccessMode('cdma'));

    // Animated Rendering of Access Dimensions
    simEngine.subscribe((time) => {
      if (!shapes) return;
      let svg = '';
      const colors = ['#0070f3', '#00e5ff', '#00ff9d', '#ffb703'];

      if (ch10State.accessMode === 'fdma') {
        // Continuous horizontal bands across frequency
        for (let i = 0; i < 4; i++) {
          const y = 35 + i * 36;
          svg += `
            <rect x="70" y="${y}" width="640" height="24" fill="${colors[i]}" fill-opacity="0.3" stroke="${colors[i]}" stroke-width="1.5"/>
            <text x="80" y="${y + 16}" fill="#fff" font-size="10" font-family="monospace">USER ${i+1}: FREQUENCY CHANNEL f_${i+1} (DEDICATED)</text>
          `;
        }
      } else if (ch10State.accessMode === 'tdma') {
        // Interleaved vertical bursts moving across time
        const tOffset = (time * 120) % 640;
        for (let slot = 0; slot < 8; slot++) {
          const x = 70 + ((tOffset + slot * 80) % 640);
          const c = colors[slot % 4];
          svg += `
            <rect x="${x}" y="35" width="70" height="130" fill="${c}" fill-opacity="0.35" stroke="${c}" stroke-width="1.5" rx="3"/>
            <text x="${x + 6}" y="105" fill="#fff" font-size="9" font-family="monospace">SLOT ${slot%4 + 1}</text>
          `;
        }
      } else {
        // CDMA: Full time, full frequency, overlaid code patterns
        svg += `
          <rect x="70" y="35" width="640" height="130" fill="url(#wave-grad)" fill-opacity="0.12" stroke="#ff0055" stroke-width="2" rx="4"/>
          <text x="80" y="55" fill="#ff0055" font-size="11" font-family="monospace" font-weight="700">SHARED 1.25 MHz SPREAD SPECTRUM BAND (ALL USERS OVERLAID)</text>
        `;
        // Four moving orthogonal chipping waves
        for (let i = 0; i < 4; i++) {
          const c = colors[i];
          const yBase = 75 + i * 22;
          svg += `
            <text x="80" y="${yBase + 10}" fill="${c}" font-size="9" font-family="monospace">Code W_${i+1}: [${i%2 === 0 ? '+1 -1 +1 -1' : '+1 +1 -1 -1'}] User ${i+1}</text>
            <line x1="280" y1="${yBase + 6}" x2="700" y2="${yBase + 6}" stroke="${c}" stroke-width="2" stroke-dasharray="${(i+1)*6} 4"/>
          `;
        }
      }

      shapes.innerHTML = svg;
    });
  }

  // --- Section 10.4: CDMA Walsh Orthogonality Engine ---
  if (secId === 'sec-10.cdma') {
    const selUser = container.querySelector('#walsh-select-user');
    const c1 = container.querySelector('#chk-u1');
    const c2 = container.querySelector('#chk-u2');
    const c3 = container.querySelector('#chk-u3');
    const c4 = container.querySelector('#chk-u4');
    const wave = container.querySelector('#walsh-composite-wave');
    const corText = container.querySelector('#walsh-correlator-text');

    // 4-bit Walsh/Hadamard matrix
    const walsh = [
      [1, 1, 1, 1],
      [1, -1, 1, -1],
      [1, 1, -1, -1],
      [1, -1, -1, 1]
    ];

    const updateWalsh = () => {
      const activeIdx = (selUser ? Number(selUser.value) : 2) - 1;
      const chks = [c1 ? c1.checked : true, c2 ? c2.checked : true, c3 ? c3.checked : true, c4 ? c4.checked : true];

      // Composite signal is the linear superposition of active users transmitting bit = 1
      const composite = [0, 0, 0, 0];
      for (let u = 0; u < 4; u++) {
        if (chks[u]) {
          for (let chip = 0; chip < 4; chip++) {
            composite[chip] += walsh[u][chip];
          }
        }
      }

      // Correlator inner product: <Composite, W_desired>
      let innerProduct = 0;
      for (let chip = 0; chip < 4; chip++) {
        innerProduct += composite[chip] * walsh[activeIdx][chip];
      }

      // Generate step wave path
      let d = 'M 20 60';
      const stepWidth = 160;
      for (let chip = 0; chip < 4; chip++) {
        const x1 = 20 + chip * stepWidth;
        const x2 = x1 + stepWidth;
        const y = 60 - composite[chip] * 12;
        d += ` L ${x1} ${y} L ${x2} ${y}`;
      }
      if (wave) wave.setAttribute('d', d);

      if (corText) {
        if (chks[activeIdx]) {
          corText.innerHTML = `CORRELATOR OUTPUT (⟨Composite, W_${activeIdx + 1}⟩): <strong style="color:#00ff9d;">+${innerProduct.toFixed(1)}</strong> → RECOVERED BIT = 1 (100% ORTHOGONAL DETECTED!)`;
        } else {
          corText.innerHTML = `CORRELATOR OUTPUT (⟨Composite, W_${activeIdx + 1}⟩): <strong style="color:#64748b;">${innerProduct.toFixed(1)}</strong> → USER ${activeIdx + 1} INACTIVE (NO ENERGY)`;
        }
      }
    };

    if (selUser) selUser.addEventListener('change', updateWalsh);
    [c1, c2, c3, c4].forEach(c => {
      if (c) c.addEventListener('change', updateWalsh);
    });

    updateWalsh();
  }

  // --- Section 10.5: 3G 1xEV-DO Adaptive Modulation Simulator ---
  if (secId === 'sec-10.3g') {
    const sSnr = container.querySelector('#evdo-slider-snr');
    const vSnr = container.querySelector('#evdo-val-snr');
    const vMod = container.querySelector('#evdo-val-mod');
    const mBadge = container.querySelector('#evdo-mod-badge');
    const vCode = container.querySelector('#evdo-val-coderate');

    const outSlots = container.querySelector('#evdo-out-slots');
    const outRate = container.querySelector('#evdo-out-rate');
    const outSize = container.querySelector('#evdo-out-size');

    const updateEvdo = () => {
      const snr = Number(sSnr.value);
      if (vSnr) vSnr.textContent = `${snr >= 0 ? '+' : ''}${snr.toFixed(1)} dB`;

      // Stallings Table 10.9a Rate Table Mapping
      if (snr >= 13) {
        if (vMod) vMod.textContent = '16-QAM';
        if (mBadge) mBadge.textContent = '16-QAM (4 bits/symbol)';
        if (vCode) vCode.textContent = 'Code Rate 1/3 (Light Coding)';
        if (outSlots) outSlots.textContent = '1 Slot (1.67 ms)';
        if (outRate) outRate.textContent = '2457.6 kbps (2.46 Mbps)';
        if (outSize) outSize.textContent = '512 Bytes';
      } else if (snr >= 8) {
        if (vMod) vMod.textContent = '8-PSK';
        if (mBadge) mBadge.textContent = '8-PSK (3 bits/symbol)';
        if (vCode) vCode.textContent = 'Code Rate 1/3';
        if (outSlots) outSlots.textContent = '1 Slot (1.67 ms)';
        if (outRate) outRate.textContent = '1228.8 kbps (1.23 Mbps)';
        if (outSize) outSize.textContent = '256 Bytes';
      } else if (snr >= 2) {
        if (vMod) vMod.textContent = 'QPSK';
        if (mBadge) mBadge.textContent = 'QPSK (2 bits/symbol)';
        if (vCode) vCode.textContent = 'Code Rate 1/3';
        if (outSlots) outSlots.textContent = '2 Slots (3.33 ms)';
        if (outRate) outRate.textContent = '614.4 kbps';
        if (outSize) outSize.textContent = '256 Bytes';
      } else {
        if (vMod) vMod.textContent = 'Robust QPSK';
        if (mBadge) mBadge.textContent = 'QPSK (Heavy Repetition)';
        if (vCode) vCode.textContent = 'Code Rate 1/5 (Maximum Protection)';
        if (outSlots) outSlots.textContent = '16 Slots (26.67 ms)';
        if (outRate) outRate.textContent = '38.4 kbps';
        if (outSize) outSize.textContent = '128 Bytes';
      }
    };

    if (sSnr) sSnr.addEventListener('input', updateEvdo);
    updateEvdo();
  }

  // --- Section 10.7: Quantitative Quiz Evaluation ---
  if (secId === 'sec-10.problems') {
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
            fb.innerHTML = `<span style="color: var(--status-ready); font-weight: 600;">✓ Correct!</span> Solution verified directly from William Stallings Chapter 10.`;
          } else {
            opt.classList.add('wrong');
            fb.innerHTML = `<span style="color: var(--status-danger); font-weight: 600;">✗ Incorrect.</span> Recalculate using Chapter 10 frequency reuse or Erlang equations.`;
          }
        });
      });
    });
  }
}
