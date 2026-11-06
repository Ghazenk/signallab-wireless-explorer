# SignalLab — Full Technical & Educational Audit Report
**Phase 2, Task 1 — Completed**

> **Project:** SignalLab — Wireless Communications Explorer  
> **Local path:** `C:\Users\ghaze\Documents\github_projects\signallab-wireless-explorer`  
> **GitHub:** https://github.com/Ghazenk/signallab-wireless-explorer  
> **Live deployment:** https://signallab-wireless-explorer.vercel.app/  
> **Textbook:** *Wireless Communications and Networks (2nd Edition)* — William Stallings  
> **Audit date:** 2026-11-06

---

## 1. Current Application Status

The application is a **Phase 1 foundation** — a correctly built, deployable single-page engineering dashboard with no lesson content implemented. It is not a learning application yet; it is the structural container that lessons will eventually populate.

| Item | Status |
|---|---|
| Local build | ✅ Clean — `vite build` exits 0, 0 errors, 0 warnings |
| Bundle size | 47.55 kB JS (13.56 kB gzip), 11.45 kB CSS |
| Vercel deployment | ✅ HTTP 200. Serving correct Phase 1 bundle |
| Git history | ✅ Single commit `c3bbf88`, branch `main`, working tree clean |
| PDF excluded from Git | ✅ Not tracked |
| `node_modules` / `dist` excluded | ✅ Not tracked |
| Sensitive credentials | ✅ None found |

---

## 2. Features Working Correctly

### ✅ Application Shell & Layout
- Three-column dashboard layout renders correctly: left navigator, central workspace, right concept panel.
- Bottom timeline bar with telemetry logger renders correctly.
- Dark navy background, cyan/blue accents, monospace labels — all correct.
- CSS variables and design tokens in `theme.css` are well-structured.

### ✅ Left Navigator (`Navigator.js`)
- Renders all 15 chapters across 4 parts using verified `textbookData.js` data.
- Part headers with book page numbers display correctly.
- Chapter rows with STAGED / PLANNED badges display correctly.
- **Chapter expand/collapse** works — clicking a chapter row toggles its section list.
- **Chapter selection** works — clicking sets `state.activeChapterId` via `progressManager`.
- **Section selection** works — clicking a section item sets both `activeChapterId` and `activeSectionId`.
- **Search/filter** works — input filters chapters and sections by title or section number in real time.
- Chapters 1 and 2 are pre-expanded on load.
- Active chapter and section highlighting updates on state change.

### ✅ State Management (`learningProgress.js`)
- `localStorage` persistence using key `signallab_learning_progress_v1` — saves and restores on page reload.
- Subscriber/notify pattern correctly propagates state changes to all components.
- `updateSimParams`, `setActiveChapter`, `setActiveSection`, `setActiveTab`, `togglePlayPause`, `addLog` — all implemented correctly.
- Telemetry log capped at 100 entries (FIFO eviction).

### ✅ Simulation Engine (`engine.js`)
- `requestAnimationFrame` loop running. `simEngine.start()` called on boot.
- Tab-switch protection: `dt < 0.25` guard prevents large time jumps.
- `setTimeScale(scale)` clamps to `[0.1, 10.0]` — correct.
- `step(0.05)` and `reset()` methods are implemented.
- `subscribe()` / `notify()` pattern — components can listen to sim ticks.

### ✅ Timeline / Telemetry Bar (`Timeline.js`)
- **PLAY/PAUSE** button works — calls `progressManager.togglePlayPause()` and `simEngine.setRunning()`. Button label updates correctly.
- **STEP** button works — calls `simEngine.step(0.05)` which advances time by 50 ms.
- **RESET** button works — calls `simEngine.reset()` and logs to telemetry.
- **Speed buttons (0.5x / 1.0x / 2.0x)** work — call `simEngine.setTimeScale()` and persist to state.
- **Simulation clock display** (`SIM T:`) updates live from engine tick subscription.
- Telemetry log stream updates live when state changes.

