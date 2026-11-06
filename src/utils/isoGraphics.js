/**
 * SignalLab — Isometric 3D SVG Vector Icon Library
 * Matches the visual design system of Protocol Explorer (Client laptop, Wi-Fi Router, Base Station Tower, Cloud, Server)
 */

/**
 * 3D Isometric Client Laptop
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} scale - scale factor
 * @param {string} color - stroke color
 */
export function drawIsometricLaptop(x, y, scale = 1, color = '#38bdf8') {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" class="iso-device iso-laptop">
      <!-- Glow filter / base shadow -->
      <polygon points="-50,20 0,-8 50,20 0,48" fill="rgba(0, 112, 243, 0.12)" stroke="none"/>
      
      <!-- Base Plate (Keyboard deck) -->
      <polygon points="-45,18 0,-7 45,18 0,43" fill="#0b1329" stroke="${color}" stroke-width="2"/>
      <!-- Base Thickness edge -->
      <polygon points="-45,18 0,43 0,48 -45,23" fill="#070c1b" stroke="${color}" stroke-width="2"/>
      <polygon points="45,18 0,43 0,48 45,23" fill="#040813" stroke="${color}" stroke-width="2"/>
      
      <!-- Trackpad -->
      <polygon points="-10,25 0,20 10,25 0,30" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.7"/>

      <!-- Keyboard keys grid -->
      <g stroke="${color}" stroke-width="1" opacity="0.6">
        <line x1="-30" y1="12" x2="30" y2="12"/>
        <line x1="-25" y1="17" x2="25" y2="17"/>
        <line x1="-20" y1="22" x2="20" y2="22"/>
      </g>

      <!-- Upright Screen Hinge & Frame -->
      <polygon points="-45,18 0,-7 0,-72 -45,-47" fill="#091024" stroke="${color}" stroke-width="2"/>
      <!-- Inner Screen Surface -->
      <polygon points="-41,14 -4,-6 -4,-66 -41,-45" fill="#020614" stroke="${color}" stroke-width="1.2"/>
      
      <!-- Screen Display Graphics / Code lines -->
      <line x1="-36" y1="-38" x2="-10" y2="-24" stroke="#00e5ff" stroke-width="2" opacity="0.85"/>
      <line x1="-36" y1="-30" x2="-15" y2="-18" stroke="#38bdf8" stroke-width="1.5" opacity="0.6"/>
      <line x1="-36" y1="-22" x2="-12" y2="-10" stroke="#00ff9d" stroke-width="1.5" opacity="0.75"/>
      <line x1="-36" y1="-14" x2="-20" y2="-5" stroke="#38bdf8" stroke-width="1.5" opacity="0.6"/>
    </g>
  `;
}

/**
 * 3D Isometric Wireless Router / Access Point
 * @param {number} x - center x
 * @param {number} y - center y
 * @param {number} scale - scale factor
 * @param {string} color - stroke color
 */
export function drawIsometricRouter(x, y, scale = 1, color = '#38bdf8') {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" class="iso-device iso-router">
      <!-- Shadow -->
      <polygon points="-40,15 0,-8 40,15 0,38" fill="rgba(0, 229, 255, 0.08)" stroke="none"/>

      <!-- Router Top Plate -->
      <polygon points="-35,12 0,-8 35,12 0,32" fill="#0b1329" stroke="${color}" stroke-width="2"/>

      <!-- Front Left Face -->
      <polygon points="-35,12 0,32 0,48 -35,28" fill="#070c1b" stroke="${color}" stroke-width="2"/>
      <!-- Front Right Face (with status LEDs and Ethernet port icons) -->
      <polygon points="35,12 0,32 0,48 35,28" fill="#040813" stroke="${color}" stroke-width="2"/>

      <!-- Front Panel LEDs & Ports -->
      <circle cx="-25" cy="22" r="2" fill="#00ff9d" class="router-led-blink"/>
      <circle cx="-18" cy="26" r="2" fill="#00e5ff" class="router-led-blink"/>
      <circle cx="-11" cy="30" r="2" fill="#00ff9d" class="router-led-blink"/>
      <circle cx="-4" cy="34" r="2" fill="#38bdf8" class="router-led-blink"/>

      <!-- Ethernet RJ45 port silhouettes on right face -->
      <rect x="8" y="32" width="5" height="7" fill="none" stroke="${color}" stroke-width="1" opacity="0.7" transform="skewY(20)"/>
      <rect x="18" y="27" width="5" height="7" fill="none" stroke="${color}" stroke-width="1" opacity="0.7" transform="skewY(20)"/>
      <rect x="28" y="22" width="5" height="7" fill="none" stroke="${color}" stroke-width="1" opacity="0.7" transform="skewY(20)"/>

      <!-- Upright Wi-Fi Dipole Antenna -->
      <line x1="0" y1="-8" x2="0" y2="-52" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="0" cy="-52" r="3.5" fill="#00e5ff"/>

      <!-- Radiating RF Wireless Wave Arcs -->
      <path d="M -12,-60 A 15,15 0 0,1 12,-60" fill="none" stroke="#00e5ff" stroke-width="1.8" stroke-dasharray="3 3" opacity="0.9" class="rf-wave-pulse"/>
      <path d="M -22,-68 A 26,26 0 0,1 22,-68" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="4 4" opacity="0.7" class="rf-wave-pulse"/>
      <path d="M -32,-76 A 38,38 0 0,1 32,-76" fill="none" stroke="#0070f3" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.5" class="rf-wave-pulse"/>
    </g>
  `;
}

