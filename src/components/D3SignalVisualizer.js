/**
 * SignalLab — D3.js Signal Visualization & Control Systems Suite
 * Provides dynamic vector plotting of basic waveforms (sine, square),
 * digital modulation schemes (ASK, FSK, PSK, QPSK),
 * real-time Signal-to-Noise Ratio (SNR) meter overlay,
 * Rayleigh / Rician multipath fading models,
 * trackable wave velocity controls,
 * and comprehensive Open-Loop & Closed-Loop Control System simulations
 * based on William Stallings "Wireless Communications and Networks", Chapters 2, 5, 6 & 10.
 */

import * as d3 from 'd3';
import { formatFrequency } from '../utils/formatters.js';

export class D3SignalVisualizer {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.options = options;

    // Simulation, waveform & channel propagation state
    this.state = {
      activeTab: 'oscilloscope', // 'oscilloscope' | 'open_loop' | 'closed_loop'
      playbackSpeed: 0.08, // Default smooth, human-trackable wave drift speed

      // Waveform Oscilloscope parameters
      scheme: 'SINE', // 'SINE' | 'SQUARE' | 'ASK' | 'FSK' | 'PSK' | 'QPSK'
      freqHz: 2000, // Signal / Carrier frequency in Hz (display scale)
      amplitudeV: 2.5, // Peak amplitude in Volts
      bitRateBps: 500, // Digital modulating bit rate in bps
      fskDevHz: 1200, // Frequency deviation for FSK
      askMinRatio: 0.2, // Amplitude ratio for '0' bit in ASK
      harmonics: 15, // Fourier odd harmonics for Square wave
      
      // Fading & Channel Impairments (Stallings Ch. 5.3 & 5.4)
      fadingModel: 'none', // 'none' | 'rayleigh' | 'rician'
      ricianK_dB: 6.0, // Rician K-factor in dB
      dopplerHz: 12.0, // Fading / Doppler rate in Hz
      distanceKm: 2.0, // Propagation distance for path loss
      multipathSpreadMs: 0.6, // Multipath delay spread in ms
      enableMultipathEcho: true, // Secondary delayed ray interference
      noiseFloorV: 0.2, // Channel background noise density

      // Calculated Real-Time Metrics
      snrDb: 22.5,
      signalPowerMw: 31.2,
      noisePowerUw: 1.8,
      shannonCapacityKbps: 45.2,

      bitPattern: [1, 0, 1, 1, 0, 1, 0, 0], // 8-bit test pattern
      timeWindowSec: 0.016, // Visible time window (~16 ms = 8 bits at 500 bps)
      isPlaying: true,
      timeOffsetSec: 0,
      cursorTimeSec: null,
      viewMode: 'split', // 'split' | 'single'

      // ─────────────────────────────────────────────────────────────────────────
      // Open-Loop Control System State (Stallings pp. 276–277)
      // ─────────────────────────────────────────────────────────────────────────
      openLoop: {
        distanceKm: 3.5,
        pilotTxPowerDbm: 40.0,
        obstacleShadowDb: 0.0,
        uplinkInterferenceDb: 0.0,
        mobileTxPowerDbm: 20.0,
        receivedPowerAtBsDbm: -89.8,
        pulseOffset: 0.0
      },

      // ─────────────────────────────────────────────────────────────────────────
      // Closed-Loop Feedback Control System State (Stallings pp. 276–277)
      // ─────────────────────────────────────────────────────────────────────────
      closedLoop: {
        setpointDbm: -90.0,
        distanceKm: 3.5,
        fadingDropDb: 0.0,
        dopplerJitterActive: false,
        stepRateHz: 1600, // 800 or 1600 Hz
        stepSizeDb: 1.0,
        mobileTxPowerDbm: 20.0,
        actualRxPowerDbm: -89.8,
        errorDb: 0.2,
        lastCommand: 'HOLD', // '▲ +1 dB' | '▼ -1 dB' | 'HOLD'
        errorHistory: Array.from({ length: 40 }, () => 0.0),
        cmdPulseOffset: 0.0,
        trafficPulseOffset: 0.0,
        simClock: 0.0
      },

      // ─────────────────────────────────────────────────────────────────────────
      // CDMA Spreading & RAKE Receiver State (Stallings Ch. 10.4 pp. 298–304)
      // ─────────────────────────────────────────────────────────────────────────
      cdmaRake: {
        user1Bit: 1, // +1 or -1
        user2Bit: -1, // +1 or -1
        user3Bit: 1, // +1 or -1
        targetUser: 1, // 1 | 2 | 3
        mrcEnabled: true,
        tau2Chips: 1.5,
        tau3Chips: 3.0,
        gain1: 1.0,
        gain2: 0.72,
        gain3: 0.48,
        deepFadeActive: false,
        pulseOffset: 0.0,
        simClock: 0.0
      }
    };

    this.svgWidth = 840;
    this.svgHeight = 320;
    this.margin = { top: 28, right: 30, bottom: 40, left: 60 };

    this.animId = null;
    this.lastTimestamp = performance.now();