### ✅ Right Concept Panel (`ConceptPanel.js`)
- Renders dynamically based on the currently selected chapter.
- Shows textbook location, book page and PDF page ranges.
- Shows `keyFormulas` for chapters that have them (currently only Chapter 2).
- Shows verified section breakdown with book page numbers.
- Shows appendices for chapters that have them.
- Re-renders on every chapter/section change.

### ✅ Metric Cards — Mathematical Formulas
- **Shannon Capacity**: `C = B × log₂(1 + SNR_linear)` where `SNR_linear = 10^(snr/10)` — **mathematically correct**.
- **Nyquist Maximum Rate**: `C = 2 × B × log₂(M)` with M=2 (binary) — **correct for binary signaling**.
- **Free Space Path Loss**: `L = 20×log₁₀(4πdf/c)` — **correct** (equivalent to the standard `20log₁₀(d) + 20log₁₀(f) − 147.55 dB` form).
- All three metric card values update when sliders change.

### ✅ Utility Functions
- `formatFrequency()` — correctly auto-scales Hz / kHz / MHz / GHz.
- `formatBitrate()` — correctly auto-scales bps / kbps / Mbps / Gbps.
- `formatDb()` / `formatDbm()` — correct sign prefix (+/−).
- `formatTime()` — `MM:SS.mmm` format correct.
- `fourierSquareWave()` in `mathUtils.js` — correct Fourier series for odd harmonics.
- `pointsToSvgPath()` — correct L-command polyline generation.

### ✅ Build & Deployment Pipeline
- `vite build` — 0 errors, 0 warnings, deterministic output.
- Vercel serving latest commit (last-modified `Fri, 06 Nov 2026 02:19:41 GMT`).
- Asset filenames match Vercel CDN (`index-BxFQkAN3.js`, `index-_6O5aFFw.css`).

---

## 3. Features Not Working

### 🔴 CRITICAL — Oscilloscope Does Not Respond to Carrier Frequency

