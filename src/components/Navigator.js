/**
 * SignalLab — Left Learning Navigator Component
 * Renders verified textbook parts, chapters 1-15, sections, and status badges.
 */
import { CURRICULUM, TEXTBOOK_META } from '../data/textbookData.js';
import { progressManager } from '../state/learningProgress.js';

export class Navigator {
  constructor(containerEl) {
    this.container = containerEl;
    this.searchQuery = '';
    this.expandedChapters = new Set(['ch-01', 'ch-02', 'ch-10']);
    this.render();

    progressManager.subscribe(() => {
      this.updateActiveStyles();
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="nav-header">
        <div class="nav-title">CURRICULUM NAVIGATOR</div>
        <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 2px;">
          ${TEXTBOOK_META.title} (${TEXTBOOK_META.edition})
        </div>
        <input 
          type="text" 
          class="nav-search" 
          placeholder="Search chapters, sections, formulas..." 
          id="nav-search-input"
          value="${this.searchQuery}"
        />
      </div>
      <div class="nav-list" id="nav-tree">
        ${this.buildTreeHtml()}
      </div>
    `;

    this.attachEvents();
  }

  buildTreeHtml() {
    let html = '';
    const state = progressManager.getState();
    const q = this.searchQuery.toLowerCase();

    for (const part of CURRICULUM) {
      if (!part.chapters) continue;

      const filteredChapters = part.chapters.filter(ch => {
        if (!q) return true;
        const inCh = ch.title.toLowerCase().includes(q) || String(ch.chapterNumber).includes(q);
        const inSec = ch.sections.some(s => s.title.toLowerCase().includes(q) || s.num.includes(q));
        return inCh || inSec;
      });

      if (filteredChapters.length === 0) continue;

      html += `
        <div class="nav-part-header">
          <span>PART ${part.partNumber}: ${part.partTitle}</span>
          <span style="font-family: var(--font-mono); color: var(--text-dim);">p.${part.bookPage}</span>
        </div>
      `;

      for (const ch of filteredChapters) {
        const isActive = state.activeChapterId === ch.id;
        const isExpanded = this.expandedChapters.has(ch.id);

        html += `
          <div class="nav-chapter-item ${isActive ? 'active' : ''}" data-ch-id="${ch.id}">
            <div class="nav-chapter-row">
              <span class="nav-chapter-title">
                ${ch.chapterNumber}. ${ch.title}
              </span>
              <span class="badge badge-${ch.badge.toLowerCase()}">${ch.badge}</span>
            </div>
            
            ${isExpanded ? `
              <ul class="nav-section-list">
                ${ch.sections.map(sec => `
                  <li class="nav-section-item ${state.activeSectionId === sec.id ? 'active' : ''}" data-sec-id="${sec.id}" data-ch-id="${ch.id}">
                    <span>${sec.num} ${sec.title}</span>
                    <span style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-dim);">p.${sec.bookPage}</span>
                  </li>
                `).join('')}
              </ul>
            ` : ''}
          </div>
        `;
      }
    }

    return html;
  }

  updateActiveStyles() {
    const state = progressManager.getState();
    const items = this.container.querySelectorAll('.nav-chapter-item');
    items.forEach(el => {
      const chId = el.getAttribute('data-ch-id');
      el.classList.toggle('active', chId === state.activeChapterId);
    });

    const secItems = this.container.querySelectorAll('.nav-section-item');
    secItems.forEach(el => {
      const secId = el.getAttribute('data-sec-id');
      el.classList.toggle('active', secId === state.activeSectionId);
    });
  }

  attachEvents() {
    const searchInput = this.container.querySelector('#nav-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        const tree = this.container.querySelector('#nav-tree');
        if (tree) tree.innerHTML = this.buildTreeHtml();
        this.attachTreeClicks();
      });
    }

    this.attachTreeClicks();
  }

  attachTreeClicks() {
    const tree = this.container.querySelector('#nav-tree');
    if (!tree) return;

    tree.addEventListener('click', (e) => {
      const chRow = e.target.closest('.nav-chapter-row');
      if (chRow) {
        const item = chRow.closest('.nav-chapter-item');
        const chId = item.getAttribute('data-ch-id');
        
        if (this.expandedChapters.has(chId)) {
          this.expandedChapters.delete(chId);
        } else {
          this.expandedChapters.add(chId);
        }

        progressManager.setActiveChapter(chId);
        tree.innerHTML = this.buildTreeHtml();
        this.attachTreeClicks();
        return;
      }

      const secItem = e.target.closest('.nav-section-item');
      if (secItem) {
        const secId = secItem.getAttribute('data-sec-id');
        const chId = secItem.getAttribute('data-ch-id');
        progressManager.setActiveChapter(chId);
        progressManager.setActiveSection(secId);
        this.updateActiveStyles();
      }
    });
  }
}