    // Multipath ray phases for consistent Doppler generation (Jakes model approximation)
    this.rayPhases = Array.from({ length: 8 }, () => Math.random() * Math.PI * 2);
    this.rayAngles = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 8);

    this.render();
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="d3-visualizer-card">
        <!-- Top Title & Telemetry Header -->
        <div class="d3-vis-header">
          <div class="d3-vis-title-group">
            <div class="d3-vis-badge">D3.JS VECTOR RF & CONTROL ENGINE</div>
            <h3 class="d3-vis-title" id="d3-vis-title-text">SIGNAL WAVEFORM ANALYZER & CONTROL SYSTEMS SUITE</h3>
          </div>
          <div class="d3-vis-telemetry" id="d3-vis-telemetry-strip">
            <span class="d3-tel-pill" id="tel-mode-pill">MODE: SINE WAVE</span>
            <span class="d3-tel-pill" id="tel-speed-pill" style="border-color: rgba(0, 255, 157, 0.4); color: #00ff9d;">SPEED: 0.08× (TRACKABLE)</span>
            <span class="d3-tel-pill" id="tel-fading-pill" style="border-color: rgba(255,183,3,0.4); color: #ffb703;">CHANNEL: NO FADE</span>
            <span class="d3-tel-pill" id="tel-snr-pill" style="border-color: #00ff9d; color: #00ff9d;">SNR: 22.5 dB</span>
          </div>
        </div>

        <!-- Suite Subsystem Mode Selector Navigation Tabs -->
        <div style="display: flex; gap: 8px; margin: 10px 0 14px 0; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; flex-wrap: wrap;">
          <button class="lesson-tab-btn ${this.state.activeTab === 'oscilloscope' ? 'active' : ''}" id="btn-tab-scope" style="font-size: 0.78rem; padding: 6px 14px;">
            ∿ 1. Oscilloscope & Waveform Modulation
          </button>
          <button class="lesson-tab-btn ${this.state.activeTab === 'open_loop' ? 'active' : ''}" id="btn-tab-openloop" style="font-size: 0.78rem; padding: 6px 14px;">
            🔄 2. Open-Loop Control System (No Feedback)
          </button>
          <button class="lesson-tab-btn ${this.state.activeTab === 'closed_loop' ? 'active' : ''}" id="btn-tab-closedloop" style="font-size: 0.78rem; padding: 6px 14px;">
            🔁 3. Closed-Loop Feedback Control System (Error Feedback)
          </button>
          <button class="lesson-tab-btn ${this.state.activeTab === 'cdma_rake' ? 'active' : ''}" id="btn-tab-cdmarake" style="font-size: 0.78rem; padding: 6px 14px;">
            📡 4. CDMA Walsh Code Spreading & RAKE Receiver (Chapter 10)
          </button>
        </div>

        <!-- VIEW 1: OSCILLOSCOPE & MODULATION LAB -->
        <div id="view-scope-container" style="${this.state.activeTab === 'oscilloscope' ? 'display: block;' : 'display: none;'}">
          <!-- D3 SVG Viewport Screen -->
          <div class="d3-vis-viewport" id="d3-svg-host"></div>

          <!-- Waveform Crosshair / Hover Readout -->
          <div class="d3-cursor-bar" id="d3-cursor-bar">
            <span style="color: var(--text-dim);">CROSSHAIR:</span>
            <span id="d3-cursor-time" style="color: var(--accent-cyan); font-weight: 700;">t = --.--- ms</span>
            <span style="color: var(--text-dim); margin: 0 4px;">|</span>
            <span id="d3-cursor-volt" style="color: #00ff9d; font-weight: 700;">v(t) = --.-- V</span>
            <span style="color: var(--text-dim); margin: 0 4px;">|</span>
            <span id="d3-cursor-fade" style="color: #ffb703; font-weight: 700;">Fading Env r(t): 1.00</span>
            <span style="color: var(--text-dim); margin: 0 4px;">|</span>
            <span id="d3-cursor-bit" style="color: var(--accent-sky); font-weight: 700;">Bit: --</span>
            <span style="margin-left: auto; color: var(--text-dim); font-size: 0.72rem;">Interactive D3 SVG canvas with live SNR meter & multipath fading envelope</span>
          </div>

          <!-- Interactive Control Panel for Waveforms & Modulation Schemes -->
          <div class="d3-controls-panel">
            <!-- Row 0: Wave Velocity & Motion Tracking Toolbar (Human-Trackable Speed Control) -->
            <div class="d3-ctrl-section" style="background: rgba(3, 7, 18, 0.75); border: 1px solid rgba(0, 229, 255, 0.25); border-radius: 6px; padding: 10px 14px; margin-bottom: 12px;">
              <div class="d3-ctrl-section-title" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--accent-cyan); font-weight: 700;">⏱️ WAVE VELOCITY & TRACKING SPEED (SLOW MOTION FOR VISUAL TRACKABILITY)</span>
                <span id="lbl-speed-val" style="color: #00ff9d; font-family: var(--font-mono); font-size: 0.74rem; font-weight: 700;">0.08× Smooth Trackable Motion</span>
              </div>
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 6px;">
                <button class="btn-ctrl" data-speed="0.03" id="btn-spd-003">🐢 0.03× Slow-Mo</button>
                <button class="btn-ctrl active" data-speed="0.08" id="btn-spd-008">👁️ 0.08× Trackable (Default)</button>
                <button class="btn-ctrl" data-speed="0.20" id="btn-spd-020">⚡ 0.20× Normal Pace</button>
                <button class="btn-ctrl" data-speed="0.50" id="btn-spd-050">🚀 0.50× Fast Wave</button>
                <div style="display: flex; align-items: center; gap: 8px; margin-left: auto; font-family: var(--font-mono); font-size: 0.72rem;">
                  <span style="color: var(--text-dim);">FINE TUNE SPEED:</span>
                  <input type="range" class="control-slider" id="slider-wave-speed" min="0.01" max="0.50" step="0.01" value="0.08" style="width: 140px;"/>
                </div>
              </div>
            </div>

            <!-- Row 1: Scheme Selector Buttons -->
            <div class="d3-ctrl-section">
              <div class="d3-ctrl-section-title">
                <span>WAVEFORM & MODULATION SCHEME (STALLINGS CH. 2 & CH. 6)</span>
                <span id="d3-scheme-desc" style="color: var(--accent-sky); font-weight: normal; font-size: 0.7rem;">Unmodulated Continuous Harmonic Wave</span>
              </div>
              <div class="d3-btn-group" id="d3-scheme-buttons">
                <button class="d3-scheme-btn active" data-scheme="SINE">
                  <span class="d3-btn-icon">∿</span> SINE WAVE
                </button>
                <button class="d3-scheme-btn" data-scheme="SQUARE">
                  <span class="d3-btn-icon">⊓</span> SQUARE WAVE
                </button>
                <button class="d3-scheme-btn" data-scheme="ASK">
                  <span class="d3-btn-icon">📶</span> ASK (AMPLITUDE SHIFT)
                </button>
                <button class="d3-scheme-btn" data-scheme="FSK">
                  <span class="d3-btn-icon">🎛️</span> FSK (FREQUENCY SHIFT)
                </button>
                <button class="d3-scheme-btn" data-scheme="PSK">
                  <span class="d3-btn-icon">🔄</span> PSK / BPSK (PHASE SHIFT)
                </button>
                <button class="d3-scheme-btn" data-scheme="QPSK">
                  <span class="d3-btn-icon">💠</span> QPSK (4-PHASE)
                </button>
              </div>
            </div>

            <!-- Row 2: Signal Parameters Sliders -->
            <div class="d3-sliders-grid">
              <!-- Carrier / Base Frequency Slider -->
              <div class="d3-slider-item">
                <div class="d3-slider-label">
                  <span id="lbl-freq-title">CARRIER FREQUENCY (fc)</span>
                  <span class="d3-slider-val" id="val-freq">2.00 kHz</span>
                </div>
                <input type="range" class="control-slider" id="slider-freq" min="500" max="8000" step="100" value="2000" />
                <div class="d3-slider-ticks">
                  <span>500 Hz</span>
                  <span>2 kHz</span>
                  <span>4 kHz</span>
                  <span>8 kHz</span>
                </div>
              </div>

              <!-- Peak Amplitude Slider -->
              <div class="d3-slider-item">
                <div class="d3-slider-label">
                  <span>PEAK AMPLITUDE (Vpk)</span>
                  <span class="d3-slider-val" id="val-amp">2.50 V</span>
                </div>
                <input type="range" class="control-slider" id="slider-amp" min="0.5" max="5.0" step="0.1" value="2.5" />
                <div class="d3-slider-ticks">
                  <span>0.5 V</span>
                  <span>2.5 V</span>
                  <span>5.0 V</span>
                </div>
              </div>

              <!-- Bit Rate / Symbol Rate Slider -->
              <div class="d3-slider-item" id="slider-box-bitrate">
                <div class="d3-slider-label">
                  <span>BIT RATE (Rb = 1/Tb)</span>
                  <span class="d3-slider-val" id="val-bitrate">500 bps (Tb = 2.0 ms)</span>
                </div>
                <input type="range" class="control-slider" id="slider-bitrate" min="125" max="1000" step="125" value="500" />
                <div class="d3-slider-ticks">
                  <span>125 bps</span>
                  <span>250 bps</span>
                  <span>500 bps</span>
                  <span>1 kbps</span>
                </div>
              </div>

              <!-- Contextual 4th Slider: FSK Deviation or ASK Depth -->
              <div class="d3-slider-item" id="slider-box-context">
                <div class="d3-slider-label">
                  <span id="lbl-context-title">FSK DEVIATION (Δf)</span>
                  <span class="d3-slider-val" id="val-context">1.20 kHz</span>
                </div>
                <input type="range" class="control-slider" id="slider-context" min="200" max="2500" step="100" value="1200" />
                <div class="d3-slider-ticks" id="ticks-context">
                  <span>200 Hz</span>
                  <span>1.2 kHz</span>
                  <span>2.5 kHz</span>
                </div>
              </div>
            </div>

            <!-- Row 3: Signal Fading & Multipath Propagation Controls (Stallings Ch. 5.4) -->
            <div class="d3-ctrl-section" style="background: rgba(3, 7, 18, 0.7); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px 14px;">
              <div class="d3-ctrl-section-title">
                <span style="color: #ffb703;">📡 MULTIPATH SIGNAL FADING MODEL (STALLINGS §5.4 PP. 115–122)</span>
                <span id="fading-model-indicator" style="color: var(--accent-cyan); font-size: 0.72rem;">AWGN Channel: Pure Direct Path</span>
              </div>

              <!-- Fading Mode Toggle Buttons -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                <button class="d3-fading-btn active" data-fading="none" title="Additive White Gaussian Noise only, no fading">
                  🟢 AWGN (NO FADE)
                </button>
                <button class="d3-fading-btn" data-fading="rayleigh" title="Rayleigh Fading: No dominant LOS path; rich multipath urban scatter (Stallings p. 118)">
                  🌊 RAYLEIGH FADING (NLOS MULTIPATH)
                </button>
                <button class="d3-fading-btn" data-fading="rician" title="Rician Fading: Dominant Line-of-Sight component + scattered multipath rays (Stallings p. 118)">
                  📡 RICIAN FADING (DOMINANT LOS)
                </button>
                <button class="btn-ctrl" id="btn-toggle-multipath" style="margin-left: auto; font-size: 0.72rem; padding: 4px 10px;">
                  ECHO RAY: <span id="multipath-echo-status" style="color: var(--status-ready); font-weight: 700;">ON</span>
                </button>
              </div>

              <!-- Fading Sliders Grid -->
              <div class="d3-sliders-grid" style="grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));">
                <!-- Rician K-Factor Slider -->
                <div class="d3-slider-item" id="slider-box-rician-k">
                  <div class="d3-slider-label">
                    <span>RICIAN K-FACTOR</span>
                    <span class="d3-slider-val" id="val-rician-k">6.0 dB (K = 4.0)</span>
                  </div>
                  <input type="range" class="control-slider" id="slider-rician-k" min="0" max="18" step="1" value="6" />
                  <div class="d3-slider-ticks">
                    <span>0 dB (Rayleigh)</span>
                    <span>6 dB</span>
                    <span>18 dB (LOS)</span>
                  </div>
                </div>

                <!-- Doppler Spread / Vehicle Speed -->
                <div class="d3-slider-item">
                  <div class="d3-slider-label">
                    <span>DOPPLER SPREAD (fd)</span>
                    <span class="d3-slider-val" id="val-doppler">12.0 Hz (~40 km/h)</span>
                  </div>
                  <input type="range" class="control-slider" id="slider-doppler" min="2" max="60" step="2" value="12" />
                  <div class="d3-slider-ticks">
                    <span>2 Hz (Walking)</span>
                    <span>20 Hz</span>
                    <span>60 Hz (Highway)</span>
                  </div>
                </div>

                <!-- Distance / Path Loss -->
                <div class="d3-slider-item">
                  <div class="d3-slider-label">
                    <span>LINK DISTANCE (d)</span>
                    <span class="d3-slider-val" id="val-distance">2.0 km (Loss: 104.5 dB)</span>
                  </div>
                  <input type="range" class="control-slider" id="slider-distance" min="0.5" max="15.0" step="0.5" value="2.0" />
                  <div class="d3-slider-ticks">
                    <span>0.5 km</span>
                    <span>5 km</span>
                    <span>15 km</span>
                  </div>
                </div>

                <!-- Noise Floor / Interference Level -->
                <div class="d3-slider-item">
                  <div class="d3-slider-label">
                    <span>CHANNEL NOISE DENSITY (No)</span>
                    <span class="d3-slider-val" id="val-noise">0.20 V</span>
                  </div>
                  <input type="range" class="control-slider" id="slider-noise" min="0.0" max="1.0" step="0.05" value="0.2" />
                  <div class="d3-slider-ticks">
                    <span>Clean</span>
                    <span>Moderate</span>
                    <span>High Noise</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 4: Interactive Bit Sequence Clicker -->
            <div class="d3-bitstream-container" id="d3-bitstream-section" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim);">
                  <strong style="color: var(--accent-cyan);">INTERACTIVE DATA BITSTREAM</strong> — Click individual bits to flip them and watch modulated wave instantly adjust:
                </div>
                <div class="d3-preset-group">
                  <button class="d3-preset-btn" data-preset="alt">10101010</button>
                  <button class="d3-preset-btn" data-preset="barker">Barker 1110010</button>
                  <button class="d3-preset-btn" data-preset="ones">All 1s</button>
                  <button class="d3-preset-btn" data-preset="zeros">All 0s</button>
                  <button class="d3-preset-btn" data-preset="random">🎲 Random</button>
                </div>
              </div>
              <div class="d3-bits-strip" id="d3-bits-buttons-mount"></div>
            </div>

            <!-- Row 5: Playback, Time Base, and Mathematical Formulation Banner -->
            <div class="d3-footer-toolbar">
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="btn-ctrl active" id="btn-d3-play" style="min-width: 80px;">
                  ⏸ PAUSE
                </button>
                <button class="btn-ctrl" id="btn-d3-step">
                  ⏭ STEP
                </button>
                <button class="btn-ctrl" id="btn-d3-reset">
                  ↺ RESET
                </button>
                <div style="display: flex; gap: 4px; align-items: center; margin-left: 8px; font-family: var(--font-mono); font-size: 0.72rem;">
                  <span style="color: var(--text-dim);">VIEW:</span>
                  <button class="btn-ctrl active" id="btn-d3-view-split">SPLIT TRACKS</button>
                  <button class="btn-ctrl" id="btn-d3-view-full">EXPANDED TRACE</button>
                </div>
              </div>

              <!-- Mathematical Formula Banner -->
              <div class="d3-formula-banner" id="d3-formula-banner">
                <span class="d3-formula-label">MATHEMATICAL MODEL:</span>
                <span class="d3-formula-text" id="d3-formula-text">s(t) = A · sin(2π · f · t)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- VIEW 2: OPEN-LOOP CONTROL SYSTEM (NO FEEDBACK) -->
        <div id="view-openloop-container" style="${this.state.activeTab === 'open_loop' ? 'display: block;' : 'display: none;'}">
          <div style="background: rgba(3, 7, 18, 0.85); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <span class="badge badge-staged" style="background: rgba(255, 183, 3, 0.15); color: #ffb703; border-color: rgba(255, 183, 3, 0.4);">
                  STALLINGS CHAPTER 10 §10.1.6 (PP. 276–277)
                </span>
                <h4 style="margin: 4px 0 0 0; color: #fff; font-size: 1.05rem; font-family: var(--font-heading);">
                  OPEN-LOOP CONTROL SYSTEM: DIRECT FORWARD-ONLY SIGNAL PATH
                </h4>
              </div>
              <span id="openloop-status-pill" style="font-family: var(--font-mono); font-size: 0.74rem; color: #ffb703; border: 1px solid rgba(255,183,3,0.3); padding: 4px 10px; border-radius: 4px;">
                AUTONOMOUS (NO RETURN FEEDBACK)
              </span>
            </div>

            <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
              In an <strong>open-loop control system</strong>, the mobile subscriber measures the received power of a continuous pilot beacon radiated by the base station.
              Assuming forward and reverse link reciprocity, the mobile autonomously sets its transmitter power inversely:
              <strong style="color: #ffb703;">P<sub>tx</sub> &prop; 1 / P<sub>rx,pilot</sub></strong>.
              <strong style="color: #ff0055;">Notice there is NO return feedback link from the base station</strong>. The signal path travels forward only from input sensor to output amplifier!
            </p>

            <!-- D3 Open-Loop SVG Canvas -->
            <div style="background: #02050e; border: 1px solid rgba(0, 229, 255, 0.25); border-radius: 6px; overflow: hidden; height: 320px;">
              <svg id="svg-openloop-stage" viewBox="0 0 840 320" style="width: 100%; height: 100%;">
                <!-- Populated dynamically via D3 -->
              </svg>
            </div>

            <!-- Open-Loop Interactive Controls -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 14px;">
              <div class="d3-slider-item">
                <div class="d3-slider-label">
                  <span>DISTANCE TO TOWER (d)</span>
                  <span class="d3-slider-val" id="val-ol-dist">3.5 km</span>
                </div>
                <input type="range" class="control-slider" id="slider-ol-dist" min="0.5" max="10.0" step="0.5" value="3.5" />
              </div>

              <div style="display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap;">
                <button class="btn-ctrl" id="btn-ol-obstacle" style="flex: 1; padding: 8px 10px; font-size: 0.75rem;">
                  🏢 SKYSCRAPER SHADOW (-20 dB)
                </button>
                <button class="btn-ctrl" id="btn-ol-interference" style="flex: 1; padding: 8px 10px; font-size: 0.75rem;">
                  ⚡ UPLINK ASYMMETRY (+12 dB)
                </button>
                <button class="btn-ctrl" id="btn-ol-reset" style="padding: 8px 12px; font-size: 0.75rem;">
                  ↺ RESET
                </button>
              </div>
            </div>

            <!-- Open-Loop Analytical Callout -->
            <div style="background: rgba(11, 19, 41, 0.6); border-left: 3px solid #ffb703; padding: 10px 14px; margin-top: 12px; font-size: 0.76rem; color: var(--text-secondary); line-height: 1.5;">
              <strong style="color: #ffb703;">ENGINEERING PRINCIPLE (STALLINGS P. 276):</strong>
              Open-loop responds almost instantaneously to sudden shadow fades, but because there is <em>no feedback mechanism</em>, it cannot correct for reverse-link interference or hardware calibration drift at the base station!
            </div>
          </div>
        </div>

        <!-- VIEW 3: CLOSED-LOOP FEEDBACK CONTROL SYSTEM (ERROR FEEDBACK) -->
        <div id="view-closedloop-container" style="${this.state.activeTab === 'closed_loop' ? 'display: block;' : 'display: none;'}">
          <div style="background: rgba(3, 7, 18, 0.85); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <span class="badge badge-ready" style="background: rgba(0, 255, 157, 0.15); color: #00ff9d; border-color: rgba(0, 255, 157, 0.4);">
                  STALLINGS CHAPTER 10 §10.1.6 (PP. 276–277)
                </span>
                <h4 style="margin: 4px 0 0 0; color: #fff; font-size: 1.05rem; font-family: var(--font-heading);">
                  CLOSED-LOOP CONTROL SYSTEM: FEEDBACK MECHANISM & ERROR CORRECTION
                </h4>
              </div>
              <span id="closedloop-status-pill" style="font-family: var(--font-mono); font-size: 0.74rem; color: #00ff9d; border: 1px solid rgba(0,255,157,0.3); padding: 4px 10px; border-radius: 4px;">
                FEEDBACK LOOP LOCKED: ERROR ≈ 0 dB
              </span>
            </div>

            <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
              In a <strong>closed-loop control system</strong>, the base station continuously measures the actual reverse-channel received power <strong>y(t)</strong> and compares it with a target setpoint <strong>r(t) = -90 dBm</strong> at a <strong>Summing Comparator (&Sigma;)</strong> to generate an error signal <strong>e(t) = r(t) - y(t)</strong>.
              The base station then sends high-rate power adjustment commands (<strong style="color: #00ff9d;">&plusmn;1 dB</strong>) over the forward command link at <strong>800 Hz to 1,600 Hz</strong> to continuously drive the error signal back to zero!
            </p>

            <!-- D3 Closed-Loop SVG Canvas -->
            <div style="background: #02050e; border: 1px solid rgba(0, 255, 157, 0.3); border-radius: 6px; overflow: hidden; height: 350px;">
              <svg id="svg-closedloop-stage" viewBox="0 0 840 350" style="width: 100%; height: 100%;">
                <!-- Populated dynamically via D3 -->
              </svg>
            </div>

            <!-- Closed-Loop Interactive Controls -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 14px;">
              <div class="d3-slider-item">
                <div class="d3-slider-label">
                  <span>BASE STATION SETPOINT (r)</span>
                  <span class="d3-slider-val" id="val-cl-setpoint">-90.0 dBm</span>
                </div>
                <input type="range" class="control-slider" id="slider-cl-setpoint" min="-105" max="-75" step="1" value="-90" />
              </div>

              <div class="d3-slider-item">
                <div class="d3-slider-label">
                  <span>FEEDBACK STEP RATE</span>
                  <span class="d3-slider-val" id="val-cl-rate">1,600 Hz (W-CDMA)</span>
                </div>
                <select id="select-cl-rate" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.72rem; border-radius: 4px;">
                  <option value="1600" selected>1,600 Hz — W-CDMA (Fastest)</option>
                  <option value="800">800 Hz — IS-95 CDMA (Standard)</option>
                  <option value="200">200 Hz — GSM Slow Control</option>
                </select>
              </div>

              <div style="display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap;">
                <button class="btn-ctrl" id="btn-cl-inject-fade" style="flex: 1; padding: 8px 10px; font-size: 0.75rem; background: rgba(255, 0, 85, 0.15); border-color: #ff0055; color: #ff0055;">
                  ⚡ INJECT DEEP FADE (-15 dB)
                </button>
                <button class="btn-ctrl" id="btn-cl-toggle-doppler" style="flex: 1; padding: 8px 10px; font-size: 0.75rem;">
                  🚗 MULTIPATH JITTER: OFF
                </button>
                <button class="btn-ctrl" id="btn-cl-reset" style="padding: 8px 12px; font-size: 0.75rem;">
                  ↺ LOCK LOOP
                </button>
              </div>
            </div>

            <!-- Closed-Loop Analytical Callout -->
            <div style="background: rgba(11, 19, 41, 0.6); border-left: 3px solid #00ff9d; padding: 10px 14px; margin-top: 12px; font-size: 0.76rem; color: var(--text-secondary); line-height: 1.5;">
              <strong style="color: #00ff9d;">FEEDBACK THEORY (STALLINGS §10.1.6):</strong>
              Notice how the comparator constantly calculates the error <code style="color: #00ff9d;">e(t) = Setpoint - Actual_Rx</code>. When a disturbance strikes, the error signal spikes, prompting the base station to emit high-frequency &plusmn;1 dB feedback steps that actively suppress the error back to 0 dB!
            </div>
          </div>
        </div>

        <!-- VIEW 4: CDMA WALSH SPREADING & RAKE MULTIPATH COMBINER (CHAPTER 10) -->
        <div id="view-cdmarake-container" style="${this.state.activeTab === 'cdma_rake' ? 'display: block;' : 'display: none;'}">
          <!-- Live Vector SVG Viewport Screen -->
          <div style="background: #030814; border-radius: 6px; border: 1px solid var(--border-subtle); overflow: hidden; position: relative;">
            <svg id="svg-cdmarake-stage" viewBox="0 0 840 400" width="100%" height="400" style="display: block;"></svg>
          </div>

          <!-- Crosshair / Status Telemetry Bar -->
          <div class="d3-cursor-bar">
            <span style="color: var(--text-dim);">CDMA RECOVERY STATUS:</span>
            <span id="cdmarake-status-pill" style="color: #00ff9d; font-weight: 700;">USER 1 BIT: +1 DECODED (0% CROSS-TALK)</span>
            <span style="color: var(--text-dim); margin: 0 4px;">|</span>
            <span id="cdmarake-diversity-pill" style="color: var(--accent-cyan); font-weight: 700;">DIVERSITY GAIN: +3.8 dB (MRC ON)</span>
            <span style="margin-left: auto; color: var(--text-dim); font-size: 0.72rem;">Orthogonal Spreading Codes (Stallings Table 7.1) + 3-Finger RAKE Receiver (Fig 10.18)</span>
          </div>

          <!-- Interactive Control Panel for CDMA Walsh Spreading & RAKE Combining -->
          <div class="d3-controls-panel">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
              <!-- Column 1: Subscriber Input Bits -->
              <div>
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan); font-weight: 700; margin-bottom: 6px;">
                  1. SUBSCRIBER DATA BITS (CLICK TO FLIP)
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button class="btn-ctrl active" id="btn-cr-u1" style="flex: 1; min-width: 70px; font-size: 0.72rem; padding: 6px;">
                    U1: <strong style="color: #00e5ff;">+1</strong>
                  </button>
                  <button class="btn-ctrl active" id="btn-cr-u2" style="flex: 1; min-width: 70px; font-size: 0.72rem; padding: 6px;">
                    U2: <strong style="color: #c084fc;">-1</strong>
                  </button>
                  <button class="btn-ctrl active" id="btn-cr-u3" style="flex: 1; min-width: 70px; font-size: 0.72rem; padding: 6px;">
                    U3: <strong style="color: #00ff9d;">+1</strong>
                  </button>
                </div>
                <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-dim); margin-top: 4px;">
                  b₁·W₁ + b₂·W₂ + b₃·W₃ superimpose simultaneously in 1.25 MHz carrier
                </div>
              </div>

              <!-- Column 2: Receiver Despread Target Code -->
              <div>
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: #00ff9d; font-weight: 700; margin-bottom: 6px;">
                  2. RAKE RECEIVER TARGET USER (W_k)
                </div>
                <select id="select-cr-target" class="control-select" style="width: 100%; background: var(--bg-tertiary); color: var(--text-bright); border: 1px solid var(--border-subtle); padding: 5px; font-family: var(--font-mono); font-size: 0.72rem; border-radius: 4px;">
                  <option value="1" selected>Target User 1 — Despread with Walsh W₁ (+1, +1, +1, +1)</option>
                  <option value="2">Target User 2 — Despread with Walsh W₂ (+1, -1, +1, -1)</option>
                  <option value="3">Target User 3 — Despread with Walsh W₃ (+1, +1, -1, -1)</option>
                </select>
                <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-dim); margin-top: 4px;">
                  Inner product ⟨Composite, W_k⟩ cleanly filters out other users to 0!
                </div>
              </div>

              <!-- Column 3: Multipath Echo Delay & Combining -->
              <div>
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: #ffb703; font-weight: 700; margin-bottom: 6px;">
                  3. MULTIPATH DELAY & DIVERSITY COMBINER
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button class="btn-ctrl active" id="btn-cr-toggle-mrc" style="flex: 1; padding: 6px 8px; font-size: 0.72rem; border-color: #00ff9d; color: #00ff9d;">
                    ✓ MRC COMBINER: ON (+3.8 dB)
                  </button>
                  <button class="btn-ctrl" id="btn-cr-inject-deepfade" style="flex: 1; padding: 6px 8px; font-size: 0.72rem; background: rgba(255,0,85,0.15); border-color: #ff0055; color: #ff0055;">
                    ⚡ DEEP NULL ON PATH 1
                  </button>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; margin-top: 6px;">
                  <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-dim);">PATH 2 DELAY:</span>
                  <input type="range" id="slider-cr-tau2" min="1.0" max="3.0" step="0.25" value="1.5" class="control-slider" style="flex: 1;"/>
                  <span id="val-cr-tau2" style="font-family: var(--font-mono); font-size: 0.68rem; color: #ffb703;">1.5 chips</span>
                </div>
              </div>
            </div>

            <!-- Analytical Callout -->
            <div style="background: rgba(11, 19, 41, 0.6); border-left: 3px solid var(--accent-cyan); padding: 10px 14px; margin-top: 12px; font-size: 0.76rem; color: var(--text-secondary); line-height: 1.5;">
              <strong style="color: var(--accent-cyan);">STALLINGS CDMA & RAKE PRINCIPLES (§10.4):</strong>
              Because Walsh codes are orthogonal, multiplying the composite signal by <code style="color: #00e5ff;">W_k</code> isolates User <code style="color: #00e5ff;">k</code> while other subscribers integrate to exactly zero!
              Furthermore, when multipath scattering creates delayed echoes ($&Delta;&tau; &gt; 814\text{ ns}$), the <strong>3-Finger RAKE Receiver</strong> compensates for relative delays and performs <strong>Maximal Ratio Combining (MRC)</strong>, turning destructive fading into constructive diversity gain!
            </div>
          </div>
        </div>
      </div>
    `;

    this.initD3Svg();
    this.initBitButtons();
    this.attachEvents();
    this.attachSuiteTabEvents();
    this.attachOpenLoopEvents();
    this.attachClosedLoopEvents();
    this.attachCdmaRakeEvents();
    this.updateSnrCalculation();
    this.startAnimation();
  }

  attachSuiteTabEvents() {
    const btnScope = this.container.querySelector('#btn-tab-scope');
    const btnOpen = this.container.querySelector('#btn-tab-openloop');
    const btnClosed = this.container.querySelector('#btn-tab-closedloop');
    const btnCdma = this.container.querySelector('#btn-tab-cdmarake');

    const vScope = this.container.querySelector('#view-scope-container');
    const vOpen = this.container.querySelector('#view-openloop-container');
    const vClosed = this.container.querySelector('#view-closedloop-container');
    const vCdma = this.container.querySelector('#view-cdmarake-container');

    const setTab = (tab) => {
      this.state.activeTab = tab;
      if (btnScope) btnScope.classList.toggle('active', tab === 'oscilloscope');
      if (btnOpen) btnOpen.classList.toggle('active', tab === 'open_loop');
      if (btnClosed) btnClosed.classList.toggle('active', tab === 'closed_loop');
      if (btnCdma) btnCdma.classList.toggle('active', tab === 'cdma_rake');

      if (vScope) vScope.style.display = tab === 'oscilloscope' ? 'block' : 'none';
      if (vOpen) vOpen.style.display = tab === 'open_loop' ? 'block' : 'none';
      if (vClosed) vClosed.style.display = tab === 'closed_loop' ? 'block' : 'none';
      if (vCdma) vCdma.style.display = tab === 'cdma_rake' ? 'block' : 'none';

      const telPill = this.container.querySelector('#tel-mode-pill');
      if (telPill) {
        telPill.textContent = tab === 'oscilloscope'
          ? `MODE: ${this.state.scheme}`
          : tab === 'open_loop'
          ? 'MODE: OPEN-LOOP (FORWARD ONLY)'
          : tab === 'closed_loop'
          ? 'MODE: CLOSED-LOOP (FEEDBACK ACTIVE)'
          : 'MODE: CDMA & RAKE (WALSH CHIPS)';
      }
    };

    if (btnScope) btnScope.addEventListener('click', () => setTab('oscilloscope'));
    if (btnOpen) btnOpen.addEventListener('click', () => setTab('open_loop'));
    if (btnClosed) btnClosed.addEventListener('click', () => setTab('closed_loop'));
    if (btnCdma) btnCdma.addEventListener('click', () => setTab('cdma_rake'));
  }

  attachCdmaRakeEvents() {
    const btnU1 = this.container.querySelector('#btn-cr-u1');
    const btnU2 = this.container.querySelector('#btn-cr-u2');
    const btnU3 = this.container.querySelector('#btn-cr-u3');
    const selTarget = this.container.querySelector('#select-cr-target');
    const btnMrc = this.container.querySelector('#btn-cr-toggle-mrc');
    const btnFade = this.container.querySelector('#btn-cr-inject-deepfade');
    const sliderTau2 = this.container.querySelector('#slider-cr-tau2');
    const valTau2 = this.container.querySelector('#val-cr-tau2');

    const updateBitBtn = (btn, bit, name, color) => {
      if (!btn) return;
      btn.innerHTML = `${name}: <strong style="color: ${color};">${bit > 0 ? '+1' : '-1'}</strong>`;
    };

    if (btnU1) {
      btnU1.addEventListener('click', () => {
        this.state.cdmaRake.user1Bit = this.state.cdmaRake.user1Bit > 0 ? -1 : 1;
        updateBitBtn(btnU1, this.state.cdmaRake.user1Bit, 'U1', '#00e5ff');
      });
    }

    if (btnU2) {
      btnU2.addEventListener('click', () => {
        this.state.cdmaRake.user2Bit = this.state.cdmaRake.user2Bit > 0 ? -1 : 1;
        updateBitBtn(btnU2, this.state.cdmaRake.user2Bit, 'U2', '#c084fc');
      });
    }

    if (btnU3) {
      btnU3.addEventListener('click', () => {
        this.state.cdmaRake.user3Bit = this.state.cdmaRake.user3Bit > 0 ? -1 : 1;
        updateBitBtn(btnU3, this.state.cdmaRake.user3Bit, 'U3', '#00ff9d');
      });
    }

    if (selTarget) {
      selTarget.addEventListener('change', (e) => {
        this.state.cdmaRake.targetUser = Number(e.target.value);
      });
    }

    if (btnMrc) {
      btnMrc.addEventListener('click', () => {
        this.state.cdmaRake.mrcEnabled = !this.state.cdmaRake.mrcEnabled;
        btnMrc.classList.toggle('active', this.state.cdmaRake.mrcEnabled);
        btnMrc.style.color = this.state.cdmaRake.mrcEnabled ? '#00ff9d' : '#ff0055';
        btnMrc.style.borderColor = this.state.cdmaRake.mrcEnabled ? '#00ff9d' : '#ff0055';
        btnMrc.textContent = this.state.cdmaRake.mrcEnabled
          ? '✓ MRC COMBINER: ON (+3.8 dB)'
          : '✗ MRC OFF (SINGLE FINGER)';
      });
    }

    if (btnFade) {
      btnFade.addEventListener('click', () => {
        this.state.cdmaRake.deepFadeActive = !this.state.cdmaRake.deepFadeActive;
        btnFade.classList.toggle('active', this.state.cdmaRake.deepFadeActive);
        btnFade.textContent = this.state.cdmaRake.deepFadeActive
          ? '⚡ DEEP NULL: ACTIVE (-16 dB)'
          : '⚡ DEEP NULL ON PATH 1';
      });
    }

    if (sliderTau2) {
      sliderTau2.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.cdmaRake.tau2Chips = val;
        if (valTau2) valTau2.textContent = `${val.toFixed(2)} chips`;
      });
    }
  }

  attachOpenLoopEvents() {
    const sDist = this.container.querySelector('#slider-ol-dist');
    const vDist = this.container.querySelector('#val-ol-dist');
    const bObs = this.container.querySelector('#btn-ol-obstacle');
    const bInt = this.container.querySelector('#btn-ol-interference');
    const bRes = this.container.querySelector('#btn-ol-reset');

    if (sDist) {
      sDist.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.openLoop.distanceKm = val;
        if (vDist) vDist.textContent = `${val.toFixed(1)} km`;
      });
    }

    if (bObs) {
      bObs.addEventListener('click', () => {
        this.state.openLoop.obstacleShadowDb = this.state.openLoop.obstacleShadowDb > 0 ? 0.0 : 20.0;
        bObs.classList.toggle('active', this.state.openLoop.obstacleShadowDb > 0);
        bObs.textContent = this.state.openLoop.obstacleShadowDb > 0
          ? '🏢 SKYSCRAPER SHADOW: ACTIVE (-20 dB)'
          : '🏢 SKYSCRAPER SHADOW (-20 dB)';
      });
    }

    if (bInt) {
      bInt.addEventListener('click', () => {
        this.state.openLoop.uplinkInterferenceDb = this.state.openLoop.uplinkInterferenceDb > 0 ? 0.0 : 12.0;
        bInt.classList.toggle('active', this.state.openLoop.uplinkInterferenceDb > 0);
        bInt.textContent = this.state.openLoop.uplinkInterferenceDb > 0
          ? '⚡ UPLINK ASYMMETRY: ACTIVE (+12 dB NOISE)'
          : '⚡ UPLINK ASYMMETRY (+12 dB)';
      });
    }

    if (bRes) {
      bRes.addEventListener('click', () => {
        this.state.openLoop.distanceKm = 3.5;
        this.state.openLoop.obstacleShadowDb = 0.0;
        this.state.openLoop.uplinkInterferenceDb = 0.0;
        if (sDist) sDist.value = '3.5';
        if (vDist) vDist.textContent = '3.5 km';
        if (bObs) {
          bObs.classList.remove('active');
          bObs.textContent = '🏢 SKYSCRAPER SHADOW (-20 dB)';
        }
        if (bInt) {
          bInt.classList.remove('active');
          bInt.textContent = '⚡ UPLINK ASYMMETRY (+12 dB)';
        }
      });
    }
  }

  attachClosedLoopEvents() {
    const sSet = this.container.querySelector('#slider-cl-setpoint');
    const vSet = this.container.querySelector('#val-cl-setpoint');
    const selRate = this.container.querySelector('#select-cl-rate');
    const bFade = this.container.querySelector('#btn-cl-inject-fade');
    const bDop = this.container.querySelector('#btn-cl-toggle-doppler');
    const bRes = this.container.querySelector('#btn-cl-reset');

    if (sSet) {
      sSet.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.closedLoop.setpointDbm = val;
        if (vSet) vSet.textContent = `${val.toFixed(1)} dBm`;
      });
    }

    if (selRate) {
      selRate.addEventListener('change', (e) => {
        this.state.closedLoop.stepRateHz = Number(e.target.value);
        const vRate = this.container.querySelector('#val-cl-rate');
        if (vRate) vRate.textContent = `${e.target.value} Hz (${e.target.value === '1600' ? 'W-CDMA' : e.target.value === '800' ? 'IS-95 CDMA' : 'GSM'})`;
      });
    }

    if (bFade) {
      bFade.addEventListener('click', () => {
        this.state.closedLoop.fadingDropDb = 15.0; // Sudden 15 dB shadow fade deficit
        setTimeout(() => {
          this.state.closedLoop.fadingDropDb = 0.0; // Clears after transient correction
        }, 3500);
      });
    }

    if (bDop) {
      bDop.addEventListener('click', () => {
        this.state.closedLoop.dopplerJitterActive = !this.state.closedLoop.dopplerJitterActive;
        bDop.classList.toggle('active', this.state.closedLoop.dopplerJitterActive);
        bDop.textContent = this.state.closedLoop.dopplerJitterActive
          ? '🚗 MULTIPATH JITTER: ON (±5 dB)'
          : '🚗 MULTIPATH JITTER: OFF';
      });
    }

    if (bRes) {
      bRes.addEventListener('click', () => {
        this.state.closedLoop.fadingDropDb = 0.0;
        this.state.closedLoop.errorDb = 0.0;
        this.state.closedLoop.errorHistory = Array.from({ length: 40 }, () => 0.0);
      });
    }
  }

  initD3Svg() {
    const host = this.container.querySelector('#d3-svg-host');
    if (!host) return;

    host.innerHTML = '';

    const width = host.clientWidth || 840;
    const height = 300;
    this.svgWidth = width;
    this.svgHeight = height;

    this.svg = d3.select(host)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'none')
      .attr('class', 'd3-oscilloscope-svg');

    // Defs: Gradients, Patterns, Glow Filters
    const defs = this.svg.append('defs');

    // Grid pattern
    const pattern = defs.append('pattern')
      .attr('id', 'd3-grid-pat')
      .attr('width', 40)
      .attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('path')
      .attr('d', 'M 40 0 L 0 0 0 40')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(0, 229, 255, 0.08)')
      .attr('stroke-width', 1);

    pattern.append('path')
      .attr('d', 'M 10 0 L 10 40 M 20 0 L 20 40 M 30 0 L 30 40 M 0 10 L 40 10 M 0 20 L 40 20 M 0 30 L 40 30')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(0, 229, 255, 0.03)')
      .attr('stroke-width', 0.5);

    // Wave gradients
    const gradMain = defs.append('linearGradient')
      .attr('id', 'd3-grad-main')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    gradMain.append('stop').attr('offset', '0%').attr('stop-color', '#0070f3').attr('stop-opacity', 0.85);
    gradMain.append('stop').attr('offset', '40%').attr('stop-color', '#00e5ff').attr('stop-opacity', 1.0);
    gradMain.append('stop').attr('offset', '80%').attr('stop-color', '#00ff9d').attr('stop-opacity', 0.95);
    gradMain.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.85);

    const gradBits = defs.append('linearGradient')
      .attr('id', 'd3-grad-bits')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    gradBits.append('stop').attr('offset', '0%').attr('stop-color', '#ffb703').attr('stop-opacity', 0.9);
    gradBits.append('stop').attr('offset', '100%').attr('stop-color', '#ea580c').attr('stop-opacity', 0.9);

    // Background rectangles
    this.svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#02050e');

    this.svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#d3-grid-pat)');

    // Main graph group with margins
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.innerWidth = width - this.margin.left - this.margin.right;
    this.innerHeight = height - this.margin.top - this.margin.bottom;

    // Track groups
    this.basebandGroup = this.g.append('g').attr('class', 'track-baseband');
    this.rfGroup = this.g.append('g').attr('class', 'track-rf');
    this.fadingEnvelopeGroup = this.g.append('g').attr('class', 'track-fading-env');

    // Axes groups
    this.xAxisGroup = this.g.append('g')
      .attr('class', 'd3-axis d3-axis-x')
      .attr('transform', `translate(0, ${this.innerHeight})`);

    this.yAxisGroup = this.g.append('g')
      .attr('class', 'd3-axis d3-axis-y');

    // Center reference line
    this.centerLine = this.g.append('line')
      .attr('x1', 0)
      .attr('x2', this.innerWidth)
      .attr('y1', this.innerHeight / 2)
      .attr('y2', this.innerHeight / 2)
      .attr('stroke', 'rgba(0, 229, 255, 0.25)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4');

    // Interactive crosshair cursor elements
    this.crosshairLineX = this.g.append('line')
      .attr('stroke', 'rgba(255, 183, 3, 0.6)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 3')
      .style('display', 'none');

    this.crosshairPoint = this.g.append('circle')
      .attr('r', 5)
      .attr('fill', '#ffb703')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('display', 'none');

    // Build SNR overlay
    this.buildSnrMeterOverlay(width, height);

    // Hover overlay
    this.overlay = this.g.append('rect')
      .attr('width', this.innerWidth)
      .attr('height', this.innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .attr('cursor', 'crosshair');

    this.setupHoverEvents();
  }

  buildSnrMeterOverlay(width, height) {
    const overlayW = 230;
    const overlayH = 78;
    const overlayX = this.innerWidth - overlayW + 15;
    const overlayY = -18;

    this.snrOverlayGroup = this.g.append('g')
      .attr('class', 'd3-snr-canvas-overlay')
      .attr('transform', `translate(${overlayX}, ${overlayY})`);

    this.snrOverlayGroup.append('rect')
      .attr('width', overlayW)
      .attr('height', overlayH)
      .attr('rx', 6)
      .attr('fill', 'rgba(3, 7, 18, 0.92)')
      .attr('stroke', 'rgba(0, 229, 255, 0.35)')
      .attr('stroke-width', 1.2)
      .attr('filter', 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.8))');

    this.snrOverlayGroup.append('text')
      .attr('x', 10)
      .attr('y', 14)
      .attr('fill', 'var(--text-dim)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '8px')
      .attr('font-weight', '700')
      .text('SNR METER (EQ. 2.13 & 5.4)');

    this.snrQualityBadge = this.snrOverlayGroup.append('text')
      .attr('x', overlayW - 10)
      .attr('y', 14)
      .attr('text-anchor', 'end')
      .attr('fill', '#00ff9d')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '8px')
      .attr('font-weight', '700')
      .text('EXCELLENT');

    this.snrDbText = this.snrOverlayGroup.append('text')
      .attr('x', 10)
      .attr('y', 38)
      .attr('fill', '#00ff9d')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '18px')
      .attr('font-weight', '800')
      .text('22.5 dB');

    const barX = 105;
    const barY = 24;
    const barW = 115;
    const barH = 14;

    this.snrOverlayGroup.append('rect')
      .attr('x', barX)
      .attr('y', barY)
      .attr('width', barW)
      .attr('height', barH)
      .attr('rx', 3)
      .attr('fill', '#0b1329')
      .attr('stroke', 'rgba(0, 229, 255, 0.2)')
      .attr('stroke-width', 1);

    this.snrMeterBar = this.snrOverlayGroup.append('rect')
      .attr('x', barX + 1)
      .attr('y', barY + 1)
      .attr('width', barW * 0.65)
      .attr('height', barH - 2)
      .attr('rx', 2)
      .attr('fill', '#00ff9d');

    [0.25, 0.5, 0.75].forEach(frac => {
      this.snrOverlayGroup.append('line')
        .attr('x1', barX + barW * frac)
        .attr('x2', barX + barW * frac)
        .attr('y1', barY)
        .attr('y2', barY + barH)
        .attr('stroke', 'rgba(3, 7, 18, 0.7)')
        .attr('stroke-width', 1);
    });

    this.snrSubText = this.snrOverlayGroup.append('text')
      .attr('x', 10)
      .attr('y', 55)
      .attr('fill', 'var(--text-dim)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '8px')
      .text('Rx Power: 31.2 mW | Noise: 1.8 μW');

    this.snrCapText = this.snrOverlayGroup.append('text')
      .attr('x', 10)
      .attr('y', 68)
      .attr('fill', 'var(--accent-cyan)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '8px')
      .text('Shannon Capacity: C = 45.2 kbps');
  }

  updateSnrCalculation() {
    const { freqHz, amplitudeV, distanceKm, noiseFloorV, fadingModel, ricianK_dB } = this.state;

    const signalPower = (amplitudeV * amplitudeV) / 2;
    this.state.signalPowerMw = signalPower * 10;

    const pathLossDb = 20 * Math.log10(Math.max(100, freqHz)) + 20 * Math.log10(distanceKm) - 28.0;
    const lossLinear = Math.pow(10, Math.max(0, pathLossDb) / 20);

    let fadingLossFactor = 1.0;
    if (fadingModel === 'rayleigh') {
      fadingLossFactor = 0.45;
    } else if (fadingModel === 'rician') {
      const K = Math.pow(10, ricianK_dB / 10);
      fadingLossFactor = (K + 0.6) / (K + 1);
    }

    const rxPower = (signalPower / Math.max(1, lossLinear * 0.12)) * fadingLossFactor;

    const bandwidthHz = freqHz * 1.5;
    const noisePower = (0.015 + noiseFloorV * 0.08) * (bandwidthHz / 3000);
    this.state.noisePowerUw = noisePower * 1000;

    const snrLinear = Math.max(0.1, rxPower / Math.max(0.0001, noisePower));
    const snrDb = 10 * Math.log10(snrLinear);
    this.state.snrDb = Math.min(42, Math.max(-5, snrDb));

    const cap = bandwidthHz * Math.log2(1 + snrLinear);
    this.state.shannonCapacityKbps = cap / 1000;

    this.updateSnrOverlayUI();
  }

  updateSnrOverlayUI() {
    if (!this.snrDbText || !this.snrMeterBar) return;

    const snr = this.state.snrDb;
    this.snrDbText.textContent = `${snr >= 0 ? '+' : ''}${snr.toFixed(1)} dB`;

    const pct = Math.max(0, Math.min(100, ((snr + 5) / 40) * 100));
    const maxBarW = 115 - 2;
    this.snrMeterBar.attr('width', (maxBarW * pct) / 100);

    let color = '#00ff9d';
    let label = 'EXCELLENT';
    if (snr >= 22) {
      color = '#00ff9d';
      label = 'EXCELLENT';
    } else if (snr >= 14) {
      color = '#38bdf8';
      label = 'GOOD LINK';
    } else if (snr >= 7) {
      color = '#ffb703';
      label = 'MARGINAL';
    } else {
      color = '#ff0055';
      label = 'HIGH BER';
    }

    this.snrDbText.attr('fill', color);
    this.snrMeterBar.attr('fill', color);
    if (this.snrQualityBadge) {
      this.snrQualityBadge.attr('fill', color).text(label);
    }

    if (this.snrSubText) {
      this.snrSubText.textContent = `Rx Power: ${(this.state.signalPowerMw).toFixed(1)} mW | Noise: ${(this.state.noisePowerUw).toFixed(1)} μW`;
    }
    if (this.snrCapText) {
      this.snrCapText.textContent = `Shannon Capacity: C = ${(this.state.shannonCapacityKbps).toFixed(1)} kbps`;
    }

    const telSnr = this.container.querySelector('#tel-snr-pill');
    if (telSnr) {
      telSnr.style.color = color;
      telSnr.style.borderColor = color;
      telSnr.textContent = `SNR: ${snr.toFixed(1)} dB`;
    }
  }

  setupHoverEvents() {
    this.overlay
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const t = this.xScale.invert(mx);
        const v = this.evalSignalAtTime(t);
        const fadeEnv = this.evalFadingEnvelope(t);

        this.crosshairLineX
          .attr('x1', mx).attr('x2', mx)
          .attr('y1', 0).attr('y2', this.innerHeight)
          .style('display', 'block');

        const py = this.rfYScale ? this.rfYScale(v) : this.yScale(v);
        this.crosshairPoint
          .attr('cx', mx)
          .attr('cy', Math.max(0, Math.min(this.innerHeight, py)))
          .style('display', 'block');

        const curTimeEl = this.container.querySelector('#d3-cursor-time');
        const curVoltEl = this.container.querySelector('#d3-cursor-volt');
        const curFadeEl = this.container.querySelector('#d3-cursor-fade');
        const curBitEl = this.container.querySelector('#d3-cursor-bit');

        if (curTimeEl) curTimeEl.textContent = `t = ${(t * 1000).toFixed(3)} ms`;
        if (curVoltEl) curVoltEl.textContent = `v(t) = ${v >= 0 ? '+' : ''}${v.toFixed(2)} V`;
        if (curFadeEl) curFadeEl.textContent = `Fading Env r(t): ${fadeEnv.toFixed(2)}`;
        
        if (curBitEl) {
          const bitVal = this.getBitAtTime(t);
          curBitEl.textContent = bitVal !== null ? `Bit: ${bitVal}` : 'N/A';
        }
      })
      .on('mouseleave', () => {
        this.crosshairLineX.style('display', 'none');
        this.crosshairPoint.style('display', 'none');
      });
  }

  initBitButtons() {
    const mount = this.container.querySelector('#d3-bits-buttons-mount');
    if (!mount) return;

    mount.innerHTML = this.state.bitPattern.map((bit, idx) => `
      <div class="d3-bit-card ${bit === 1 ? 'is-one' : 'is-zero'}" data-bit-idx="${idx}" title="Click to flip bit ${idx}">
        <div class="d3-bit-idx">b${idx}</div>
        <div class="d3-bit-val">${bit}</div>
        <div class="d3-bit-label">${bit === 1 ? 'MARK' : 'SPACE'}</div>
      </div>
    `).join('');

    const bitCards = mount.querySelectorAll('.d3-bit-card');
    bitCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.getAttribute('data-bit-idx'));
        this.state.bitPattern[idx] = this.state.bitPattern[idx] === 1 ? 0 : 1;
        this.initBitButtons();
      });
    });
  }

  attachEvents() {
    // 0. Wave velocity controls (Slow motion trackability)
    const spdBtns = [
      { id: '#btn-spd-003', val: 0.03 },
      { id: '#btn-spd-008', val: 0.08 },
      { id: '#btn-spd-020', val: 0.20 },
      { id: '#btn-spd-050', val: 0.50 }
    ];

    const sSlider = this.container.querySelector('#slider-wave-speed');
    const sLabel = this.container.querySelector('#lbl-speed-val');
    const sPill = this.container.querySelector('#tel-speed-pill');

    const setSpeed = (spd) => {
      this.state.playbackSpeed = spd;
      if (sSlider) sSlider.value = String(spd);
      if (sLabel) sLabel.textContent = `${spd.toFixed(2)}× Trackable Wavefronts`;
      if (sPill) sPill.textContent = `SPEED: ${spd.toFixed(2)}× (TRACKABLE)`;

      spdBtns.forEach(item => {
        const b = this.container.querySelector(item.id);
        if (b) b.classList.toggle('active', Math.abs(item.val - spd) < 0.01);
      });
    };

    spdBtns.forEach(item => {
      const b = this.container.querySelector(item.id);
      if (b) b.addEventListener('click', () => setSpeed(item.val));
    });

    if (sSlider) {
      sSlider.addEventListener('input', (e) => {
        setSpeed(Number(e.target.value));
      });
    }

    // 1. Scheme Selector buttons
    const schemeBtns = this.container.querySelectorAll('.d3-scheme-btn');
    schemeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scheme = e.currentTarget.getAttribute('data-scheme');
        this.setScheme(scheme);
        schemeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-scheme') === scheme));
      });
    });

    // 2. Frequency Slider
    const freqSlider = this.container.querySelector('#slider-freq');
    if (freqSlider) {
      freqSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.freqHz = val;
        const valEl = this.container.querySelector('#val-freq');
        if (valEl) valEl.textContent = `${(val / 1000).toFixed(2)} kHz`;
        const telFreq = this.container.querySelector('#tel-freq-pill');
        if (telFreq) telFreq.textContent = `fc = ${(val / 1000).toFixed(2)} kHz`;
        this.updateSnrCalculation();
      });
    }

    // 3. Peak Amplitude Slider
    const ampSlider = this.container.querySelector('#slider-amp');
    if (ampSlider) {
      ampSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.amplitudeV = val;
        const valEl = this.container.querySelector('#val-amp');
        if (valEl) valEl.textContent = `${val.toFixed(2)} V`;
        const telAmp = this.container.querySelector('#tel-amp-pill');
        if (telAmp) telAmp.textContent = `Vpk = ${val.toFixed(2)} V`;
        this.updateSnrCalculation();
      });
    }

    // 4. Bit Rate Slider
    const brSlider = this.container.querySelector('#slider-bitrate');
    if (brSlider) {
      brSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.bitRateBps = val;
        const tbMs = (1000 / val).toFixed(1);
        const valEl = this.container.querySelector('#val-bitrate');
        if (valEl) valEl.textContent = `${val} bps (Tb = ${tbMs} ms)`;
        this.updateSnrCalculation();
      });
    }

    // 5. Contextual Slider
    const ctxSlider = this.container.querySelector('#slider-context');
    if (ctxSlider) {
      ctxSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        const valEl = this.container.querySelector('#val-context');
        if (this.state.scheme === 'ASK') {
          this.state.askMinRatio = val / 100;
          if (valEl) valEl.textContent = `${val}% carrier (${val === 0 ? 'OOK' : 'Partial ASK'})`;
        } else if (this.state.scheme === 'FSK') {
          this.state.fskDevHz = val;
          if (valEl) valEl.textContent = `${(val / 1000).toFixed(2)} kHz (Δf)`;
        } else if (this.state.scheme === 'SQUARE') {
          this.state.harmonics = val;
          if (valEl) valEl.textContent = `${val} odd harmonics`;
        }
        this.updateSnrCalculation();
      });
    }

    // 6. Fading Model Mode Buttons
    const fadingBtns = this.container.querySelectorAll('.d3-fading-btn');
    fadingBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.getAttribute('data-fading');
        this.setFadingModel(mode);
        fadingBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-fading') === mode));
      });
    });

    // 7. Rician K-Factor Slider
    const ricianSlider = this.container.querySelector('#slider-rician-k');
    if (ricianSlider) {
      ricianSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.ricianK_dB = val;
        const K_lin = Math.pow(10, val / 10).toFixed(1);
        const valEl = this.container.querySelector('#val-rician-k');
        if (valEl) valEl.textContent = `${val.toFixed(1)} dB (K = ${K_lin})`;
        this.updateSnrCalculation();
      });
    }

    // 8. Doppler Frequency Slider
    const dopSlider = this.container.querySelector('#slider-doppler');
    if (dopSlider) {
      dopSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.dopplerHz = val;
        const valEl = this.container.querySelector('#val-doppler');
        if (valEl) valEl.textContent = `${val.toFixed(1)} Hz (~${Math.max(10, Math.min(120, val * 3.2)).toFixed(0)} km/h)`;
        this.updateSnrCalculation();
      });
    }

    // 9. Distance Slider
    const distSlider = this.container.querySelector('#slider-distance');
    if (distSlider) {
      distSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.distanceKm = val;
        const lossDb = (20 * Math.log10(this.state.freqHz) + 20 * Math.log10(val) - 28).toFixed(1);
        const valEl = this.container.querySelector('#val-distance');
        if (valEl) valEl.textContent = `${val.toFixed(1)} km (Loss: ${lossDb} dB)`;
        this.updateSnrCalculation();
      });
    }

    // 10. Noise Floor Slider
    const noiseSlider = this.container.querySelector('#slider-noise');
    if (noiseSlider) {
      noiseSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.noiseFloorV = val;
        const valEl = this.container.querySelector('#val-noise');
        if (valEl) valEl.textContent = `${val.toFixed(2)} V`;
        this.updateSnrCalculation();
      });
    }

    // 11. Toggle Multipath Echo
    const btnMultipath = this.container.querySelector('#btn-toggle-multipath');
    const mpEchoText = this.container.querySelector('#multipath-echo-status');
    if (btnMultipath) {
      btnMultipath.addEventListener('click', () => {
        this.state.enableMultipathEcho = !this.state.enableMultipathEcho;
        if (mpEchoText) {
          mpEchoText.textContent = this.state.enableMultipathEcho ? 'ON' : 'OFF';
          mpEchoText.style.color = this.state.enableMultipathEcho ? 'var(--status-ready)' : 'var(--text-dim)';
        }
        this.updateSnrCalculation();
      });
    }

    // 12. Bitstream Presets
    const presetBtns = this.container.querySelectorAll('.d3-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.getAttribute('data-preset');
        if (type === 'alt') this.state.bitPattern = [1, 0, 1, 0, 1, 0, 1, 0];
        else if (type === 'barker') this.state.bitPattern = [1, 1, 1, 0, 0, 1, 0, 1];
        else if (type === 'ones') this.state.bitPattern = [1, 1, 1, 1, 1, 1, 1, 1];
        else if (type === 'zeros') this.state.bitPattern = [0, 0, 0, 0, 0, 0, 0, 0];
        else if (type === 'random') this.state.bitPattern = Array.from({ length: 8 }, () => Math.random() > 0.5 ? 1 : 0);
        this.initBitButtons();
      });
    });

    // 13. Transport buttons
    const btnPlay = this.container.querySelector('#btn-d3-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.state.isPlaying = !this.state.isPlaying;
        btnPlay.textContent = this.state.isPlaying ? '⏸ PAUSE' : '▶ PLAY';
        btnPlay.classList.toggle('active', this.state.isPlaying);
      });
    }

    const btnStep = this.container.querySelector('#btn-d3-step');
    if (btnStep) {
      btnStep.addEventListener('click', () => {
        this.state.isPlaying = false;
        if (btnPlay) {
          btnPlay.textContent = '▶ PLAY';
          btnPlay.classList.remove('active');
        }
        this.state.timeOffsetSec += 0.0005;
      });
    }

    const btnReset = this.container.querySelector('#btn-d3-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.state.timeOffsetSec = 0;
      });
    }

    // 14. View mode
    const btnSplit = this.container.querySelector('#btn-d3-view-split');
    const btnFull = this.container.querySelector('#btn-d3-view-full');
    if (btnSplit && btnFull) {
      btnSplit.addEventListener('click', () => {
        this.state.viewMode = 'split';
        btnSplit.classList.add('active');
        btnFull.classList.remove('active');
      });
      btnFull.addEventListener('click', () => {
        this.state.viewMode = 'single';
        btnFull.classList.add('active');
        btnSplit.classList.remove('active');
      });
    }
  }

  setFadingModel(model) {
    this.state.fadingModel = model;

    const ind = this.container.querySelector('#fading-model-indicator');
    const pill = this.container.querySelector('#tel-fading-pill');
    const ricianBox = this.container.querySelector('#slider-box-rician-k');

    if (model === 'none') {
      if (ind) ind.textContent = 'AWGN Channel: Pure Direct Path (No Fading)';
      if (pill) {
        pill.textContent = 'CHANNEL: NO FADE';
        pill.style.color = '#ffb703';
        pill.style.borderColor = 'rgba(255,183,3,0.4)';
      }
      if (ricianBox) ricianBox.style.opacity = '0.4';
    } else if (model === 'rayleigh') {
      if (ind) ind.textContent = 'Rayleigh Multipath Fading: No Dominant LOS, Severe Deep Nulls (Stallings p. 118)';
      if (pill) {
        pill.textContent = 'CHANNEL: RAYLEIGH FADE';
        pill.style.color = '#ff0055';
        pill.style.borderColor = '#ff0055';
      }
      if (ricianBox) ricianBox.style.opacity = '0.4';
    } else if (model === 'rician') {
      if (ind) ind.textContent = `Rician Fading: Dominant LOS + Multipath Scatter (K = ${this.state.ricianK_dB} dB, Stallings p. 118)`;
      if (pill) {
        pill.textContent = `CHANNEL: RICIAN (K=${this.state.ricianK_dB}dB)`;
        pill.style.color = '#00ff9d';
        pill.style.borderColor = '#00ff9d';
      }
      if (ricianBox) ricianBox.style.opacity = '1.0';
    }

    this.updateSnrCalculation();
  }

  setScheme(scheme) {
    this.state.scheme = scheme;

    const bitSection = this.container.querySelector('#d3-bitstream-section');
    const isDigital = ['ASK', 'FSK', 'PSK', 'QPSK'].includes(scheme);
    if (bitSection) {
      bitSection.style.display = isDigital ? 'block' : 'none';
    }

    const ctxTitle = this.container.querySelector('#lbl-context-title');
    const ctxVal = this.container.querySelector('#val-context');
    const ctxSlider = this.container.querySelector('#slider-context');
    const ctxTicks = this.container.querySelector('#ticks-context');
    const brBox = this.container.querySelector('#slider-box-bitrate');

    if (brBox) brBox.style.display = isDigital ? 'flex' : 'none';

    const descEl = this.container.querySelector('#d3-scheme-desc');
    const formulaEl = this.container.querySelector('#d3-formula-text');
    const telPill = this.container.querySelector('#tel-mode-pill');

    if (telPill) telPill.textContent = `MODE: ${scheme}`;

    if (scheme === 'SINE') {
      if (descEl) descEl.textContent = 'Continuous Sine Wave — Fundamental Harmonic of Fourier Series';
      if (formulaEl) formulaEl.textContent = 's(t) = A · sin(2π · f · t)';
      if (ctxTitle) ctxTitle.textContent = 'HARMONIC PURITY';
      if (ctxVal) ctxVal.textContent = '100% Pure Sine';
      if (ctxSlider) {
        ctxSlider.min = '1'; ctxSlider.max = '1'; ctxSlider.value = '1'; ctxSlider.disabled = true;
      }
    } else if (scheme === 'SQUARE') {
      if (descEl) descEl.textContent = 'Bipolar Square Wave — Infinite Sum of Odd Harmonics (Fourier Eq. 2.1)';
      if (formulaEl) formulaEl.textContent = 's(t) = (4A/π) · ∑ [1/(2k-1)] · sin(2π · (2k-1) · f · t)';
      if (ctxTitle) ctxTitle.textContent = 'FOURIER HARMONICS';
      if (ctxVal) ctxVal.textContent = '15 Harmonics';
      if (ctxSlider) {
        ctxSlider.disabled = false;
        ctxSlider.min = '1'; ctxSlider.max = '31'; ctxSlider.step = '2'; ctxSlider.value = '15';
      }
      if (ctxTicks) ctxTicks.innerHTML = '<span>1 (Fund)</span><span>15 Harmonics</span><span>31 Harmonics</span>';
    } else if (scheme === 'ASK') {
      if (descEl) descEl.textContent = 'Amplitude Shift Keying (ASK / OOK) — Stallings §6.2 (pp. 161–164)';
      if (formulaEl) formulaEl.textContent = 's(t) = d(t) · A_c · cos(2π · fc · t)  |  Bit 1: A1, Bit 0: A0';
      if (ctxTitle) ctxTitle.textContent = 'BIT 0 AMPLITUDE RATIO (A0/A1)';
      if (ctxVal) ctxVal.textContent = '20% Carrier (Partial ASK)';
      if (ctxSlider) {
        ctxSlider.disabled = false;
        ctxSlider.min = '0'; ctxSlider.max = '60'; ctxSlider.step = '5'; ctxSlider.value = '20';
      }
      if (ctxTicks) ctxTicks.innerHTML = '<span>0% (OOK)</span><span>20% (Partial)</span><span>60% (Low Depth)</span>';
    } else if (scheme === 'FSK') {
      if (descEl) descEl.textContent = 'Frequency Shift Keying (BFSK) — Stallings §6.2 (pp. 164–167)';
      if (formulaEl) formulaEl.textContent = 'Bit 1: cos(2π(fc + Δf)t)  |  Bit 0: cos(2π(fc - Δf)t)';
      if (ctxTitle) ctxTitle.textContent = 'FSK DEVIATION (Δf)';
      if (ctxVal) ctxVal.textContent = '1.20 kHz (Δf)';
      if (ctxSlider) {
        ctxSlider.disabled = false;
        ctxSlider.min = '200'; ctxSlider.max = '2500'; ctxSlider.step = '100'; ctxSlider.value = '1200';
      }
      if (ctxTicks) ctxTicks.innerHTML = '<span>200 Hz</span><span>1.2 kHz</span><span>2.5 kHz</span>';
    } else if (scheme === 'PSK') {
      if (descEl) descEl.textContent = 'Binary Phase Shift Keying (BPSK) — Stallings §6.2 (pp. 167–170)';
      if (formulaEl) formulaEl.textContent = 'Bit 1: A·cos(2π·fc·t)  |  Bit 0: A·cos(2π·fc·t + π) = -A·cos(2π·fc·t)';
      if (ctxTitle) ctxTitle.textContent = 'PHASE SEPARATION';
      if (ctxVal) ctxVal.textContent = '180° Inverted Antipodal';
      if (ctxSlider) {
        ctxSlider.min = '180'; ctxSlider.max = '180'; ctxSlider.value = '180'; ctxSlider.disabled = true;
      }
      if (ctxTicks) ctxTicks.innerHTML = '<span>Antipodal (180°)</span>';
    } else if (scheme === 'QPSK') {
      if (descEl) descEl.textContent = 'Quadrature Phase Shift Keying (QPSK, 4-Phase) — Stallings §6.2 (pp. 170–174)';
      if (formulaEl) formulaEl.textContent = 's(t) = A · cos(2π·fc·t + θ_i),  θ_i ∈ {π/4, 3π/4, 5π/4, 7π/4}';
      if (ctxTitle) ctxTitle.textContent = 'CONSTELLATION POINTS';
      if (ctxVal) ctxVal.textContent = '4 Constellation Symbols (2 bits/sym)';
      if (ctxSlider) {
        ctxSlider.min = '4'; ctxSlider.max = '4'; ctxSlider.value = '4'; ctxSlider.disabled = true;
      }
      if (ctxTicks) ctxTicks.innerHTML = '<span>4 Points (Gray Coded)</span>';
    }

    this.updateSnrCalculation();
  }

  getBitAtTime(t) {
    const { bitRateBps, bitPattern, timeOffsetSec } = this.state;
    const tb = 1 / bitRateBps;
    const curT = t + timeOffsetSec;
    const bitIndex = Math.floor(curT / tb);
    const patternLen = bitPattern.length;
    const normalizedIdx = ((bitIndex % patternLen) + patternLen) % patternLen;
    return bitPattern[normalizedIdx];
  }

  evalFadingEnvelope(t) {
    const { fadingModel, dopplerHz, ricianK_dB, timeOffsetSec } = this.state;
    if (fadingModel === 'none') return 1.0;

    const curT = t + timeOffsetSec;
    let sumI = 0;
    let sumQ = 0;

    for (let i = 0; i < 8; i++) {
      const phase = 2 * Math.PI * dopplerHz * Math.cos(this.rayAngles[i]) * curT + this.rayPhases[i];
      sumI += Math.cos(phase);
      sumQ += Math.sin(phase);
    }
    const scale = 1 / Math.sqrt(8);
    sumI *= scale;
    sumQ *= scale;

    if (fadingModel === 'rayleigh') {
      return Math.sqrt(sumI * sumI + sumQ * sumQ);
    } else if (fadingModel === 'rician') {
      const K = Math.pow(10, ricianK_dB / 10);
      const s = Math.sqrt(K / (K + 1));
      const sigma = Math.sqrt(1 / (2 * (K + 1)));
      const totalI = s + sigma * sumI * Math.SQRT2;
      const totalQ = sigma * sumQ * Math.SQRT2;
      return Math.sqrt(totalI * totalI + totalQ * totalQ);
    }

    return 1.0;
  }

  evalSignalAtTime(t) {
    const { scheme, freqHz, amplitudeV, bitRateBps, fskDevHz, askMinRatio, harmonics, enableMultipathEcho, multipathSpreadMs, noiseFloorV, timeOffsetSec } = this.state;
    const curT = t + timeOffsetSec;

    let baseSignal = 0;

    if (scheme === 'SINE') {
      baseSignal = amplitudeV * Math.sin(2 * Math.PI * freqHz * curT);
    } else if (scheme === 'SQUARE') {
      let sum = 0;
      for (let n = 1; n <= harmonics; n += 2) {
        sum += (1 / n) * Math.sin(2 * Math.PI * n * freqHz * curT);
      }
      baseSignal = (4 * amplitudeV / Math.PI) * sum;
    } else {
      const bit = this.getBitAtTime(t);

      if (scheme === 'ASK') {
        const amp = bit === 1 ? amplitudeV : amplitudeV * askMinRatio;
        baseSignal = amp * Math.sin(2 * Math.PI * freqHz * curT);
      } else if (scheme === 'FSK') {
        const instFreq = bit === 1 ? freqHz + fskDevHz : Math.max(200, freqHz - fskDevHz);
        baseSignal = amplitudeV * Math.sin(2 * Math.PI * instFreq * curT);
      } else if (scheme === 'PSK') {
        const phase = bit === 1 ? 0 : Math.PI;
        baseSignal = amplitudeV * Math.sin(2 * Math.PI * freqHz * curT + phase);
      } else if (scheme === 'QPSK') {
        const tb = 1 / bitRateBps;
        const symTb = tb * 2;
        const symIdx = Math.floor(curT / symTb) % 4;
        const phases = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
        const phi = phases[(symIdx + 4) % 4];
        baseSignal = amplitudeV * Math.cos(2 * Math.PI * freqHz * curT + phi);
      }
    }

    const fadeEnv = this.evalFadingEnvelope(t);
    let output = baseSignal * fadeEnv;

    if (enableMultipathEcho && this.state.fadingModel !== 'none') {
      const tau = multipathSpreadMs / 1000;
      const echoWave = amplitudeV * 0.35 * Math.sin(2 * Math.PI * freqHz * (curT - tau));
      output += echoWave;
    }

    if (noiseFloorV > 0) {
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.random();
      const gNoise = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      output += gNoise * (noiseFloorV * 0.35);
    }

    return output;
  }

  startAnimation() {
    const loop = (timestamp) => {
      const dt = Math.max(0.001, Math.min(0.1, (timestamp - this.lastTimestamp) / 1000));
      this.lastTimestamp = timestamp;

      if (this.state.isPlaying) {
        // Human-trackable wave motion speed
        this.state.timeOffsetSec += dt * this.state.playbackSpeed;
        this.state.openLoop.pulseOffset += dt * 0.7;
        this.state.closedLoop.simClock += dt;
        this.state.closedLoop.cmdPulseOffset += dt * 1.5;
        this.state.closedLoop.trafficPulseOffset += dt * 1.5;
        this.state.cdmaRake.simClock += dt;
        this.state.cdmaRake.pulseOffset = (this.state.cdmaRake.pulseOffset + dt * 0.7) % 1.0;
      }

      this.drawFrame();
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  drawFrame() {
    if (this.state.activeTab === 'oscilloscope') {
      this.drawOscilloscopeFrame();
    } else if (this.state.activeTab === 'open_loop') {
      this.drawOpenLoopFrame();
    } else if (this.state.activeTab === 'closed_loop') {
      this.drawClosedLoopFrame();
    } else if (this.state.activeTab === 'cdma_rake') {
      this.drawCdmaRakeFrame();
    }
  }

  drawOscilloscopeFrame() {
    if (!this.svg || !this.g) return;

    const { scheme, amplitudeV, viewMode } = this.state;
    const isDigital = ['ASK', 'FSK', 'PSK', 'QPSK'].includes(scheme);
    const showSplit = viewMode === 'split' && isDigital;

    const tMax = this.state.timeWindowSec;
    this.xScale = d3.scaleLinear()
      .domain([0, tMax])
      .range([0, this.innerWidth]);

    const xAxis = d3.axisBottom(this.xScale)
      .ticks(8)
      .tickFormat(d => `${(d * 1000).toFixed(1)}ms`);

    this.xAxisGroup
      .attr('transform', `translate(0, ${this.innerHeight})`)
      .call(xAxis);

    this.xAxisGroup.selectAll('text')
      .attr('fill', 'var(--text-dim)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10px');

    this.xAxisGroup.selectAll('line, path')
      .attr('stroke', 'rgba(0, 229, 255, 0.25)');

    if (showSplit) {
      const basebandHeight = this.innerHeight * 0.28;
      const rfTopY = this.innerHeight * 0.38;
      const rfHeight = this.innerHeight - rfTopY;

      this.renderBasebandTrace(basebandHeight);
      this.renderRfTrace(rfTopY, rfHeight);

      const yMax = Math.max(1, amplitudeV * 1.4);
      const rfYScale = d3.scaleLinear()
        .domain([-yMax, yMax])
        .range([this.innerHeight, rfTopY]);

      this.rfYScale = rfYScale;

      const yAxis = d3.axisLeft(rfYScale)
        .ticks(5)
        .tickFormat(d => `${d >= 0 ? '+' : ''}${d.toFixed(1)}V`);

      this.yAxisGroup.call(yAxis);
    } else {
      this.basebandGroup.selectAll('*').remove();

      const yMax = Math.max(1, amplitudeV * 1.4);
      this.yScale = d3.scaleLinear()
        .domain([-yMax, yMax])
        .range([this.innerHeight, 0]);

      this.rfYScale = this.yScale;

      const yAxis = d3.axisLeft(this.yScale)
        .ticks(7)
        .tickFormat(d => `${d >= 0 ? '+' : ''}${d.toFixed(1)}V`);

      this.yAxisGroup.call(yAxis);
      this.renderSingleTrace(0, this.innerHeight);
    }

    this.yAxisGroup.selectAll('text')
      .attr('fill', 'var(--text-dim)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10px');

    this.yAxisGroup.selectAll('line, path')
      .attr('stroke', 'rgba(0, 229, 255, 0.25)');
  }

  renderBasebandTrace(height) {
    const { bitRateBps } = this.state;
    const tb = 1 / bitRateBps;
    const tMax = this.state.timeWindowSec;

    const points = [];
    const stepCount = 300;
    for (let i = 0; i <= stepCount; i++) {
      const t = (i / stepCount) * tMax;
      const bit = this.getBitAtTime(t);
      points.push({ t, bit: bit ?? 0 });
    }

    const bYScale = d3.scaleLinear()
      .domain([-0.2, 1.2])
      .range([height, 0]);

    const lineGen = d3.line()
      .x(d => this.xScale(d.t))
      .y(d => bYScale(d.bit))
      .curve(d3.curveStepAfter);

    this.basebandGroup.selectAll('.baseband-path').remove();
    this.basebandGroup.selectAll('.baseband-label').remove();
    this.basebandGroup.selectAll('.baseband-divider').remove();

    this.basebandGroup.append('line')
      .attr('class', 'baseband-divider')
      .attr('x1', 0).attr('x2', this.innerWidth)
      .attr('y1', height + 10).attr('y2', height + 10)
      .attr('stroke', 'rgba(255, 183, 3, 0.35)')
      .attr('stroke-dasharray', '6 4');

    this.basebandGroup.append('text')
      .attr('class', 'baseband-label')
      .attr('x', 6)
      .attr('y', 12)
      .attr('fill', '#ffb703')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text('BASEBAND DIGITAL DATA: m(t)');

    this.basebandGroup.append('path')
      .attr('class', 'baseband-path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', 'url(#d3-grad-bits)')
      .attr('stroke-width', 2.5)
      .attr('d', lineGen);

    const tStart = Math.floor(this.state.timeOffsetSec / tb) * tb - this.state.timeOffsetSec;
    for (let t = tStart; t < tMax + tb; t += tb) {
      if (t >= 0 && t <= tMax) {
        const x = this.xScale(t);
        this.basebandGroup.append('line')
          .attr('class', 'baseband-divider')
          .attr('x1', x).attr('x2', x)
          .attr('y1', 0).attr('y2', height)
          .attr('stroke', 'rgba(255, 183, 3, 0.2)')
          .attr('stroke-dasharray', '2 2');

        const midT = t + tb / 2;
        if (midT <= tMax) {
          const bitVal = this.getBitAtTime(midT);
          this.basebandGroup.append('text')
            .attr('class', 'baseband-label')
            .attr('x', this.xScale(midT))
            .attr('y', bYScale(0.5))
            .attr('text-anchor', 'middle')
            .attr('fill', bitVal === 1 ? '#00ff9d' : '#94a3b8')
            .attr('font-family', 'var(--font-mono)')
            .attr('font-size', '11px')
            .attr('font-weight', '700')
            .text(bitVal);
        }
      }
    }
  }

  renderRfTrace(topY, height) {
    const { amplitudeV, fadingModel } = this.state;
    const tMax = this.state.timeWindowSec;
    const yMax = Math.max(1, amplitudeV * 1.4);

    const rfYScale = d3.scaleLinear()
      .domain([-yMax, yMax])
      .range([topY + height, topY]);

    const numPoints = 650;
    const points = [];
    const fadingUpperPoints = [];
    const fadingLowerPoints = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * tMax;
      const v = this.evalSignalAtTime(t);
      points.push({ t, v });

      if (fadingModel !== 'none') {
        const env = this.evalFadingEnvelope(t);
        fadingUpperPoints.push({ t, v: amplitudeV * env });
        fadingLowerPoints.push({ t, v: -amplitudeV * env });
      }
    }

    const lineGen = d3.line()
      .x(d => this.xScale(d.t))
      .y(d => rfYScale(d.v))
      .curve(d3.curveMonotoneX);

    this.rfGroup.selectAll('*').remove();
    this.fadingEnvelopeGroup.selectAll('*').remove();

    const fadingLabel = fadingModel === 'rayleigh'
      ? ' [RAYLEIGH FADED]'
      : fadingModel === 'rician'
      ? ` [RICIAN FADED K=${this.state.ricianK_dB}dB]`
      : '';

    this.rfGroup.append('text')
      .attr('x', 6)
      .attr('y', topY + 14)
      .attr('fill', '#00e5ff')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text(`MODULATED RF CARRIER: s(t) [${this.state.scheme}]${fadingLabel}`);

    this.rfGroup.append('line')
      .attr('x1', 0).attr('x2', this.innerWidth)
      .attr('y1', rfYScale(0)).attr('y2', rfYScale(0))
      .attr('stroke', 'rgba(0, 229, 255, 0.2)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4');

    if (fadingModel !== 'none') {
      const envLineGen = d3.line()
        .x(d => this.xScale(d.t))
        .y(d => rfYScale(d.v))
        .curve(d3.curveBasis);

      this.fadingEnvelopeGroup.append('path')
        .datum(fadingUpperPoints)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 183, 3, 0.65)')
        .attr('stroke-width', 1.6)
        .attr('stroke-dasharray', '5 3')
        .attr('d', envLineGen);

      this.fadingEnvelopeGroup.append('path')
        .datum(fadingLowerPoints)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 183, 3, 0.65)')
        .attr('stroke-width', 1.6)
        .attr('stroke-dasharray', '5 3')
        .attr('d', envLineGen);
    }

    this.rfGroup.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', 'url(#d3-grad-main)')
      .attr('stroke-width', 2.4)
      .attr('d', lineGen);
  }

  renderSingleTrace(topY, height) {
    const { amplitudeV, fadingModel } = this.state;
    const tMax = this.state.timeWindowSec;
    const yMax = Math.max(1, amplitudeV * 1.4);

    const yScale = d3.scaleLinear()
      .domain([-yMax, yMax])
      .range([height, topY]);

    const numPoints = 750;
    const points = [];
    const fadingUpperPoints = [];
    const fadingLowerPoints = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * tMax;
      const v = this.evalSignalAtTime(t);
      points.push({ t, v });

      if (fadingModel !== 'none') {
        const env = this.evalFadingEnvelope(t);
        fadingUpperPoints.push({ t, v: amplitudeV * env });
        fadingLowerPoints.push({ t, v: -amplitudeV * env });
      }
    }

    const lineGen = d3.line()
      .x(d => this.xScale(d.t))
      .y(d => yScale(d.v))
      .curve(this.state.scheme === 'SQUARE' ? d3.curveLinear : d3.curveMonotoneX);

    this.rfGroup.selectAll('*').remove();
    this.fadingEnvelopeGroup.selectAll('*').remove();

    const fadingLabel = fadingModel === 'rayleigh'
      ? ' [RAYLEIGH FADED]'
      : fadingModel === 'rician'
      ? ` [RICIAN FADED K=${this.state.ricianK_dB}dB]`
      : '';

    this.rfGroup.append('text')
      .attr('x', 6)
      .attr('y', topY + 16)
      .attr('fill', '#00e5ff')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .text(`WAVEFORM: ${this.state.scheme} [f = ${(this.state.freqHz / 1000).toFixed(2)} kHz, Vpk = ${amplitudeV.toFixed(2)} V]${fadingLabel}`);

    this.rfGroup.append('line')
      .attr('x1', 0).attr('x2', this.innerWidth)
      .attr('y1', yScale(0)).attr('y2', yScale(0))
      .attr('stroke', 'rgba(0, 229, 255, 0.25)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4');

    if (fadingModel !== 'none') {
      const envLineGen = d3.line()
        .x(d => this.xScale(d.t))
        .y(d => yScale(d.v))
        .curve(d3.curveBasis);

      this.fadingEnvelopeGroup.append('path')
        .datum(fadingUpperPoints)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 183, 3, 0.65)')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '6 4')
        .attr('d', envLineGen);

      this.fadingEnvelopeGroup.append('path')
        .datum(fadingLowerPoints)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 183, 3, 0.65)')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '6 4')
        .attr('d', envLineGen);
    }

    this.rfGroup.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', 'url(#d3-grad-main)')
      .attr('stroke-width', 2.6)
      .attr('d', lineGen);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // D3 OPEN-LOOP CONTROL SYSTEM (STALLINGS §10.1.6 PP. 276–277)
  // ─────────────────────────────────────────────────────────────────────────────
  drawOpenLoopFrame() {
    const svgEl = this.container.querySelector('#svg-openloop-stage');
    if (!svgEl) return;

    const { distanceKm, pilotTxPowerDbm, obstacleShadowDb, uplinkInterferenceDb } = this.state.openLoop;

    // Path loss: L = 20*log10(fc) + 20*log10(d) - 28 + obstacle
    const baseLoss = 20 * Math.log10(850000) + 20 * Math.log10(distanceKm) - 28.0;
    const totalLoss = baseLoss + obstacleShadowDb;

    // Mobile senses pilot: P_rx,pilot = P_pilot - totalLoss
    const sensedPilot = pilotTxPowerDbm - totalLoss;

    // Autonomous open-loop transmitter adjustment:
    // P_tx = TargetSetpoint (-90) + totalLoss (sensed inversely)
    const mobileTx = Math.min(33, Math.max(0, -90.0 + totalLoss));
    this.state.openLoop.mobileTxPowerDbm = mobileTx;

    // Received power at BS on reverse link:
    // P_rx_bs = mobileTx - (totalLoss + uplinkInterferenceDb)
    const rxAtBs = mobileTx - (totalLoss + uplinkInterferenceDb);
    this.state.openLoop.receivedPowerAtBsDbm = rxAtBs;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    // Defs & Gradients
    const defs = svg.append('defs');
    const gradForward = defs.append('linearGradient')
      .attr('id', 'ol-grad-fwd')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    gradForward.append('stop').attr('offset', '0%').attr('stop-color', '#ffb703');
    gradForward.append('stop').attr('offset', '100%').attr('stop-color', '#ea580c');

    const gradReverse = defs.append('linearGradient')
      .attr('id', 'ol-grad-rev')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    gradReverse.append('stop').attr('offset', '0%').attr('stop-color', '#00e5ff');
    gradReverse.append('stop').attr('offset', '100%').attr('stop-color', '#0070f3');

    // 1. Title Banner
    svg.append('text')
      .attr('x', 420).attr('y', 26)
      .attr('fill', '#fff')
      .attr('font-family', 'var(--font-heading)')
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('text-anchor', 'middle')
      .text('FEEDFORWARD BLOCK DIAGRAM: AUTONOMOUS SIGNAL PATH (NO FEEDBACK FROM BASE STATION)');

    // 2. Reference Pilot Beacon (Block 1)
    svg.append('rect')
      .attr('x', 30).attr('y', 55).attr('width', 150).attr('height', 70)
      .attr('fill', '#081730').attr('stroke', '#ffb703').attr('stroke-width', 1.8).attr('rx', 6);
    svg.append('text')
      .attr('x', 105).attr('y', 80)
      .attr('fill', '#ffb703').attr('font-family', 'var(--font-mono)').attr('font-size', '10px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text('PILOT BEACON r(t)');
    svg.append('text')
      .attr('x', 105).attr('y', 102)
      .attr('fill', '#fff').attr('font-family', 'var(--font-mono)').attr('font-size', '11px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text(`+${pilotTxPowerDbm.toFixed(1)} dBm Const`);

    // Arrow 1: Forward Pilot Path
    svg.append('line')
      .attr('x1', 180).attr('y1', 90).attr('x2', 260).attr('y2', 90)
      .attr('stroke', '#ffb703').attr('stroke-width', 2.5).attr('stroke-dasharray', '5 3');
    svg.append('polygon')
      .attr('points', '260,90 252,85 252,95').attr('fill', '#ffb703');
    svg.append('text')
      .attr('x', 220).attr('y', 82).attr('fill', '#ffb703').attr('font-family', 'var(--font-mono)').attr('font-size', '8px').attr('text-anchor', 'middle')
      .text('Pilot Path');

    // 3. Handset Controller (Block 2)
    svg.append('rect')
      .attr('x', 260).attr('y', 55).attr('width', 160).attr('height', 70)
      .attr('fill', '#041d24').attr('stroke', '#00e5ff').attr('stroke-width', 1.8).attr('rx', 6);
    svg.append('text')
      .attr('x', 340).attr('y', 78)
      .attr('fill', '#00e5ff').attr('font-family', 'var(--font-mono)').attr('font-size', '9.5px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text('HANDSET CONTROLLER');
    svg.append('text')
      .attr('x', 340).attr('y', 94)
      .attr('fill', '#7dd3fc').attr('font-family', 'var(--font-mono)').attr('font-size', '8px').attr('text-anchor', 'middle')
      .text(`Sensed Pilot: ${sensedPilot.toFixed(1)} dBm`);
    svg.append('text')
      .attr('x', 340).attr('y', 110)
      .attr('fill', '#00ff9d').attr('font-family', 'var(--font-mono)').attr('font-size', '8px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text('Inverse Law: P_tx ∝ 1/P_rx');

    // Arrow 2: Actuator Link
    svg.append('line')
      .attr('x1', 420).attr('y1', 90).attr('x2', 480).attr('y2', 90)
      .attr('stroke', '#00e5ff').attr('stroke-width', 2.5);
    svg.append('polygon')
      .attr('points', '480,90 472,85 472,95').attr('fill', '#00e5ff');

    // 4. Power Amplifier Actuator (Block 3)
    svg.append('rect')
      .attr('x', 480).attr('y', 55).attr('width', 140).attr('height', 70)
      .attr('fill', '#0b1329').attr('stroke', '#00ff9d').attr('stroke-width', 1.8).attr('rx', 6);
    svg.append('text')
      .attr('x', 550).attr('y', 78)
      .attr('fill', '#00ff9d').attr('font-family', 'var(--font-mono)').attr('font-size', '9.5px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text('RF POWER AMPLIFIER');
    svg.append('text')
      .attr('x', 550).attr('y', 98)
      .attr('fill', '#fff').attr('font-family', 'var(--font-mono)').attr('font-size', '12px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text(`+${mobileTx.toFixed(1)} dBm`);

    // Arrow 3: Reverse RF Wave (Mobile -> Tower)
    svg.append('line')
      .attr('x1', 620).attr('y1', 90).attr('x2', 700).attr('y2', 90)
      .attr('stroke', 'url(#ol-grad-rev)').attr('stroke-width', 3);
    svg.append('polygon')
      .attr('points', '700,90 692,85 692,95').attr('fill', '#00e5ff');

    // Animated pulses flowing forward on the arrow
    const pulseX = 620 + ((this.state.openLoop.pulseOffset * 150) % 80);
    svg.append('circle')
      .attr('cx', pulseX).attr('cy', 90).attr('r', 4.5)
      .attr('fill', '#00ff9d').attr('filter', 'drop-shadow(0 0 6px #00ff9d)');

    // 5. Base Station Receiver Output (Block 4)
    const isSuccess = Math.abs(rxAtBs - (-90)) < 3.5;
    svg.append('rect')
      .attr('x', 700).attr('y', 55).attr('width', 115).attr('height', 70)
      .attr('fill', '#041224').attr('stroke', isSuccess ? '#00ff9d' : '#ff0055').attr('stroke-width', 2).attr('rx', 6);
    svg.append('text')
      .attr('x', 757).attr('y', 78)
      .attr('fill', '#fff').attr('font-family', 'var(--font-mono)').attr('font-size', '9.5px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text('BASE STATION Rx');
    svg.append('text')
      .attr('x', 757).attr('y', 98)
      .attr('fill', isSuccess ? '#00ff9d' : '#ff0055').attr('font-family', 'var(--font-mono)').attr('font-size', '12px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text(`${rxAtBs.toFixed(1)} dBm`);

    // 6. Prominent "NO FEEDBACK PATH" Red Box
    svg.append('rect')
      .attr('x', 80).attr('y', 160).attr('width', 680).attr('height', 75)
      .attr('fill', 'rgba(255, 0, 85, 0.08)').attr('stroke', '#ff0055').attr('stroke-width', 1.8).attr('stroke-dasharray', '6 4').attr('rx', 8);

    svg.append('text')
      .attr('x', 420).attr('y', 186)
      .attr('fill', '#ff0055').attr('font-family', 'var(--font-mono)').attr('font-size', '11.5px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text('❌ STRICT FORWARD-ONLY TOPOLOGY — NO RETURN FEEDBACK LINK EXISTS');

    svg.append('text')
      .attr('x', 420).attr('y', 206)
      .attr('fill', '#cbd5e1').attr('font-family', 'var(--font-mono)').attr('font-size', '9px').attr('text-anchor', 'middle')
      .text('The Base Station NEVER sends feedback to the handset. The handset assumes reverse loss equals forward loss.');

    svg.append('text')
      .attr('x', 420).attr('y', 222)
      .attr('fill', uplinkInterferenceDb > 0 ? '#ff0055' : '#ffb703').attr('font-family', 'var(--font-mono)').attr('font-size', '9px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text(uplinkInterferenceDb > 0
        ? `⚠️ ASYMMETRIC INTERFERENCE PRESENT (+${uplinkInterferenceDb} dB)! Handset unaware → Received signal dropped to ${rxAtBs.toFixed(1)} dBm!`
        : `Reciprocal Path: Loss = ${totalLoss.toFixed(1)} dB (Dist: ${distanceKm} km, Shadow: ${obstacleShadowDb} dB)`);

    // 7. Live Telemetry Strip
    svg.append('rect')
      .attr('x', 40).attr('y', 255).attr('width', 760).attr('height', 45)
      .attr('fill', 'rgba(3, 7, 18, 0.95)').attr('stroke', 'rgba(0, 229, 255, 0.2)').attr('rx', 5);

    svg.append('text')
      .attr('x', 60).attr('y', 282)
      .attr('fill', '#7dd3fc').attr('font-family', 'var(--font-mono)').attr('font-size', '9.5px')
      .text(`Link Path Loss: ${totalLoss.toFixed(1)} dB  |  Mobile Output: +${mobileTx.toFixed(1)} dBm  |  BS Target: -90.0 dBm  |  Status: ${isSuccess ? '✓ COMPENSATED (RECIPROCAL)' : '⚠ HIGH ERROR / PACKET LOSS'}`);

    const statusPill = this.container.querySelector('#openloop-status-pill');
    if (statusPill) {
      statusPill.textContent = isSuccess ? 'AUTONOMOUS (RECIPROCAL OK)' : 'DEGRADED (UNCOMPENSATED ASYMMETRY)';
      statusPill.style.color = isSuccess ? '#00ff9d' : '#ff0055';
      statusPill.style.borderColor = isSuccess ? '#00ff9d' : '#ff0055';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // D3 CLOSED-LOOP FEEDBACK CONTROL SYSTEM (STALLINGS §10.1.6 PP. 276–277)
  // ─────────────────────────────────────────────────────────────────────────────
  drawClosedLoopFrame() {
    const svgEl = this.container.querySelector('#svg-closedloop-stage');
    if (!svgEl) return;

    const cl = this.state.closedLoop;
    const { setpointDbm, distanceKm, fadingDropDb, dopplerJitterActive, stepRateHz } = cl;

    // Simulation time advance
    const dt = 0.016;
    const baseLoss = 20 * Math.log10(850000) + 20 * Math.log10(distanceKm) - 28.0;
    const jitter = dopplerJitterActive ? Math.sin(cl.simClock * 6.0) * 4.5 : 0.0;
    const currentLoss = baseLoss + fadingDropDb + jitter;

    // Actual received signal at BS
    cl.actualRxPowerDbm = cl.mobileTxPowerDbm - currentLoss;

    // Error signal: e(t) = r(t) - y(t) = setpoint - actualRx
    cl.errorDb = setpointDbm - cl.actualRxPowerDbm;

    // High-speed step controller feedback command logic (Stallings p. 277)
    // Step command emitted at stepRateHz (800 Hz / 1600 Hz)
    const stepSpeed = stepRateHz / 1600; // normalize
    if (cl.errorDb > 0.4) {
      cl.lastCommand = '▲ +1 dB POWER UP';
      cl.mobileTxPowerDbm = Math.min(33, cl.mobileTxPowerDbm + 0.35 * stepSpeed);
    } else if (cl.errorDb < -0.4) {
      cl.lastCommand = '▼ -1 dB POWER DOWN';
      cl.mobileTxPowerDbm = Math.max(0, cl.mobileTxPowerDbm - 0.35 * stepSpeed);
    } else {
      cl.lastCommand = 'HOLD (0 dB)';
    }

    // Append to error history for dynamic graph
    cl.errorHistory.shift();
    cl.errorHistory.push(cl.errorDb);

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    // 1. Title Banner
    svg.append('text')
      .attr('x', 420).attr('y', 22)
      .attr('fill', '#fff')
      .attr('font-family', 'var(--font-heading)')
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('text-anchor', 'middle')
      .text('CLOSED-LOOP FEEDBACK CONTROL TOPOLOGY: COMPARATOR & FAST REVERSE STEPPING');

    // 2. Setpoint Reference Node (r)
    svg.append('rect')
      .attr('x', 25).attr('y', 55).attr('width', 115).attr('height', 55)
      .attr('fill', '#051829').attr('stroke', '#38bdf8').attr('stroke-width', 1.6).attr('rx', 5);
    svg.append('text')
      .attr('x', 82).attr('y', 74)
      .attr('fill', '#38bdf8').attr('font-family', 'var(--font-mono)').attr('font-size', '8.5px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text('SETPOINT r(t)');
    svg.append('text')
      .attr('x', 82).attr('y', 96)
      .attr('fill', '#fff').attr('font-family', 'var(--font-mono)').attr('font-size', '11px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text(`${setpointDbm.toFixed(1)} dBm`);

    // Arrow to Comparator
    svg.append('line')
      .attr('x1', 140).attr('y1', 82).attr('x2', 180).attr('y2', 82)
      .attr('stroke', '#38bdf8').attr('stroke-width', 2);
    svg.append('polygon')
      .attr('points', '180,82 173,78 173,86').attr('fill', '#38bdf8');
    svg.append('text')
      .attr('x', 170).attr('y', 76).attr('fill', '#38bdf8').attr('font-family', 'var(--font-mono)').attr('font-size', '11px').attr('font-weight', '700')
      .text('+');

    // 3. Summing Junction (Comparator Node Σ)
    const compX = 200;
    const compY = 82;
    const isLocked = Math.abs(cl.errorDb) < 1.0;
    svg.append('circle')
      .attr('cx', compX).attr('cy', compY).attr('r', 18)
      .attr('fill', '#02050e').attr('stroke', isLocked ? '#00ff9d' : '#ffb703').attr('stroke-width', 2.2);
    svg.append('text')
      .attr('x', compX).attr('y', compY + 5)
      .attr('fill', '#fff').attr('font-family', 'var(--font-heading)').attr('font-size', '16px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text('Σ');

    // Error output line from Comparator to Step Controller
    svg.append('line')
      .attr('x1', compX + 18).attr('y1', compY).attr('x2', 280).attr('y2', compY)
      .attr('stroke', isLocked ? '#00ff9d' : '#ff0055').attr('stroke-width', 2.5);
    svg.append('polygon')
      .attr('points', `280,${compY} 272,${compY-4} 272,${compY+4}`).attr('fill', isLocked ? '#00ff9d' : '#ff0055');

    // Error badge on the line
    svg.append('rect')
      .attr('x', 222).attr('y', compY - 18).attr('width', 52).attr('height', 15)
      .attr('fill', '#040b17').attr('stroke', isLocked ? '#00ff9d' : '#ff0055').attr('stroke-width', 1).attr('rx', 3);
    svg.append('text')
      .attr('x', 248).attr('y', compY - 7)
      .attr('fill', isLocked ? '#00ff9d' : '#ff0055').attr('font-family', 'var(--font-mono)').attr('font-size', '7.5px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text(`e=${cl.errorDb >= 0 ? '+' : ''}${cl.errorDb.toFixed(1)}dB`);

    // 4. Base Station Step Controller (Gc)
    svg.append('rect')
      .attr('x', 280).attr('y', 55).attr('width', 150).attr('height', 55)
      .attr('fill', '#041d24').attr('stroke', '#00e5ff').attr('stroke-width', 1.8).attr('rx', 5);
    svg.append('text')
      .attr('x', 355).attr('y', 72)
      .attr('fill', '#00e5ff').attr('font-family', 'var(--font-mono)').attr('font-size', '8.5px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text('BS STEP CONTROLLER');
    svg.append('text')
      .attr('x', 355).attr('y', 92)
      .attr('fill', cl.lastCommand.includes('UP') ? '#ffb703' : cl.lastCommand.includes('DOWN') ? '#38bdf8' : '#00ff9d').attr('font-family', 'var(--font-mono)').attr('font-size', '9px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text(cl.lastCommand);

    // Forward Command Feedback Link (BS -> Mobile Handset PA)
    svg.append('line')
      .attr('x1', 430).attr('y1', 82).attr('x2', 530).attr('y2', 82)
      .attr('stroke', '#00ff9d').attr('stroke-width', 2.5).attr('stroke-dasharray', '4 3');
    svg.append('polygon')
      .attr('points', '530,82 522,78 522,86').attr('fill', '#00ff9d');

    // Flying Command Bits Packet
    const cmdX = 430 + ((cl.cmdPulseOffset * 100) % 90);
    svg.append('rect')
      .attr('x', cmdX - 15).attr('y', 73).attr('width', 30).attr('height', 18)
      .attr('fill', '#00ff9d').attr('rx', 3);
    svg.append('text')
      .attr('x', cmdX).attr('y', 85)
      .attr('fill', '#02050e').attr('font-family', 'var(--font-mono)').attr('font-size', '8px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text(cl.lastCommand.includes('UP') ? '+1dB' : cl.lastCommand.includes('DOWN') ? '-1dB' : '0dB');

    // 5. Mobile Handset RF PA Actuator
    svg.append('rect')
      .attr('x', 530).attr('y', 55).attr('width', 150).attr('height', 55)
      .attr('fill', '#081730').attr('stroke', '#ffb703').attr('stroke-width', 1.8).attr('rx', 5);
    svg.append('text')
      .attr('x', 605).attr('y', 72)
      .attr('fill', '#ffb703').attr('font-family', 'var(--font-mono)').attr('font-size', '8.5px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text('MOBILE PA (ACTUATOR)');
    svg.append('text')
      .attr('x', 605).attr('y', 94)
      .attr('fill', '#fff').attr('font-family', 'var(--font-mono)').attr('font-size', '11.5px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text(`Tx: +${cl.mobileTxPowerDbm.toFixed(1)} dBm`);

    // Reverse Traffic Line: Mobile -> Channel Plant -> Base Station Receiver
    svg.append('path')
      .attr('d', `M 680 82 L 740 82 L 740 160 L 200 160 L 200 105`)
      .attr('fill', 'none').attr('stroke', 'rgba(0, 229, 255, 0.5)').attr('stroke-width', 2).attr('stroke-dasharray', '5 3');
    svg.append('polygon')
      .attr('points', '200,105 196,112 204,112').attr('fill', 'rgba(0, 229, 255, 0.8)');

    // Minus sign at feedback port of Comparator
    svg.append('text')
      .attr('x', 205).attr('y', 115).attr('fill', '#ff0055').attr('font-family', 'var(--font-mono)').attr('font-size', '13px').attr('font-weight', '800')
      .text('–');

    // Feedback Tag
    svg.append('text')
      .attr('x', 450).attr('y', 154)
      .attr('fill', '#38bdf8').attr('font-family', 'var(--font-mono)').attr('font-size', '8px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text(`FEEDBACK PATH b(t) = ACTUAL RECEIVED POWER (${cl.actualRxPowerDbm.toFixed(1)} dBm)`);

    // 6. Dynamic Real-Time Error Signal Graph (Stallings Closed Loop Tracking)
    const graphX = 60;
    const graphY = 195;
    const graphW = 720;
    const graphH = 80;

    svg.append('rect')
      .attr('x', graphX).attr('y', graphY).attr('width', graphW).attr('height', graphH)
      .attr('fill', '#030814').attr('stroke', 'rgba(0, 229, 255, 0.25)').attr('rx', 5);

    // Graph Title
    svg.append('text')
      .attr('x', graphX + 10).attr('y', graphY + 14)
      .attr('fill', '#94a3b8').attr('font-family', 'var(--font-mono)').attr('font-size', '8.5px').attr('font-weight', '700')
      .text('DYNAMIC ERROR OSCILLOSCOPE: e(t) = r(t) - y(t)  [STABILIZES AT 0 dB]');

    // Zero line
    const zeroY = graphY + graphH / 2;
    svg.append('line')
      .attr('x1', graphX).attr('x2', graphX + graphW)
      .attr('y1', zeroY).attr('y2', zeroY)
      .attr('stroke', 'rgba(0, 255, 157, 0.35)').attr('stroke-width', 1).attr('stroke-dasharray', '4 2');

    // Tolerance band (±1 dB)
    svg.append('rect')
      .attr('x', graphX).attr('y', zeroY - 10).attr('width', graphW).attr('height', 20)
      .attr('fill', 'rgba(0, 255, 157, 0.06)');

    // Line generator for error points
    const errScaleY = d3.scaleLinear()
      .domain([-15, 15])
      .range([graphY + graphH - 5, graphY + 15]);

    const errPoints = cl.errorHistory.map((err, idx) => ({
      x: graphX + (idx / (cl.errorHistory.length - 1)) * graphW,
      y: errScaleY(Math.max(-15, Math.min(15, err)))
    }));

    const errLine = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(errPoints)
      .attr('fill', 'none')
      .attr('stroke', isLocked ? '#00ff9d' : '#ff0055')
      .attr('stroke-width', 2.2)
      .attr('d', errLine);

    // 7. Telemetry Bottom Strip
    svg.append('text')
      .attr('x', 420).attr('y', 315)
      .attr('fill', '#94a3b8').attr('font-family', 'var(--font-mono)').attr('font-size', '8.5px').attr('text-anchor', 'middle')
      .text(`Loop Rate: ${stepRateHz} Hz  |  Current Loss: ${currentLoss.toFixed(1)} dB  |  Mobile PA: +${cl.mobileTxPowerDbm.toFixed(1)} dBm  |  Error: ${cl.errorDb.toFixed(2)} dB  |  Loop Status: ${isLocked ? 'LOCKED / EQUILIBRIUM' : 'ADJUSTING (COMMANDS ACTIVE)'}`);

    const statusPill = this.container.querySelector('#closedloop-status-pill');
    if (statusPill) {
      statusPill.textContent = isLocked ? 'FEEDBACK LOOP LOCKED: ERROR ≈ 0 dB' : `FEEDBACK ACTIVE: ERROR ${cl.errorDb >= 0 ? '+' : ''}${cl.errorDb.toFixed(1)} dB`;
      statusPill.style.color = isLocked ? '#00ff9d' : '#ffb703';
      statusPill.style.borderColor = isLocked ? '#00ff9d' : '#ffb703';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // D3 CDMA SPREADING & 3-FINGER RAKE RECEIVER (STALLINGS §10.4 PP. 298–304)
  // ─────────────────────────────────────────────────────────────────────────────
  drawCdmaRakeFrame() {
    const svgEl = this.container.querySelector('#svg-cdmarake-stage');
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const { user1Bit, user2Bit, user3Bit, targetUser, mrcEnabled, tau2Chips, deepFadeActive, pulseOffset } = this.state.cdmaRake;

    // Walsh Codes (N = 4 orthogonal chips)
    const W = [
      [1, 1, 1, 1],   // W1
      [1, -1, 1, -1], // W2
      [1, 1, -1, -1]  // W3
    ];

    const b = [user1Bit, user2Bit, user3Bit];
    const S1 = W[0].map(c => c * b[0]);
    const S2 = W[1].map(c => c * b[1]);
    const S3 = W[2].map(c => c * b[2]);

    // Composite linear superposition S_air = S1 + S2 + S3
    const S_air = [0, 1, 2, 3].map(i => S1[i] + S2[i] + S3[i]);

    // Target User details
    const targetIdx = targetUser - 1;
    const targetW = W[targetIdx];
    const targetExpectedBit = b[targetIdx];

    // Correlator inner product on clean composite
    const dotProduct = S_air.reduce((acc, chip, i) => acc + chip * targetW[i], 0);
    const decodedVal = dotProduct / 4;

    // Multipath path gains
    const a1 = deepFadeActive ? 0.15 : 1.0;
    const a2 = 0.72;
    const a3 = 0.48;

    // Finger outputs
    const y1 = a1 * decodedVal;
    const y2 = a2 * decodedVal;
    const y3 = a3 * decodedVal;

    // Combined output
    let combinedY;
    let diversityGainDb;
    let isError = false;

    if (mrcEnabled) {
      // Maximal Ratio Combining weights by amplitude
      combinedY = a1 * y1 + a2 * y2 + a3 * y3;
      const combinedPower = a1 * a1 + a2 * a2 + a3 * a3;
      diversityGainDb = 10 * Math.log10(combinedPower / (a1 * a1));
      isError = Math.sign(combinedY) !== Math.sign(targetExpectedBit);
    } else {
      // Single Finger Only (Finger 1)
      combinedY = y1;
      diversityGainDb = deepFadeActive ? -16.5 : 0.0;
      isError = deepFadeActive; // Eye collapses under deep Rayleigh null
    }

    const decodedBit = isError ? (targetExpectedBit > 0 ? -1 : 1) : targetExpectedBit;

    // Update Status Pills in UI
    const statusPill = this.container.querySelector('#cdmarake-status-pill');
    const diversityPill = this.container.querySelector('#cdmarake-diversity-pill');
    if (statusPill) {
      if (isError) {
        statusPill.textContent = `⚠️ BIT ERROR! DECODED: ${decodedBit > 0 ? '+1' : '-1'} (EXPECTED ${targetExpectedBit > 0 ? '+1' : '-1'}) — SINGLE FINGER FADED!`;
        statusPill.style.color = '#ff0055';
      } else {
        statusPill.textContent = `USER ${targetUser} BIT: ${decodedBit > 0 ? '+1' : '-1'} DECODED (100% ORTHOGONAL | ZERO CROSS-TALK)`;
        statusPill.style.color = '#00ff9d';
      }
    }
    if (diversityPill) {
      diversityPill.textContent = mrcEnabled
        ? `DIVERSITY GAIN: +${diversityGainDb.toFixed(1)} dB (3-FINGER MRC)`
        : `NO DIVERSITY (SINGLE FINGER): ${diversityGainDb.toFixed(1)} dB`;
      diversityPill.style.color = mrcEnabled ? 'var(--accent-cyan)' : '#ffb703';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // D3 GRAPHICS RENDERING
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Title Banner
    svg.append('text')
      .attr('x', 420).attr('y', 22)
      .attr('fill', '#fff')
      .attr('font-family', 'var(--font-heading)')
      .attr('font-size', '11.5px')
      .attr('font-weight', '700')
      .attr('text-anchor', 'middle')
      .text('CDMA WALSH CODE SPREADING & 3-FINGER RAKE MULTIPATH COMBINER (STALLINGS §10.4)');

    // 2. Transmit Section (Left: Mobiles & Spreading Multipliers)
    const userNodes = [
      { id: 1, name: 'MS-1 (Handset)', b: b[0], w: W[0], color: '#00e5ff', y: 44 },
      { id: 2, name: 'MS-2 (Phone)', b: b[1], w: W[1], color: '#c084fc', y: 100 },
      { id: 3, name: 'MS-3 (Laptop)', b: b[2], w: W[2], color: '#00ff9d', y: 156 }
    ];

    userNodes.forEach(u => {
      // Mobile Transmitter Box
      svg.append('rect')
        .attr('x', 20).attr('y', u.y).attr('width', 130).attr('height', 44)
        .attr('fill', '#041026').attr('stroke', u.color).attr('stroke-width', 1.5).attr('rx', 4);

      svg.append('text')
        .attr('x', 28).attr('y', u.y + 16)
        .attr('fill', u.color).attr('font-family', 'var(--font-mono)').attr('font-size', '8.5px').attr('font-weight', '700')
        .text(u.name);

      svg.append('text')
        .attr('x', 28).attr('y', u.y + 32)
        .attr('fill', '#fff').attr('font-family', 'var(--font-mono)').attr('font-size', '9px')
        .text(`b${u.id} = `);

      svg.append('text')
        .attr('x', 56).attr('y', u.y + 32)
        .attr('fill', u.b > 0 ? '#00ff9d' : '#ff0055').attr('font-family', 'var(--font-mono)').attr('font-size', '10px').attr('font-weight', '800')
        .text(u.b > 0 ? '+1' : '-1');

      svg.append('text')
        .attr('x', 74).attr('y', u.y + 32)
        .attr('fill', 'var(--text-dim)').attr('font-family', 'var(--font-mono)').attr('font-size', '8px')
        .text(`× W${u.id}`);

      // Arrow from Mobile to Adder Sum Node
      svg.append('line')
        .attr('x1', 150).attr('y1', u.y + 22).attr('x2', 200).attr('y2', 122)
        .attr('stroke', u.color).attr('stroke-width', 1.8).attr('stroke-dasharray', '3 2');
    });

    // Adder Sum Node (Air Superposition)
    svg.append('circle')
      .attr('cx', 205).attr('cy', 122).attr('r', 16)
      .attr('fill', '#020b18').attr('stroke', '#ffb703').attr('stroke-width', 2);
    svg.append('text')
      .attr('x', 205).attr('y', 127)
      .attr('fill', '#ffb703').attr('font-family', 'var(--font-mono)').attr('font-size', '15px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text('∑');
    svg.append('text')
      .attr('x', 205).attr('y', 148)
      .attr('fill', '#94a3b8').attr('font-family', 'var(--font-mono)').attr('font-size', '7.5px').attr('text-anchor', 'middle')
      .text('AIR SUM');

    // 3. Composite Superimposed Signal Box
    svg.append('rect')
      .attr('x', 235).attr('y', 55).attr('width', 135).attr('height', 135)
      .attr('fill', '#020612').attr('stroke', 'rgba(255, 183, 3, 0.5)').attr('stroke-width', 1.5).attr('rx', 4);

    svg.append('text')
      .attr('x', 242).attr('y', 72)
      .attr('fill', '#ffb703').attr('font-family', 'var(--font-mono)').attr('font-size', '8.5px').attr('font-weight', '700')
      .text('COMPOSITE S(t) = ∑ bᵢWᵢ');

    // Stepped plot of S_air chips inside the box
    const chipW = 26;
    const boxBaseY = 135;
    const scaleAmp = 10;
    let stepPath = `M ${250} ${boxBaseY - S_air[0] * scaleAmp}`;
    S_air.forEach((val, idx) => {
      const cx = 250 + idx * chipW;
      const cy = boxBaseY - val * scaleAmp;
      stepPath += ` L ${cx + chipW} ${cy}`;
      if (idx < 3) {
        const nextCy = boxBaseY - S_air[idx + 1] * scaleAmp;
        stepPath += ` L ${cx + chipW} ${nextCy}`;
      }

      // Chip value text
      svg.append('text')
        .attr('x', cx + chipW / 2).attr('y', cy - 4)
        .attr('fill', '#fff').attr('font-family', 'var(--font-mono)').attr('font-size', '7.5px').attr('text-anchor', 'middle')
        .text(val > 0 ? `+${val}` : `${val}`);
    });

    // Zero dashed line
    svg.append('line')
      .attr('x1', 246).attr('y1', boxBaseY).attr('x2', 360).attr('y2', boxBaseY)
      .attr('stroke', 'rgba(255,255,255,0.15)').attr('stroke-dasharray', '2 2');

    svg.append('path')
      .attr('d', stepPath)
      .attr('fill', 'none').attr('stroke', '#ffb703').attr('stroke-width', 2.2);

    svg.append('text')
      .attr('x', 302).attr('y', 178)
      .attr('fill', 'var(--text-dim)').attr('font-family', 'var(--font-mono)').attr('font-size', '7.5px').attr('text-anchor', 'middle')
      .text('4 Chips / Bit (1.2288 Mcps)');

    // 4. Multipath Channel (Direct Ray, Building Reflection, Diffraction)
    // Ray 1: Direct Path (Line-of-Sight)
    svg.append('line')
      .attr('x1', 370).attr('y1', 75).attr('x2', 510).attr('y2', 75)
      .attr('stroke', deepFadeActive ? '#ff0055' : '#00e5ff')
      .attr('stroke-width', deepFadeActive ? 1.2 : 2.5)
      .attr('stroke-dasharray', deepFadeActive ? '3 3' : 'none');
    svg.append('polygon')
      .attr('points', '510,75 502,71 502,79').attr('fill', deepFadeActive ? '#ff0055' : '#00e5ff');
    svg.append('text')
      .attr('x', 440).attr('y', 68)
      .attr('fill', deepFadeActive ? '#ff0055' : '#00e5ff').attr('font-family', 'var(--font-mono)').attr('font-size', '8px').attr('text-anchor', 'middle')
      .text(deepFadeActive ? 'Ray 1: DEEP NULL (a₁=0.15)' : 'Ray 1: LOS (a₁=1.0, τ₁=0)');

    // Ray 2: Building Reflection (Scatterer 1)
    svg.append('rect')
      .attr('x', 425).attr('y', 105).attr('width', 30).attr('height', 24)
      .attr('fill', '#09152b').attr('stroke', '#ffb703').attr('stroke-width', 1).attr('rx', 2);
    svg.append('text')
      .attr('x', 440).attr('y', 120)
      .attr('fill', '#ffb703').attr('font-family', 'var(--font-mono)').attr('font-size', '7.5px').attr('text-anchor', 'middle')
      .text('🏢 Bldg');

    svg.append('path')
      .attr('d', 'M 370 120 L 425 120 M 455 120 L 510 120')
      .attr('fill', 'none').attr('stroke', '#ffb703').attr('stroke-width', 1.8).attr('stroke-dasharray', '4 2');
    svg.append('polygon')
      .attr('points', '510,120 502,116 502,124').attr('fill', '#ffb703');
    svg.append('text')
      .attr('x', 485).attr('y', 114)
      .attr('fill', '#ffb703').attr('font-family', 'var(--font-mono)').attr('font-size', '7.5px')
      .text(`Ray 2 (τ₂=${tau2Chips.toFixed(1)}Tc)`);

    // Ray 3: Diffracted Path (Scatterer 2)
    svg.append('rect')
      .attr('x', 425).attr('y', 150).attr('width', 30).attr('height', 24)
      .attr('fill', '#081e14').attr('stroke', '#00ff9d').attr('stroke-width', 1).attr('rx', 2);
    svg.append('text')
      .attr('x', 440).attr('y', 165)
      .attr('fill', '#00ff9d').attr('font-family', 'var(--font-mono)').attr('font-size', '7.5px').attr('text-anchor', 'middle')
      .text('⛰️ Hill');

    svg.append('path')
      .attr('d', 'M 370 165 L 425 165 M 455 165 L 510 165')
      .attr('fill', 'none').attr('stroke', '#00ff9d').attr('stroke-width', 1.8).attr('stroke-dasharray', '4 2');
    svg.append('polygon')
      .attr('points', '510,165 502,161 502,169').attr('fill', '#00ff9d');
    svg.append('text')
      .attr('x', 485).attr('y', 160)
      .attr('fill', '#00ff9d').attr('font-family', 'var(--font-mono)').attr('font-size', '7.5px')
      .text(`Ray 3 (τ₃=3.0Tc)`);

    // Pulsing traveling packets along the rays
    const p1X = 370 + ((pulseOffset * 140) % 135);
    svg.append('circle').attr('cx', p1X).attr('cy', 75).attr('r', 3).attr('fill', deepFadeActive ? '#ff0055' : '#00e5ff');

    const p2X = 370 + (((pulseOffset + 0.3) * 140) % 135);
    svg.append('circle').attr('cx', p2X).attr('cy', 120).attr('r', 3).attr('fill', '#ffb703');

    const p3X = 370 + (((pulseOffset + 0.6) * 140) % 135);
    svg.append('circle').attr('cx', p3X).attr('cy', 165).attr('r', 3).attr('fill', '#00ff9d');

    // 5. 3-Finger RAKE Receiver Correlators
    const fingers = [
      { id: 1, name: 'Finger 1 (Delay = 0)', y: 55, a: a1, outY: y1, color: deepFadeActive ? '#ff0055' : '#00e5ff' },
      { id: 2, name: `Finger 2 (Delay = -${tau2Chips.toFixed(1)}Tc)`, y: 105, a: a2, outY: y2, color: '#ffb703' },
      { id: 3, name: 'Finger 3 (Delay = -3.0Tc)', y: 155, a: a3, outY: y3, color: '#00ff9d' }
    ];

    fingers.forEach(f => {
      svg.append('rect')
        .attr('x', 510).attr('y', f.y).attr('width', 150).attr('height', 40)
        .attr('fill', '#020a1c').attr('stroke', f.color).attr('stroke-width', 1.5).attr('rx', 4);

      svg.append('text')
        .attr('x', 518).attr('y', f.y + 14)
        .attr('fill', f.color).attr('font-family', 'var(--font-mono)').attr('font-size', '8px').attr('font-weight', '700')
        .text(f.name);

      svg.append('text')
        .attr('x', 518).attr('y', f.y + 28)
        .attr('fill', '#fff').attr('font-family', 'var(--font-mono)').attr('font-size', '8px')
        .text(`⟨r(t), W${targetUser}⟩ → `);

      svg.append('text')
        .attr('x', 605).attr('y', f.y + 28)
        .attr('fill', f.outY > 0 ? '#00ff9d' : '#ff0055').attr('font-family', 'var(--font-mono)').attr('font-size', '8.5px').attr('font-weight', '800')
        .text(`${f.outY >= 0 ? '+' : ''}${f.outY.toFixed(2)}`);

      // Bus line from finger to MRC Combiner
      svg.append('line')
        .attr('x1', 660).attr('y1', f.y + 20).attr('x2', 705).attr('y2', 115)
        .attr('stroke', f.color).attr('stroke-width', 1.5).attr('stroke-dasharray', '2 2');
    });

    // 6. MRC Combiner Junction & Decision Block
    svg.append('circle')
      .attr('cx', 715).attr('cy', 115).attr('r', 16)
      .attr('fill', '#030c20').attr('stroke', mrcEnabled ? '#00ff9d' : '#ffb703').attr('stroke-width', 2);
    svg.append('text')
      .attr('x', 715).attr('y', 120)
      .attr('fill', mrcEnabled ? '#00ff9d' : '#ffb703').attr('font-family', 'var(--font-mono)').attr('font-size', '13px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text(mrcEnabled ? 'MRC' : 'SEL');

    // Decision Slicer Box
    svg.append('rect')
      .attr('x', 742).attr('y', 80).attr('width', 85).attr('height', 70)
      .attr('fill', isError ? '#21050e' : '#041d18')
      .attr('stroke', isError ? '#ff0055' : '#00ff9d')
      .attr('stroke-width', 2).attr('rx', 5);

    svg.append('text')
      .attr('x', 784).attr('y', 96)
      .attr('fill', 'var(--text-dim)').attr('font-family', 'var(--font-mono)').attr('font-size', '7.5px').attr('text-anchor', 'middle')
      .text(`RECOVERED b${targetUser}`);

    svg.append('text')
      .attr('x', 784).attr('y', 122)
      .attr('fill', isError ? '#ff0055' : '#00ff9d').attr('font-family', 'var(--font-mono)').attr('font-size', '18px').attr('font-weight', '800').attr('text-anchor', 'middle')
      .text(decodedBit > 0 ? '+1' : '-1');

    svg.append('text')
      .attr('x', 784).attr('y', 140)
      .attr('fill', isError ? '#ff0055' : '#00ff9d').attr('font-family', 'var(--font-mono)').attr('font-size', '7px').attr('font-weight', '700').attr('text-anchor', 'middle')
      .text(isError ? 'BIT ERROR!' : '✓ CLEAN SNR');

    // 7. Bottom Oscilloscope Strip: Correlator Integration Trace (Orthogonality Proof)
    const scopeX = 30;
    const scopeY = 220;
    const scopeW = 780;
    const scopeH = 155;

    svg.append('rect')
      .attr('x', scopeX).attr('y', scopeY).attr('width', scopeW).attr('height', scopeH)
      .attr('fill', '#020612').attr('stroke', 'rgba(0, 229, 255, 0.25)').attr('rx', 6);

    svg.append('text')
      .attr('x', scopeX + 14).attr('y', scopeY + 18)
      .attr('fill', '#00e5ff').attr('font-family', 'var(--font-mono)').attr('font-size', '9.5px').attr('font-weight', '700')
      .text(`CORRELATOR ACCUMULATOR: ∫₀ᵀ S(t) · W${targetUser}(t) dt — PROVING WALSH ORTHOGONALITY (STALLINGS §10.4)`);

    // Draw stepped correlation sum across 4 chips
    let runningAccum = 0;
    const accumPoints = [{ c: 0, val: 0 }];
    for (let c = 0; c < 4; c++) {
      const term = S_air[c] * targetW[c];
      runningAccum += term;
      accumPoints.push({ c: c + 1, val: runningAccum, term });
    }

    const scXScale = d3.scaleLinear().domain([0, 4]).range([scopeX + 60, scopeX + scopeW - 40]);
    const scYScale = d3.scaleLinear().domain([-5, 5]).range([scopeY + scopeH - 20, scopeY + 35]);

    // Zero line
    svg.append('line')
      .attr('x1', scopeX + 40).attr('x2', scopeX + scopeW - 20)
      .attr('y1', scYScale(0)).attr('y2', scYScale(0))
      .attr('stroke', 'rgba(255, 255, 255, 0.2)').attr('stroke-dasharray', '3 3');

    // Expected target level lines (+4 and -4)
    svg.append('line')
      .attr('x1', scopeX + 40).attr('x2', scopeX + scopeW - 20)
      .attr('y1', scYScale(4)).attr('y2', scYScale(4))
      .attr('stroke', 'rgba(0, 255, 157, 0.35)').attr('stroke-dasharray', '2 2');
    svg.append('text')
      .attr('x', scopeX + 48).attr('y', scYScale(4) - 4)
      .attr('fill', '#00ff9d').attr('font-family', 'var(--font-mono)').attr('font-size', '8px')
      .text('+4 (Bit 1 Target)');

    svg.append('line')
      .attr('x1', scopeX + 40).attr('x2', scopeX + scopeW - 20)
      .attr('y1', scYScale(-4)).attr('y2', scYScale(-4))
      .attr('stroke', 'rgba(255, 0, 85, 0.35)').attr('stroke-dasharray', '2 2');
    svg.append('text')
      .attr('x', scopeX + 48).attr('y', scYScale(-4) + 10)
      .attr('fill', '#ff0055').attr('font-family', 'var(--font-mono)').attr('font-size', '8px')
      .text('-4 (Bit 0 Target)');

    // Stepped line of accumulator
    let accumPath = `M ${scXScale(0)} ${scYScale(0)}`;
    for (let i = 1; i < accumPoints.length; i++) {
      const pPrev = accumPoints[i - 1];
      const pCur = accumPoints[i];
      const prevX = scXScale(pPrev.c);
      const curX = scXScale(pCur.c);
      const curY = scYScale(pCur.val);

      accumPath += ` L ${curX} ${curY}`;

      // Mark points
      svg.append('circle')
        .attr('cx', curX).attr('cy', curY).attr('r', 4.5)
        .attr('fill', pCur.val > 0 ? '#00ff9d' : pCur.val < 0 ? '#ff0055' : '#ffb703')
        .attr('stroke', '#fff').attr('stroke-width', 1.2);

      // Label chip step calculation
      svg.append('text')
        .attr('x', (prevX + curX) / 2).attr('y', curY - 7)
        .attr('fill', '#fff').attr('font-family', 'var(--font-mono)').attr('font-size', '8.5px').attr('font-weight', '700').attr('text-anchor', 'middle')
        .text(`Chip ${i}: S=${S_air[i-1]} × W${targetUser}=${targetW[i-1]} → Accum=${pCur.val > 0 ? '+' : ''}${pCur.val}`);
    }

    svg.append('path')
      .attr('d', accumPath)
      .attr('fill', 'none').attr('stroke', '#00e5ff').attr('stroke-width', 2.8);

    // Bottom telemetry summary text
    svg.append('text')
      .attr('x', scopeX + scopeW / 2).attr('y', scopeY + scopeH - 6)
      .attr('fill', '#94a3b8').attr('font-family', 'var(--font-mono)').attr('font-size', '8px').attr('text-anchor', 'middle')
      .text(`Target User ${targetUser} (W${targetUser}): Accumulator Sum = ${runningAccum > 0 ? '+' : ''}${runningAccum} / 4 = ${decodedVal > 0 ? '+1' : '-1'}  |  Interfering Users ⟨W_i, W_j⟩ = 0 (Completely Cancelled)`);
  }
}

