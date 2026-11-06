/**
 * SignalLab — High-Precision Simulation Clock Engine
 */

class SimulationEngine {
  constructor() {
    this.simTime = 0; // Simulated seconds elapsed
    this.lastTimestamp = 0;
    this.isRunning = true;
    this.timeScale = 1.0;
    this.listeners = new Set();
    this.animationFrameId = null;

    this.tick = this.tick.bind(this);
  }

  start() {
    if (!this.animationFrameId) {
      this.lastTimestamp = performance.now();
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setRunning(running) {
    this.isRunning = running;
    if (running && !this.animationFrameId) {
      this.start();
    }
  }

  setTimeScale(scale) {
    this.timeScale = Math.max(0.1, Math.min(10.0, scale));
  }

  step(stepSeconds = 0.05) {
    this.simTime += stepSeconds;
    this.notify(this.simTime, stepSeconds);
  }

  reset() {
    this.simTime = 0;
    this.notify(0, 0);
  }

  tick(currentTimestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = currentTimestamp;
    const dt = (currentTimestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = currentTimestamp;

    if (this.isRunning && dt < 0.25) { // Protect against large tab switch jumps
      const scaledDt = dt * this.timeScale;
      this.simTime += scaledDt;
      this.notify(this.simTime, scaledDt);
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(time, dt) {
    for (const listener of this.listeners) {
      listener(time, dt);
    }
  }

  getSimTime() {
    return this.simTime;
  }
}

export const simEngine = new SimulationEngine();
