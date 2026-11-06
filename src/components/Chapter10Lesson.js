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
import { drawIsometricLaptop, drawIsometricRouter, drawIsometricBaseStation, drawIsometricServer, drawIsometricCloud, drawIsometricPhone } from '../utils/isoGraphics.js';

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
          <!-- Real-World End-to-End Cellular Topology (Protocol Explorer Isometric Style) -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>END-TO-END CELLULAR SYSTEM TOPOLOGY & DYNAMIC MULTIPLE-ACCESS PACKET FLOW</span>
              <span class="panel-tag" id="iso-active-mode-tag">FDMA (ANALOG AMPS)</span>
            </div>

            <!-- Protocol Explorer Multi-Access Mode Selector & Zoom Controls -->
            <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
              <div style="display: flex; gap: 8px;">
                <button class="btn-ctrl active" id="btn-top-fdma" style="font-size: 0.75rem; padding: 4px 10px;">
                  📡 1G FDMA (Freq Sliced)
                </button>
                <button class="btn-ctrl" id="btn-top-tdma" style="font-size: 0.75rem; padding: 4px 10px;">
                  ⏱️ 2G TDMA (Time Slot Bursts)
                </button>
                <button class="btn-ctrl" id="btn-top-cdma" style="font-size: 0.75rem; padding: 4px 10px;">
                  🧬 2G/3G CDMA (Orthogonal Codes)
                </button>
              </div>

              <!-- Zoom Camera Presets -->
              <div style="display: flex; gap: 6px; align-items: center; font-family: var(--font-mono); font-size: 0.75rem;">
                <span style="color: var(--text-dim);">CAMERA:</span>
                <button class="btn-ctrl active" id="btn-cam-wide" title="Wide View">🌐 OVERVIEW</button>
                <button class="btn-ctrl" id="btn-cam-device" title="Zoom Mobile Client">💻 CLIENT</button>
                <button class="btn-ctrl" id="btn-cam-tower" title="Zoom Base Station">🗼 BS TOWER</button>
                <button class="btn-ctrl" id="btn-cam-core" title="Zoom Core Network">☁️ CORE/SERVER</button>
              </div>
            </div>

            <div style="background: #020408; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px; position: relative; overflow: hidden;">
              <svg viewBox="0 0 880 260" style="width: 100%; height: 260px; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);" id="iso-cellular-svg">
                <!-- Subtle Isometric Ground Grid -->
                <g opacity="0.08" stroke="#00e5ff" stroke-width="1">
                  <line x1="0" y1="120" x2="880" y2="120"/>
                  <line x1="0" y1="170" x2="880" y2="170"/>
                  <line x1="0" y1="220" x2="880" y2="220"/>
                  <line x1="120" y1="60" x2="120" y2="260"/>
                  <line x1="280" y1="60" x2="280" y2="260"/>
                  <line x1="460" y1="60" x2="460" y2="260"/>
                  <line x1="640" y1="60" x2="640" y2="260"/>
                  <line x1="800" y1="60" x2="800" y2="260"/>
                </g>

                <!-- RF Emission Pulse Rings from Client -->
                <circle id="iso-client-rf-pulse" cx="120" cy="140" r="10" fill="none" stroke="#00e5ff" stroke-width="1.5" opacity="0"/>
                <circle id="iso-bs-rf-pulse" cx="300" cy="80" r="15" fill="none" stroke="#00ff9d" stroke-width="1.5" opacity="0"/>

                <!-- 1. Client Mobile Laptop with Cellular Modem & Handset -->
                <g id="iso-node-client">
                  ${drawIsometricLaptop(120, 160, 0.9, '#38bdf8')}
                  ${drawIsometricPhone(60, 180, 0.8, '#00e5ff')}
                  <text x="55" y="215" fill="#fff" font-size="11" font-family="monospace" font-weight="700">Mobile Subscriber (MS)</text>
                  <text x="65" y="228" fill="#38bdf8" font-size="9" font-family="monospace">MS: 192.168.1.10 (SIM Active)</text>
                </g>

                <!-- RF Link Line from Laptop to Base Station -->
                <path d="M 160 145 Q 220 100, 280 85" fill="none" stroke="#00e5ff" stroke-width="2" stroke-dasharray="4 4" id="rf-link-line"/>
                <text x="175" y="95" fill="#00e5ff" font-size="9" font-family="monospace" id="iso-link-label">AIR LINK (30 kHz FM Carrier)</text>

                <!-- 2. Cellular Base Station Tower (BS) -->
                <g id="iso-node-bs">
                  ${drawIsometricBaseStation(300, 160, 0.95, '#38bdf8')}
                  <text x="250" y="215" fill="#fff" font-size="11" font-family="monospace" font-weight="700">Cell Base Station</text>
                  <text x="260" y="228" fill="#00e5ff" font-size="9" font-family="monospace">BS-A Transceiver</text>
                </g>

                <!-- Cable from BS to Base Station Controller / Wireless Router -->
                <line x1="330" y1="165" x2="460" y2="165" stroke="#334155" stroke-width="3"/>
                <line x1="330" y1="165" x2="460" y2="165" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6 3" id="wire-link-1"/>

                <!-- 3. Base Station Controller / Core Router -->
                <g id="iso-node-router">
                  ${drawIsometricRouter(490, 165, 0.9, '#38bdf8')}
                  <text x="440" y="215" fill="#fff" font-size="11" font-family="monospace" font-weight="700">BSC / Core Router</text>
                  <text x="455" y="228" fill="#ffb703" font-size="9" font-family="monospace">IP: 10.0.0.1 (GTP Tunnel)</text>
                </g>

                <!-- Cable from Router to Internet Cloud -->
                <line x1="535" y1="165" x2="640" y2="140" stroke="#334155" stroke-width="3"/>
                <line x1="535" y1="165" x2="640" y2="140" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6 3" id="wire-link-2"/>

                <!-- 4. Internet Cloud / Cellular IP Backbone -->
                <g id="iso-node-cloud">
                  ${drawIsometricCloud(660, 135, 1.0, '#38bdf8')}
                  <text x="615" y="175" fill="#fff" font-size="11" font-family="monospace" font-weight="700">Cellular Core / IP</text>
                  <text x="630" y="188" fill="#38bdf8" font-size="9" font-family="monospace">MTSO / MSC Backbone</text>
                </g>

                <!-- Link from Cloud to DNS / Application Server -->
                <line x1="710" y1="125" x2="780" y2="125" stroke="#334155" stroke-width="3"/>
                <line x1="710" y1="125" x2="780" y2="125" stroke="#00ff9d" stroke-width="1.5" stroke-dasharray="6 3" id="wire-link-3"/>

                <!-- 5. Destination Application / DNS Server -->
                <g id="iso-node-server">
                  ${drawIsometricServer(800, 160, 0.9, '#00ff9d')}
                  <text x="760" y="215" fill="#fff" font-size="11" font-family="monospace" font-weight="700">Web / DNS Server</text>
                  <text x="770" y="228" fill="#00ff9d" font-size="9" font-family="monospace">IP: 8.8.8.8 (Resolved)</text>
                </g>

                <!-- Live Animated Moving Packet Bubble -->
                <g id="iso-animated-packet">
                  <rect id="iso-pkt-bubble" x="150" y="130" width="105" height="24" fill="#0b1329" stroke="#00e5ff" stroke-width="1.5" rx="3"/>
                  <text id="iso-pkt-text" x="156" y="146" fill="#00e5ff" font-size="8" font-family="monospace" font-weight="700">RF CARRIER f₁</text>
                </g>
              </svg>

              <!-- Play / Pause / Reset Controls (Protocol Explorer style) -->
              <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; font-family: var(--font-mono);">
                <button class="btn-ctrl active" id="btn-iso-play" style="font-size:0.75rem; padding:5px 14px; background: rgba(0,229,255,0.15); border-color:#00e5ff; color:#00e5ff; min-width:90px;">
                  ▶ PLAY
                </button>
                <button class="btn-ctrl" id="btn-iso-step" style="font-size:0.75rem; padding:5px 10px;" title="Advance one packet">
                  ⏭ STEP
                </button>
                <button class="btn-ctrl" id="btn-iso-reset" style="font-size:0.75rem; padding:5px 10px;" title="Reset">
                  ↺ RESET
                </button>
                <select id="sim-speed-select" style="background:var(--bg-tertiary);color:var(--text-bright);border:1px solid var(--border-subtle);font-family:var(--font-mono);font-size:0.72rem;padding:4px 6px;border-radius:3px;">
                  <option value="0.5">0.5× Speed</option>
                  <option value="1" selected>1× Speed</option>
                  <option value="2">2× Speed</option>
                  <option value="4">4× Speed</option>
                </select>
                <!-- Step Indicator -->
                <span id="iso-step-indicator" style="color:var(--text-dim);font-size:0.72rem; margin-left:4px;">STEP — / 4</span>
              </div>

              <!-- Step Explanation HUD Overlay (Protocol Explorer style) -->
              <div id="iso-hud-box" style="margin-top: 8px; background: rgba(15,23,42,0.85); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 0.75rem;">
                <span id="iso-hud-status" style="color: var(--accent-cyan);">⏸ PAUSED — Click ▶ PLAY to start packet flow animation</span>
                <span id="iso-hud-phy" style="color: var(--text-dim);">FREQ: 825.03 MHz | DUPLEX: +45 MHz | MOD: FM/FSK</span>
              </div>

              <!-- Per-step Detail Panel (Protocol Explorer "Step Details" style) -->
              <div id="iso-step-detail" style="margin-top:8px; background:rgba(15,23,42,0.7); border:1px solid var(--border-subtle); border-radius:4px; padding:8px 12px; font-family:var(--font-mono); font-size:0.73rem; display:none;">
                <div style="color:var(--text-dim); font-size:0.65rem; margin-bottom:4px;" id="iso-step-num">STEP 1 OF 4</div>
                <div style="color:#fff; font-weight:700; font-size:0.85rem; margin-bottom:4px;" id="iso-step-title">RF AIR LINK</div>
                <div style="color:var(--text-secondary);" id="iso-step-desc">Mobile Subscriber transmits data over the air interface to the Base Station.</div>
                <div style="margin-top:6px; display:grid; grid-template-columns:1fr 1fr; gap:4px;" id="iso-step-meta"></div>
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
  evdoSnr: 14,
  cameraZoom: 'wide'
};

