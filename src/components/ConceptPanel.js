/**
 * SignalLab — Right Concept Information Panel Component
 * Displays verified Stallings 2e chapter specifications, equations, and section index.
 */
import { CURRICULUM, TEXTBOOK_META } from '../data/textbookData.js';
import { progressManager } from '../state/learningProgress.js';

export class ConceptPanel {
  constructor(containerEl) {
    this.container = containerEl;
    this.render();

    progressManager.subscribe(() => {
      this.render();
    });
  }

  getActiveChapter() {
    const state = progressManager.getState();
    for (const part of CURRICULUM) {
      if (part.chapters) {
        const found = part.chapters.find(c => c.id === state.activeChapterId);
        if (found) return { chapter: found, part };
      }
    }
    return { chapter: CURRICULUM[0].chapters[0], part: CURRICULUM[0] };
  }

  render() {
    const { chapter, part } = this.getActiveChapter();
    const state = progressManager.getState();

    this.container.innerHTML = `
      <div class="concept-header">
        <div class="concept-title">CONCEPT SPECIFICATION</div>
        <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-sky); margin-top: 2px;">
          TEXTBOOK REFERENCE AUDIT
        </div>
      </div>

      <div class="concept-body">
        <!-- Textbook Verified Reference Box -->
        <div class="concept-section-block">
          <div class="concept-section-title">TEXTBOOK LOCATION</div>
          <div style="font-size: 0.82rem; line-height: 1.5; color: var(--text-main);">
            <strong>Chapter ${chapter.chapterNumber}: ${chapter.title}</strong><br/>
            ${part.partTitle}
          </div>
          <div class="book-ref-tag">
            <span>📖 Book Print: pp. ${chapter.bookPage}–${chapter.bookPage + 30}</span>
          </div>
          <div class="book-ref-tag">
            <span>📑 PDF Target: pp. ${chapter.pdfPage}–${chapter.pdfPage + 30}</span>
          </div>
        </div>

        <!-- Mathematical Foundations / Formulas (if chapter has them) -->
        ${chapter.keyFormulas ? `
          <div class="concept-section-block">
            <div class="concept-section-title">GOVERNING EQUATIONS</div>
            ${chapter.keyFormulas.map(f => `
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">${f.name}:</div>
              <div class="formula-box">${f.formula}</div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Chapter Sections & Subsections -->
        <div class="concept-section-block">
          <div class="concept-section-title">VERIFIED SECTION BREAKDOWN</div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
            ${chapter.sections.map(sec => `
              <div style="padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.04);">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; color: ${state.activeSectionId === sec.id ? 'var(--accent-cyan)' : 'var(--text-main)'};">
                  <span>${sec.num} ${sec.title}</span>
                  <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);">p. ${sec.bookPage}</span>
                </div>
                ${sec.subsections ? `
                  <div style="margin-left: 12px; margin-top: 4px; font-size: 0.73rem; color: var(--text-muted); line-height: 1.4;">
                    ${sec.subsections.map(sub => `• ${sub}`).join('<br/>')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Appendices & Problems -->
        ${chapter.appendices ? `
          <div class="concept-section-block">
            <div class="concept-section-title">CHAPTER APPENDICES</div>
            ${chapter.appendices.map(app => `
              <div style="font-size: 0.78rem; color: var(--text-main); margin-top: 4px;">
                <strong>${app.code}: ${app.title}</strong>
                <span style="font-family: var(--font-mono); color: var(--text-dim);"> (Book p. ${app.bookPage})</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Pedagogical Plan -->
        <div class="concept-section-block">
          <div class="concept-section-title">DEVELOPMENT ROADMAP</div>
          <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
            This module's interactive simulations, SVG block diagrams, and quantitative problem-solving tools will be built in upcoming development phases following the strict stop condition.
          </p>
        </div>
      </div>
    `;
  }
}
