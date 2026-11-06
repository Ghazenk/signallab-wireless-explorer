/**
 * SignalLab — RF and Communications Math Utilities
 * Formulas from William Stallings, 2nd Edition (Chapters 2, 5, 6, 7).
 */

// Speed of light (m/s)
export const SPEED_OF_LIGHT = 299792458;

// Boltzmann constant (J/K)
export const BOLTZMANN_K = 1.380649e-23;

/**
 * Nyquist Maximum Channel Capacity (Noiseless channel)
 * C = 2 * B * log2(M)
 * @param {number} bandwidthHz - Channel bandwidth in Hertz
 * @param {number} levels - Number of discrete signal levels (M)
 */
export function calculateNyquistCapacity(bandwidthHz, levels = 2) {
  return 2 * bandwidthHz * Math.log2(levels);
}

/**
 * Shannon Channel Capacity Formula (Gaussian noise channel)
 * C = B * log2(1 + SNR_linear)
 * @param {number} bandwidthHz - Channel bandwidth in Hertz
 * @param {number} snrDb - Signal-to-Noise Ratio in Decibels
 */
export function calculateShannonCapacity(bandwidthHz, snrDb) {
  const snrLinear = Math.pow(10, snrDb / 10);
  return bandwidthHz * Math.log2(1 + snrLinear);
}

/**
 * Free Space Path Loss (dB)
 * L_db = 20 log10(d) + 20 log10(f) - 147.55
 * @param {number} distanceMeters - Link distance in meters
 * @param {number} frequencyHz - Carrier frequency in Hertz
 */
export function calculateFreeSpaceLoss(distanceMeters, frequencyHz) {
  if (distanceMeters <= 0 || frequencyHz <= 0) return 0;
  // L = (4 * pi * d * f / c)^2
  const numerator = 4 * Math.PI * distanceMeters * frequencyHz;
  const ratio = numerator / SPEED_OF_LIGHT;
  return 20 * Math.log10(ratio);
}

/**
 * Decibels from Power Ratio: dB = 10 * log10(P2 / P1)
 */
export function powerToDb(p2, p1 = 1) {
  if (p2 <= 0 || p1 <= 0) return -Infinity;
  return 10 * Math.log10(p2 / p1);
}

/**
 * Millivolts / dBm conversion
 * P(dBm) = 10 * log10(P(mW))
 */
export function mwToDbm(mw) {
  if (mw <= 0) return -Infinity;
  return 10 * Math.log10(mw);
}

export function dbmToMw(dbm) {
  return Math.pow(10, dbm / 10);
}

/**
 * Sinusoid Generator with Harmonics (Fourier synthesis)
 * @param {number} t - Time in seconds
 * @param {number} freq - Fundamental frequency
 * @param {number} harmonics - Number of odd harmonics for square wave approx
 */
export function fourierSquareWave(t, freq, harmonics = 5) {
  let val = 0;
  for (let n = 1; n <= harmonics; n += 2) {
    val += (1 / n) * Math.sin(2 * Math.PI * n * freq * t);
  }
  return (4 / Math.PI) * val;
}