/**
 * 3D Isometric Cellular Base Station Tower (Cell Mast)
 */
export function drawIsometricBaseStation(x, y, scale = 1, color = '#38bdf8') {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" class="iso-device iso-basestation">
      <!-- Ground Pad -->
      <polygon points="-30,15 0,0 30,15 0,30" fill="rgba(0, 229, 255, 0.1)" stroke="${color}" stroke-width="1.5"/>

      <!-- Lattice Mast Legs -->
      <line x1="-18" y1="18" x2="-4" y2="-75" stroke="${color}" stroke-width="2"/>
      <line x1="18" y1="18" x2="4" y2="-75" stroke="${color}" stroke-width="2"/>
      <line x1="0" y1="26" x2="0" y2="-75" stroke="${color}" stroke-width="2"/>

      <!-- Lattice Cross Bracing -->
      <line x1="-15" y1="5" x2="15" y2="5" stroke="${color}" stroke-width="1" opacity="0.7"/>
      <line x1="-11" y1="-20" x2="11" y2="-20" stroke="${color}" stroke-width="1" opacity="0.7"/>
      <line x1="-8" y1="-45" x2="8" y2="-45" stroke="${color}" stroke-width="1" opacity="0.7"/>
      <line x1="-5" y1="-65" x2="5" y2="-65" stroke="${color}" stroke-width="1" opacity="0.7"/>

      <!-- Diagonal Lattice -->
      <line x1="-15" y1="5" x2="11" y2="-20" stroke="${color}" stroke-width="0.8" opacity="0.5"/>
      <line x1="15" y1="5" x2="-11" y2="-20" stroke="${color}" stroke-width="0.8" opacity="0.5"/>
      <line x1="-11" y1="-20" x2="8" y2="-45" stroke="${color}" stroke-width="0.8" opacity="0.5"/>
      <line x1="11" y1="-20" x2="-8" y2="-45" stroke="${color}" stroke-width="0.8" opacity="0.5"/>

      <!-- Top Antenna Sector Array Head -->
      <polygon points="-14,-75 0,-82 14,-75 0,-68" fill="#1e293b" stroke="${color}" stroke-width="1.5"/>
      <!-- Directional Panel Antennas (3 sectors at 120°) -->
      <rect x="-18" y="-95" width="6" height="22" fill="#0f172a" stroke="#00e5ff" stroke-width="1.5" rx="1"/>
      <rect x="12" y="-95" width="6" height="22" fill="#0f172a" stroke="#00e5ff" stroke-width="1.5" rx="1"/>
      <rect x="-3" y="-100" width="6" height="22" fill="#0f172a" stroke="#00ff9d" stroke-width="1.5" rx="1"/>

      <!-- Red Aviation Obstruction Beacon -->
      <circle cx="0" cy="-105" r="3" fill="#ff0055" class="beacon-blink"/>
      <line x1="0" y1="-102" x2="0" y2="-98" stroke="${color}" stroke-width="2"/>
    </g>
  `;
}

/**
 * 3D Isometric Server / DNS Resolver Stack (Protocol Explorer Style)
 */
export function drawIsometricServer(x, y, scale = 1, color = '#38bdf8') {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" class="iso-device iso-server">
      <!-- Shadow -->
      <polygon points="-40,20 0,-3 40,20 0,43" fill="rgba(0, 112, 243, 0.12)" stroke="none"/>

      <!-- Server Unit 3 (Bottom) -->
      <polygon points="-35,10 0,-10 35,10 0,30" fill="#0b1329" stroke="${color}" stroke-width="1.8"/>
      <polygon points="-35,10 0,30 0,44 -35,24" fill="#070c1b" stroke="${color}" stroke-width="1.8"/>
      <polygon points="35,10 0,30 0,44 35,24" fill="#040813" stroke="${color}" stroke-width="1.8"/>
      <line x1="-25" y1="18" x2="-8" y2="28" stroke="#00ff9d" stroke-width="1.5"/>
      <circle cx="10" cy="32" r="1.5" fill="#00e5ff"/>
      <circle cx="16" cy="29" r="1.5" fill="#00ff9d"/>

      <!-- Server Unit 2 (Middle) -->
      <g transform="translate(0, -18)">
        <polygon points="-35,10 0,-10 35,10 0,30" fill="#0b1329" stroke="${color}" stroke-width="1.8"/>
        <polygon points="-35,10 0,30 0,44 -35,24" fill="#070c1b" stroke="${color}" stroke-width="1.8"/>
        <polygon points="35,10 0,30 0,44 35,24" fill="#040813" stroke="${color}" stroke-width="1.8"/>
        <line x1="-25" y1="18" x2="-8" y2="28" stroke="#00e5ff" stroke-width="1.5"/>
        <circle cx="10" cy="32" r="1.5" fill="#00ff9d"/>
        <circle cx="16" cy="29" r="1.5" fill="#38bdf8"/>
      </g>

      <!-- Server Unit 1 (Top) -->
      <g transform="translate(0, -36)">
        <polygon points="-35,10 0,-10 35,10 0,30" fill="#0b1329" stroke="${color}" stroke-width="1.8"/>
        <polygon points="-35,10 0,30 0,44 -35,24" fill="#070c1b" stroke="${color}" stroke-width="1.8"/>
        <polygon points="35,10 0,30 0,44 35,24" fill="#040813" stroke="${color}" stroke-width="1.8"/>
        <line x1="-25" y1="18" x2="-8" y2="28" stroke="#ffb703" stroke-width="1.5"/>
        <circle cx="10" cy="32" r="1.5" fill="#00e5ff"/>
        <circle cx="16" cy="29" r="1.5" fill="#00ff9d"/>
      </g>
    </g>
  `;
}

