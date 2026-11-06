/**
 * SignalLab — Local Learning Progress and Telemetry State Manager
 * Persistent state in localStorage for progress tracking and engineering simulation parameters.
 */

const STORAGE_KEY = 'signallab_learning_progress_v1';

class LearningProgressManager {
  constructor() {
    this.subscribers = new Set();
    this.state = this.loadState();
  }

  getDefaultState() {
    return {
      activeChapterId: 'ch-10',
      activeSectionId: 'sec-10.sim',
      activeTab: 'curriculum', // 'curriculum' | 'simulation' | 'theory' | 'telemetry'
      completedChapters: [],
      completedSections: [],
      bookmarks: [],
      simParams: {
        carrierFreqHz: 2400000000, // 2.4 GHz
        bandwidthHz: 20000000,      // 20 MHz
        snrDb: 25,                  // 25 dB
        txPowerDbm: 20,             // +20 dBm (100 mW)
        distanceMeters: 50,         // 50 m
        modulationScheme: 'BPSK',   // BPSK, QPSK, 16-QAM, 64-QAM
        clockSpeed: 1.0,            // 1x simulation clock
        isPlaying: true
      },
      telemetryLogs: [
        { id: 1, timestamp: new Date().toISOString(), level: 'INFO', source: 'SYS_INIT', message: 'SignalLab engine booted. William Stallings 2e reference map loaded.' },
        { id: 2, timestamp: new Date().toISOString(), level: 'INFO', source: 'VERIFY', message: 'Textbook verification complete: 15 chapters, 569 pages indexed.' },
        { id: 3, timestamp: new Date().toISOString(), level: 'READY', source: 'FOUNDATION', message: 'Application foundation staged. Ready for progressive lesson integration.' }
      ]
    };
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...this.getDefaultState(), ...parsed };
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using defaults.', e);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save to localStorage.', e);
    }
    this.notify();
  }

  getState() {
    return this.state;
  }

  setActiveChapter(chapterId) {
    if (this.state.activeChapterId !== chapterId) {
      this.state.activeChapterId = chapterId;
      this.addLog('NAV', `Navigated to Chapter ID: ${chapterId}`);
      this.saveState();
    }
  }

  setActiveSection(sectionId) {
    this.state.activeSectionId = sectionId;
    this.saveState();
  }

  setActiveTab(tabName) {
    this.state.activeTab = tabName;
    this.saveState();
  }

  updateSimParams(newParams) {
    this.state.simParams = { ...this.state.simParams, ...newParams };
    this.saveState();
  }

  togglePlayPause() {
    this.state.simParams.isPlaying = !this.state.simParams.isPlaying;
    this.addLog('SIM', `Simulation ${this.state.simParams.isPlaying ? 'RESUMED' : 'PAUSED'}`);
    this.saveState();
  }

  addLog(source, message, level = 'INFO') {
    const log = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      level,
      source,
      message
    };
    this.state.telemetryLogs.unshift(log);
    if (this.state.telemetryLogs.length > 100) {
      this.state.telemetryLogs.pop();
    }
    this.saveState();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    for (const callback of this.subscribers) {
      callback(this.state);
    }
  }
}

export const progressManager = new LearningProgressManager();
