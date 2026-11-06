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
let activePowerRaf = null;
let activeAmpsRaf = null;
let activeGsmRaf = null;
let activeRakeRaf = null;

function cancelAllSimRafs() {
  if (activeAnimationRaf) {
    cancelAnimationFrame(activeAnimationRaf);
    activeAnimationRaf = null;
  }
  if (activeHandoffRaf) {
    cancelAnimationFrame(activeHandoffRaf);
    activeHandoffRaf = null;
  }
  if (activePowerRaf) {
    cancelAnimationFrame(activePowerRaf);
    activePowerRaf = null;
  }
  if (activeAmpsRaf) {
    cancelAnimationFrame(activeAmpsRaf);
    activeAmpsRaf = null;
  }
  if (activeGsmRaf) {
    cancelAnimationFrame(activeGsmRaf);
    activeGsmRaf = null;
  }
  if (activeRakeRaf) {
    cancelAnimationFrame(activeRakeRaf);
    activeRakeRaf = null;
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
        <button class="lesson-tab-btn ${currentSec === 'sec-10.power' ? 'active' : ''}" data-sec="sec-10.power">
          ⚡ 10.1.6 Power Control (Open vs Closed Loop)
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

  // Power Control state (Section 10.1.6, Stallings pp. 276-277)
  powerMode: 'open_loop', // 'open_loop' | 'closed_loop'
  powerMobileDistKm: 3.5, // 0.5 to 12.0 km
  powerObstaclePresent: false, // Skyscraper / building shadow fade
  powerFastFade: true,
  powerTargetRxDbm: -90.0, // Base station desired received power setpoint
  powerMobileTxDbm: 20.0, // Mobile current output power
  powerCommandsHistory: [], // Power up / down command history (+1 dB / -1 dB)

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

            <!-- In-App Stage Sizing & True Fullscreen Toolbar -->
            <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
              <!-- Stage Sizing & Fullscreen Toggle -->
              <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; font-family: var(--font-mono); font-size: 0.72rem;">
                <span style="color: var(--text-dim);">CANVAS STAGE:</span>
                <button class="btn-ctrl" id="btn-size-compact" title="Compact Stage Height (380px)">📏 380px</button>
                <button class="btn-ctrl active" id="btn-size-standard" title="Standard Spacious Stage (520px)">📐 520px</button>
                <button class="btn-ctrl" id="btn-size-cinema" title="Cinematic Expanded Stage (700px)">⛶ 700px</button>
                <button class="btn-ctrl" id="btn-true-fullscreen" style="background: linear-gradient(135deg, rgba(0,229,255,0.25), rgba(0,112,243,0.3)); border-color: var(--accent-cyan); color: #fff; font-weight: 700; box-shadow: 0 0 12px rgba(0,229,255,0.35);" title="Enter Full Screen mode with expanded coordinate system where BTS tower and mobiles are placed much further apart">
                  ⛶ FULL SCREEN MODE (EXPAND VIEW)
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

              <!-- Multi-Device Subscriber Load Option with Own Distinct Frequencies -->
              <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
                <span style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">MOBILES (OWN FREQS):</span>
                <button class="btn-ctrl active" id="btn-dev-1" title="1 Device: MS-1 Phone on f1 = 825.03 MHz">1 PHONE (f1)</button>
                <button class="btn-ctrl" id="btn-dev-2" title="2 Mobiles: MS-1 (f1: 825.03M) + MS-2 (f2: 825.06M) on separate channels">2 PHONES (f1, f2)</button>
                <button class="btn-ctrl" id="btn-dev-3" title="3 Devices: Phone 1 + Phone 2 + Remote Laptop in different area on f3: 825.09M">3 DEVICES (+LAPTOP f3)</button>
                <button class="btn-ctrl" id="btn-dev-4" title="4 Devices: Phone + Phone + Laptop + Highway Car on f4: 825.12M">4 USERS (+CAR f4)</button>
                <button class="btn-ctrl" id="btn-dev-8" title="8 Channels: Full 8-channel carrier capacity">8 FULL CARRIER</button>
              </div>
            </div>

            <!-- Main Interactive Cellular Viewport Container with Mouse Drag & Wheel Zoom -->
            <div class="canvas-viewport-container size-standard" id="canvas-container-box">
              <!-- Dedicated Top Bar shown in True Full-Screen Mode with Complete Interactive Controls -->
              <div class="fullscreen-top-bar" id="sim-fullscreen-top-bar" style="flex-wrap: wrap; gap: 8px; padding: 6px 12px;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span style="color: var(--accent-cyan); font-weight: 700; font-size: 0.82rem;">📡 FULLSCREEN SIMULATOR</span>
                  
                  <!-- Transport Controls -->
                  <div style="display: flex; gap: 4px; align-items: center;">
                    <button class="btn-ctrl active" id="btn-fs-play" style="font-size:0.68rem; padding:3px 8px;">⏸ PAUSE</button>
                    <button class="btn-ctrl" id="btn-fs-step" style="font-size:0.68rem; padding:3px 7px;">⏭ STEP</button>
                    <button class="btn-ctrl" id="btn-fs-reset" style="font-size:0.68rem; padding:3px 7px;">↺ RESET</button>
                  </div>

                  <!-- Access Mode Selector -->
                  <div style="display: flex; gap: 3px; align-items: center; margin-left: 4px;">
                    <button class="btn-ctrl active" id="btn-fs-fdma" style="font-size:0.68rem; padding:3px 7px;">1G FDMA</button>
                    <button class="btn-ctrl" id="btn-fs-tdma" style="font-size:0.68rem; padding:3px 7px;">2G TDMA</button>
                    <button class="btn-ctrl" id="btn-fs-cdma" style="font-size:0.68rem; padding:3px 7px;">2G CDMA</button>
                  </div>
                </div>

                <!-- Frequency Badges & Mobile Device Sizing (with Overload Blocking) -->
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-left: auto;">
                  <span class="fs-freq-badge">Uplink: <strong id="fs-badge-uplink">825.03 MHz</strong></span>
                  <span class="fs-freq-badge">Duplex: <strong id="fs-badge-duplex">45.0 MHz</strong></span>
                  <span class="fs-freq-badge">Downlink: <strong id="fs-badge-downlink">870.03 MHz</strong></span>

                  <!-- Mobile Device Load with Overload -->
                  <div style="display: flex; gap: 3px;" id="fs-user-quick-btns">
                    <button class="btn-ctrl active" data-fs-count="1" style="font-size:0.68rem; padding:3px 6px;">1 MS</button>
                    <button class="btn-ctrl" data-fs-count="2" style="font-size:0.68rem; padding:3px 6px;">2 PHONES</button>
                    <button class="btn-ctrl" data-fs-count="4" style="font-size:0.68rem; padding:3px 6px;">4 USERS</button>
                    <button class="btn-ctrl" data-fs-count="8" style="font-size:0.68rem; padding:3px 6px; color:#ffb703; border-color:#ffb703;" title="8 Mobiles > 4 Tower Channels: Demonstrates Erlang B Call Blocking!">8 MS (OVERLOAD)</button>
                    <button class="btn-ctrl" data-fs-count="12" style="font-size:0.68rem; padding:3px 6px; color:#ff0055; border-color:#ff0055;" title="12 Mobiles: Heavy Congestion!">12 MS (HEAVY)</button>
                  </div>

                  <button class="btn-fullscreen-exit" id="btn-exit-fullscreen-top" title="Exit Fullscreen (Esc)" style="font-size:0.68rem; padding:4px 8px;">
                    ✕ EXIT (ESC)
                  </button>
                </div>

                <!-- Live Current Step & Action Description Banner in Fullscreen -->
                <div style="width: 100%; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(0,229,255,0.15); padding-top: 4px; margin-top: 2px;">
                  <div style="font-family: var(--font-mono); font-size: 0.72rem; color: #00ff9d;" id="fs-action-banner">
                    ACTION: Stage 0 (Mobile Transmission on CH 1 & CH 2) → Radiating to Base Station Tower
                  </div>
                  <span id="fs-hud-status" style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.7rem;">● EXPANDED 2600 × 850 CANVAS</span>
                </div>
              </div>

              <!-- Floating Pan/Zoom Navigation Toolbar -->
              <div style="position: absolute; top: 12px; left: 14px; display: flex; gap: 6px; align-items: center; z-index: 10; flex-wrap: wrap;">
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
              <button class="canvas-tool-btn btn-fullscreen-exit" id="btn-floating-minimize" style="display: none; position: absolute; top: 12px; right: 340px; z-index: 15;" title="Exit full screen or restore standard height (Esc)">
                ✕ EXIT FULL SCREEN (ESC)
              </button>

              <!-- Live Tower Load & Capacity HUD Overlay -->
              <div style="position: absolute; top: 12px; right: 14px; max-width: 310px; background: rgba(3, 7, 18, 0.94); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 10px; font-family: var(--font-mono); font-size: 0.72rem; z-index: 10;" id="tower-capacity-hud">
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
                  <span id="sim-tdma-active-slot-txt" style="color: var(--accent-cyan);">Active Slot: TS 1 (MS-1 Normal Burst Transmitting)</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;" id="sim-tdma-slots-hud-grid">
                  <!-- Generated dynamically: Slot 0..7 -->
                </div>
              </div>

              <!-- Widescreen SVG Viewport with Full Pan & Zoom and Dynamic Coordinate Reinitialization -->
              <svg viewBox="0 0 2000 640" preserveAspectRatio="xMidYMid meet" id="iso-cellular-svg">
                <defs>
                  <!-- Ground Grid Pattern -->
                  <pattern id="iso-ground-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 229, 255, 0.05)" stroke-width="0.8"/>
                    <circle cx="0" cy="0" r="1" fill="rgba(0, 229, 255, 0.2)"/>
                  </pattern>

                  <!-- Large Blue Coverage Sector Radial Glow -->
                  <radialGradient id="bs-coverage-radial-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#0070f3" stop-opacity="0.16"/>
                    <stop offset="45%" stop-color="#00e5ff" stop-opacity="0.08"/>
                    <stop offset="75%" stop-color="#38bdf8" stop-opacity="0.03"/>
                    <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
                  </radialGradient>

                  <!-- Distinct Carrier Wave Gradients for Each Mobile -->
                  <linearGradient id="wave-grad-ms1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00e5ff" stop-opacity="1.0"/>
                    <stop offset="100%" stop-color="#0070f3" stop-opacity="0.85"/>
                  </linearGradient>

                  <linearGradient id="wave-grad-ms2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#c084fc" stop-opacity="1.0"/>
                    <stop offset="100%" stop-color="#a855f7" stop-opacity="0.85"/>
                  </linearGradient>

                  <linearGradient id="wave-grad-ms3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00ff9d" stop-opacity="1.0"/>
                    <stop offset="100%" stop-color="#059669" stop-opacity="0.85"/>
                  </linearGradient>

                  <linearGradient id="wave-grad-ms4" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#ffb703" stop-opacity="1.0"/>
                    <stop offset="100%" stop-color="#ea580c" stop-opacity="0.85"/>
                  </linearGradient>

                  <linearGradient id="wave-grad-downlink" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00ff9d" stop-opacity="1.0"/>
                    <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.85"/>
                  </linearGradient>
                </defs>

                <!-- Ground Background & Grid -->
                <rect id="iso-bg-rect" width="3000" height="1200" fill="#030712"/>
                <rect id="iso-bg-grid" width="3000" height="1200" fill="url(#iso-ground-grid)"/>

                <!-- LARGE BLUE SCREEN BASE STATION CELL COVERAGE SECTOR WITH GREATER RADIUS (R = 5.0 km) -->
                <g id="iso-bs-coverage-sector">
                  <!-- Main Glowing Coverage Fill (Large Radial Sector) -->
                  <ellipse id="sector-glow-ellipse" cx="1200" cy="370" rx="1060" ry="250" fill="url(#bs-coverage-radial-grad)" stroke="rgba(0, 229, 255, 0.28)" stroke-width="1.8" stroke-dasharray="8 5"/>
                  
                  <!-- Concentric Range Rings (1 km to 5 km) -->
                  <ellipse id="sector-ring-1" cx="1200" cy="370" rx="220" ry="55" fill="none" stroke="rgba(0, 229, 255, 0.12)" stroke-width="1" stroke-dasharray="4 4"/>
                  <text id="sector-tag-1" x="1210" y="310" fill="rgba(0, 229, 255, 0.35)" font-size="10" font-family="monospace">1.0 km</text>

                  <ellipse id="sector-ring-2" cx="1200" cy="370" rx="440" ry="105" fill="none" stroke="rgba(0, 229, 255, 0.12)" stroke-width="1" stroke-dasharray="4 4"/>
                  <text id="sector-tag-2" x="1210" y="260" fill="rgba(0, 229, 255, 0.35)" font-size="10" font-family="monospace">2.0 km</text>

                  <ellipse id="sector-ring-3" cx="1200" cy="370" rx="660" ry="155" fill="none" stroke="rgba(0, 229, 255, 0.12)" stroke-width="1" stroke-dasharray="4 4"/>
                  <text id="sector-tag-3" x="1210" y="210" fill="rgba(0, 229, 255, 0.35)" font-size="10" font-family="monospace">3.0 km</text>

                  <ellipse id="sector-ring-4" cx="1200" cy="370" rx="880" ry="205" fill="none" stroke="rgba(0, 229, 255, 0.12)" stroke-width="1" stroke-dasharray="4 4"/>
                  <text id="sector-tag-4" x="1210" y="160" fill="rgba(0, 229, 255, 0.35)" font-size="10" font-family="monospace">4.0 km</text>

                  <!-- Sector Boundary Legend Label -->
                  <text id="sector-legend-label" x="50" y="610" fill="rgba(0, 229, 255, 0.65)" font-size="12" font-family="monospace" font-weight="700">
                    BASE STATION MACROCELL COVERAGE SECTOR (Radius R = 5.0 km | 120° Directional Beam | Inter-Site Distance d = 8.66 km)
                  </text>
                </g>

                <!-- 1. MULTIPLE SUBSCRIBER CLIENTS (GEOGRAPHICALLY SPACED AT ENLARGED SCALE) -->
                <g id="iso-subscribers-group">
                  <!-- MS-1 Primary Smartphone (Cyan: f1 = 825.03 MHz) -->
                  <g id="node-ms1" transform="translate(150, 440)">
                    ${drawIsometricPhone(0, 0, 2.0, '#00e5ff')}
                    <rect x="-80" y="44" width="160" height="30" fill="#08152e" stroke="#00e5ff" stroke-width="1.8" rx="5"/>
                    <text x="0" y="58" fill="#fff" font-size="11" font-family="monospace" font-weight="700" text-anchor="middle">MS-1 Handset</text>
                    <text x="0" y="70" fill="#00e5ff" font-size="9.5" font-family="monospace" text-anchor="middle" id="ms1-label-freq">CH 1: 825.03 MHz</text>
                    <circle id="pulse-ms1" cx="0" cy="-45" r="18" fill="none" stroke="#00e5ff" stroke-width="2.2" opacity="0.8"/>
                  </g>

                  <!-- MS-2 Secondary Smartphone (Purple: f2 = 825.06 MHz) -->
                  <g id="node-ms2" transform="translate(160, 170)" style="display: none;">
                    ${drawIsometricPhone(0, 0, 2.0, '#c084fc')}
                    <rect x="-80" y="44" width="160" height="30" fill="#170d2b" stroke="#c084fc" stroke-width="1.8" rx="5"/>
                    <text x="0" y="58" fill="#fff" font-size="11" font-family="monospace" font-weight="700" text-anchor="middle">MS-2 Handset</text>
                    <text x="0" y="70" fill="#c084fc" font-size="9.5" font-family="monospace" text-anchor="middle" id="ms2-label-freq">CH 2: 825.06 MHz</text>
                    <circle id="pulse-ms2" cx="0" cy="-45" r="18" fill="none" stroke="#c084fc" stroke-width="2.2" opacity="0.8"/>
                  </g>

                  <!-- MS-3 Laptop (IN A COMPLETELY DIFFERENT WORKSTATION AREA: Emerald: f3 = 825.09 MHz) -->
                  <g id="node-ms3" transform="translate(480, 520)" style="display: none;">
                    <!-- Office Desk Pad -->
                    <polygon points="-85,30 0,-12 85,30 0,72" fill="#0c1d2e" stroke="rgba(0,255,157,0.3)" stroke-width="1.8"/>
                    ${drawIsometricLaptop(0, 0, 1.9, '#00ff9d')}
                    <rect x="-105" y="52" width="210" height="30" fill="#042017" stroke="#00ff9d" stroke-width="1.8" rx="5"/>
                    <text x="0" y="66" fill="#fff" font-size="11" font-family="monospace" font-weight="700" text-anchor="middle">MS-3 Remote Laptop</text>
                    <text x="0" y="78" fill="#00ff9d" font-size="9.5" font-family="monospace" text-anchor="middle" id="ms3-label-freq">CH 3: 825.09 MHz (Data)</text>
                    <circle id="pulse-ms3" cx="0" cy="-40" r="18" fill="none" stroke="#00ff9d" stroke-width="2.2" opacity="0.8"/>
                  </g>

                  <!-- MS-4 Vehicular Terminal (Amber: f4 = 825.12 MHz) -->
                  <g id="node-ms4" transform="translate(470, 130)" style="display: none;">
                    ${drawIsometricVehicle(0, 0, 2.0, '#ffb703')}
                    <rect x="-95" y="44" width="190" height="30" fill="#241705" stroke="#ffb703" stroke-width="1.8" rx="5"/>
                    <text x="0" y="58" fill="#fff" font-size="11" font-family="monospace" font-weight="700" text-anchor="middle">MS-4 Highway Car</text>
                    <text x="0" y="70" fill="#ffb703" font-size="9.5" font-family="monospace" text-anchor="middle" id="ms4-label-freq">CH 4: 825.12 MHz (Doppler)</text>
                    <circle id="pulse-ms4" cx="0" cy="-40" r="18" fill="none" stroke="#ffb703" stroke-width="2.2" opacity="0.8"/>
                  </g>

                  <!-- MS-5..12 OVERLOAD CLUSTER (Competing subscribers showing Call Blocking / Erlang B) -->
                  <g id="node-ms-overload-cluster" transform="translate(320, 310)" style="display: none;">
                    <rect x="-95" y="-55" width="190" height="110" fill="#240710" stroke="#ff0055" stroke-width="2" rx="6" opacity="0.94"/>
                    <g transform="translate(-50, -20)">${drawIsometricPhone(0, 0, 1.2, '#ff0055')}</g>
                    <g transform="translate(-15, -20)">${drawIsometricPhone(0, 0, 1.2, '#ff5577')}</g>
                    <g transform="translate(20, -20)">${drawIsometricPhone(0, 0, 1.2, '#ff7799')}</g>
                    <g transform="translate(55, -20)">${drawIsometricPhone(0, 0, 1.2, '#ff99aa')}</g>
                    <g transform="translate(-35, 15)">${drawIsometricPhone(0, 0, 1.2, '#ff0055')}</g>
                    <g transform="translate(0, 15)">${drawIsometricPhone(0, 0, 1.2, '#ff5577')}</g>
                    <g transform="translate(35, 15)">${drawIsometricPhone(0, 0, 1.2, '#ff7799')}</g>
                    <rect x="-90" y="30" width="180" height="20" fill="#3d091a" stroke="#ff0055" stroke-width="1.2" rx="3"/>
                    <text x="0" y="44" fill="#ff4d79" font-size="9" font-family="monospace" font-weight="700" text-anchor="middle">MS-5..12: CALL OVERLOAD</text>
                  </g>
                </g>

                <!-- REAL-TIME OSCILLATING SINE WAVES FOR EACH SUBSCRIBER ON THEIR OWN FREQUENCIES -->
                <g id="iso-em-waves-group">
                  <!-- Wave 1: MS-1 (Cyan: Channel 1 f1 = 825.03 MHz) -->
                  <path id="iso-wave-ms1" d="" fill="none" stroke="url(#wave-grad-ms1)" stroke-width="3.5" opacity="0.95"/>
                  <!-- Floating Frequency Tag on Wave 1 -->
                  <g id="badge-wave-ms1" transform="translate(620, 410)">
                    <rect x="0" y="0" width="180" height="24" fill="#030c1d" stroke="#00e5ff" stroke-width="1.5" rx="4"/>
                    <circle cx="12" cy="12" r="4" fill="#00e5ff"/>
                    <text x="98" y="16" fill="#00e5ff" font-size="9.5" font-family="monospace" font-weight="700" text-anchor="middle">CH 1: 825.03 MHz (MS-1)</text>
                  </g>

                  <!-- Wave 2: MS-2 (Purple: Channel 2 f2 = 825.06 MHz) -->
                  <path id="iso-wave-ms2" d="" fill="none" stroke="url(#wave-grad-ms2)" stroke-width="3.5" opacity="0"/>
                  <g id="badge-wave-ms2" transform="translate(620, 240)" opacity="0">
                    <rect x="0" y="0" width="180" height="24" fill="#140822" stroke="#c084fc" stroke-width="1.5" rx="4"/>
                    <circle cx="12" cy="12" r="4" fill="#c084fc"/>
                    <text x="98" y="16" fill="#c084fc" font-size="9.5" font-family="monospace" font-weight="700" text-anchor="middle">CH 2: 825.06 MHz (MS-2)</text>
                  </g>

                  <!-- Wave 3: MS-3 Laptop (Emerald: Channel 3 f3 = 825.09 MHz) -->
                  <path id="iso-wave-ms3" d="" fill="none" stroke="url(#wave-grad-ms3)" stroke-width="3.5" opacity="0"/>
                  <g id="badge-wave-ms3" transform="translate(740, 460)" opacity="0">
                    <rect x="0" y="0" width="190" height="24" fill="#031b13" stroke="#00ff9d" stroke-width="1.5" rx="4"/>
                    <circle cx="12" cy="12" r="4" fill="#00ff9d"/>
                    <text x="102" y="16" fill="#00ff9d" font-size="9.5" font-family="monospace" font-weight="700" text-anchor="middle">CH 3: 825.09 MHz (Data)</text>
                  </g>

                  <!-- Wave 4: MS-4 Car (Amber: Channel 4 f4 = 825.12 MHz) -->
                  <path id="iso-wave-ms4" d="" fill="none" stroke="url(#wave-grad-ms4)" stroke-width="3.5" opacity="0"/>
                  <g id="badge-wave-ms4" transform="translate(740, 200)" opacity="0">
                    <rect x="0" y="0" width="190" height="24" fill="#201303" stroke="#ffb703" stroke-width="1.5" rx="4"/>
                    <circle cx="12" cy="12" r="4" fill="#ffb703"/>
                    <text x="102" y="16" fill="#ffb703" font-size="9.5" font-family="monospace" font-weight="700" text-anchor="middle">CH 4: 825.12 MHz (Doppler)</text>
                  </g>

                  <!-- Blocked Overload Wave (Red dashed wave terminated with call rejection) -->
                  <path id="iso-wave-blocked" d="" fill="none" stroke="#ff0055" stroke-width="3.2" stroke-dasharray="6 4" opacity="0"/>
                  <g id="badge-wave-blocked" transform="translate(480, 290)" opacity="0">
                    <rect x="0" y="0" width="225" height="26" fill="#3a0414" stroke="#ff0055" stroke-width="2" rx="4"/>
                    <text x="112" y="17" fill="#ff4d79" font-size="9.5" font-family="monospace" font-weight="700" text-anchor="middle">⛔ CALL BLOCKED (ERLANG B)</text>
                  </g>

                  <!-- Downlink Return ACK Wave (High-Power Mint Wave from Tower to MS-1) -->
                  <path id="iso-wave-downlink" d="" fill="none" stroke="url(#wave-grad-downlink)" stroke-width="4" stroke-dasharray="10 5" opacity="0"/>
                  <g id="badge-wave-dl" transform="translate(660, 360)" opacity="0">
                    <rect x="0" y="0" width="205" height="26" fill="#021c15" stroke="#00ff9d" stroke-width="1.8" rx="4"/>
                    <circle cx="14" cy="13" r="4.5" fill="#00ff9d"/>
                    <text x="110" y="17" fill="#00ff9d" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">DOWNLINK: 870.03 MHz (+45M)</text>
                  </g>
                </g>

                <!-- 2. BASE STATION TOWER & EQUIPMENT SHELTER (PLACED FURTHER APART, ENLARGED SCALE 2.2x) -->
                <g id="node-tower" transform="translate(1200, 350)">
                  <!-- RF Equipment Shelter -->
                  <g id="subnode-shelter" transform="translate(-95, 80)">
                    ${drawIsometricBtsShelter(0, 0, 1.6, '#38bdf8')}
                    <text x="-48" y="55" fill="#38bdf8" font-size="10.5" font-family="monospace">BTS LNA Shelter</text>
                  </g>
                  <!-- Lattice Tower Mast at 2.2x Scale -->
                  ${drawIsometricBaseStation(0, 0, 2.2, '#38bdf8')}
                  <text x="-65" y="115" fill="#fff" font-size="15" font-family="monospace" font-weight="700">BS-A Transceiver</text>
                  <text x="-65" y="132" fill="#00e5ff" font-size="11.5" font-family="monospace">Tower Mast & 120° Antennas</text>
                  
                  <!-- Live Base Station RF Receiver Channel Tuning Display -->
                  <g id="tower-live-channel-indicator" transform="translate(-110, -210)">
                    <rect x="0" y="0" width="220" height="52" fill="#030c1d" stroke="rgba(0,229,255,0.4)" stroke-width="1.5" rx="5" filter="drop-shadow(0 0 10px rgba(0,229,255,0.2))"/>
                    <text x="110" y="15" fill="#38bdf8" font-size="8.5" font-family="monospace" font-weight="700" text-anchor="middle">RECEIVER CHANNEL TUNER</text>
                    <g transform="translate(10, 22)">
                      <rect id="tuner-ch1" x="0" y="0" width="46" height="20" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" stroke-width="1" rx="3"/>
                      <text x="23" y="13" fill="#00e5ff" font-size="7.5" font-family="monospace" font-weight="700" text-anchor="middle">CH 1</text>
                      
                      <rect id="tuner-ch2" x="50" y="0" width="46" height="20" fill="rgba(192,132,252,0.1)" stroke="#c084fc" stroke-width="1" rx="3" opacity="0.4"/>
                      <text x="73" y="13" fill="#c084fc" font-size="7.5" font-family="monospace" font-weight="700" text-anchor="middle">CH 2</text>
                      
                      <rect id="tuner-ch3" x="100" y="0" width="46" height="20" fill="rgba(0,255,157,0.1)" stroke="#00ff9d" stroke-width="1" rx="3" opacity="0.4"/>
                      <text x="123" y="13" fill="#00ff9d" font-size="7.5" font-family="monospace" font-weight="700" text-anchor="middle">CH 3</text>
                      
                      <rect id="tuner-ch4" x="150" y="0" width="46" height="20" fill="rgba(255,183,3,0.1)" stroke="#ffb703" stroke-width="1" rx="3" opacity="0.4"/>
                      <text x="173" y="13" fill="#ffb703" font-size="7.5" font-family="monospace" font-weight="700" text-anchor="middle">CH 4</text>
                    </g>
                  </g>
                  <circle id="pulse-tower" cx="0" cy="-180" r="28" fill="none" stroke="#00ff9d" stroke-width="2.5" opacity="0"/>
                </g>

                <!-- Cable 1: Tower to BSC (Abis Digital Line) -->
                <line id="line-abis" x1="1250" y1="360" x2="1440" y2="360" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6 4"/>
                <text id="label-abis" x="1300" y="345" fill="#64748b" font-size="10" font-family="monospace">Abis Trunk (E1)</text>

                <!-- 3. BASE STATION CONTROLLER (BSC) -->
                <g id="node-bsc" transform="translate(1480, 350)">
                  ${drawIsometricBscCabinet(0, 0, 1.65, '#ffb703')}
                  <text x="-60" y="80" fill="#fff" font-size="14" font-family="monospace" font-weight="700">BSC Controller</text>
                  <text x="-60" y="96" fill="#ffb703" font-size="11" font-family="monospace">TRAU & Resource Control</text>
                </g>

                <!-- Cable 2: BSC to MTSO Core (A-Interface SS7/IP) -->
                <line id="line-ss7" x1="1530" y1="360" x2="1700" y2="315" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6 4"/>
                <text id="label-ss7" x="1580" y="325" fill="#64748b" font-size="10" font-family="monospace">A-Interface</text>

                <!-- 4. MTSO / MSC CORE CLOUD & HLR/VLR DATABASES -->
                <g id="node-core" transform="translate(1740, 300)">
                  ${drawIsometricCloud(0, 0, 1.65, '#38bdf8')}
                  ${drawIsometricDatabase(-55, 115, 1.05, '#00ff9d', 'HLR')}
                  ${drawIsometricDatabase(55, 115, 1.05, '#38bdf8', 'VLR')}
                  <text x="-70" y="65" fill="#fff" font-size="14" font-family="monospace" font-weight="700">MTSO / MSC Core</text>
                  <text x="-70" y="80" fill="#38bdf8" font-size="11" font-family="monospace">HLR / VLR / Gateway</text>
                </g>

                <!-- Cable 3: Core to Public Web Server Backbone -->
                <line id="line-fiber" x1="1790" y1="305" x2="1900" y2="350" stroke="#00ff9d" stroke-width="3" stroke-dasharray="6 4"/>
                <text id="label-fiber" x="1810" y="315" fill="#00ff9d" font-size="10" font-family="monospace">Public Internet</text>

                <!-- 5. DESTINATION APPLICATION / WEB SERVER (8.8.8.8) -->
                <g id="node-server" transform="translate(1940, 350)">
                  ${drawIsometricServer(0, 0, 1.6, '#00ff9d')}
                  <text x="-60" y="78" fill="#fff" font-size="14" font-family="monospace" font-weight="700">Web Host</text>
                  <text x="-60" y="94" fill="#00ff9d" font-size="11" font-family="monospace">IP: 8.8.8.8 (Server)</text>
                </g>

                <!-- LIVE MOVING PACKETS (EACH MOBILE HAS ITS OWN LABELED PACKET) -->
                <g id="iso-active-packets-container">
                  <!-- Packet MS-1 (Cyan) -->
                  <g id="pkt-group-ms1" opacity="1">
                    <rect id="pkt-box-ms1" x="120" y="320" width="135" height="24" fill="#08152e" stroke="#00e5ff" stroke-width="1.8" rx="4"/>
                    <text id="pkt-text-ms1" x="128" y="336" fill="#00e5ff" font-size="8.5" font-family="monospace" font-weight="700">MS-1: f1 825.03M</text>
                  </g>

                  <!-- Packet MS-2 (Purple) -->
                  <g id="pkt-group-ms2" opacity="0">
                    <rect id="pkt-box-ms2" x="120" y="190" width="135" height="24" fill="#170d2b" stroke="#c084fc" stroke-width="1.8" rx="4"/>
                    <text id="pkt-text-ms2" x="128" y="206" fill="#c084fc" font-size="8.5" font-family="monospace" font-weight="700">MS-2: f2 825.06M</text>
                  </g>

                  <!-- Packet MS-3 (Laptop in separate area) -->
                  <g id="pkt-group-ms3" opacity="0">
                    <rect id="pkt-box-ms3" x="280" y="440" width="145" height="24" fill="#042017" stroke="#00ff9d" stroke-width="1.8" rx="4"/>
                    <text id="pkt-text-ms3" x="288" y="456" fill="#00ff9d" font-size="8.5" font-family="monospace" font-weight="700">MS-3: f3 825.09M (Data)</text>
                  </g>

                  <!-- Packet MS-4 (Highway Car) -->
                  <g id="pkt-group-ms4" opacity="0">
                    <rect id="pkt-box-ms4" x="280" y="140" width="145" height="24" fill="#241705" stroke="#ffb703" stroke-width="1.8" rx="4"/>
                    <text id="pkt-text-ms4" x="288" y="156" fill="#ffb703" font-size="8.5" font-family="monospace" font-weight="700">MS-4: f4 825.12M (Car)</text>
                  </g>

                  <!-- Return Downlink ACK Packet for MS-1 (Cyan) -->
                  <g id="pkt-group-ack1" opacity="0">
                    <rect id="pkt-box-ack1" x="1450" y="270" width="165" height="24" fill="#08152e" stroke="#00e5ff" stroke-width="1.8" rx="4"/>
                    <text id="pkt-text-ack1" x="1458" y="286" fill="#00e5ff" font-size="8.5" font-family="monospace" font-weight="700">ACK → MS-1: HTTP 200</text>
                  </g>

                  <!-- Return Downlink ACK Packet for MS-2 (Purple) -->
                  <g id="pkt-group-ack2" opacity="0">
                    <rect id="pkt-box-ack2" x="1450" y="295" width="165" height="24" fill="#170d2b" stroke="#c084fc" stroke-width="1.8" rx="4"/>
                    <text id="pkt-text-ack2" x="1458" y="311" fill="#c084fc" font-size="8.5" font-family="monospace" font-weight="700">ACK → MS-2: HTTP 200</text>
                  </g>

                  <!-- Return Downlink ACK Packet for MS-3 (Emerald) -->
                  <g id="pkt-group-ack3" opacity="0">
                    <rect id="pkt-box-ack3" x="1450" y="320" width="165" height="24" fill="#042017" stroke="#00ff9d" stroke-width="1.8" rx="4"/>
                    <text id="pkt-text-ack3" x="1458" y="336" fill="#00ff9d" font-size="8.5" font-family="monospace" font-weight="700">ACK → MS-3: HTTP 200</text>
                  </g>

                  <!-- Return Downlink ACK Packet for MS-4 (Amber) -->
                  <g id="pkt-group-ack4" opacity="0">
                    <rect id="pkt-box-ack4" x="1450" y="345" width="165" height="24" fill="#241705" stroke="#ffb703" stroke-width="1.8" rx="4"/>
                    <text id="pkt-text-ack4" x="1458" y="361" fill="#ffb703" font-size="8.5" font-family="monospace" font-weight="700">ACK → MS-4: HTTP 200</text>
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
                STAGE 1 / 6 — UPLINK: MOBILES RADIATE ON OWN FREQUENCIES
              </span>
            </div>

            <!-- Real-Time Protocol & RF Layer Telemetry HUD -->
            <div id="iso-hud-box" style="margin-top: 8px; background: rgba(15,23,42,0.85); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 0.75rem; flex-wrap: wrap; gap: 6px;">
              <span id="iso-hud-status" style="color: var(--status-ready);">● 2-WAY ROUND TRIP ACTIVE: Mobiles transmitting on dedicated channels</span>
              <span id="iso-hud-phy" style="color: var(--text-dim);">UPLINK f1: 825.03 MHz | f2: 825.06 MHz | f3: 825.09 MHz | DOWNLINK: 870.03 MHz</span>
            </div>

            <!-- Simplified 6-Stage Procedure Breakdown Card -->
            <div id="iso-step-detail" style="margin-top:8px; background:rgba(11, 19, 41, 0.85); border:1px solid var(--border-subtle); border-radius:6px; padding:12px 16px; font-family:var(--font-mono); font-size:0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="color:var(--accent-sky); font-size:0.72rem; font-weight:700;" id="iso-step-num">STAGE 1 OF 6</div>
                <div style="color:var(--status-ready); font-size:0.72rem; font-weight:700;" id="iso-step-direction">⬆️ UPLINK TRANSMISSION</div>
              </div>
              <div style="color:#fff; font-weight:700; font-size:0.95rem; margin-bottom:4px;" id="iso-step-title">1. MOBILES RADIATE ON DEDICATED FREQUENCIES</div>
              <div style="color:var(--text-secondary); line-height:1.5;" id="iso-step-desc">
                Each mobile subscriber terminal modulates voice or data onto its own dedicated reverse carrier frequency (MS-1 on f1: 825.03 MHz, MS-2 on f2: 825.06 MHz, MS-3 Laptop on f3: 825.09 MHz).
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

    case 'sec-10.power':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 10.1.6 — TEXTBOOK PP. 276–277</div>
          <h2 class="lesson-title">Dynamic Power Control: Open-Loop vs. Closed-Loop Animation</h2>
          <p class="lesson-text">
            Power control is crucial in cellular networks (especially CDMA and GSM) to <strong>(1) mitigate the near-far problem</strong> where nearby mobiles would otherwise overpower distant users, <strong>(2) counteract severe shadow fading and multipath nulls</strong>, and <strong>(3) minimize cochannel interference and conserve handset battery power</strong> (Stallings pp. 276–277).
          </p>

          <div class="math-display-card">
            <div class="math-row">
              <span style="color: #ffb703; font-weight: 700; font-size: 0.85rem; margin-right: 6px;">OPEN-LOOP:</span>
              <span>P<sub>tx</sub> &prop; </span>
              <div class="math-fraction">
                <div class="math-num">1</div>
                <div class="math-den">P<sub>rx,pilot</sub></div>
              </div>
              <span style="font-size: 0.72rem; color: var(--text-dim); margin-left: 6px;">(Autonomous Pilot Sniffing)</span>
            </div>
            <div style="width: 1px; height: 32px; background: rgba(0, 229, 255, 0.3); margin: 0 10px;"></div>
            <div class="math-row">
              <span style="color: #00ff9d; font-weight: 700; font-size: 0.85rem; margin-right: 6px;">CLOSED-LOOP:</span>
              <span>P<sub>tx</sub>(k+1) = P<sub>tx</sub>(k) &plusmn; &Delta;P</span>
              <span style="font-size: 0.72rem; color: var(--text-dim); margin-left: 6px;">(Fast Feedback Commands @ 800/1600 Hz)</span>
            </div>
            <span class="math-tag-pill">STALLINGS PP. 276–277</span>
          </div>

          <!-- Interactive Power Control Animation Workbench -->
          <div class="interactive-panel" style="margin-top: 14px;">
            <div class="panel-header">
              <span>LIVE POWER CONTROL SIMULATOR: REVERSE & FORWARD LINK DYNAMICS</span>
              <span class="panel-tag" id="pwr-mode-tag">OPEN-LOOP MODE</span>
            </div>

            <!-- Mode Selector Buttons -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
              <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim); font-weight: 700;">CONTROL MECHANISM:</span>
              <button class="btn-ctrl active" id="btn-pwr-open" style="font-size: 0.75rem; padding: 6px 14px;">
                🔄 OPEN-LOOP (PILOT SENSING)
              </button>
              <button class="btn-ctrl" id="btn-pwr-closed" style="font-size: 0.75rem; padding: 6px 14px;">
                🔁 CLOSED-LOOP (FAST BS FEEDBACK)
              </button>
              <button class="btn-ctrl" id="btn-toggle-building" style="margin-left: auto; font-size: 0.75rem; padding: 6px 14px; background: rgba(255, 183, 3, 0.15); border-color: #ffb703; color: #ffb703;">
                🏢 TOGGLE SKYSCRAPER SHADOW (25 dB FADE)
              </button>
            </div>

            <!-- Interactive Parameters Grid -->
            <div class="ch2-controls-grid">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>MOBILE-TO-BASE DISTANCE (d)</span>
                  <span id="pwr-val-dist">3.5 km</span>
                </div>
                <input type="range" id="pwr-slider-dist" min="0.5" max="12.0" step="0.5" value="3.5" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>BS TARGET RECEIVED POWER SETPOINT</span>
                  <span id="pwr-val-target">-90.0 dBm</span>
                </div>
                <input type="range" id="pwr-slider-target" min="-105" max="-75" step="1" value="-90" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>FAST MULTIPATH FADING NOISE</span>
                  <span id="pwr-val-fade">ACTIVE (±4 dB Jitter)</span>
                </div>
                <button class="btn-ctrl active" id="btn-pwr-toggle-fade" style="width: 100%; margin-top: 4px; font-size: 0.72rem;">
                  MULTIPATH FLUCTUATION: ON
                </button>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>FEEDBACK RATE (CLOSED-LOOP)</span>
                  <span id="pwr-val-rate">1,600 Hz (UMTS/W-CDMA)</span>
                </div>
                <select id="pwr-select-rate" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.72rem; border-radius: 4px; margin-top: 4px;">
                  <option value="1600" selected>1,600 Hz — W-CDMA (Table 10.8)</option>
                  <option value="800">800 Hz — IS-95 CDMA (Table 10.5)</option>
                  <option value="200">200 Hz — GSM Slow Closed-Loop</option>
                </select>
              </div>
            </div>

            <!-- Dynamic Animated SVG Stage -->
            <div style="position: relative; background: #02050e; border: 1px solid var(--border-subtle); border-radius: 8px; margin-top: 14px; overflow: hidden; height: 380px;">
              <svg viewBox="0 0 1000 380" preserveAspectRatio="none" id="svg-power-control" style="width: 100%; height: 100%;">
                <defs>
                  <linearGradient id="pwr-grad-pilot" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="#ffb703" stop-opacity="0.95"/>
                    <stop offset="100%" stop-color="#ea580c" stop-opacity="0.75"/>
                  </linearGradient>
                  <linearGradient id="pwr-grad-reverse" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.95"/>
                    <stop offset="100%" stop-color="#0070f3" stop-opacity="0.85"/>
                  </linearGradient>
                </defs>

                <!-- Ground line & background -->
                <line x1="0" y1="310" x2="1000" y2="310" stroke="rgba(0,229,255,0.2)" stroke-width="1.5"/>
                <rect x="0" y="310" width="1000" height="70" fill="#04091a"/>

                <!-- Dynamic Shadow Obstacle (Skyscraper) -->
                <g id="pwr-building-group" transform="translate(480, 110)" style="display: none; transition: all 0.3s ease;">
                  <rect x="-45" y="0" width="90" height="200" fill="#0b1730" stroke="#ffb703" stroke-width="1.8" rx="4"/>
                  <!-- Building Windows Grid -->
                  <g fill="rgba(255,183,3,0.3)">
                    <rect x="-35" y="15" width="16" height="20" rx="2"/><rect x="-10" y="15" width="16" height="20" rx="2"/><rect x="15" y="15" width="16" height="20" rx="2"/>
                    <rect x="-35" y="45" width="16" height="20" rx="2"/><rect x="-10" y="45" width="16" height="20" rx="2"/><rect x="15" y="45" width="16" height="20" rx="2"/>
                    <rect x="-35" y="75" width="16" height="20" rx="2"/><rect x="-10" y="75" width="16" height="20" rx="2"/><rect x="15" y="75" width="16" height="20" rx="2"/>
                    <rect x="-35" y="105" width="16" height="20" rx="2"/><rect x="-10" y="105" width="16" height="20" rx="2"/><rect x="15" y="105" width="16" height="20" rx="2"/>
                    <rect x="-35" y="135" width="16" height="20" rx="2"/><rect x="-10" y="135" width="16" height="20" rx="2"/><rect x="15" y="135" width="16" height="20" rx="2"/>
                    <rect x="-35" y="165" width="16" height="20" rx="2"/><rect x="-10" y="165" width="16" height="20" rx="2"/><rect x="15" y="165" width="16" height="20" rx="2"/>
                  </g>
                  <text x="0" y="-10" fill="#ffb703" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">URBAN OBSTACLE (-25 dB)</text>
                </g>

                <!-- Signal Propagation Beams -->
                <!-- Forward Pilot Beacon Path (Open Loop) -->
                <path id="pwr-wave-pilot" d="" fill="none" stroke="url(#pwr-grad-pilot)" stroke-width="3" stroke-dasharray="6 4" opacity="0.9"/>
                <text id="pwr-tag-pilot" x="500" y="80" fill="#ffb703" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">FORWARD PILOT BEACON (P_pilot = +40 dBm Const)</text>

                <!-- Reverse Transmit Wave (Mobile -> Tower) -->
                <path id="pwr-wave-reverse" d="" fill="none" stroke="url(#pwr-grad-reverse)" stroke-width="3.5" opacity="0.95"/>
                <text id="pwr-tag-reverse" x="500" y="240" fill="#00e5ff" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">REVERSE TRAFFIC SIGNAL</text>

                <!-- Closed Loop Feedback Command Packets (BS -> Mobile) -->
                <g id="pwr-cmd-packet" transform="translate(600, 180)" style="display: none;">
                  <rect x="-65" y="-12" width="130" height="24" fill="#042017" stroke="#00ff9d" stroke-width="1.8" rx="4"/>
                  <text id="pwr-cmd-text" x="0" y="4" fill="#00ff9d" font-size="9" font-family="monospace" font-weight="700" text-anchor="middle">▲ POWER UP (+1dB)</text>
                </g>

                <!-- Mobile Station (Left) -->
                <g id="pwr-node-mobile" transform="translate(160, 270)">
                  ${drawIsometricPhone(0, 0, 1.8, '#00e5ff')}
                  <rect x="-80" y="42" width="160" height="42" fill="#08152e" stroke="#00e5ff" stroke-width="1.5" rx="5"/>
                  <text x="0" y="56" fill="#fff" font-size="10.5" font-family="monospace" font-weight="700" text-anchor="middle">Mobile Handset</text>
                  <text id="pwr-ms-tx-text" x="0" y="70" fill="#00e5ff" font-size="9" font-family="monospace" text-anchor="middle">Tx: +20.0 dBm (100mW)</text>
                  <!-- Internal Pilot Sensor / AGC Banner -->
                  <g id="pwr-ms-sensor-box" transform="translate(0, -65)">
                    <rect x="-75" y="-18" width="150" height="20" fill="rgba(3,7,18,0.9)" stroke="#ffb703" stroke-width="1" rx="3"/>
                    <text id="pwr-ms-sensor-text" x="0" y="-4" fill="#ffb703" font-size="8" font-family="monospace" text-anchor="middle">PILOT SENSOR: -95 dBm</text>
                  </g>
                  <circle id="pwr-pulse-ms" cx="0" cy="-40" r="16" fill="none" stroke="#00e5ff" stroke-width="2" opacity="0.8"/>
                </g>

                <!-- Base Station Tower (Right) -->
                <g id="pwr-node-bs" transform="translate(850, 260)">
                  ${drawIsometricBaseStation(0, 0, 1.9, '#38bdf8')}
                  <rect x="-75" y="90" width="150" height="36" fill="#061224" stroke="#38bdf8" stroke-width="1.5" rx="5"/>
                  <text x="0" y="104" fill="#fff" font-size="11" font-family="monospace" font-weight="700" text-anchor="middle">Base Station (BS)</text>
                  <text id="pwr-bs-rx-text" x="0" y="118" fill="#00ff9d" font-size="9" font-family="monospace" text-anchor="middle">Rx: -90.2 dBm</text>
                  <circle id="pwr-pulse-bs" cx="0" cy="-150" r="22" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.8"/>
                </g>
              </svg>

              <!-- In-Canvas Live Power Telemetry HUD -->
              <div style="position: absolute; top: 10px; left: 12px; background: rgba(3,7,18,0.92); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 10px 14px; font-family: var(--font-mono); font-size: 0.72rem; max-width: 380px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="color: var(--accent-cyan);" id="pwr-hud-mode-title">OPEN-LOOP DYNAMICS</strong>
                  <span id="pwr-hud-status-badge" style="color: #00ff9d; font-weight: 700;">STABILIZED</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; color: var(--text-secondary);">
                  <div>Path Loss + Shadowing: <strong id="pwr-hud-loss" style="color: #ffb703;">110.0 dB</strong></div>
                  <div>Mobile Transmitted Power: <strong id="pwr-hud-tx" style="color: #00e5ff;">+20.0 dBm (100 mW)</strong></div>
                  <div>Received Signal at Base Station: <strong id="pwr-hud-rx" style="color: #00ff9d;">-90.0 dBm</strong> (Target: -90 dBm)</div>
                  <div>Control Loop Action: <span id="pwr-hud-action" style="color: #fff;">Mobile autonomously adjusts Tx inversely to pilot</span></div>
                </div>
              </div>
            </div>

            <!-- In-Depth Educational Comparison Card (Stallings p. 277) -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; margin-top: 14px; font-family: var(--font-mono); font-size: 0.75rem;">
              <div style="background: rgba(11, 19, 41, 0.75); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px 16px;">
                <div style="color: var(--accent-cyan); font-weight: 700; margin-bottom: 4px; font-size: 0.82rem;">
                  🔄 OPEN-LOOP POWER CONTROL (STALLINGS §10.1)
                </div>
                <ul style="margin: 0; padding-left: 16px; color: var(--text-secondary); line-height: 1.6;">
                  <li><strong>Autonomous:</strong> Operates strictly at the mobile station with <em>zero feedback from the base station</em>.</li>
                  <li><strong>Pilot Sniffing:</strong> BS continuously radiates an unmodulated pilot beacon. The mobile monitors received pilot strength.</li>
                  <li><strong>Fast Reaction:</strong> Reacts instantaneously to sudden shadow fading (e.g., emerging from behind a large building).</li>
                  <li><strong>Limitation:</strong> Assumes forward and reverse channels have identical path loss (true for reciprocity, but fails under asymmetric interference).</li>
                </ul>
              </div>

              <div style="background: rgba(11, 19, 41, 0.75); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px 16px;">
                <div style="color: #00ff9d; font-weight: 700; margin-bottom: 4px; font-size: 0.82rem;">
                  🔁 CLOSED-LOOP POWER CONTROL (STALLINGS §10.1)
                </div>
                <ul style="margin: 0; padding-left: 16px; color: var(--text-secondary); line-height: 1.6;">
                  <li><strong>Feedback-Driven:</strong> Base station measures actual reverse channel received SNR / $E_b/N_0$ and compares with target setpoint.</li>
                  <li><strong>High-Rate Stepping:</strong> BS sends power adjustment commands (+1 dB / -1 dB) over forward control channel at <strong>800 Hz (IS-95) to 1,600 Hz (W-CDMA)</strong>.</li>
                  <li><strong>Near-Far Solution:</strong> Essential in CDMA to prevent nearby mobiles from drowning out distant subscribers.</li>
                  <li><strong>Limitation:</strong> Incurs loop propagation and processing delay (~1–2 ms), which open-loop avoids.</li>
                </ul>
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

          <div class="math-display-card">
            <div class="math-row">
              <span style="color: #00e5ff; font-weight: 700;">P</span>
              <span>=</span>
              <div class="math-fraction">
                <div class="math-num">A<sup>N</sup> / N!</div>
                <div class="math-den">
                  <span class="math-sum-sym">&sum;</span>
                  <div class="math-sum-limits">
                    <span>N</span>
                    <span>k=0</span>
                  </div>
                  <span>(A<sup>k</sup> / k!)</span>
                </div>
              </div>
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: #7dd3fc; margin-left: 12px;">
              <span>Call Blocking Probability (Grade of Service GOS)</span>
            </div>
            <span class="math-tag-pill">ERLANG B [EQUATION 10.1]</span>
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

          <!-- 1. Interactive Walsh Code Chipping, Matrix Recursion & Orthogonality Engine -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>CDMA SPREAD SPECTRUM CHIPPING & HADAMARD MATRIX (STALLINGS TABLE 7.1 & FIG 10.18)</span>
              <span class="panel-tag">1.2288 MCPS SPREAD CHIPS</span>
            </div>

            <p class="lesson-text" style="margin-bottom: 8px;">
              Walsh codes are orthogonal binary sequences generated recursively using the Hadamard matrix:
              <strong style="color: #00e5ff;">H<sub>2N</sub> = [ H<sub>N</sub>, H<sub>N</sub> ; H<sub>N</sub>, &not;H<sub>N</sub> ]</strong>.
              When transmitted, users multiply their data bit by their assigned Walsh code row.
              Because all rows are mathematically orthogonal (&lang;W<sub>i</sub>, W<sub>j</sub>&rang; = 0 for i &ne; j), the receiver despreads the desired signal with <em>zero cross-channel interference</em>!
            </p>

            <!-- Hadamard Matrix Generation Buttons -->
            <div style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center; flex-wrap: wrap;">
              <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim); font-weight: 700;">HADAMARD ORDER:</span>
              <button class="btn-ctrl" id="btn-hadamard-1">H₁ (1×1)</button>
              <button class="btn-ctrl" id="btn-hadamard-2">H₂ (2×2)</button>
              <button class="btn-ctrl active" id="btn-hadamard-4">H₄ (4×4 Default)</button>
              <button class="btn-ctrl" id="btn-hadamard-8">H₈ (8×8)</button>
              <div id="hadamard-matrix-view" style="margin-left: auto; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-cyan); background: #04091a; padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(0,229,255,0.25);">
                H₄: 4 Orthogonal Rows (N = 4 Chips/Bit)
              </div>
            </div>

            <!-- Interactive User Data Bits & Receiver Target Code -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-bottom: 10px;">
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>DESIRED RECEIVER CORRELATION CODE</span>
                  <span id="walsh-user-lbl" style="color: #00ff9d; font-weight: 700;">W₂: (+1, -1, +1, -1)</span>
                </div>
                <select id="walsh-select-user" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.75rem; border-radius: 4px; margin-top: 4px;">
                  <option value="1">User 1 [Code W₁: +1, +1, +1, +1]</option>
                  <option value="2" selected>User 2 [Code W₂: +1, -1, +1, -1]</option>
                  <option value="3">User 3 [Code W₃: +1, +1, -1, -1]</option>
                  <option value="4">User 4 [Code W₄: +1, -1, -1, +1]</option>
                </select>
              </div>

              <!-- Interactive Data Bits Clicker for Users 1..4 -->
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>SUBSCRIBER DATA BITS (CLICK TO FLIP)</span>
                  <span style="color: var(--accent-sky); font-size: 0.7rem;">bᵢ &in; {+1, -1}</span>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
                  <button class="btn-ctrl active" id="btn-bit-u1" style="font-size: 0.72rem; padding: 4px 8px;">U1 Bit: <strong style="color:#00ff9d;">+1</strong></button>
                  <button class="btn-ctrl active" id="btn-bit-u2" style="font-size: 0.72rem; padding: 4px 8px;">U2 Bit: <strong style="color:#00ff9d;">+1</strong></button>
                  <button class="btn-ctrl active" id="btn-bit-u3" style="font-size: 0.72rem; padding: 4px 8px;">U3 Bit: <strong style="color:#00ff9d;">+1</strong></button>
                  <button class="btn-ctrl active" id="btn-bit-u4" style="font-size: 0.72rem; padding: 4px 8px;">U4 Bit: <strong style="color:#00ff9d;">+1</strong></button>
                </div>
              </div>
            </div>

            <!-- Composite Waveform & Correlator Output Display -->
            <div style="background: #020409; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px; margin-top: 10px; overflow-x: auto;">
              <svg viewBox="0 0 760 160" style="width: 100%; height: 160px; min-width: 500px;" id="walsh-svg">
                <text x="20" y="24" fill="#64748b" font-size="10" font-family="monospace">COMPOSITE AIR SIGNAL: S(t) = ∑ bᵢ · Wᵢ  (LINEAR AIR SUPERPOSITION)</text>
                <path id="walsh-composite-wave" d="" fill="none" stroke="#ffb703" stroke-width="2.8"/>
                <line x1="20" y1="100" x2="740" y2="100" stroke="rgba(255,255,255,0.15)"/>
                <text x="20" y="125" fill="#00ff9d" font-size="11" font-family="monospace" font-weight="700" id="walsh-correlator-text">
                  CORRELATOR OUTPUT (⟨Composite, W_k⟩): +4.0 → RECOVERED BIT = +1 (100% ORTHOGONAL)
                </text>
              </svg>
            </div>
          </div>

          <!-- 2. Interactive Animated RAKE Receiver Architecture (Stallings Figure 10.17) -->
          <div class="interactive-panel" style="margin-top: 16px;">
            <div class="panel-header">
              <span>ANIMATED 3-FINGER RAKE RECEIVER & MULTIPATH DIVERSITY COMBINER (FIGURE 10.17)</span>
              <span class="panel-tag" id="rake-status-badge">MRC COMBINER ACTIVE (+3.8 dB GAIN)</span>
            </div>

            <p class="lesson-text" style="margin-bottom: 8px;">
              In cellular multipath propagation, the transmitted pulse bounces off buildings and hills, creating delayed echoes (&tau;<sub>1</sub>, &tau;<sub>2</sub>, &tau;<sub>3</sub>).
              Without a RAKE receiver, these delayed echoes destructively interfere (creating deep Rayleigh nulls).
              The <strong>RAKE receiver (Stallings Fig 10.17)</strong> dedicates 3 parallel correlator "fingers" to track and delay-compensate each echo, multiplying by the user's Walsh code, and combining them using <strong>Maximal Ratio Combining (MRC)</strong>:
              <strong style="color: #00ff9d;">r<sub>comb</sub>(t) = &sum; &alpha;<sub>i</sub> &middot; r<sub>i</sub>(t - &tau;<sub>i</sub>)</strong>.
            </p>

            <!-- RAKE Control Toolbar -->
            <div style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center; flex-wrap: wrap;">
              <button class="btn-ctrl active" id="btn-rake-play" style="min-width: 80px;">⏸ PAUSE</button>
              <button class="btn-ctrl active" id="btn-rake-toggle-mrc" style="background: rgba(0,255,157,0.15); border-color:#00ff9d; color:#00ff9d; font-weight: 700;">
                🎚️ RAKE COMBINER: ENABLED (MRC)
              </button>
              <div style="display: flex; gap: 10px; align-items: center; margin-left: auto; font-family: var(--font-mono); font-size: 0.72rem;">
                <label style="color:#00e5ff; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-finger-1" checked/> Finger 1 (Direct)</label>
                <label style="color:#ffb703; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-finger-2" checked/> Finger 2 (Echo 1)</label>
                <label style="color:#c084fc; display:flex; align-items:center; gap:4px;"><input type="checkbox" id="chk-finger-3" checked/> Finger 3 (Echo 2)</label>
              </div>
            </div>

            <!-- Dynamic Animated RAKE SVG Stage -->
            <div style="background: #02050e; border: 1px solid rgba(0, 229, 255, 0.25); border-radius: 6px; overflow: hidden; height: 360px;">
              <svg id="svg-rake-stage" viewBox="0 0 840 360" style="width: 100%; height: 100%;">
                <!-- Dynamically rendered and animated via activeRakeRaf loop -->
              </svg>
            </div>

            <!-- RAKE Parameter Sliders -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 12px;">
              <div class="d3-slider-item">
                <div class="d3-slider-label">
                  <span>ECHO 2 DELAY &tau;₂ (BUILDING BOUNCE)</span>
                  <span class="d3-slider-val" id="val-rake-tau2">1.63 &micro;s (2 chips)</span>
                </div>
                <input type="range" class="control-slider" id="slider-rake-tau2" min="0.8" max="4.0" step="0.2" value="1.63"/>
              </div>

              <div class="d3-slider-item">
                <div class="d3-slider-label">
                  <span>ECHO 3 DELAY &tau;₃ (DIFFRACTED HILL)</span>
                  <span class="d3-slider-val" id="val-rake-tau3">3.26 &micro;s (4 chips)</span>
                </div>
                <input type="range" class="control-slider" id="slider-rake-tau3" min="2.0" max="8.0" step="0.2" value="3.26"/>
              </div>

              <div class="d3-slider-item">
                <div class="d3-slider-label">
                  <span>EFFECTIVE RECEIVED SNR</span>
                  <span class="d3-slider-val" id="val-rake-snr" style="color:#00ff9d; font-weight:700;">14.8 dB (+3.8 dB RAKE Gain)</span>
                </div>
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;" id="rake-gain-expl">
                  Constructive maximal ratio combining eliminates multipath nulls!
                </div>
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
    const btnFloatMin = container.querySelector('#btn-floating-minimize');

    // True Fullscreen Mode Controls
    const btnTrueFullscreen = container.querySelector('#btn-true-fullscreen');
    const btnExitFsTop = container.querySelector('#btn-exit-fullscreen-top');
    const simFsTopBar = container.querySelector('#sim-fullscreen-top-bar');
    const fsHudStatus = container.querySelector('#fs-hud-status');

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
    const btnDev2 = container.querySelector('#btn-dev-2');
    const btnDev3 = container.querySelector('#btn-dev-3');
    const btnDev4 = container.querySelector('#btn-dev-4');
    const btnDev8 = container.querySelector('#btn-dev-8');
    const fsUserBtns = container.querySelectorAll('#fs-user-quick-btns button');

    // Fullscreen Top Bar Controls
    const btnFsPlay = container.querySelector('#btn-fs-play');
    const btnFsStep = container.querySelector('#btn-fs-step');
    const btnFsReset = container.querySelector('#btn-fs-reset');
    const btnFsFdma = container.querySelector('#btn-fs-fdma');
    const btnFsTdma = container.querySelector('#btn-fs-tdma');
    const btnFsCdma = container.querySelector('#btn-fs-cdma');
    const fsBadgeUplink = container.querySelector('#fs-badge-uplink');
    const fsBadgeDuplex = container.querySelector('#fs-badge-duplex');
    const fsBadgeDownlink = container.querySelector('#fs-badge-downlink');
    const fsActionBanner = container.querySelector('#fs-action-banner');

    // Overload Node & Blocked Wave Elements
    const nodeMsOverload = container.querySelector('#node-ms-overload-cluster');
    const waveBlocked = container.querySelector('#iso-wave-blocked');
    const badgeWaveBlocked = container.querySelector('#badge-wave-blocked');

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

    // Subscriber Nodes & Freq Labels
    const nodeMs1 = container.querySelector('#node-ms1');
    const nodeMs2 = container.querySelector('#node-ms2');
    const nodeMs3 = container.querySelector('#node-ms3');
    const nodeMs4 = container.querySelector('#node-ms4');
    const ms1LabelFreq = container.querySelector('#ms1-label-freq');
    const ms2LabelFreq = container.querySelector('#ms2-label-freq');
    const ms3LabelFreq = container.querySelector('#ms3-label-freq');
    const ms4LabelFreq = container.querySelector('#ms4-label-freq');

    // Tower & Core Nodes
    const nodeTower = container.querySelector('#node-tower');
    const subnodeShelter = container.querySelector('#subnode-shelter');
    const nodeBsc = container.querySelector('#node-bsc');
    const nodeCore = container.querySelector('#node-core');
    const nodeServer = container.querySelector('#node-server');

    // Backhaul & Public Interconnect Lines
    const lineAbis = container.querySelector('#line-abis');
    const labelAbis = container.querySelector('#label-abis');
    const lineSs7 = container.querySelector('#line-ss7');
    const labelSs7 = container.querySelector('#label-ss7');
    const lineFiber = container.querySelector('#line-fiber');
    const labelFiber = container.querySelector('#label-fiber');

    // Base Station Large Blue Coverage Sector Elements
    const sectorGlowEllipse = container.querySelector('#sector-glow-ellipse');
    const sectorRing1 = container.querySelector('#sector-ring-1');
    const sectorRing2 = container.querySelector('#sector-ring-2');
    const sectorRing3 = container.querySelector('#sector-ring-3');
    const sectorRing4 = container.querySelector('#sector-ring-4');
    const sectorTag1 = container.querySelector('#sector-tag-1');
    const sectorTag2 = container.querySelector('#sector-tag-2');
    const sectorTag3 = container.querySelector('#sector-tag-3');
    const sectorTag4 = container.querySelector('#sector-tag-4');
    const sectorLegendLabel = container.querySelector('#sector-legend-label');

    // Sine Waves & Badges
    const waveMs1 = container.querySelector('#iso-wave-ms1');
    const waveMs2 = container.querySelector('#iso-wave-ms2');
    const waveMs3 = container.querySelector('#iso-wave-ms3');
    const waveMs4 = container.querySelector('#iso-wave-ms4');
    const waveDownlink = container.querySelector('#iso-wave-downlink');
    const badgeMs1 = container.querySelector('#badge-wave-ms1');
    const badgeMs2 = container.querySelector('#badge-wave-ms2');
    const badgeMs3 = container.querySelector('#badge-wave-ms3');
    const badgeMs4 = container.querySelector('#badge-wave-ms4');
    const badgeDl = container.querySelector('#badge-wave-dl');

    // Moving Packet Elements
    const pktGroupMs1 = container.querySelector('#pkt-group-ms1');
    const pktBoxMs1 = container.querySelector('#pkt-box-ms1');
    const pktTextMs1 = container.querySelector('#pkt-text-ms1');

    const pktGroupMs2 = container.querySelector('#pkt-group-ms2');
    const pktBoxMs2 = container.querySelector('#pkt-box-ms2');
    const pktTextMs2 = container.querySelector('#pkt-text-ms2');

    const pktGroupMs3 = container.querySelector('#pkt-group-ms3');
    const pktBoxMs3 = container.querySelector('#pkt-box-ms3');
    const pktTextMs3 = container.querySelector('#pkt-text-ms3');

    const pktGroupMs4 = container.querySelector('#pkt-group-ms4');
    const pktBoxMs4 = container.querySelector('#pkt-box-ms4');
    const pktTextMs4 = container.querySelector('#pkt-text-ms4');

    const pktGroupAck1 = container.querySelector('#pkt-group-ack1');
    const pktBoxAck1 = container.querySelector('#pkt-box-ack1');
    const pktTextAck1 = container.querySelector('#pkt-text-ack1');

    const pktGroupAck2 = container.querySelector('#pkt-group-ack2');
    const pktBoxAck2 = container.querySelector('#pkt-box-ack2');
    const pktTextAck2 = container.querySelector('#pkt-text-ack2');

    const pktGroupAck3 = container.querySelector('#pkt-group-ack3');
    const pktBoxAck3 = container.querySelector('#pkt-box-ack3');
    const pktTextAck3 = container.querySelector('#pkt-text-ack3');

    const pktGroupAck4 = container.querySelector('#pkt-group-ack4');
    const pktBoxAck4 = container.querySelector('#pkt-box-ack4');
    const pktTextAck4 = container.querySelector('#pkt-text-ack4');

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
    // DYNAMIC COORDINATE SYSTEM SPECIFICATIONS (EXPANDED GAPS: TOWER, BSC, MSC, SERVER)
    // ─────────────────────────────────────────────────────────────────────────
    const layoutCoords = {
      standard: {
        width: 2700, height: 720,
        ms1: { x: 150, y: 460 },
        ms2: { x: 160, y: 180 },
        ms3: { x: 440, y: 530 }, // Laptop Workstation in a separate area
        ms4: { x: 430, y: 130 }, // Vehicular Terminal
        tower: { x: 1100, y: 380 }, // Base Station Tower, giving huge air link spacing
        shelter: { x: -95, y: 80 },
        bsc: { x: 1580, y: 380 }, // Generous 480px gap from Tower to BSC
        core: { x: 2060, y: 320 }, // Generous 480px gap from BSC to MTSO Core
        server: { x: 2540, y: 380 }, // Generous 480px gap from Core to Web Host Server
        lineAbis: { x1: 1160, y1: 390, x2: 1520, y2: 390 },
        labelAbis: { x: 1340, y: 375 },
        lineSs7: { x1: 1640, y1: 390, x2: 2000, y2: 335 },
        labelSs7: { x: 1820, y: 345 },
        lineFiber: { x1: 2120, y1: 325, x2: 2480, y2: 380 },
        labelFiber: { x: 2300, y: 335 },
        coverage: { cx: 1100, cy: 390, rx: 1040, ry: 270 },
        rings: [
          { rx: 220, ry: 55, tagX: 1110, tagY: 330 },
          { rx: 440, ry: 105, tagX: 1110, tagY: 280 },
          { rx: 660, ry: 155, tagX: 1110, tagY: 230 },
          { rx: 880, ry: 205, tagX: 1110, tagY: 180 }
        ],
        legend: { x: 50, y: 690 },
        cameraTargets: {
          overview: { vx: 0, vy: 0, vw: 2700, vh: 720, label: 'OVERVIEW (1.0×)', icon: '🌐' },
          client: { vx: 40, vy: 80, vw: 600, vh: 520, label: 'CLIENT SUBSCRIBERS (3.2×)', icon: '💻' },
          air: { vx: 300, vy: 60, vw: 950, vh: 540, label: 'AIR PROPAGATION (2.0×)', icon: '📡' },
          tower: { vx: 940, vy: 140, vw: 520, vh: 500, label: 'BASE STATION TOWER (3.5×)', icon: '🗼' },
          bsc: { vx: 1420, vy: 140, vw: 500, vh: 500, label: 'BSC CONTROLLER (4.0×)', icon: '🎛️' },
          core: { vx: 1900, vy: 120, vw: 500, vh: 500, label: 'MTSO CORE & HLR/VLR (4.0×)', icon: '☁️' },
          server: { vx: 2380, vy: 140, vw: 400, vh: 500, label: 'WEB HOST 8.8.8.8 (5.0×)', icon: '🖥️' }
        }
      },
      fullscreen: {
        width: 3600, height: 980,
        ms1: { x: 200, y: 640 },
        ms2: { x: 220, y: 240 },
        ms3: { x: 640, y: 740 }, // Laptop Workstation in a separate area
        ms4: { x: 620, y: 170 }, // Vehicular Terminal
        tower: { x: 1500, y: 520 }, // 1300px air link distance
        shelter: { x: -110, y: 95 },
        bsc: { x: 2180, y: 520 }, // 680px gap to BSC
        core: { x: 2860, y: 440 }, // 680px gap to Core
        server: { x: 3480, y: 520 }, // 620px gap to Server
        lineAbis: { x1: 1570, y1: 530, x2: 2120, y2: 530 },
        labelAbis: { x: 1845, y: 515 },
        lineSs7: { x1: 2240, y1: 530, x2: 2800, y2: 455 },
        labelSs7: { x: 2520, y: 470 },
        lineFiber: { x1: 2920, y1: 445, x2: 3420, y2: 515 },
        labelFiber: { x: 3170, y: 460 },
        coverage: { cx: 1500, cy: 530, rx: 1400, ry: 380 },
        rings: [
          { rx: 300, ry: 70, tagX: 1510, tagY: 450 },
          { rx: 600, ry: 140, tagX: 1510, tagY: 380 },
          { rx: 900, ry: 210, tagX: 1510, tagY: 310 },
          { rx: 1200, ry: 280, tagX: 1510, tagY: 240 }
        ],
        legend: { x: 50, y: 940 },
        cameraTargets: {
          overview: { vx: 0, vy: 0, vw: 3600, vh: 980, label: 'EXPANDED OVERVIEW (1.0×)', icon: '🌐' },
          client: { vx: 60, vy: 120, vw: 800, vh: 740, label: 'CLIENT SUBSCRIBERS (3.5×)', icon: '💻' },
          air: { vx: 400, vy: 100, vw: 1350, vh: 760, label: 'WIDE AIR LINK (2.0×)', icon: '📡' },
          tower: { vx: 1300, vy: 180, vw: 600, vh: 700, label: 'BASE STATION TOWER (4.3×)', icon: '🗼' },
          bsc: { vx: 1980, vy: 180, vw: 580, vh: 700, label: 'BSC CONTROLLER (5.0×)', icon: '🎛️' },
          core: { vx: 2660, vy: 160, vw: 580, vh: 700, label: 'MTSO CORE & HLR/VLR (5.0×)', icon: '☁️' },
          server: { vx: 3280, vy: 180, vw: 450, vh: 700, label: 'WEB HOST 8.8.8.8 (6.5×)', icon: '🖥️' }
        }
      }
    };

    let activeLayoutKey = 'standard';
    let activeLayout = layoutCoords.standard;
    let isTrueFullscreen = false;

    let curVx = 0, curVy = 0, curVw = 1600, curVh = 520;

    const applyLayoutCoordinates = (mode) => {
      activeLayoutKey = mode;
      activeLayout = layoutCoords[mode] || layoutCoords.standard;
      const L = activeLayout;

      if (isoSvg) {
        isoSvg.setAttribute('viewBox', `0 0 ${L.width} ${L.height}`);
      }
      curVx = 0; curVy = 0; curVw = L.width; curVh = L.height;

      // Update Node positions
      if (nodeMs1) nodeMs1.setAttribute('transform', `translate(${L.ms1.x}, ${L.ms1.y})`);
      if (nodeMs2) nodeMs2.setAttribute('transform', `translate(${L.ms2.x}, ${L.ms2.y})`);
      if (nodeMs3) nodeMs3.setAttribute('transform', `translate(${L.ms3.x}, ${L.ms3.y})`);
      if (nodeMs4) nodeMs4.setAttribute('transform', `translate(${L.ms4.x}, ${L.ms4.y})`);

      if (nodeTower) nodeTower.setAttribute('transform', `translate(${L.tower.x}, ${L.tower.y})`);
      if (subnodeShelter) subnodeShelter.setAttribute('transform', `translate(${L.shelter.x}, ${L.shelter.y})`);
      if (nodeBsc) nodeBsc.setAttribute('transform', `translate(${L.bsc.x}, ${L.bsc.y})`);
      if (nodeCore) nodeCore.setAttribute('transform', `translate(${L.core.x}, ${L.core.y})`);
      if (nodeServer) nodeServer.setAttribute('transform', `translate(${L.server.x}, ${L.server.y})`);

      // Update Interconnect Lines
      if (lineAbis) {
        lineAbis.setAttribute('x1', L.lineAbis.x1);
        lineAbis.setAttribute('y1', L.lineAbis.y1);
        lineAbis.setAttribute('x2', L.lineAbis.x2);
        lineAbis.setAttribute('y2', L.lineAbis.y2);
      }
      if (labelAbis) {
        labelAbis.setAttribute('x', L.labelAbis.x);
        labelAbis.setAttribute('y', L.labelAbis.y);
      }

      if (lineSs7) {
        lineSs7.setAttribute('x1', L.lineSs7.x1);
        lineSs7.setAttribute('y1', L.lineSs7.y1);
        lineSs7.setAttribute('x2', L.lineSs7.x2);
        lineSs7.setAttribute('y2', L.lineSs7.y2);
      }
      if (labelSs7) {
        labelSs7.setAttribute('x', L.labelSs7.x);
        labelSs7.setAttribute('y', L.labelSs7.y);
      }

      if (lineFiber) {
        lineFiber.setAttribute('x1', L.lineFiber.x1);
        lineFiber.setAttribute('y1', L.lineFiber.y1);
        lineFiber.setAttribute('x2', L.lineFiber.x2);
        lineFiber.setAttribute('y2', L.lineFiber.y2);
      }
      if (labelFiber) {
        labelFiber.setAttribute('x', L.labelFiber.x);
        labelFiber.setAttribute('y', L.labelFiber.y);
      }

      // Update Coverage Sector & Range Rings
      if (sectorGlowEllipse) {
        sectorGlowEllipse.setAttribute('cx', L.coverage.cx);
        sectorGlowEllipse.setAttribute('cy', L.coverage.cy);
        sectorGlowEllipse.setAttribute('rx', L.coverage.rx);
        sectorGlowEllipse.setAttribute('ry', L.coverage.ry);
      }
      const ringEls = [sectorRing1, sectorRing2, sectorRing3, sectorRing4];
      const tagEls = [sectorTag1, sectorTag2, sectorTag3, sectorTag4];
      L.rings.forEach((r, idx) => {
        if (ringEls[idx]) {
          ringEls[idx].setAttribute('cx', L.coverage.cx);
          ringEls[idx].setAttribute('cy', L.coverage.cy);
          ringEls[idx].setAttribute('rx', r.rx);
          ringEls[idx].setAttribute('ry', r.ry);
        }
        if (tagEls[idx]) {
          tagEls[idx].setAttribute('x', r.tagX);
          tagEls[idx].setAttribute('y', r.tagY);
        }
      });
      if (sectorLegendLabel) {
        sectorLegendLabel.setAttribute('x', L.legend.x);
        sectorLegendLabel.setAttribute('y', L.legend.y);
      }

      // Update Badges on Waves
      const mid1X = (L.ms1.x + L.tower.x) / 2;
      const mid2X = (L.ms2.x + L.tower.x) / 2;
      const mid3X = (L.ms3.x + L.tower.x) / 2;
      const mid4X = (L.ms4.x + L.tower.x) / 2;
      if (badgeMs1) badgeMs1.setAttribute('transform', `translate(${mid1X - 80}, ${(L.ms1.y + L.tower.y - 180) / 2 - 16})`);
      if (badgeMs2) badgeMs2.setAttribute('transform', `translate(${mid2X - 80}, ${(L.ms2.y + L.tower.y - 180) / 2 - 16})`);
      if (badgeMs3) badgeMs3.setAttribute('transform', `translate(${mid3X - 60}, ${(L.ms3.y + L.tower.y - 180) / 2 - 16})`);
      if (badgeMs4) badgeMs4.setAttribute('transform', `translate(${mid4X - 60}, ${(L.ms4.y + L.tower.y - 180) / 2 - 16})`);
      if (badgeDl) badgeDl.setAttribute('transform', `translate(${mid1X - 90}, ${(L.ms1.y + L.tower.y - 180) / 2 + 22})`);
    };

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
      const target = activeLayout.cameraTargets[preset] || activeLayout.cameraTargets.overview;
      applyViewBox(target);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TRUE FULL-SCREEN TOGGLE (REINITIALIZES CANVAS TO 2600 x 850)
    // ─────────────────────────────────────────────────────────────────────────
    const setTrueFullscreen = (enable) => {
      if (!canvasBox) return;
      isTrueFullscreen = enable;

      if (enable) {
        canvasBox.classList.add('is-true-fullscreen');
        if (simFsTopBar) simFsTopBar.style.display = 'flex';
        if (btnFloatMin) btnFloatMin.style.display = 'block';
        if (btnTrueFullscreen) btnTrueFullscreen.classList.add('active');
        document.body.style.overflow = 'hidden';
        applyLayoutCoordinates('fullscreen');
        if (fsHudStatus) {
          fsHudStatus.textContent = `● EXPANDED VIEW ACTIVE: BTS TOWER & MOBILES PLACED FURTHER APART (2600 × 850)`;
        }
      } else {
        canvasBox.classList.remove('is-true-fullscreen');
        if (simFsTopBar) simFsTopBar.style.display = 'none';
        if (btnFloatMin) btnFloatMin.style.display = 'none';
        if (btnTrueFullscreen) btnTrueFullscreen.classList.remove('active');
        document.body.style.overflow = '';
        applyLayoutCoordinates('standard');
      }

      applyViewBox(activeLayout.cameraTargets.overview);
    };

    if (btnTrueFullscreen) {
      btnTrueFullscreen.addEventListener('click', () => setTrueFullscreen(!isTrueFullscreen));
    }
    if (btnExitFsTop) {
      btnExitFsTop.addEventListener('click', () => setTrueFullscreen(false));
    }
    if (btnFloatMin) {
      btnFloatMin.addEventListener('click', () => setTrueFullscreen(false));
    }

    // In-App Stage Height Buttons (Compact, Standard, Cinema)
    const setStageSize = (size) => {
      if (!canvasBox) return;
      if (isTrueFullscreen) setTrueFullscreen(false);
      canvasBox.classList.remove('size-compact', 'size-standard', 'size-cinema');
      [btnSizeCompact, btnSizeStandard, btnSizeCinema].forEach(b => b && b.classList.remove('active'));

      if (size === 'compact') {
        canvasBox.classList.add('size-compact');
        if (btnSizeCompact) btnSizeCompact.classList.add('active');
      } else if (size === 'cinema') {
        canvasBox.classList.add('size-cinema');
        if (btnSizeCinema) btnSizeCinema.classList.add('active');
      } else {
        canvasBox.classList.add('size-standard');
        if (btnSizeStandard) btnSizeStandard.classList.add('active');
      }
    };

    if (btnSizeCompact) btnSizeCompact.addEventListener('click', () => setStageSize('compact'));
    if (btnSizeStandard) btnSizeStandard.addEventListener('click', () => setStageSize('standard'));
    if (btnSizeCinema) btnSizeCinema.addEventListener('click', () => setStageSize('cinema'));

    const onKeyEsc = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (isTrueFullscreen) setTrueFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyEsc);

    // Camera preset button event listeners
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
          applyViewBox(activeLayout.cameraTargets.overview);
        }
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOUSE DRAG / PAN & WHEEL ZOOM (USER FREEDOM)
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
        const scaleX = curVw / (boxRect.width || activeLayout.width);
        const scaleY = curVh / (boxRect.height || activeLayout.height);
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
        const maxVw = activeLayout.width * 1.5;
        const maxVh = activeLayout.height * 1.5;
        const newVw = Math.max(300, Math.min(maxVw, curVw * zoomFactor));
        const newVh = Math.max(120, Math.min(maxVh, curVh * zoomFactor));
        curVx += (curVw - newVw) / 2;
        curVy += (curVh - newVh) / 2;
        curVw = newVw;
        curVh = newVh;
        isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
        if (camStatus) camStatus.textContent = `ZOOM (${(activeLayout.width / curVw).toFixed(1)}×)`;
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
        const newVw = Math.max(300, curVw * 0.8);
        const newVh = Math.max(120, curVh * 0.8);
        curVx += (curVw - newVw) / 2;
        curVy += (curVh - newVh) / 2;
        curVw = newVw;
        curVh = newVh;
        isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
        if (camStatus) camStatus.textContent = `ZOOM (${(activeLayout.width / curVw).toFixed(1)}×)`;
      });
    }

    if (btnSimZout) {
      btnSimZout.addEventListener('click', () => {
        ch10State.autoCamera = false;
        if (autoCamText) { autoCamText.textContent = 'OFF'; autoCamText.style.color = 'var(--text-dim)'; }
        if (btnAutoCam) btnAutoCam.classList.remove('active');
        const newVw = Math.min(activeLayout.width * 1.5, curVw * 1.25);
        const newVh = Math.min(activeLayout.height * 1.5, curVh * 1.25);
        curVx += (curVw - newVw) / 2;
        curVy += (curVh - newVh) / 2;
        curVw = newVw;
        curVh = newVh;
        isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
        if (camStatus) camStatus.textContent = `ZOOM (${(activeLayout.width / curVw).toFixed(1)}×)`;
      });
    }

    if (btnSimResetView) {
      btnSimResetView.addEventListener('click', () => {
        setManualCamera('overview');
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DYNAMIC FREQUENCIES FOR EACH MOBILE (OWN FREQUENCY TRANSPARENCY)
    // ─────────────────────────────────────────────────────────────────────────
    const updateFrequencyParams = () => {
      const fUl = parseFloat(inUplink ? inUplink.value : 825.03) || 825.03;
      const duplex = parseFloat(inDuplex ? inDuplex.value : 45.0) || 45.0;
      const fDl = fUl + duplex;
      if (dispDownlink) dispDownlink.textContent = `${fDl.toFixed(2)} MHz`;

      const mode = ch10State.accessMode;

      // Calculate distinct frequencies for Mobiles 1, 2, 3, 4
      const f1 = fUl;
      const f2 = fUl + 0.03;
      const f3 = fUl + 0.06;
      const f4 = fUl + 0.09;

      if (mode === 'fdma') {
        if (ms1LabelFreq) ms1LabelFreq.textContent = `f₁: ${f1.toFixed(2)} MHz`;
        if (ms2LabelFreq) ms2LabelFreq.textContent = `f₂: ${f2.toFixed(2)} MHz`;
        if (ms3LabelFreq) ms3LabelFreq.textContent = `Workstation f₃: ${f3.toFixed(2)} MHz`;
        if (ms4LabelFreq) ms4LabelFreq.textContent = `Vehicular f₄: ${f4.toFixed(2)} MHz`;

        const b1 = badgeMs1 ? badgeMs1.querySelector('text') : null;
        const b2 = badgeMs2 ? badgeMs2.querySelector('text') : null;
        const b3 = badgeMs3 ? badgeMs3.querySelector('text') : null;
        const b4 = badgeMs4 ? badgeMs4.querySelector('text') : null;
        const bDl = badgeDl ? badgeDl.querySelector('text') : null;
        if (b1) b1.textContent = `f₁: ${f1.toFixed(2)} MHz`;
        if (b2) b2.textContent = `f₂: ${f2.toFixed(2)} MHz`;
        if (b3) b3.textContent = `f₃: ${f3.toFixed(2)} MHz (Data)`;
        if (b4) b4.textContent = `f₄: ${f4.toFixed(2)} MHz (Doppler)`;
        if (bDl) bDl.textContent = `DOWNLINK: ${fDl.toFixed(2)} MHz (+${duplex.toFixed(0)}M)`;
      } else if (mode === 'tdma') {
        if (ms1LabelFreq) ms1LabelFreq.textContent = `TS 1: ${f1.toFixed(2)} MHz (577 µs)`;
        if (ms2LabelFreq) ms2LabelFreq.textContent = `TS 3: ${f1.toFixed(2)} MHz (577 µs)`;
        if (ms3LabelFreq) ms3LabelFreq.textContent = `TS 5: Workstation (Data)`;
        if (ms4LabelFreq) ms4LabelFreq.textContent = `TS 7: Vehicular (Doppler)`;

        const b1 = badgeMs1 ? badgeMs1.querySelector('text') : null;
        const b2 = badgeMs2 ? badgeMs2.querySelector('text') : null;
        const b3 = badgeMs3 ? badgeMs3.querySelector('text') : null;
        const b4 = badgeMs4 ? badgeMs4.querySelector('text') : null;
        const bDl = badgeDl ? badgeDl.querySelector('text') : null;
        if (b1) b1.textContent = `GSM TS 1 (${f1.toFixed(1)} MHz)`;
        if (b2) b2.textContent = `GSM TS 3 (${f1.toFixed(1)} MHz)`;
        if (b3) b3.textContent = `GSM TS 5 (Laptop Data)`;
        if (b4) b4.textContent = `GSM TS 7 (Vehicular)`;
        if (bDl) bDl.textContent = `DL TS 1: ${fDl.toFixed(2)} MHz`;
      } else {
        if (ms1LabelFreq) ms1LabelFreq.textContent = `Walsh W₁ (1.2288 Mcps)`;
        if (ms2LabelFreq) ms2LabelFreq.textContent = `Walsh W₂ (1.2288 Mcps)`;
        if (ms3LabelFreq) ms3LabelFreq.textContent = `Walsh W₃ (Laptop Data)`;
        if (ms4LabelFreq) ms4LabelFreq.textContent = `Walsh W₄ (Vehicular)`;

        const b1 = badgeMs1 ? badgeMs1.querySelector('text') : null;
        const b2 = badgeMs2 ? badgeMs2.querySelector('text') : null;
        const b3 = badgeMs3 ? badgeMs3.querySelector('text') : null;
        const b4 = badgeMs4 ? badgeMs4.querySelector('text') : null;
        const bDl = badgeDl ? badgeDl.querySelector('text') : null;
        if (b1) b1.textContent = `CDMA Code W₁`;
        if (b2) b2.textContent = `CDMA Code W₂`;
        if (b3) b3.textContent = `CDMA Code W₃ (Data)`;
        if (b4) b4.textContent = `CDMA Code W₄ (Car)`;
        if (bDl) bDl.textContent = `DL Pilot + W₆₄: ${fDl.toFixed(2)}M`;
      }

      if (hudPhy) {
        const m = mode.toUpperCase();
        hudPhy.textContent = `[${m}] UPLINK: f1=${f1.toFixed(2)}M | f2=${f2.toFixed(2)}M | f3=${f3.toFixed(2)}M | f4=${f4.toFixed(2)}M | DOWNLINK: ${fDl.toFixed(2)} MHz`;
      }

      // Synchronize Fullscreen Badges
      if (fsBadgeUplink) fsBadgeUplink.textContent = `${fUl.toFixed(2)} MHz`;
      if (fsBadgeDuplex) fsBadgeDuplex.textContent = `${duplex.toFixed(1)} MHz`;
      if (fsBadgeDownlink) fsBadgeDownlink.textContent = `${fDl.toFixed(2)} MHz`;
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
    // TOWER CAPACITY & SUBSCRIBER MULTI-ACCESS ALLOCATION (WITH CALL BLOCKING)
    // ─────────────────────────────────────────────────────────────────────────
    const updateTowerCapacityDisplay = () => {
      if (!towerGrid || !towerMeterFill || !towerUtilText) return;
      const count = ch10State.activeDevicesCount;
      const mode = ch10State.accessMode;
      const maxChannels = 4; // Macro sector traffic channels
      const isBlocked = count > maxChannels;

      let pct = Math.min(100, (count / maxChannels) * 100);
      towerMeterFill.style.width = `${pct}%`;

      if (isBlocked) {
        towerMeterFill.style.background = '#ff0055';
        towerUtilText.style.color = '#ff0055';
        towerUtilText.textContent = `${count} MOBILES / ${maxChannels} TRUNKS (${Math.round((count/maxChannels)*100)}% OVERLOAD — CALL BLOCKED!)`;
        if (towerBlockNotice) {
          towerBlockNotice.style.display = 'block';
          towerBlockNotice.innerHTML = `⚠️ <strong>OVERLOAD CALL BLOCKING ACTIVE!</strong> All ${maxChannels} sector RF carriers saturated by Mobiles 1–4. Competing subscribers MS-5..${count} rejected with fast busy tone (Erlang B Lost Calls Cleared, Blocking Prob P > 40%).`;
        }
      } else {
        towerMeterFill.style.background = count === maxChannels ? '#ffb703' : 'var(--accent-cyan)';
        towerUtilText.style.color = count === maxChannels ? '#ffb703' : 'var(--accent-cyan)';
        towerUtilText.textContent = `${count} / ${maxChannels} TRUNKS (${pct.toFixed(0)}% LOAD)`;
        if (towerBlockNotice) towerBlockNotice.style.display = 'none';
      }

      let chipsHtml = '';
      if (mode === 'fdma') {
        if (towerTypeLabel) towerTypeLabel.textContent = '30 kHz FDMA CARRIERS (AMPS):';
        for (let i = 1; i <= 8; i++) {
          const inUse = i <= Math.min(count, maxChannels);
          const isOver = i > maxChannels && i <= count;
          chipsHtml += `<span class="channel-chip ${isOver ? 'free' : (inUse ? 'in-use' : 'free')}" style="${isOver ? 'border-color:#ff0055; color:#ff0055;' : ''}">${isOver ? `MS-${i} BLOCKED` : `f${i} (${(825.0 + i*0.03).toFixed(2)} MHz)`}</span>`;
        }
      } else if (mode === 'tdma') {
        if (towerTypeLabel) towerTypeLabel.textContent = 'GSM 8-SLOT TDMA FRAME (200 kHz):';
        for (let i = 0; i < 8; i++) {
          const inUse = i < Math.min(count, maxChannels);
          chipsHtml += `<span class="channel-chip ${inUse ? 'in-use' : 'free'}">Slot ${i} (${(i*0.577).toFixed(1)}ms)</span>`;
        }
      } else {
        if (towerTypeLabel) towerTypeLabel.textContent = 'CDMA WALSH 64 ORTHOGONAL CODES:';
        for (let i = 1; i <= Math.min(count, maxChannels); i++) {
          chipsHtml += `<span class="channel-chip in-use">W_${i} (Active)</span>`;
        }
        for (let i = Math.min(count, maxChannels) + 1; i <= 8; i++) {
          chipsHtml += `<span class="channel-chip free">W_${i} (Free)</span>`;
        }
      }
      towerGrid.innerHTML = chipsHtml;
    };

    // Show/Hide subscriber nodes and distinct carrier wave paths
    const updateVisibleSubscribers = () => {
      const count = ch10State.activeDevicesCount;
      if (nodeMs1) nodeMs1.style.display = 'block';
      if (nodeMs2) nodeMs2.style.display = count >= 2 ? 'block' : 'none';
      if (nodeMs3) nodeMs3.style.display = count >= 3 ? 'block' : 'none';
      if (nodeMs4) nodeMs4.style.display = count >= 4 ? 'block' : 'none';
      if (nodeMsOverload) nodeMsOverload.style.display = count >= 8 ? 'block' : 'none';

      // Wave opacity
      if (badgeMs2) badgeMs2.setAttribute('opacity', count >= 2 ? '1' : '0');
      if (badgeMs3) badgeMs3.setAttribute('opacity', count >= 3 ? '1' : '0');
      if (badgeMs4) badgeMs4.setAttribute('opacity', count >= 4 ? '1' : '0');
      if (badgeWaveBlocked) badgeWaveBlocked.setAttribute('opacity', count >= 8 ? '1' : '0');
    };

    const setDeviceCount = (num) => {
      ch10State.activeDevicesCount = num;
      [btnDev1, btnDev2, btnDev3, btnDev4, btnDev8].forEach(b => b && b.classList.remove('active'));
      if (num === 1 && btnDev1) btnDev1.classList.add('active');
      else if (num === 2 && btnDev2) btnDev2.classList.add('active');
      else if (num === 3 && btnDev3) btnDev3.classList.add('active');
      else if (num === 4 && btnDev4) btnDev4.classList.add('active');
      else if (num === 8 && btnDev8) btnDev8.classList.add('active');

      fsUserBtns.forEach(btn => {
        const c = Number(btn.getAttribute('data-fs-count'));
        btn.classList.toggle('active', c === num);
      });

      updateVisibleSubscribers();
      updateTowerCapacityDisplay();
      updateFrequencyParams();
    };

    if (btnDev1) btnDev1.addEventListener('click', () => setDeviceCount(1));
    if (btnDev2) btnDev2.addEventListener('click', () => setDeviceCount(2));
    if (btnDev3) btnDev3.addEventListener('click', () => setDeviceCount(3));
    if (btnDev4) btnDev4.addEventListener('click', () => setDeviceCount(4));
    if (btnDev8) btnDev8.addEventListener('click', () => setDeviceCount(8));

    fsUserBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const c = Number(btn.getAttribute('data-fs-count'));
        setDeviceCount(c);
      });
    });

    const setAccessMode = (mode) => {
      ch10State.accessMode = mode;
      [btnTopFdma, btnTopTdma, btnTopCdma, btnFsFdma, btnFsTdma, btnFsCdma].forEach(b => b && b.classList.remove('active'));

      if (mode === 'fdma') {
        btnTopFdma && btnTopFdma.classList.add('active');
        btnFsFdma && btnFsFdma.classList.add('active');
        if (modeTag) modeTag.textContent = '1G FDMA (AMPS ANALOG)';
      } else if (mode === 'tdma') {
        btnTopTdma && btnTopTdma.classList.add('active');
        btnFsTdma && btnFsTdma.classList.add('active');
        if (modeTag) modeTag.textContent = '2G TDMA (GSM DIGITAL)';
      } else {
        btnTopCdma && btnTopCdma.classList.add('active');
        btnFsCdma && btnFsCdma.classList.add('active');
        if (modeTag) modeTag.textContent = '2G/3G CDMA (IS-95 SPREAD SPECTRUM)';
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
    // SIMPLIFIED, CRYSTAL-CLEAR 6-STAGE 2-WAY ROUND TRIP PROCEDURE SPECIFICATION
    // ─────────────────────────────────────────────────────────────────────────
    const stepProcedures6 = {
      fdma: [
        {
          num: 'STAGE 1 OF 6', dir: '⬆️ UPLINK TRANSMISSION',
          title: '1. MOBILES RADIATE ON DEDICATED FREQUENCIES',
          desc: 'Each mobile handset modulates voice onto its own dedicated reverse carrier: MS-1 transmits on f1 (825.03 MHz), MS-2 on f2 (825.06 MHz), and the remote Laptop on f3 (825.09 MHz) to avoid co-channel clash.',
          meta: [{ k: 'TRANSMITTERS', v: 'MS-1 (Handset), MS-2, MS-3 (Laptop)' }, { k: 'ACCESS SCHEME', v: 'Frequency Division Multiplexing' }, { k: 'CHANNEL SEPARATION', v: '30 kHz Carson Guard Band' }, { k: 'POWER OUTPUT', v: '+28 dBm (600 mW Mobile EIRP)' }]
        },
        {
          num: 'STAGE 2 OF 6', dir: '⬆️ UPLINK PROPAGATION',
          title: '2. AIR PROPAGATION ACROSS COVERAGE SECTOR',
          desc: 'Electromagnetic carrier waves traverse through the 5.0 km cellular coverage sector. Waves experience free-space path loss and urban shadow fading according to the Hata propagation model.',
          meta: [{ k: 'SECTOR RADIUS', v: 'R = 5.0 km Macrocell' }, { k: 'ANTENNA PATTERN', v: '120° Tri-Sector Directional' }, { k: 'PATH LOSS', v: '-114 dB Urban Attenuation' }, { k: 'SPEED OF LIGHT', v: 'c = 3.0 × 10⁸ m/s' }]
        },
        {
          num: 'STAGE 3 OF 6', dir: '⬆️ UPLINK BACKHAUL',
          title: '3. TOWER RECEPTION, DEMUX & ABIS E1 BACKHAUL',
          desc: 'BS-A lattice tower array intercepts RF waves. Low-Noise Amplifiers (LNA) boost the weak signal, bandpass demultiplexes each frequency, and transmits digital PCM over the Abis E1 line.',
          meta: [{ k: 'TOWER MAST', v: 'BS-A 35m Lattice Transceiver' }, { k: 'LNA GAIN', v: '+24 dB Low-Noise Preamplifier' }, { k: 'BACKHAUL LINE', v: 'Abis E1 Trunk (2.048 Mbps TDM)' }, { k: 'VOICE CODEC', v: '64 kbps G.711 PCM Trunk' }]
        },
        {
          num: 'STAGE 4 OF 6', dir: '⬆️ UPLINK ROUTING',
          title: '4. BSC SWITCHING & CORE NETWORK TO WEB SERVER',
          desc: 'Base Station Controller handles radio resource allocation and routes trunk frames into MTSO / MSC Core. The Core validates HLR/VLR subscriber records and routes IP packets to Web Host 8.8.8.8.',
          meta: [{ k: 'RADIO CONTROLLER', v: 'BSC TRAU Processor' }, { k: 'CORE SWITCHING', v: 'MTSO / MSC Gateway' }, { k: 'DATABASE', v: 'HLR / VLR Subscriber Auth' }, { k: 'DESTINATION', v: 'Host 8.8.8.8 (Web Server)' }]
        },
        {
          num: 'STAGE 5 OF 6', dir: '⬇️ DOWNLINK RETURN RESPONSE',
          title: '5. WEB HOST DISPATCHES RETURN ACK PACKET',
          desc: 'Destination application host (8.8.8.8) processes the request and dispatches a return HTTP 200 OK / ACK response packet back across the core network toward serving Base Station BS-A.',
          meta: [{ k: 'RESPONDING HOST', v: '8.8.8.8 (Application Server)' }, { k: 'RETURN PACKET', v: 'HTTP 200 OK / Voice ACK' }, { k: 'CORE HOP', v: 'Internet → MTSO → BSC' }, { k: 'FORWARD MAPPING', v: 'Paired Downlink Channel' }]
        },
        {
          num: 'STAGE 6 OF 6', dir: '⬇️ DOWNLINK ARRIVAL & CONFIRMATION',
          title: '6. TOWER BROADCASTS FORWARD CARRIER TO MOBILES',
          desc: 'Base Station tower high-power transmitter radiates forward carrier wave (870.03 MHz = 825.03 + 45 MHz). Mobile receiver antenna captures signal, verifies ACK, and lights green. Round trip complete!',
          meta: [{ k: 'FORWARD CARRIER', v: '870.03 MHz (+45.0 MHz Duplex)' }, { k: 'TX POWER', v: '100 W (+50 dBm Macro Base Station)' }, { k: 'SUBSCRIBER RECEPTION', v: 'Demodulated & Verified at Handset' }, { k: 'ROUND TRIP STATUS', v: '✅ 2-WAY ROUND TRIP SUCCESS' }]
        }
      ],
      tdma: [
        {
          num: 'STAGE 1 OF 6', dir: '⬆️ UPLINK TRANSMISSION',
          title: '1. GSM MOBILE BURST EMISSION (TIME SLOTS)',
          desc: 'Each subscriber transmits in its assigned 577 µs time window on the 890.2 MHz carrier: MS-1 transmits in Slot 1, MS-2 in Slot 3, and MS-3 Laptop in Slot 5 using 0.3 GMSK digital modulation.',
          meta: [{ k: 'FRAME DURATION', v: '4.615 ms (8 Time Slots)' }, { k: 'SLOT DURATION', v: '577 µs per user burst' }, { k: 'MODULATION', v: '0.3 GMSK (270.833 kbps)' }, { k: 'BURST FORMAT', v: '156.25 bits Normal Burst' }]
        },
        {
          num: 'STAGE 2 OF 6', dir: '⬆️ UPLINK PROPAGATION',
          title: '2. AIR PROPAGATION & TIMING ADVANCE SYNC',
          desc: 'Digital bursts propagate 5.0 km across the coverage sector. Tower adaptive equalizer correlates the 26-bit midamble sequence to cancel multipath dispersion and enforce timing advance alignment.',
          meta: [{ k: 'SECTOR RADIUS', v: 'R = 5.0 km Macrocell' }, { k: 'TIMING ADVANCE', v: '0..63 steps (3.69 µs step)' }, { k: 'MIDAMBLE', v: '26-bit Training Sequence' }, { k: 'EQUALIZER', v: 'Viterbi MLSE Detector' }]
        },
        {
          num: 'STAGE 3 OF 6', dir: '⬆️ UPLINK BACKHAUL',
          title: '3. BTS DEMODULATION & ABIS E1 TRUNK TRANSIT',
          desc: 'Tower BTS collects synchronized bursts, performs convolutional FEC decoding and de-interleaving, and dispatches 16 kbps TRAU sub-multiplexed speech onto the Abis E1 line.',
          meta: [{ k: 'BASE STATION', v: 'BS-A GSM Transceiver' }, { k: 'ABIS INTERFACE', v: 'LAPD over 2.048 Mbps E1' }, { k: 'SUB-MULTIPLEX', v: 'TRAU 16 kbps Channels' }, { k: 'CONTROLLER', v: 'BSC Switch Frame' }]
        },
        {
          num: 'STAGE 4 OF 6', dir: '⬆️ UPLINK ROUTING',
          title: '4. BSC SWITCHING, A5 CIPHER & SGSN/GGSN GATEWAY',
          desc: 'BSC decrypts subscriber data using A5 session keys and forwards frames to MSC/SGSN. GGSN decapsulates IP packets and dispatches them across the fiber internet backbone to 8.8.8.8.',
          meta: [{ k: 'CIPHER DECRYPT', v: 'A5/1 Voice & GPRS Encryption' }, { k: 'PACKET CORE', v: 'SGSN / GGSN Gateway' }, { k: 'AUTHENTICATION', v: 'HLR/VLR Verified' }, { k: 'TARGET HOST', v: '8.8.8.8 (Web Server)' }]
        },
        {
          num: 'STAGE 5 OF 6', dir: '⬇️ DOWNLINK RETURN RESPONSE',
          title: '5. SERVER DISPATCHES RETURN ACK PACKET',
          desc: 'Web server (8.8.8.8) returns HTTP 200 OK / TCP ACK. The packet traverses back into GGSN and BSC, where it is scheduled into the forward GSM time-slot frame.',
          meta: [{ k: 'RESPONDING HOST', v: '8.8.8.8 (Server)' }, { k: 'DOWNLINK PAYLOAD', v: 'HTTP 200 OK / TCP ACK' }, { k: 'SCHEDULER', v: 'BSC Forward Slot Allocator' }, { k: 'PAIRED FREQ', v: '935.2 MHz (+45 MHz Offset)' }]
        },
        {
          num: 'STAGE 6 OF 6', dir: '⬇️ DOWNLINK ARRIVAL & CONFIRMATION',
          title: '6. BTS TRANSMITS FORWARD BURST & HANDSET ACCEPTS',
          desc: 'Tower transmits forward 156.25-bit burst on downlink Slot 1. MS-1 mobile receiver deciphers data, verifies packet delivery, and confirms round trip success!',
          meta: [{ k: 'FORWARD BURST', v: 'TS 1 on 935.2 MHz' }, { k: 'CLIENT RECEIVER', v: 'MS-1 Acknowledged' }, { k: 'ROUND TRIP TIME', v: '52.4 ms RTT' }, { k: 'ROUND TRIP STATUS', v: '✅ 2-WAY ROUND TRIP SUCCESS' }]
        }
      ],
      cdma: [
        {
          num: 'STAGE 1 OF 6', dir: '⬆️ UPLINK TRANSMISSION',
          title: '1. CDMA SPREAD SPECTRUM MODULATION (WALSH)',
          desc: 'All subscribers transmit simultaneously on the same 1.25 MHz band. MS-1 is spread by Walsh code W1, MS-2 by W2, and MS-3 by W3 at 1.2288 Mcps chip rate.',
          meta: [{ k: 'CHIP RATE', v: '1.2288 Mcps (128 chips/bit)' }, { k: 'SPREADING CODES', v: 'Orthogonal Walsh Functions' }, { k: 'CHANNEL BANDWIDTH', v: '1.25 MHz Spread Spectrum' }, { k: 'POWER CONTROL', v: 'Fast Closed-Loop (800 Hz)' }]
        },
        {
          num: 'STAGE 2 OF 6', dir: '⬆️ UPLINK PROPAGATION',
          title: '2. AIR PROPAGATION ACROSS 1.25 MHz CARRIER',
          desc: 'Composite spread spectrum waveform traverses 5.0 km across the macrocell sector. Signals from all users superimpose in the air, separated solely by orthogonal mathematical coding.',
          meta: [{ k: 'SECTOR RADIUS', v: 'R = 5.0 km Macrocell' }, { k: 'FREQUENCY REUSE', v: 'Universal N = 1 (All Cells)' }, { k: 'CARRIER FREQ', v: '824.70 MHz (Ch 283)' }, { k: 'SOFT CAPACITY', v: 'Graceful Degradation' }]
        },
        {
          num: 'STAGE 3 OF 6', dir: '⬆️ UPLINK BACKHAUL',
          title: '3. TOWER RAKE RECEIVER & IUB BACKHAUL',
          desc: 'Tower 3-finger RAKE receiver resolves multipath delays (> 814 ns apart) and correlates user codes. Despread bitstreams are multiplexed over Iub ATM/IP backhaul to RNC.',
          meta: [{ k: 'RAKE RECEIVER', v: '3-Finger Maximal Ratio Combining' }, { k: 'DESPREADING', v: 'Correlates W1, W2, W3' }, { k: 'DIVERSITY GAIN', v: '+3 dB Eb/N0' }, { k: 'BACKHAUL TRUNK', v: 'Iub ATM / IP Backbone' }]
        },
        {
          num: 'STAGE 4 OF 6', dir: '⬆️ UPLINK ROUTING',
          title: '4. RNC / PDSN CORE DECAPSULATION TO INTERNET',
          desc: 'Radio Network Controller (RNC) manages soft handoff and routes frames to Packet Data Serving Node (PDSN). PDSN extracts IP datagrams and routes them to 8.8.8.8.',
          meta: [{ k: 'RADIO CONTROLLER', v: 'RNC Unit' }, { k: 'PACKET CORE', v: 'PDSN / AAA Gateway' }, { k: 'PUBLIC ROUTING', v: 'Fiber Core to Internet' }, { k: 'DESTINATION', v: '8.8.8.8 (Web Host)' }]
        },
        {
          num: 'STAGE 5 OF 6', dir: '⬇️ DOWNLINK RETURN RESPONSE',
          title: '5. SERVER DISPATCHES RETURN ACK PACKET',
          desc: 'Web server (8.8.8.8) generates return HTTP 200 OK / TCP ACK response. It travels across PDSN and RNC to be encoded onto forward Walsh code W64.',
          meta: [{ k: 'RESPONDING HOST', v: '8.8.8.8 (Server)' }, { k: 'RETURN PACKET', v: 'HTTP 200 OK' }, { k: 'FORWARD CODE', v: 'Walsh Channel W64' }, { k: 'FORWARD FREQ', v: '869.70 MHz (+45 MHz Offset)' }]
        },
        {
          num: 'STAGE 6 OF 6', dir: '⬇️ DOWNLINK ARRIVAL & CONFIRMATION',
          title: '6. TOWER BROADCASTS DOWNLINK & MOBILE CONFIRMS',
          desc: 'Tower broadcasts composite spread waveform. MS-1 handset RAKE receiver correlates with Walsh code W64, rejects other codes, and verifies round trip completion!',
          meta: [{ k: 'FORWARD CARRIER', v: '869.70 MHz QPSK Spread' }, { k: 'CLIENT RECEIVER', v: 'MS-1 RAKE Despreader' }, { k: 'ROUND TRIP TIME', v: '44.8 ms RTT' }, { k: 'ROUND TRIP STATUS', v: '✅ 2-WAY ROUND TRIP SUCCESS' }]
        }
      ]
    };

    const updateStepDetailCard = (stage) => {
      const mode = ch10State.accessMode;
      const list = stepProcedures6[mode] || stepProcedures6.fdma;
      const step = list[stage];
      if (!step) return;

      if (stepDetail) stepDetail.style.display = 'block';
      if (stepNum) stepNum.textContent = step.num;
      if (stepDirection) {
        stepDirection.textContent = step.dir;
        stepDirection.style.color = stage < 4 ? 'var(--accent-cyan)' : 'var(--status-ready)';
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
    // CAMERA AUTO-FOLLOW INTERPOLATION FOR 6 SIMPLIFIED STAGES
    // ─────────────────────────────────────────────────────────────────────────
    const updateCameraAutoFollow = (progress6) => {
      if (!ch10State.autoCamera || !isoSvg) return;
      const L = activeLayout;
      const targets = L.cameraTargets;

      let target;
      if (progress6 < 1.0) {
        // Stage 0: Mobiles radiating on own frequencies
        target = targets.client;
      } else if (progress6 < 2.0) {
        // Stage 1: Air propagation from Mobiles to Tower across expansive sector
        const t = progress6 - 1.0;
        target = {
          vx: targets.client.vx + t * (targets.tower.vx - targets.client.vx),
          vy: targets.client.vy + t * (targets.tower.vy - targets.client.vy),
          vw: targets.client.vw + t * (targets.tower.vw - targets.client.vw),
          vh: targets.client.vh,
          label: `AIR LINK UPLINK (${(t*100).toFixed(0)}%)`,
          icon: '📡'
        };
      } else if (progress6 < 3.0) {
        // Stage 2: Tower reception & Abis trunk
        target = targets.tower;
      } else if (progress6 < 4.0) {
        // Stage 3: Core switching to Web server
        const t = progress6 - 3.0;
        target = {
          vx: targets.core.vx + t * (targets.server.vx - targets.core.vx),
          vy: targets.core.vy,
          vw: targets.core.vw + t * (targets.server.vw - targets.core.vw),
          vh: targets.core.vh,
          label: `CORE ROUTING TO SERVER (${(t*100).toFixed(0)}%)`,
          icon: '🖥️'
        };
      } else if (progress6 < 5.0) {
        // Stage 4: Server generates Downlink ACK
        target = targets.server;
      } else {
        // Stage 5: Downlink RF broadcast from Tower back to Mobiles
        const t = progress6 - 5.0;
        target = {
          vx: targets.tower.vx - t * (targets.tower.vx - targets.client.vx),
          vy: targets.tower.vy - t * (targets.tower.vy - targets.client.vy),
          vw: targets.tower.vw - t * (targets.tower.vw - targets.client.vw),
          vh: targets.tower.vh,
          label: `DOWNLINK ARRIVAL (${(t*100).toFixed(0)}%)`,
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

    // Helper to generate smooth sine wave path from start to end
    const buildSinePath = (x1, y1, x2, y2, cycles, amp, phase) => {
      let d = `M ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      const steps = 40;
      const dx = x2 - x1;
      const dy = y2 - y1;
      for (let s = 1; s <= steps; s++) {
        const frac = s / steps;
        const wx = x1 + frac * dx;
        const baseY = y1 + frac * dy;
        const offset = Math.sin(frac * cycles * Math.PI * 2 - phase) * amp;
        const wy = baseY + offset;
        d += ` L ${wx.toFixed(1)} ${wy.toFixed(1)}`;
      }
      return d;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // DEDICATED ANIMATION LOOP (SIMPLIFIED 6 STAGES, INDIVIDUAL WAVES & PACKETS)
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
      const L = activeLayout;

      // 6 full stages over 12.0 seconds (2.0s per stage)
      const cycleDuration = 12.0;
      const progress6 = ch10State.manualStep >= 0
        ? (ch10State.manualStep + 0.5)
        : ((time % cycleDuration) / cycleDuration) * 6.0;

      const currentStage = Math.min(5, Math.floor(progress6));
      const subT = ch10State.manualStep >= 0 ? 0.5 : (progress6 - currentStage);

      // 1. Update Camera
      updateCameraAutoFollow(progress6);

      // 2. Animate Oscillating Sine Waves for each mobile on its own frequency
      const isAirStage = currentStage === 1;
      const towerAntX = L.tower.x;
      const towerAntY = L.tower.y - 180; // top antenna tip of enlarged 2.2x tower

      if (waveMs1) {
        const op = isAirStage ? 0.95 : 0.15;
        waveMs1.setAttribute('opacity', op);
        const d1 = buildSinePath(L.ms1.x, L.ms1.y - 45, towerAntX, towerAntY, 14, 16, time * 14 * speed);
        waveMs1.setAttribute('d', d1);
      }

      if (waveMs2) {
        const op = (count >= 2 && isAirStage) ? 0.92 : 0;
        waveMs2.setAttribute('opacity', op);
        if (count >= 2) {
          const d2 = buildSinePath(L.ms2.x, L.ms2.y - 45, towerAntX, towerAntY, 18, 15, time * 18 * speed + 1.2);
          waveMs2.setAttribute('d', d2);
        }
      }

      if (waveMs3) {
        const op = (count >= 3 && isAirStage) ? 0.92 : 0;
        waveMs3.setAttribute('opacity', op);
        if (count >= 3) {
          const d3 = buildSinePath(L.ms3.x, L.ms3.y - 40, towerAntX, towerAntY, 22, 14, time * 22 * speed + 2.4);
          waveMs3.setAttribute('d', d3);
        }
      }

      if (waveMs4) {
        const op = (count >= 4 && isAirStage) ? 0.92 : 0;
        waveMs4.setAttribute('opacity', op);
        if (count >= 4) {
          const d4 = buildSinePath(L.ms4.x, L.ms4.y - 40, towerAntX, towerAntY, 26, 14, time * 26 * speed + 3.6);
          waveMs4.setAttribute('d', d4);
        }
      }

      // Blocked wave for competing subscribers MS-5..12 when overload occurs
      if (waveBlocked) {
        const isBlockedAir = (count >= 8 && isAirStage);
        waveBlocked.setAttribute('opacity', isBlockedAir ? 0.92 : 0);
        if (isBlockedAir) {
          const midX = 320 + (towerAntX - 320) * 0.42;
          const midY = 310 + (towerAntY - 310) * 0.42;
          const dBlocked = buildSinePath(320, 310, midX, midY, 10, 14, time * 20 * speed);
          waveBlocked.setAttribute('d', dBlocked);
        }
      }

      // Downlink return wave from Tower back to MS-1 during Stage 5
      if (waveDownlink) {
        const isDlStage = currentStage === 5;
        waveDownlink.setAttribute('opacity', isDlStage ? 0.95 : 0);
        if (isDlStage) {
          const dlPath = buildSinePath(towerAntX, towerAntY, L.ms1.x, L.ms1.y - 45, 20, 18, -time * 18 * speed);
          waveDownlink.setAttribute('d', dlPath);
        }
      }
      if (badgeDl) {
        badgeDl.setAttribute('opacity', currentStage === 5 ? '1' : '0');
      }

      // Fullscreen Action Description Banner Synchronization
      if (fsActionBanner) {
        const stageNames = [
          'STAGE 0: Mobiles Radiating on Assigned Frequencies / Code Channels',
          'STAGE 1: Air Propagation Across Macrocell Sector (Free-Space + Shadow Fading)',
          'STAGE 2: Base Station Tower Reception, LNA Amplification & Abis E1 Backhaul',
          'STAGE 3: BSC Switching & Core MTSO / GGSN Routing to Public Server (8.8.8.8)',
          'STAGE 4: Web Host 8.8.8.8 Generates Return Downlink ACK Response',
          'STAGE 5: Tower Broadcasts Downlink Paired Carrier (+45 MHz Duplex) to Handsets'
        ];
        if (count >= 8 && currentStage === 1) {
          fsActionBanner.innerHTML = `<span style="color:#ff0055; font-weight:700;">⚠️ STAGE 1: TOWER SECTOR SATURATED! ${count} Mobiles > 4 Trunks: MS-5..${count} Blocked (Erlang B)</span>`;
        } else {
          fsActionBanner.innerHTML = `<span style="color:var(--accent-cyan); font-weight:700;">${stageNames[currentStage]}</span> <span style="color:var(--text-dim); margin-left:8px;">[Step Progress: ${(subT * 100).toFixed(0)}%]</span>`;
        }
      }

      // Update Tower Receiver Channel Tuner indicators
      const tunerCh1 = container.querySelector('#tuner-ch1');
      const tunerCh2 = container.querySelector('#tuner-ch2');
      const tunerCh3 = container.querySelector('#tuner-ch3');
      const tunerCh4 = container.querySelector('#tuner-ch4');

      if (tunerCh1) {
        tunerCh1.setAttribute('fill', isAirStage ? 'rgba(0,229,255,0.45)' : 'rgba(0,229,255,0.15)');
        tunerCh1.setAttribute('stroke', '#00e5ff');
      }
      if (tunerCh2) {
        const active = count >= 2 && isAirStage;
        tunerCh2.setAttribute('opacity', count >= 2 ? '1' : '0.3');
        tunerCh2.setAttribute('fill', active ? 'rgba(192,132,252,0.45)' : 'rgba(192,132,252,0.15)');
      }
      if (tunerCh3) {
        const active = count >= 3 && isAirStage;
        tunerCh3.setAttribute('opacity', count >= 3 ? '1' : '0.3');
        tunerCh3.setAttribute('fill', active ? 'rgba(0,255,157,0.45)' : 'rgba(0,255,157,0.15)');
      }
      if (tunerCh4) {
        const active = count >= 4 && isAirStage;
        tunerCh4.setAttribute('opacity', count >= 4 ? '1' : '0.3');
        tunerCh4.setAttribute('fill', active ? 'rgba(255,183,3,0.45)' : 'rgba(255,183,3,0.15)');
      }

      // 3. Pulse Antennas on transmitting nodes
      const pulseMs1 = container.querySelector('#pulse-ms1');
      const pulseMs2 = container.querySelector('#pulse-ms2');
      const pulseMs3 = container.querySelector('#pulse-ms3');
      const pulseMs4 = container.querySelector('#pulse-ms4');
      const pulseTower = container.querySelector('#pulse-tower');

      const pR = 16 + ((time * 26 * speed) % 40);
      const pOp = Math.max(0, 1 - (pR / 50));

      if (pulseMs1) {
        pulseMs1.setAttribute('r', pR);
        pulseMs1.setAttribute('opacity', (currentStage === 0 || currentStage === 1 || currentStage === 5) ? pOp : 0.1);
      }
      if (pulseMs2 && count >= 2) {
        pulseMs2.setAttribute('r', pR);
        pulseMs2.setAttribute('opacity', (currentStage === 0 || currentStage === 1) ? pOp : 0.1);
      }
      if (pulseMs3 && count >= 3) {
        pulseMs3.setAttribute('r', pR);
        pulseMs3.setAttribute('opacity', (currentStage === 0 || currentStage === 1) ? pOp : 0.1);
      }
      if (pulseMs4 && count >= 4) {
        pulseMs4.setAttribute('r', pR);
        pulseMs4.setAttribute('opacity', (currentStage === 0 || currentStage === 1) ? pOp : 0.1);
      }
      if (pulseTower) {
        const twR = 24 + ((time * 26 * speed) % 55);
        pulseTower.setAttribute('r', twR);
        pulseTower.setAttribute('opacity', (currentStage === 2 || currentStage === 5) ? Math.max(0, 1 - twR / 65) : 0);
      }

      // 4. Move Packets along 6 stages with 4 non-overlapping parallel lanes
      const fUl = parseFloat(inUplink ? inUplink.value : 825.03) || 825.03;
      const duplex = parseFloat(inDuplex ? inDuplex.value : 45.0) || 45.0;
      const fDl = fUl + duplex;

      // Define 4 dedicated vertical Y lanes so packets never collide on the bus
      const lanes = [
        { offset: -34, stagger: 0.00, color: '#00e5ff', name: 'MS-1' },
        { offset: -12, stagger: 0.05, color: '#c084fc', name: 'MS-2' },
        { offset: +12, stagger: 0.10, color: '#00ff9d', name: 'MS-3' },
        { offset: +34, stagger: 0.15, color: '#ffb703', name: 'MS-4' }
      ];

      const pktMsList = [
        { group: pktGroupMs1, box: pktBoxMs1, text: pktTextMs1, node: L.ms1, f: fUl, id: 1 },
        { group: pktGroupMs2, box: pktBoxMs2, text: pktTextMs2, node: L.ms2, f: fUl + 0.03, id: 2 },
        { group: pktGroupMs3, box: pktBoxMs3, text: pktTextMs3, node: L.ms3, f: fUl + 0.06, id: 3 },
        { group: pktGroupMs4, box: pktBoxMs4, text: pktTextMs4, node: L.ms4, f: fUl + 0.09, id: 4 }
      ];

      const pktAckList = [
        { group: pktGroupAck1, box: pktBoxAck1, text: pktTextAck1, node: L.ms1, f: fDl, id: 1 },
        { group: pktGroupAck2, box: pktBoxAck2, text: pktTextAck2, node: L.ms2, f: fDl + 0.03, id: 2 },
        { group: pktGroupAck3, box: pktBoxAck3, text: pktTextAck3, node: L.ms3, f: fDl + 0.06, id: 3 },
        { group: pktGroupAck4, box: pktBoxAck4, text: pktTextAck4, node: L.ms4, f: fDl + 0.09, id: 4 }
      ];

      // Forward Uplink Packets (Stages 0 to 3)
      pktMsList.forEach((item, idx) => {
        const { group, box, text, node, f, id } = item;
        if (!group || !box || !text) return;

        const isUserActive = count >= id;
        if (isUserActive && currentStage < 4) {
          group.setAttribute('opacity', 1);
          const lane = lanes[idx];
          // Staggered forward progress for convoy separation
          const tProgress = Math.max(0, Math.min(1, (subT - lane.stagger) / (1 - lane.stagger)));

          let px = node.x, py = node.y;
          let label = `MS-${id}: f${id} ${f.toFixed(2)}M`;

          if (currentStage === 0) {
            // Stage 0: At Mobile handset terminal
            px = node.x;
            py = node.y - 12;
            label = mode === 'fdma'
              ? `MS-${id}: f${id} ${f.toFixed(2)}M`
              : mode === 'tdma'
              ? `MS-${id}: GSM TS ${id * 2 - 1}`
              : `MS-${id}: Walsh W${id}`;
          } else if (currentStage === 1) {
            // Stage 1: Air link propagation across macrocell sector to Tower
            px = node.x + tProgress * (L.tower.x - node.x);
            const startY = node.y - 12;
            const endY = (L.tower.y - 60) + lane.offset;
            py = startY + tProgress * (endY - startY) + Math.sin(tProgress * Math.PI) * -16;
            label = mode === 'fdma'
              ? `AIR: ${f.toFixed(2)} MHz`
              : mode === 'tdma'
              ? `AIR: TS ${id * 2 - 1} BURST`
              : `AIR: CDMA W${id} SPREAD`;
          } else if (currentStage === 2) {
            // Stage 2: Tower reception & Abis trunk line to BSC along distinct vertical lane
            px = L.tower.x + tProgress * (L.bsc.x - L.tower.x);
            py = L.tower.y + lane.offset;
            label = `Abis E1 [MS-${id}]`;
          } else {
            // Stage 3: BSC to MTSO Core to Web Server (8.8.8.8) along distinct vertical lane
            px = L.bsc.x + tProgress * (L.server.x - L.bsc.x);
            const baseY = L.bsc.y + lane.offset + tProgress * (L.server.y - L.bsc.y);
            py = baseY + Math.sin(tProgress * Math.PI) * -18;
            label = `IP 8.8.8.8 [MS-${id}]`;
          }

          box.setAttribute('x', px - 68);
          box.setAttribute('y', py - 12);
          text.setAttribute('x', px - 60);
          text.setAttribute('y', py + 4);
          text.textContent = label;
        } else {
          group.setAttribute('opacity', 0);
        }
      });

      // Downlink Return ACK Packets (Stages 4 and 5)
      pktAckList.forEach((item, idx) => {
        const { group, box, text, node, f, id } = item;
        if (!group || !box || !text) return;

        const isUserActive = count >= id;
        if (isUserActive && currentStage >= 4) {
          group.setAttribute('opacity', 1);
          const lane = lanes[idx];
          const tProgress = Math.max(0, Math.min(1, (subT - lane.stagger) / (1 - lane.stagger)));

          let ackX = L.server.x, ackY = L.server.y;
          let ackLabel = `ACK → MS-${id} (200 OK)`;

          if (currentStage === 4) {
            // Stage 4: Server dispatches return ACK through Core & BSC to Tower along distinct lane
            ackX = L.server.x - tProgress * (L.server.x - L.tower.x);
            const baseY = (L.server.y + lane.offset) - tProgress * (L.server.y - L.tower.y);
            ackY = baseY + Math.sin(tProgress * Math.PI) * -16;
            ackLabel = `HTTP 200 OK → MS-${id}`;
          } else {
            // Stage 5: Tower broadcasts forward carrier back across air directly to Mobile handset!
            const startX = L.tower.x;
            const startY = (L.tower.y - 50) + lane.offset;
            const targetX = node.x;
            const targetY = node.y - 12;

            ackX = startX - tProgress * (startX - targetX);
            ackY = startY + tProgress * (targetY - startY) + Math.sin(tProgress * Math.PI) * 14;
            ackLabel = mode === 'fdma'
              ? `DL f${id}: ${f.toFixed(2)}M`
              : mode === 'tdma'
              ? `DL TS ${id * 2 - 1}: ${f.toFixed(2)}M`
              : `DL W64 → MS-${id}: ${f.toFixed(2)}M`;
          }

          box.setAttribute('x', ackX - 82);
          box.setAttribute('y', ackY - 12);
          text.setAttribute('x', ackX - 74);
          text.setAttribute('y', ackY + 4);
          text.textContent = ackLabel;

          // Flash confirmation at end of Stage 5
          if (currentStage === 5 && subT > 0.8) {
            if (hudStatus) {
              hudStatus.textContent = `✅ 2-WAY ROUND TRIP COMPLETE: Forward ACK arrived at all active handsets (f_dl = ${fDl.toFixed(2)} MHz)`;
              hudStatus.style.color = 'var(--status-ready)';
            }
          }
        } else {
          group.setAttribute('opacity', 0);
        }
      });

      // Auto update step detail card if playing continuously
      if (ch10State.manualStep < 0) {
        updateStepDetailCard(currentStage);
      }

      // Real GSM TDMA slot clock strip animation
      if (mode === 'tdma') {
        const tdmaSlotsGrid = container.querySelector('#sim-tdma-slots-hud-grid');
        const tdmaActiveTxt = container.querySelector('#sim-tdma-active-slot-txt');
        if (tdmaSlotsGrid && tdmaActiveTxt) {
          const activeSlot = Math.floor((time * 5) % 8);
          const slotLabels = [
            'BCCH Beacon',
            'MS-1 (Normal Burst)',
            'Guard / Sync',
            'MS-2 (Phone)',
            'Other Cell Tx',
            'MS-3 (Laptop Data)',
            'Paging Channel',
            'MS-4 (Vehicular)'
          ];
          const isMs1Active = activeSlot === 1;
          tdmaActiveTxt.textContent = `Active Slot: TS ${activeSlot}/7 — ${slotLabels[activeSlot]} (577 µs Tx Window | Frame 4.615 ms)`;

          let html = '';
          for (let s = 0; s < 8; s++) {
            const isCur = s === activeSlot;
            const isMs1Slot = s === 1;
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
      [btnPlay, btnFsPlay].forEach(b => {
        if (b) {
          b.textContent = '⏸ PAUSE';
          b.style.borderColor = '#ffb703';
          b.style.color = '#ffb703';
          b.style.background = 'rgba(255,183,3,0.15)';
        }
      });
      if (hudStatus) {
        hudStatus.textContent = `● 2-WAY ROUND TRIP ACTIVE: ${ch10State.accessMode.toUpperCase()} | ${ch10State.activeDevicesCount} Subscribers radiating`;
        hudStatus.style.color = 'var(--status-ready)';
      }
      if (!activeAnimationRaf) {
        activeAnimationRaf = requestAnimationFrame(animateSimFrame);
      }
    };

    const stopSimulation = () => {
      ch10State.isPlaying = false;
      [btnPlay, btnFsPlay].forEach(b => {
        if (b) {
          b.textContent = '▶ PLAY';
          b.style.borderColor = '#00e5ff';
          b.style.color = '#00e5ff';
          b.style.background = 'rgba(0,229,255,0.18)';
        }
      });
      if (hudStatus) {
        hudStatus.textContent = `⏸ PAUSED — Click ▶ PLAY to resume 2-way round trip procedure`;
        hudStatus.style.color = 'var(--text-dim)';
      }
    };

    const resetSimulation = () => {
      stopSimulation();
      ch10State.manualStep = -1;
      localSimClock = 0;
      applyViewBox(activeLayout.cameraTargets.overview);
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
        ch10State.manualStep = (ch10State.manualStep + 1) % 6;
        updateStepDetailCard(ch10State.manualStep);
        if (ch10State.autoCamera) {
          updateCameraAutoFollow(ch10State.manualStep + 0.5);
        }
      });
    }

    // Fullscreen Top Bar event listeners
    if (btnFsPlay) {
      btnFsPlay.addEventListener('click', () => {
        ch10State.isPlaying ? stopSimulation() : startSimulation();
      });
    }
    if (btnFsReset) btnFsReset.addEventListener('click', resetSimulation);
    if (btnFsStep) {
      btnFsStep.addEventListener('click', () => {
        if (ch10State.isPlaying) stopSimulation();
        ch10State.manualStep = (ch10State.manualStep + 1) % 6;
        updateStepDetailCard(ch10State.manualStep);
        if (ch10State.autoCamera) {
          updateCameraAutoFollow(ch10State.manualStep + 0.5);
        }
      });
    }
    if (btnFsFdma) btnFsFdma.addEventListener('click', () => {
      if (selBand) selBand.value = 'amps850';
      if (inUplink) inUplink.value = '825.03';
      if (inDuplex) inDuplex.value = '45.0';
      if (inCh) inCh.value = '1';
      setAccessMode('fdma');
    });
    if (btnFsTdma) btnFsTdma.addEventListener('click', () => {
      if (selBand) selBand.value = 'gsm900';
      if (inUplink) inUplink.value = '890.20';
      if (inDuplex) inDuplex.value = '45.0';
      if (inCh) inCh.value = '1';
      setAccessMode('tdma');
    });
    if (btnFsCdma) btnFsCdma.addEventListener('click', () => {
      if (selBand) selBand.value = 'cdma800';
      if (inUplink) inUplink.value = '824.70';
      if (inDuplex) inDuplex.value = '45.0';
      if (inCh) inCh.value = '283';
      setAccessMode('cdma');
    });

    // Initialize layout and state
    applyLayoutCoordinates('standard');
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
  // SECTION 10.1.6: DYNAMIC POWER CONTROL (OPEN-LOOP VS CLOSED-LOOP ANIMATION)
  // ─────────────────────────────────────────────────────────────────────────────
  if (secId === 'sec-10.power') {
    const btnOpen = container.querySelector('#btn-pwr-open');
    const btnClosed = container.querySelector('#btn-pwr-closed');
    const btnToggleBldg = container.querySelector('#btn-toggle-building');
    const btnToggleFade = container.querySelector('#btn-pwr-toggle-fade');
    const modeTag = container.querySelector('#pwr-mode-tag');

    const sDist = container.querySelector('#pwr-slider-dist');
    const sTarget = container.querySelector('#pwr-slider-target');
    const selRate = container.querySelector('#pwr-select-rate');

    const vDist = container.querySelector('#pwr-val-dist');
    const vTarget = container.querySelector('#pwr-val-target');
    const vFade = container.querySelector('#pwr-val-fade');
    const vRate = container.querySelector('#pwr-val-rate');

    const bldgGroup = container.querySelector('#pwr-building-group');
    const wavePilot = container.querySelector('#pwr-wave-pilot');
    const tagPilot = container.querySelector('#pwr-tag-pilot');
    const waveReverse = container.querySelector('#pwr-wave-reverse');
    const tagReverse = container.querySelector('#pwr-tag-reverse');
    const cmdPacket = container.querySelector('#pwr-cmd-packet');
    const cmdText = container.querySelector('#pwr-cmd-text');

    const nodeMobile = container.querySelector('#pwr-node-mobile');
    const msTxText = container.querySelector('#pwr-ms-tx-text');
    const msSensorBox = container.querySelector('#pwr-ms-sensor-box');
    const msSensorText = container.querySelector('#pwr-ms-sensor-text');
    const bsRxText = container.querySelector('#pwr-bs-rx-text');

    const hudModeTitle = container.querySelector('#pwr-hud-mode-title');
    const hudStatusBadge = container.querySelector('#pwr-hud-status-badge');
    const hudLoss = container.querySelector('#pwr-hud-loss');
    const hudTx = container.querySelector('#pwr-hud-tx');
    const hudRx = container.querySelector('#pwr-hud-rx');
    const hudAction = container.querySelector('#pwr-hud-action');

    let pwrClock = 0;

    if (btnOpen && btnClosed) {
      btnOpen.addEventListener('click', () => {
        ch10State.powerMode = 'open_loop';
        btnOpen.classList.add('active');
        btnClosed.classList.remove('active');
        if (modeTag) modeTag.textContent = 'OPEN-LOOP MODE';
        if (hudModeTitle) hudModeTitle.textContent = 'OPEN-LOOP DYNAMICS';
        if (msSensorBox) msSensorBox.style.display = 'block';
        if (tagPilot) tagPilot.style.display = 'block';
        if (cmdPacket) cmdPacket.style.display = 'none';
      });

      btnClosed.addEventListener('click', () => {
        ch10State.powerMode = 'closed_loop';
        btnClosed.classList.add('active');
        btnOpen.classList.remove('active');
        if (modeTag) modeTag.textContent = 'CLOSED-LOOP MODE';
        if (hudModeTitle) hudModeTitle.textContent = 'CLOSED-LOOP FEEDBACK';
        if (msSensorBox) msSensorBox.style.display = 'none';
        if (tagPilot) tagPilot.style.display = 'none';
      });
    }

    if (btnToggleBldg) {
      btnToggleBldg.addEventListener('click', () => {
        ch10State.powerObstaclePresent = !ch10State.powerObstaclePresent;
        btnToggleBldg.classList.toggle('active', ch10State.powerObstaclePresent);
        btnToggleBldg.style.background = ch10State.powerObstaclePresent ? 'rgba(255, 183, 3, 0.35)' : 'rgba(255, 183, 3, 0.15)';
        if (bldgGroup) bldgGroup.style.display = ch10State.powerObstaclePresent ? 'block' : 'none';
      });
    }

    if (btnToggleFade) {
      btnToggleFade.addEventListener('click', () => {
        ch10State.powerFastFade = !ch10State.powerFastFade;
        btnToggleFade.classList.toggle('active', ch10State.powerFastFade);
        btnToggleFade.textContent = ch10State.powerFastFade ? 'MULTIPATH FLUCTUATION: ON' : 'MULTIPATH FLUCTUATION: OFF';
        if (vFade) vFade.textContent = ch10State.powerFastFade ? 'ACTIVE (±4 dB Jitter)' : 'DISABLED (Clean)';
      });
    }

    if (sDist) {
      sDist.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        ch10State.powerMobileDistKm = val;
        if (vDist) vDist.textContent = `${val.toFixed(1)} km`;
      });
    }

    if (sTarget) {
      sTarget.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        ch10State.powerTargetRxDbm = val;
        if (vTarget) vTarget.textContent = `${val.toFixed(1)} dBm`;
      });
    }

    if (selRate) {
      selRate.addEventListener('change', (e) => {
        if (vRate) vRate.textContent = `${selRate.value} Hz (${selRate.options[selRate.selectedIndex].text.split('—')[1] || ''})`;
      });
    }

    // Helper sine generator
    const genPwrSine = (x1, y1, x2, y2, cycles, amp, phase) => {
      let d = `M ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      const steps = 30;
      const dx = x2 - x1;
      const dy = y2 - y1;
      for (let s = 1; s <= steps; s++) {
        const frac = s / steps;
        const wx = x1 + frac * dx;
        const wy = y1 + frac * dy + Math.sin(frac * cycles * Math.PI * 2 - phase) * amp;
        d += ` L ${wx.toFixed(1)} ${wy.toFixed(1)}`;
      }
      return d;
    };

    const animatePowerControl = () => {
      pwrClock += 0.025;

      const dKm = ch10State.powerMobileDistKm;
      const mode = ch10State.powerMode;
      const targetRx = ch10State.powerTargetRxDbm;
      const obstacle = ch10State.powerObstaclePresent;
      const fastFade = ch10State.powerFastFade;

      // Map distance (0.5 to 12.0 km) to X coordinates (320 to 120 px)
      const msX = 320 - ((dKm - 0.5) / 11.5) * 200;
      const bsX = 850;
      if (nodeMobile) nodeMobile.setAttribute('transform', `translate(${msX.toFixed(1)}, 270)`);

      // Calculate Path Loss (Hata / Free Space baseline)
      let pathLoss = 91.5 + 20 * Math.log10(dKm);
      if (obstacle) pathLoss += 25.0; // 25 dB shadow attenuation
      if (fastFade) {
        pathLoss += Math.sin(pwrClock * 6) * 3.5 + Math.cos(pwrClock * 14) * 2.0;
      }

      // Pilot beacon at Base Station is constant 10W (+40 dBm)
      const pilotTxPower = 40.0;
      const receivedPilotPower = pilotTxPower - pathLoss;

      if (mode === 'open_loop') {
        // Open-Loop: Handset sets reverse TX inversely proportional to received pilot power
        const autonomousTx = targetRx + pathLoss;
        ch10State.powerMobileTxDbm = Math.max(0, Math.min(33, autonomousTx)); // Max 2W (33 dBm)

        if (cmdPacket) cmdPacket.style.display = 'none';
        if (wavePilot) {
          wavePilot.style.display = 'block';
          wavePilot.setAttribute('d', genPwrSine(bsX, 110, msX, 230, 10, 10, pwrClock * 12));
          wavePilot.setAttribute('opacity', obstacle ? '0.35' : '0.85');
        }
        if (msSensorText) {
          msSensorText.textContent = `PILOT SENSOR: ${receivedPilotPower.toFixed(1)} dBm`;
          msSensorText.setAttribute('fill', receivedPilotPower > -100 ? '#00ff9d' : '#ff0055');
        }
        if (hudAction) {
          hudAction.textContent = obstacle
            ? '⚡ Obstacle detected! Mobile senses pilot drop & instantly boosts Tx by +25 dB'
            : 'Mobile senses pilot strength & maintains inversely proportional Tx';
        }
      } else {
        // Closed-Loop: Base station measures reverse signal, sends feedback commands (+1 dB / -1 dB)
        const currentRx = ch10State.powerMobileTxDbm - pathLoss;
        const diff = currentRx - targetRx;

        let cmdLabel = 'HOLD';
        if (diff < -0.8) {
          cmdLabel = '▲ POWER UP (+1dB)';
          ch10State.powerMobileTxDbm = Math.min(33, ch10State.powerMobileTxDbm + 0.35);
        } else if (diff > 0.8) {
          cmdLabel = '▼ POWER DOWN (-1dB)';
          ch10State.powerMobileTxDbm = Math.max(0, ch10State.powerMobileTxDbm - 0.35);
        }

        if (wavePilot) wavePilot.style.display = 'none';
        if (cmdPacket) {
          cmdPacket.style.display = 'block';
          const cmdProg = (pwrClock * 1.5) % 1.0;
          const cmdX = bsX - cmdProg * (bsX - msX);
          const cmdY = 130 + cmdProg * (230 - 130) + Math.sin(cmdProg * Math.PI) * -15;
          cmdPacket.setAttribute('transform', `translate(${cmdX.toFixed(1)}, ${cmdY.toFixed(1)})`);
          if (cmdText) {
            cmdText.textContent = cmdLabel;
            cmdText.setAttribute('fill', cmdLabel.includes('UP') ? '#ffb703' : cmdLabel.includes('DOWN') ? '#38bdf8' : '#00ff9d');
          }
        }
        if (hudAction) {
          hudAction.textContent = diff < -1
            ? `BS detects -${Math.abs(diff).toFixed(1)} dB deficit → commands mobile POWER UP`
            : diff > 1
            ? `BS detects +${diff.toFixed(1)} dB excess → commands mobile POWER DOWN`
            : `Power loop locked: Received power matches target (-90 dBm)`;
        }
      }

      // Received power at BS
      const finalRxAtBs = ch10State.powerMobileTxDbm - pathLoss;
      const txMw = Math.pow(10, ch10State.powerMobileTxDbm / 10);

      // Animate reverse carrier wave (Mobile -> BS)
      if (waveReverse) {
        const revAmp = Math.min(18, Math.max(6, 6 + (ch10State.powerMobileTxDbm / 33) * 12));
        waveReverse.setAttribute('d', genPwrSine(msX, 230, bsX, 110, 12, revAmp, -pwrClock * 14));
      }

      // Update Text Readouts
      if (msTxText) msTxText.textContent = `Tx: +${ch10State.powerMobileTxDbm.toFixed(1)} dBm (${txMw.toFixed(0)}mW)`;
      if (bsRxText) bsRxText.textContent = `Rx: ${finalRxAtBs.toFixed(1)} dBm`;

      if (hudLoss) hudLoss.textContent = `${pathLoss.toFixed(1)} dB ${obstacle ? '(+25dB BLDG)' : ''}`;
      if (hudTx) hudTx.textContent = `+${ch10State.powerMobileTxDbm.toFixed(1)} dBm (${txMw.toFixed(0)} mW)`;
      if (hudRx) {
        hudRx.textContent = `${finalRxAtBs.toFixed(1)} dBm`;
        hudRx.style.color = Math.abs(finalRxAtBs - targetRx) < 3.0 ? '#00ff9d' : '#ffb703';
      }
      if (hudStatusBadge) {
        const locked = Math.abs(finalRxAtBs - targetRx) < 3.0;
        hudStatusBadge.textContent = locked ? 'LOCKED / STABLE' : 'ADJUSTING POWER...';
        hudStatusBadge.style.color = locked ? '#00ff9d' : '#ffb703';
      }

      activePowerRaf = requestAnimationFrame(animatePowerControl);
    };

    activePowerRaf = requestAnimationFrame(animatePowerControl);
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
  // SECTION 10.4: CDMA WALSH ORTHOGONALITY ENGINE & ANIMATED RAKE RECEIVER
  // ─────────────────────────────────────────────────────────────────────────────
  if (secId === 'sec-10.cdma') {
    // 1. Walsh Chipping & Hadamard Matrix Recursion
    const selUser = container.querySelector('#walsh-select-user');
    const walshUserLbl = container.querySelector('#walsh-user-lbl');
    const wave = container.querySelector('#walsh-composite-wave');
    const corText = container.querySelector('#walsh-correlator-text');
    const hadamardView = container.querySelector('#hadamard-matrix-view');

    const btnH1 = container.querySelector('#btn-hadamard-1');
    const btnH2 = container.querySelector('#btn-hadamard-2');
    const btnH4 = container.querySelector('#btn-hadamard-4');
    const btnH8 = container.querySelector('#btn-hadamard-8');

    const btnBitU1 = container.querySelector('#btn-bit-u1');
    const btnBitU2 = container.querySelector('#btn-bit-u2');
    const btnBitU3 = container.querySelector('#btn-bit-u3');
    const btnBitU4 = container.querySelector('#btn-bit-u4');
    const bitBtns = [btnBitU1, btnBitU2, btnBitU3, btnBitU4];

    let hadamardOrder = 4;
    let userBits = [1, 1, 1, 1]; // +1 or -1

    function buildHadamard(order) {
      if (order === 1) return [[1]];
      const half = buildHadamard(order / 2);
      const N = half.length;
      const res = Array.from({ length: 2 * N }, () => new Array(2 * N));
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          res[i][j] = half[i][j];
          res[i][j + N] = half[i][j];
          res[i + N][j] = half[i][j];
          res[i + N][j + N] = -half[i][j];
        }
      }
      return res;
    }

    let currentHadamard = buildHadamard(4);

    const updateWalshEngine = () => {
      const activeIdx = Math.min(currentHadamard.length - 1, (selUser ? Number(selUser.value) : 2) - 1);
      const codeLen = currentHadamard[0].length;
      const activeCode = currentHadamard[activeIdx];

      if (walshUserLbl) {
        walshUserLbl.textContent = `W_${activeIdx + 1}: (${activeCode.map(c => c > 0 ? '+1' : '-1').join(', ')})`;
      }

      // Compute linear air composite: S(t) = sum_{u} b_u * W_u
      const composite = new Array(codeLen).fill(0);
      const numUsers = Math.min(userBits.length, currentHadamard.length);
      for (let u = 0; u < numUsers; u++) {
        const bit = userBits[u];
        const row = currentHadamard[u];
        for (let chip = 0; chip < codeLen; chip++) {
          composite[chip] += bit * row[chip];
        }
      }

      // Inner Product Correlator: <Composite, W_active>
      let innerProduct = 0;
      for (let chip = 0; chip < codeLen; chip++) {
        innerProduct += composite[chip] * activeCode[chip];
      }
      const normalizedBit = innerProduct / codeLen;

      // Draw Composite Waveform
      const totalWidth = 720;
      const stepWidth = totalWidth / codeLen;
      let d = `M 20 ${80 - composite[0] * 12}`;
      for (let chip = 0; chip < codeLen; chip++) {
        const x1 = 20 + chip * stepWidth;
        const x2 = x1 + stepWidth;
        const y = 80 - composite[chip] * 12;
        d += ` L ${x1} ${y} L ${x2} ${y}`;
      }
      if (wave) wave.setAttribute('d', d);

      if (corText) {
        const bitDetected = normalizedBit > 0 ? '+1' : '-1';
        const color = normalizedBit > 0 ? '#00ff9d' : '#ffb703';
        corText.innerHTML = `CORRELATOR OUTPUT (⟨Composite, W_${activeIdx + 1}⟩): <strong style="color:${color}; font-size:1.05rem;">${innerProduct > 0 ? '+' : ''}${innerProduct.toFixed(1)}</strong> → RECOVERED DATA BIT = <strong style="color:${color};">${bitDetected}</strong> [100% ORTHOGONAL ZERO INTERFERENCE!]`;
      }
    };

    // Hadamard Order Buttons
    const setHadamardOrder = (order) => {
      hadamardOrder = order;
      currentHadamard = buildHadamard(order);
      [btnH1, btnH2, btnH4, btnH8].forEach(b => b && b.classList.remove('active'));
      if (order === 1 && btnH1) btnH1.classList.add('active');
      else if (order === 2 && btnH2) btnH2.classList.add('active');
      else if (order === 4 && btnH4) btnH4.classList.add('active');
      else if (order === 8 && btnH8) btnH8.classList.add('active');

      if (hadamardView) {
        hadamardView.textContent = `H_${order}: ${order} Orthogonal Walsh Codes (${order} Chips/Bit)`;
      }

      // Update User Selector options
      if (selUser) {
        selUser.innerHTML = '';
        for (let i = 0; i < order; i++) {
          const opt = document.createElement('option');
          opt.value = String(i + 1);
          opt.textContent = `User ${i + 1} [Code W_${i + 1}: ${currentHadamard[i].map(c => c > 0 ? '+1' : '-1').join(', ')}]`;
          if (i === 1) opt.selected = true;
          selUser.appendChild(opt);
        }
      }

      updateWalshEngine();
    };

    if (btnH1) btnH1.addEventListener('click', () => setHadamardOrder(1));
    if (btnH2) btnH2.addEventListener('click', () => setHadamardOrder(2));
    if (btnH4) btnH4.addEventListener('click', () => setHadamardOrder(4));
    if (btnH8) btnH8.addEventListener('click', () => setHadamardOrder(8));

    // Data Bit Buttons (+1 / -1 toggles)
    bitBtns.forEach((btn, idx) => {
      if (btn) {
        btn.addEventListener('click', () => {
          userBits[idx] = userBits[idx] === 1 ? -1 : 1;
          const bitVal = userBits[idx];
          const color = bitVal === 1 ? '#00ff9d' : '#ffb703';
          btn.innerHTML = `U${idx + 1} Bit: <strong style="color:${color};">${bitVal > 0 ? '+1' : '-1'}</strong>`;
          btn.classList.toggle('active', bitVal === 1);
          updateWalshEngine();
        });
      }
    });

    if (selUser) selUser.addEventListener('change', updateWalshEngine);

    // Initial Walsh update
    updateWalshEngine();

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ANIMATED 3-FINGER RAKE RECEIVER & MAXIMAL RATIO COMBINER (FIG 10.17)
    // ─────────────────────────────────────────────────────────────────────────
    const svgRake = container.querySelector('#svg-rake-stage');
    const btnRakePlay = container.querySelector('#btn-rake-play');
    const btnRakeMrc = container.querySelector('#btn-rake-toggle-mrc');
    const chkF1 = container.querySelector('#chk-finger-1');
    const chkF2 = container.querySelector('#chk-finger-2');
    const chkF3 = container.querySelector('#chk-finger-3');
    const sTau2 = container.querySelector('#slider-rake-tau2');
    const sTau3 = container.querySelector('#slider-rake-tau3');
    const vTau2 = container.querySelector('#val-rake-tau2');
    const vTau3 = container.querySelector('#val-rake-tau3');
    const vSnr = container.querySelector('#val-rake-snr');
    const explGain = container.querySelector('#rake-gain-expl');
    const badgeStatus = container.querySelector('#rake-status-badge');

    let rakePlaying = true;
    let mrcEnabled = true;
    let tau2 = 1.63; // microseconds
    let tau3 = 3.26; // microseconds
    let rakeClock = 0;
    let lastRakeTs = performance.now();

    const updateRakeTelemetry = () => {
      const f1 = chkF1 ? chkF1.checked : true;
      const f2 = chkF2 ? chkF2.checked : true;
      const f3 = chkF3 ? chkF3.checked : true;

      if (vTau2) vTau2.textContent = `${tau2.toFixed(2)} µs (${(tau2 / 0.814).toFixed(1)} chips)`;
      if (vTau3) vTau3.textContent = `${tau3.toFixed(2)} µs (${(tau3 / 0.814).toFixed(1)} chips)`;

      if (mrcEnabled) {
        let activeFingersCount = (f1 ? 1 : 0) + (f2 ? 1 : 0) + (f3 ? 1 : 0);
        let snr = 6.0;
        if (f1) snr += 5.0;
        if (f2) snr += 3.8;
        if (f3) snr += 2.0;
        let gain = activeFingersCount > 1 ? `+${(activeFingersCount * 1.3).toFixed(1)} dB RAKE Diversity Gain` : '+0.0 dB (Single Finger)';
        if (vSnr) vSnr.textContent = `${snr.toFixed(1)} dB (${gain})`;
        if (vSnr) vSnr.style.color = '#00ff9d';
        if (explGain) explGain.textContent = 'Constructive maximal ratio combining aligns echo delays and eliminates fading nulls!';
        if (badgeStatus) {
          badgeStatus.textContent = `MRC COMBINER ACTIVE (+${(activeFingersCount * 1.3).toFixed(1)} dB GAIN)`;
          badgeStatus.style.borderColor = '#00ff9d';
          badgeStatus.style.color = '#00ff9d';
        }
      } else {
        if (vSnr) {
          vSnr.textContent = `5.2 dB (DEEP MULTIPATH FADE NULL -12 dB)`;
          vSnr.style.color = '#ff0055';
        }
        if (explGain) explGain.textContent = 'Destructive echo cancellation! Echo 2 & 3 arrive out-of-phase, creating Rayleigh null.';
        if (badgeStatus) {
          badgeStatus.textContent = `RAKE DISABLED: DEEP MULTIPATH NULL (-12 dB FADE)`;
          badgeStatus.style.borderColor = '#ff0055';
          badgeStatus.style.color = '#ff0055';
        }
      }
    };

    if (sTau2) {
      sTau2.addEventListener('input', () => {
        tau2 = parseFloat(sTau2.value);
        updateRakeTelemetry();
      });
    }
    if (sTau3) {
      sTau3.addEventListener('input', () => {
        tau3 = parseFloat(sTau3.value);
        updateRakeTelemetry();
      });
    }
    [chkF1, chkF2, chkF3].forEach(c => {
      if (c) c.addEventListener('change', updateRakeTelemetry);
    });

    if (btnRakeMrc) {
      btnRakeMrc.addEventListener('click', () => {
        mrcEnabled = !mrcEnabled;
        btnRakeMrc.classList.toggle('active', mrcEnabled);
        btnRakeMrc.innerHTML = mrcEnabled
          ? '🎚️ RAKE COMBINER: ENABLED (MRC)'
          : '⚠️ RAKE COMBINER: DISABLED (RAW MULTIPATH)';
        btnRakeMrc.style.color = mrcEnabled ? '#00ff9d' : '#ff0055';
        btnRakeMrc.style.borderColor = mrcEnabled ? '#00ff9d' : '#ff0055';
        updateRakeTelemetry();
      });
    }

    if (btnRakePlay) {
      btnRakePlay.addEventListener('click', () => {
        rakePlaying = !rakePlaying;
        btnRakePlay.textContent = rakePlaying ? '⏸ PAUSE' : '▶ PLAY';
        btnRakePlay.style.color = rakePlaying ? 'var(--accent-cyan)' : '#ffb703';
      });
    }

    // Static Setup of SVG Elements inside svgRake
    if (svgRake) {
      svgRake.innerHTML = `
        <defs>
          <linearGradient id="grad-ray1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00e5ff" stop-opacity="1"/>
            <stop offset="100%" stop-color="#00ff9d" stop-opacity="0.8"/>
          </linearGradient>
          <linearGradient id="grad-ray2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ffb703" stop-opacity="1"/>
            <stop offset="100%" stop-color="#ea580c" stop-opacity="0.8"/>
          </linearGradient>
          <linearGradient id="grad-ray3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#c084fc" stop-opacity="1"/>
            <stop offset="100%" stop-color="#a855f7" stop-opacity="0.8"/>
          </linearGradient>
        </defs>

        <!-- Stage Background & Grid -->
        <rect width="840" height="360" fill="#020612"/>
        <line x1="280" y1="0" x2="280" y2="360" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4 4"/>
        <line x1="600" y1="0" x2="600" y2="360" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4 4"/>

        <!-- Section Titles -->
        <text x="140" y="24" fill="rgba(0,229,255,0.85)" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">1. MULTIPATH AIR CHANNEL (3 SCATTERED RAYS)</text>
        <text x="440" y="24" fill="rgba(0,255,157,0.85)" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">2. 3-FINGER RAKE CORRELATORS (STALLINGS FIG 10.17)</text>
        <text x="720" y="24" fill="rgba(255,183,3,0.85)" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle">3. MAXIMAL RATIO COMBINER (MRC)</text>

        <!-- LEFT: MULTIPATH AIR CHANNEL -->
        <!-- Transmitter Handset -->
        <g id="rake-node-tx" transform="translate(40, 180)">
          <rect x="-24" y="-35" width="48" height="70" fill="#081b33" stroke="#00e5ff" stroke-width="2" rx="6"/>
          <line x1="0" y1="-35" x2="0" y2="-55" stroke="#00e5ff" stroke-width="2.5"/>
          <circle cx="0" cy="-55" r="4" fill="#00e5ff"/>
          <text x="0" y="5" fill="#fff" font-size="9" font-family="monospace" font-weight="700" text-anchor="middle">MOBILE</text>
          <text x="0" y="18" fill="#00e5ff" font-size="8" font-family="monospace" text-anchor="middle">TX</text>
        </g>

        <!-- Reflector 1: Skyscraper Building -->
        <g id="rake-node-bldg" transform="translate(150, 55)">
          <rect x="-25" y="-25" width="50" height="50" fill="#1f1604" stroke="#ffb703" stroke-width="1.8" rx="4"/>
          <line x1="-15" y1="-12" x2="15" y2="-12" stroke="#ffb703" stroke-width="1"/>
          <line x1="-15" y1="0" x2="15" y2="0" stroke="#ffb703" stroke-width="1"/>
          <line x1="-15" y1="12" x2="15" y2="12" stroke="#ffb703" stroke-width="1"/>
          <text x="0" y="38" fill="#ffb703" font-size="8.5" font-family="monospace" text-anchor="middle">Skyscraper</text>
        </g>

        <!-- Reflector 2: Distant Hill Diffraction -->
        <g id="rake-node-hill" transform="translate(150, 305)">
          <path d="M -30 20 Q 0 -25 30 20 Z" fill="#180728" stroke="#c084fc" stroke-width="1.8"/>
          <text x="0" y="32" fill="#c084fc" font-size="8.5" font-family="monospace" text-anchor="middle">Hill Diffraction</text>
        </g>

        <!-- Base Station Receiving Antenna -->
        <g id="rake-node-rx" transform="translate(260, 180)">
          <polygon points="-8,-40 8,-40 16,40 -16,40" fill="#041f26" stroke="#38bdf8" stroke-width="2"/>
          <circle cx="0" cy="-45" r="5" fill="#00e5ff"/>
          <text x="0" y="10" fill="#fff" font-size="8.5" font-family="monospace" text-anchor="middle">BS</text>
          <text x="0" y="22" fill="#38bdf8" font-size="8" font-family="monospace" text-anchor="middle">ANT</text>
        </g>

        <!-- Air Ray Paths -->
        <line x1="40" y1="180" x2="260" y2="180" stroke="#00e5ff" stroke-width="2.5" stroke-dasharray="5 3" opacity="0.6"/>
        <polyline points="40,180 150,55 260,180" fill="none" stroke="#ffb703" stroke-width="2.2" stroke-dasharray="5 3" opacity="0.6"/>
        <polyline points="40,180 150,305 260,180" fill="none" stroke="#c084fc" stroke-width="2.2" stroke-dasharray="5 3" opacity="0.6"/>

        <!-- Flying Multipath Packets -->
        <circle id="rake-pkt-ray1" cx="40" cy="180" r="7" fill="#00e5ff" stroke="#fff" stroke-width="1.5"/>
        <circle id="rake-pkt-ray2" cx="40" cy="180" r="7" fill="#ffb703" stroke="#fff" stroke-width="1.5"/>
        <circle id="rake-pkt-ray3" cx="40" cy="180" r="7" fill="#c084fc" stroke="#fff" stroke-width="1.5"/>

        <!-- Ray Path Delay Badges -->
        <text x="130" y="172" fill="#00e5ff" font-size="8" font-family="monospace">Direct Ray: τ₁ = 0</text>
        <text x="175" y="90" fill="#ffb703" font-size="8" font-family="monospace" id="rake-lbl-tau2">Echo 2: τ₂ = 1.63 µs</text>
        <text x="175" y="270" fill="#c084fc" font-size="8" font-family="monospace" id="rake-lbl-tau3">Echo 3: τ₃ = 3.26 µs</text>

        <!-- MIDDLE: 3 CORRELATOR FINGERS -->
        <!-- Bus Splitters from Antenna into Finger 1, 2, 3 -->
        <path d="M 260 180 L 290 180 L 290 85 L 320 85" fill="none" stroke="#00e5ff" stroke-width="2"/>
        <path d="M 290 180 L 320 180" fill="none" stroke="#ffb703" stroke-width="2"/>
        <path d="M 290 180 L 290 275 L 320 275" fill="none" stroke="#c084fc" stroke-width="2"/>

        <!-- FINGER 1 (Direct Path) -->
        <g id="rake-finger-1" transform="translate(320, 55)">
          <rect x="0" y="0" width="240" height="60" fill="#031526" stroke="#00e5ff" stroke-width="1.8" rx="5"/>
          <text x="8" y="16" fill="#00e5ff" font-size="9" font-family="monospace" font-weight="700">FINGER 1 (DIRECT PATH)</text>
          <!-- Delay Box -->
          <rect x="10" y="24" width="60" height="26" fill="#072b42" stroke="#00e5ff" stroke-width="1" rx="3"/>
          <text x="40" y="41" fill="#fff" font-size="8.5" font-family="monospace" text-anchor="middle">Δτ = 0</text>
          <!-- Correlator Multiplier -->
          <circle cx="110" cy="37" r="14" fill="#04323d" stroke="#00ff9d" stroke-width="1.5"/>
          <text x="110" y="41" fill="#00ff9d" font-size="12" font-family="monospace" font-weight="700" text-anchor="middle">⊗</text>
          <text x="110" y="58" fill="#64748b" font-size="7" font-family="monospace" text-anchor="middle">W_k</text>
          <!-- Weight Box -->
          <rect x="155" y="24" width="70" height="26" fill="#082338" stroke="#00e5ff" stroke-width="1" rx="3"/>
          <text x="190" y="41" fill="#00ff9d" font-size="8.5" font-family="monospace" text-anchor="middle">α₁ = 1.00</text>
          <!-- Pulse in Finger 1 -->
          <circle id="rake-pulse-f1" cx="30" cy="37" r="5" fill="#00ff9d"/>
        </g>

        <!-- FINGER 2 (Building Echo) -->
        <g id="rake-finger-2" transform="translate(320, 150)">
          <rect x="0" y="0" width="240" height="60" fill="#1f1403" stroke="#ffb703" stroke-width="1.8" rx="5"/>
          <text x="8" y="16" fill="#ffb703" font-size="9" font-family="monospace" font-weight="700">FINGER 2 (ECHO 2)</text>
          <!-- Delay Box -->
          <rect x="10" y="24" width="60" height="26" fill="#382204" stroke="#ffb703" stroke-width="1" rx="3"/>
          <text x="40" y="41" fill="#fff" font-size="8" font-family="monospace" text-anchor="middle" id="rake-box-delay-f2">-τ₂ = -1.6µ</text>
          <!-- Correlator Multiplier -->
          <circle cx="110" cy="37" r="14" fill="#382204" stroke="#ffb703" stroke-width="1.5"/>
          <text x="110" y="41" fill="#ffb703" font-size="12" font-family="monospace" font-weight="700" text-anchor="middle">⊗</text>
          <text x="110" y="58" fill="#64748b" font-size="7" font-family="monospace" text-anchor="middle">W_k</text>
          <!-- Weight Box -->
          <rect x="155" y="24" width="70" height="26" fill="#2d1d05" stroke="#ffb703" stroke-width="1" rx="3"/>
          <text x="190" y="41" fill="#ffb703" font-size="8.5" font-family="monospace" text-anchor="middle">α₂ = 0.72</text>
          <!-- Pulse in Finger 2 -->
          <circle id="rake-pulse-f2" cx="30" cy="37" r="5" fill="#ffb703"/>
        </g>

        <!-- FINGER 3 (Hill Diffraction Echo) -->
        <g id="rake-finger-3" transform="translate(320, 245)">
          <rect x="0" y="0" width="240" height="60" fill="#180728" stroke="#c084fc" stroke-width="1.8" rx="5"/>
          <text x="8" y="16" fill="#c084fc" font-size="9" font-family="monospace" font-weight="700">FINGER 3 (ECHO 3)</text>
          <!-- Delay Box -->
          <rect x="10" y="24" width="60" height="26" fill="#2d0f47" stroke="#c084fc" stroke-width="1" rx="3"/>
          <text x="40" y="41" fill="#fff" font-size="8" font-family="monospace" text-anchor="middle" id="rake-box-delay-f3">-τ₃ = -3.3µ</text>
          <!-- Correlator Multiplier -->
          <circle cx="110" cy="37" r="14" fill="#2d0f47" stroke="#c084fc" stroke-width="1.5"/>
          <text x="110" y="41" fill="#c084fc" font-size="12" font-family="monospace" font-weight="700" text-anchor="middle">⊗</text>
          <text x="110" y="58" fill="#64748b" font-size="7" font-family="monospace" text-anchor="middle">W_k</text>
          <!-- Weight Box -->
          <rect x="155" y="24" width="70" height="26" fill="#240c38" stroke="#c084fc" stroke-width="1" rx="3"/>
          <text x="190" y="41" fill="#c084fc" font-size="8.5" font-family="monospace" text-anchor="middle">α₃ = 0.45</text>
          <!-- Pulse in Finger 3 -->
          <circle id="rake-pulse-f3" cx="30" cy="37" r="5" fill="#c084fc"/>
        </g>

        <!-- RIGHT: SUMMING JUNCTION & EYE OSCILLOSCOPE -->
        <!-- Links into Summer -->
        <path d="M 560 85 L 610 85 L 610 160" fill="none" stroke="#00e5ff" stroke-width="2"/>
        <path d="M 560 180 L 610 180" fill="none" stroke="#ffb703" stroke-width="2"/>
        <path d="M 560 275 L 610 275 L 610 200" fill="none" stroke="#c084fc" stroke-width="2"/>

        <!-- Summing Junction Circle -->
        <g id="rake-summer-node" transform="translate(610, 180)">
          <circle cx="0" cy="0" r="22" fill="#042017" stroke="#00ff9d" stroke-width="2.5"/>
          <text x="0" y="7" fill="#00ff9d" font-size="20" font-family="monospace" font-weight="700" text-anchor="middle">∑</text>
          <text x="0" y="32" fill="#64748b" font-size="7.5" font-family="monospace" text-anchor="middle">MRC COMBINER</text>
        </g>

        <!-- Output Bus to Decision Block -->
        <line x1="632" y1="180" x2="675" y2="180" stroke="#00ff9d" stroke-width="2.5"/>

        <!-- Oscilloscope Box -->
        <g id="rake-scope" transform="translate(675, 70)">
          <rect x="0" y="0" width="150" height="220" fill="#010a12" stroke="rgba(0,229,255,0.4)" stroke-width="1.8" rx="6"/>
          <rect x="8" y="8" width="134" height="150" fill="#020f1a" stroke="rgba(0,255,157,0.2)" stroke-width="1" rx="4"/>
          <!-- Grid in Scope -->
          <line x1="8" y1="83" x2="142" y2="83" stroke="rgba(255,255,255,0.15)"/>
          <line x1="75" y1="8" x2="75" y2="158" stroke="rgba(255,255,255,0.15)"/>
          <!-- Dynamic Detected Output Waveform in Scope -->
          <path id="rake-scope-wave" d="" fill="none" stroke="#00ff9d" stroke-width="3"/>

          <!-- Scope Telemetry Text -->
          <text x="75" y="174" fill="#fff" font-size="8.5" font-family="monospace" font-weight="700" text-anchor="middle">DETECTED SYMBOL</text>
          <text x="75" y="188" fill="#00ff9d" font-size="10" font-family="monospace" font-weight="700" text-anchor="middle" id="rake-scope-val">r_comb = +4.0 V</text>
          <text x="75" y="202" fill="#38bdf8" font-size="8" font-family="monospace" text-anchor="middle" id="rake-scope-ber">BER &lt; 10⁻⁵ (EXCELLENT)</text>
          <text x="75" y="214" fill="#64748b" font-size="7" font-family="monospace" text-anchor="middle">Hard Decision: b̂ = +1</text>
        </g>
      `;
    }

    // Dynamic Animation Loop for RAKE Receiver
    const animateRakeReceiver = (currentTs) => {
      const dt = Math.max(0.001, Math.min(0.1, (currentTs - lastRakeTs) / 1000));
      lastRakeTs = currentTs;

      if (rakePlaying) {
        rakeClock += dt * 1.5;
      }
      const t = rakeClock;

      // 1. Multipath Air Packets
      const pkt1 = svgRake ? svgRake.querySelector('#rake-pkt-ray1') : null;
      const pkt2 = svgRake ? svgRake.querySelector('#rake-pkt-ray2') : null;
      const pkt3 = svgRake ? svgRake.querySelector('#rake-pkt-ray3') : null;

      // Direct ray 1 travels (40, 180) to (260, 180)
      const p1 = (t * 0.8) % 1.0;
      if (pkt1) {
        pkt1.setAttribute('cx', 40 + p1 * (260 - 40));
        pkt1.setAttribute('cy', 180);
      }

      // Ray 2 bounces via (150, 55) with delay tau2
      const p2 = ((t * 0.8) - 0.2) % 1.0;
      const normP2 = p2 < 0 ? p2 + 1.0 : p2;
      if (pkt2) {
        if (normP2 < 0.5) {
          const u = normP2 / 0.5;
          pkt2.setAttribute('cx', 40 + u * (150 - 40));
          pkt2.setAttribute('cy', 180 + u * (55 - 180));
        } else {
          const u = (normP2 - 0.5) / 0.5;
          pkt2.setAttribute('cx', 150 + u * (260 - 150));
          pkt2.setAttribute('cy', 55 + u * (180 - 55));
        }
      }

      // Ray 3 diffracts via (150, 305) with delay tau3
      const p3 = ((t * 0.8) - 0.4) % 1.0;
      const normP3 = p3 < 0 ? p3 + 1.0 : p3;
      if (pkt3) {
        if (normP3 < 0.5) {
          const u = normP3 / 0.5;
          pkt3.setAttribute('cx', 40 + u * (150 - 40));
          pkt3.setAttribute('cy', 180 + u * (305 - 180));
        } else {
          const u = (normP3 - 0.5) / 0.5;
          pkt3.setAttribute('cx', 150 + u * (260 - 150));
          pkt3.setAttribute('cy', 305 + u * (180 - 305));
        }
      }

      // 2. Pulses inside Finger 1, 2, 3
      const pulseF1 = svgRake ? svgRake.querySelector('#rake-pulse-f1') : null;
      const pulseF2 = svgRake ? svgRake.querySelector('#rake-pulse-f2') : null;
      const pulseF3 = svgRake ? svgRake.querySelector('#rake-pulse-f3') : null;

      const f1Progress = (t * 1.2) % 1.0;
      // In fingers with MRC, pulses are aligned at the combiner!
      const f2Progress = mrcEnabled ? ((t * 1.2) % 1.0) : (((t * 1.2) - (tau2 * 0.2)) % 1.0);
      const f3Progress = mrcEnabled ? ((t * 1.2) % 1.0) : (((t * 1.2) - (tau3 * 0.2)) % 1.0);

      const normF2 = f2Progress < 0 ? f2Progress + 1.0 : f2Progress;
      const normF3 = f3Progress < 0 ? f3Progress + 1.0 : f3Progress;

      if (pulseF1) pulseF1.setAttribute('cx', 20 + f1Progress * 200);
      if (pulseF2) pulseF2.setAttribute('cx', 20 + normF2 * 200);
      if (pulseF3) pulseF3.setAttribute('cx', 20 + normF3 * 200);

      // 3. Dynamic Scope Output Waveform
      const scopeWave = svgRake ? svgRake.querySelector('#rake-scope-wave') : null;
      const scopeVal = svgRake ? svgRake.querySelector('#rake-scope-val') : null;
      const scopeBer = svgRake ? svgRake.querySelector('#rake-scope-ber') : null;

      if (scopeWave) {
        let wavePath = '';
        const cx = 75;
        const cy = 83; // center line
        const amp = mrcEnabled ? 48 : 8; // High peak when aligned MRC; flat/jittery null when disabled!
        const strokeCol = mrcEnabled ? '#00ff9d' : '#ff0055';
        scopeWave.setAttribute('stroke', strokeCol);

        for (let x = 12; x <= 138; x += 4) {
          const dx = (x - cx) / 16;
          // Sinc pulse for symbol detection: sinc(x) = sin(pi*x)/(pi*x)
          const sinc = dx === 0 ? 1 : Math.sin(Math.PI * dx) / (Math.PI * dx);
          const noise = mrcEnabled ? (Math.sin(x * 12 + t * 15) * 2) : (Math.sin(x * 8 + t * 25) * 6 + Math.cos(x * 14) * 4);
          const y = cy - (sinc * amp) + noise;
          wavePath += (x === 12 ? `M ${x} ${y.toFixed(1)}` : ` L ${x} ${y.toFixed(1)}`);
        }
        scopeWave.setAttribute('d', wavePath);
      }

      if (scopeVal) {
        scopeVal.textContent = mrcEnabled ? 'r_comb = +4.0 V' : 'r_comb = +0.6 V (FADED)';
        scopeVal.style.color = mrcEnabled ? '#00ff9d' : '#ff0055';
      }
      if (scopeBer) {
        scopeBer.textContent = mrcEnabled ? 'BER < 10⁻⁵ (NO ERRORS)' : 'BER > 10⁻² (HIGH LOSS)';
        scopeBer.style.color = mrcEnabled ? '#38bdf8' : '#ff0055';
      }

      // Update Delay Box labels
      const boxD2 = svgRake ? svgRake.querySelector('#rake-box-delay-f2') : null;
      const boxD3 = svgRake ? svgRake.querySelector('#rake-box-delay-f3') : null;
      if (boxD2) boxD2.textContent = `-τ₂ = -${tau2.toFixed(1)}µ`;
      if (boxD3) boxD3.textContent = `-τ₃ = -${tau3.toFixed(1)}µ`;

      const lblT2 = svgRake ? svgRake.querySelector('#rake-lbl-tau2') : null;
      const lblT3 = svgRake ? svgRake.querySelector('#rake-lbl-tau3') : null;
      if (lblT2) lblT2.textContent = `Echo 2: τ₂ = ${tau2.toFixed(2)} µs`;
      if (lblT3) lblT3.textContent = `Echo 3: τ₃ = ${tau3.toFixed(2)} µs`;

      activeRakeRaf = requestAnimationFrame(animateRakeReceiver);
    };

    updateRakeTelemetry();
    activeRakeRaf = requestAnimationFrame(animateRakeReceiver);
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
