/**
 * SignalLab — Engineering Unit and Monospace Formatters
 */

export function formatFrequency(hz) {
  if (hz >= 1e9) {
    return `${(hz / 1e9).toFixed(2)} GHz`;
  }
  if (hz >= 1e6) {
    return `${(hz / 1e6).toFixed(2)} MHz`;
  }
  if (hz >= 1e3) {
    return `${(hz / 1e3).toFixed(2)} kHz`;
  }
  return `${hz.toFixed(0)} Hz`;
}

export function formatBitrate(bps) {
  if (bps >= 1e9) {
    return `${(bps / 1e9).toFixed(2)} Gbps`;
  }
  if (bps >= 1e6) {
    return `${(bps / 1e6).toFixed(2)} Mbps`;
  }
  if (bps >= 1e3) {
    return `${(bps / 1e3).toFixed(2)} kbps`;
  }
  return `${bps.toFixed(0)} bps`;
}

export function formatDb(val, precision = 1) {
  return `${val >= 0 ? '+' : ''}${val.toFixed(precision)} dB`;
}

export function formatDbm(val, precision = 1) {
  return `${val >= 0 ? '+' : ''}${val.toFixed(precision)} dBm`;
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
