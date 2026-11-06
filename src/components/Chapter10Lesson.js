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

            <!-- Top Controls Toolbar -->
            <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
              <!-- Access Architecture Selector -->
              <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim);">MULTIPLE ACCESS:</span>
                <button class="btn-ctrl active" id="btn-top-fdma" style="font-size: 0.75rem; padding: 4px 10px;">
                  📡 1G FDMA (Freq Sliced)
                </button>
                <button class="btn-ctrl" id="btn-top-tdma" style="font-size: 0.75rem; padding: 4px 10px;">
                  ⏱️ 2G TDMA (Time Sliced)
                </button>
                <button class="btn-ctrl" id="btn-top-cdma" style="font-size: 0.75rem; padding: 4px 10px;">
                  🧬 2G/3G CDMA (Code Sliced)
                </button>
              </div>

              <!-- Multi-Device Option -->
              <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim);">SUBSCRIBERS:</span>
                <button class="btn-ctrl active" id="btn-dev-1" title="1 Device — Deep-dive single packet trace">1 CLIENT</button>
                <button class="btn-ctrl" id="btn-dev-4" title="4 Devices — Moderate traffic load">4 USERS</button>
                <button class="btn-ctrl" id="btn-dev-8" title="8 Devices — Full single-carrier capacity">8 USERS</button>
                <button class="btn-ctrl" id="btn-dev-12" title="12 Devices — Tower Overload & Erlang B Blocking!">⚠️ 12 OVERLOAD</button>
              </div>

              <!-- Camera Controls, Auto-Follow Toggle, & Maximize Canvas -->
              <div style="display: flex; gap: 6px; align-items: center; font-family: var(--font-mono); font-size: 0.72rem; flex-wrap: wrap;">
                <button class="btn-ctrl active" id="btn-toggle-autocam" title="Automatically track and zoom packet on both forward and reverse paths">
                  🎥 AUTO-ZOOM: <span id="autocam-status-text" style="color:var(--status-ready);font-weight:700;">ON</span>
                </button>
                <button class="btn-ctrl" id="btn-cam-wide" title="Wide Overview">🌐 ALL</button>
                <button class="btn-ctrl" id="btn-cam-client" title="Focus Mobile Client">💻 CLIENT</button>
                <button class="btn-ctrl" id="btn-cam-air" title="Focus Wireless Air Link">📡 AIR LINK</button>
                <button class="btn-ctrl" id="btn-cam-tower" title="Focus Base Station Tower">🗼 TOWER</button>
                <button class="btn-ctrl" id="btn-cam-core" title="Focus Core Network & Server">☁️ CORE</button>
                <button class="btn-ctrl" id="btn-maximize-canvas" title="Maximize Viewport to Full Screen Canvas">
                  ⛶ <span id="btn-max-text">MAXIMIZE</span>
                </button>
              </div>
            </div>

            <!-- Main Interactive Cellular Viewport Container with Mouse Drag & Wheel Zoom -->
            <div class="canvas-viewport-container" id="canvas-container-box" style="background: #020409; border: 1px solid var(--border-subtle); border-radius: 6px; position: relative; overflow: hidden; width: 100%; cursor: grab;">
              <!-- Floating Pan/Zoom Navigation Toolbar -->
              <div style="position: absolute; top: 10px; left: 12px; display: flex; gap: 6px; align-items: center; z-index: 10; flex-wrap: wrap;">
                <div style="background: rgba(3, 7, 18, 0.92); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 4px 10px; font-family: var(--font-mono); font-size: 0.72rem; display: flex; align-items: center; gap: 8px;">
                  <span id="cam-lens-icon">🎥</span>
                  <span style="color: var(--text-dim);">CAMERA:</span>
                  <span id="cam-mode-status" style="color: var(--accent-cyan); font-weight: 700;">OVERVIEW (1.0×)</span>
                </div>
                <button class="canvas-tool-btn" id="btn-pan-mode-hint" title="You can click and drag anywhere on the scene with your mouse to look around">
                  🖐 DRAG TO PAN ACTIVE
                </button>
                <button class="canvas-tool-btn" id="btn-sim-zin" title="Zoom In Scene">➕</button>
                <button class="canvas-tool-btn" id="btn-sim-zout" title="Zoom Out Scene">➖</button>
                <button class="canvas-tool-btn" id="btn-sim-reset-view" title="Reset Viewport to Standard Full View">↺ RESET VIEW</button>
              </div>

              <!-- Live Tower Load & Capacity HUD Overlay -->
              <div style="position: absolute; top: 10px; right: 12px; max-width: 320px; background: rgba(3, 7, 18, 0.94); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 10px; font-family: var(--font-mono); font-size: 0.72rem; z-index: 10;" id="tower-capacity-hud">
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
                  ⚠️ <strong>CALL BLOCKED!</strong> All 8 channels occupied. Stallings Erlang B Loss $P = 42.8\\%$. Extra subscriber rejected with busy tone.
                </div>
              </div>

              <!-- GSM TDMA 8-Slot Frame Clock Strip Overlay (Active in TDMA Mode) -->
              <div id="sim-tdma-clock-overlay" style="position: absolute; bottom: 8px; left: 12px; right: 12px; background: rgba(3, 7, 18, 0.92); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 6px 10px; z-index: 8; display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-family: var(--font-mono); font-size: 0.7rem;">
                  <span style="color: #00ff9d; font-weight: 700;">⏱️ GSM TDMA 8-SLOT FRAME CLOCK (4.615 ms Frame | Strict Time Alignment)</span>
                  <span id="sim-tdma-active-slot-txt" style="color: var(--accent-cyan);">Active Slot: 0 (MS-1 Burst Transmitting)</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;" id="sim-tdma-slots-hud-grid">
                  <!-- Generated dynamically: Slot 0..7 -->
                </div>
              </div>

              <!-- SVG Viewport with Full Pan & Zoom Support -->
              <svg viewBox="0 0 960 340" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 340px; display: block;" id="iso-cellular-svg">
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
                <rect width="960" height="340" fill="#030712"/>
                <rect width="960" height="340" fill="url(#iso-ground-grid)"/>

                <!-- Cell Boundary Sector Arc (R = 1.6 km) -->
                <ellipse cx="380" cy="230" rx="330" ry="115" fill="rgba(0, 112, 243, 0.03)" stroke="rgba(0, 229, 255, 0.15)" stroke-width="1.5" stroke-dasharray="6 4"/>
                <text x="60" y="325" fill="rgba(255,255,255,0.3)" font-size="9" font-family="monospace">CELL A COVERAGE SECTOR (R = 1.6 km | d = 2.77 km)</text>

                <!-- 1. MULTIPLE SUBSCRIBER CLIENTS CONTAINER (LEFT ZONE) -->
                <g id="iso-subscribers-group">
                  <!-- MS-1 Primary Client: Laptop + Smartphone (Spaced for maximum clarity) -->
                  <g id="iso-client-primary" transform="translate(0, 0)">
                    ${drawIsometricLaptop(130, 210, 0.9, '#00e5ff')}
                    ${drawIsometricPhone(65, 230, 0.75, '#38bdf8')}
                    <text x="60" y="270" fill="#fff" font-size="10" font-family="monospace" font-weight="700">MS-1 (Primary)</text>
                    <text x="60" y="282" fill="#00e5ff" font-size="8" font-family="monospace" id="ms1-label-sub">Tx: 825.03 MHz (Ch 1)</text>
                  </g>

                  <!-- Additional Multi-Users (Rendered with distinct spatial separation) -->
                  <g id="iso-multi-devices"></g>
                </g>

                <!-- Pulsing RF Waves Radiating from Client Antennas -->
                <circle id="iso-client-rf-pulse" cx="130" cy="180" r="10" fill="none" stroke="#00e5ff" stroke-width="1.5" opacity="0"/>
                <circle id="iso-client-rf-pulse-2" cx="130" cy="180" r="20" fill="none" stroke="#00e5ff" stroke-width="1" opacity="0"/>

                <!-- REAL-TIME OSCILLATING ELECTROMAGNETIC SINE WAVES (AIR INTERFACE) -->
                <!-- Uplink Wave (MS -> BS) -->
                <path id="iso-em-carrier-wave" d="" fill="none" stroke="url(#rf-wave-grad-fdma)" stroke-width="2.5" opacity="0.85"/>
                <!-- Downlink Wave (BS -> MS Return ACK) -->
                <path id="iso-em-downlink-wave" d="" fill="none" stroke="#00ff9d" stroke-width="2" stroke-dasharray="5 3" opacity="0"/>

                <!-- Air Link Label & Propagation Metrics -->
                <g id="iso-air-metrics-badge" transform="translate(205, 70)">
                  <rect x="0" y="0" width="160" height="32" fill="#081024" stroke="rgba(0,229,255,0.4)" stroke-width="1" rx="4"/>
                  <text x="8" y="14" fill="#00e5ff" font-size="8.5" font-family="monospace" font-weight="700" id="iso-air-carrier-txt">fc: 825.03 MHz | λ: 36.3cm</text>
                  <text x="8" y="26" fill="#64748b" font-size="7.5" font-family="monospace" id="iso-air-loss-txt">Hata Loss: -108 dB | d: 1.2km</text>
                </g>

                <!-- 2. BASE STATION TOWER & EQUIPMENT SHELTER (x=380, y=210) -->
                <g id="iso-node-bs">
                  ${drawIsometricBtsShelter(340, 245, 0.85, '#38bdf8')}
                  ${drawIsometricBaseStation(380, 210, 1.05, '#38bdf8')}
                  <text x="340" y="275" fill="#fff" font-size="11" font-family="monospace" font-weight="700">BS-A Transceiver</text>
                  <text x="340" y="288" fill="#00e5ff" font-size="8.5" font-family="monospace">Base Station Tower & Shelter</text>
                  <circle id="iso-bs-rf-pulse" cx="380" cy="105" r="15" fill="none" stroke="#00ff9d" stroke-width="1.5" opacity="0"/>
                </g>

                <!-- Cable: BS to BSC / Edge Router -->
                <line x1="415" y1="210" x2="530" y2="210" stroke="#1e293b" stroke-width="4"/>
                <line x1="415" y1="210" x2="530" y2="210" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="6 3" id="wire-link-1"/>
                <text x="435" y="200" fill="#64748b" font-size="8" font-family="monospace">Abis Trunk (E1)</text>

                <!-- 3. BASE STATION CONTROLLER / ROUTER (x=560, y=210) -->
                <g id="iso-node-router">
                  ${drawIsometricBscCabinet(560, 230, 0.85, '#ffb703')}
                  <text x="515" y="275" fill="#fff" font-size="11" font-family="monospace" font-weight="700">BSC Controller</text>
                  <text x="515" y="288" fill="#ffb703" font-size="8.5" font-family="monospace">Base Station Controller</text>
                </g>

                <!-- Cable: BSC to Core Cloud -->
                <line x1="605" y1="210" x2="710" y2="175" stroke="#1e293b" stroke-width="4"/>
                <line x1="605" y1="210" x2="710" y2="175" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="6 3" id="wire-link-2"/>
                <text x="625" y="185" fill="#64748b" font-size="8" font-family="monospace">A-Interface / IP</text>

                <!-- 4. CELLULAR CORE / MTSO / MSC CLOUD (x=730, y=170) -->
                <g id="iso-node-cloud">
                  ${drawIsometricCloud(730, 170, 1.05, '#38bdf8')}
                  <text x="680" y="210" fill="#fff" font-size="11" font-family="monospace" font-weight="700">MTSO / MSC Core</text>
                  <text x="690" y="223" fill="#38bdf8" font-size="8.5" font-family="monospace">HLR / VLR / Gateway</text>
                </g>

                <!-- Cable: Cloud to Public Web Server -->
                <line x1="780" y1="160" x2="860" y2="160" stroke="#1e293b" stroke-width="4"/>
                <line x1="780" y1="160" x2="860" y2="160" stroke="#00ff9d" stroke-width="1.8" stroke-dasharray="6 3" id="wire-link-3"/>
                <text x="795" y="150" fill="#00ff9d" font-size="8" font-family="monospace">Internet Fiber</text>

                <!-- 5. DESTINATION APPLICATION / WEB SERVER (x=880, y=205) -->
                <g id="iso-node-server">
                  ${drawIsometricServer(880, 205, 0.95, '#00ff9d')}
                  <text x="835" y="260" fill="#fff" font-size="11" font-family="monospace" font-weight="700">Web / DNS Host</text>
                  <text x="840" y="273" fill="#00ff9d" font-size="8.5" font-family="monospace">IP: 8.8.8.8 (Server)</text>
                </g>

                <!-- LIVE MOVING PACKETS (SUPPORTING BOTH FORWARD & RETURN ACK) -->
                <g id="iso-active-packets-container">
                  <!-- Forward Uplink Packet (MS -> Server) -->
                  <g id="iso-animated-packet">
                    <rect id="iso-pkt-bubble" x="140" y="190" width="125" height="24" fill="#0b1329" stroke="#00e5ff" stroke-width="1.8" rx="4"/>
                    <text id="iso-pkt-text" x="146" y="206" fill="#00e5ff" font-size="8.5" font-family="monospace" font-weight="700">
                      UPLINK: f₁ 825.03M
                    </text>
                  </g>
                  <!-- Return Downlink ACK Packet (Server -> MS) -->
                  <g id="iso-animated-packet-ack" opacity="0">
                    <rect id="iso-pkt-bubble-ack" x="800" y="170" width="125" height="24" fill="#041f17" stroke="#00ff9d" stroke-width="1.8" rx="4"/>
                    <text id="iso-pkt-text-ack" x="806" y="186" fill="#00ff9d" font-size="8.5" font-family="monospace" font-weight="700">
                      DOWNLINK: HTTP 200
                    </text>
                  </g>
                  <!-- Secondary Packet (Multi-user) -->
                  <g id="iso-animated-packet-2" opacity="0">
                    <rect id="iso-pkt-bubble-2" x="140" y="150" width="115" height="22" fill="#0b1329" stroke="#38bdf8" stroke-width="1.5" rx="4"/>
                    <text id="iso-pkt-text-2" x="146" y="165" fill="#38bdf8" font-size="8" font-family="monospace" font-weight="700">
                      MS-2: f₂ 825.06M
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
                STAGE 1 / 8 — UPLINK: MOBILE SUBSCRIBER TRANSMISSION
              </span>
            </div>

            <!-- Real-Time Protocol & RF Layer Telemetry HUD -->
            <div id="iso-hud-box" style="margin-top: 8px; background: rgba(15,23,42,0.85); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 0.75rem; flex-wrap: wrap; gap: 6px;">
              <span id="iso-hud-status" style="color: var(--status-ready);">● 2-WAY ROUND TRIP SIMULATION ACTIVE: Automated procedure & camera tracking running</span>
              <span id="iso-hud-phy" style="color: var(--text-dim);">UPLINK: 825.03 MHz | DOWNLINK: 870.03 MHz | SPACING: 45 MHz | MOD: FM (AMPS)</span>
            </div>

            <!-- Deep-Dive Protocol Procedure Breakdown Card -->
            <div id="iso-step-detail" style="margin-top:8px; background:rgba(11, 19, 41, 0.8); border:1px solid var(--border-subtle); border-radius:4px; padding:12px; font-family:var(--font-mono); font-size:0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="color:var(--accent-sky); font-size:0.7rem; font-weight:700;" id="iso-step-num">ROUND TRIP STAGE 1 OF 8</div>
                <div style="color:var(--status-ready); font-size:0.7rem; font-weight:700;" id="iso-step-direction">⬆️ UPLINK DIRECTION</div>
              </div>
              <div style="color:#fff; font-weight:700; font-size:0.95rem; margin-bottom:4px;" id="iso-step-title">1. MOBILE SUBSCRIBER TRANSMISSION</div>
              <div style="color:var(--text-secondary); line-height:1.5;" id="iso-step-desc">
                The Mobile Subscriber (MS) terminal modulates user data onto its assigned radio channel. The high-frequency electromagnetic wave radiates through the air interface toward the cell tower.
              </div>
              <div style="margin-top:8px; display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:6px;" id="iso-step-meta"></div>
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
              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>STEP i (PRIMARY AXIS)</span>
                  <span id="ch10-val-i" style="color: var(--accent-cyan); font-weight: 700;">i = 2</span>
                </div>
                <input type="range" id="ch10-slider-i" min="0" max="4" step="1" value="2" class="control-slider"/>
              </div>

              <div class="ch2-ctrl">
                <div class="ch2-lbl">
                  <span>STEP j (60° TURN AXIS)</span>
                  <span id="ch10-val-j" style="color: #00ff9d; font-weight: 700;">j = 1</span>
                </div>
                <input type="range" id="ch10-slider-j" min="0" max="4" step="1" value="1" class="control-slider"/>
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

    const autoCamText = container.querySelector('#autocam-status-text');
    const camStatus = container.querySelector('#cam-mode-status');
    const camIcon = container.querySelector('#cam-lens-icon');

    // Camera preset buttons
    const btnCamWide = container.querySelector('#btn-cam-wide');
    const btnCamClient = container.querySelector('#btn-cam-client');
    const btnCamAir = container.querySelector('#btn-cam-air');
    const btnCamTower = container.querySelector('#btn-cam-tower');
    const btnCamCore = container.querySelector('#btn-cam-core');

    // Multi-access buttons
    const btnTopFdma = container.querySelector('#btn-top-fdma');
    const btnTopTdma = container.querySelector('#btn-top-tdma');
    const btnTopCdma = container.querySelector('#btn-top-cdma');
    const modeTag = container.querySelector('#iso-active-mode-tag');

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

    // Maximize / Fullscreen Toggle
    if (btnMax && canvasBox) {
      btnMax.addEventListener('click', () => {
        ch10State.isMaximized = !ch10State.isMaximized;
        canvasBox.classList.toggle('is-maximized', ch10State.isMaximized);
        btnMax.classList.toggle('active', ch10State.isMaximized);
        if (btnMaxText) {
          btnMaxText.textContent = ch10State.isMaximized ? 'RESTORE' : 'MAXIMIZE';
        }
      });
    }

    // Camera ViewBox Presets (Optimized for no clipping)
    const cameraTargets = {
      overview: { vx: 0, vy: 0, vw: 960, vh: 340, label: 'OVERVIEW (1.0×)', icon: '🌐' },
      client: { vx: 0, vy: 80, vw: 400, vh: 240, label: 'CLIENT ZOOM (2.4×)', icon: '💻' },
      air: { vx: 40, vy: 30, vw: 500, vh: 260, label: 'AIR INTERFACE (2.0×)', icon: '📡' },
      tower: { vx: 180, vy: 35, vw: 380, vh: 240, label: 'BASE STATION TOWER (2.5×)', icon: '🗼' },
      core: { vx: 480, vy: 55, vw: 460, vh: 250, label: 'CORE & SERVER (2.1×)', icon: '☁️' }
    };

    let curVx = 0, curVy = 0, curVw = 960, curVh = 340;
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
      [btnCamWide, btnCamClient, btnCamAir, btnCamTower, btnCamCore].forEach(b => b && b.classList.remove('active'));
      const target = cameraTargets[preset] || cameraTargets.overview;
      applyViewBox(target);
    };

    if (btnCamWide) btnCamWide.addEventListener('click', () => { setManualCamera('overview'); btnCamWide.classList.add('active'); });
    if (btnCamClient) btnCamClient.addEventListener('click', () => { setManualCamera('client'); btnCamClient.classList.add('active'); });
    if (btnCamAir) btnCamAir.addEventListener('click', () => { setManualCamera('air'); btnCamAir.classList.add('active'); });
    if (btnCamTower) btnCamTower.addEventListener('click', () => { setManualCamera('tower'); btnCamTower.classList.add('active'); });
    if (btnCamCore) btnCamCore.addEventListener('click', () => { setManualCamera('core'); btnCamCore.classList.add('active'); });

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
    // MOUSE DRAG/PAN & WHEEL ZOOM ON THE CELLULAR VIEWPORT (USER FREEDOM)
    // ─────────────────────────────────────────────────────────────────────────
    let isPanningViewport = false;
    let panStartX = 0, panStartY = 0;
    let panStartVx = 0, panStartVy = 0;

    if (canvasBox && isoSvg) {
      canvasBox.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
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
        const scaleX = curVw / (boxRect.width || 960);
        const scaleY = curVh / (boxRect.height || 340);
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
        const newVw = Math.max(220, Math.min(1600, curVw * zoomFactor));
        const newVh = Math.max(80, Math.min(600, curVh * zoomFactor));
        curVx += (curVw - newVw) / 2;
        curVy += (curVh - newVh) / 2;
        curVw = newVw;
        curVh = newVh;
        isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
        if (camStatus) camStatus.textContent = `ZOOM (${(960 / curVw).toFixed(1)}×)`;
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
        const newVw = Math.max(220, curVw * 0.8);
        const newVh = Math.max(80, curVh * 0.8);
        curVx += (curVw - newVw) / 2;
        curVy += (curVh - newVh) / 2;
        curVw = newVw;
        curVh = newVh;
        isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
        if (camStatus) camStatus.textContent = `ZOOM (${(960 / curVw).toFixed(1)}×)`;
      });
    }

    if (btnSimZout) {
      btnSimZout.addEventListener('click', () => {
        ch10State.autoCamera = false;
        if (autoCamText) { autoCamText.textContent = 'OFF'; autoCamText.style.color = 'var(--text-dim)'; }
        if (btnAutoCam) btnAutoCam.classList.remove('active');
        const newVw = Math.min(1600, curVw * 1.25);
        const newVh = Math.min(600, curVh * 1.25);
        curVx += (curVw - newVw) / 2;
        curVy += (curVh - newVh) / 2;
        curVw = newVw;
        curVh = newVh;
        isoSvg.setAttribute('viewBox', `${curVx.toFixed(1)} ${curVy.toFixed(1)} ${curVw.toFixed(1)} ${curVh.toFixed(1)}`);
        if (camStatus) camStatus.textContent = `ZOOM (${(960 / curVw).toFixed(1)}×)`;
      });
    }

    if (btnSimResetView) {
      btnSimResetView.addEventListener('click', () => {
        setManualCamera('overview');
      });
    }

    // Render Tower Capacity & Chips
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

    // Render Multi-Devices with comfortable spatial separation
    const updateMultiDevicesGraphic = () => {
      if (!multiDevicesGroup) return;
      const count = ch10State.activeDevicesCount;
      let svg = '';

      if (count >= 4) {
        // Device 2: Smartphone MS-2 (Clean vertical spacing at y=130)
        svg += `
          <g id="iso-client-dev2">
            ${drawIsometricPhone(70, 130, 0.7, '#38bdf8')}
            <text x="35" y="160" fill="#fff" font-size="8.5" font-family="monospace">MS-2</text>
            <text x="30" y="170" fill="#38bdf8" font-size="7.5" font-family="monospace">Phone (Voice)</text>
          </g>
        `;
        // Device 3: Tablet MS-3 (x=190, y=140)
        svg += `
          <g id="iso-client-dev3">
            ${drawIsometricLaptop(190, 140, 0.65, '#00ff9d')}
            <text x="165" y="170" fill="#fff" font-size="8.5" font-family="monospace">MS-3</text>
            <text x="155" y="180" fill="#00ff9d" font-size="7.5" font-family="monospace">Laptop (Web)</text>
          </g>
        `;
        // Device 4: Vehicular Terminal MS-4 (x=190, y=260)
        svg += `
          <g id="iso-client-dev4">
            ${drawIsometricVehicle(190, 260, 0.75, '#ffb703')}
            <text x="165" y="295" fill="#fff" font-size="8.5" font-family="monospace">MS-4 (Vehicular)</text>
            <text x="165" y="305" fill="#ffb703" font-size="7.5" font-family="monospace">Car (60 km/h)</text>
          </g>
        `;
      }

      if (count >= 8) {
        svg += `
          <g id="iso-client-dev5">
            ${drawIsometricPhone(40, 185, 0.6, '#818cf8')}
            <text x="25" y="208" fill="#818cf8" font-size="7.5" font-family="monospace">MS-5</text>
          </g>
          <g id="iso-client-dev6">
            ${drawIsometricPhone(110, 115, 0.6, '#a855f7')}
            <text x="95" y="138" fill="#a855f7" font-size="7.5" font-family="monospace">MS-6</text>
          </g>
          <g id="iso-client-dev7">
            ${drawIsometricPhone(230, 190, 0.6, '#f43f5e')}
            <text x="215" y="213" fill="#f43f5e" font-size="7.5" font-family="monospace">MS-7</text>
          </g>
          <g id="iso-client-dev8">
            ${drawIsometricLaptop(120, 265, 0.6, '#38bdf8')}
            <text x="100" y="295" fill="#38bdf8" font-size="7.5" font-family="monospace">MS-8</text>
          </g>
        `;
      }

      if (count >= 12) {
        svg += `
          <g id="iso-client-overload">
            <g transform="translate(30, 230)">
              <circle cx="0" cy="0" r="14" fill="rgba(255,0,85,0.2)" stroke="#ff0055" stroke-width="1.5" stroke-dasharray="3 3"/>
              ${drawIsometricPhone(0, 0, 0.6, '#ff0055')}
              <text x="-15" y="22" fill="#ff0055" font-size="8" font-family="monospace" font-weight="700">MS-9 (BLOCKED)</text>
            </g>
            <g transform="translate(230, 120)">
              <circle cx="0" cy="0" r="14" fill="rgba(255,0,85,0.2)" stroke="#ff0055" stroke-width="1.5" stroke-dasharray="3 3"/>
              ${drawIsometricPhone(0, 0, 0.6, '#ff0055')}
              <text x="-20" y="22" fill="#ff0055" font-size="8" font-family="monospace" font-weight="700">MS-10 (BLOCKED)</text>
            </g>
            <g transform="translate(160, 80)">
              <circle cx="0" cy="0" r="14" fill="rgba(255,0,85,0.2)" stroke="#ff0055" stroke-width="1.5" stroke-dasharray="3 3"/>
              ${drawIsometricPhone(0, 0, 0.6, '#ff0055')}
              <text x="-20" y="22" fill="#ff0055" font-size="8" font-family="monospace" font-weight="700">MS-11 (BLOCKED)</text>
            </g>
            <g transform="translate(250, 210)">
              <circle cx="0" cy="0" r="14" fill="rgba(255,0,85,0.2)" stroke="#ff0055" stroke-width="1.5" stroke-dasharray="3 3"/>
              ${drawIsometricVehicle(0, 0, 0.6, '#ff0055')}
              <text x="-20" y="26" fill="#ff0055" font-size="8" font-family="monospace" font-weight="700">MS-12 (BLOCKED)</text>
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
      const airCarrierTxt = container.querySelector('#iso-air-carrier-txt');
      const airLossTxt = container.querySelector('#iso-air-loss-txt');

      if (mode === 'fdma') {
        btnTopFdma && btnTopFdma.classList.add('active');
        if (modeTag) modeTag.textContent = '1G FDMA (AMPS ANALOG)';
        if (hudPhy) hudPhy.textContent = 'UPLINK: 825.03 MHz | DOWNLINK: 870.03 MHz | 30 kHz CHANNELS | FM MODULATION';
        if (ms1LabelSub) ms1LabelSub.textContent = 'Tx: 825.03 MHz (Ch 1)';
        if (emWave) emWave.setAttribute('stroke', 'url(#rf-wave-grad-fdma)');
        if (airCarrierTxt) airCarrierTxt.textContent = 'fc: 825.03 MHz | λ: 36.3cm';
        if (airLossTxt) airLossTxt.textContent = '30 kHz Voice FM | L: -108 dB';
      } else if (mode === 'tdma') {
        btnTopTdma && btnTopTdma.classList.add('active');
        if (modeTag) modeTag.textContent = '2G TDMA (GSM DIGITAL)';
        if (hudPhy) hudPhy.textContent = 'CARRIER: 890.2 MHz | 200 kHz BAND | 8 TIME SLOTS (577 µs) | 0.3 GMSK 270.83 kbps';
        if (ms1LabelSub) ms1LabelSub.textContent = 'Tx: Slot 3/8 (GMSK Burst)';
        if (emWave) emWave.setAttribute('stroke', 'url(#rf-wave-grad-tdma)');
        if (airCarrierTxt) airCarrierTxt.textContent = 'fc: 890.2 MHz | Slot 3/8';
        if (airLossTxt) airLossTxt.textContent = 'GMSK 270.8 kbps | 577µs Burst';
      } else {
        btnTopCdma && btnTopCdma.classList.add('active');
        if (modeTag) modeTag.textContent = '2G/3G CDMA (IS-95 SPREAD SPECTRUM)';
        if (hudPhy) hudPhy.textContent = 'CARRIER: 1.25 MHz SPREAD | 1.2288 Mcps | WALSH W_64 CODES | SOFT HANDOFF';
        if (ms1LabelSub) ms1LabelSub.textContent = 'Tx: Walsh W_64 (1.2288 Mcps)';
        if (emWave) emWave.setAttribute('stroke', 'url(#rf-wave-grad-cdma)');
        if (airCarrierTxt) airCarrierTxt.textContent = '1.2288 Mcps | Walsh W_64';
        if (airLossTxt) airLossTxt.textContent = 'Universal Reuse N=1 | Spread';
      }

      const tdmaClockOverlay = container.querySelector('#sim-tdma-clock-overlay');
      if (tdmaClockOverlay) {
        tdmaClockOverlay.style.display = (mode === 'tdma') ? 'block' : 'none';
      }

      updateTowerCapacityDisplay();
    };

    if (btnTopFdma) btnTopFdma.addEventListener('click', () => setAccessMode('fdma'));
    if (btnTopTdma) btnTopTdma.addEventListener('click', () => setAccessMode('tdma'));
    if (btnTopCdma) btnTopCdma.addEventListener('click', () => setAccessMode('cdma'));

    // Complete 8-Stage 2-Way Round Trip Step Descriptions (Forward + Return Path)
    const stepProcedures8 = {
      fdma: [
        {
          num: 'STAGE 1 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '1. MOBILE SUBSCRIBER TRANSMISSION (AMPS FM)',
          desc: 'Mobile unit modulates voice onto dedicated 30 kHz reverse channel (825.03 MHz). The whip antenna radiates an electromagnetic wave across the air interface.',
          meta: [
            { k: 'TRANSMITTER', v: 'MS-1 Handset' },
            { k: 'CARRIER FREQ', v: '825.03 MHz (Uplink)' },
            { k: 'MODULATION', v: 'FM (12 kHz peak deviation)' },
            { k: 'CHANNEL BW', v: '30 kHz Simplex' },
            { k: 'WAVELENGTH λ', v: '36.34 cm' },
            { k: 'TX POWER', v: '+20 dBm (100 mW)' }
          ]
        },
        {
          num: 'STAGE 2 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '2. AIR PROPAGATION & TOWER RECEPTION',
          desc: 'Electromagnetic wave traverses 1.2 km of free space, suffering path loss (Hata urban model). Directional sector antenna on base station intercepts the RF wave.',
          meta: [
            { k: 'RECEIVER', v: 'BS-A Tower Mast' },
            { k: 'PATH LOSS', v: '108.4 dB (Hata Urban)' },
            { k: 'DUPLEX SPACING', v: '+45 MHz (870.03 MHz DL)' },
            { k: 'REUSE CLUSTER', v: 'N = 7' },
            { k: 'SECTORING', v: '120° Directional' },
            { k: 'DEMUX METHOD', v: 'Bandpass Filter Bank' }
          ]
        },
        {
          num: 'STAGE 3 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '3. BTS DEMODULATION & BSC TRUNK MULTIPLEXING',
          desc: 'BTS demodulates the audio and multiplexes it onto an Abis E1 digital trunk (2.048 Mbps) leading to the Base Station Controller (BSC) and MTSO.',
          meta: [
            { k: 'TRUNK INTERFACE', v: 'Abis E1 Line' },
            { k: 'VOICE CODEC', v: '64 kbps PCM per channel' },
            { k: 'CONTROLLER', v: 'BSC Switch Rack' },
            { k: 'FRAME SYNCHRONY', v: '125 µs PCM Frame' }
          ]
        },
        {
          num: 'STAGE 4 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '4. MTSO ROUTING TO PUBLIC APPLICATION SERVER',
          desc: 'MTSO verifies subscriber credentials via HLR/VLR databases, encapsulates packet into IP/GTP backbone, and delivers it to Web Server (8.8.8.8).',
          meta: [
            { k: 'SWITCH NODE', v: 'MTSO / MSC Gateway' },
            { k: 'DATABASE LOOKUP', v: 'HLR / VLR Authenticated' },
            { k: 'DESTINATION', v: '8.8.8.8 (Web/DNS Server)' },
            { k: 'STATUS', v: 'UPLINK DELIVERED' }
          ]
        },
        {
          num: 'STAGE 5 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '5. SERVER ACKNOWLEDGMENT GENERATION',
          desc: 'Application server processes request and dispatches return packet (HTTP 200 OK / DNS Response / Call Ack). The packet enters the cellular core network.',
          meta: [
            { k: 'SOURCE', v: '8.8.8.8 (Server)' },
            { k: 'PACKET TYPE', v: 'HTTP 200 OK / ACK' },
            { k: 'PAYLOAD SIZE', v: '512 Bytes' },
            { k: 'DIRECTION', v: 'DOWNLINK (Forward Channel)' }
          ]
        },
        {
          num: 'STAGE 6 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '6. MTSO & BSC DOWNLINK TRUNK FORWARDING',
          desc: 'MTSO routes the packet back through the BSC cabinet over the Abis trunk line to the target Base Station (BS-A) currently serving the mobile subscriber.',
          meta: [
            { k: 'ROUTING HOP', v: 'MTSO → BSC → BTS' },
            { k: 'TRUNK RATE', v: '2.048 Mbps E1' },
            { k: 'LATENCY', v: '< 3.2 ms Transit' }
          ]
        },
        {
          num: 'STAGE 7 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '7. TOWER FORWARD CHANNEL RF BROADCAST',
          desc: 'BS-A modulates the return packet onto the forward carrier (870.03 MHz = 825.03 + 45 MHz duplex spacing). Tower transmits high-power RF wave back to the mobile.',
          meta: [
            { k: 'TRANSMITTER', v: 'BS-A Tower (Forward Channel)' },
            { k: 'FORWARD FREQ', v: '870.03 MHz (+45 MHz Offset)' },
            { k: 'MODULATION', v: 'FM Downlink' },
            { k: 'TX POWER', v: '100 W Base Station' }
          ]
        },
        {
          num: 'STAGE 8 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '8. MOBILE CLIENT RECEIPT & ROUND TRIP COMPLETE',
          desc: 'Mobile unit antenna intercepts the forward wave, demodulates the return ACK, and flashes green. The full 2-way round trip is confirmed! (RTT: ~48.2 ms).',
          meta: [
            { k: 'CLIENT RECEIVER', v: 'MS-1 Terminal' },
            { k: 'ROUND TRIP TIME', v: '48.2 ms RTT' },
            { k: 'STATUS', v: 'FULL 2-WAY ROUND TRIP COMPLETE' }
          ]
        }
      ],
      tdma: [
        {
          num: 'STAGE 1 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '1. GSM TIME SLOT BURST (MS-1 TRANSMIT)',
          desc: 'Speech is compressed by 13 kbps RPE-LPC into 260 bits, protected by convolutional FEC, and transmitted as a 156.25-bit normal burst in Slot 3 of the 8-slot TDMA frame.',
          meta: [
            { k: 'FRAME DURATION', v: '4.615 ms (8 slots)' },
            { k: 'TIME SLOT', v: 'Slot 3 (577 µs duration)' },
            { k: 'MODULATION', v: '0.3 GMSK at 270.833 kbps' },
            { k: 'CARRIER BW', v: '200 kHz' }
          ]
        },
        {
          num: 'STAGE 2 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '2. AIR PROPAGATION & BURST RECEPTION',
          desc: '577 µs burst propagates over air. The 26-bit midamble training sequence allows the tower equalizer to compensate for multipath delay spread.',
          meta: [
            { k: 'EQUALIZER', v: 'Adaptive Linear Tap Filter' },
            { k: 'TRAINING SEQ', v: '26 bits known pattern' },
            { k: 'TIMING ADVANCE', v: 'Synchronized (0..63 steps)' }
          ]
        },
        {
          num: 'STAGE 3 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '3. BTS DEMODULATION & BSC PACKETIZATION',
          desc: 'BTS recovers speech bits, de-interleaves across 8 bursts, and sends frame over Abis interface to the Base Station Controller.',
          meta: [
            { k: 'ABIS TRUNK', v: 'E1 Link (2.048 Mbps)' },
            { k: 'FEC DECODE', v: 'Convolutional (2,1,5)' }
          ]
        },
        {
          num: 'STAGE 4 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '4. MSC SWITCHING & PUBLIC DELIVERY',
          desc: 'Speech is decrypted with A5 stream cipher. For data, SGSN/GGSN tunnels IP datagram through GPRS core to destination web host.',
          meta: [
            { k: 'SECURITY', v: 'A5 Cipher Decrypted' },
            { k: 'DESTINATION', v: '8.8.8.8 (Web Server)' }
          ]
        },
        {
          num: 'STAGE 5 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '5. SERVER DISPATCHES RETURN PACKET',
          desc: 'Server responds with HTTP 200 OK / DNS Response. Packet enters GGSN cellular gateway to begin downlink return transit.',
          meta: [
            { k: 'PACKET', v: 'HTTP 200 OK (ACK)' },
            { k: 'CORE GATEWAY', v: 'GGSN / MSC' }
          ]
        },
        {
          num: 'STAGE 6 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '6. CORE & BSC DOWNLINK SCHEDULING',
          desc: 'BSC schedules the response packet into the downlink TDMA frame slot assigned to MS-1 on the 935–960 MHz base transmission band.',
          meta: [
            { k: 'DOWNLINK BAND', v: '935.2 MHz (+45 MHz)' },
            { k: 'SCHEDULING', v: 'Slot 3 Allocated' }
          ]
        },
        {
          num: 'STAGE 7 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '7. BTS DOWNLINK BURST TRANSMISSION',
          desc: 'BTS transmits encrypted 156.25-bit normal burst during Slot 3 of the forward frame. Wave propagates back across the air interface.',
          meta: [
            { k: 'BURST TYPE', v: 'Downlink Normal Burst' },
            { k: 'MODULATION', v: '0.3 GMSK 270.83 kbps' }
          ]
        },
        {
          num: 'STAGE 8 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '8. MOBILE HANDSET RECEIPT & ACK DISPLAY',
          desc: 'Mobile handset receives burst, deciphers with A5 key, and confirms delivery with green status. Full 2-way GSM round trip finished!',
          meta: [
            { k: 'CLIENT RECEIPT', v: 'MS-1 Acknowledged' },
            { k: 'GSM RTT', v: '58.4 ms RTT' }
          ]
        }
      ],
      cdma: [
        {
          num: 'STAGE 1 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '1. CDMA DIRECT SEQUENCE SPREADING',
          desc: 'Data bits are multiplied by orthogonal 64-chip Walsh code (W₆₄) at 1.2288 Mcps. Signal spreads across entire 1.25 MHz carrier simultaneously with all users.',
          meta: [
            { k: 'CHIP RATE', v: '1.2288 Mcps (64 chips/symbol)' },
            { k: 'SPREADING CODE', v: 'Walsh W_64' },
            { k: 'CHANNEL BW', v: '1.25 MHz' }
          ]
        },
        {
          num: 'STAGE 2 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '2. AIR PROPAGATION & RAKE FINGER COMBINING',
          desc: 'Tower RAKE receiver uses 3 correlator fingers (τ₁, τ₂, τ₃) to resolve delayed multipath reflections and performs maximal ratio combining.',
          meta: [
            { k: 'RAKE FINGERS', v: '3 Multipath Resolvers' },
            { k: 'DIVERSITY GAIN', v: '+3 dB Eb/N0 Gain' }
          ]
        },
        {
          num: 'STAGE 3 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '3. BTS DESPREADING & RNC MACRO DIVERSITY',
          desc: 'BTS recovers user bit stream and forwards to RNC. If in soft handoff, RNC compares frames from multiple base stations and selects highest quality.',
          meta: [
            { k: 'HANDOFF', v: 'Soft Handoff (Make-Before-Break)' },
            { k: 'BACKHAUL', v: 'Iub ATM / IP Trunk' }
          ]
        },
        {
          num: 'STAGE 4 OF 8',
          dir: '⬆️ UPLINK DIRECTION',
          title: '4. PACKET CORE ROUTING TO SERVER',
          desc: 'Packet Data Serving Node (PDSN) decapsulates IP datagram and routes it over public Internet backbone to server (8.8.8.8).',
          meta: [
            { k: 'CORE NODE', v: 'PDSN / Packet Gateway' },
            { k: 'DESTINATION', v: '8.8.8.8 (Web Server)' }
          ]
        },
        {
          num: 'STAGE 5 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '5. SERVER ACK DISPATCHED',
          desc: 'Web server returns response packet. PDSN tunnels packet to target RNC for forward link transmission.',
          meta: [
            { k: 'PACKET', v: 'HTTP 200 OK / DNS Response' },
            { k: 'ROUTE', v: 'Internet → PDSN → RNC' }
          ]
        },
        {
          num: 'STAGE 6 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '6. RNC TO BTS FORWARD CHANNEL ASSIGNMENT',
          desc: 'RNC transmits packet to BTS. BTS maps data to the forward traffic channel using Walsh channelization code and long code scrambling mask.',
          meta: [
            { k: 'FORWARD CH', v: 'Walsh Channel 8..63' },
            { k: 'POWER CONTROL', v: '800 bps Punctured Bits' }
          ]
        },
        {
          num: 'STAGE 7 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '7. BTS FORWARD LINK SPREAD BROADCAST',
          desc: 'Tower broadcasts QPSK modulated spread spectrum wave on forward carrier. All users receive on same 1.25 MHz band without frequency slicing.',
          meta: [
            { k: 'DOWNLINK BAND', v: '1.25 MHz Spread Carrier' },
            { k: 'PILOT CH', v: 'Ch 0 (Timing & Phase Ref)' }
          ]
        },
        {
          num: 'STAGE 8 OF 8',
          dir: '⬇️ DOWNLINK RETURN PATH',
          title: '8. MOBILE RAKE RECEIPT & ORTHOGONAL RECOVERY',
          desc: 'Mobile handset despreads forward link using its assigned Walsh code, cancels other users via code orthogonality, and confirms round trip complete!',
          meta: [
            { k: 'ORTHOGONALITY', v: '⟨W_i, W_j⟩ = 0' },
            { k: 'CDMA RTT', v: '44.6 ms RTT' }
          ]
        }
      ]
    };

    const updateStepDetailCard = (stage) => {
      const mode = ch10State.accessMode;
      const list = stepProcedures8[mode] || stepProcedures8.fdma;
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

    // Camera Auto-Follow Interpolation for Full 8-Stage 2-Way Round Trip
    const updateCameraAutoFollow = (progress8) => {
      if (!ch10State.autoCamera || !isoSvg) return;

      let target;
      if (progress8 < 1.0) {
        // Stage 1: Zoom on Client MS-1 (Uplink preparation)
        target = cameraTargets.client;
      } else if (progress8 < 2.5) {
        // Stage 2 & 3: Air Interface & Tower (Uplink transit)
        const t = (progress8 - 1.0) / 1.5;
        target = {
          vx: 0 + t * 180,
          vy: 80 - t * 45,
          vw: 400 + t * 100,
          vh: 240 + t * 20,
          label: `AIR LINK UPLINK (${(t*100).toFixed(0)}%)`,
          icon: '📡'
        };
      } else if (progress8 < 4.0) {
        // Stage 3 & 4: Core & Server (Reaching destination)
        target = cameraTargets.core;
      } else if (progress8 < 5.0) {
        // Stage 5: Server ACK Generation
        target = cameraTargets.core;
      } else if (progress8 < 6.5) {
        // Stage 6 & 7: Return transit to Tower
        const t = (progress8 - 5.0) / 1.5;
        target = {
          vx: 480 - t * 300,
          vy: 55 - t * 20,
          vw: 460 - t * 80,
          vh: 250 - t * 10,
          label: `DOWNLINK TRANSIT (${(t*100).toFixed(0)}%)`,
          icon: '🗼'
        };
      } else {
        // Stage 8: Back to Client Handset (ACK Delivered!)
        target = cameraTargets.client;
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
    // DEDICATED INDEPENDENT 2-WAY ROUND TRIP ANIMATION LOOP
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

      // 8 full stages over 10.0 seconds (5s forward uplink, 5s return downlink)
      const cycleDuration = 10.0;
      const progress8 = ch10State.manualStep >= 0
        ? (ch10State.manualStep + 0.5)
        : ((time % cycleDuration) / cycleDuration) * 8.0; // 0.0 to 8.0
      
      const currentStage = Math.min(7, Math.floor(progress8));
      const subT = ch10State.manualStep >= 0 ? 0.5 : (progress8 - currentStage);

      // 1. Update Camera
      updateCameraAutoFollow(progress8);

      // 2. Oscillate Electromagnetic Sine Waves across Air Interface
      const emWaveUplink = container.querySelector('#iso-em-carrier-wave');
      const emWaveDownlink = container.querySelector('#iso-em-downlink-wave');

      if (emWaveUplink) {
        const isUplinkActive = currentStage <= 2;
        emWaveUplink.setAttribute('opacity', isUplinkActive ? '0.85' : '0.2');
        const waveStartX = 130;
        const waveEndX = 380;
        const waveY = 195;
        const waveFreq = mode === 'cdma' ? 24 : mode === 'tdma' ? 16 : 10;
        const wavePhase = time * 14 * speed;
        let waveD = `M ${waveStartX} ${waveY}`;
        const steps = 36;
        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const wx = waveStartX + frac * (waveEndX - waveStartX);
          const atten = 1 - frac * 0.35;
          const wy = waveY + Math.sin(frac * waveFreq * Math.PI * 2 - wavePhase) * (14 * atten);
          waveD += ` L ${wx.toFixed(1)} ${wy.toFixed(1)}`;
        }
        emWaveUplink.setAttribute('d', waveD);
      }

      if (emWaveDownlink) {
        const isDownlinkActive = currentStage >= 6;
        emWaveDownlink.setAttribute('opacity', isDownlinkActive ? '0.85' : '0');
        if (isDownlinkActive) {
          const waveStartX = 380;
          const waveEndX = 130;
          const waveY = 185;
          const wavePhase = -time * 14 * speed;
          let waveD = `M ${waveStartX} ${waveY}`;
          const steps = 36;
          for (let s = 0; s <= steps; s++) {
            const frac = s / steps;
            const wx = waveStartX - frac * (waveStartX - waveEndX);
            const wy = waveY + Math.sin(frac * 12 * Math.PI * 2 - wavePhase) * 12;
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
        clientPulse.setAttribute('opacity', (currentStage === 0 || currentStage === 7) ? pOp * 0.85 : 0.15);

        const pR2 = 14 + ((time * 24 * speed + 14) % 40);
        const pOp2 = Math.max(0, 1 - (pR2 / 50));
        clientPulse2.setAttribute('r', pR2);
        clientPulse2.setAttribute('opacity', (currentStage === 0 || currentStage === 7) ? pOp2 * 0.6 : 0.1);

        if (currentStage === 1 || currentStage === 2 || currentStage === 6) {
          const bsR = 12 + ((time * 20 * speed) % 35);
          bsPulse.setAttribute('r', bsR);
          bsPulse.setAttribute('opacity', Math.max(0, 1 - bsR / 45));
        } else {
          bsPulse.setAttribute('opacity', 0);
        }
      }

      // 4. Move Packets: Forward Uplink (Stages 0..3) & Return Downlink ACK (Stages 4..7)
      const isoBubbleUplink = container.querySelector('#iso-pkt-bubble');
      const isoTextUplink = container.querySelector('#iso-pkt-text');
      const isoPktAck = container.querySelector('#iso-animated-packet-ack');
      const isoBubbleAck = container.querySelector('#iso-pkt-bubble-ack');
      const isoTextAck = container.querySelector('#iso-pkt-text-ack');
      const isoBubble2 = container.querySelector('#iso-animated-packet-2');
      const isoText2 = container.querySelector('#iso-pkt-text-2');

      // Forward Uplink Packet Movement
      if (isoBubbleUplink && isoTextUplink) {
        if (currentStage < 4) {
          isoBubbleUplink.setAttribute('opacity', 1);
          isoTextUplink.setAttribute('opacity', 1);

          let px = 130, py = 190, label = 'UPLINK RF BURST', color = '#00e5ff', bw = 125;

          if (currentStage === 0 || currentStage === 1) {
            // Stage 0 & 1: Client to Base Station across Air Interface
            const airFrac = (currentStage === 0) ? (subT * 0.5) : (0.5 + subT * 0.5);
            px = 130 + airFrac * (380 - 130);
            py = 190 + airFrac * (120 - 190) + Math.sin(airFrac * Math.PI) * -18;
            label = mode === 'fdma' ? 'UPLINK: f₁ 825.03M' : mode === 'tdma' ? 'UPLINK: SLOT 3/8' : 'UPLINK: W_64 1.2288M';
            color = mode === 'fdma' ? '#0070f3' : mode === 'tdma' ? '#00ff9d' : '#ff0055';
          } else if (currentStage === 2) {
            // Stage 2: Base Station to BSC (Abis wire)
            px = 380 + subT * (560 - 380);
            py = 210;
            label = mode === 'cdma' ? 'Iub ATM CELL' : 'Abis E1 TDM FRAME';
            color = '#38bdf8';
          } else {
            // Stage 3: BSC to MTSO Core Cloud to Web Server
            px = 560 + subT * (880 - 560);
            py = 210 + subT * (205 - 210);
            label = 'GTP-U / IP PDU';
            color = '#ffb703';
          }

          isoBubbleUplink.setAttribute('x', px - bw / 2);
          isoBubbleUplink.setAttribute('y', py - 12);
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

      // Return Downlink ACK Packet Movement (Stages 4..7)
      if (isoPktAck && isoBubbleAck && isoTextAck) {
        if (currentStage >= 4) {
          isoPktAck.setAttribute('opacity', 1);
          let ackX = 880, ackY = 205, ackLabel = 'DOWNLINK ACK', ackBw = 125;

          if (currentStage === 4) {
            // Stage 4: Server creates response
            ackX = 880 - subT * (880 - 730);
            ackY = 205 - subT * (205 - 170);
            ackLabel = 'HTTP 200 OK (ACK)';
          } else if (currentStage === 5) {
            // Stage 5: Core Cloud to BSC
            ackX = 730 - subT * (730 - 560);
            ackY = 170 + subT * (210 - 170);
            ackLabel = 'IP DOWNLINK PDU';
          } else if (currentStage === 6) {
            // Stage 6: BSC to BTS Tower
            ackX = 560 - subT * (560 - 380);
            ackY = 210;
            ackLabel = 'Abis FORWARD FRAME';
          } else {
            // Stage 7: BTS Tower to Mobile Client across air interface!
            ackX = 380 - subT * (380 - 130);
            ackY = 120 + subT * (190 - 120);
            ackLabel = mode === 'fdma' ? 'DL: 870.03 MHz (+45M)' : mode === 'tdma' ? 'DL: GSM SLOT 3' : 'DL: CDMA FORWARD W_64';
          }

          isoBubbleAck.setAttribute('x', ackX - ackBw / 2);
          isoBubbleAck.setAttribute('y', ackY - 12);
          isoBubbleAck.setAttribute('width', ackBw);
          isoTextAck.setAttribute('x', ackX - ackBw / 2 + 8);
          isoTextAck.setAttribute('y', ackY + 4);
          isoTextAck.textContent = ackLabel;
        } else {
          isoPktAck.setAttribute('opacity', 0);
        }
      }

      // Secondary Multi-User Packet (when count >= 4)
      if (isoBubble2 && isoText2) {
        if (count >= 4 && currentStage < 4) {
          isoBubble2.setAttribute('opacity', 1);
          let p2x = 70 + subT * (380 - 70);
          let p2y = 130 + subT * (120 - 130);
          isoBubble2.querySelector('rect').setAttribute('x', p2x - 55);
          isoBubble2.querySelector('rect').setAttribute('y', p2y - 11);
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

      // Update TDMA 8-Slot Frame Clock HUD when in TDMA mode
      if (mode === 'tdma') {
        const tdmaSlotsGrid = container.querySelector('#sim-tdma-slots-hud-grid');
        const tdmaActiveTxt = container.querySelector('#sim-tdma-active-slot-txt');
        if (tdmaSlotsGrid && tdmaActiveTxt) {
          const activeSlot = Math.floor((time * 4) % 8);
          const slotLabels = ['MS-1 (Voice)', 'Guard / Rx', 'MS-2 (Phone)', 'MS-3 (Laptop)', 'MS-4 (Vehicular)', 'Free Slot', 'Free Slot', 'Control (BCCH)'];
          tdmaActiveTxt.textContent = `Active Time Slot: TS ${activeSlot}/7 — ${slotLabels[activeSlot]} (577 µs Tx Window | Frame 4.615 ms)`;
          let html = '';
          for (let s = 0; s < 8; s++) {
            const isCur = s === activeSlot;
            const isMs1 = s === 0;
            const bg = isCur ? 'rgba(0, 255, 157, 0.28)' : isMs1 ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)';
            const bdr = isCur ? '#00ff9d' : isMs1 ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)';
            const col = isCur ? '#00ff9d' : isMs1 ? 'var(--accent-cyan)' : 'var(--text-dim)';
            html += `
              <div style="background: ${bg}; border: 1px solid ${bdr}; border-radius: 4px; padding: 3px 4px; text-align: center; font-size: 0.65rem; transition: all 0.08s;">
                <div style="font-weight: 700; color: ${col};">TS ${s}</div>
                <div style="font-size: 0.58rem; color: ${isCur ? '#fff' : 'var(--text-muted)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${isCur ? '▶ TX BURST' : slotLabels[s]}
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
        [btnCamWide, btnCamClient, btnCamAir, btnCamTower, btnCamCore].forEach(b => b && b.classList.remove('active'));
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
        ch10State.manualStep = (ch10State.manualStep + 1) % 8;
        updateStepDetailCard(ch10State.manualStep);
        if (ch10State.autoCamera) {
          updateCameraAutoFollow(ch10State.manualStep + 0.5);
        }
      });
    }

    setAccessMode(ch10State.accessMode);
    setDeviceCount(ch10State.activeDevicesCount);
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
    const btnZin = container.querySelector('#btn-hex-zin');
    const btnZout = container.querySelector('#btn-hex-zout');
    const btnCenter = container.querySelector('#btn-hex-center');
    const btnReset = container.querySelector('#btn-hex-reset');

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

      // Determine visible cell range based on viewport dimensions
      const rangeQ = Math.ceil(width / (rPx * 1.5)) + 2;
      const rangeR = Math.ceil(height / (rPx * 1.5)) + 2;

      // Draw all hexagons
      for (let q = -rangeQ; q <= rangeQ; q++) {
        for (let r = -rangeR; r <= rangeR; r++) {
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

      // Update dropdown selection if matching preset
      if (selN) {
        const matchingOpt = Array.from(selN.options).find(opt => Number(opt.value) === N);
        if (matchingOpt) selN.value = String(N);
      }

      drawHexGrid();
    };

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
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        ch10State.gridPanX = 0;
        ch10State.gridPanY = 0;
        ch10State.gridZoom = 1.0;
        drawHexGrid();
      });
    }

    // Interactive mouse drag to pan on the canvas
    if (canvas && canvasWrapper) {
      canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartPanX = ch10State.gridPanX;
        dragStartPanY = ch10State.gridPanY;
        canvasWrapper.classList.add('is-panning');
      });

      window.addEventListener('mousemove', (e) => {
        if (isDragging) {
          const dx = e.clientX - dragStartX;
          const dy = e.clientY - dragStartY;
          ch10State.gridPanX = dragStartPanX + dx;
          ch10State.gridPanY = dragStartPanY + dy;
          drawHexGrid();
        }

        // Hover coordinates calculation
        if (canvas) {
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
              hoverInfo.textContent = isOrigin
                ? `Reference Cell A (0, 0) | Group 1`
                : isCochannel
                ? `Cochannel Cell A (${rx}, ${ry}) | Reused Group 1`
                : `Cell (${rx}, ${ry}) | Frequency Group ${clusterId} of ${ch10State.reuseN}`;
            }
          }
        }
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          canvasWrapper.classList.remove('is-panning');
        }
      });

      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        ch10State.gridZoom = Math.max(0.35, Math.min(3.5, ch10State.gridZoom * factor));
        drawHexGrid();
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
