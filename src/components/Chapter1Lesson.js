/**
 * SignalLab — Chapter 1: Introduction (Interactive Lesson Module)
 * William Stallings, 2nd Edition (pp. 1-12)
 */

export function renderChapter1(container, state, progressManager) {
  container.innerHTML = `
    <div class="lesson-container">
      <!-- Section Selector Tabs -->
      <div class="lesson-nav-tabs">
        <button class="lesson-tab-btn ${state.activeSectionId === 'sec-1.1' ? 'active' : ''}" data-sec="sec-1.1">
          1.1 Wireless History & Milestones
        </button>
        <button class="lesson-tab-btn ${state.activeSectionId === 'sec-1.2' ? 'active' : ''}" data-sec="sec-1.2">
          1.2 Cellular Revolution & Growth
        </button>
        <button class="lesson-tab-btn ${state.activeSectionId === 'sec-1.6' ? 'active' : ''}" data-sec="sec-1.6">
          1.6 The Trouble with Wireless
        </button>
        <button class="lesson-tab-btn ${state.activeSectionId === 'sec-1.quiz' ? 'active' : ''}" data-sec="sec-1.quiz">
          Concept Check & Review
        </button>
      </div>

      <div class="lesson-body" id="ch1-content">
        ${getSectionContent(state.activeSectionId || 'sec-1.1')}
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
      const contentEl = container.querySelector('#ch1-content');
      if (contentEl) {
        contentEl.innerHTML = getSectionContent(secId);
        attachSubEvents(container, secId, progressManager);
      }
    });
  });

  attachSubEvents(container, state.activeSectionId || 'sec-1.1', progressManager);
}

function getSectionContent(secId) {
  switch (secId) {
    case 'sec-1.1':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 1.1 — TEXTBOOK PP. 2–3</div>
          <h2 class="lesson-title">Wireless Comes of Age: Electromagnetic Spectrum & Evolution</h2>
          <p class="lesson-text">
            Wireless communications began with James Clerk Maxwell's electromagnetic theory (1865) and Heinrich Hertz's radio wave experiments (1887). In 1896, <strong>Guglielmo Marconi</strong> patented the wireless telegraph, demonstrating transatlantic transmission in 1901 over 3,200 km.
          </p>
          <div class="callout-box">
            <strong>Key Principle (Stallings 2e):</strong> Higher operational carrier frequencies provide wider channel bandwidths, enabling significantly higher data rates and aggregate throughput, but suffer greater attenuation and atmospheric absorption.
          </div>

          <!-- Interactive Milestone Explorer (Figure 1.1) -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>FIGURE 1.1: SPECTRUM MIGRATION & HISTORICAL MILESTONES</span>
              <span class="panel-tag">CLICK A MILESTONE TO INSPECT SPECTRUM ALLOCATION</span>
            </div>
            
            <div class="spectrum-interactive-grid">
              <div class="milestone-btn active" data-freq="30 MHz" data-year="1930s" data-desc="Shortwave AM radio & early mobile 2-way police dispatch. Ionospheric skywave reflection enabled long distance with low data rates.">
                <span class="m-year">1930s</span>
                <span class="m-tech">Shortwave Radio</span>
                <span class="m-freq">~30 MHz</span>
              </div>
              <div class="milestone-btn" data-freq="300 MHz" data-year="1950s" data-desc="VHF/UHF terrestrial broadcast television and FM sound radio broadcasting. Line-of-sight propagation established.">
                <span class="m-year">1950s</span>
                <span class="m-tech">FM & TV Broadcast</span>
                <span class="m-freq">~300 MHz</span>
              </div>
              <div class="milestone-btn" data-freq="3 GHz" data-year="1980s" data-desc="First-generation (1G) AMPS analog cellular mobile telephony and C-band communications satellites.">
                <span class="m-year">1980s</span>
                <span class="m-tech">1G Cellular (AMPS)</span>
                <span class="m-freq">800–900 MHz</span>
              </div>
              <div class="milestone-btn" data-freq="2.4 GHz" data-year="1990s" data-desc="2G Digital Cellular (GSM/IS-95 CDMA) and IEEE 802.11b Wi-Fi in the unlicensed 2.4 GHz ISM band.">
                <span class="m-year">1990s</span>
                <span class="m-tech">2G & Wi-Fi (802.11)</span>
                <span class="m-freq">1.8–2.4 GHz</span>
              </div>
              <div class="milestone-btn" data-freq="5.8 GHz" data-year="2000s" data-desc="3G broadband (CDMA2000, W-CDMA), 802.11a/g Wi-Fi, and fixed WiMAX IEEE 802.16 broadband wireless loops.">
                <span class="m-year">2000s</span>
                <span class="m-tech">3G & WiMAX Broadband</span>
                <span class="m-freq">2.1–5.8 GHz</span>
              </div>
            </div>

            <!-- Dynamic Spectrum Detail Box -->
            <div class="spectrum-detail-card" id="milestone-detail">
              <div class="detail-header">
                <span class="detail-title" id="m-detail-tech">Shortwave Radio & Early Dispatch</span>
                <span class="detail-badge" id="m-detail-freq">CARRIER: ~30 MHz</span>
              </div>
              <p class="detail-desc" id="m-detail-text">
                Shortwave AM radio & early mobile 2-way police dispatch. Ionospheric skywave reflection enabled long distance with low data rates.
              </p>
            </div>
          </div>
        </div>
      `;

    case 'sec-1.2':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 1.2 — TEXTBOOK PP. 3–5</div>
          <h2 class="lesson-title">The Cellular Revolution & Exponential Subscriber Growth</h2>
          <p class="lesson-text">
            In 1990, cellular phone subscribers worldwide numbered approximately <strong>11 million</strong>. By 2002, worldwide mobile phone subscribers officially surpassed fixed wireline subscribers for the first time in human history.
          </p>

          <!-- Interactive Cellular Growth Graph -->
          <div class="interactive-panel">
            <div class="panel-header">
              <span>GLOBAL MOBILE VS FIXED LINE TELEPHONY (1990–2010 STALLINGS DATA)</span>
              <span class="panel-tag">HOVER OR DRAG SLIDER TO OBSERVE CROSSOVER</span>
            </div>

            <div class="growth-chart-container">
              <svg viewBox="0 0 700 240" class="growth-svg" id="growth-chart">
                <defs>
                  <linearGradient id="cell-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="#00e5ff" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <!-- Grid lines -->
                <line x1="50" y1="20" x2="680" y2="20" stroke="rgba(255,255,255,0.06)" />
                <line x1="50" y1="70" x2="680" y2="70" stroke="rgba(255,255,255,0.06)" />
                <line x1="50" y1="120" x2="680" y2="120" stroke="rgba(255,255,255,0.06)" />
                <line x1="50" y1="170" x2="680" y2="170" stroke="rgba(255,255,255,0.06)" />
                <line x1="50" y1="210" x2="680" y2="210" stroke="rgba(255,255,255,0.2)" />
                
                <!-- Axis labels -->
                <text x="15" y="25" fill="#64748b" font-size="11" font-family="monospace">1.5B</text>
                <text x="15" y="75" fill="#64748b" font-size="11" font-family="monospace">1.0B</text>
                <text x="15" y="125" fill="#64748b" font-size="11" font-family="monospace">500M</text>
                <text x="15" y="175" fill="#64748b" font-size="11" font-family="monospace">100M</text>

                <!-- Wireline Line (gray) -->
                <path d="M 60 170 C 200 160, 350 145, 450 135 C 550 130, 620 128, 660 125" fill="none" stroke="#64748b" stroke-width="2.5" stroke-dasharray="4 4" />
                <text x="490" y="125" fill="#94a3b8" font-size="11" font-family="sans-serif">Fixed Wireline</text>

                <!-- Mobile Curve (Cyan) -->
                <path d="M 60 205 C 180 200, 300 185, 410 135 C 490 85, 580 40, 660 25" fill="none" stroke="#00e5ff" stroke-width="3.5" />
                
                <!-- Crossover Point -->
                <circle cx="410" cy="135" r="6" fill="#ff0055" stroke="#ffffff" stroke-width="2" />
                <text x="350" y="115" fill="#ff0055" font-size="11" font-weight="700" font-family="sans-serif">2002 Crossover Point</text>
              </svg>
            </div>

            <div class="chart-stats-grid">
              <div class="stat-card">
                <span class="stat-val">11 Million</span>
                <span class="stat-lbl">1990 Global Mobile Users</span>
              </div>
              <div class="stat-card highlight">
                <span class="stat-val">Year 2002</span>
                <span class="stat-lbl">Mobile Outnumbers Fixed-Line</span>
              </div>
              <div class="stat-card">
                <span class="stat-val">> 2.5 Billion</span>
                <span class="stat-lbl">Stallings 2e Projections</span>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'sec-1.6':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">SECTION 1.6 — TEXTBOOK PP. 7–9</div>
          <h2 class="lesson-title">The Trouble with Wireless: Fundamental Physical Impairments</h2>
          <p class="lesson-text">
            Unlike wired media (copper twisted-pair, coaxial cable, optical fiber) where signals are shielded inside a guided physical waveguide, <strong>wireless transmission is unguided</strong>. Radiated electromagnetic waves propagate through an open, uncontrolled atmosphere subject to severe physical impairments.
          </p>

          <div class="impairment-grid">
            <div class="impairment-card">
              <div class="imp-icon">📡</div>
              <div class="imp-title">Path Loss & Attenuation</div>
              <div class="imp-desc">
                Signal strength falls off rapidly as the inverse square of distance ($1/d^2$ in free space, often $1/d^4$ in urban clutter). High carrier frequencies attenuate even faster.
              </div>
              <div class="imp-solution">Stallings Solution: Ch. 5 Link Budgets & Antenna Gain</div>
            </div>

            <div class="impairment-card">
              <div class="imp-icon">🏙️</div>
              <div class="imp-title">Multipath Fading</div>
              <div class="imp-desc">
                Obstacles cause reflections, diffraction, and scattering. Multiple signal replicas arrive at the receiver with different delays and phases, destructively canceling each other.
              </div>
              <div class="imp-solution">Stallings Solution: Ch. 5 Rayleigh Fading & Ch. 7 Spread Spectrum</div>
            </div>

            <div class="impairment-card">
              <div class="imp-icon">⚡</div>
              <div class="imp-title">Interference & Thermal Noise</div>
              <div class="imp-desc">
                Unlicensed spectrum bands (2.4 GHz ISM) are congested with microwave ovens, cordless phones, and neighboring Wi-Fi transmitters, adding severe non-Gaussian noise.
              </div>
              <div class="imp-solution">Stallings Solution: Ch. 8 FEC, CRC & Ch. 14 CSMA/CA</div>
            </div>

            <div class="impairment-card">
              <div class="imp-icon">🔒</div>
              <div class="imp-title">Broadcast Security Exposure</div>
              <div class="imp-desc">
                Anyone with an antenna within line-of-sight can intercept radiated frames. Eavesdropping, packet spoofing, and rogue access points are inherent risks.
              </div>
              <div class="imp-solution">Stallings Solution: Ch. 12 WTLS & Ch. 14 WPA/802.11i Security</div>
            </div>
          </div>
        </div>
      `;

    case 'sec-1.quiz':
      return `
        <div class="lesson-card">
          <div class="lesson-badge">CHAPTER 1 REVIEW & CONCEPTUAL CHECK</div>
          <h2 class="lesson-title">Diagnostic Self-Assessment (Stallings 2e Review Questions)</h2>
          <p class="lesson-text">
            Validate your mastery of Chapter 1 foundational concepts before advancing to Chapter 2 Transmission Fundamentals.
          </p>

          <div class="quiz-container" id="ch1-quiz">
            <div class="quiz-question-box" data-q="1">
              <div class="q-number">QUESTION 1 (STALLINGS §1.1)</div>
              <div class="q-text">What is the primary technological trade-off as wireless systems migrate to higher carrier frequencies?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="true">A. Higher frequencies yield wider bandwidths and higher data rates, but suffer higher propagation loss and atmospheric absorption.</button>
                <button class="q-opt" data-correct="false">B. Higher frequencies travel greater distances and penetrate walls more effectively.</button>
                <button class="q-opt" data-correct="false">C. Higher frequencies eliminate multipath fading completely.</button>
                <button class="q-opt" data-correct="false">D. Higher frequencies require larger antenna structures.</button>
              </div>
              <div class="q-feedback"></div>
            </div>

            <div class="quiz-question-box" data-q="2" style="margin-top: 16px;">
              <div class="q-number">QUESTION 2 (STALLINGS §1.2)</div>
              <div class="q-text">In approximately what year did worldwide mobile phone subscribers surpass fixed wireline telephone lines?</div>
              <div class="q-options">
                <button class="q-opt" data-correct="false">A. 1990</button>
                <button class="q-opt" data-correct="false">B. 1996</button>
                <button class="q-opt" data-correct="true">C. 2002</button>
                <button class="q-opt" data-correct="false">D. 2010</button>
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
  // Milestone click handlers
  if (secId === 'sec-1.1') {
    const mBtns = container.querySelectorAll('.milestone-btn');
    const techEl = container.querySelector('#m-detail-tech');
    const freqEl = container.querySelector('#m-detail-freq');
    const descEl = container.querySelector('#m-detail-text');

    mBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        mBtns.forEach(b => b.classList.remove('active'));
        const cur = e.currentTarget;
        cur.classList.add('active');
        if (techEl) techEl.textContent = `${cur.querySelector('.m-year').textContent} — ${cur.querySelector('.m-tech').textContent}`;
        if (freqEl) freqEl.textContent = `CARRIER BAND: ${cur.getAttribute('data-freq')}`;
        if (descEl) descEl.textContent = cur.getAttribute('data-desc');
      });
    });
  }

  // Quiz evaluation
  if (secId === 'sec-1.quiz') {
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
            fb.innerHTML = `<span style="color: var(--status-ready); font-weight: 600;">✓ Correct!</span> Verified from William Stallings Chapter 1.`;
          } else {
            opt.classList.add('wrong');
            fb.innerHTML = `<span style="color: var(--status-danger); font-weight: 600;">✗ Incorrect.</span> Review the section text above.`;
          }
        });
      });
    });
  }
}