**File:** [`Workspace.js` lines 268–276](file:///C:/Users/ghaze/Documents/github_projects/signallab-wireless-explorer/src/components/Workspace.js#L268-L276)

```js
const points = generateWaveformPoints({
  width: 800, height: 240, time,
  freq: 3.5,          // ← HARDCODED. Ignores state.simParams.carrierFreqHz entirely.
  amplitude: 65,
  harmonics: this.harmonics,
  snrDb: state.simParams.snrDb
});
```

**Impact:** Moving the Carrier Frequency slider (0.8–5.8 GHz) has **zero effect** on the oscilloscope waveform. The waveform is a decorative animation, not a teaching simulation. The SNR slider *does* affect the noise amplitude on the waveform (the `snrDb` parameter is passed correctly), but carrier frequency is completely ignored.

**Fix required:** Replace `freq: 3.5` with a normalized display frequency derived from `state.simParams.carrierFreqHz`. Because actual GHz frequencies cannot be directly rendered as screen-resolution SVG cycles, a mapping function is needed (e.g., `displayFreq = 1 + (carrierFreqHz - 8e8) / (5e9 - 8e8) * 8` to map 0.8–5.8 GHz → 1–9 visual cycles).

---

### 🔴 CRITICAL — Workspace Does Not Change Content on Chapter Navigation

**File:** [`Workspace.js` line 195–197](file:///C:/Users/ghaze/Documents/github_projects/signallab-wireless-explorer/src/components/Workspace.js#L195-L197)

```js
updateHeaderAndInfo() {
  this.render();   // ← Calls full re-render on every state change
}
```

Clicking any chapter in the Navigator updates `state.activeChapterId`, which triggers `progressManager.notify()`, which calls `Workspace.updateHeaderAndInfo()`, which calls `Workspace.render()`. The header **does** update (chapter title and book page reference change). However, the **workspace body content is always identical** — the same staging banner, same oscilloscope, same metric cards. There is no chapter-specific lesson content, simulation, or explanation. Every chapter shows the same thing.

**This is by design for Phase 1**, but is a core gap that must be filled in Phase 2.

---

### 🟡 IMPORTANT — Nyquist Card Metric Always Uses M=2 (Binary)

**File:** [`Workspace.js` line 252](file:///C:/Users/ghaze/Documents/github_projects/signallab-wireless-explorer/src/components/Workspace.js#L252)

```js
const nyquist = calculateNyquistCapacity(bandwidthHz, 2);  // M hardcoded to 2
```

The UI shows a "MODULATION SCHEME" state field (BPSK, QPSK, 16-QAM, 64-QAM) in `learningProgress.js` default state, but no modulation dropdown exists in the Workspace, and the Nyquist calculation ignores it. The Nyquist card always shows the binary (M=2) case — `C = 2B` — regardless of modulation scheme.

**Fix required:** Add modulation scheme selector; map `modulationScheme` to M value (BPSK→2, QPSK→4, 16-QAM→16, 64-QAM→64) for the Nyquist card.

---

### 🟡 IMPORTANT — TX Power Card Is Static

**File:** [`Workspace.js` lines 180–188](file:///C:/Users/ghaze/Documents/github_projects/signallab-wireless-explorer/src/components/Workspace.js#L180-L188)

The "TRANSMIT POWER (EIRP)" card always shows `20 dBm / 100.0 mW`. There is no slider for TX power in the workspace, and no TX power control is wired. The `txPowerDbm` state field exists but is not used in any display calculation.

---

### 🟡 IMPORTANT — Concept Panel Book Page Range Is Approximate (+30 Pages Hardcoded)

**File:** [`ConceptPanel.js` lines 50–54](file:///C:/Users/ghaze/Documents/github_projects/signallab-wireless-explorer/src/components/ConceptPanel.js#L50-L54)

```html
Book Print: pp. ${chapter.bookPage}–${chapter.bookPage + 30}
PDF Target: pp. ${chapter.pdfPage}–${chapter.pdfPage + 30}
```

The end page is always `startPage + 30`, which is not accurate. For example, Chapter 1 is only 12 book pages (pp. 1–12), not 30. The actual end pages for all chapters are known from `textbookData.js`. This should use the next chapter's `bookPage - 1` as the end page.

---

### 🟡 IMPORTANT — `scope-status` Header Label Is Hardcoded

**File:** [`Workspace.js` line 85](file:///C:/Users/ghaze/Documents/github_projects/signallab-wireless-explorer/src/components/Workspace.js#L85)

```html
<div id="scope-status">SAMPLING: 2.4 GHz | TIME-DOMAIN ACTIVE</div>
```

This label never changes. It should update to reflect the actual slider-selected carrier frequency in real time.

---

### 🟡 IMPORTANT — No Harmonics UI Control

[`Workspace.js` line 17](file:///C:/Users/ghaze/Documents/github_projects/signallab-wireless-explorer/src/components/Workspace.js#L17): `this.harmonics = 1` is initialized but never changed. `generateWaveformPoints()` supports `harmonics > 1` for Fourier square wave synthesis, but no UI control exposes this. The feature is implemented in `svgUtils.js` but inaccessible.

---

### ⚠️ MINOR — Tab Buttons ("CURRICULUM / SIMULATION / THEORY / TELEMETRY") Are Visible But Non-Functional
The `activeTab` state field (`'curriculum' | 'simulation' | 'theory' | 'telemetry'`) is defined in `learningProgress.js` and `setActiveTab()` exists, but no tab UI renders in the Workspace. The workspace always shows the same view regardless of tab state.

---

### ⚠️ MINOR — `Workspace.render()` Called on Every State Change (Performance)

`progressManager.subscribe(() => this.updateHeaderAndInfo())` and `updateHeaderAndInfo()` calls `this.render()` which does a full `innerHTML` replacement on every state change — including every sim-tick if anything subscribes. Currently not causing visible problems, but will degrade as content grows.

---

## 4. Chapter 1 Completion Status

**Textbook:** Chapter 1 — *Introduction*, Book pp. 1–12, PDF pp. 11–22

### Sections verified from PDF:
| Section | Title | Book p. | In App? |
|---|---|---|---|
| 1.1 | Wireless Comes of Age | 2 | Title only |
| 1.2 | The Cellular Revolution | 3 | Title only |
| 1.3 | The Global Cellular Network | 4 | Title only |
| 1.4 | Broadband | 5 | Title only |
| 1.5 | Future Trends | 5 | Title only |
| 1.6 | The Trouble with Wireless | 7 | Title only |
| 1.7 | Outline of the Book | 7 | Title only |
| 1.8 | Internet and Web Resources | 10 | Title only |
| — | Review Questions | 11 | Not implemented |

**Section titles in `textbookData.js` match the PDF exactly.** Page numbers are correct.

### What exists for Chapter 1:
- ✅ Chapter title, description, section list with page numbers in navigator and concept panel.
- ✅ Book page and PDF page reference displayed.
- ❌ No explanatory text for any section.
- ❌ No Figure 1.1 (Wireless Milestones frequency/timeline chart) — a key teaching diagram.
- ❌ No discussion of "The Trouble with Wireless" (§1.6) which introduces multipath, fading, interference — foundational to the whole book.
- ❌ No review questions.
- ❌ No interactive demonstration of any kind.
- ❌ Chapter 1 is an *overview/survey* chapter — its primary teaching value is conceptual framing, not mathematics. No framing content is present.

**Chapter 1 completion: ~5% (structure only)**

---

## 5. Chapter 2 Completion Status

**Textbook:** Chapter 2 — *Transmission Fundamentals*, Book pp. 14–44, PDF pp. 24–55 (plus Appendix 2A pp. 43–44)

### Sections verified from PDF:
| Section | Title | Book p. | In App? |
|---|---|---|---|
| 2.1 | Signals for Conveying Information | 15 | Partial — formulas in metric cards only |
| 2.1a | Time Domain Concepts | 15 | ❌ No content |
| 2.1b | Frequency Domain Concepts | 17 | ❌ No content |
| 2.1c | Relationship between Data Rate and Bandwidth | 21 | ❌ No content |
| 2.2 | Analog and Digital Data Transmission | 22 | ❌ No content |
| 2.2a | Analog and Digital Data | 22 | ❌ No content |
| 2.2b | Analog and Digital Signaling | 23 | ❌ No content |
| 2.2c | Analog and Digital Transmission | 25 | ❌ No content |
| 2.3 | Channel Capacity | 27 | Partial — formulas computed but unexplained |
| 2.3a | Nyquist Bandwidth | 27 | ❌ No derivation or explanation |
| 2.3b | Shannon Capacity Formula | 28 | ❌ No derivation or explanation |
| 2.4 | Transmission Media | 31 | ❌ No content |
| 2.5 | Multiplexing | 36 | ❌ No content |
| 2.6 | Recommended Reading | 40 | ❌ Not needed in app |
| 2.7 | Key Terms, Review Questions, Problems | 41 | ❌ No questions |
| App. 2A | Decibels and Signal Strength | 43 | ❌ dBm/dB utils exist but no lesson |

**Section titles in `textbookData.js` match the PDF exactly.** Page numbers are correct.

### What exists for Chapter 2:
- ✅ Chapter title, section list, page references in navigator and concept panel.
- ✅ `keyFormulas` array displayed in concept panel (sinusoid, Nyquist, Shannon, dB).
- ✅ Shannon, Nyquist, FSPL formulas implemented and computed correctly in metric cards.
- ✅ `generateWaveformPoints()` renders a continuous sinusoid — but it is cosmetic only.
- ❌ No explanation of *s(t) = A sin(2πft + φ)* and its three parameters (§2.1, pp. 15–16). This is Equation 2.1 — the first equation in the chapter.
- ❌ No frequency domain / Fourier explanation. No spectrum diagram.
- ❌ No Figure 2.2 (analog vs digital waveforms — fundamental diagram).
- ❌ No Figure 2.3 (effect of varying amplitude, frequency, phase on sinusoid).
- ❌ No Figure 2.4 (Fourier decomposition of a square wave — relates to `fourierSquareWave()` already implemented).
- ❌ No bandwidth / data-rate relationship explanation.
- ❌ No analog vs digital data/signaling/transmission distinction.
- ❌ No worked numerical example for Shannon or Nyquist (textbook provides several).
- ❌ No transmission media content (microwave, satellite, broadcast radio, infrared).
- ❌ No multiplexing (FDM, STDM) content.
- ❌ No Appendix 2A decibel lesson (textbook pp. 43–44 — essential for all subsequent chapters).

**Chapter 2 completion: ~12% (formula computation only; no explanation, no worked examples, no diagrams)**

---

## 6. Simulation Accuracy Problems

### 🔴 Oscilloscope Frequency Parameter Is Hardcoded
As documented in §3, `freq: 3.5` is hardcoded in `setupSimulationListener()`. The waveform does not reflect the carrier frequency slider in any physically meaningful way.

### 🟡 Oscilloscope Displays Carrier Waveform — Wrong for GHz Frequencies
Even if the carrier frequency were connected, displaying a 2.4 GHz sinusoid at screen resolution is physically meaningless — no screen can display 2.4 billion cycles per second. The oscilloscope should instead be reframed educationally as a "representative signal waveform" or as a baseband equivalent representation. This distinction is never explained to the user.

### 🟡 Noise Model Is Deterministic (Pseudo-Random), Not Stochastic
**File:** [`svgUtils.js` line 64](file:///C:/Users/ghaze/Documents/github_projects/signallab-wireless-explorer/src/utils/svgUtils.js#L64)

```js
const pseudoNoise = (Math.sin(x * 12.9898 + t * 78.233) * 43758.5453) % 1;
```

This is a hash-based pseudo-random noise generator. The noise pattern is repeatable and has visible structure. For educational purposes this is acceptable, but should be labelled as "representative noise" rather than implying it models Gaussian AWGN accurately.

### 🟡 Nyquist Card Shows Binary Capacity Only (M=2 Hardcoded)
See §3. The Nyquist card (`C = 2B log₂ M`) with M=2 always gives `C = 2B`, making the card equivalent to just showing "2 × bandwidth." The more interesting educational point — how QAM-64 packs 6 bits per symbol — is never shown.

### 🟡 No Link Budget — TX Power Is Unused
`txPowerDbm = 20 dBm` is in state but not used in any calculation. A meaningful simulation would compute `Received Power = TX Power − FSPL` and derive an effective SNR from path loss. This is the standard Friis link budget (Stallings §5.3) and would tie the carrier frequency, distance, and TX power controls together meaningfully.

### ✅ FSPL Formula Is Mathematically Correct
`L_dB = 20 log₁₀(4πdf/c)` is correct. At default params (50 m, 2.4 GHz): L ≈ 60.0 dB — consistent with standard reference values.

### ✅ Shannon Formula Is Mathematically Correct
`C = B log₂(1 + 10^(SNR_dB/10))` with defaults (20 MHz, 25 dB SNR): C ≈ 166 Mbps — correct.

---

## 7. Design and Usability Problems

### 🟡 No Visual Feedback That a Chapter Was Selected
When a user clicks a different chapter, the workspace header changes (chapter title and page number update), but the central workspace body is identical. There is no visual cue that anything meaningful changed. A new learner would not know whether their click worked.

### 🟡 Staging Banner Is Always Visible Regardless of Chapter
The "PHASE 1: APPLICATION FOUNDATION COMPLETE" banner appears on every chapter, including chapters that may eventually have full content. It should be conditional on chapter status.

### 🟡 Concept Panel Page Range Is Inaccurate
`pp. ${chapter.bookPage}–${chapter.bookPage + 30}` — always 30 pages. Ch. 1 is only 12 pages. Ch. 15 is ~46 pages. The correct end pages are computable from the data already in `textbookData.js`.

### 🟡 No Mobile Layout
The three-column layout has no responsive breakpoints. On screens narrower than ~1200 px, the layout overflows horizontally. The CSS does not contain any `@media` queries. For a portfolio project viewed on mobile, this is a significant gap.

### ⚠️ MINOR — Section Click Does Not Scroll Navigator Into View
When clicking a section deep in a chapter, the section is highlighted but no `scrollIntoView()` is called. For chapters with many sections this may require the user to scroll manually.

### ⚠️ MINOR — Telemetry Logger Grows Downward
Every state change appends a new log entry at top. The telemetry container does not auto-scroll, so the most recent log entry may not be visible without manual scroll.

---

## 8. Build and Deployment Status

| Check | Result |
|---|---|
| `npm run build` | ✅ Exit 0, 0 errors, 0 warnings |
| `vite` version | v5.4.21 |
| Output JS bundle | `dist/assets/index-BxFQkAN3.js` — 47.55 kB (13.56 kB gzip) |
| Output CSS bundle | `dist/assets/index-_6O5aFFw.css` — 11.45 kB (2.79 kB gzip) |
| Source maps | ✅ Generated (101 kB) |
| Vercel live URL | ✅ https://signallab-wireless-explorer.vercel.app/ — HTTP 200 |
| Vercel serving latest commit | ✅ Confirmed |
| GitHub remote | ✅ `https://github.com/Ghazenk/signallab-wireless-explorer.git` |
| Branch | `main` |
| Latest commit | `c3bbf88` |
| Working tree | Clean |
| PDF excluded | ✅ `.gitignore` excludes `*.pdf` |
| `node_modules` / `dist` excluded | ✅ |

---

## 9. Critical Problems That Must Be Fixed First

These must be resolved before Phase 2 lesson content can be meaningful:

| Priority | Problem | File | Severity |
|---|---|---|---|
| 1 | Oscilloscope ignores carrier frequency slider (`freq: 3.5` hardcoded) | `Workspace.js:272` | 🔴 Critical |
| 2 | No chapter-specific content loads on navigation — all chapters show identical workspace | Architecture gap | 🔴 Critical |
| 3 | No lesson content for Chapter 1 or Chapter 2 — only titles and page numbers | All content files | 🔴 Critical |
| 4 | Nyquist card uses hardcoded M=2 — ignores modulation scheme state | `Workspace.js:252` | 🟡 Important |
| 5 | TX Power unused — no link budget calculation | `Workspace.js` | 🟡 Important |
| 6 | Concept panel page ranges are ±30 approximation, not actual chapter ranges | `ConceptPanel.js:50` | 🟡 Important |
| 7 | No responsive/mobile layout | CSS files | 🟡 Important |
| 8 | Oscilloscope frequency context not explained (can't show GHz at pixel resolution) | UX / content | 🟡 Important |

---

## 10. Recommended Implementation Order for Phase 2

### Step 1 — Fix the oscilloscope frequency bug (1–2 hours)
In `setupSimulationListener()`, replace `freq: 3.5` with:
```js
const displayFreq = 1 + (state.simParams.carrierFreqHz - 8e8) / (5e9 - 8e8) * 8;
// Maps 0.8 GHz → ~1 cycle, 5.8 GHz → ~9 cycles
```
Also update the `#scope-status` label to reflect the actual selected frequency.

### Step 2 — Fix the Concept Panel page ranges (30 min)
Compute accurate end pages from the next chapter's `bookPage - 1` using an index lookup in `textbookData.js`.

### Step 3 — Add modulation scheme selector and fix Nyquist (1–2 hours)
Add a dropdown for BPSK / QPSK / 16-QAM / 64-QAM. Map to M value. Update Nyquist card and persist to state.

### Step 4 — Implement Chapter 1 lesson content (8–12 hours)
Chapter 1 is a survey/overview chapter. Implement:
- §1.1–1.2: Brief history text panel + Figure 1.1 as an SVG timeline diagram.
- §1.6: "The Trouble with Wireless" — a text explanation of multipath, interference, signal attenuation. This directly motivates Chapters 5–8.
- Review questions: 5–8 conceptual multiple-choice questions.
No heavy simulations needed — Chapter 1 is text-and-diagram heavy.

### Step 5 — Implement Chapter 2 lesson content (20–40 hours)
Chapter 2 is the most simulation-rich chapter in the foundational section. Implement in this order:

1. **§2.1 Sinusoid explorer** — Interactive SVG showing `s(t) = A sin(2πft + φ)` with sliders for A, f, φ. This directly uses the oscilloscope infrastructure already built.
2. **§2.1 Frequency domain** — Add a simple SVG spectrum analyzer showing frequency component bars alongside the time-domain waveform.
3. **§2.1 Fourier square wave** — Animate Fourier series buildup (harmonics selector already exists but is not wired to UI).
4. **§2.3 Shannon and Nyquist** — Add worked example cards with step-by-step calculation display. The formulas already compute correctly.
5. **§2.4 Transmission media** — Static diagram cards for microwave/satellite/radio/infrared with key characteristics.
6. **§2.5 Multiplexing** — SVG diagram of FDM frequency bands and time-slot TDM.
7. **Appendix 2A** — dB/dBm explainer with interactive converter.
8. **Review questions** — 10–15 problems matching Stallings §2.7.

### Step 6 — Add responsive layout (4–6 hours)
Add `@media` breakpoints to `layout.css`:
- `< 768px`: Stack columns vertically (navigator top, workspace middle, concept panel collapsed/drawer).
- `768px–1200px`: Two-column layout (navigator + workspace; concept panel as overlay).
- `> 1200px`: Current three-column layout.

### Step 7 — Add tab-based workspace navigation (4–8 hours)
Implement the `activeTab` state field:
- **CURRICULUM tab**: Chapter overview, section list, conceptual explanation.
- **SIMULATION tab**: Interactive oscilloscope and parameter controls.
- **THEORY tab**: Mathematical derivations and reference formulas.
- **TELEMETRY tab**: Full-screen log viewer.

### Step 8 — Chapters 3–15 (long-term phased development)
Following the same pattern: data is already in `textbookData.js`. Implement chapters in order of educational dependency:
- Ch. 3–4 (networks and protocols) — primarily text + diagrams
- Ch. 5 (antennas and propagation) — rich simulation potential (radiation patterns, link budget)
- Ch. 6 (modulation) — ASK/FSK/PSK/QAM constellation diagrams
- Ch. 7 (spread spectrum) — FHSS/DSSS hopping animation
- Ch. 8 (error control) — Hamming code interactive
- Ch. 9–12 (wireless networking) — cellular geometry, Mobile IP
- Ch. 13–15 (WLANs, Wi-Fi, Bluetooth) — CSMA/CA animation, piconet diagram

---

## Summary Table

| Feature | Status | Priority |
|---|---|---|
| App shell, layout, design | ✅ Working | — |
| Navigator (all 15 chapters) | ✅ Working | — |
| State persistence (localStorage) | ✅ Working | — |
| Simulation engine (RAF loop) | ✅ Working | — |
| Play/Pause/Step/Reset/Speed | ✅ Working | — |
| Sim clock display | ✅ Working | — |
| Telemetry logger | ✅ Working | — |
| Shannon formula | ✅ Correct | — |
| FSPL formula | ✅ Correct | — |
| Vite build / Vercel deploy | ✅ Clean | — |
| Oscilloscope responds to frequency | ❌ Broken | 🔴 Fix first |
| Chapter navigation loads content | ❌ All identical | 🔴 Phase 2 core |
| Chapter 1 lesson content | ❌ 5% complete | 🔴 Implement |
| Chapter 2 lesson content | ❌ 12% complete | 🔴 Implement |
| Nyquist uses modulation scheme | ❌ M=2 hardcoded | 🟡 Fix |
| TX power / link budget | ❌ Unused | 🟡 Implement |
| Concept panel page ranges | ❌ +30 approximation | 🟡 Fix |
| Mobile / responsive layout | ❌ Missing | 🟡 Implement |
| Tab navigation (curriculum/sim/theory) | ❌ Not implemented | 🟡 Implement |
| Harmonics UI control | ❌ Not exposed | ⚠️ Minor |
