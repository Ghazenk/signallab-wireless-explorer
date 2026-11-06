# SignalLab — Wireless Communications Explorer

An interactive, high-precision educational web application and simulation laboratory for exploring wireless communications, RF propagation, signal encoding, and digital network protocols.

Built from the foundational textbook:  
**Wireless Communications and Networks (Second Edition)** by **William Stallings** (Pearson Prentice Hall, ISBN: `0-13-191835-4`).

---

## 🎯 Architecture & Phase 1 Scope

This project implements **Phase 1: Textbook Verification and Application Foundation**.

- **Strict Pedagogical Integrity**: Every module, chapter, and section is mapped directly to the verified physical pages and digital text layers of William Stallings' second edition textbook.
- **Protocol Explorer Design System**:
  - Dark navy technical dashboard (`#070A14` / `#0B1122`).
  - Subtle coordinate grid with vector overlays.
  - Electric blue (`#0070F3`) and cyan (`#00E5FF`) luminous accents.
  - Condensed technical headings (`Rajdhani`).
  - Monospaced engineering labels and metrics (`JetBrains Mono`).
- **Tri-Panel Workspace**:
  - **Left Learning Navigator**: Parts 1–4, Chapters 1–15, section breakdowns, and progressive staging status.
  - **Central Engineering Workspace**: Real-time vector SVG oscilloscope, Shannon & Nyquist capacity analyzers, free space path loss (FSPL) calculator, and RF control parameters.
  - **Right Concept Information Panel**: Verified textbook print/PDF page mappings, governing mathematical equations, and section outlines.
  - **Bottom Timeline & Telemetry**: Master simulation clock, playback speed controls, and timestamped event telemetry stream.

---

## 📚 Master Reference Map

The complete verified mapping of all 4 parts, 15 chapters, appendices, review questions, and problem sections is available in:
[`docs/TEXTBOOK_REFERENCE.md`](docs/TEXTBOOK_REFERENCE.md)

### Page Mapping Formula:
$$\text{PDF Page} = \text{Book Page} + 10$$
$$\text{Book Page} = \text{PDF Page} - 10$$

---

## 🛠️ Technology Stack

- **Runtime / Bundler**: [Vite](https://vitejs.dev/)
- **Core Language**: Vanilla Modern JavaScript (ES Modules)
- **Styling**: Pure CSS (Custom Design Tokens, Grid/Flexbox Layouts)
- **Vector Graphics**: Responsive SVG (Waveform synthesis, technical grids)
- **State & Telemetry**: Reactive pub-sub manager with `localStorage` persistence

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
git clone https://github.com/ghazel/signallab-wireless-explorer.git
cd signallab-wireless-explorer
npm install
```

### Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### Production Build
```bash
npm run build
npm run preview
```

---

## ⚖️ Copyright & Educational Fair Use

The textbook *Wireless Communications and Networks (2nd Edition)* by William Stallings is used exclusively as an academic reference for mathematical models, protocol architectures, and chapter organization. No copyrighted textbook text, figures, or exercises are reproduced. All software, interactive visualizations, and simulation logic are original works.

The textbook source PDF is excluded from version control via `.gitignore`.