/**
 * 3D Isometric Network Cloud
 */
export function drawIsometricCloud(x, y, scale = 1, color = '#38bdf8') {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" class="iso-device iso-cloud">
      <path d="M -35,5 C -45,5 -50,-10 -35,-18 C -35,-32 -10,-38 5,-28 C 18,-38 42,-28 42,-12 C 55,-5 50,15 32,15 C 32,22 15,22 5,16 C -8,22 -25,20 -35,5 Z" 
            fill="#081024" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      <!-- Globe grid inside cloud -->
      <circle cx="0" cy="-6" r="14" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.75"/>
      <line x1="-14" y1="-6" x2="14" y2="-6" stroke="${color}" stroke-width="1" opacity="0.75"/>
      <ellipse cx="0" cy="-6" rx="7" ry="14" fill="none" stroke="${color}" stroke-width="1" opacity="0.75"/>
    </g>
  `;
}

/**
 * 3D Isometric Smartphone / Mobile Handset
 */
export function drawIsometricPhone(x, y, scale = 1, color = '#38bdf8') {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" class="iso-device iso-phone">
      <!-- Shadow -->
      <polygon points="-16,22 0,14 16,22 0,30" fill="rgba(0, 112, 243, 0.15)"/>
      <!-- Body Back/Side -->
      <polygon points="-14,15 0,7 14,15 0,23" fill="#0b1329" stroke="${color}" stroke-width="1.8"/>
      <!-- Thickness Edge -->
      <polygon points="-14,15 0,23 0,27 -14,19" fill="#070c1b" stroke="${color}" stroke-width="1.8"/>
      <polygon points="14,15 0,23 0,27 14,19" fill="#040813" stroke="${color}" stroke-width="1.8"/>
      <!-- Upright Display Screen Frame -->
      <polygon points="-14,15 0,7 0,-35 -14,-27" fill="#091024" stroke="${color}" stroke-width="1.8"/>
      <polygon points="-12,12 -1,5 -1,-31 -12,-24" fill="#020614" stroke="${color}" stroke-width="1"/>
      <!-- Screen UI: Signal bars & call icon -->
      <line x1="-10" y1="-20" x2="-3" y2="-16" stroke="#00e5ff" stroke-width="1.5"/>
      <line x1="-10" y1="-14" x2="-5" y2="-11" stroke="#00ff9d" stroke-width="1.5"/>
      <circle cx="-6" cy="2" r="1.5" fill="#38bdf8"/>
    </g>
  `;
}