function attachSubEvents(container, secId, progressManager) {
  // --- Section 10.1: Hex Cluster & Handoff Events ---
  if (secId === 'sec-10.1') {
    const selectN = container.querySelector('#ch10-select-n');
    const sliderH = container.querySelector('#ch10-slider-h');
    const selectStrat = container.querySelector('#ch10-select-strat');
    const sliderSpeed = container.querySelector('#ch10-slider-speed');

    // Topology Multi-Access Buttons
    const btnTopFdma = container.querySelector('#btn-top-fdma');
    const btnTopTdma = container.querySelector('#btn-top-tdma');
    const btnTopCdma = container.querySelector('#btn-top-cdma');
    const modeTag = container.querySelector('#iso-active-mode-tag');
    const linkLabel = container.querySelector('#iso-link-label');
    const hudStatus = container.querySelector('#iso-hud-status');
    const hudPhy = container.querySelector('#iso-hud-phy');

    // Camera Zoom Buttons
    const btnCamWide = container.querySelector('#btn-cam-wide');
    const btnCamDevice = container.querySelector('#btn-cam-device');
    const btnCamTower = container.querySelector('#btn-cam-tower');
    const btnCamCore = container.querySelector('#btn-cam-core');
    const isoSvg = container.querySelector('#iso-cellular-svg');

    const setCamera = (preset) => {
      ch10State.cameraZoom = preset;
      [btnCamWide, btnCamDevice, btnCamTower, btnCamCore].forEach(b => b && b.classList.remove('active'));
      if (!isoSvg) return;

      if (preset === 'device') {
        btnCamDevice && btnCamDevice.classList.add('active');
        isoSvg.style.transformOrigin = '120px 160px';
        isoSvg.style.transform = 'scale(2.0)';
      } else if (preset === 'tower') {
        btnCamTower && btnCamTower.classList.add('active');
        isoSvg.style.transformOrigin = '300px 150px';
        isoSvg.style.transform = 'scale(2.0)';
      } else if (preset === 'core') {
        btnCamCore && btnCamCore.classList.add('active');
        isoSvg.style.transformOrigin = '680px 150px';
        isoSvg.style.transform = 'scale(1.8)';
      } else {
        btnCamWide && btnCamWide.classList.add('active');
        isoSvg.style.transformOrigin = 'center center';
        isoSvg.style.transform = 'scale(1.0)';
      }
    };

    if (btnCamWide) btnCamWide.addEventListener('click', () => setCamera('wide'));
    if (btnCamDevice) btnCamDevice.addEventListener('click', () => setCamera('device'));
    if (btnCamTower) btnCamTower.addEventListener('click', () => setCamera('tower'));
    if (btnCamCore) btnCamCore.addEventListener('click', () => setCamera('core'));

    const setAccessPreset = (mode) => {
      ch10State.accessMode = mode;
      [btnTopFdma, btnTopTdma, btnTopCdma].forEach(b => b && b.classList.remove('active'));

      if (mode === 'fdma') {
        btnTopFdma && btnTopFdma.classList.add('active');
        if (modeTag) modeTag.textContent = 'FDMA (ANALOG AMPS)';
        if (linkLabel) linkLabel.textContent = 'AIR LINK (30 kHz FM Carrier)';
        if (hudStatus) hudStatus.textContent = '● SIMULATION: 1G FDMA (Dedicated continuous frequency slice per user)';
        if (hudPhy) hudPhy.textContent = 'FREQ: 825.03 MHz | DUPLEX: +45 MHz | MOD: FM Audio';
        progressManager.addLog('AIR-IF', 'Access Mode changed to FDMA (AMPS 30kHz channels)');
      } else if (mode === 'tdma') {
        btnTopTdma && btnTopTdma.classList.add('active');
        if (modeTag) modeTag.textContent = 'TDMA (DIGITAL GSM)';
        if (linkLabel) linkLabel.textContent = 'AIR LINK (577 µs Time Slot Bursts)';
        if (hudStatus) hudStatus.textContent = '● SIMULATION: 2G TDMA (8 interleaved time slots per 200 kHz carrier)';
        if (hudPhy) hudPhy.textContent = 'FRAME: 4.615 ms | SLOT: 577 µs | MOD: 0.3 GMSK 270.833 kbps';
        progressManager.addLog('AIR-IF', 'Access Mode changed to TDMA (GSM 8-slot frames)');
      } else {
        btnTopCdma && btnTopCdma.classList.add('active');
        if (modeTag) modeTag.textContent = 'CDMA (IS-95 / 3G SPREAD SPECTRUM)';
        if (linkLabel) linkLabel.textContent = 'AIR LINK (1.2288 Mcps Orthogonal Walsh 64)';
        if (hudStatus) hudStatus.textContent = '● SIMULATION: CDMA (All users share full 1.25 MHz carrier simultaneously)';
        if (hudPhy) hudPhy.textContent = 'SPREAD: 1.2288 Mcps | WALSH: W_64 | SOFT HANDOFF ACTIVE';
        progressManager.addLog('AIR-IF', 'Access Mode changed to CDMA (IS-95 spread spectrum)');
      }
    };

    if (btnTopFdma) btnTopFdma.addEventListener('click', () => setAccessPreset('fdma'));
    if (btnTopTdma) btnTopTdma.addEventListener('click', () => setAccessPreset('tdma'));
    if (btnTopCdma) btnTopCdma.addEventListener('click', () => setAccessPreset('cdma'));

    // ── Play / Pause / Step / Reset / Speed controls ──────────────────────────
    const btnPlay   = container.querySelector('#btn-iso-play');
    const btnStep   = container.querySelector('#btn-iso-step');
    const btnReset  = container.querySelector('#btn-iso-reset');
    const speedSel  = container.querySelector('#sim-speed-select');
    const stepInd   = container.querySelector('#iso-step-indicator');
    const stepDetail = container.querySelector('#iso-step-detail');
    const stepNum   = container.querySelector('#iso-step-num');
    const stepTitle = container.querySelector('#iso-step-title');
    const stepDesc  = container.querySelector('#iso-step-desc');
    const stepMeta  = container.querySelector('#iso-step-meta');

    // Per-step explanations for each access mode
    const stepDefs = {
      fdma: [
        { title:'RF AIR LINK (FDMA)', desc:'Mobile Subscriber transmits voice data over its dedicated 30 kHz FM sub-carrier (f₁). No other user shares this frequency slice for the duration of the call.', meta:'SRC: MS 192.168.1.10 | DST: BS-A | FREQ: 825.03 MHz | MOD: FM' },
        { title:'BASE STATION BACKHAUL', desc:'BS-A decodes the FM signal and re-encodes it onto a wired E1 trunk (2.048 Mbps T1/E1 circuit) towards the Base Station Controller (BSC).', meta:'PROTOCOL: E1 TDM | INTERFACE: Abis | RATE: 64 kbps per channel' },
        { title:'CORE IP ROUTING (MTSO)', desc:'The Mobile Telephone Switching Office (MTSO) routes the GTP-encapsulated IP packet across the cellular core backbone towards the destination server.', meta:'ENCAP: IP-in-GTP | HOP: BSC → MTSO → PDN-GW' },
        { title:'INTERNET DELIVERY', desc:'The IP packet exits the cellular core and is delivered to the destination Web / DNS server on the public Internet. HTTP 200 OK response travels the reverse path.', meta:'DST: 8.8.8.8 | PROTOCOL: HTTP | SIZE: 200–1500 Bytes' }
      ],
      tdma: [
        { title:'TIME SLOT BURST (TDMA/GSM)', desc:'Mobile Subscriber transmits a compressed 577 µs speech burst in its assigned time slot (Slot 3 of 8) on a 200 kHz GSM carrier. GMSK modulation at 270.833 kbps.', meta:'FRAME: 4.615 ms | SLOT: 577 µs | MOD: 0.3-GMSK | CODEC: 13 kbps RPE-LPC' },
        { title:'BASE STATION DECODING', desc:'BS-A decodes the GMSK burst, de-interleaves the 8-slot frame, and reconstructs the speech frame. The frame is forwarded via the Abis interface to the BSC.', meta:'INTERFACE: Abis (E1) | FRAME SIZE: 20 ms speech | FEC: Convolutional 1/2' },
        { title:'CORE SWITCHING (MSC)', desc:'The Mobile Switching Centre (MSC) performs call routing. For data calls, GPRS packets are tunnelled via GTP over the SGSN/GGSN nodes to reach the IP backbone.', meta:'NODES: BSC → SGSN → GGSN → Internet | PROTOCOL: GTP-C/GTP-U' },
        { title:'INTERNET DELIVERY', desc:'The IP datagram exits the GGSN and is routed over the public Internet to the destination server. TDMA supports data rates up to 384 kbps (EDGE/EGPRS).', meta:'DST: 8.8.8.8 | MAX RATE: 384 kbps (EDGE) | LATENCY: ~100 ms' }
      ],
      cdma: [
        { title:'SPREAD SPECTRUM AIR LINK (CDMA)', desc:'All users transmit simultaneously across the entire 1.25 MHz band. The MS spreads its data with a unique 64-chip Walsh code (W₆₄). RAKE receiver at BS separates users via code orthogonality.', meta:'CHIP RATE: 1.2288 Mcps | CODE: Walsh W₆₄ | POWER CTRL: Open+Closed Loop' },
        { title:'A-BIS / IUB INTERFACE', desc:'BS-A uses a RAKE receiver to despread the composite signal. The recovered user bits are packetised and forwarded via the Iub/A-interface towards the RNC/BSC using ATM or IP transport.', meta:'INTERFACE: Iub (ATM) | SOFT HANDOFF ACTIVE: 3 BS branches combined' },
        { title:'RNC / CORE PACKET DATA', desc:'The Radio Network Controller (RNC) performs macro-diversity combining for soft handoff. SGSN tunnels the IP PDU through the GPRS/EPC core towards the PDN gateway.', meta:'DIVERSITY: Maximum-Ratio Combining (3-way) | EB/N0 GAIN: ~3 dB' },
        { title:'INTERNET DELIVERY', desc:'The IP packet exits the CDMA2000 / W-CDMA core and reaches the destination. CDMA enables universal frequency reuse (N=1), giving 10–15× capacity gain over FDMA.', meta:'DST: 8.8.8.8 | REUSE FACTOR: N=1 | CAPACITY GAIN: ~13× vs FDMA' }
      ]
    };

    let isPlaying = false;
    let simSubId  = null;
    let simSpeedMultiplier = 1.0;
    let manualStep = -1; // -1 = auto (driven by time), 0-3 = manual step override

    const getStepInfo = (seg) => {
      const mode = ch10State.accessMode;
      return stepDefs[mode] ? stepDefs[mode][seg] : stepDefs.fdma[seg];
    };

    const updateStepDetail = (seg) => {
      const info = getStepInfo(seg);
      if (!info) return;
      if (stepDetail) stepDetail.style.display = 'block';
      if (stepNum)   stepNum.textContent   = `STEP ${seg + 1} OF 4`;
      if (stepTitle) stepTitle.textContent  = info.title;
      if (stepDesc)  stepDesc.textContent   = info.desc;
      if (stepMeta)  stepMeta.innerHTML     = info.meta.split(' | ').map(m => {
        const [k, ...v] = m.split(':');
        return `<div style="background:rgba(0,229,255,0.07);border:1px solid rgba(0,229,255,0.15);border-radius:3px;padding:3px 6px;"><span style="color:var(--text-dim);font-size:0.65rem;">${k}:</span><span style="color:var(--text-bright);margin-left:4px;">${v.join(':').trim()}</span></div>`;
      }).join('');
      if (stepInd) stepInd.textContent = `STEP ${seg + 1} / 4`;
    };

    const startSim = () => {
      if (simSubId !== null) return; // already subscribed
      isPlaying = true;
      if (btnPlay) { btnPlay.textContent = '⏸ PAUSE'; btnPlay.style.borderColor = '#ffb703'; btnPlay.style.color = '#ffb703'; }
      if (hudStatus) hudStatus.textContent = `● SIMULATION RUNNING: ${ch10State.accessMode.toUpperCase()} packet flow active`;
      if (stepDetail) stepDetail.style.display = 'block';

      simSubId = simEngine.subscribe((time) => {
        const isoBubble = container.querySelector('#iso-pkt-bubble');
        const isoText   = container.querySelector('#iso-pkt-text');
        const clientPulse = container.querySelector('#iso-client-rf-pulse');
        const bsPulse     = container.querySelector('#iso-bs-rf-pulse');

        if (clientPulse && bsPulse) {
          const pR  = 10 + ((time * 30 * simSpeedMultiplier) % 35);
          const pOp = Math.max(0, 1 - (pR / 45));
          clientPulse.setAttribute('r', pR);
          clientPulse.setAttribute('opacity', pOp * 0.8);
          const bsR  = 12 + ((time * 25 * simSpeedMultiplier + 15) % 40);
          const bsOp = Math.max(0, 1 - (bsR / 50));
          bsPulse.setAttribute('r', bsR);
          bsPulse.setAttribute('opacity', bsOp * 0.7);
        }

        if (isoBubble && isoText) {
          const mode = ch10State.accessMode;
          const flowSpeed = simSpeedMultiplier * (mode === 'tdma' ? 0.65 : mode === 'cdma' ? 0.8 : 0.45);
          const flowCycle = manualStep >= 0 ? (manualStep + 0.5) : (time * flowSpeed) % 4;
          const seg       = Math.min(3, Math.floor(flowCycle));
          const subT      = manualStep >= 0 ? 0.5 : (flowCycle - seg);

          let px = 150, py = 130, label = 'RF AIR BURST', color = '#00e5ff', bubbleWidth = 95;

          if (seg === 0) {
            px = 120 + subT * (300 - 120); py = 145 + subT * (85 - 145);
            if (mode === 'fdma')       { label = 'FDMA: f₁ (30kHz)';    color = '#0070f3'; bubbleWidth = 110; }
            else if (mode === 'tdma') { const slot = Math.floor((time * 8) % 8) + 1; label = `TDMA: SLOT ${slot}/8`; color = '#00e5ff'; bubbleWidth = 105; }
            else                      { const chip = (Math.floor(time * 12) % 2 === 0) ? '+1 -1 +1 -1' : '-1 +1 -1 +1'; label = `CDMA: W₆₄ [${chip}]`; color = '#ff0055'; bubbleWidth = 125; }
          } else if (seg === 1) {
            px = 300 + subT * (490 - 300); py = 165;
            label = mode === 'cdma' ? 'A-bis/Iub (ATM)' : 'E1 / GTP-U FRAME'; color = '#38bdf8'; bubbleWidth = 115;
          } else if (seg === 2) {
            px = 490 + subT * (660 - 490); py = 165 + subT * (135 - 165);
            label = 'IP PACKET (PDU)'; color = '#ffb703'; bubbleWidth = 105;
          } else {
            px = 660 + subT * (800 - 660); py = 135 + subT * (160 - 135);
            label = 'HTTP 200 OK (ACK)'; color = '#00ff9d'; bubbleWidth = 115;
          }

          isoBubble.setAttribute('x', px - bubbleWidth / 2);
          isoBubble.setAttribute('y', py - 12);
          isoBubble.setAttribute('width', bubbleWidth);
          isoBubble.setAttribute('stroke', color);
          isoText.setAttribute('x', px - bubbleWidth / 2 + 6);
          isoText.setAttribute('y', py + 3);
          isoText.setAttribute('fill', color);
          isoText.textContent = label;

          // Auto-update step detail when segment changes
          if (manualStep < 0) updateStepDetail(seg);
        }
      });
    };

    const stopSim = () => {
      isPlaying = false;
      if (simSubId !== null) { simSubId(); simSubId = null; } // simSubId is the unsubscribe fn returned by simEngine.subscribe
      if (btnPlay) { btnPlay.textContent = '▶ PLAY'; btnPlay.style.borderColor = '#00e5ff'; btnPlay.style.color = '#00e5ff'; }
      if (hudStatus) hudStatus.textContent = `⏸ PAUSED — ${ch10State.accessMode.toUpperCase()} mode selected`;
      if (stepInd) stepInd.textContent = 'STEP — / 4';
    };

    const resetSim = () => {
      stopSim();
      manualStep = -1;
      if (stepDetail) stepDetail.style.display = 'none';
      if (hudStatus) hudStatus.textContent = `⏸ PAUSED — Click ▶ PLAY to start packet flow animation`;
      // Reset bubble to start
      const isoBubble = container.querySelector('#iso-pkt-bubble');
      const isoText   = container.querySelector('#iso-pkt-text');
      if (isoBubble) { isoBubble.setAttribute('x', 100); isoBubble.setAttribute('y', 130); isoBubble.setAttribute('stroke', '#00e5ff'); }
      if (isoText)   { isoText.setAttribute('x', 106); isoText.setAttribute('y', 146); isoText.setAttribute('fill', '#00e5ff'); isoText.textContent = 'RF CARRIER f₁'; }
      const cp = container.querySelector('#iso-client-rf-pulse');
      const bp = container.querySelector('#iso-bs-rf-pulse');
      if (cp) { cp.setAttribute('r', 10); cp.setAttribute('opacity', 0); }
      if (bp) { bp.setAttribute('r', 15); bp.setAttribute('opacity', 0); }
    };

    if (btnPlay)  btnPlay.addEventListener('click',  () => { isPlaying ? stopSim() : startSim(); });
    if (btnReset) btnReset.addEventListener('click', resetSim);
    if (btnStep)  btnStep.addEventListener('click',  () => {
      if (isPlaying) stopSim();
      manualStep = (manualStep + 1) % 4;
      updateStepDetail(manualStep);
      if (hudStatus) hudStatus.textContent = `⏭ STEP ${manualStep + 1}/4 — ${getStepInfo(manualStep).title}`;
      if (stepInd) stepInd.textContent = `STEP ${manualStep + 1} / 4`;
      // Render one frame at the manual step position
      const isoBubble = container.querySelector('#iso-pkt-bubble');
      const isoText   = container.querySelector('#iso-pkt-text');
      const mode = ch10State.accessMode;
      const stepInfo = stepDefs[mode] ? stepDefs[mode][manualStep] : stepDefs.fdma[manualStep];
      const segPositions = [[120,145],[300,165],[490,165],[660,135]];
      const colors = ['#0070f3','#38bdf8','#ffb703','#00ff9d'];
      const labels = mode === 'fdma'
        ? ['FDMA: f₁ (30kHz)', 'E1 / GTP-U FRAME', 'IP PACKET (PDU)', 'HTTP 200 OK (ACK)']
        : mode === 'tdma'
        ? ['TDMA: SLOT 3/8', 'E1 / GTP-U FRAME', 'IP PACKET (PDU)', 'HTTP 200 OK (ACK)']
        : ['CDMA: W₆₄ [+1 -1 +1 -1]', 'A-bis/Iub (ATM)', 'IP PACKET (PDU)', 'HTTP 200 OK (ACK)'];
      if (isoBubble && isoText && segPositions[manualStep]) {
        const [spx, spy] = segPositions[manualStep];
        const bw = manualStep === 0 ? 110 : 115;
        isoBubble.setAttribute('x', spx - bw/2); isoBubble.setAttribute('y', spy - 12);
        isoBubble.setAttribute('width', bw); isoBubble.setAttribute('stroke', colors[manualStep]);
        isoText.setAttribute('x', spx - bw/2 + 6); isoText.setAttribute('y', spy + 3);
        isoText.setAttribute('fill', colors[manualStep]);
        isoText.textContent = labels[manualStep];
      }
    });
    if (speedSel) speedSel.addEventListener('change', (e) => { simSpeedMultiplier = Number(e.target.value); });

    // Update setAccessPreset to also update HUD when paused
    const origSet = setAccessPreset;
    // (setAccessPreset already updates hudStatus, so mode changes will reflect correctly)

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

