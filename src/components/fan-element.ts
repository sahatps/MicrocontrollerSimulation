import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

/**
 * Fan Element for Smart Farm
 *
 * DC cooling/ventilation fan for temperature and airflow control.
 * Used for maintaining optimal climate conditions in greenhouses.
 *
 * Pin configuration:
 * - VCC: Power supply (5V or 12V depending on fan)
 * - GND: Ground
 * - SIG: Digital signal input (HIGH = ON, LOW = OFF)
 */

export class FanElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 75, y: 18, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 75, y: 28, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'SIG', x: 75, y: 38, signals: [], number: 3 },
  ];

  // Fan state (on/off)
  isOn = false;
  // Power LED state
  ledPower = false;

  private svgContent() {
    return svg`
      <svg
        width="21mm"
        height="18mm"
        version="1.1"
        viewBox="0 0 80 68"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="fanGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="fanLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <!-- Spin blur for rotating effect -->
          <filter id="spinBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="${this.isOn ? 1.5 : 0}" />
          </filter>
        </defs>

        <!-- Main PCB Board - Blue -->
        <rect x="0" y="0" width="80" height="68" fill="#1565c0" rx="2" ry="2" stroke="#0d47a1" stroke-width="0.5" />

        <!-- Mounting holes -->
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />
        <circle cx="4" cy="64" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />
        <circle cx="50" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />
        <circle cx="50" cy="64" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />

        <!-- Fan Housing (circular) -->
        <circle cx="27" cy="34" r="26" fill="#2d2d2d" stroke="#1a1a1a" stroke-width="1"
                opacity="${this.isOn ? 1 : 0.8}"
                filter="${this.isOn ? 'url(#fanGlow)' : 'none'}" />

        <!-- Fan Guard/Grill -->
        <circle cx="27" cy="34" r="24" fill="none" stroke="#444" stroke-width="0.5" />
        <circle cx="27" cy="34" r="20" fill="none" stroke="#444" stroke-width="0.5" />
        <circle cx="27" cy="34" r="16" fill="none" stroke="#444" stroke-width="0.5" />
        <circle cx="27" cy="34" r="12" fill="none" stroke="#444" stroke-width="0.5" />
        <line x1="3" y1="34" x2="51" y2="34" stroke="#444" stroke-width="0.5" />
        <line x1="27" y1="10" x2="27" y2="58" stroke="#444" stroke-width="0.5" />

        <!-- Fan Blades (with rotation blur when on) -->
        <g transform="translate(27,34)" filter="${this.isOn ? 'url(#spinBlur)' : 'none'}">
          <!-- Blade 1 -->
          <ellipse cx="0" cy="-12" rx="5" ry="11" fill="#555"
                   opacity="${this.isOn ? 0.5 : 1}" stroke="#444" stroke-width="0.3" />
          <!-- Blade 2 -->
          <ellipse cx="10.4" cy="6" rx="5" ry="11" fill="#555"
                   transform="rotate(120)" opacity="${this.isOn ? 0.5 : 1}" stroke="#444" stroke-width="0.3" />
          <!-- Blade 3 -->
          <ellipse cx="-10.4" cy="6" rx="5" ry="11" fill="#555"
                   transform="rotate(240)" opacity="${this.isOn ? 0.5 : 1}" stroke="#444" stroke-width="0.3" />
        </g>

        <!-- Motor Hub (center) -->
        <circle cx="27" cy="34" r="6" fill="#1a1a1a" stroke="#333" stroke-width="0.5" />
        <circle cx="27" cy="34" r="4" fill="${this.isOn ? '#ff9800' : '#444'}"
                filter="${this.isOn ? 'url(#fanGlow)' : 'none'}" />
        <circle cx="27" cy="34" r="2" fill="#333" />

        <!-- Airflow Arrows (visible when on) -->
        <g opacity="${this.isOn ? 0.9 : 0}">
          <!-- Top arrow -->
          <path d="M 27 2 L 23 8 L 25 8 L 25 14 L 29 14 L 29 8 L 31 8 Z" fill="#81d4fa" stroke="#4fc3f7" stroke-width="0.3" />
        </g>

        <!-- Label -->
        <text x="27" y="64" fill="#fff" font-family="Arial" font-size="4" text-anchor="middle" font-weight="bold">FAN</text>

        <!-- Control Section (right side) -->
        <rect x="55" y="8" width="22" height="52" fill="#0d47a1" rx="1" stroke="#0a3d91" stroke-width="0.3" />

        <!-- Power LED -->
        <circle cx="66" cy="18" r="2.5" fill="${this.isOn ? '#00ff00' : '#004400'}"
                filter="${this.isOn ? 'url(#fanLedGlow)' : 'none'}" />
        <text x="66" y="26" fill="#ccc" font-family="Arial" font-size="2.5" text-anchor="middle">PWR</text>

        <!-- Status indicator -->
        <rect x="58" y="32" width="16" height="8" fill="#1a1a1a" stroke="#333" stroke-width="0.3" rx="1" />
        <circle cx="63" cy="36" r="2" fill="${this.isOn ? '#ff9800' : '#4a3000'}"
                filter="${this.isOn ? 'url(#fanLedGlow)' : 'none'}" />
        <text x="63" y="44" fill="#ccc" font-family="Arial" font-size="2" text-anchor="middle">RUN</text>

        <!-- Pin Header -->
        <rect x="70" y="12" width="8" height="32" fill="#1a1a1a" stroke="#000" stroke-width="0.3" />
        <circle cx="75" cy="18" r="1.5" fill="#e8e8e8" />
        <circle cx="75" cy="28" r="1.5" fill="#e8e8e8" />
        <circle cx="75" cy="38" r="1.5" fill="#e8e8e8" />

        <!-- Pin Labels -->
        <text x="67" y="19" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="67" y="29" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="67" y="39" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">SIG</text>

        <!-- SMD Components -->
        <rect x="58" y="50" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="64" y="50" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="58" y="55" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="64" y="55" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('fan-element', FanElement);
