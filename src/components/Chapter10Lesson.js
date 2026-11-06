/**
 * SignalLab — Chapter 10: Cellular Wireless Networks (Comprehensive Interactive Engineering Suite)
 * William Stallings, Wireless Communications and Networks, 2nd Edition (pp. 264–326)
 *
 * Full Analytical & Interactive Coverage:
 * - §10.1 Flagship 2-Way End-to-End Cellular Simulator (Uplink + Downlink Return ACK, Auto-Camera, Multi-Device Tower Limits, Maximize View)
 * - §10.1.1 & 10.1.2 Cellular Geometry & Frequency Reuse (Dynamic scaling hexagons, N = i² + j² + ij, D = R√(3N), Sectoring, Cell Splitting)
 * - §10.1.3 Operation of Cellular Systems: 6-Step Call Flow (Figure 10.6 with clean spacing & detailed procedures)
 * - §10.1.4 Mobile Propagation & Handoff Hysteresis (Figure 10.7 interactive vehicle simulation with 4 handoff strategies)
 * - §10.1.5 Traffic Engineering & Erlang B Multiserver Queue (Animated multiserver trunk bank, call arrival λ, holding time h, blocking P)
 * - §10.2 First-Generation Analog (AMPS: Vintage Brick Phone, 30 kHz channels, 21 RCC/FCC control channels, BCH coding)
 * - §10.3 Second-Generation TDMA (GSM: Realistic BTS shelter, BSC cabinet, MSC, HLR/VLR/AuC/EIR databases, 8-slot TDMA burst hierarchy)
 * - §10.4 Second-Generation CDMA (IS-95: 1.2288 Mcps spread spectrum, Walsh 64 matrix, RAKE receiver multipath combining, soft handoff)
 * - §10.5 Third-Generation Systems (3G: W-CDMA & CDMA2000 1xEV-DO Adaptive Modulation & Coding simulator)
 * - §10.7 Quantitative Solved Problems from Stallings Textbook (Problems 10.1, 10.3, 10.5, 10.7, 10.8, 10.10, 10.15)
 */

import { simEngine } from '../simulations/engine.js';
import { pointsToSvgPath } from '../utils/svgUtils.js';
import { formatFrequency, formatBitrate, formatDb } from '../utils/formatters.js';
import {
  drawIsometricLaptop,
  drawIsometricRouter,
  drawIsometricBaseStation,
  drawIsometricServer,
  drawIsometricCloud,
  drawIsometricPhone,
  drawIsometricVehicle,
  drawVintageBrickPhone,
  drawIsometricBtsShelter,
  drawIsometricBscCabinet,
  drawIsometricDatabase
} from '../utils/isoGraphics.js';

let activeAnimationRaf = null;
let activeHandoffRaf = null;
let activeAmpsRaf = null;
let activeGsmRaf = null;

function cancelAllSimRafs() {
  if (activeAnimationRaf) {
    cancelAnimationFrame(activeAnimationRaf);
    activeAnimationRaf = null;
  }
  if (activeHandoffRaf) {
    cancelAnimationFrame(activeHandoffRaf);
    activeHandoffRaf = null;
  }
  if (activeAmpsRaf) {
    cancelAnimationFrame(activeAmpsRaf);
    activeAmpsRaf = null;
  }
  if (activeGsmRaf) {
    cancelAnimationFrame(activeGsmRaf);
    activeGsmRaf = null;
  }
}

