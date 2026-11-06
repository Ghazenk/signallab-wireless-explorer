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
 * Generate a real-time carrier wave with modulation
 */
export function generateWaveformPoints({
  width,
  height,
  time,
  freq = 2,
  amplitude = 50,
  harmonics = 1,
  snrDb = 30
}) {
  const points = [];
  const midY = height / 2;
  const numSamples = Math.floor(width / 2);
  const noiseAmp = amplitude / Math.pow(10, snrDb / 20);

  for (let i = 0; i < numSamples; i++) {
    const x = (i / (numSamples - 1)) * width;
    const t = time + (x / width) * 2;
    
    // Carrier fundamental
    let yVal = Math.sin(2 * Math.PI * freq * t);
    
    // Fourier harmonics if selected
    if (harmonics > 1) {
      for (let h = 3; h <= harmonics; h += 2) {
        yVal += (1 / h) * Math.sin(2 * Math.PI * freq * h * t);
      }
    }

    // Add deterministic pseudorandom noise based on SNR
    const pseudoNoise = (Math.sin(x * 12.9898 + t * 78.233) * 43758.5453) % 1;
    const noise = (pseudoNoise - 0.5) * 2 * noiseAmp;

    const y = midY - (yVal * amplitude + noise);
    points.push([x, Math.max(5, Math.min(height - 5, y))]);
  }

  return points;
}
