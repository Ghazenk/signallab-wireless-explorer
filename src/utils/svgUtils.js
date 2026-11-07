/**
 * SignalLab — SVG Vector Geometry & Oscilloscope Path Utilities
 */

/**
 * Generate a technical grid with primary and secondary subdivision lines.
 */
export function createSvgGrid(width, height, step = 40, subStep = 10) {
  let gridPath = '';
  // Sub-grid
  for (let x = 0; x <= width; x += subStep) {
    gridPath += `M ${x} 0 L ${x} ${height} `;
  }
  for (let y = 0; y <= height; y += subStep) {
    gridPath += `M 0 ${y} L ${width} ${y} `;
  }
  return gridPath;
}

/**
 * Generate smooth SVG path d attribute from array of [x, y] coordinates
 */
export function pointsToSvgPath(points) {
  if (!points || points.length === 0) return '';
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
  }
  return d;
}

/**
 * Generate a real-time carrier wave with modulation conforming to Stallings Chapter 2:
 * - Equation 2.1: s(t) = A * sin(2*pi*f*t + phi)
 * - Equation 2.4: s(t) = (4A / pi) * sum_{k=1,3,5,...} (1/k) * sin(2*pi*k*f*t + phi)
 * - Section 2.3.2 AWGN: Gaussian thermal noise via Box-Muller transform:
 *   sigma = A / (sqrt(2) * 10^(SNR_dB / 20))
 */
export function generateWaveformPoints({
  width,
  height,
  time,
  freq = 2,
  amplitude = 50,
  harmonics = 1,
  phase = 0,
  snrDb = 30
}) {
  const points = [];
  const midY = height / 2;
  const numSamples = Math.floor(width / 2);
  
  // Mathematically accurate AWGN standard deviation from sinusoidal carrier RMS power:
  // P_signal = A^2 / 2, P_noise = sigma^2. SNR_linear = P_signal / P_noise
  // sigma = A / (sqrt(2) * 10^(snrDb / 20))
  const noiseSigma = amplitude / (Math.SQRT2 * Math.pow(10, snrDb / 20));

  for (let i = 0; i < numSamples; i++) {
    const x = (i / (numSamples - 1)) * width;
    const t = time + (x / width) * 2;
    
    // Carrier fundamental or Fourier series expansion
    let yVal = 0;
    if (harmonics <= 1) {
      yVal = Math.sin(2 * Math.PI * freq * t + phase);
    } else {
      for (let h = 1; h <= harmonics; h += 2) {
        yVal += (1 / h) * Math.sin(2 * Math.PI * freq * h * t + phase);
      }
      // Stallings Eq 2.4: 4/pi scaling factor for square wave synthesis
      yVal *= (4 / Math.PI);
    }

    // High-fidelity Box-Muller Gaussian AWGN generator (Stallings Section 2.3.2)
    // Using deterministic deterministic pseudo-random seed based on spatial coordinate x and time t
    const seed1 = Math.abs(Math.sin(x * 12.9898 + t * 78.233) * 43758.5453) % 1;
    const seed2 = Math.abs(Math.cos(x * 39.3461 + t * 11.135) * 23421.631) % 1;
    const u1 = Math.max(1e-7, seed1);
    const u2 = seed2;
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const gaussianNoise = z0 * noiseSigma;

    const y = midY - (yVal * amplitude + gaussianNoise);
    points.push([x, Math.max(5, Math.min(height - 5, y))]);
  }

  return points;
}