export function renderChapter10(container, state, progressManager) {
  // Cancel any active animation loops
  cancelAllSimRafs();

  const currentSec = state.activeSectionId && state.activeSectionId.startsWith('sec-10')
    ? state.activeSectionId
    : 'sec-10.sim';

  container.innerHTML = `
    <div class="lesson-container">
      <!-- Section Navigation Tabs with Accurate Stallings Section Numbering -->
      <div class="lesson-nav-tabs">
        <button class="lesson-tab-btn ${currentSec === 'sec-10.sim' ? 'active' : ''}" data-sec="sec-10.sim">
          📡 10.1 Live 2-Way Simulator & Tower Limit
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.geom' ? 'active' : ''}" data-sec="sec-10.geom">
          📐 10.1.1 & 10.1.2 Geometry & Reuse
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.callflow' ? 'active' : ''}" data-sec="sec-10.callflow">
          📞 10.1.3 Call Flow & 10.1.4 Handoff
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.erlang' ? 'active' : ''}" data-sec="sec-10.erlang">
          📊 10.1.5 Traffic Engineering (Erlang B)
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.amps' ? 'active' : ''}" data-sec="sec-10.amps">
          📻 10.2 1G Analog (AMPS)
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.gsm' ? 'active' : ''}" data-sec="sec-10.gsm">
          ⏱️ 10.3 2G TDMA (GSM Architecture)
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.cdma' ? 'active' : ''}" data-sec="sec-10.cdma">
          🧬 10.4 2G CDMA, Walsh & RAKE
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.3g' ? 'active' : ''}" data-sec="sec-10.3g">
          🚀 10.5 3G (W-CDMA & 1xEV-DO)
        </button>
        <button class="lesson-tab-btn ${currentSec === 'sec-10.problems' ? 'active' : ''}" data-sec="sec-10.problems">
          📝 10.7 Solved Stallings Problems
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
      cancelAllSimRafs();
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

// Persistent simulation state
const ch10State = {
  accessMode: 'fdma', // 'fdma' | 'tdma' | 'cdma'
  activeDevicesCount: 1, // 1, 4, 8, 12
  autoCamera: true, // auto-follow camera zoom
  cameraPreset: 'overview',
  isPlaying: true, // default active
  simSpeedMultiplier: 1.0,
  manualStep: -1, // -1 = continuous loop, 0..7 = manual 8-stage round trip
  isMaximized: false,

  // Geometry state
  paramI: 2,
  paramJ: 1,
  reuseN: 7, // calculated as i² + j² + ij
  cellRadiusKm: 1.6,
  sectoring: 'omni', // 'omni' | 'sector120' | 'sector60' | 'split2'
  splittingFactor: 1,
  showVectorWalk: true,
  showLabels: true,
  gridPanX: 0,
  gridPanY: 0,
  gridZoom: 1.0,

  // 1G AMPS Analog Audio FM state
  ampsPlaying: true,
  ampsVoiceFreq: 1000, // 300 to 3000 Hz
  ampsDevKhz: 12, // 2 to 12 kHz
  ampsChannel: 1, // 1 to 416
  ampsNoise: 0.05,

  // 2G GSM TDMA Time-Slot Alignment state
  gsmPlaying: true,
  gsmDistanceKm: 6.0, // 0.5 to 30 km
  gsmTimingAdvanceEnabled: true,
  gsmSpeed: 1.0,

  // Handoff state
  handoffStrategy: 'h_th',
  handoffH: 4.0,
  handoffSpeed: 60,

  // Erlang B state
  erlangN: 25,
  erlangLambda: 1.2,
  erlangH: 120,
  erlangUsers: 500,

  // CDMA state
  walshUser: 2,
  walshActiveUsers: [true, true, true, true],
  rakeActive: true,

  // 1xEV-DO state
  evdoSnr: 14
};

function getSectionContent(secId, state) {
  switch (secId) {
    case 'sec-10.sim':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">FLAGSHIP 2-WAY SIMULATOR — TEXTBOOK PP. 265–314</div>
          <h2 class="lesson-title">Full 2-Way Cellular Protocol Flow: Uplink & Downlink Return ACK, Auto-Camera & Tower Limits</h2>
          <p class="lesson-text">
            Experience the complete end-to-end cellular communications procedure in action. When played, the simulation performs a complete <strong>2-way round trip</strong>:
            <strong>(1) Uplink</strong> from Mobile Subscriber $\\rightarrow$ Base Station Tower $\\rightarrow$ BSC $\\rightarrow$ MTSO/Core $\\rightarrow$ Web Server, and
            <strong>(2) Downlink Return Response</strong> where the system generates a return HTTP 200 OK / ACK packet, broadcasts it over the downlink radio carrier, and delivers it back to the client handset!
          </p>

          <div class="interactive-panel" style="margin-top: 14px;">
            <div class="panel-header">
              <span>END-TO-END 2-WAY ROUND TRIP CELLULAR SIMULATION & RADIO SPECTRUM ENGINE</span>
              <span class="panel-tag" id="iso-active-mode-tag">1G FDMA (AMPS ANALOG)</span>
            </div>

            <!-- In-App Stage Sizing Toolbar & Camera Focus -->
            <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
              <!-- In-App Stage Height Sizing (Never trapping screen!) -->
              <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; font-family: var(--font-mono); font-size: 0.72rem;">
                <span style="color: var(--text-dim);">CANVAS STAGE:</span>
                <button class="btn-ctrl" id="btn-size-compact" title="Compact Stage Height (380px)">📏 380px</button>
                <button class="btn-ctrl active" id="btn-size-standard" title="Standard Spacious Stage (520px)">📐 520px</button>
                <button class="btn-ctrl" id="btn-size-cinema" title="Cinematic Expanded Stage (700px)">⛶ 700px (CINEMA)</button>
                <button class="btn-ctrl" id="btn-maximize-canvas" title="Expand Viewport Inside App (780px Stage)">
                  ⛶ <span id="btn-max-text">MAXIMIZE STAGE</span>
                </button>
              </div>

              <!-- Camera Controls, Auto-Follow Toggle -->
              <div style="display: flex; gap: 5px; align-items: center; font-family: var(--font-mono); font-size: 0.72rem; flex-wrap: wrap;">
                <button class="btn-ctrl active" id="btn-toggle-autocam" title="Automatically track and zoom packet on both forward and reverse paths">
                  🎥 AUTO-ZOOM: <span id="autocam-status-text" style="color:var(--status-ready);font-weight:700;">ON</span>
                </button>
                <button class="btn-ctrl" id="btn-cam-wide" title="Wide Overview (All Nodes)">🌐 ALL</button>
                <button class="btn-ctrl" id="btn-cam-client" title="Focus Mobile Subscriber Devices">💻 CLIENTS</button>
                <button class="btn-ctrl" id="btn-cam-air" title="Focus Wireless Air Link">📡 AIR LINK</button>
                <button class="btn-ctrl" id="btn-cam-tower" title="Focus Base Station Tower & Shelter">🗼 TOWER</button>
                <button class="btn-ctrl" id="btn-cam-bsc" title="Focus Base Station Controller">🎛️ BSC</button>
                <button class="btn-ctrl" id="btn-cam-core" title="Focus Core Network & HLR/VLR">☁️ CORE</button>
                <button class="btn-ctrl" id="btn-cam-server" title="Focus Destination Web Server">🖥️ SERVER</button>
              </div>
            </div>

            <!-- In-Simulation Multiple Access & Frequency Engineering Control Tray -->
            <div class="sim-embedded-controls-tray">
              <!-- Access Architecture Selector -->
              <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                <span style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">ACCESS TECH:</span>
                <button class="btn-ctrl active" id="btn-top-fdma" style="font-size: 0.73rem; padding: 4px 9px;">
                  📡 1G FDMA (Freq Sliced)
                </button>
                <button class="btn-ctrl" id="btn-top-tdma" style="font-size: 0.73rem; padding: 4px 9px;">
                  ⏱️ 2G TDMA (Time Sliced)
                </button>
                <button class="btn-ctrl" id="btn-top-cdma" style="font-size: 0.73rem; padding: 4px 9px;">
                  🧬 2G/3G CDMA (Code Sliced)
                </button>
              </div>

              <!-- Official Real-Life Cellular Frequency Band Preset Selector -->
              <div class="sim-freq-group">
                <span style="color: var(--text-dim); font-size: 0.7rem; font-weight: 700;">OFFICIAL BAND:</span>
                <select id="sim-select-band" class="control-select" style="background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 4px 8px; font-family: var(--font-mono); font-size: 0.72rem; border-radius: 4px;">
                  <option value="amps850" selected>1G AMPS 850 (824-849 MHz Tx / 869-894 MHz Rx, Duplex: +45 MHz, 30 kHz)</option>
                  <option value="gsm900">2G GSM 900 (890-915 MHz Tx / 935-960 MHz Rx, Duplex: +45 MHz, 200 kHz ARFCN 1..124)</option>
                  <option value="gsm1800">2G GSM 1800 DCS (1710-1785 MHz Tx / 1805-1880 MHz Rx, Duplex: +95 MHz, 200 kHz)</option>
                  <option value="cdma800">2G/3G CDMA 800 (824-849 MHz Tx / 869-894 MHz Rx, 1.25 MHz Spread Raster)</option>
                  <option value="custom">✏️ Custom User-Defined Band (Editable)</option>
                </select>
              </div>

              <!-- Real-Life Editable Frequency Inputs -->
              <div class="sim-freq-group" style="background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.2); border-radius: 4px; padding: 3px 8px;">
                <span style="color: #38bdf8; font-weight: 700;">Uplink f_ul:</span>
                <input type="number" id="sim-input-uplink" value="825.03" step="0.03" class="sim-freq-input" style="width: 78px;" title="Reverse channel (Mobile to BTS) frequency in MHz"/>
                <span style="color: var(--text-dim);">MHz</span>
                
                <span style="color: var(--text-dim); margin-left: 4px;">|</span>
                <span style="color: #ffb703; font-weight: 700;">Duplex Δf:</span>
                <input type="number" id="sim-input-duplex" value="45.0" step="1.0" class="sim-freq-input" style="width: 55px;" title="Official duplex frequency offset in MHz"/>
                <span style="color: var(--text-dim);">MHz</span>

                <span style="color: var(--text-dim); margin-left: 4px;">|</span>
                <span style="color: #00ff9d; font-weight: 700;">Downlink f_dl:</span>
                <span id="sim-disp-downlink" style="color: #00ff9d; font-weight: 700;">870.03 MHz</span>

                <span style="color: var(--text-dim); margin-left: 4px;">|</span>
                <span style="color: var(--text-dim);">Ch/ARFCN:</span>
                <input type="number" id="sim-input-ch" value="1" min="1" max="1024" class="sim-freq-input" style="width: 50px;" title="Channel number"/>
              </div>

              <!-- Multi-Device Subscriber Load Option -->
              <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
                <span style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">USERS:</span>
                <button class="btn-ctrl active" id="btn-dev-1" title="1 Device — Deep-dive single packet trace">1 CLIENT</button>
                <button class="btn-ctrl" id="btn-dev-4" title="4 Devices — Moderate traffic load">4 USERS</button>
                <button class="btn-ctrl" id="btn-dev-8" title="8 Devices — Full single-carrier capacity">8 USERS</button>
                <button class="btn-ctrl" id="btn-dev-12" title="12 Devices — Tower Overload & Erlang B Blocking!">⚠️ 12 OVERLOAD</button>
              </div>
            </div>

            <!-- Main Interactive Cellular Viewport Container with Mouse Drag & Wheel Zoom -->
            <div class="canvas-viewport-container size-standard" id="canvas-container-box">
              <!-- Floating Pan/Zoom Navigation Toolbar -->
              <div style="position: absolute; top: 10px; left: 12px; display: flex; gap: 6px; align-items: center; z-index: 10; flex-wrap: wrap;">
                <div style="background: rgba(3, 7, 18, 0.92); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 4px 10px; font-family: var(--font-mono); font-size: 0.72rem; display: flex; align-items: center; gap: 8px;">
                  <span id="cam-lens-icon">🎥</span>
                  <span style="color: var(--text-dim);">CAMERA:</span>
                  <span id="cam-mode-status" style="color: var(--accent-cyan); font-weight: 700;">OVERVIEW (1.0×)</span>
                </div>
                <button class="canvas-tool-btn" id="btn-pan-mode-hint" title="Click and drag anywhere to look around the cellular deployment">
                  🖐 DRAG TO PAN
                </button>
                <button class="canvas-tool-btn" id="btn-sim-zin" title="Zoom In Scene">➕</button>
                <button class="canvas-tool-btn" id="btn-sim-zout" title="Zoom Out Scene">➖</button>
                <button class="canvas-tool-btn" id="btn-sim-reset-view" title="Reset Viewport to Standard Full View">↺ RESET VIEW</button>
              </div>

              <!-- Persistent In-Canvas Minimize Button (Shown when stage is enlarged/maximized) -->
              <button class="canvas-tool-btn" id="btn-floating-minimize" style="display: none; position: absolute; top: 10px; right: 340px; z-index: 15; background: rgba(255, 0, 85, 0.25); border: 1px solid #ff0055; color: #fff; font-weight: 700; font-family: var(--font-mono); font-size: 0.75rem; padding: 5px 12px; box-shadow: 0 0 15px rgba(255,0,85,0.4);" title="Restore stage to standard height (or press Esc)">
                🗗 MINIMIZE STAGE (ESC)
              </button>

              <!-- Live Tower Load & Capacity HUD Overlay -->
              <div style="position: absolute; top: 10px; right: 12px; max-width: 310px; background: rgba(3, 7, 18, 0.94); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 10px; font-family: var(--font-mono); font-size: 0.72rem; z-index: 10;" id="tower-capacity-hud">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="color: #fff; font-weight: 700;">🗼 BS TOWER CAPACITY</span>
                  <span id="tower-util-text" style="color: var(--accent-cyan); font-weight: 700;">1 / 8 CHANNELS (12.5%)</span>
                </div>
                <!-- Capacity Meter Bar -->
                <div class="tower-capacity-meter">
                  <div class="tower-capacity-fill" id="tower-meter-fill" style="width: 12.5%; background: var(--accent-cyan);"></div>
                </div>
                <!-- Channel Slots / Chipping Status -->
                <div style="margin-top: 8px;">
                  <div style="color: var(--text-dim); font-size: 0.65rem; margin-bottom: 4px;" id="tower-channel-type-label">30 kHz FDMA CARRIERS:</div>
                  <div class="channels-chips-grid" id="tower-channels-grid"></div>
                </div>
                <!-- Capacity Warning / Erlang B Blocking Notice -->
                <div id="tower-blocking-notice" style="display: none; margin-top: 6px; padding: 4px 6px; background: rgba(255, 0, 85, 0.2); border: 1px solid #ff0055; border-radius: 3px; color: #ff0055; font-size: 0.68rem; line-height: 1.3;">
                  ⚠️ <strong>CALL BLOCKED!</strong> All 8 channels occupied. Stallings Erlang B Loss P = 42.8%. Extra subscriber rejected with busy tone.
                </div>
              </div>

              <!-- GSM TDMA 8-Slot Frame Clock Strip Overlay (Active in TDMA Mode) -->
              <div id="sim-tdma-clock-overlay" style="position: absolute; bottom: 8px; left: 12px; right: 12px; background: rgba(3, 7, 18, 0.94); border: 1px solid #00ff9d; border-radius: 6px; padding: 6px 10px; z-index: 8; display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-family: var(--font-mono); font-size: 0.7rem;">
                  <span style="color: #00ff9d; font-weight: 700;">⏱️ REAL-TIME GSM TDMA 8-SLOT FRAME (4.615 ms Frame | 577 µs Burst Synchronization)</span>
                  <span id="sim-tdma-active-slot-txt" style="color: var(--accent-cyan);">Active Slot: TS 3 (MS-1 Normal Burst Transmitting)</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;" id="sim-tdma-slots-hud-grid">
                  <!-- Generated dynamically: Slot 0..7 -->
                </div>
              </div>

              <!-- Widescreen SVG Viewport (1600 x 480) with Full Pan & Zoom Support -->
              <svg viewBox="0 0 1600 480" preserveAspectRatio="xMidYMid meet" id="iso-cellular-svg">
                <defs>
                  <!-- Ground Grid Pattern -->
                  <pattern id="iso-ground-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 229, 255, 0.05)" stroke-width="0.8"/>
                    <circle cx="0" cy="0" r="1" fill="rgba(0, 229, 255, 0.2)"/>
                  </pattern>

                  <!-- Carrier Wave Gradients -->
                  <linearGradient id="rf-wave-grad-fdma" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.9"/>
                    <stop offset="50%" stop-color="#38bdf8" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#0070f3" stop-opacity="0.8"/>
                  </linearGradient>

                  <linearGradient id="rf-wave-grad-tdma" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00ff9d" stop-opacity="0.9"/>
                    <stop offset="50%" stop-color="#00e5ff" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.8"/>
                  </linearGradient>

                  <linearGradient id="rf-wave-grad-cdma" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#ff0055" stop-opacity="0.9"/>
                    <stop offset="50%" stop-color="#ffb703" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#a855f7" stop-opacity="0.8"/>
                  </linearGradient>
                </defs>

                <!-- Ground Background & Grid -->
                <rect width="1600" height="480" fill="#030712"/>
                <rect width="1600" height="480" fill="url(#iso-ground-grid)"/>

                <!-- Cell Boundary Sector Arc (R = 1.6 km) -->
                <ellipse cx="780" cy="330" rx="640" ry="145" fill="rgba(0, 112, 243, 0.03)" stroke="rgba(0, 229, 255, 0.15)" stroke-width="1.5" stroke-dasharray="6 4"/>
                <text x="60" y="460" fill="rgba(255,255,255,0.3)" font-size="10" font-family="monospace">CELL A COVERAGE SECTOR (Radius R = 1.6 km | Inter-Site Distance d = 2.77 km | Macrocell Urban Deployment)</text>

                <!-- 1. MULTIPLE SUBSCRIBER CLIENTS CONTAINER (LEFT ZONE: x=60..320) -->
                <g id="iso-subscribers-group">
                  <!-- MS-1 Primary Client: Laptop + Smartphone (Spaced for maximum clarity at x=160, y=280) -->
                  <g id="iso-client-primary" transform="translate(0, 0)">
                    ${drawIsometricLaptop(160, 280, 0.95, '#00e5ff')}
                    ${drawIsometricPhone(90, 310, 0.8, '#38bdf8')}
                    <text x="80" y="350" fill="#fff" font-size="11" font-family="monospace" font-weight="700">MS-1 (Primary)</text>
                    <text x="80" y="364" fill="#00e5ff" font-size="9" font-family="monospace" id="ms1-label-sub">Tx: 825.03 MHz (Ch 1)</text>
                  </g>

                  <!-- Additional Multi-Users (Rendered with distinct spatial separation) -->
                  <g id="iso-multi-devices"></g>
                </g>

                <!-- Pulsing RF Waves Radiating from Client Antennas -->
                <circle id="iso-client-rf-pulse" cx="160" cy="240" r="10" fill="none" stroke="#00e5ff" stroke-width="1.5" opacity="0"/>
                <circle id="iso-client-rf-pulse-2" cx="160" cy="240" r="20" fill="none" stroke="#00e5ff" stroke-width="1" opacity="0"/>

                <!-- REAL-TIME OSCILLATING ELECTROMAGNETIC SINE WAVES ACROSS AIR INTERFACE (x=160..780) -->
                <!-- Uplink Wave (MS -> BS) -->
                <path id="iso-em-carrier-wave" d="" fill="none" stroke="url(#rf-wave-grad-fdma)" stroke-width="2.5" opacity="0.85"/>
                <!-- Downlink Wave (BS -> MS Return ACK) -->
                <path id="iso-em-downlink-wave" d="" fill="none" stroke="#00ff9d" stroke-width="2.2" stroke-dasharray="6 4" opacity="0"/>

                <!-- Air Link Label & Propagation Metrics (x=410, y=85) -->
                <g id="iso-air-metrics-badge" transform="translate(390, 80)">
                  <rect x="0" y="0" width="220" height="38" fill="#081024" stroke="rgba(0,229,255,0.4)" stroke-width="1.2" rx="4"/>
                  <text x="10" y="16" fill="#00e5ff" font-size="9.5" font-family="monospace" font-weight="700" id="iso-air-carrier-txt">fc: 825.03 MHz | λ: 36.34cm</text>
                  <text x="10" y="30" fill="#64748b" font-size="8.5" font-family="monospace" id="iso-air-loss-txt">Hata Loss: -114.2 dB | d: 2.4km</text>
                </g>

                <!-- 2. BASE STATION TOWER & EQUIPMENT SHELTER (x=780, y=270) -->
                <g id="iso-node-bs">
                  ${drawIsometricBtsShelter(720, 320, 0.95, '#38bdf8')}
                  ${drawIsometricBaseStation(780, 270, 1.15, '#38bdf8')}
                  <text x="730" y="350" fill="#fff" font-size="12" font-family="monospace" font-weight="700">BS-A Transceiver</text>
                  <text x="730" y="365" fill="#00e5ff" font-size="9" font-family="monospace">Base Station Tower & RF Shelter</text>
                  <circle id="iso-bs-rf-pulse" cx="780" cy="150" r="18" fill="none" stroke="#00ff9d" stroke-width="1.8" opacity="0"/>
                </g>

                <!-- Cable: BS to BSC / Telecom Edge Trunk (x=820 to 980) -->
                <line x1="820" y1="280" x2="980" y2="280" stroke="#1e293b" stroke-width="5"/>
                <line x1="820" y1="280" x2="980" y2="280" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 3" id="wire-link-1"/>
                <text x="840" y="270" fill="#64748b" font-size="8.5" font-family="monospace">Abis Trunk (2.048M E1)</text>

                <!-- 3. BASE STATION CONTROLLER / ROUTER (x=1020, y=280) -->
                <g id="iso-node-router">
                  ${drawIsometricBscCabinet(1020, 300, 0.95, '#ffb703')}
                  <text x="965" y="355" fill="#fff" font-size="12" font-family="monospace" font-weight="700">BSC Controller</text>
                  <text x="965" y="370" fill="#ffb703" font-size="9" font-family="monospace">Radio Resource & Transcoder</text>
                </g>

                <!-- Cable: BSC to Core Cloud / MTSO (x=1060 to 1200) -->
                <line x1="1060" y1="280" x2="1200" y2="240" stroke="#1e293b" stroke-width="5"/>
                <line x1="1060" y1="280" x2="1200" y2="240" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 3" id="wire-link-2"/>
                <text x="1090" y="250" fill="#64748b" font-size="8.5" font-family="monospace">A-Interface / SS7 IP</text>

                <!-- 4. CELLULAR CORE / MTSO / MSC CLOUD & DATABASES (x=1240, y=240) -->
                <g id="iso-node-cloud">
                  ${drawIsometricCloud(1240, 240, 1.15, '#38bdf8')}
                  ${drawIsometricDatabase(1190, 330, 0.75, '#00ff9d', 'HLR')}
                  ${drawIsometricDatabase(1270, 330, 0.75, '#38bdf8', 'VLR')}
                  <text x="1190" y="280" fill="#fff" font-size="12" font-family="monospace" font-weight="700">MTSO / MSC Core</text>
                  <text x="1190" y="295" fill="#38bdf8" font-size="9" font-family="monospace">HLR / VLR / Packet Gateway</text>
                </g>

                <!-- Cable: Cloud to Public Web Server Backbone (x=1290 to 1430) -->
                <line x1="1290" y1="230" x2="1430" y2="230" stroke="#1e293b" stroke-width="5"/>
                <line x1="1290" y1="230" x2="1430" y2="230" stroke="#00ff9d" stroke-width="2" stroke-dasharray="6 3" id="wire-link-3"/>
                <text x="1315" y="220" fill="#00ff9d" font-size="8.5" font-family="monospace">Public Internet Fiber</text>

                <!-- 5. DESTINATION APPLICATION / WEB SERVER (x=1490, y=270) -->
                <g id="iso-node-server">
                  ${drawIsometricServer(1490, 270, 1.05, '#00ff9d')}
                  <text x="1440" y="335" fill="#fff" font-size="12" font-family="monospace" font-weight="700">Web / DNS Host</text>
                  <text x="1445" y="350" fill="#00ff9d" font-size="9" font-family="monospace">IP: 8.8.8.8 (Server)</text>
                </g>

                <!-- LIVE MOVING PACKETS (FORWARD UPLINK & RETURN DOWNLINK ACK) -->
                <g id="iso-active-packets-container">
                  <!-- Forward Uplink Packet (MS -> Server) -->
                  <g id="iso-animated-packet">
                    <rect id="iso-pkt-bubble" x="160" y="250" width="135" height="26" fill="#0b1329" stroke="#00e5ff" stroke-width="1.8" rx="4"/>
                    <text id="iso-pkt-text" x="168" y="267" fill="#00e5ff" font-size="9" font-family="monospace" font-weight="700">
                      UPLINK: f1 825.03M
                    </text>
                  </g>
                  <!-- Return Downlink ACK Packet (Server -> MS) -->
                  <g id="iso-animated-packet-ack" opacity="0">
                    <rect id="iso-pkt-bubble-ack" x="1420" y="230" width="135" height="26" fill="#041f17" stroke="#00ff9d" stroke-width="1.8" rx="4"/>
                    <text id="iso-pkt-text-ack" x="1428" y="247" fill="#00ff9d" font-size="9" font-family="monospace" font-weight="700">
                      DOWNLINK: HTTP 200
                    </text>
                  </g>
                  <!-- Secondary Packet (Multi-user) -->
                  <g id="iso-animated-packet-2" opacity="0">
                    <rect id="iso-pkt-bubble-2" x="160" y="190" width="125" height="24" fill="#0b1329" stroke="#38bdf8" stroke-width="1.5" rx="4"/>
                    <text id="iso-pkt-text-2" x="168" y="206" fill="#38bdf8" font-size="8.5" font-family="monospace" font-weight="700">
                      MS-2: f2 825.06M
                    </text>
                  </g>
                </g>
              </svg>
            </div>

            <!-- Playback & Simulation Transport Controls -->
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); flex-wrap: wrap;">
              <button class="btn-ctrl active" id="btn-iso-play" style="font-size:0.78rem; padding:6px 16px; background: rgba(0,229,255,0.18); border-color:#00e5ff; color:#00e5ff; min-width:96px;">
                ⏸ PAUSE
              </button>
              <button class="btn-ctrl" id="btn-iso-step" style="font-size:0.75rem; padding:6px 12px;" title="Advance one procedure step">
                ⏭ STEP
              </button>
              <button class="btn-ctrl" id="btn-iso-reset" style="font-size:0.75rem; padding:6px 12px;" title="Reset back to client">
                ↺ RESET
              </button>
              
              <div style="display: flex; gap: 4px; align-items: center; margin-left: 6px;">
                <span style="color:var(--text-dim); font-size:0.72rem;">SPEED:</span>
                <button class="sim-speed-btn" data-spd="0.5">0.5×</button>
                <button class="sim-speed-btn active" data-spd="1.0">1×</button>
                <button class="sim-speed-btn" data-spd="2.0">2×</button>
                <button class="sim-speed-btn" data-spd="4.0">4×</button>
              </div>

              <!-- Step Indicator -->
              <span id="iso-step-indicator" style="color:var(--accent-sky); font-size:0.75rem; margin-left:auto; font-weight:700;">
                STAGE 1 / 10 — UPLINK: MOBILE BASEBAND SPEECH ENCODING
              </span>
            </div>

            <!-- Real-Time Protocol & RF Layer Telemetry HUD -->
            <div id="iso-hud-box" style="margin-top: 8px; background: rgba(15,23,42,0.85); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 0.75rem; flex-wrap: wrap; gap: 6px;">
              <span id="iso-hud-status" style="color: var(--status-ready);">● 2-WAY ROUND TRIP SIMULATION ACTIVE: Automated procedure & camera tracking running</span>
              <span id="iso-hud-phy" style="color: var(--text-dim);">UPLINK: 825.03 MHz | DOWNLINK: 870.03 MHz | DUPLEX: +45 MHz | MOD: FM (AMPS)</span>
            </div>

            <!-- Deep-Dive Protocol Procedure Breakdown Card (10 Granular Stages) -->
            <div id="iso-step-detail" style="margin-top:8px; background:rgba(11, 19, 41, 0.85); border:1px solid var(--border-subtle); border-radius:6px; padding:12px 16px; font-family:var(--font-mono); font-size:0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="color:var(--accent-sky); font-size:0.7rem; font-weight:700;" id="iso-step-num">ROUND TRIP STAGE 1 OF 10</div>
                <div style="color:var(--status-ready); font-size:0.7rem; font-weight:700;" id="iso-step-direction">⬆️ UPLINK DIRECTION</div>
              </div>
              <div style="color:#fff; font-weight:700; font-size:0.95rem; margin-bottom:4px;" id="iso-step-title">1. MOBILE BASEBAND SPEECH ENCODING</div>
              <div style="color:var(--text-secondary); line-height:1.5;" id="iso-step-desc">
                The Mobile Subscriber (MS) terminal samples voice at 8 kHz / 13-bit uniform PCM. The RPE-LTP codec compresses the acoustic stream into 260 bits per 20 ms frame.
              </div>
              <div style="margin-top:8px; display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:6px;" id="iso-step-meta"></div>
            </div>
          </div>
        </div>
      `;

    case 'sec-10.geom':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.1.1 & 10.1.2 — TEXTBOOK PP. 265–277</div>
          <h2 class="lesson-title">Cellular Geometry, Clusters, Frequency Reuse, & Dynamic Scaling</h2>
          <p class="lesson-text">
            Prior to cellular radio, high-power mobile systems supported only ~25 channels across an 80-km radius. Cellular design achieves immense capacity by deploying a grid of low-power base stations ($\le 100\text{ W}$) and reusing frequency bands across spatially separated cells.
          </p>

          <div class="formula-box-large">
            N = i² + j² + i·j  (Possible N = 1, 3, 4, 7, 9, 12, 19...)  |  D = R · √(3N)  |  D/d = √N  |  d = √3·R
          </div>

          <!-- Deep-Dive (i, j) Explanation Card -->
          <div style="background: rgba(11, 19, 41, 0.75); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px 16px; margin: 12px 0; font-family: var(--font-mono); font-size: 0.75rem; line-height: 1.6;">
            <div style="color: var(--accent-cyan); font-weight: 700; margin-bottom: 4px; font-size: 0.82rem;">
              🔍 WHAT ARE 'i' AND 'j'? (STALLINGS FIGURE 10.2 EXPLAINED)
            </div>
            <div style="color: var(--text-secondary);">
              In a regular hexagonal lattice, <em>i</em> and <em>j</em> are non-negative integer shifts along the coordinate axes of the hexagon grid (which are separated by 60°).
              To find the nearest <strong>co-channel cells</strong> (cells reusing the exact same frequency set) from any reference cell <em>A</em>:
            </div>
            <ol style="margin: 6px 0 6px 18px; color: var(--text-bright);">
              <li><strong style="color: #00e5ff;">Step 1:</strong> Move <strong>i</strong> cells along any chain of hexagons in a straight line.</li>
              <li><strong style="color: #ffb703;">Step 2:</strong> Turn <strong>60° counter-clockwise</strong> at that cell.</li>
              <li><strong style="color: #00ff9d;">Step 3:</strong> Move <strong>j</strong> cells along that new 60° direction.</li>
            </ol>
            <div style="color: var(--text-dim); font-size: 0.7rem;">
              You land precisely on a co-channel cell! The straight-line Euclidean distance between cell centers is <strong>D = R√(3N)</strong> where <strong>N = i² + j² + ij</strong>. Repeating this across all 6 symmetric orientations yields the 6 first-tier co-channel interferers.
            </div>
          </div>

          <!-- Interactive Canvas-Based Hexagonal Cluster Generator with Dynamic Scaling -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>CANVAS HEXAGONAL CLUSTER GENERATOR & CO-CHANNEL VECTOR WALK</span>
              <span class="panel-tag" id="hex-canvas-status-tag">CANVAS 2D ENGINE (DRAG & ZOOM)</span>
            </div>

            <!-- Controls Grid for (i, j), N, Radius R, and Sectoring -->
            <div class="ch2-controls-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
              <div class="ch2-ctrl param-ctrl-with-tooltip" id="ctrl-param-i">
                <div class="ch2-lbl">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span>STEP i (PRIMARY AXIS)</span>
                    <button type="button" class="info-tooltip-trigger" id="btn-tip-i" aria-expanded="false" title="Learn how 'i' affects cluster size N = i² + ij + j²">
                      ⓘ
                    </button>
                  </div>
                  <span id="ch10-val-i" style="color: var(--accent-cyan); font-weight: 700;">i = 2</span>
                </div>
                <input type="range" id="ch10-slider-i" min="0" max="4" step="1" value="2" class="control-slider"/>

                <!-- Interactive Tooltip for Parameter i -->
                <div class="param-interactive-tooltip" id="tooltip-box-i" style="display: none;">
                  <div class="tip-header">
                    <span class="tip-title" style="color: var(--accent-cyan);">PARAMETER i · PRIMARY LATTICE AXIS (0°)</span>
                    <button type="button" class="tip-close-btn" id="btn-close-tip-i">&times;</button>
                  </div>
                  <div class="tip-body">
                    <p><strong>Geometrical Role:</strong> Number of cells to advance in a straight line along the primary hexagonal coordinate axis (0°).</p>
                    <div class="tip-formula-box">
                      <div class="tip-formula-row"><strong>Cluster Size Formula:</strong> <span style="color:#ffb703;">N = i² + ij + j²</span></div>
                      <div class="tip-formula-calc" id="tip-calc-i">Currently: i = 2 → contributes i² = 4 and ij = 2 to N = 7</div>
                    </div>
                    <p><strong>Frequency Reuse Impact (1/N):</strong></p>
                    <ul>
                      <li>Larger <em>i</em> increases cluster size <em>N</em>, pushing co-channel cells farther apart (D = R√(3N)).</li>
                      <li>Reduces co-channel interference (S/I), but allocates fewer channels per cell (K = S / N).</li>
                      <li>Standard: <em>i = 2, j = 1</em> yields the classic N = 7 AMPS/GSM cellular cluster.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="ch2-ctrl param-ctrl-with-tooltip" id="ctrl-param-j">
                <div class="ch2-lbl">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span>STEP j (60° TURN AXIS)</span>
                    <button type="button" class="info-tooltip-trigger tip-trigger-j" id="btn-tip-j" aria-expanded="false" title="Learn how 'j' affects cluster size N = i² + ij + j²">
                      ⓘ
                    </button>
                  </div>
                  <span id="ch10-val-j" style="color: #00ff9d; font-weight: 700;">j = 1</span>
                </div>
                <input type="range" id="ch10-slider-j" min="0" max="4" step="1" value="1" class="control-slider"/>

                <!-- Interactive Tooltip for Parameter j -->
                <div class="param-interactive-tooltip tip-j-theme" id="tooltip-box-j" style="display: none;">
                  <div class="tip-header">
                    <span class="tip-title" style="color: #00ff9d;">PARAMETER j · 60° TURN AXIS (+60° CCW)</span>
                    <button type="button" class="tip-close-btn" id="btn-close-tip-j">&times;</button>
                  </div>
                  <div class="tip-body">
                    <p><strong>Geometrical Role:</strong> After moving <em>i</em> cells, rotate exactly <strong>60° counter-clockwise</strong> (the natural angle of hexagonal symmetry) and advance <em>j</em> cells.</p>
                    <div class="tip-formula-box">
                      <div class="tip-formula-row"><strong>Cluster Size Formula:</strong> <span style="color:#ffb703;">N = i² + ij + j²</span></div>
                      <div class="tip-formula-calc calc-j" id="tip-calc-j">Currently: j = 1 → contributes j² = 1 and ij = 2 to N = 7</div>
                    </div>
                    <p><strong>Honeycomb Tessellation Impact:</strong></p>
                    <ul>
                      <li>The cross-term <em>ij</em> represents the skew component of the rhombic hexagonal coordinate system (Law of Cosines: D² = i² + j² + ij).</li>
                      <li>Setting <em>j &gt; 0</em> produces interlocking clusters that seamlessly tile the 2D plane with zero voids.</li>
                      <li>When <em>j = 0</em>, N = i² produces straight clusters (N = 1, 4, 9).</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>CLUSTER SIZE N = i² + j² + ij</span>
                  <span id="ch10-val-n" style="color: #ffb703; font-weight: 700;">N = 7 (i=2, j=1)</span>
                </div>
                <select id="ch10-select-n" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="1">N = 1 (i=1, j=0 — Universal CDMA)</option>
                  <option value="3">N = 3 (i=1, j=1)</option>
                  <option value="4">N = 4 (i=2, j=0)</option>
                  <option value="7" selected>N = 7 (i=2, j=1 — Standard AMPS/GSM)</option>
                  <option value="9">N = 9 (i=3, j=0)</option>
                  <option value="12">N = 12 (i=2, j=2)</option>
                  <option value="13">N = 13 (i=3, j=1)</option>
                  <option value="19">N = 19 (i=3, j=2)</option>
                </select>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>CELL RADIUS (R) — DYNAMIC SCALING</span>
                  <span id="ch10-val-r" style="color: #fff; font-weight: 700;">1.6 km (Macrocell)</span>
                </div>
                <input type="range" id="ch10-slider-r" min="0.5" max="4.0" step="0.1" value="1.6" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>CAPACITY EXPANSION TECHNIQUE</span>
                  <span id="ch10-val-exp">Standard Omni Cell</span>
                </div>
                <select id="ch10-select-expansion" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="omni" selected>Standard Omnidirectional (360° Antenna)</option>
                  <option value="sector120">Cell Sectoring (3 × 120° Directional Sectors)</option>
                  <option value="sector60">Cell Sectoring (6 × 60° Directional Sectors)</option>
                  <option value="split2">Cell Splitting (Radius R / 2 → 4× Base Stations)</option>
                </select>
              </div>
            </div>

            <!-- Canvas Container with Interactive Mouse Pan & Wheel Zoom -->
            <div class="canvas-interactive-wrapper" id="hex-canvas-wrapper" style="margin-top: 12px; height: 380px;">
              <!-- Floating Canvas Toolbar -->
              <div class="canvas-floating-toolbar">
                <button class="canvas-tool-btn active" id="btn-hex-walk" title="Toggle (i, j) step-by-step vector walk and cochannel lines">
                  🚶 (i,j) WALK: ON
                </button>
                <button class="canvas-tool-btn active" id="btn-hex-labels" title="Toggle channel/cluster group labels">
                  🏷️ LABELS: ON
                </button>
                <button class="canvas-tool-btn" id="btn-hex-pan-left" title="Pan Left (Navigate cellular deployment)">◀</button>
                <button class="canvas-tool-btn" id="btn-hex-pan-up" title="Pan Up (Navigate cellular deployment)">▲</button>
                <button class="canvas-tool-btn" id="btn-hex-pan-down" title="Pan Down (Navigate cellular deployment)">▼</button>
                <button class="canvas-tool-btn" id="btn-hex-pan-right" title="Pan Right (Navigate cellular deployment)">▶</button>
                <button class="canvas-tool-btn" id="btn-hex-zin" title="Zoom In Canvas">➕</button>
                <button class="canvas-tool-btn" id="btn-hex-zout" title="Zoom Out Canvas">➖</button>
                <button class="canvas-tool-btn" id="btn-hex-center" title="Center on origin cell A">🎯 ORIGIN</button>
                <button class="canvas-tool-btn" id="btn-hex-reset" title="Reset pan and zoom">↺ RESET</button>
              </div>

              <!-- HTML5 Canvas Element -->
              <canvas id="hex-grid-canvas" class="hex-canvas-element" width="900" height="380"></canvas>

              <!-- Canvas interaction hint -->
              <div class="canvas-hint-pill">
                <span>🖐 Click & drag to pan around grid</span>
                <span>·</span>
                <span>⚙️ Scroll wheel to zoom</span>
                <span>·</span>
                <span id="hex-hover-info" style="color: var(--accent-cyan);">Hover over any cell to inspect</span>
              </div>
            </div>

            <!-- Mathematical Telemetry Cards -->
            <div class="calc-results-grid" style="margin-top: 14px;">
              <div class="res-card">
                <div class="res-title">ADJACENT BS DISTANCE (d = √3·R)</div>
                <div class="res-val" id="hex-out-d">2.77 km</div>
                <div class="res-sub">Distance between adjacent cell centers</div>
              </div>

              <div class="res-card highlight">
                <div class="res-title">CO-CHANNEL REUSE DISTANCE (D = R√(3N))</div>
                <div class="res-val" id="hex-out-cochan">7.33 km</div>
                <div class="res-sub" id="hex-out-ratio">Normalized ratio D/d = √7 ≈ 2.65</div>
              </div>

              <div class="res-card">
                <div class="res-title">CELL AREA (1.5 · √3 · R²)</div>
                <div class="res-val" id="hex-out-area">6.65 km²</div>
                <div class="res-sub" id="hex-out-sir">Worst-case S/I ≈ 18.7 dB (γ=4)</div>
              </div>

              <div class="res-card">
                <div class="res-title">FREQUENCY REUSE FACTOR (1/N)</div>
                <div class="res-val" id="hex-out-factor">1 / 7 (14.3%)</div>
                <div class="res-sub" id="hex-out-cap-note">Channels per cell K = Total / 7</div>
            </div>
          </div>
        </div>
      `;

    case 'sec-10.callflow':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTIONS 10.1.3 & 10.1.4 — TEXTBOOK PP. 269–277</div>
          <h2 class="lesson-title">Operation of Cellular Systems: 6-Step Call Flow & Handoff Hysteresis</h2>
          <p class="lesson-text">
            Cellular call management is completely automated. Two channel types exist between the mobile unit and the base station: <strong>Control Channels</strong> (used for setup, registration, and paging) and <strong>Traffic Channels</strong> (carrying voice or data).
          </p>

          <!-- 6-Step Call Flow Diagram (Figure 10.6 with Clean Spacing) -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>AUTOMATED CELLULAR CALL PROCEDURE (STALLINGS FIGURE 10.6)</span>
              <span class="panel-tag">CLICK ANY STEP TO INSPECT</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-top: 12px;">
              <div class="flow-step-card" id="flow-step-1" style="border-left: 3px solid #00e5ff;">
                <div class="step-header-tag" style="color: #00e5ff;">STEP 1: INITIALIZATION</div>
                <div class="step-title">Monitor Strongest Setup Signal</div>
                <div class="step-desc">
                  When turned on, the mobile unit scans and selects the strongest setup control channel. It locks onto the BS antenna of that cell and completes a registration handshake with the MTSO.
                </div>
              </div>

              <div class="flow-step-card" id="flow-step-2" style="border-left: 3px solid #38bdf8;">
                <div class="step-header-tag" style="color: #38bdf8;">STEP 2: CALL ORIGINATION</div>
                <div class="step-title">Request Connection on RCC</div>
                <div class="step-desc">
                  The caller dials the number and presses send. The mobile verifies the setup channel is idle, then transmits the called number on the Reverse Control Channel (RCC).
                </div>
              </div>

              <div class="flow-step-card" id="flow-step-3" style="border-left: 3px solid #ffb703;">
                <div class="step-header-tag" style="color: #ffb703;">STEP 3: PAGING</div>
                <div class="step-title">MTSO Broadcasts Page</div>
                <div class="step-desc">
                  The MTSO verifies authorization and dispatches a paging message to the base stations in the called unit's registered location area on their Forward Control Channels (FCC).
                </div>
              </div>

              <div class="flow-step-card" id="flow-step-4" style="border-left: 3px solid #00ff9d;">
                <div class="step-header-tag" style="color: #00ff9d;">STEP 4: TRAFFIC ASSIGNMENT</div>
                <div class="step-title">Call Accepted & Channels Tuned</div>
                <div class="step-desc">
                  Called handset recognizes its number, replies to the BS, and MTSO sets up a circuit. MTSO allocates an available traffic channel at both BSs, and both handsets tune to their assigned frequencies.
                </div>
              </div>

              <div class="flow-step-card" id="flow-step-5" style="border-left: 3px solid #a855f7;">
                <div class="step-header-tag" style="color: #a855f7;">STEP 5: ONGOING CALL</div>
                <div class="step-title">Voice / Data Exchange & Power Control</div>
                <div class="step-desc">
                  Both parties converse in full-duplex through BS-A $\\rightarrow$ MTSO $\\rightarrow$ BS-B. Closed-loop power control actively adjusts mobile transmit power at 1.6 kHz.
                </div>
              </div>

              <div class="flow-step-card" id="flow-step-6" style="border-left: 3px solid #f43f5e;">
                <div class="step-header-tag" style="color: #f43f5e;">STEP 6: HANDOFF</div>
                <div class="step-title">Seamless Cell Reassignment</div>
                <div class="step-desc">
                  As the mobile moves into an adjacent cell, the traffic channel is transferred to the new base station without interrupting the call or requiring user action.
                </div>
              </div>
            </div>
          </div>

          <!-- Interactive Handoff Hysteresis Workbench (Figure 10.7) -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>HANDOFF DECISION MECHANISMS & HYSTERESIS SIMULATOR (STALLINGS FIGURE 10.7)</span>
              <span class="panel-tag">PREVENTS PING-PONG EFFECT</span>
            </div>

            <div class="ch2-controls-grid">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>HANDOFF STRATEGY</span>
                  <span id="ch10-val-strat">Hysteresis + Threshold (Optimal)</span>
                </div>
                <select id="ch10-select-strat" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="rel">1. Relative Signal Strength (Causes Ping-Pong Flapping!)</option>
                  <option value="th">2. Relative Signal with Threshold (Th₂ = -95 dBm)</option>
                  <option value="h">3. Relative Signal with Hysteresis (H margin)</option>
                  <option value="h_th" selected>4. Relative Signal with Hysteresis + Threshold (Stallings Recommended)</option>
                </select>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>HYSTERESIS MARGIN (H)</span>
                  <span id="ch10-val-h">4.0 dB</span>
                </div>
                <input type="range" id="ch10-slider-h" min="0" max="12" step="0.5" value="4.0" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>VEHICLE SPEED</span>
                  <span id="ch10-val-speed">60 km/h</span>
                </div>
                <input type="range" id="ch10-slider-speed" min="20" max="180" step="10" value="60" class="control-slider"/>
              </div>
            </div>

            <!-- Vehicle Movement SVG & Signal Strength Graph -->
            <div style="background: #020409; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px; margin-top: 12px; overflow-x: auto;">
              <svg viewBox="0 0 760 180" style="width: 100%; height: 180px; min-width: 500px;" id="handoff-sim-svg">
                <!-- Base Stations A and B -->
                <line x1="80" y1="130" x2="680" y2="130" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
                
                <!-- BS-A -->
                <g transform="translate(120, 130)">
                  <line x1="0" y1="0" x2="0" y2="-40" stroke="#00e5ff" stroke-width="2.5"/>
                  <circle cx="0" cy="-40" r="4" fill="#00e5ff"/>
                  <text x="-25" y="16" fill="#fff" font-size="10" font-family="monospace" font-weight="700">BASE STATION A</text>
                  <text x="-15" y="27" fill="#00e5ff" font-size="8" font-family="monospace">Cell A Center</text>
                </g>

                <!-- BS-B -->
                <g transform="translate(640, 130)">
                  <line x1="0" y1="0" x2="0" y2="-40" stroke="#00ff9d" stroke-width="2.5"/>
                  <circle cx="0" cy="-40" r="4" fill="#00ff9d"/>
                  <text x="-25" y="16" fill="#fff" font-size="10" font-family="monospace" font-weight="700">BASE STATION B</text>
                  <text x="-15" y="27" fill="#00ff9d" font-size="8" font-family="monospace">Cell B Center</text>
                </g>

                <!-- Moving Mobile Vehicle -->
                <g id="handoff-moving-vehicle" transform="translate(250, 120)">
                  ${drawIsometricVehicle(0, 0, 0.8, '#ffb703')}
                  <text x="-18" y="22" fill="#ffb703" font-size="8.5" font-family="monospace" font-weight="700">MS Mobile</text>
                </g>

                <!-- Active RF Radio Link Line -->
                <line id="mobile-serving-link" x1="250" y1="105" x2="120" y2="90" stroke="#00e5ff" stroke-width="2" stroke-dasharray="4 4"/>
              </svg>
            </div>

            <div class="calc-results-grid" style="margin-top: 12px;">
              <div class="res-card">
                <div class="res-title">SERVING BASE STATION</div>
                <div class="res-val" id="ch10-out-serving">CELL A (BS-A)</div>
                <div class="res-sub" id="ch10-out-handstate">CONNECTED: BS-A</div>
              </div>

              <div class="res-card highlight">
                <div class="res-title">RECEIVED SIGNAL LEVELS</div>
                <div class="res-val" id="ch10-out-rssi">RSSI BS-A: -68.4 dBm | BS-B: -92.1 dBm</div>
                <div class="res-sub">Path Loss: L = 69.55 + 26.16 log(f) - 13.82 log(h)</div>
              </div>

              <div class="res-card">
                <div class="res-title">PING-PONG FLAP COUNTER</div>
                <div class="res-val" id="ch10-out-flaps">0 Flaps</div>
                <div class="res-sub">Hysteresis margin eliminates unnecessary handoffs</div>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'sec-10.erlang':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.1.5 — TEXTBOOK PP. 278–282 & APPENDIX A</div>
          <h2 class="lesson-title">Traffic Engineering: Erlang B Multiserver Queue & Capacity Sizing</h2>
          <p class="lesson-text">
            Because subscriber traffic fluctuates randomly, sizing a cellular system to accommodate the peak possible load would be economically prohibitive. Cellular networks are engineered using <strong>Blocked Calls Cleared (Lost Calls Cleared, LCC)</strong> based on the <strong>Erlang B formula</strong>.
          </p>

          <div class="formula-box-large">
            P = \\frac{A^N / N!}{\\sum_{k=0}^{N} (A^k / k!)}   [Erlang B Equation 10.1]
          </div>
          <p class="lesson-text">
            Where <strong>A = λ · h</strong> is Traffic Intensity in Erlangs, <strong>λ</strong> is mean call arrival rate (calls/sec), <strong>h</strong> is mean call holding duration (seconds), <strong>N</strong> is total number of allocated traffic radio channels (trunks), and <strong>P</strong> is the call blocking probability (Grade of Service $GOS \\le 2\\%$).
          </p>

          <!-- Interactive Erlang B Sizing Workbench -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>WORKED TRAFFIC SIZING CALCULATOR & MULTISERVER QUEUE ENGINE (TABLE 10.3)</span>
              <span class="panel-tag">LIVE MULTISERVER QUEUE</span>
            </div>

            <div class="ch2-controls-grid">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>ALLOCATED CHANNELS PER CELL (N)</span>
                  <span id="erlang-val-n">25 Channels</span>
                </div>
                <input type="range" id="erlang-slider-n" min="1" max="50" value="25" class="control-slider"/>
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

            <!-- Visual Multiserver Trunk Bank Display (Stallings Figure 10.8) -->
            <div style="background: #020409; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-family: var(--font-mono); font-size: 0.75rem; color: #fff; font-weight: 700;">
                  CELL TRUNK MULTISERVER BANK (ACTIVE CALLS VS IDLE TRUNKS)
                </span>
                <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan);" id="erlang-trunks-summary">
                  Occupied: 16 / 25 Trunks
                </span>
              </div>
              <div class="server-trunks-grid" id="erlang-trunks-container">
                <!-- Dynamically generated channel trunk slots -->
              </div>
            </div>

            <!-- Dynamic Capacity Telemetry -->
            <div class="calc-results-grid" style="margin-top: 14px;">
              <div class="res-card">
                <div class="res-title">OFFERED TRAFFIC LOAD (A)</div>
                <div class="res-val" id="erlang-out-a">16.67 Erlangs</div>
                <div class="res-sub">A = (500 users · 1.2 calls/hr · 120s) / 3600s</div>
              </div>

              <div class="res-card highlight">
                <div class="res-title">BLOCKING PROBABILITY (P)</div>
                <div class="res-val" id="erlang-out-p">1.82%</div>
                <div class="res-sub" id="erlang-out-gos">Grade of Service: Excellent (≤ 2% Target)</div>
              </div>

              <div class="res-card">
                <div class="res-title">CARRIED TRAFFIC</div>
                <div class="res-val" id="erlang-out-carried">16.37 Erlangs</div>
                <div class="res-sub">A_carried = A · (1 - P)</div>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'sec-10.amps':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.2 — TEXTBOOK PP. 282–285</div>
          <h2 class="lesson-title">First-Generation Analog Cellular: AMPS Frequency Plan, Hardware & FM Modulation</h2>
          <p class="lesson-text">
            The Advanced Mobile Phone System (AMPS), deployed in 1983, was the standard 1G cellular network. It operates in two 25-MHz bands: <strong>824–849 MHz</strong> (mobile to base station, reverse/uplink) and <strong>869–894 MHz</strong> (base station to mobile, forward/downlink), separated by a fixed 45-MHz duplex spacing.
          </p>

          <!-- AMPS Parameters Table -->
          <div class="taxonomy-table-container">
            <table class="taxonomy-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>AMPS Specification (Table 10.4)</th>
                  <th>Engineering Note</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Base Station Tx Band</strong></td>
                  <td>869 to 894 MHz (25 MHz)</td>
                  <td>Divided between two competing operators (12.5 MHz each)</td>
                </tr>
                <tr>
                  <td><strong>Mobile Station Tx Band</strong></td>
                  <td>824 to 849 MHz (25 MHz)</td>
                  <td>Uplink from mobile units</td>
                </tr>
                <tr>
                  <td><strong>Duplex Spacing</strong></td>
                  <td>45 MHz</td>
                  <td>Separates forward and reverse links</td>
                </tr>
                <tr>
                  <td><strong>Channel Bandwidth</strong></td>
                  <td>30 kHz</td>
                  <td>416 channels per operator (21 control + 395 voice)</td>
                </tr>
                <tr>
                  <td><strong>Voice Modulation</strong></td>
                  <td>Analog FM (12 kHz peak deviation)</td>
                  <td>Clear analog speech</td>
                </tr>
                <tr>
                  <td><strong>Control Modulation</strong></td>
                  <td>Digital FSK (10 kbps, 8 kHz peak dev)</td>
                  <td>RCC / FCC control channel framing</td>
                </tr>
                <tr>
                  <td><strong>Error Control Coding</strong></td>
                  <td>BCH (48, 36, 5) & (40, 28, 5)</td>
                  <td>Words repeated 5 times for majority logic voting</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Playable Analog AMPS Voice & FM Modulation Laboratory -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>PLAYABLE 1G AMPS ANALOG VOICE & FM MODULATION LABORATORY</span>
              <span class="panel-tag">LIVE OSCILLOSCOPE SIMULATION</span>
            </div>

            <!-- Hardware Depiction: DynaTAC 1980s Brick Phone and Analog Base Station -->
            <div style="background: #020409; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; display: flex; gap: 20px; align-items: center; justify-content: space-around; flex-wrap: wrap;">
              <div style="text-align: center;">
                <svg width="100" height="130" viewBox="-40 -100 80 140">
                  ${drawVintageBrickPhone(0, 20, 1.0, '#ffb703')}
                </svg>
                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #fff; font-weight: 700;">Motorola DynaTAC 8000X</div>
                <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-dim);">3W Analog Tx (1983)</div>
              </div>

              <div style="text-align: center; max-width: 320px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); line-height: 1.5;">
                <div style="color: var(--accent-cyan); font-weight: 700; font-size: 0.82rem; margin-bottom: 4px;">CONTINUOUS 30 kHz DEDICATED CHANNEL</div>
                Unlike 2G TDMA which shares time slots, 1G AMPS dedicates a 30 kHz simplex carrier exclusively to one caller for the entire duration of the call. Peak frequency deviation is 12 kHz for voice speech.
              </div>

              <div style="text-align: center;">
                <svg width="120" height="130" viewBox="-50 -80 100 140">
                  ${drawIsometricBtsShelter(0, 30, 0.9, '#38bdf8')}
                </svg>
                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #fff; font-weight: 700;">AMPS Cell Base Station</div>
                <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-dim);">Analog Discriminator Rx</div>
              </div>
            </div>

            <!-- Real-Time Analog FM Oscilloscope Canvas -->
            <div class="oscilloscope-container" style="margin-top: 12px;">
              <div style="position: absolute; top: 8px; left: 12px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan); z-index: 5; background: rgba(3,7,18,0.85); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border-subtle);">
                📈 WAVEFORM OSCILLOSCOPE: <span style="color:#00e5ff;">Cyan: Baseband Voice m(t)</span> | <span style="color:#ffb703;">Gold: Modulated FM RF s(t)</span>
              </div>
              <canvas id="amps-wave-canvas" class="oscilloscope-canvas" width="800" height="200"></canvas>
            </div>

            <!-- Interactive Analog Signal Controls -->
            <div class="ch2-controls-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-top: 12px;">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>VOICE AUDIO FREQUENCY (fm)</span>
                  <span id="amps-val-fm" style="color: var(--accent-cyan); font-weight: 700;">1000 Hz</span>
                </div>
                <input type="range" id="amps-slider-fm" min="300" max="3000" step="100" value="1000" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>PEAK FM DEVIATION (Δf)</span>
                  <span id="amps-val-dev" style="color: #ffb703; font-weight: 700;">12 kHz (Max AMPS)</span>
                </div>
                <input type="range" id="amps-slider-dev" min="2" max="12" step="1" value="12" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>AMPS REVERSE VOICE CHANNEL</span>
                  <span id="amps-val-ch" style="color: #00ff9d; font-weight: 700;">Ch 1 (825.03 MHz)</span>
                </div>
                <select id="amps-select-ch" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="1" selected>Channel 1 — Uplink 825.03 MHz | Downlink 870.03 MHz</option>
                  <option value="2">Channel 2 — Uplink 825.06 MHz | Downlink 870.06 MHz</option>
                  <option value="10">Channel 10 — Uplink 825.30 MHz | Downlink 870.30 MHz</option>
                  <option value="100">Channel 100 — Uplink 828.00 MHz | Downlink 873.00 MHz</option>
                  <option value="333">Channel 333 — Uplink 834.99 MHz | Downlink 879.99 MHz</option>
                </select>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>AIR LINK NOISE / FADING</span>
                  <span id="amps-val-noise" style="color: var(--text-dim);">5% Low Noise</span>
                </div>
                <input type="range" id="amps-slider-noise" min="0" max="35" step="5" value="5" class="control-slider"/>
              </div>
            </div>

            <!-- Playback Button & Carson's Rule Telemetry -->
            <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px; flex-wrap: wrap; font-family: var(--font-mono); font-size: 0.75rem;">
              <button class="btn-ctrl active" id="btn-amps-play" style="padding: 6px 14px; color: var(--accent-cyan); border-color: var(--accent-cyan);">
                ⏸ PAUSE
              </button>
              <div style="color: var(--text-secondary); margin-left: auto;">
                Carson's Rule: <strong style="color:#fff;">BT = 2(Δf + fm) = <span id="amps-out-carson">26.0</span> kHz</strong> (Fits strictly within 30 kHz channel)
              </div>
            </div>
          </div>

          <!-- AMPS Reverse Control Channel (RCC) Frame Breakdown (Figure 10.10a) -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>AMPS RCC CONTROL FRAME STRUCTURE (FIGURE 10.10a) — 10 KBPS FSK</span>
              <span class="panel-tag">MAJORITY LOGIC (3 OF 5)</span>
            </div>

            <div style="background: #020409; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; overflow-x: auto;">
              <svg viewBox="0 0 760 120" style="width: 100%; height: 120px; min-width: 500px;">
                <rect x="20" y="30" width="160" height="45" fill="#0070f3" fill-opacity="0.3" stroke="#0070f3" stroke-width="1.5"/>
                <text x="50" y="52" fill="#fff" font-size="10" font-family="monospace" font-weight="700">PRECURSOR (48b)</text>
                <text x="30" y="65" fill="#38bdf8" font-size="8" font-family="monospace">Bit Sync(30) + Word(11) + DCC(7)</text>

                <rect x="180" y="30" width="180" height="45" fill="#00e5ff" fill-opacity="0.25" stroke="#00e5ff" stroke-width="1.5"/>
                <text x="210" y="52" fill="#fff" font-size="10" font-family="monospace" font-weight="700">WORD 1 (240b)</text>
                <text x="195" y="65" fill="#00e5ff" font-size="8" font-family="monospace">48b Word repeated 5x (BCH 48,36)</text>

                <rect x="360" y="30" width="180" height="45" fill="#00ff9d" fill-opacity="0.25" stroke="#00ff9d" stroke-width="1.5"/>
                <text x="390" y="52" fill="#fff" font-size="10" font-family="monospace" font-weight="700">WORD 2 (240b)</text>
                <text x="375" y="65" fill="#00ff9d" font-size="8" font-family="monospace">48b Word repeated 5x</text>

                <rect x="540" y="30" width="180" height="45" fill="#ffb703" fill-opacity="0.25" stroke="#ffb703" stroke-width="1.5"/>
                <text x="580" y="52" fill="#fff" font-size="10" font-family="monospace" font-weight="700">WORD n (1..6)</text>
                <text x="560" y="65" fill="#ffb703" font-size="8" font-family="monospace">Majority logic 3-of-5 voting</text>
              </svg>
            </div>
          </div>
        </div>
      `;

    case 'sec-10.gsm':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.3 — TEXTBOOK PP. 285–298</div>
          <h2 class="lesson-title">Second-Generation TDMA: GSM Architecture with Real Hardware & 8-Slot Frame Hierarchy</h2>
          <p class="lesson-text">
            The Global System for Mobile Communications (GSM) introduced digital traffic channels, robust encryption (A5 cipher), and time division multiple access (TDMA). Each 200 kHz carrier supports <strong>8 time slots per frame</strong>.
          </p>

          <!-- GSM Network Architecture Diagram with Real Hardware (Figure 10.13) -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>GSM NETWORK SUBSYSTEM (NS) & BASE STATION SUBSYSTEM (BSS) HARDWARE (FIGURE 10.13)</span>
              <span class="panel-tag">REAL ISOMETRIC HARDWARE</span>
            </div>

            <div style="background: #020409; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; overflow-x: auto;">
              <svg viewBox="0 0 880 200" style="width: 100%; height: 200px; min-width: 650px;">
                <!-- 1. MS (Mobile Station) -->
                <g transform="translate(60, 100)">
                  ${drawIsometricPhone(0, 0, 1.0, '#00e5ff')}
                  <text x="0" y="42" fill="#fff" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">MS (Handset)</text>
                  <text x="0" y="54" fill="#00e5ff" font-size="8" font-family="monospace" text-anchor="middle">ME + SIM Card</text>
                </g>

                <!-- Um Air Interface Line -->
                <line x1="110" y1="100" x2="200" y2="100" stroke="#00e5ff" stroke-width="2" stroke-dasharray="4 4"/>
                <text x="155" y="90" fill="#00e5ff" font-size="8.5" font-family="monospace" font-weight="700" text-anchor="middle">Um (Air)</text>
                <text x="155" y="115" fill="#64748b" font-size="7.5" font-family="monospace" text-anchor="middle">270.83 kbps</text>

                <!-- 2. BTS Base Transceiver Station -->
                <g transform="translate(260, 95)">
                  ${drawIsometricBaseStation(0, 0, 0.9, '#38bdf8')}
                  <text x="0" y="45" fill="#fff" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">BTS Tower</text>
                  <text x="0" y="57" fill="#38bdf8" font-size="8" font-family="monospace" text-anchor="middle">Transceiver Mast</text>
                </g>

                <!-- Abis Trunk Line -->
                <line x1="310" y1="100" x2="390" y2="100" stroke="#38bdf8" stroke-width="2.5"/>
                <text x="350" y="90" fill="#38bdf8" font-size="8.5" font-family="monospace" font-weight="700" text-anchor="middle">Abis</text>
                <text x="350" y="115" fill="#64748b" font-size="7.5" font-family="monospace" text-anchor="middle">E1 (2.048 Mbps)</text>

                <!-- 3. BSC Base Station Controller -->
                <g transform="translate(440, 115)">
                  ${drawIsometricBscCabinet(0, 0, 0.85, '#ffb703')}
                  <text x="0" y="35" fill="#fff" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">BSC Cabinet</text>
                  <text x="0" y="47" fill="#ffb703" font-size="8" font-family="monospace" text-anchor="middle">Radio Controller</text>
                </g>

                <!-- A Interface Line -->
                <line x1="490" y1="100" x2="570" y2="100" stroke="#ffb703" stroke-width="2.5"/>
                <text x="530" y="90" fill="#ffb703" font-size="8.5" font-family="monospace" font-weight="700" text-anchor="middle">A-Interface</text>
                <text x="530" y="115" fill="#64748b" font-size="7.5" font-family="monospace" text-anchor="middle">SS7 / 64 kbps</text>

                <!-- 4. MSC Mobile Switching Centre -->
                <g transform="translate(620, 105)">
                  ${drawIsometricServer(0, 0, 0.85, '#00ff9d')}
                  <text x="0" y="42" fill="#fff" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">MSC Switch</text>
                  <text x="0" y="54" fill="#00ff9d" font-size="8" font-family="monospace" text-anchor="middle">Switching Center</text>
                </g>

                <!-- 5. Network Subsystem Databases (HLR, VLR, AuC, EIR) -->
                <g transform="translate(730, 70)">
                  ${drawIsometricDatabase(0, 0, 0.65, '#00ff9d', 'HLR')}
                </g>
                <g transform="translate(810, 70)">
                  ${drawIsometricDatabase(0, 0, 0.65, '#00ff9d', 'VLR')}
                </g>
                <g transform="translate(730, 140)">
                  ${drawIsometricDatabase(0, 0, 0.65, '#ffb703', 'AuC')}
                </g>
                <g transform="translate(810, 140)">
                  ${drawIsometricDatabase(0, 0, 0.65, '#ff0055', 'EIR')}
                </g>
              </svg>
            </div>
          </div>

          <!-- Playable GSM 8-Slot TDMA & Timing Advance (TA) Simulation Laboratory -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>PLAYABLE GSM 8-SLOT TDMA FRAME STRUCTURE & TIMING ADVANCE (TA) SIMULATOR</span>
              <span class="panel-tag">TIME DIVISION MULTIPLEXING</span>
            </div>

            <p class="lesson-text" style="margin-bottom: 8px;">
              In GSM TDMA, eight subscriber calls share a single 200 kHz radio carrier by transmitting in non-overlapping <strong>577 µs time slots</strong>.
              Because radio waves travel at the speed of light ($c = 3 \times 10^5\text{ km/s}$), a distant mobile's burst suffers propagation delay ($\tau = d/c$).
              Without <strong>Timing Advance (TA)</strong>, distant transmissions arrive late and collide with neighboring slots!
            </p>

            <!-- Interactive TDMA Canvas Oscilloscope -->
            <div class="oscilloscope-container">
              <canvas id="gsm-tdma-canvas" class="oscilloscope-canvas" width="800" height="200"></canvas>
            </div>

            <!-- GSM 8-Slot TDMA Frame Strip -->
            <div class="gsm-tdma-slots-strip" id="gsm-slot-strip">
              <!-- Populated dynamically with Slots 0..7 -->
            </div>

            <!-- Controls Grid for Timing Advance & Distance -->
            <div class="ch2-controls-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-top: 12px;">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>MOBILE DISTANCE FROM TOWER (d)</span>
                  <span id="gsm-val-dist" style="color: var(--accent-cyan); font-weight: 700;">6.0 km</span>
                </div>
                <input type="range" id="gsm-slider-dist" min="0.5" max="30.0" step="0.5" value="6.0" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>TIMING ADVANCE (TA) STATUS</span>
                  <span id="gsm-val-ta" style="color: #00ff9d; font-weight: 700;">ENABLED (TA = 11)</span>
                </div>
                <button class="btn-ctrl active" id="btn-gsm-toggle-ta" style="width: 100%; margin-top: 4px; padding: 6px; font-size: 0.75rem;">
                  ✓ TIMING ADVANCE: ENABLED
                </button>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>SIMULATION SPEED</span>
                  <span id="gsm-val-spd">1.0× Normal</span>
                </div>
                <div style="display: flex; gap: 4px; margin-top: 4px;">
                  <button class="sim-speed-btn" data-gsmspd="0.25">0.25×</button>
                  <button class="sim-speed-btn" data-gsmspd="0.5">0.5×</button>
                  <button class="sim-speed-btn active" data-gsmspd="1.0">1.0×</button>
                  <button class="sim-speed-btn" data-gsmspd="2.0">2.0×</button>
                </div>
              </div>
            </div>

            <!-- Telemetry Row -->
            <div class="calc-results-grid" style="margin-top: 12px;">
              <div class="res-card">
                <div class="res-title">1-WAY PROPAGATION DELAY (τ = d/c)</div>
                <div class="res-val" id="gsm-out-delay">20.0 µs</div>
                <div class="res-sub">Round trip = 40.0 µs</div>
              </div>
              <div class="res-card highlight">
                <div class="res-title">TA COMPENSATION STEPS</div>
                <div class="res-val" id="gsm-out-steps">TA = 11 bit periods</div>
                <div class="res-sub">Each TA bit = 3.69 µs advance</div>
              </div>
              <div class="res-card">
                <div class="res-title">BURST ALIGNMENT AT BTS ANTENNA</div>
                <div class="res-val" id="gsm-out-status" style="color: #00ff9d;">✓ PERFECTLY SYNCHRONIZED</div>
                <div class="res-sub">No adjacent slot collision</div>
              </div>
            </div>
          </div>

          <!-- GSM 8-Slot TDMA Frame Hierarchy (Figure 10.14) -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>GSM TDMA TIME SLOT & NORMAL BURST BREAKDOWN (STALLINGS FIGURE 10.14)</span>
              <span class="panel-tag">156.25 BITS = 0.577 MS</span>
            </div>

            <div style="background: #020409; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; overflow-x: auto;">
              <svg viewBox="0 0 760 120" style="width: 100%; height: 120px; min-width: 500px;">
                <rect x="20" y="30" width="30" height="50" fill="#334155" stroke="#64748b" stroke-width="1"/>
                <text x="24" y="60" fill="#fff" font-size="7.5" font-family="monospace">3b TB</text>

                <rect x="50" y="30" width="220" height="50" fill="#0070f3" fill-opacity="0.3" stroke="#0070f3" stroke-width="1.5"/>
                <text x="80" y="55" fill="#fff" font-size="10" font-family="monospace" font-weight="700">57 ENCRYPTED BITS</text>
                <text x="110" y="68" fill="#38bdf8" font-size="8" font-family="monospace">Data Payload 1</text>

                <rect x="270" y="30" width="20" height="50" fill="#ff0055" fill-opacity="0.3" stroke="#ff0055" stroke-width="1"/>
                <text x="274" y="60" fill="#ff0055" font-size="8" font-family="monospace">1b</text>

                <rect x="290" y="30" width="160" height="50" fill="#ffb703" fill-opacity="0.3" stroke="#ffb703" stroke-width="1.5"/>
                <text x="315" y="55" fill="#fff" font-size="10" font-family="monospace" font-weight="700">26 TRAINING SEQ</text>
                <text x="310" y="68" fill="#ffb703" font-size="8" font-family="monospace">Multipath Equalization</text>

                <rect x="450" y="30" width="20" height="50" fill="#ff0055" fill-opacity="0.3" stroke="#ff0055" stroke-width="1"/>
                <text x="454" y="60" fill="#ff0055" font-size="8" font-family="monospace">1b</text>

                <rect x="470" y="30" width="220" height="50" fill="#0070f3" fill-opacity="0.3" stroke="#0070f3" stroke-width="1.5"/>
                <text x="500" y="55" fill="#fff" font-size="10" font-family="monospace" font-weight="700">57 ENCRYPTED BITS</text>
                <text x="530" y="68" fill="#38bdf8" font-size="8" font-family="monospace">Data Payload 2</text>

                <rect x="690" y="30" width="25" height="50" fill="#334155" stroke="#64748b" stroke-width="1"/>
                <text x="692" y="60" fill="#fff" font-size="7" font-family="monospace">3b TB</text>

                <rect x="715" y="30" width="30" height="50" fill="#1e293b" stroke="#475569" stroke-width="1"/>
                <text x="718" y="60" fill="#94a3b8" font-size="6.5" font-family="monospace">8.25b GP</text>
              </svg>
            </div>
          </div>
        </div>
      `;

    case 'sec-10.cdma':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.4 — TEXTBOOK PP. 298–304</div>
          <h2 class="lesson-title">Second-Generation CDMA: Walsh 64 Orthogonality, Soft Handoff, & RAKE Receiver</h2>
          <p class="lesson-text">
            In second-generation CDMA (IS-95), all users transmit simultaneously on the exact same 1.25 MHz channel. Multiple access is achieved mathematically using <strong>orthogonal 64-bit Walsh chipping codes</strong>.
          </p>

          <!-- Interactive Walsh Code Orthogonality & Chipping Engine -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>CDMA SPREAD SPECTRUM CHIPPING & CORRELATOR ENGINE (STALLINGS TABLE 7.1 & FIG 10.18)</span>
              <span class="panel-tag">1.2288 MCPS SPREAD CHIPS</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>DESIRED RECEIVER CORRELATION CODE</span>
                  <span id="walsh-user-lbl">W₂: (+1, -1, +1, -1)</span>
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
                  <span>ACTIVE CO-CHANNEL SUBSCRIBERS</span>
                  <span id="walsh-users-active">4 Active Users</span>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                  <label style="font-size: 0.8rem; color: #fff;"><input type="checkbox" id="chk-u1" checked/> U1 (W₁)</label>
                  <label style="font-size: 0.8rem; color: #fff;"><input type="checkbox" id="chk-u2" checked/> U2 (W₂)</label>
                  <label style="font-size: 0.8rem; color: #fff;"><input type="checkbox" id="chk-u3" checked/> U3 (W₃)</label>
                  <label style="font-size: 0.8rem; color: #fff;"><input type="checkbox" id="chk-u4" checked/> U4 (W₄)</label>
                </div>
              </div>
            </div>

            <!-- Composite Waveform & Correlator Output Display -->
            <div style="background: #020409; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; margin-top: 12px; overflow-x: auto;">
              <svg viewBox="0 0 720 160" style="width: 100%; height: 160px; min-width: 500px;" id="walsh-svg">
                <text x="20" y="24" fill="#64748b" font-size="10" font-family="monospace">COMPOSITE AIR SIGNAL (LINEAR SUM OVER AIR INTERFACE)</text>
                <path id="walsh-composite-wave" d="" fill="none" stroke="#ffb703" stroke-width="2.5"/>
                <line x1="20" y1="100" x2="700" y2="100" stroke="rgba(255,255,255,0.15)"/>
                <text x="20" y="118" fill="#00ff9d" font-size="10" font-family="monospace" id="walsh-correlator-text">
                  CORRELATOR OUTPUT (⟨Composite, W_k⟩): +4.0 → RECOVERED BIT = 1 (100% ORTHOGONAL)
                </text>
              </svg>
            </div>

            <!-- RAKE Receiver Principle (Figure 10.17) -->
            <div style="background: #070d1e; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; margin-top: 14px;">
              <div style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 6px;">
                RAKE RECEIVER ARCHITECTURE & MULTIPATH DIVERSITY (FIGURE 10.17)
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">
                In cellular environments, buildings reflect the transmitted signal, creating delayed multipath echoes ($\tau_1, \tau_2, \tau_3$). A RAKE receiver assigns independent correlator "fingers" to each delayed echo, despreads using the user's Walsh code, and combines them using maximal ratio combining to improve received signal strength by ~3 dB!
              </p>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-top: 10px;">
                <div class="res-card">
                  <div class="res-title">RAKE FINGER 1 (DIRECT PATH)</div>
                  <div class="res-val" style="color: #00e5ff;">Delay τ₁ = 0 µs</div>
                  <div class="res-sub">Weight α₁ = 1.0 (Dominant LOS)</div>
                </div>
                <div class="res-card">
                  <div class="res-title">RAKE FINGER 2 (BUILDING ECHO)</div>
                  <div class="res-val" style="color: #38bdf8;">Delay τ₂ = 1.63 µs (2 chips)</div>
                  <div class="res-sub">Weight α₂ = 0.65 (Reflected ray)</div>
                </div>
                <div class="res-card">
                  <div class="res-title">RAKE FINGER 3 (TERRAIN ECHO)</div>
                  <div class="res-val" style="color: #ffb703;">Delay τ₃ = 3.26 µs (4 chips)</div>
                  <div class="res-sub">Weight α₃ = 0.35 (Diffracted ray)</div>
                </div>
              </div>
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
          <div class="lesson-badge">SECTION 10.7 — TEXTBOOK PP. 314–316</div>
          <h2 class="lesson-title">William Stallings Chapter 10: Solved Quantitative Problems</h2>
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

            <div class="quiz-question-box" data-q="p10.7" style="margin-top: 14px;">
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

            <div class="quiz-question-box" data-q="p10.10" style="margin-top: 14px;">
              <div class="q-number">PROBLEM 10.10 (STALLINGS TEXTBOOK P. 316)</div>
              <div class="q-text">If 8 speech channels are supported on a single radio channel, and if no guard band is assumed in the 25 MHz band, what is the maximum number of simultaneous users that can be accommodated in GSM (125 radio carriers)?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="false">A. 395 users</button>
                <button class="q-opt" data-correct="true">B. 1000 users — 125 carriers × 8 time slots/carrier = 1000 simultaneous users</button>
                <button class="q-opt" data-correct="false">C. 2000 users</button>
                <button class="q-opt" data-correct="false">D. 832 users</button>
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

function attachSubEvents(container, secId, progressManager) {
  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10.1: FLAGSHIP 2-WAY CELLULAR SIMULATOR WITH AUTO-CAMERA & TOWER LIMIT
  // ─────────────────────────────────────────────────────────────────────────────
  if (secId === 'sec-10.sim') {
    const isoSvg = container.querySelector('#iso-cellular-svg');
    const canvasBox = container.querySelector('#canvas-container-box');
    const btnPlay = container.querySelector('#btn-iso-play');
    const btnStep = container.querySelector('#btn-iso-step');
    const btnReset = container.querySelector('#btn-iso-reset');
    const btnAutoCam = container.querySelector('#btn-toggle-autocam');
    const btnMax = container.querySelector('#btn-maximize-canvas');
    const btnMaxText = container.querySelector('#btn-max-text');
    const btnFloatMin = container.querySelector('#btn-floating-minimize');

    // In-App Stage Height Sizing Buttons
    const btnSizeCompact = container.querySelector('#btn-size-compact');
    const btnSizeStandard = container.querySelector('#btn-size-standard');
    const btnSizeCinema = container.querySelector('#btn-size-cinema');

    const autoCamText = container.querySelector('#autocam-status-text');
    const camStatus = container.querySelector('#cam-mode-status');
    const camIcon = container.querySelector('#cam-lens-icon');

    // Camera preset buttons
    const btnCamWide = container.querySelector('#btn-cam-wide');
    const btnCamClient = container.querySelector('#btn-cam-client');
    const btnCamAir = container.querySelector('#btn-cam-air');
    const btnCamTower = container.querySelector('#btn-cam-tower');
    const btnCamBsc = container.querySelector('#btn-cam-bsc');
    const btnCamCore = container.querySelector('#btn-cam-core');
    const btnCamServer = container.querySelector('#btn-cam-server');

    // Multi-access buttons
    const btnTopFdma = container.querySelector('#btn-top-fdma');
    const btnTopTdma = container.querySelector('#btn-top-tdma');
    const btnTopCdma = container.querySelector('#btn-top-cdma');
    const modeTag = container.querySelector('#iso-active-mode-tag');

    // Frequency Controls Tray
    const selBand = container.querySelector('#sim-select-band');
    const inUplink = container.querySelector('#sim-input-uplink');
    const inDuplex = container.querySelector('#sim-input-duplex');
    const dispDownlink = container.querySelector('#sim-disp-downlink');
    const inCh = container.querySelector('#sim-input-ch');

    // Multi-device load buttons
    const btnDev1 = container.querySelector('#btn-dev-1');
    const btnDev4 = container.querySelector('#btn-dev-4');
    const btnDev8 = container.querySelector('#btn-dev-8');
    const btnDev12 = container.querySelector('#btn-dev-12');

    // HUD & Telemetry elements
    const hudStatus = container.querySelector('#iso-hud-status');
    const hudPhy = container.querySelector('#iso-hud-phy');
    const stepInd = container.querySelector('#iso-step-indicator');
    const stepDetail = container.querySelector('#iso-step-detail');
    const stepNum = container.querySelector('#iso-step-num');
    const stepDirection = container.querySelector('#iso-step-direction');
    const stepTitle = container.querySelector('#iso-step-title');
    const stepDesc = container.querySelector('#iso-step-desc');
    const stepMeta = container.querySelector('#iso-step-meta');

    // Tower Capacity elements
    const towerUtilText = container.querySelector('#tower-util-text');
    const towerMeterFill = container.querySelector('#tower-meter-fill');
    const towerTypeLabel = container.querySelector('#tower-channel-type-label');
    const towerGrid = container.querySelector('#tower-channels-grid');
    const towerBlockNotice = container.querySelector('#tower-blocking-notice');

    // Dynamic Multi-Devices group
    const multiDevicesGroup = container.querySelector('#iso-multi-devices');
    const ms1LabelSub = container.querySelector('#ms1-label-sub');

    // Speed buttons
    const speedBtns = container.querySelectorAll('.sim-speed-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ch10State.simSpeedMultiplier = Number(btn.getAttribute('data-spd'));
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // IN-APP STAGE SIZING (COMPACT 380px, STANDARD 520px, CINEMA 700px, MAX 780px)
    // ─────────────────────────────────────────────────────────────────────────
    const setStageSize = (size) => {
      if (!canvasBox) return;
      canvasBox.classList.remove('size-compact', 'size-standard', 'size-cinema', 'is-maximized');
      [btnSizeCompact, btnSizeStandard, btnSizeCinema, btnMax].forEach(b => b && b.classList.remove('active'));

      if (size === 'compact') {
        canvasBox.classList.add('size-compact');
        if (btnSizeCompact) btnSizeCompact.classList.add('active');
        if (btnFloatMin) btnFloatMin.style.display = 'none';
        if (btnMaxText) btnMaxText.textContent = 'MAXIMIZE STAGE';
      } else if (size === 'cinema') {
        canvasBox.classList.add('size-cinema');
        if (btnSizeCinema) btnSizeCinema.classList.add('active');
        if (btnFloatMin) btnFloatMin.style.display = 'block';
        if (btnMaxText) btnMaxText.textContent = 'MAXIMIZE STAGE';
      } else if (size === 'maximized') {
        canvasBox.classList.add('is-maximized');
        if (btnMax) btnMax.classList.add('active');
        if (btnFloatMin) btnFloatMin.style.display = 'block';
        if (btnMaxText) btnMaxText.textContent = 'RESTORE STAGE';
      } else {
        // standard (default 520px)
        canvasBox.classList.add('size-standard');
        if (btnSizeStandard) btnSizeStandard.classList.add('active');
        if (btnFloatMin) btnFloatMin.style.display = 'none';
        if (btnMaxText) btnMaxText.textContent = 'MAXIMIZE STAGE';
      }
    };

    if (btnSizeCompact) btnSizeCompact.addEventListener('click', () => setStageSize('compact'));
    if (btnSizeStandard) btnSizeStandard.addEventListener('click', () => setStageSize('standard'));
    if (btnSizeCinema) btnSizeCinema.addEventListener('click', () => setStageSize('cinema'));
    if (btnMax) {
      btnMax.addEventListener('click', () => {
        if (canvasBox.classList.contains('is-maximized')) {
          setStageSize('standard');
        } else {
          setStageSize('maximized');
        }
      });
    }
    if (btnFloatMin) {
      btnFloatMin.addEventListener('click', () => setStageSize('standard'));
    }

    const onKeyEsc = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (canvasBox && (canvasBox.classList.contains('is-maximized') || canvasBox.classList.contains('size-cinema'))) {
          setStageSize('standard');
        }
      }
    };
    window.addEventListener('keydown', onKeyEsc);

    // ─────────────────────────────────────────────────────────────────────────
    // WIDESCREEN CAMERA VIEWBOX TARGETS (1600 x 480 COORDINATE SYSTEM)
    // ─────────────────────────────────────────────────────────────────────────
    const cameraTargets = {
      overview: { vx: 0, vy: 0, vw: 1600, vh: 480, label: 'OVERVIEW (1.0×)', icon: '🌐' },
      client: { vx: 40, vy: 80, vw: 480, vh: 360, label: 'CLIENT SUBSCRIBERS (3.3×)', icon: '💻' },
      air: { vx: 300, vy: 60, vw: 560, vh: 360, label: 'AIR PROPAGATION (2.8×)', icon: '📡' },
      tower: { vx: 620, vy: 80, vw: 480, vh: 360, label: 'BASE STATION TOWER (3.3×)', icon: '🗼' },
      bsc: { vx: 860, vy: 80, vw: 440, vh: 360, label: 'BSC CONTROLLER (3.6×)', icon: '🎛️' },
      core: { vx: 1060, vy: 80, vw: 460, vh: 360, label: 'MTSO CORE & HLR/VLR (3.5×)', icon: '☁️' },
      server: { vx: 1280, vy: 80, vw: 360, vh: 360, label: 'WEB HOST 8.8.8.8 (4.4×)', icon: '🖥️' }
    };

    let curVx = 0, curVy = 0, curVw = 1600, curVh = 480;
    const applyViewBox = (target) => {
      if (!isoSvg) return;
      curVx = target.vx;
      curVy = target.vy;
      curVw = target.vw;
      curVh = target.vh;
      isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
      if (camStatus) camStatus.textContent = target.label;
      if (camIcon) camIcon.textContent = target.icon;
    };

    const setManualCamera = (preset) => {
      ch10State.autoCamera = false;
      ch10State.cameraPreset = preset;
      if (autoCamText) {
        autoCamText.textContent = 'OFF';
        autoCamText.style.color = 'var(--text-dim)';
      }
      if (btnAutoCam) btnAutoCam.classList.remove('active');
      [btnCamWide, btnCamClient, btnCamAir, btnCamTower, btnCamBsc, btnCamCore, btnCamServer].forEach(b => b && b.classList.remove('active'));
      const target = cameraTargets[preset] || cameraTargets.overview;
      applyViewBox(target);
    };

    if (btnCamWide) btnCamWide.addEventListener('click', () => { setManualCamera('overview'); btnCamWide.classList.add('active'); });
    if (btnCamClient) btnCamClient.addEventListener('click', () => { setManualCamera('client'); btnCamClient.classList.add('active'); });
    if (btnCamAir) btnCamAir.addEventListener('click', () => { setManualCamera('air'); btnCamAir.classList.add('active'); });
    if (btnCamTower) btnCamTower.addEventListener('click', () => { setManualCamera('tower'); btnCamTower.classList.add('active'); });
    if (btnCamBsc) btnCamBsc.addEventListener('click', () => { setManualCamera('bsc'); btnCamBsc.classList.add('active'); });
    if (btnCamCore) btnCamCore.addEventListener('click', () => { setManualCamera('core'); btnCamCore.classList.add('active'); });
    if (btnCamServer) btnCamServer.addEventListener('click', () => { setManualCamera('server'); btnCamServer.classList.add('active'); });

    if (btnAutoCam) {
      btnAutoCam.addEventListener('click', () => {
        ch10State.autoCamera = !ch10State.autoCamera;
        if (autoCamText) {
          autoCamText.textContent = ch10State.autoCamera ? 'ON' : 'OFF';
          autoCamText.style.color = ch10State.autoCamera ? 'var(--status-ready)' : 'var(--text-dim)';
        }
        btnAutoCam.classList.toggle('active', ch10State.autoCamera);
        if (!ch10State.autoCamera) {
          applyViewBox(cameraTargets.overview);
        }
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOUSE DRAG / PAN & WHEEL ZOOM (USER FREEDOM ACROSS 1600 x 480 SPAN)
    // ─────────────────────────────────────────────────────────────────────────
    let isPanningViewport = false;
    let panStartX = 0, panStartY = 0;
    let panStartVx = 0, panStartVy = 0;

    if (canvasBox && isoSvg) {
      canvasBox.addEventListener('mousedown', (e) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
        isPanningViewport = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panStartVx = curVx;
        panStartVy = curVy;
        canvasBox.style.cursor = 'grabbing';

        if (ch10State.autoCamera) {
          ch10State.autoCamera = false;
          if (autoCamText) {
            autoCamText.textContent = 'OFF';
            autoCamText.style.color = 'var(--text-dim)';
          }
          if (btnAutoCam) btnAutoCam.classList.remove('active');
        }
        if (camStatus) camStatus.textContent = 'MANUAL DRAG';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isPanningViewport || !isoSvg) return;
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        const boxRect = canvasBox.getBoundingClientRect();
        const scaleX = curVw / (boxRect.width || 1600);
        const scaleY = curVh / (boxRect.height || 480);
        curVx = panStartVx - dx * scaleX;
        curVy = panStartVy - dy * scaleY;
        isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
      });

      window.addEventListener('mouseup', () => {
        if (isPanningViewport) {
          isPanningViewport = false;
          canvasBox.style.cursor = 'grab';
        }
      });

      canvasBox.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (ch10State.autoCamera) {
          ch10State.autoCamera = false;
          if (autoCamText) {
            autoCamText.textContent = 'OFF';
            autoCamText.style.color = 'var(--text-dim)';
          }
          if (btnAutoCam) btnAutoCam.classList.remove('active');
        }
        const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
        const newVw = Math.max(260, Math.min(2200, curVw * zoomFactor));
        const newVh = Math.max(90, Math.min(750, curVh * zoomFactor));
        curVx += (curVw - newVw) / 2;
        curVy += (curVh - newVh) / 2;
        curVw = newVw;
        curVh = newVh;
        isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
        if (camStatus) camStatus.textContent = `ZOOM (${(1600 / curVw).toFixed(1)}×)`;
      }, { passive: false });
    }

    const btnSimZin = container.querySelector('#btn-sim-zin');
    const btnSimZout = container.querySelector('#btn-sim-zout');
    const btnSimResetView = container.querySelector('#btn-sim-reset-view');

    if (btnSimZin) {
      btnSimZin.addEventListener('click', () => {
        ch10State.autoCamera = false;
        if (autoCamText) { autoCamText.textContent = 'OFF'; autoCamText.style.color = 'var(--text-dim)'; }
        if (btnAutoCam) btnAutoCam.classList.remove('active');
        const newVw = Math.max(260, curVw * 0.8);
        const newVh = Math.max(90, curVh * 0.8);
        curVx += (curVw - newVw) / 2;
        curVy += (curVh - newVh) / 2;
        curVw = newVw;
        curVh = newVh;
        isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
        if (camStatus) camStatus.textContent = `ZOOM (${(1600 / curVw).toFixed(1)}×)`;
      });
    }

    if (btnSimZout) {
      btnSimZout.addEventListener('click', () => {
        ch10State.autoCamera = false;
        if (autoCamText) { autoCamText.textContent = 'OFF'; autoCamText.style.color = 'var(--text-dim)'; }
        if (btnAutoCam) btnAutoCam.classList.remove('active');
        const newVw = Math.min(2200, curVw * 1.25);
        const newVh = Math.min(750, curVh * 1.25);
        curVx += (curVw - newVw) / 2;
        curVy += (curVh - newVh) / 2;
        curVw = newVw;
        curVh = newVh;
        isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
        if (camStatus) camStatus.textContent = `ZOOM (${(1600 / curVw).toFixed(1)}×)`;
      });
    }

    if (btnSimResetView) {
      btnSimResetView.addEventListener('click', () => {
        setManualCamera('overview');
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OFFICIAL REAL-LIFE CELLULAR FREQUENCY CALCULATOR & BAND SELECTOR
    // ─────────────────────────────────────────────────────────────────────────
    const updateFrequencyParams = () => {
      const fUl = parseFloat(inUplink ? inUplink.value : 825.03) || 825.03;
      const duplex = parseFloat(inDuplex ? inDuplex.value : 45.0) || 45.0;
      const fDl = fUl + duplex;
      if (dispDownlink) dispDownlink.textContent = `${fDl.toFixed(2)} MHz`;

      // Free space wavelength lambda = c / f = 300 / f_MHz (in meters -> cm)
      const lambdaCm = (300 / fUl) * 100;

      // Hata urban path loss calculation for d = 2.4 km, hb = 35m, hm = 1.5m
      const a_hm = (1.1 * Math.log10(fUl) - 0.7) * 1.5 - (1.56 * Math.log10(fUl) - 0.8);
      const hataLoss = 69.55 + 26.16 * Math.log10(fUl) - 13.82 * Math.log10(35) - a_hm + (44.9 - 6.55 * Math.log10(35)) * Math.log10(2.4);

      const airCarrierTxt = container.querySelector('#iso-air-carrier-txt');
      const airLossTxt = container.querySelector('#iso-air-loss-txt');
      if (airCarrierTxt) {
        airCarrierTxt.textContent = `fc: ${fUl.toFixed(2)} MHz | λ: ${lambdaCm.toFixed(1)}cm | DL: ${fDl.toFixed(2)} MHz`;
      }
      if (airLossTxt) {
        airLossTxt.textContent = `Hata Loss: -${hataLoss.toFixed(1)} dB | d: 2.4km | Δf: +${duplex.toFixed(0)} MHz`;
      }

      if (hudPhy) {
        const mode = ch10State.accessMode.toUpperCase();
        hudPhy.textContent = `[${mode}] UPLINK: ${fUl.toFixed(2)} MHz | DOWNLINK: ${fDl.toFixed(2)} MHz | DUPLEX: +${duplex.toFixed(0)} MHz | λ: ${lambdaCm.toFixed(1)} cm | LOSS: -${hataLoss.toFixed(1)} dB`;
      }
    };

    if (selBand) {
      selBand.addEventListener('change', () => {
        const val = selBand.value;
        if (val === 'amps850') {
          if (inUplink) inUplink.value = '825.03';
          if (inDuplex) inDuplex.value = '45.0';
          if (inCh) inCh.value = '1';
          setAccessMode('fdma');
        } else if (val === 'gsm900') {
          if (inUplink) inUplink.value = '890.20';
          if (inDuplex) inDuplex.value = '45.0';
          if (inCh) inCh.value = '1';
          setAccessMode('tdma');
        } else if (val === 'gsm1800') {
          if (inUplink) inUplink.value = '1710.20';
          if (inDuplex) inDuplex.value = '95.0';
          if (inCh) inCh.value = '512';
          setAccessMode('tdma');
        } else if (val === 'cdma800') {
          if (inUplink) inUplink.value = '824.70';
          if (inDuplex) inDuplex.value = '45.0';
          if (inCh) inCh.value = '283';
          setAccessMode('cdma');
        }
        updateFrequencyParams();
      });
    }

    [inUplink, inDuplex, inCh].forEach(inp => {
      if (inp) {
        inp.addEventListener('input', () => {
          if (selBand) selBand.value = 'custom';
          updateFrequencyParams();
        });
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER TOWER CAPACITY & CHANNELS
    // ─────────────────────────────────────────────────────────────────────────
    const updateTowerCapacityDisplay = () => {
      if (!towerGrid || !towerMeterFill || !towerUtilText) return;
      const count = ch10State.activeDevicesCount;
      const mode = ch10State.accessMode;
      const maxChannels = 8;
      const isBlocked = count > maxChannels;

      let pct = Math.min(100, (count / maxChannels) * 100);
      towerMeterFill.style.width = `${pct}%`;

      if (isBlocked) {
        towerMeterFill.style.background = '#ff0055';
        towerUtilText.style.color = '#ff0055';
        towerUtilText.textContent = `${count} / ${maxChannels} CHANNELS (${((count/maxChannels)*100).toFixed(0)}% OVERLOAD)`;
        if (towerBlockNotice) towerBlockNotice.style.display = 'block';
      } else {
        towerMeterFill.style.background = count === maxChannels ? '#ffb703' : 'var(--accent-cyan)';
        towerUtilText.style.color = count === maxChannels ? '#ffb703' : 'var(--accent-cyan)';
        towerUtilText.textContent = `${count} / ${maxChannels} CHANNELS (${pct.toFixed(0)}%)`;
        if (towerBlockNotice) towerBlockNotice.style.display = 'none';
      }

      let chipsHtml = '';
      if (mode === 'fdma') {
        if (towerTypeLabel) towerTypeLabel.textContent = '30 kHz FDMA CARRIERS (AMPS):';
        for (let i = 1; i <= 8; i++) {
          const inUse = i <= count;
          chipsHtml += `<span class="channel-chip ${inUse ? 'in-use' : 'free'}">f${i} (${(825.0 + i*0.03).toFixed(2)} MHz)</span>`;
        }
        if (count > 8) {
          for (let i = 9; i <= count; i++) {
            chipsHtml += `<span class="channel-chip blocked">f${i} (BLOCKED!)</span>`;
          }
        }
      } else if (mode === 'tdma') {
        if (towerTypeLabel) towerTypeLabel.textContent = 'GSM 8-SLOT TDMA FRAME (200 kHz):';
        for (let i = 0; i < 8; i++) {
          const inUse = i < count;
          chipsHtml += `<span class="channel-chip ${inUse ? 'in-use' : 'free'}">Slot ${i} (${(i*0.577).toFixed(1)}ms)</span>`;
        }
        if (count > 8) {
          for (let i = 8; i < count; i++) {
            chipsHtml += `<span class="channel-chip blocked">User ${i+1} (QUEUED!)</span>`;
          }
        }
      } else {
        if (towerTypeLabel) towerTypeLabel.textContent = 'CDMA WALSH 64 ORTHOGONAL CODES:';
        for (let i = 1; i <= Math.min(count, 8); i++) {
          chipsHtml += `<span class="channel-chip in-use">W_${i} (Active)</span>`;
        }
        for (let i = count + 1; i <= 8; i++) {
          chipsHtml += `<span class="channel-chip free">W_${i} (Free)</span>`;
        }
        if (count > 8) {
          for (let i = 9; i <= count; i++) {
            chipsHtml += `<span class="channel-chip blocked">W_${i} (+${(i-8)*1.5}dB Noise)</span>`;
          }
        }
      }
      towerGrid.innerHTML = chipsHtml;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER MULTI-DEVICES WITH GENEROUS SPATIAL SEPARATION (1600 x 480 CANVAS)
    // ─────────────────────────────────────────────────────────────────────────
    const updateMultiDevicesGraphic = () => {
      if (!multiDevicesGroup) return;
      const count = ch10State.activeDevicesCount;
      let svg = '';

      if (count >= 4) {
        // Device 2: Smartphone MS-2 (Clean vertical placement at x=80, y=150)
        svg += `
          <g id="iso-client-dev2">
            ${drawIsometricPhone(80, 150, 0.75, '#38bdf8')}
            <text x="50" y="180" fill="#fff" font-size="9" font-family="monospace" font-weight="700">MS-2 (Phone)</text>
            <text x="50" y="192" fill="#38bdf8" font-size="8" font-family="monospace">Voice Carrier 2</text>
          </g>
        `;
        // Device 3: Laptop MS-3 (Clean upper placement at x=270, y=140)
        svg += `
          <g id="iso-client-dev3">
            ${drawIsometricLaptop(270, 140, 0.75, '#00ff9d')}
            <text x="245" y="175" fill="#fff" font-size="9" font-family="monospace" font-weight="700">MS-3 (Laptop)</text>
            <text x="245" y="187" fill="#00ff9d" font-size="8" font-family="monospace">IP Web Session</text>
          </g>
        `;
        // Device 4: Vehicular Terminal MS-4 (Bottom placement at x=240, y=390)
        svg += `
          <g id="iso-client-dev4">
            ${drawIsometricVehicle(240, 390, 0.85, '#ffb703')}
            <text x="210" y="430" fill="#fff" font-size="9" font-family="monospace" font-weight="700">MS-4 (Vehicular)</text>
            <text x="210" y="442" fill="#ffb703" font-size="8" font-family="monospace">Doppler v = 60 km/h</text>
          </g>
        `;
      }

      if (count >= 8) {
        svg += `
          <g id="iso-client-dev5">
            ${drawIsometricPhone(50, 230, 0.65, '#818cf8')}
            <text x="35" y="255" fill="#818cf8" font-size="8" font-family="monospace">MS-5</text>
          </g>
          <g id="iso-client-dev6">
            ${drawIsometricPhone(170, 110, 0.65, '#a855f7')}
            <text x="155" y="135" fill="#a855f7" font-size="8" font-family="monospace">MS-6</text>
          </g>
          <g id="iso-client-dev7">
            ${drawIsometricPhone(310, 220, 0.65, '#f43f5e')}
            <text x="295" y="245" fill="#f43f5e" font-size="8" font-family="monospace">MS-7</text>
          </g>
          <g id="iso-client-dev8">
            ${drawIsometricLaptop(130, 410, 0.65, '#38bdf8')}
            <text x="115" y="440" fill="#38bdf8" font-size="8" font-family="monospace">MS-8</text>
          </g>
        `;
      }

      if (count >= 12) {
        svg += `
          <g id="iso-client-overload">
            <g transform="translate(40, 370)">
              <circle cx="0" cy="0" r="16" fill="rgba(255,0,85,0.2)" stroke="#ff0055" stroke-width="1.8" stroke-dasharray="3 3"/>
              ${drawIsometricPhone(0, 0, 0.65, '#ff0055')}
              <text x="-25" y="25" fill="#ff0055" font-size="8.5" font-family="monospace" font-weight="700">MS-9 (BLOCKED)</text>
            </g>
            <g transform="translate(310, 320)">
              <circle cx="0" cy="0" r="16" fill="rgba(255,0,85,0.2)" stroke="#ff0055" stroke-width="1.8" stroke-dasharray="3 3"/>
              ${drawIsometricPhone(0, 0, 0.65, '#ff0055')}
              <text x="-28" y="25" fill="#ff0055" font-size="8.5" font-family="monospace" font-weight="700">MS-10 (BLOCKED)</text>
            </g>
            <g transform="translate(220, 70)">
              <circle cx="0" cy="0" r="16" fill="rgba(255,0,85,0.2)" stroke="#ff0055" stroke-width="1.8" stroke-dasharray="3 3"/>
              ${drawIsometricPhone(0, 0, 0.65, '#ff0055')}
              <text x="-28" y="25" fill="#ff0055" font-size="8.5" font-family="monospace" font-weight="700">MS-11 (BLOCKED)</text>
            </g>
            <g transform="translate(70, 80)">
              <circle cx="0" cy="0" r="16" fill="rgba(255,0,85,0.2)" stroke="#ff0055" stroke-width="1.8" stroke-dasharray="3 3"/>
              ${drawIsometricVehicle(0, 0, 0.65, '#ff0055')}
              <text x="-28" y="28" fill="#ff0055" font-size="8.5" font-family="monospace" font-weight="700">MS-12 (BLOCKED)</text>
            </g>
          </g>
        `;
      }

      multiDevicesGroup.innerHTML = svg;
    };

    const setDeviceCount = (num) => {
      ch10State.activeDevicesCount = num;
      [btnDev1, btnDev4, btnDev8, btnDev12].forEach(b => b && b.classList.remove('active'));
      if (num === 1) btnDev1 && btnDev1.classList.add('active');
      else if (num === 4) btnDev4 && btnDev4.classList.add('active');
      else if (num === 8) btnDev8 && btnDev8.classList.add('active');
      else btnDev12 && btnDev12.classList.add('active');

      updateMultiDevicesGraphic();
      updateTowerCapacityDisplay();
    };

    if (btnDev1) btnDev1.addEventListener('click', () => setDeviceCount(1));
    if (btnDev4) btnDev4.addEventListener('click', () => setDeviceCount(4));
    if (btnDev8) btnDev8.addEventListener('click', () => setDeviceCount(8));
    if (btnDev12) btnDev12.addEventListener('click', () => setDeviceCount(12));

    const setAccessMode = (mode) => {
      ch10State.accessMode = mode;
      [btnTopFdma, btnTopTdma, btnTopCdma].forEach(b => b && b.classList.remove('active'));

      const emWave = container.querySelector('#iso-em-carrier-wave');

      if (mode === 'fdma') {
        btnTopFdma && btnTopFdma.classList.add('active');
        if (modeTag) modeTag.textContent = '1G FDMA (AMPS ANALOG)';
        if (ms1LabelSub) ms1LabelSub.textContent = 'Tx: 825.03 MHz (Ch 1 FM)';
        if (emWave) emWave.setAttribute('stroke', 'url(#rf-wave-grad-fdma)');
      } else if (mode === 'tdma') {
        btnTopTdma && btnTopTdma.classList.add('active');
        if (modeTag) modeTag.textContent = '2G TDMA (GSM DIGITAL)';
        if (ms1LabelSub) ms1LabelSub.textContent = 'Tx: Slot 3/8 (GMSK Burst)';
        if (emWave) emWave.setAttribute('stroke', 'url(#rf-wave-grad-tdma)');
      } else {
        btnTopCdma && btnTopCdma.classList.add('active');
        if (modeTag) modeTag.textContent = '2G/3G CDMA (IS-95 SPREAD SPECTRUM)';
        if (ms1LabelSub) ms1LabelSub.textContent = 'Tx: Walsh W_64 (1.2288 Mcps)';
        if (emWave) emWave.setAttribute('stroke', 'url(#rf-wave-grad-cdma)');
      }

      const tdmaClockOverlay = container.querySelector('#sim-tdma-clock-overlay');
      if (tdmaClockOverlay) {
        tdmaClockOverlay.style.display = (mode === 'tdma') ? 'block' : 'none';
      }

      updateFrequencyParams();
      updateTowerCapacityDisplay();
    };

    if (btnTopFdma) btnTopFdma.addEventListener('click', () => {
      if (selBand) selBand.value = 'amps850';
      if (inUplink) inUplink.value = '825.03';
      if (inDuplex) inDuplex.value = '45.0';
      if (inCh) inCh.value = '1';
      setAccessMode('fdma');
    });
    if (btnTopTdma) btnTopTdma.addEventListener('click', () => {
      if (selBand) selBand.value = 'gsm900';
      if (inUplink) inUplink.value = '890.20';
      if (inDuplex) inDuplex.value = '45.0';
      if (inCh) inCh.value = '1';
      setAccessMode('tdma');
    });
    if (btnTopCdma) btnTopCdma.addEventListener('click', () => {
      if (selBand) selBand.value = 'cdma800';
      if (inUplink) inUplink.value = '824.70';
      if (inDuplex) inDuplex.value = '45.0';
      if (inCh) inCh.value = '283';
      setAccessMode('cdma');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // COMPLETE 10-STAGE 2-WAY ROUND TRIP PROCEDURE SPECIFICATION (STALLINGS CH 10)
    // ─────────────────────────────────────────────────────────────────────────
    const stepProcedures10 = {
      fdma: [
        {
          num: 'STAGE 1 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '1. MS-1 ACOUSTIC SAMPLING & COMPANDOR',
          desc: 'The Mobile Subscriber (MS-1) microphone captures voice. Audio is band-filtered (300–3400 Hz) and processed by a syllabus compandor (compressor/expander) to suppress noise and avoid overmodulation.',
          meta: [{ k: 'TRANSMITTER', v: 'MS-1 Handset' }, { k: 'AUDIO BANDWIDTH', v: '300 Hz – 3.4 kHz' }, { k: 'PRE-EMPHASIS', v: '+6 dB/octave high-boost' }, { k: 'PEAK DEVIATION', v: 'Δf = ±12 kHz FM' }]
        },
        {
          num: 'STAGE 2 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '2. 30 kHz SIMPLEX CARRIER FM MODULATION',
          desc: 'Voice audio frequency-modulates the dedicated reverse channel carrier (825.03 MHz, Channel 1). Total Carson bandwidth is B_T = 2(Δf + f_m) = 30 kHz.',
          meta: [{ k: 'CARRIER FREQ', v: '825.03 MHz (Ch 1 Reverse)' }, { k: 'CARSON BANDWIDTH', v: '30 kHz RF Channel' }, { k: 'WAVELENGTH λ', v: '36.34 cm' }, { k: 'MODULATION INDEX', v: 'β ≈ 2.8' }]
        },
        {
          num: 'STAGE 3 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '3. RF POWER AMPLIFICATION & AIR RADIATION',
          desc: 'Power class 3 amplifier boosts RF signal to +28 dBm (600 mW). The antenna radiates an electromagnetic wave across the cellular coverage sector toward Tower BS-A.',
          meta: [{ k: 'TX POWER', v: '+28 dBm (600 mW)' }, { k: 'ANTENNA TYPE', v: 'Quarter-wave whip (λ/4)' }, { k: 'EIRP', v: '+30.15 dBm' }, { k: 'POWER CONTROL', v: '8 steps (4 dB steps via MTSO)' }]
        },
        {
          num: 'STAGE 4 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '4. AIR PROPAGATION & HATA URBAN PATH LOSS',
          desc: 'EM wave traverses 2.4 km of urban terrain, experiencing free-space spreading and Rayleigh multipath reflection. Hata urban model predicts 114.2 dB median attenuation.',
          meta: [{ k: 'PROPAGATION DISTANCE', v: 'd = 2.4 km' }, { k: 'HATA PATH LOSS', v: '114.2 dB Urban Loss' }, { k: 'FADING MARGIN', v: 'Rayleigh (m = 1) 10 dB' }, { k: 'RECEIVED POWER', v: '-84.2 dBm at Tower LNA' }]
        },
        {
          num: 'STAGE 5 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '5. BASE STATION TOWER RECEPTION & DEMUX',
          desc: '120° directional sector antenna array at 35m mast intercepts the RF wave. Low-Noise Amplifier (LNA) boosts signal and bandpass filter bank separates the 30 kHz user channel.',
          meta: [{ k: 'RECEIVER', v: 'BS-A Tower Mast (35m)' }, { k: 'SECTORING', v: '120° Tri-Sector (N=7)' }, { k: 'LNA GAIN', v: '+24 dB (Noise Fig < 2 dB)' }, { k: 'DEMUX METHOD', v: 'Bandpass Filter Bank' }]
        },
        {
          num: 'STAGE 6 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '6. BTS DEMODULATION & ABIS E1 TRUNK TRANSIT',
          desc: 'BTS demodulates FM carrier into 64 kbps standard DS0 PCM audio stream. It is multiplexed onto an Abis E1 digital trunk line (2.048 Mbps, 32 time slots) leading to BSC.',
          meta: [{ k: 'BACKHAUL TRUNK', v: 'Abis E1 Line (2.048 Mbps)' }, { k: 'CHANNELS PER E1', v: '30 Traffic + 2 Signaling' }, { k: 'CODEC', v: '64 kbps G.711 A-law PCM' }, { k: 'FRAME SYNCHRONY', v: '125 µs Frame' }]
        },
        {
          num: 'STAGE 7 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '7. BSC ROUTING & MTSO SS7 / IP CONVERSION',
          desc: 'Base Station Controller routes trunk into Mobile Telecommunications Switching Office (MTSO). MTSO queries HLR/VLR, converts audio/data to IP packets, and dispatches to server.',
          meta: [{ k: 'SWITCHING NODE', v: 'MTSO / MSC Gateway' }, { k: 'SIGNALING', v: 'SS7 / IS-41 Location Register' }, { k: 'AUTHENTICATION', v: 'HLR/VLR Verified' }, { k: 'PUBLIC GATEWAY', v: 'IP Backbone Routing' }]
        },
        {
          num: 'STAGE 8 OF 10', dir: '⬇️ DOWNLINK RETURN PATH',
          title: '8. SERVER ACKNOWLEDGMENT GENERATION',
          desc: 'Destination application host (8.8.8.8) processes packet and generates return response (HTTP 200 OK / DNS Response / Call Ack). The packet enters the cellular downlink pipe.',
          meta: [{ k: 'HOST', v: '8.8.8.8 (Web/DNS Server)' }, { k: 'PACKET TYPE', v: 'HTTP 200 OK / Voice ACK' }, { k: 'DIRECTION', v: 'DOWNLINK (Forward Path)' }, { k: 'PAYLOAD SIZE', v: '512 Bytes' }]
        },
        {
          num: 'STAGE 9 OF 10', dir: '⬇️ DOWNLINK RETURN PATH',
          title: '9. MTSO & BSC FORWARD CARRIER MAPPING',
          desc: 'MTSO routes the packet back through the BSC over the Abis line to serving Base Station BS-A. BTS maps the audio onto forward frequency carrier (870.03 MHz = 825.03 + 45 MHz).',
          meta: [{ k: 'ROUTING HOP', v: 'MTSO → BSC → BS-A' }, { k: 'DUPLEX SEPARATION', v: '+45.0 MHz Offset' }, { k: 'FORWARD CARRIER', v: '870.03 MHz (Ch 1 Forward)' }, { k: 'TRANSIT DELAY', v: '< 2.8 ms' }]
        },
        {
          num: 'STAGE 10 OF 10', dir: '⬇️ DOWNLINK RETURN PATH',
          title: '10. TOWER FORWARD TRANSMIT & MS-1 ACK RECEIPT',
          desc: 'Tower high-power transmitter (100 W) radiates forward FM carrier. MS-1 receiver antenna captures the signal, recovers audio/ACK, and flashes green. 2-way round trip confirmed!',
          meta: [{ k: 'BASE STATION TX', v: '100 W (+50 dBm)' }, { k: 'MS-1 RECEPTION', v: 'Demodulated & Verified' }, { k: 'ROUND TRIP TIME', v: '48.2 ms RTT' }, { k: 'STATUS', v: '2-WAY ROUND TRIP SUCCESS' }]
        }
      ],
      tdma: [
        {
          num: 'STAGE 1 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '1. GSM BASEBAND SPEECH ENCODING (RPE-LTP)',
          desc: 'Acoustic voice is sampled at 8 kHz / 13-bit uniform PCM. The GSM 06.10 RPE-LTP (Regular Pulse Excitation - Long Term Prediction) codec compresses 160 samples (20 ms) into 260 bits (13 kbps).',
          meta: [{ k: 'SAMPLING RATE', v: '8 kHz / 13-bit Linear' }, { k: 'CODEC', v: 'GSM 06.10 RPE-LTP (13 kbps)' }, { k: 'SPEECH BLOCK', v: '260 bits per 20 ms' }, { k: 'CLASS IA BITS', v: '50 most critical bits' }]
        },
        {
          num: 'STAGE 2 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '2. CHANNEL ENCODING, FEC & INTERLEAVING',
          desc: 'Class IA bits receive 3-bit CRC. The 182 sensitive bits are protected by half-rate convolutional code (R=1/2, K=5), yielding 456 encoded bits, diagonal interleaved across 8 TDMA bursts.',
          meta: [{ k: 'ERROR DETECTION', v: '3-bit CRC Checksum' }, { k: 'CONVOLUTIONAL FEC', v: 'Rate 1/2, Constraint K=5' }, { k: 'TOTAL BITS', v: '456 bits / 20 ms' }, { k: 'INTERLEAVING', v: 'Diagonal over 8 bursts' }]
        },
        {
          num: 'STAGE 3 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '3. 156.25-BIT NORMAL BURST ASSEMBLY',
          desc: 'Bits are formatted into a GSM normal burst: 3 tail bits, 57 encrypted data bits, 1 stealing flag, 26-bit training sequence midamble, 1 stealing flag, 57 data bits, 3 tail bits, and 8.25 guard bits.',
          meta: [{ k: 'BURST STRUCTURE', v: '156.25 bits total' }, { k: 'DATA PAYLOAD', v: '114 encrypted bits' }, { k: 'TRAINING MIDAMBLE', v: '26-bit known pattern' }, { k: 'GUARD PERIOD', v: '8.25 bits (30.46 µs)' }]
        },
        {
          num: 'STAGE 4 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '4. 0.3 GMSK MODULATION & TIME SLOT 3 TRANSMIT',
          desc: 'MS-1 modulates the burst onto 890.2 MHz carrier using Gaussian Minimum Shift Keying (BT = 0.3) at 270.833 kbps. It transmits strictly during assigned Time Slot 3 (577 µs window).',
          meta: [{ k: 'MODULATION', v: '0.3 GMSK (Constant Envelope)' }, { k: 'DATA RATE', v: '270.833 kbps' }, { k: 'CARRIER FREQ', v: '890.2 MHz (ARFCN 1)' }, { k: 'TIME SLOT', v: 'TS 3 (577 µs duration)' }]
        },
        {
          num: 'STAGE 5 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '5. AIR PROPAGATION & ADAPTIVE EQUALIZATION',
          desc: 'Burst propagates 2.4 km through multipath delay spread. Tower Viterbi equalizer correlates the received 26-bit midamble with known reference to cancel intersymbol interference (ISI).',
          meta: [{ k: 'TIMING ADVANCE', v: '0..63 steps (3.69 µs step)' }, { k: 'EQUALIZER', v: 'MLSE Viterbi Receiver' }, { k: 'MULTIPATH SPREAD', v: 'Up to 16 µs delay spread' }, { k: 'CARRIER BW', v: '200 kHz channel' }]
        },
        {
          num: 'STAGE 6 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '6. BTS DE-INTERLEAVING & ABIS E1 TRUNK TRANSIT',
          desc: 'BTS gathers 8 bursts, performs de-interleaving and Viterbi FEC decoding. Demodulated speech frames are sent over the Abis 2.048 Mbps E1 trunk to the Base Station Controller.',
          meta: [{ k: 'ABIS PROTOCOL', v: 'GSM 08.58 / LAPD' }, { k: 'TRUNK INTERFACE', v: 'E1 2.048 Mbps' }, { k: 'TRAU UNIT', v: '16 kbps sub-multiplexing' }, { k: 'CONTROLLER', v: 'BSC Switch Frame' }]
        },
        {
          num: 'STAGE 7 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '7. MSC SWITCHING, A5 CIPHER & GGSN IP GATEWAY',
          desc: 'Speech is decrypted using the subscriber A5 session cipher key. For data, SGSN/GGSN decapsulates the GTP tunnel and forwards IP datagram onto the public fiber backbone to 8.8.8.8.',
          meta: [{ k: 'CIPHER DECRYPT', v: 'A5/1 Encryption Verified' }, { k: 'CORE NODES', v: 'MSC / SGSN / GGSN' }, { k: 'HLR/VLR', v: 'IMSI & Triplet Verified' }, { k: 'DESTINATION', v: '8.8.8.8 Web Host' }]
        },
        {
          num: 'STAGE 8 OF 10', dir: '⬇️ DOWNLINK RETURN PATH',
          title: '8. WEB HOST DISPATCHES RETURN ACK PACKET',
          desc: 'Application server at 8.8.8.8 generates return response (HTTP 200 OK / TCP ACK). The IP packet traverses back into the cellular gateway (GGSN / MSC Core).',
          meta: [{ k: 'RESPONSE SOURCE', v: '8.8.8.8 (Web Server)' }, { k: 'PAYLOAD', v: 'HTTP 200 OK / TCP ACK' }, { k: 'CORE INGRESS', v: 'GGSN Gateway' }, { k: 'DIRECTION', v: 'DOWNLINK FORWARD' }]
        },
        {
          num: 'STAGE 9 OF 10', dir: '⬇️ DOWNLINK RETURN PATH',
          title: '9. CORE & BSC DOWNLINK FRAME SCHEDULING',
          desc: 'BSC transcoder encodes downlink speech into 456 bits, interleave across bursts, and schedules forward transmission in TS 3 of the paired 935.2 MHz carrier (890.2 + 45 MHz).',
          meta: [{ k: 'DOWNLINK FREQ', v: '935.2 MHz (+45 MHz Offset)' }, { k: 'FRAME SCHEDULER', v: 'TDMA TS 3 Allocated' }, { k: 'BURST TYPE', v: 'Downlink Normal Burst' }, { k: 'LATENCY', v: '3.1 ms Backhaul' }]
        },
        {
          num: 'STAGE 10 OF 10', dir: '⬇️ DOWNLINK RETURN PATH',
          title: '10. BTS FORWARD BURST & MS-1 CLIENT RECEIPT',
          desc: 'BTS transmits forward 156.25-bit burst on Slot 3. MS-1 receiver deciphers with A5 key, plays audio / renders data, and lights up green. Full 2-way GSM round trip finished!',
          meta: [{ k: 'DOWNLINK BURST', v: 'TS 3 (577 µs Burst)' }, { k: 'CLIENT RECEIVER', v: 'MS-1 Acknowledged' }, { k: 'ROUND TRIP TIME', v: '58.4 ms RTT' }, { k: 'STATUS', v: '2-WAY ROUND TRIP SUCCESS' }]
        }
      ],
      cdma: [
        {
          num: 'STAGE 1 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '1. QCELP VOICE CODEC & CONVOLUTIONAL FEC',
          desc: 'Voice is digitized by variable-rate 8 kbps QCELP vocoder (9600, 4800, 2400, or 1200 bps). Convolutional encoder applies powerful rate 1/3, constraint length K=9 FEC for robust protection.',
          meta: [{ k: 'VOICE CODEC', v: 'QCELP 8 kbps Variable Rate' }, { k: 'CONVOLUTIONAL FEC', v: 'Rate 1/3, Constraint K=9' }, { k: 'SYMBOL RATE', v: '28.8 ksps Encoded' }, { k: 'INTERLEAVING', v: '20 ms Block Interleaver' }]
        },
        {
          num: 'STAGE 2 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '2. 64-ARY ORTHOGONAL MODULATION (WALSH)',
          desc: 'Every 6 encoded code symbols are mapped into one of 64 orthogonal Walsh functions (W_0 to W_63), providing 64-ary orthogonal modulation at 307.2 kcps.',
          meta: [{ k: 'WALSH MAPPING', v: '6 symbols → 1 Walsh row' }, { k: 'WALSH RATE', v: '307.2 kcps' }, { k: 'CODE SET', v: 'Hadamard-Walsh Matrix 64×64' }, { k: 'CROSS-CORRELATION', v: 'R_ij = 0 (Orthogonal)' }]
        },
        {
          num: 'STAGE 3 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '3. LONG CODE SPREADING & PN QUENCHING',
          desc: 'Signal is spread by 42-bit user long code PN sequence at 1.2288 Mcps (giving 128 chips per symbol) and scrambled by I and Q pilot PN sequences (length 2^15).',
          meta: [{ k: 'SPREADING FACTOR', v: 'G = 128 (21.1 dB Gain)' }, { k: 'CHIP RATE', v: '1.2288 Mcps' }, { k: 'PN SEQUENCE', v: '42-bit Long Code Mask' }, { k: 'CHANNEL BW', v: '1.25 MHz Spread Spectrum' }]
        },
        {
          num: 'STAGE 4 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '4. AIR PROPAGATION ACROSS 1.25 MHz CARRIER',
          desc: 'Spread spectrum waveform propagates over 2.4 km. All cell users transmit concurrently on the exact same 1.25 MHz channel. Background noise increases gracefully (soft capacity limit).',
          meta: [{ k: 'FREQUENCY REUSE', v: 'Universal Reuse N = 1' }, { k: 'CARRIER FREQ', v: '824.70 MHz (Ch 283)' }, { k: 'PATH LOSS', v: '114 dB Urban' }, { k: 'FAST POWER CONTROL', v: '800 bps closed loop (±1 dB)' }]
        },
        {
          num: 'STAGE 5 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '5. TOWER RAKE RECEIVER MULTIPATH RESOLUTION',
          desc: 'Tower RAKE receiver assigns 3 separate correlator fingers (τ_1, τ_2, τ_3) to track multipath echoes arriving > 814 ns apart, combining them via Maximal Ratio Combining (MRC).',
          meta: [{ k: 'RAKE FINGERS', v: '3 Multipath Resolvers' }, { k: 'CHIP DURATION', v: 'Tc = 813.8 ns resolution' }, { k: 'DIVERSITY GAIN', v: '+3 dB Eb/N0 Gain' }, { k: 'DESPREADING', v: 'Correlated with User Code' }]
        },
        {
          num: 'STAGE 6 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '6. BTS CORRELATION & RNC MACRO-DIVERSITY',
          desc: 'BTS correlates user code and recovers the 9.6 kbps bitstream. Frame is forwarded over Iub ATM/IP backhaul to Radio Network Controller (RNC) for soft handoff frame selection.',
          meta: [{ k: 'BACKHAUL', v: 'Iub ATM / IP Trunk' }, { k: 'HANDOFF TYPE', v: 'Soft Handoff (Make-Before-Break)' }, { k: 'FRAME SELECTION', v: 'Best Eb/N0 from BS-A / BS-B' }, { k: 'CONTROLLER', v: 'RNC Unit' }]
        },
        {
          num: 'STAGE 7 OF 10', dir: '⬆️ UPLINK DIRECTION',
          title: '7. PDSN CORE DECAPSULATION & IP BACKBONE',
          desc: 'Packet Data Serving Node (PDSN) terminates PPP session, decapsulates IP datagram, and routes it across the public core backbone to destination web host 8.8.8.8.',
          meta: [{ k: 'CORE NODE', v: 'PDSN / Packet Core' }, { k: 'AUTHENTICATION', v: 'AAA Server / RADIUS' }, { k: 'IP ROUTE', v: 'Public Fiber Backbone' }, { k: 'DESTINATION', v: '8.8.8.8 Web Host' }]
        },
        {
          num: 'STAGE 8 OF 10', dir: '⬇️ DOWNLINK RETURN PATH',
          title: '8. APPLICATION SERVER DISPATCHES RETURN ACK',
          desc: 'Web server 8.8.8.8 responds with HTTP 200 OK / DNS Response. The return packet reaches PDSN to begin the forward link transit.',
          meta: [{ k: 'REPLY SOURCE', v: '8.8.8.8 (Web Server)' }, { k: 'PACKET', v: 'HTTP 200 OK' }, { k: 'INGRESS NODE', v: 'PDSN Gateway' }, { k: 'DIRECTION', v: 'DOWNLINK FORWARD' }]
        },
        {
          num: 'STAGE 9 OF 10', dir: '⬇️ DOWNLINK RETURN PATH',
          title: '9. RNC & BTS FORWARD WALSH CODE MULTIPLEXING',
          desc: 'BTS modulates return data onto the forward link using Walsh code W_64. Pilot channel (W_0), sync channel (W_32), and paging channels are combined into composite QPSK wave.',
          meta: [{ k: 'FORWARD CARRIER', v: '869.70 MHz (+45 MHz Offset)' }, { k: 'FORWARD CODE', v: 'Walsh Channel W_64' }, { k: 'PILOT CHANNEL', v: 'Walsh W_0 (Phase Reference)' }, { k: 'POWER ALLOCATION', v: 'Dynamic Forward Power Control' }]
        },
        {
          num: 'STAGE 10 OF 10', dir: '⬇️ DOWNLINK RETURN PATH',
          title: '10. BTS SPREAD BROADCAST & MOBILE RAKE RECOVERY',
          desc: 'Tower transmits forward 1.25 MHz waveform. MS-1 mobile RAKE receiver correlates with Walsh code W_64, cancels other users via code orthogonality, and confirms round trip!',
          meta: [{ k: 'FORWARD MOD', v: 'QPSK 1.2288 Mcps' }, { k: 'ORTHOGONALITY', v: '⟨W_i, W_j⟩ = 0' }, { k: 'ROUND TRIP TIME', v: '44.6 ms RTT' }, { k: 'STATUS', v: '2-WAY ROUND TRIP SUCCESS' }]
        }
      ]
    };

    const updateStepDetailCard = (stage) => {
      const mode = ch10State.accessMode;
      const list = stepProcedures10[mode] || stepProcedures10.fdma;
      const step = list[stage];
      if (!step) return;

      if (stepDetail) stepDetail.style.display = 'block';
      if (stepNum) stepNum.textContent = step.num;
      if (stepDirection) {
        stepDirection.textContent = step.dir;
        stepDirection.style.color = stage < 7 ? 'var(--accent-cyan)' : 'var(--status-ready)';
      }
      if (stepTitle) stepTitle.textContent = step.title;
      if (stepDesc) stepDesc.textContent = step.desc;
      if (stepInd) stepInd.textContent = `${step.num} — ${step.title}`;

      if (stepMeta) {
        stepMeta.innerHTML = step.meta.map(m => `
          <div style="background:rgba(0,229,255,0.06); border:1px solid rgba(0,229,255,0.18); border-radius:3px; padding:4px 8px;">
            <div style="color:var(--text-dim); font-size:0.65rem;">${m.k}:</div>
            <div style="color:#fff; font-weight:600; font-size:0.75rem; margin-top:1px;">${m.v}</div>
          </div>
        `).join('');
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // CAMERA AUTO-FOLLOW INTERPOLATION FOR 10-STAGE 2-WAY ROUND TRIP
    // ─────────────────────────────────────────────────────────────────────────
    const updateCameraAutoFollow = (progress10) => {
      if (!ch10State.autoCamera || !isoSvg) return;

      let target;
      if (progress10 < 2.0) {
        // Stage 0 & 1: Client Baseband Encoding & FEC
        target = cameraTargets.client;
      } else if (progress10 < 4.0) {
        // Stage 2 & 3: Air Propagation from Client to Tower
        const t = (progress10 - 2.0) / 2.0;
        target = {
          vx: 40 + t * 580,
          vy: 80 - t * 0,
          vw: 480 + t * 80,
          vh: 360,
          label: `AIR LINK UPLINK (${(t*100).toFixed(0)}%)`,
          icon: '📡'
        };
      } else if (progress10 < 5.0) {
        // Stage 4: Base Station Tower & LNA Reception
        target = cameraTargets.tower;
      } else if (progress10 < 6.0) {
        // Stage 5: BSC Controller
        target = cameraTargets.bsc;
      } else if (progress10 < 7.0) {
        // Stage 6: Core Cloud & HLR/VLR
        target = cameraTargets.core;
      } else if (progress10 < 8.0) {
        // Stage 7: Web Host Server (8.8.8.8)
        target = cameraTargets.server;
      } else if (progress10 < 9.0) {
        // Stage 8: Downlink return through Core & BSC to Tower
        const t = (progress10 - 8.0);
        target = {
          vx: 1280 - t * 660,
          vy: 80,
          vw: 360 + t * 120,
          vh: 360,
          label: `DOWNLINK TRANSIT (${(t*100).toFixed(0)}%)`,
          icon: '🗼'
        };
      } else {
        // Stage 9: Forward RF Broadcast from Tower to MS-1
        const t = (progress10 - 9.0);
        target = {
          vx: 620 - t * 580,
          vy: 80,
          vw: 480,
          vh: 360,
          label: `FORWARD RF ARRIVAL (${(t*100).toFixed(0)}%)`,
          icon: '💻'
        };
      }

      const ease = 0.08;
      curVx += (target.vx - curVx) * ease;
      curVy += (target.vy - curVy) * ease;
      curVw += (target.vw - curVw) * ease;
      curVh += (target.vh - curVh) * ease;

      isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
      if (camStatus) camStatus.textContent = target.label;
      if (camIcon) camIcon.textContent = target.icon;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // DEDICATED INDEPENDENT 2-WAY ROUND TRIP ANIMATION LOOP (1600 x 480)
    // ─────────────────────────────────────────────────────────────────────────
    let localSimClock = 0;
    let lastPerfTimestamp = performance.now();

    const animateSimFrame = (currentTimestamp) => {
      const dt = Math.max(0.001, Math.min(0.1, (currentTimestamp - lastPerfTimestamp) / 1000));
      lastPerfTimestamp = currentTimestamp;

      if (ch10State.isPlaying && ch10State.manualStep < 0) {
        localSimClock += dt * ch10State.simSpeedMultiplier;
      }

      const time = localSimClock;
      const speed = ch10State.simSpeedMultiplier;
      const mode = ch10State.accessMode;
      const count = ch10State.activeDevicesCount;

      // 10 full stages over 12.0 seconds
      const cycleDuration = 12.0;
      const progress10 = ch10State.manualStep >= 0
        ? (ch10State.manualStep + 0.5)
        : ((time % cycleDuration) / cycleDuration) * 10.0; // 0.0 to 10.0

      const currentStage = Math.min(9, Math.floor(progress10));
      const subT = ch10State.manualStep >= 0 ? 0.5 : (progress10 - currentStage);

      // 1. Update Camera
      updateCameraAutoFollow(progress10);

      // 2. Oscillate Electromagnetic Sine Waves across Air Interface (x=160 to 780)
      const emWaveUplink = container.querySelector('#iso-em-carrier-wave');
      const emWaveDownlink = container.querySelector('#iso-em-downlink-wave');

      if (emWaveUplink) {
        const isUplinkActive = currentStage >= 2 && currentStage <= 4;
        emWaveUplink.setAttribute('opacity', isUplinkActive ? '0.88' : '0.15');
        const waveStartX = 160;
        const waveEndX = 780;
        const waveY = 220;
        const waveFreq = mode === 'cdma' ? 32 : mode === 'tdma' ? 22 : 14;
        const wavePhase = time * 14 * speed;
        let waveD = `M ${waveStartX} ${waveY}`;
        const steps = 48;
        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const wx = waveStartX + frac * (waveEndX - waveStartX);
          const atten = 1 - frac * 0.35;
          const wy = waveY + Math.sin(frac * waveFreq * Math.PI * 2 - wavePhase) * (15 * atten);
          waveD += ` L ${wx.toFixed(1)} ${wy.toFixed(1)}`;
        }
        emWaveUplink.setAttribute('d', waveD);
      }

      if (emWaveDownlink) {
        const isDownlinkActive = currentStage >= 8;
        emWaveDownlink.setAttribute('opacity', isDownlinkActive ? '0.88' : '0');
        if (isDownlinkActive) {
          const waveStartX = 780;
          const waveEndX = 160;
          const waveY = 205;
          const wavePhase = -time * 14 * speed;
          let waveD = `M ${waveStartX} ${waveY}`;
          const steps = 48;
          for (let s = 0; s <= steps; s++) {
            const frac = s / steps;
            const wx = waveStartX - frac * (waveStartX - waveEndX);
            const wy = waveY + Math.sin(frac * 18 * Math.PI * 2 - wavePhase) * 14;
            waveD += ` L ${wx.toFixed(1)} ${wy.toFixed(1)}`;
          }
          emWaveDownlink.setAttribute('d', waveD);
        }
      }

      // 3. Pulse Antennas
      const clientPulse = container.querySelector('#iso-client-rf-pulse');
      const clientPulse2 = container.querySelector('#iso-client-rf-pulse-2');
      const bsPulse = container.querySelector('#iso-bs-rf-pulse');

      if (clientPulse && clientPulse2 && bsPulse) {
        const pR = 10 + ((time * 24 * speed) % 35);
        const pOp = Math.max(0, 1 - (pR / 45));
        clientPulse.setAttribute('r', pR);
        clientPulse.setAttribute('opacity', (currentStage === 2 || currentStage === 9) ? pOp * 0.85 : 0.12);

        const pR2 = 14 + ((time * 24 * speed + 14) % 40);
        const pOp2 = Math.max(0, 1 - (pR2 / 50));
        clientPulse2.setAttribute('r', pR2);
        clientPulse2.setAttribute('opacity', (currentStage === 2 || currentStage === 9) ? pOp2 * 0.6 : 0.08);

        if (currentStage === 4 || currentStage === 8 || currentStage === 9) {
          const bsR = 14 + ((time * 22 * speed) % 40);
          bsPulse.setAttribute('r', bsR);
          bsPulse.setAttribute('opacity', Math.max(0, 1 - bsR / 50));
        } else {
          bsPulse.setAttribute('opacity', 0);
        }
      }

      // 4. Move Packets: Forward Uplink (Stages 0..6) & Return Downlink ACK (Stages 7..9)
      const isoBubbleUplink = container.querySelector('#iso-pkt-bubble');
      const isoTextUplink = container.querySelector('#iso-pkt-text');
      const isoPktAck = container.querySelector('#iso-animated-packet-ack');
      const isoBubbleAck = container.querySelector('#iso-pkt-bubble-ack');
      const isoTextAck = container.querySelector('#iso-pkt-text-ack');
      const isoBubble2 = container.querySelector('#iso-animated-packet-2');
      const isoText2 = container.querySelector('#iso-pkt-text-2');

      // Forward Uplink Packet Movement
      if (isoBubbleUplink && isoTextUplink) {
        if (currentStage < 7) {
          isoBubbleUplink.setAttribute('opacity', 1);
          isoTextUplink.setAttribute('opacity', 1);

          let px = 160, py = 250, label = 'UPLINK BASEBAND', color = '#00e5ff', bw = 135;

          if (currentStage === 0) {
            // Stage 0: Mobile Speech Sampling & Codec
            px = 160;
            py = 250;
            label = mode === 'fdma' ? 'COMPANDED VOICE' : mode === 'tdma' ? 'RPE-LTP: 260b' : 'QCELP: 9.6 kbps';
            color = '#38bdf8';
          } else if (currentStage === 1) {
            // Stage 1: Channel FEC Encoding & Interleaving
            px = 160;
            py = 240;
            label = mode === 'fdma' ? 'PRE-EMPHASIS FM' : mode === 'tdma' ? 'CONVOLUTIONAL FEC' : 'WALSH W_64 MOD';
            color = '#00ff9d';
          } else if (currentStage === 2) {
            // Stage 2: RF Burst radiating into air
            px = 160 + subT * (360 - 160);
            py = 240 + subT * (210 - 240);
            label = mode === 'fdma' ? 'FM: 825.03 MHz' : mode === 'tdma' ? 'GMSK BURST TS 3' : 'CDMA 1.2288 Mcps';
            color = mode === 'fdma' ? '#0070f3' : mode === 'tdma' ? '#00ff9d' : '#ff0055';
          } else if (currentStage === 3) {
            // Stage 3: Free-space air interface propagation (360 to 780)
            px = 360 + subT * (780 - 360);
            py = 210 + subT * (180 - 210) + Math.sin(subT * Math.PI) * -16;
            label = mode === 'fdma' ? 'AIR CH 1 (-114dB)' : mode === 'tdma' ? 'AIR BURST TS 3' : 'AIR W_64 SPREAD';
            color = mode === 'fdma' ? '#0070f3' : mode === 'tdma' ? '#00ff9d' : '#ff0055';
          } else if (currentStage === 4) {
            // Stage 4: BTS Tower Reception & Equalizer
            px = 780 + subT * (820 - 780);
            py = 270 + subT * (280 - 270);
            label = mode === 'fdma' ? 'LNA DEMUX (+24dB)' : mode === 'tdma' ? 'VITERBI EQUALIZER' : 'RAKE COMBINER';
            color = '#38bdf8';
          } else if (currentStage === 5) {
            // Stage 5: Abis E1 Trunk Transit to BSC (820 to 1020)
            px = 820 + subT * (1020 - 820);
            py = 280;
            label = mode === 'cdma' ? 'Iub ATM CELL' : 'Abis E1 TDM (2.048M)';
            color = '#ffb703';
          } else {
            // Stage 6: BSC to MTSO Core Cloud to Server (1020 to 1490)
            px = 1020 + subT * (1490 - 1020);
            py = 280 + subT * (270 - 280) + Math.sin(subT * Math.PI) * -20;
            label = 'GTP-U / IP PDU';
            color = '#00ff9d';
          }

          isoBubbleUplink.setAttribute('x', px - bw / 2);
          isoBubbleUplink.setAttribute('y', py - 13);
          isoBubbleUplink.setAttribute('width', bw);
          isoBubbleUplink.setAttribute('stroke', color);
          isoTextUplink.setAttribute('x', px - bw / 2 + 8);
          isoTextUplink.setAttribute('y', py + 4);
          isoTextUplink.setAttribute('fill', color);
          isoTextUplink.textContent = label;
        } else {
          // Uplink delivered; hide while return ACK travels
          isoBubbleUplink.setAttribute('opacity', 0);
          isoTextUplink.setAttribute('opacity', 0);
        }
      }

      // Return Downlink ACK Packet Movement (Stages 7..9)
      if (isoPktAck && isoBubbleAck && isoTextAck) {
        if (currentStage >= 7) {
          isoPktAck.setAttribute('opacity', 1);
          let ackX = 1490, ackY = 270, ackLabel = 'DOWNLINK ACK', ackBw = 140;

          if (currentStage === 7) {
            // Stage 7: Server creates response
            ackX = 1490 - subT * (1490 - 1240);
            ackY = 270 - subT * (270 - 240);
            ackLabel = 'HTTP 200 OK (ACK)';
          } else if (currentStage === 8) {
            // Stage 8: Core Cloud & BSC backhaul to BTS Tower (1240 to 780)
            ackX = 1240 - subT * (1240 - 780);
            ackY = 240 + subT * (270 - 240);
            ackLabel = mode === 'fdma' ? 'Abis FORWARD AUDIO' : mode === 'tdma' ? 'BSC SLOT SCHEDULER' : 'RNC FORWARD WALSH';
          } else {
            // Stage 9: BTS Tower forward RF transmission back across air link to MS-1 (780 to 160)!
            ackX = 780 - subT * (780 - 160);
            ackY = 205 + subT * (280 - 205);
            ackLabel = mode === 'fdma' ? 'DL: 870.03 MHz (+45M)' : mode === 'tdma' ? 'DL: GSM TS 3 BURST' : 'DL: CDMA FORWARD W_64';
          }

          isoBubbleAck.setAttribute('x', ackX - ackBw / 2);
          isoBubbleAck.setAttribute('y', ackY - 13);
          isoBubbleAck.setAttribute('width', ackBw);
          isoTextAck.setAttribute('x', ackX - ackBw / 2 + 8);
          isoTextAck.setAttribute('y', ackY + 4);
          isoTextAck.textContent = ackLabel;

          // If at the end of Stage 9, flash MS-1 terminal green
          if (currentStage === 9 && subT > 0.8) {
            if (hudStatus) {
              hudStatus.textContent = `✅ ROUND TRIP DELIVERED: Full 2-way handshake confirmed at MS-1! (RTT ~48 ms)`;
              hudStatus.style.color = 'var(--status-ready)';
            }
          }
        } else {
          isoPktAck.setAttribute('opacity', 0);
        }
      }

      // Secondary Multi-User Packet (when count >= 4)
      if (isoBubble2 && isoText2) {
        if (count >= 4 && currentStage >= 2 && currentStage <= 5) {
          isoBubble2.setAttribute('opacity', 1);
          let p2x = 80 + subT * (780 - 80);
          let p2y = 150 + subT * (270 - 150);
          const rect = isoBubble2.querySelector('rect');
          if (rect) {
            rect.setAttribute('x', p2x - 55);
            rect.setAttribute('y', p2y - 11);
          }
          isoText2.setAttribute('x', p2x - 48);
          isoText2.setAttribute('y', p2y + 4);
          if (mode === 'fdma') {
            isoText2.textContent = 'MS-2: f₂ 825.06M';
          } else if (mode === 'tdma') {
            isoText2.textContent = 'MS-2: SLOT 4/8';
          } else {
            isoText2.textContent = 'MS-2: W_2 Code';
          }
        } else {
          isoBubble2.setAttribute('opacity', 0);
        }
      }

      // Auto update step detail card if playing in continuous mode
      if (ch10State.manualStep < 0) {
        updateStepDetailCard(currentStage);
      }

      // ───────────────────────────────────────────────────────────────────────
      // REAL DYNAMIC TDMA 8-SLOT FRAME CLOCK & TIME-SLOTTED BURST PIPELINE
      // ───────────────────────────────────────────────────────────────────────
      if (mode === 'tdma') {
        const tdmaSlotsGrid = container.querySelector('#sim-tdma-slots-hud-grid');
        const tdmaActiveTxt = container.querySelector('#sim-tdma-active-slot-txt');
        if (tdmaSlotsGrid && tdmaActiveTxt) {
          const activeSlot = Math.floor((time * 5) % 8);
          const slotLabels = [
            'MS-2 (Phone)',
            'Guard / Monitor',
            'Other Cell Tx',
            'MS-1 (Normal Burst)',
            'MS-3 (Laptop)',
            'MS-4 (Vehicular)',
            'Paging / Sync',
            'BCCH Beacon'
          ];
          const isMs1Active = activeSlot === 3;
          tdmaActiveTxt.textContent = `Active Time Slot: TS ${activeSlot}/7 — ${slotLabels[activeSlot]} (577 µs Tx Window | Frame 4.615 ms)`;

          let html = '';
          for (let s = 0; s < 8; s++) {
            const isCur = s === activeSlot;
            const isMs1Slot = s === 3;
            const bg = isCur ? 'rgba(0, 255, 157, 0.28)' : isMs1Slot ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)';
            const bdr = isCur ? '#00ff9d' : isMs1Slot ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)';
            const col = isCur ? '#00ff9d' : isMs1Slot ? 'var(--accent-cyan)' : 'var(--text-dim)';
            html += `
              <div style="background: ${bg}; border: 1px solid ${bdr}; border-radius: 4px; padding: 3px 4px; text-align: center; font-size: 0.65rem; transition: all 0.08s;">
                <div style="font-weight: 700; color: ${col};">TS ${s} ${isMs1Slot ? '★' : ''}</div>
                <div style="font-size: 0.58rem; color: ${isCur ? '#fff' : 'var(--text-muted)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${isCur ? '▶ ACTIVE' : slotLabels[s]}
                </div>
              </div>
            `;
          }
          tdmaSlotsGrid.innerHTML = html;
        }
      }

      activeAnimationRaf = requestAnimationFrame(animateSimFrame);
    };

    const startSimulation = () => {
      ch10State.isPlaying = true;
      lastPerfTimestamp = performance.now();
      if (btnPlay) {
        btnPlay.textContent = '⏸ PAUSE';
        btnPlay.style.borderColor = '#ffb703';
        btnPlay.style.color = '#ffb703';
        btnPlay.style.background = 'rgba(255,183,3,0.15)';
      }
      if (hudStatus) {
        hudStatus.textContent = `● 2-WAY ROUND TRIP ACTIVE: ${ch10State.accessMode.toUpperCase()} | ${ch10State.activeDevicesCount} Subscribers in session`;
        hudStatus.style.color = 'var(--status-ready)';
      }
      if (!activeAnimationRaf) {
        activeAnimationRaf = requestAnimationFrame(animateSimFrame);
      }
    };

    const stopSimulation = () => {
      ch10State.isPlaying = false;
      if (btnPlay) {
        btnPlay.textContent = '▶ PLAY';
        btnPlay.style.borderColor = '#00e5ff';
        btnPlay.style.color = '#00e5ff';
        btnPlay.style.background = 'rgba(0,229,255,0.18)';
      }
      if (hudStatus) {
        hudStatus.textContent = `⏸ PAUSED — Click ▶ PLAY to resume 2-way round trip procedure`;
        hudStatus.style.color = 'var(--text-dim)';
      }
    };

    const resetSimulation = () => {
      stopSimulation();
      ch10State.manualStep = -1;
      localSimClock = 0;
      applyViewBox(cameraTargets.overview);
      if (btnCamWide) {
        [btnCamWide, btnCamClient, btnCamAir, btnCamTower, btnCamBsc, btnCamCore, btnCamServer].forEach(b => b && b.classList.remove('active'));
        btnCamWide.classList.add('active');
      }
      ch10State.autoCamera = true;
      if (autoCamText) {
        autoCamText.textContent = 'ON';
        autoCamText.style.color = 'var(--status-ready)';
      }
      if (btnAutoCam) btnAutoCam.classList.add('active');
      updateStepDetailCard(0);
    };

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        ch10State.isPlaying ? stopSimulation() : startSimulation();
      });
    }

    if (btnReset) btnReset.addEventListener('click', resetSimulation);

    if (btnStep) {
      btnStep.addEventListener('click', () => {
        if (ch10State.isPlaying) stopSimulation();
        ch10State.manualStep = (ch10State.manualStep + 1) % 10;
        updateStepDetailCard(ch10State.manualStep);
        if (ch10State.autoCamera) {
          updateCameraAutoFollow(ch10State.manualStep + 0.5);
        }
      });
    }

    setAccessMode(ch10State.accessMode);
    setDeviceCount(ch10State.activeDevicesCount);
    updateFrequencyParams();
    updateTowerCapacityDisplay();
    updateStepDetailCard(0);

    // Auto-start simulation immediately
    startSimulation();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10.1.1 & 10.1.2: CELLULAR GEOMETRY & FREQUENCY REUSE (DYNAMIC SCALING)
  // ─────────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10.1.1 & 10.1.2: CELLULAR GEOMETRY & FREQUENCY REUSE (CANVAS ENGINE)
  // ─────────────────────────────────────────────────────────────────────────────
  if (secId === 'sec-10.geom') {
    const canvas = container.querySelector('#hex-grid-canvas');
    const canvasWrapper = container.querySelector('#hex-canvas-wrapper');
    const hoverInfo = container.querySelector('#hex-hover-info');

    const sI = container.querySelector('#ch10-slider-i');
    const sJ = container.querySelector('#ch10-slider-j');
    const selN = container.querySelector('#ch10-select-n');
    const sR = container.querySelector('#ch10-slider-r');
    const selExp = container.querySelector('#ch10-select-expansion');

    const vI = container.querySelector('#ch10-val-i');
    const vJ = container.querySelector('#ch10-val-j');
    const vN = container.querySelector('#ch10-val-n');
    const vR = container.querySelector('#ch10-val-r');
    const vExp = container.querySelector('#ch10-val-exp');

    const outD = container.querySelector('#hex-out-d');
    const outCochan = container.querySelector('#hex-out-cochan');
    const outRatio = container.querySelector('#hex-out-ratio');
    const outArea = container.querySelector('#hex-out-area');
    const outSir = container.querySelector('#hex-out-sir');
    const outFactor = container.querySelector('#hex-out-factor');
    const outCapNote = container.querySelector('#hex-out-cap-note');

    const btnWalk = container.querySelector('#btn-hex-walk');
    const btnLabels = container.querySelector('#btn-hex-labels');
    const btnPanLeft = container.querySelector('#btn-hex-pan-left');
    const btnPanRight = container.querySelector('#btn-hex-pan-right');
    const btnPanUp = container.querySelector('#btn-hex-pan-up');
    const btnPanDown = container.querySelector('#btn-hex-pan-down');
    const btnZin = container.querySelector('#btn-hex-zin');
    const btnZout = container.querySelector('#btn-hex-zout');
    const btnCenter = container.querySelector('#btn-hex-center');
    const btnReset = container.querySelector('#btn-hex-reset');

    const btnTipI = container.querySelector('#btn-tip-i');
    const btnTipJ = container.querySelector('#btn-tip-j');
    const tipBoxI = container.querySelector('#tooltip-box-i');
    const tipBoxJ = container.querySelector('#tooltip-box-j');
    const btnCloseTipI = container.querySelector('#btn-close-tip-i');
    const btnCloseTipJ = container.querySelector('#btn-close-tip-j');
    const tipCalcI = container.querySelector('#tip-calc-i');
    const tipCalcJ = container.querySelector('#tip-calc-j');

    let hoveredCell = null;
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let dragStartPanX = 0, dragStartPanY = 0;

    const clusterColors = [
      '#0070f3', '#00ff9d', '#ffb703', '#f43f5e',
      '#a855f7', '#38bdf8', '#fb923c', '#ec4899',
      '#10b981', '#6366f1', '#eab308', '#06b6d4',
      '#84cc16', '#d946ef', '#14b8a6', '#f97316',
      '#8b5cf6', '#64748b', '#0284c7'
    ];

    const getCellClusterId = (q, r, i, j, N) => {
      if (N <= 1) return 1;
      if (i === 2 && j === 0) {
        return (((q % 2 + 2) % 2) + 2 * ((r % 2 + 2) % 2)) + 1;
      } else if (i === 3 && j === 0) {
        return (((q % 3 + 3) % 3) + 3 * ((r % 3 + 3) % 3)) + 1;
      } else if (i === 2 && j === 2) {
        const u = ((q - r) % 6 + 6) % 6;
        const v = ((q + 2*r) % 2 + 2) % 2;
        return (u + v * 6) % 12 + 1;
      } else {
        const u = i + j;
        const v = j;
        const raw = (q * u + r * v) % N;
        return ((raw + N) % N) + 1;
      }
    };

    // Calculate the 6 first-tier co-channel cells relative to (0, 0)
    const getFirstTierCochannelCoords = (i, j) => {
      const coords = [];
      let curQ = i, curR = j;
      for (let k = 0; k < 6; k++) {
        coords.push({ q: curQ, r: curR });
        // Rotate 60 deg CCW in axial coordinates: (q, r) -> (-r, q + r)
        const nextQ = -curR;
        const nextR = curQ + curR;
        curQ = nextQ;
        curR = nextR;
      }
      return coords;
    };

    const drawHexGrid = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 900;
      const height = rect.height || 380;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Background grid styling
      ctx.fillStyle = '#020409';
      ctx.fillRect(0, 0, width, height);

      const i = ch10State.paramI;
      const j = ch10State.paramJ;
      const N = ch10State.reuseN;
      const R_km = ch10State.cellRadiusKm;
      const exp = ch10State.sectoring;
      const zoom = ch10State.gridZoom;
      const panX = ch10State.gridPanX;
      const panY = ch10State.gridPanY;

      // Base radius in pixels: scaled dynamically by cell radius slider!
      const baseRpx = 20 + (R_km - 0.5) * 11;
      const rPx = baseRpx * zoom;

      const originX = width / 2 + panX;
      const originY = height / 2 + panY;

      // Axial to Cartesian function (flat-topped hexagons)
      const axialToPixel = (q, r) => {
        const x = originX + rPx * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
        const y = originY + rPx * (1.5 * r);
        return { x, y };
      };

      // Draw subtle background guide lines
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(originX - 1000, originY);
      ctx.lineTo(originX + 1000, originY);
      ctx.moveTo(originX, originY - 1000);
      ctx.lineTo(originX, originY + 1000);
      ctx.stroke();

      const cochannelNeighbors = getFirstTierCochannelCoords(i, j);

      // Determine visible cell range dynamically based on canvas viewport & pan offset
      // This ensures infinite, seamless navigation through large cellular deployment simulations!
      const corners = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: 0, y: height },
        { x: width, y: height }
      ];
      let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
      for (let k = 0; k < 4; k++) {
        const px = corners[k].x - originX;
        const py = corners[k].y - originY;
        const qf = ((Math.sqrt(3) / 3) * px - (1 / 3) * py) / rPx;
        const rf = ((2 / 3) * py) / rPx;
        if (qf < minQ) minQ = qf;
        if (qf > maxQ) maxQ = qf;
        if (rf < minR) minR = rf;
        if (rf > maxR) maxR = rf;
      }
      const startQ = Math.floor(minQ) - 2;
      const endQ = Math.ceil(maxQ) + 2;
      const startR = Math.floor(minR) - 2;
      const endR = Math.ceil(maxR) + 2;

      // Draw all hexagons visible in current panned viewport
      for (let q = startQ; q <= endQ; q++) {
        for (let r = startR; r <= endR; r++) {
          const { x: cx, y: cy } = axialToPixel(q, r);

          // Culling check
          if (cx < -rPx * 2 || cx > width + rPx * 2 || cy < -rPx * 2 || cy > height + rPx * 2) {
            continue;
          }

          const clusterId = getCellClusterId(q, r, i, j, N);
          const color = clusterColors[(clusterId - 1) % clusterColors.length] || '#38bdf8';
          const isOrigin = (q === 0 && r === 0);
          const isCochannel = cochannelNeighbors.some(c => c.q === q && c.r === r);
          const isSameGroupAsOrigin = (clusterId === 1);
          const isHovered = hoveredCell && hoveredCell.q === q && hoveredCell.r === r;

          // Compute vertices for regular flat-topped hexagon
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const angle = (Math.PI / 3) * a;
            const vx = cx + (rPx - 1.2) * Math.cos(angle);
            const vy = cy + (rPx - 1.2) * Math.sin(angle);
            if (a === 0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
          }
          ctx.closePath();

          // Cell Fill
          if (isOrigin) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
          } else if (isCochannel) {
            ctx.fillStyle = 'rgba(255, 183, 3, 0.35)';
          } else if (isSameGroupAsOrigin) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.22)';
          } else {
            ctx.fillStyle = color;
            ctx.globalAlpha = isHovered ? 0.3 : 0.12;
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }

          if (isOrigin || isCochannel || isSameGroupAsOrigin) {
            ctx.fill();
          }

          // Cell Stroke
          if (isOrigin) {
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2.5;
          } else if (isCochannel) {
            ctx.strokeStyle = '#ffb703';
            ctx.lineWidth = 2.2;
          } else if (isHovered) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.0;
          } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.0;
          }
          ctx.stroke();

          // Sectoring partitions
          if (exp === 'sector120') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, cy - (rPx - 1.2));
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx - (rPx - 1.2) * 0.866, cy + (rPx - 1.2) * 0.5);
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + (rPx - 1.2) * 0.866, cy + (rPx - 1.2) * 0.5);
            ctx.stroke();
          } else if (exp === 'sector60') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - (rPx - 1.2), cy);
            ctx.lineTo(cx + (rPx - 1.2), cy);
            ctx.moveTo(cx - (rPx - 1.2) * 0.5, cy - (rPx - 1.2) * 0.866);
            ctx.lineTo(cx + (rPx - 1.2) * 0.5, cy + (rPx - 1.2) * 0.866);
            ctx.moveTo(cx - (rPx - 1.2) * 0.5, cy + (rPx - 1.2) * 0.866);
            ctx.lineTo(cx + (rPx - 1.2) * 0.5, cy - (rPx - 1.2) * 0.866);
            ctx.stroke();
          }

          // Base Station Center Dot
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(2, rPx * 0.08), 0, Math.PI * 2);
          ctx.fillStyle = isOrigin ? '#00e5ff' : isCochannel ? '#ffb703' : color;
          ctx.fill();

          // Cell Labels
          if (ch10State.showLabels && rPx >= 18) {
            ctx.font = `700 ${Math.max(9, Math.min(13, rPx * 0.36))}px monospace`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isOrigin) {
              ctx.fillText('REF A', cx, cy - (rPx > 28 ? 6 : 0));
              if (rPx > 28) {
                ctx.font = '8px monospace';
                ctx.fillStyle = '#00e5ff';
                ctx.fillText(`(f1)`, cx, cy + 6);
              }
            } else if (isCochannel) {
              ctx.fillText(`A (${clusterId})`, cx, cy - (rPx > 28 ? 6 : 0));
              if (rPx > 28) {
                ctx.font = '8px monospace';
                ctx.fillStyle = '#ffb703';
                ctx.fillText(`REUSED`, cx, cy + 6);
              }
            } else {
              ctx.fillText(`${clusterId}`, cx, cy);
            }
          }
        }
      }

      // Draw Step-by-Step (i, j) Cochannel Vector Walk
      if (ch10State.showVectorWalk && (i > 0 || j > 0)) {
        const pOrigin = axialToPixel(0, 0);
        const pStep1 = axialToPixel(i, 0);
        const pTarget = axialToPixel(i, j);

        // 1. Step 1 Arrow: Move i cells along primary axis (q-axis)
        if (i > 0) {
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(pOrigin.x, pOrigin.y);
          ctx.lineTo(pStep1.x, pStep1.y);
          ctx.stroke();

          // Step 1 Arrowhead
          const headAngle = Math.atan2(pStep1.y - pOrigin.y, pStep1.x - pOrigin.x);
          ctx.fillStyle = '#00e5ff';
          ctx.beginPath();
          ctx.moveTo(pStep1.x, pStep1.y);
          ctx.lineTo(pStep1.x - 12 * Math.cos(headAngle - Math.PI / 6), pStep1.y - 12 * Math.sin(headAngle - Math.PI / 6));
          ctx.lineTo(pStep1.x - 12 * Math.cos(headAngle + Math.PI / 6), pStep1.y - 12 * Math.sin(headAngle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();

          // Step 1 Label Badge
          ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
          ctx.fillRect((pOrigin.x + pStep1.x) / 2 - 45, (pOrigin.y + pStep1.y) / 2 - 20, 90, 18);
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1;
          ctx.strokeRect((pOrigin.x + pStep1.x) / 2 - 45, (pOrigin.y + pStep1.y) / 2 - 20, 90, 18);
          ctx.fillStyle = '#00e5ff';
          ctx.font = '700 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`STEP 1: i = ${i}`, (pOrigin.x + pStep1.x) / 2, (pOrigin.y + pStep1.y) / 2 - 11);
        }

        // 2. Step 2 Turn Arc: 60° counter-clockwise rotation at cell (i, 0)
        if (i > 0 && j > 0) {
          ctx.strokeStyle = '#ffb703';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(pStep1.x, pStep1.y, rPx * 0.6, 0, Math.PI / 3, false);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#ffb703';
          ctx.font = '700 8.5px monospace';
          ctx.textAlign = 'left';
          ctx.fillText('TURN 60° CCW', pStep1.x + rPx * 0.7, pStep1.y + 4);
        }

        // 3. Step 3 Arrow: Move j cells in the 60° turned direction
        if (j > 0) {
          ctx.strokeStyle = '#00ff9d';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(pStep1.x, pStep1.y);
          ctx.lineTo(pTarget.x, pTarget.y);
          ctx.stroke();

          // Step 3 Arrowhead
          const headAngle = Math.atan2(pTarget.y - pStep1.y, pTarget.x - pStep1.x);
          ctx.fillStyle = '#00ff9d';
          ctx.beginPath();
          ctx.moveTo(pTarget.x, pTarget.y);
          ctx.lineTo(pTarget.x - 12 * Math.cos(headAngle - Math.PI / 6), pTarget.y - 12 * Math.sin(headAngle - Math.PI / 6));
          ctx.lineTo(pTarget.x - 12 * Math.cos(headAngle + Math.PI / 6), pTarget.y - 12 * Math.sin(headAngle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();

          // Step 3 Label Badge
          ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
          ctx.fillRect((pStep1.x + pTarget.x) / 2 + 10, (pStep1.y + pTarget.y) / 2 - 10, 90, 18);
          ctx.strokeStyle = '#00ff9d';
          ctx.lineWidth = 1;
          ctx.strokeRect((pStep1.x + pTarget.x) / 2 + 10, (pStep1.y + pTarget.y) / 2 - 10, 90, 18);
          ctx.fillStyle = '#00ff9d';
          ctx.font = '700 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`STEP 2: j = ${j}`, (pStep1.x + pTarget.x) / 2 + 55, (pStep1.y + pTarget.y) / 2 - 1);
        }

        // 4. Direct Euclidean Cochannel Vector D (Origin -> Target)
        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pOrigin.x, pOrigin.y);
        ctx.lineTo(pTarget.x, pTarget.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Direct Distance D Label Badge
        const D_km = R_km * Math.sqrt(3 * N);
        ctx.fillStyle = 'rgba(3, 7, 18, 0.92)';
        ctx.fillRect((pOrigin.x + pTarget.x) / 2 - 55, (pOrigin.y + pTarget.y) / 2 + 8, 110, 20);
        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 1.2;
        ctx.strokeRect((pOrigin.x + pTarget.x) / 2 - 55, (pOrigin.y + pTarget.y) / 2 + 8, 110, 20);
        ctx.fillStyle = '#ffb703';
        ctx.font = '700 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`D = ${D_km.toFixed(2)} km`, (pOrigin.x + pTarget.x) / 2, (pOrigin.y + pTarget.y) / 2 + 18);

        // Highlight All 6 First-Tier Cochannel Neighbors with Dashed Connecting Hexagon Ring
        ctx.strokeStyle = 'rgba(255, 183, 3, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        cochannelNeighbors.forEach((cochan, idx) => {
          const pt = axialToPixel(cochan.q, cochan.r);
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    };

    const updateHexMathCalculations = () => {
      const i = ch10State.paramI;
      const j = ch10State.paramJ;
      const N = i * i + j * j + i * j;
      ch10State.reuseN = N;
      const R_km = ch10State.cellRadiusKm;

      const d_km = Math.sqrt(3) * R_km;
      const D_km = R_km * Math.sqrt(3 * N);
      const ratio = Math.sqrt(3 * N);
      const area_km2 = 1.5 * Math.sqrt(3) * Math.pow(R_km, 2);

      // Signal-to-Interference approximation for gamma = 4 with 6 cochannel cells
      const sirLin = Math.pow(ratio, 4) / 6;
      const sirDb = 10 * Math.log10(Math.max(1, sirLin));

      if (vI) vI.textContent = `i = ${i}`;
      if (vJ) vJ.textContent = `j = ${j}`;
      if (vN) vN.textContent = `N = ${N} (i=${i}, j=${j})`;
      if (vR) vR.textContent = `${R_km.toFixed(1)} km`;

      if (outD) outD.textContent = `${d_km.toFixed(2)} km`;
      if (outCochan) outCochan.textContent = `${D_km.toFixed(2)} km`;
      if (outRatio) outRatio.textContent = `Normalized D/d = √${N} ≈ ${Math.sqrt(N).toFixed(2)}`;
      if (outArea) outArea.textContent = `${area_km2.toFixed(2)} km²`;
      if (outSir) outSir.textContent = `Worst-case S/I ≈ ${sirDb.toFixed(1)} dB (γ=4)`;
      if (outFactor) outFactor.textContent = `1 / ${N} (${((1 / N) * 100).toFixed(1)}%)`;
      if (outCapNote) outCapNote.textContent = `Channels per cell K = Total / ${N}`;

      // Update interactive tooltips dynamic formula calculations
      if (tipCalcI) {
        tipCalcI.innerHTML = `Currently: <strong>i = ${i}</strong> &rarr; contributes <strong>i² = ${i * i}</strong> and <strong>ij = ${i * j}</strong> to N = ${N} (Reuse Factor = 1/${N} &asymp; ${((1 / N) * 100).toFixed(1)}%)`;
      }
      if (tipCalcJ) {
        tipCalcJ.innerHTML = `Currently: <strong>j = ${j}</strong> &rarr; contributes <strong>j² = ${j * j}</strong> and <strong>ij = ${i * j}</strong> to N = ${N} (Reuse Factor = 1/${N} &asymp; ${((1 / N) * 100).toFixed(1)}%)`;
      }

      // Update dropdown selection if matching preset
      if (selN) {
        const matchingOpt = Array.from(selN.options).find(opt => Number(opt.value) === N);
        if (matchingOpt) selN.value = String(N);
      }

      drawHexGrid();
    };

    // Interactive tooltips toggle and outside-click dismissal
    const toggleTip = (which) => {
      if (which === 'i') {
        const isShown = tipBoxI && tipBoxI.style.display === 'block';
        if (tipBoxI) tipBoxI.style.display = isShown ? 'none' : 'block';
        if (btnTipI) {
          btnTipI.classList.toggle('active', !isShown);
          btnTipI.setAttribute('aria-expanded', !isShown ? 'true' : 'false');
        }
        if (tipBoxJ) tipBoxJ.style.display = 'none';
        if (btnTipJ) {
          btnTipJ.classList.remove('active');
          btnTipJ.setAttribute('aria-expanded', 'false');
        }
      } else {
        const isShown = tipBoxJ && tipBoxJ.style.display === 'block';
        if (tipBoxJ) tipBoxJ.style.display = isShown ? 'none' : 'block';
        if (btnTipJ) {
          btnTipJ.classList.toggle('active', !isShown);
          btnTipJ.setAttribute('aria-expanded', !isShown ? 'true' : 'false');
        }
        if (tipBoxI) tipBoxI.style.display = 'none';
        if (btnTipI) {
          btnTipI.classList.remove('active');
          btnTipI.setAttribute('aria-expanded', 'false');
        }
      }
    };

    if (btnTipI) btnTipI.addEventListener('click', (e) => { e.stopPropagation(); toggleTip('i'); });
    if (btnTipJ) btnTipJ.addEventListener('click', (e) => { e.stopPropagation(); toggleTip('j'); });
    if (btnCloseTipI) btnCloseTipI.addEventListener('click', (e) => { e.stopPropagation(); toggleTip('i'); });
    if (btnCloseTipJ) btnCloseTipJ.addEventListener('click', (e) => { e.stopPropagation(); toggleTip('j'); });

    if (tipBoxI) tipBoxI.addEventListener('click', (e) => e.stopPropagation());
    if (tipBoxJ) tipBoxJ.addEventListener('click', (e) => e.stopPropagation());

    const handleOutsideTipClick = (e) => {
      if (tipBoxI && !tipBoxI.contains(e.target) && btnTipI && !btnTipI.contains(e.target)) {
        tipBoxI.style.display = 'none';
        if (btnTipI) { btnTipI.classList.remove('active'); btnTipI.setAttribute('aria-expanded', 'false'); }
      }
      if (tipBoxJ && !tipBoxJ.contains(e.target) && btnTipJ && !btnTipJ.contains(e.target)) {
        tipBoxJ.style.display = 'none';
        if (btnTipJ) { btnTipJ.classList.remove('active'); btnTipJ.setAttribute('aria-expanded', 'false'); }
      }
    };
    document.addEventListener('click', handleOutsideTipClick);

    // Sliders for i and j
    if (sI) {
      sI.addEventListener('input', (e) => {
        ch10State.paramI = Number(e.target.value);
        updateHexMathCalculations();
      });
    }

    if (sJ) {
      sJ.addEventListener('input', (e) => {
        ch10State.paramJ = Number(e.target.value);
        updateHexMathCalculations();
      });
    }

    // Cluster preset dropdown
    if (selN) {
      selN.addEventListener('change', (e) => {
        const val = Number(e.target.value);
        if (val === 1) { ch10State.paramI = 1; ch10State.paramJ = 0; }
        else if (val === 3) { ch10State.paramI = 1; ch10State.paramJ = 1; }
        else if (val === 4) { ch10State.paramI = 2; ch10State.paramJ = 0; }
        else if (val === 7) { ch10State.paramI = 2; ch10State.paramJ = 1; }
        else if (val === 9) { ch10State.paramI = 3; ch10State.paramJ = 0; }
        else if (val === 12) { ch10State.paramI = 2; ch10State.paramJ = 2; }
        else if (val === 13) { ch10State.paramI = 3; ch10State.paramJ = 1; }
        else if (val === 19) { ch10State.paramI = 3; ch10State.paramJ = 2; }

        if (sI) sI.value = String(ch10State.paramI);
        if (sJ) sJ.value = String(ch10State.paramJ);
        updateHexMathCalculations();
      });
    }

    // Dynamic radius slider
    if (sR) {
      sR.addEventListener('input', (e) => {
        ch10State.cellRadiusKm = Number(e.target.value);
        updateHexMathCalculations();
      });
    }

    // Sectoring dropdown
    if (selExp) {
      selExp.addEventListener('change', (e) => {
        ch10State.sectoring = e.target.value;
        if (vExp) vExp.textContent = selExp.options[selExp.selectedIndex].text;
        drawHexGrid();
      });
    }

    // Quick Step-Pan Helper for Navigation through large cellular deployments
    const panBy = (dx, dy) => {
      ch10State.gridPanX += dx;
      ch10State.gridPanY += dy;
      drawHexGrid();
      if (hoverInfo) {
        hoverInfo.textContent = `🖐 Grid Panned: (${ch10State.gridPanX > 0 ? '+' : ''}${Math.round(ch10State.gridPanX)}px, ${ch10State.gridPanY > 0 ? '+' : ''}${Math.round(ch10State.gridPanY)}px) | Zoom ${(ch10State.gridZoom * 100).toFixed(0)}%`;
      }
    };

    if (btnPanLeft) btnPanLeft.addEventListener('click', () => panBy(120, 0));
    if (btnPanRight) btnPanRight.addEventListener('click', () => panBy(-120, 0));
    if (btnPanUp) btnPanUp.addEventListener('click', () => panBy(0, 100));
    if (btnPanDown) btnPanDown.addEventListener('click', () => panBy(0, -100));

    // Toolbar buttons
    if (btnWalk) {
      btnWalk.addEventListener('click', () => {
        ch10State.showVectorWalk = !ch10State.showVectorWalk;
        btnWalk.classList.toggle('active', ch10State.showVectorWalk);
        btnWalk.textContent = ch10State.showVectorWalk ? '🚶 (i,j) WALK: ON' : '🚶 (i,j) WALK: OFF';
        drawHexGrid();
      });
    }

    if (btnLabels) {
      btnLabels.addEventListener('click', () => {
        ch10State.showLabels = !ch10State.showLabels;
        btnLabels.classList.toggle('active', ch10State.showLabels);
        btnLabels.textContent = ch10State.showLabels ? '🏷️ LABELS: ON' : '🏷️ LABELS: OFF';
        drawHexGrid();
      });
    }

    if (btnZin) {
      btnZin.addEventListener('click', () => {
        ch10State.gridZoom = Math.min(3.0, ch10State.gridZoom * 1.25);
        drawHexGrid();
      });
    }

    if (btnZout) {
      btnZout.addEventListener('click', () => {
        ch10State.gridZoom = Math.max(0.35, ch10State.gridZoom * 0.8);
        drawHexGrid();
      });
    }

    if (btnCenter) {
      btnCenter.addEventListener('click', () => {
        ch10State.gridPanX = 0;
        ch10State.gridPanY = 0;
        drawHexGrid();
        if (hoverInfo) hoverInfo.textContent = 'Centered at origin Reference Cell A (0, 0)';
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        ch10State.gridPanX = 0;
        ch10State.gridPanY = 0;
        ch10State.gridZoom = 1.0;
        drawHexGrid();
        if (hoverInfo) hoverInfo.textContent = 'View reset: Origin (0,0) | Zoom 100%';
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Interactive Mouse & Touch Dragging on the Canvas-Based Grid Generator
    // Allows seamless navigation through large cellular deployment simulations
    // ─────────────────────────────────────────────────────────────────────────
    const startDrag = (cx, cy) => {
      isDragging = true;
      dragStartX = cx;
      dragStartY = cy;
      dragStartPanX = ch10State.gridPanX;
      dragStartPanY = ch10State.gridPanY;
      if (canvas) canvas.classList.add('is-dragging');
      if (canvasWrapper) canvasWrapper.classList.add('is-panning');
    };

    const moveDrag = (cx, cy) => {
      if (!isDragging) return;
      const dx = cx - dragStartX;
      const dy = cy - dragStartY;
      ch10State.gridPanX = dragStartPanX + dx;
      ch10State.gridPanY = dragStartPanY + dy;
      drawHexGrid();
      if (hoverInfo) {
        hoverInfo.textContent = `🖐 Panning Deployment: (${ch10State.gridPanX > 0 ? '+' : ''}${Math.round(ch10State.gridPanX)}px, ${ch10State.gridPanY > 0 ? '+' : ''}${Math.round(ch10State.gridPanY)}px) | Zoom ${(ch10State.gridZoom * 100).toFixed(0)}%`;
      }
    };

    const stopDrag = () => {
      if (isDragging) {
        isDragging = false;
        if (canvas) canvas.classList.remove('is-dragging');
        if (canvasWrapper) canvasWrapper.classList.remove('is-panning');
      }
    };

    if (canvas && canvasWrapper) {
      // Mouse down to begin panning
      canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
          startDrag(e.clientX, e.clientY);
        }
      });

      // Window mousemove handles both active drag and cell hover inspection
      window.addEventListener('mousemove', (e) => {
        if (isDragging) {
          moveDrag(e.clientX, e.clientY);
        } else if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
            const originX = rect.width / 2 + ch10State.gridPanX;
            const originY = rect.height / 2 + ch10State.gridPanY;
            const baseRpx = 20 + (ch10State.cellRadiusKm - 0.5) * 11;
            const rPx = baseRpx * ch10State.gridZoom;

            const px = mouseX - originX;
            const py = mouseY - originY;

            // Flat-topped axial round
            const fracQ = ((Math.sqrt(3) / 3) * px - (1 / 3) * py) / rPx;
            const fracR = ((2 / 3) * py) / rPx;
            const fracS = -fracQ - fracR;

            let rx = Math.round(fracQ);
            let ry = Math.round(fracR);
            let rz = Math.round(fracS);

            const xDiff = Math.abs(rx - fracQ);
            const yDiff = Math.abs(ry - fracR);
            const zDiff = Math.abs(rz - fracS);

            if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
            else if (yDiff > zDiff) ry = -rx - rz;

            hoveredCell = { q: rx, r: ry };
            const clusterId = getCellClusterId(rx, ry, ch10State.paramI, ch10State.paramJ, ch10State.reuseN);
            const isOrigin = (rx === 0 && ry === 0);
            const isCochannel = getFirstTierCochannelCoords(ch10State.paramI, ch10State.paramJ).some(c => c.q === rx && c.r === ry);

            if (hoverInfo) {
              const distKm = (Math.sqrt(rx * rx + ry * ry + rx * ry) * Math.sqrt(3) * ch10State.cellRadiusKm).toFixed(1);
              hoverInfo.textContent = isOrigin
                ? `Reference Cell A (0, 0) | Group 1 | Center of Cluster`
                : isCochannel
                ? `Cochannel Cell A (${rx}, ${ry}) | Group 1 Reused | D = ${(ch10State.cellRadiusKm * Math.sqrt(3 * ch10State.reuseN)).toFixed(2)} km`
                : `Cell (${rx}, ${ry}) | Frequency Group ${clusterId} of ${ch10State.reuseN} | Dist ~${distKm} km`;
            }
          }
        }
      });

      window.addEventListener('mouseup', stopDrag);

      // Touch drag navigation for tablets and mobile devices
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
          moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      window.addEventListener('touchend', stopDrag);

      // Mouse wheel zoom centered on grid
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        ch10State.gridZoom = Math.max(0.35, Math.min(3.5, ch10State.gridZoom * factor));
        drawHexGrid();
        if (hoverInfo) {
          hoverInfo.textContent = `🔍 Zoom: ${(ch10State.gridZoom * 100).toFixed(0)}% | Pan (${ch10State.gridPanX > 0 ? '+' : ''}${Math.round(ch10State.gridPanX)}px, ${ch10State.gridPanY > 0 ? '+' : ''}${Math.round(ch10State.gridPanY)}px)`;
        }
      }, { passive: false });
    }

    // Initial render
    updateHexMathCalculations();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10.2: 1G AMPS ANALOG VOICE & FM MODULATION LABORATORY
  // ─────────────────────────────────────────────────────────────────────────────
  if (secId === 'sec-10.amps') {
    const canvas = container.querySelector('#amps-wave-canvas');
    const sFm = container.querySelector('#amps-slider-fm');
    const sDev = container.querySelector('#amps-slider-dev');
    const selCh = container.querySelector('#amps-select-ch');
    const sNoise = container.querySelector('#amps-slider-noise');
    const btnPlay = container.querySelector('#btn-amps-play');

    const vFm = container.querySelector('#amps-val-fm');
    const vDev = container.querySelector('#amps-val-dev');
    const vCh = container.querySelector('#amps-val-ch');
    const vNoise = container.querySelector('#amps-val-noise');
    const outCarson = container.querySelector('#amps-out-carson');

    let ampsTime = 0;
    let lastTs = performance.now();

    const animateAmpsWave = (ts) => {
      const dt = Math.max(0.001, Math.min(0.1, (ts - lastTs) / 1000));
      lastTs = ts;

      if (ch10State.ampsPlaying) {
        ampsTime += dt;
      }

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          const w = rect.width || 800;
          const h = rect.height || 200;

          if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
          }

          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, w, h);

          // Dark radar oscilloscope background
          ctx.fillStyle = '#01080e';
          ctx.fillRect(0, 0, w, h);

          // Subtle green/cyan grid lines
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
          ctx.lineWidth = 1;
          for (let gx = 0; gx < w; gx += 40) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
          }
          for (let gy = 0; gy < h; gy += 30) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
          }

          // Center zero-crossing axes
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
          ctx.beginPath();
          ctx.moveTo(0, h * 0.28); ctx.lineTo(w, h * 0.28); // voice zero
          ctx.moveTo(0, h * 0.72); ctx.lineTo(w, h * 0.72); // fm carrier zero
          ctx.stroke();

          // Labels
          ctx.font = '700 9px monospace';
          ctx.fillStyle = '#00e5ff';
          ctx.fillText('1. BASEBAND SPEECH AUDIO m(t)', 12, 18);
          ctx.fillStyle = '#ffb703';
          ctx.fillText('2. MODULATED FM RF CARRIER s(t) [30 kHz CHANNEL]', 12, h * 0.52);

          const fmNorm = ch10State.ampsVoiceFreq / 1000; // 0.3 to 3.0
          const devNorm = ch10State.ampsDevKhz / 12; // 0.16 to 1.0
          const noiseLevel = ch10State.ampsNoise;

          // 1. Draw Baseband Voice Wave m(t) in Cyan
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          for (let x = 0; x < w; x++) {
            const t = (x / w) * 0.02 + ampsTime * 0.5;
            const speechAmp = Math.sin(2 * Math.PI * fmNorm * t * 15) * 22;
            const y = h * 0.28 - speechAmp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // 2. Draw Modulated FM Carrier s(t) in Gold
          ctx.strokeStyle = '#ffb703';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          let phase = ampsTime * 40;
          for (let x = 0; x < w; x++) {
            const frac = x / w;
            const t = frac * 0.02 + ampsTime * 0.5;
            // Instantaneous frequency varies with speech tone m(t)!
            const voiceMod = Math.sin(2 * Math.PI * fmNorm * t * 15) * devNorm * 4.5;
            const carrierFreq = 35 + voiceMod;
            phase += carrierFreq * (0.02 / w) * 12;

            const noise = (Math.random() - 0.5) * 16 * noiseLevel;
            const y = h * 0.72 - Math.cos(phase) * 26 + noise;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          ctx.restore();
        }
      }

      if (ch10State.ampsPlaying) {
        activeAmpsRaf = requestAnimationFrame(animateAmpsWave);
      }
    };

    const updateAmpsUi = () => {
      const fm = ch10State.ampsVoiceFreq;
      const dev = ch10State.ampsDevKhz;
      const carson = 2 * (dev + fm / 1000);

      if (vFm) vFm.textContent = `${fm} Hz`;
      if (vDev) vDev.textContent = `${dev} kHz (Max AMPS)`;
      if (outCarson) outCarson.textContent = carson.toFixed(1);

      if (!activeAmpsRaf && ch10State.ampsPlaying) {
        lastTs = performance.now();
        activeAmpsRaf = requestAnimationFrame(animateAmpsWave);
      }
    };

    if (sFm) {
      sFm.addEventListener('input', (e) => {
        ch10State.ampsVoiceFreq = Number(e.target.value);
        updateAmpsUi();
      });
    }

    if (sDev) {
      sDev.addEventListener('input', (e) => {
        ch10State.ampsDevKhz = Number(e.target.value);
        updateAmpsUi();
      });
    }

    if (selCh) {
      selCh.addEventListener('change', (e) => {
        ch10State.ampsChannel = Number(e.target.value);
        if (vCh) vCh.textContent = selCh.options[selCh.selectedIndex].text.split('—')[0].trim();
      });
    }

    if (sNoise) {
      sNoise.addEventListener('input', (e) => {
        ch10State.ampsNoise = Number(e.target.value) / 100;
        if (vNoise) vNoise.textContent = `${e.target.value}% ${e.target.value > 15 ? 'High Noise' : 'Low Noise'}`;
      });
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        ch10State.ampsPlaying = !ch10State.ampsPlaying;
        btnPlay.textContent = ch10State.ampsPlaying ? '⏸ PAUSE' : '▶ PLAY';
        btnPlay.classList.toggle('active', ch10State.ampsPlaying);
        if (ch10State.ampsPlaying) {
          lastTs = performance.now();
          activeAmpsRaf = requestAnimationFrame(animateAmpsWave);
        } else if (activeAmpsRaf) {
          cancelAnimationFrame(activeAmpsRaf);
          activeAmpsRaf = null;
        }
      });
    }

    updateAmpsUi();
    activeAmpsRaf = requestAnimationFrame(animateAmpsWave);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10.3: 2G GSM TDMA 8-SLOT & TIMING ADVANCE SIMULATION
  // ─────────────────────────────────────────────────────────────────────────────
  if (secId === 'sec-10.gsm') {
    const canvas = container.querySelector('#gsm-tdma-canvas');
    const slotStrip = container.querySelector('#gsm-slot-strip');
    const sDist = container.querySelector('#gsm-slider-dist');
    const btnTa = container.querySelector('#btn-gsm-toggle-ta');

    const vDist = container.querySelector('#gsm-val-dist');
    const vTa = container.querySelector('#gsm-val-ta');
    const vSpd = container.querySelector('#gsm-val-spd');

    const outDelay = container.querySelector('#gsm-out-delay');
    const outSteps = container.querySelector('#gsm-out-steps');
    const outStatus = container.querySelector('#gsm-out-status');

    const speedBtns = container.querySelectorAll('[data-gsmspd]');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ch10State.gsmSpeed = Number(btn.getAttribute('data-gsmspd'));
        if (vSpd) vSpd.textContent = `${ch10State.gsmSpeed}× Normal`;
      });
    });

    let gsmClock = 0;
    let lastTs = performance.now();

    const animateGsmTdma = (ts) => {
      const dt = Math.max(0.001, Math.min(0.1, (ts - lastTs) / 1000));
      lastTs = ts;

      if (ch10State.gsmPlaying) {
        gsmClock += dt * ch10State.gsmSpeed;
      }

      const distKm = ch10State.gsmDistanceKm;
      const c = 300; // 300 km/ms = 3x10^5 km/s
      const delayUs = (distKm / c) * 1000; // 1-way delay in microseconds
      const rttUs = delayUs * 2;
      const bitDurationUs = 3.692; // 1 GSM bit duration = 576.92 us / 156.25 bits
      const taSteps = Math.min(63, Math.round(rttUs / bitDurationUs));

      const taEnabled = ch10State.gsmTimingAdvanceEnabled;
      const effectiveDelayUs = taEnabled ? 0 : rttUs;
      const isColliding = !taEnabled && distKm > 2.0;

      // 8 slots cycle every 4.615 ms (scaled visually to 2.4 seconds per frame)
      const frameCycleDuration = 2.4 / ch10State.gsmSpeed;
      const cycleFrac = (gsmClock % frameCycleDuration) / frameCycleDuration;
      const activeSlotIdx = Math.floor(cycleFrac * 8);

      // Update Slot Cards in Strip
      if (slotStrip) {
        let stripHtml = '';
        const users = [
          'MS-1 Handset', 'MS-2 Handset', 'MS-3 Laptop', 'MS-4 Vehicle',
          'BCCH Beacon', 'CCCH Paging', 'SDCCH Signaling', 'Idle Guard'
        ];
        for (let s = 0; s < 8; s++) {
          const isActive = (s === activeSlotIdx);
          stripHtml += `
            <div class="gsm-slot-card ${isActive ? 'active-slot' : ''}">
              <div class="slot-header">SLOT ${s}</div>
              <div class="slot-user">${users[s]}</div>
            </div>
          `;
        }
        slotStrip.innerHTML = stripHtml;
      }

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          const w = rect.width || 800;
          const h = rect.height || 200;

          if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
          }

          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, w, h);

          ctx.fillStyle = '#01080e';
          ctx.fillRect(0, 0, w, h);

          // Top label
          ctx.font = '700 9px monospace';
          ctx.fillStyle = '#00ff9d';
          ctx.fillText(`GSM 200 kHz CARRIER — 8-SLOT FRAME TIMELINE (FRAME DURATION 4.615 ms | SLOT 577 µs)`, 12, 18);

          // Draw BTS Reception Window Box at center
          const slotWidth = w / 8;
          ctx.strokeStyle = 'rgba(0, 255, 157, 0.4)';
          ctx.lineWidth = 1;
          for (let s = 0; s < 8; s++) {
            const sx = s * slotWidth;
            ctx.strokeRect(sx, 35, slotWidth - 2, 70);

            ctx.fillStyle = s === activeSlotIdx ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(sx, 35, slotWidth - 2, 70);

            ctx.font = '700 8.5px monospace';
            ctx.fillStyle = s === activeSlotIdx ? '#00ff9d' : 'rgba(255, 255, 255, 0.4)';
            ctx.fillText(`TS ${s}`, sx + 6, 50);
          }

          // Draw Mobile Bursts Traveling to BTS Antenna
          // MS-2 is at distKm
          const burst2Slot = 1; // Assigned to Slot 1
          const nominalSlotX = burst2Slot * slotWidth;
          // Offset in pixels due to delay
          const offsetPx = (effectiveDelayUs / 577) * slotWidth;
          const burstX = nominalSlotX + offsetPx;

          // Draw MS-2 burst rectangle
          ctx.fillStyle = isColliding ? 'rgba(255, 0, 85, 0.4)' : 'rgba(0, 229, 255, 0.4)';
          ctx.strokeStyle = isColliding ? '#ff0055' : '#00e5ff';
          ctx.lineWidth = 2;
          ctx.fillRect(burstX, 45, slotWidth - 14, 50);
          ctx.strokeRect(burstX, 45, slotWidth - 14, 50);

          ctx.fillStyle = isColliding ? '#ff0055' : '#fff';
          ctx.font = '700 9px monospace';
          ctx.fillText(`MS-2 (${distKm.toFixed(1)}km)`, burstX + 6, 65);
          ctx.font = '7.5px monospace';
          ctx.fillText(taEnabled ? `TA = ${taSteps}` : `Delayed ${rttUs.toFixed(0)}µs`, burstX + 6, 80);

          // If colliding with Slot 2
          if (isColliding) {
            ctx.fillStyle = '#ff0055';
            ctx.font = '700 10px monospace';
            ctx.fillText(`⚠️ COLLISION! BURST OVERLAPS INTO SLOT 2 BY ${(rttUs / bitDurationUs).toFixed(0)} BITS!`, 12, 135);
            ctx.font = '8px monospace';
            ctx.fillStyle = '#ffb703';
            ctx.fillText(`Enable Timing Advance (TA) to command MS-2 to transmit ${(taSteps * 3.69).toFixed(1)} µs earlier!`, 12, 150);
          } else {
            ctx.fillStyle = '#00ff9d';
            ctx.font = '700 10px monospace';
            ctx.fillText(`✓ TIMING SYNCHRONIZED: Burst arrives inside Slot 1 window (TA = ${taSteps} bit periods)`, 12, 135);
            ctx.font = '8px monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillText(`1-Way Prop Delay τ = ${delayUs.toFixed(1)} µs | Round Trip = ${rttUs.toFixed(1)} µs | Guard Period = 30.5 µs`, 12, 150);
          }

          ctx.restore();
        }
      }

      activeGsmRaf = requestAnimationFrame(animateGsmTdma);
    };

    const updateGsmUi = () => {
      const distKm = ch10State.gsmDistanceKm;
      const c = 300;
      const delayUs = (distKm / c) * 1000;
      const rttUs = delayUs * 2;
      const bitDurationUs = 3.692;
      const taSteps = Math.min(63, Math.round(rttUs / bitDurationUs));
      const taEnabled = ch10State.gsmTimingAdvanceEnabled;

      if (vDist) vDist.textContent = `${distKm.toFixed(1)} km`;
      if (vTa) {
        vTa.textContent = taEnabled ? `ENABLED (TA = ${taSteps})` : `DISABLED (Collision!)`;
        vTa.style.color = taEnabled ? '#00ff9d' : '#ff0055';
      }

      if (outDelay) outDelay.textContent = `${delayUs.toFixed(1)} µs`;
      if (outSteps) outSteps.textContent = `TA = ${taSteps} bits (${(taSteps * 3.69).toFixed(1)} µs)`;
      if (outStatus) {
        if (!taEnabled && distKm > 2.0) {
          outStatus.textContent = '⚠️ COLLISION WITH SLOT 2';
          outStatus.style.color = '#ff0055';
        } else {
          outStatus.textContent = '✓ PERFECTLY SYNCHRONIZED';
          outStatus.style.color = '#00ff9d';
        }
      }
    };

    if (sDist) {
      sDist.addEventListener('input', (e) => {
        ch10State.gsmDistanceKm = Number(e.target.value);
        updateGsmUi();
      });
    }

    if (btnTa) {
      btnTa.addEventListener('click', () => {
        ch10State.gsmTimingAdvanceEnabled = !ch10State.gsmTimingAdvanceEnabled;
        btnTa.classList.toggle('active', ch10State.gsmTimingAdvanceEnabled);
        btnTa.textContent = ch10State.gsmTimingAdvanceEnabled ? '✓ TIMING ADVANCE: ENABLED' : '✗ TIMING ADVANCE: DISABLED';
        btnTa.style.borderColor = ch10State.gsmTimingAdvanceEnabled ? '#00ff9d' : '#ff0055';
        btnTa.style.color = ch10State.gsmTimingAdvanceEnabled ? '#00ff9d' : '#ff0055';
        updateGsmUi();
      });
    }

    updateGsmUi();
    activeGsmRaf = requestAnimationFrame(animateGsmTdma);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10.1.3 & 10.1.4: CALL FLOW & HANDOFF HYSTERESIS
  // ─────────────────────────────────────────────────────────────────────────────
  if (secId === 'sec-10.callflow') {
    const selStrat = container.querySelector('#ch10-select-strat');
    const sH = container.querySelector('#ch10-slider-h');
    const sSpd = container.querySelector('#ch10-slider-speed');

    const vStrat = container.querySelector('#ch10-val-strat');
    const vH = container.querySelector('#ch10-val-h');
    const vSpd = container.querySelector('#ch10-val-speed');

    const outServing = container.querySelector('#ch10-out-serving');
    const outHandstate = container.querySelector('#ch10-out-handstate');
    const outRssi = container.querySelector('#ch10-out-rssi');
    const outFlaps = container.querySelector('#ch10-out-flaps');

    const carGroup = container.querySelector('#handoff-moving-vehicle');
    const carLink = container.querySelector('#mobile-serving-link');

    let servingCell = 'A';
    let flapCount = 0;

    if (selStrat) {
      selStrat.addEventListener('change', (e) => {
        ch10State.handoffStrategy = e.target.value;
        if (vStrat) vStrat.textContent = selStrat.options[selStrat.selectedIndex].text;
        flapCount = 0;
        if (outFlaps) outFlaps.textContent = '0 Flaps';
      });
    }

    if (sH) {
      sH.addEventListener('input', (e) => {
        ch10State.handoffH = Number(e.target.value);
        if (vH) vH.textContent = `${ch10State.handoffH.toFixed(1)} dB`;
      });
    }

    if (sSpd) {
      sSpd.addEventListener('input', (e) => {
        ch10State.handoffSpeed = Number(e.target.value);
        if (vSpd) vSpd.textContent = `${ch10State.handoffSpeed} km/h`;
      });
    }

    let handoffClock = 0;
    let lastHandoffTime = performance.now();

    const animateHandoff = (ts) => {
      const dt = Math.max(0.001, Math.min(0.1, (ts - lastHandoffTime) / 1000));
      lastHandoffTime = ts;
      handoffClock += dt;

      if (!carGroup || !carLink) return;

      const speedFactor = ch10State.handoffSpeed / 60;
      const cycle = (handoffClock * speedFactor * 0.35) % 2;
      const normPos = cycle <= 1 ? cycle : (2 - cycle);
      const carX = 120 + normPos * (640 - 120);

      carGroup.setAttribute('transform', `translate(${carX.toFixed(1)}, 120)`);

      const distA_km = Math.max(0.1, (carX - 120) / 200);
      const distB_km = Math.max(0.1, (640 - carX) / 200);
      const shadowNoise = Math.sin(handoffClock * 6) * 2.0;

      const rssiA = -45 - 35 * Math.log10(distA_km) + shadowNoise;
      const rssiB = -45 - 35 * Math.log10(distB_km) - shadowNoise;

      const H = ch10State.handoffH;
      const Th = -95;
      const strat = ch10State.handoffStrategy;

      let triggerHandoff = false;
      if (servingCell === 'A') {
        if (strat === 'rel') triggerHandoff = rssiB > rssiA;
        else if (strat === 'th') triggerHandoff = rssiA < Th && rssiB > rssiA;
        else if (strat === 'h') triggerHandoff = rssiB > (rssiA + H);
        else triggerHandoff = rssiA < Th && rssiB > (rssiA + H);

        if (triggerHandoff) {
          servingCell = 'B';
          flapCount++;
        }
      } else {
        let handoffBack = false;
        if (strat === 'rel') handoffBack = rssiA > rssiB;
        else if (strat === 'th') handoffBack = rssiB < Th && rssiA > rssiB;
        else if (strat === 'h') handoffBack = rssiA > (rssiB + H);
        else handoffBack = rssiB < Th && rssiA > (rssiB + H);

        if (handoffBack) {
          servingCell = 'A';
          flapCount++;
        }
      }

      if (servingCell === 'A') {
        carLink.setAttribute('x1', carX);
        carLink.setAttribute('x2', 120);
        carLink.setAttribute('stroke', '#00e5ff');
        if (outServing) outServing.textContent = 'CELL A (BS-A)';
        if (outHandstate) {
          outHandstate.textContent = 'CONNECTED: BS-A';
          outHandstate.style.color = '#00e5ff';
        }
      } else {
        carLink.setAttribute('x1', carX);
        carLink.setAttribute('x2', 640);
        carLink.setAttribute('stroke', '#00ff9d');
        if (outServing) outServing.textContent = 'CELL B (BS-B)';
        if (outHandstate) {
          outHandstate.textContent = 'CONNECTED: BS-B';
          outHandstate.style.color = '#00ff9d';
        }
      }

      if (outRssi) outRssi.textContent = `RSSI BS-A: ${rssiA.toFixed(1)} dBm | BS-B: ${rssiB.toFixed(1)} dBm`;
      if (outFlaps) outFlaps.textContent = `${flapCount} Handoffs`;

      activeHandoffRaf = requestAnimationFrame(animateHandoff);
    };

    activeHandoffRaf = requestAnimationFrame(animateHandoff);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10.1.5: TRAFFIC ENGINEERING & MULTISERVER QUEUE
  // ─────────────────────────────────────────────────────────────────────────────
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
    const trunksSummary = container.querySelector('#erlang-trunks-summary');
    const trunksGrid = container.querySelector('#erlang-trunks-container');

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

      // Render Multiserver Trunk Bank (Stallings Fig 10.8)
      if (trunksGrid && trunksSummary) {
        const busyCount = Math.min(N, Math.round(carried));
        trunksSummary.textContent = `Occupied: ${busyCount} / ${N} Trunks (${((busyCount/N)*100).toFixed(0)}% busy)`;
        let html = '';
        for (let i = 1; i <= N; i++) {
          const isBusy = i <= busyCount;
          html += `
            <div class="server-trunk-slot ${isBusy ? 'busy' : 'idle'}">
              <span style="font-size:0.6rem; color:var(--text-dim);">TRUNK ${i}</span>
              <span style="font-weight:700;">${isBusy ? 'CALL' : 'IDLE'}</span>
              <span style="font-size:0.6rem; color:${isBusy ? 'var(--accent-cyan)' : 'var(--text-dim)'};">${isBusy ? '30 kHz' : 'FREE'}</span>
            </div>
          `;
        }
        trunksGrid.innerHTML = html;
      }
    };

    [sN, sL, sH, sU].forEach(s => {
      if (s) s.addEventListener('input', updateErlang);
    });

    updateErlang();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10.4: CDMA WALSH ORTHOGONALITY ENGINE
  // ─────────────────────────────────────────────────────────────────────────────
  if (secId === 'sec-10.cdma') {
    const selUser = container.querySelector('#walsh-select-user');
    const c1 = container.querySelector('#chk-u1');
    const c2 = container.querySelector('#chk-u2');
    const c3 = container.querySelector('#chk-u3');
    const c4 = container.querySelector('#chk-u4');
    const wave = container.querySelector('#walsh-composite-wave');
    const corText = container.querySelector('#walsh-correlator-text');

    const walsh = [
      [1, 1, 1, 1],
      [1, -1, 1, -1],
      [1, 1, -1, -1],
      [1, -1, -1, 1]
    ];

    const updateWalsh = () => {
      const activeIdx = (selUser ? Number(selUser.value) : 2) - 1;
      const chks = [c1 ? c1.checked : true, c2 ? c2.checked : true, c3 ? c3.checked : true, c4 ? c4.checked : true];

      const composite = [0, 0, 0, 0];
      for (let u = 0; u < 4; u++) {
        if (chks[u]) {
          for (let chip = 0; chip < 4; chip++) {
            composite[chip] += walsh[u][chip];
          }
        }
      }

      let innerProduct = 0;
      for (let chip = 0; chip < 4; chip++) {
        innerProduct += composite[chip] * walsh[activeIdx][chip];
      }

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

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10.5: 3G 1xEV-DO ADAPTIVE MODULATION & CODING
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10.7: QUANTITATIVE QUIZ & CALCULATIONS
  // ─────────────────────────────────────────────────────────────────────────────
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
