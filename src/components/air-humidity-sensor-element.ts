import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

/**
 * Air Humidity Sensor Element for Smart Farm
 *
 * Capacitive humidity sensor module for measuring air humidity.
 * Output range: 0-100% relative humidity (RH)
 *
 * Pin configuration:
 * - VCC: Power supply (3.3V or 5V)
 * - GND: Ground
 * - OUT: Analog output (0-3.3V proportional to humidity)
 */

export class AirHumiditySensorElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 55, y: 10, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 55, y: 20, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'OUT', x: 55, y: 30, signals: [], number: 3 },
  ];

  // Humidity value (0-100%), default 50%
  humidity = 50;
  // Power LED state
  ledPower = false;

  private svgContent() {
    return svg`
      <svg
        width="16mm"
        height="12mm"
        version="1.1"
        viewBox="0 0 60 45"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="humidity-mesh" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="#1565c0" />
            <circle cx="1.5" cy="1.5" r="0.8" fill="#0d47a1" />
          </pattern>
          <filter id="humidLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Main PCB Board - Blue -->
        <rect x="0" y="0" width="60" height="45" fill="#1565c0" rx="2" ry="2" stroke="#0d47a1" stroke-width="0.5" />

        <!-- Mounting holes -->
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />
        <circle cx="4" cy="41" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />

        <!-- Humidity Sensing Element (mesh pattern area) -->
        <rect x="8" y="8" width="28" height="28" fill="url(#humidity-mesh)" stroke="#0d47a1" stroke-width="0.5" rx="1" />

        <!-- Sensing element border -->
        <rect x="8" y="8" width="28" height="28" fill="none" stroke="#fff" stroke-width="0.3" stroke-dasharray="2,1" rx="1" />

        <!-- Water drop icon in center of sensing area -->
        <path d="M22 15 Q22 12 22 12 Q25 17 25 20 Q25 24 22 24 Q19 24 19 20 Q19 17 22 15 Z"
              fill="#64b5f6" opacity="0.8" stroke="#1976d2" stroke-width="0.3" />

        <!-- Label -->
        <text x="22" y="38" fill="#fff" font-family="Arial" font-size="3.5" text-anchor="middle" font-weight="bold">HUMIDITY</text>

        <!-- IC Chip (signal conditioning) -->
        <rect x="40" y="28" width="10" height="8" fill="#1a1a1a" stroke="#333" stroke-width="0.3" />
        <text x="45" y="34" fill="#999" font-family="Arial" font-size="2" text-anchor="middle">IC</text>

        <!-- Power LED -->
        <circle cx="42" y="12" r="1.5" fill="#00ff00" opacity="${this.ledPower ? 1 : 0.2}" filter="url(#humidLedGlow)" />
        <text x="42" y="18" fill="#ccc" font-family="Arial" font-size="2" text-anchor="middle">PWR</text>

        <!-- Pin Header (right side) -->
        <rect x="51" y="6" width="7" height="28" fill="#1a1a1a" stroke="#000" stroke-width="0.3" />
        <circle cx="55" cy="10" r="1.3" fill="#e8e8e8" />
        <circle cx="55" cy="20" r="1.3" fill="#e8e8e8" />
        <circle cx="55" cy="30" r="1.3" fill="#e8e8e8" />

        <!-- Pin Labels -->
        <text x="48" y="11" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="48" y="21" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="48" y="31" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">OUT</text>

        <!-- SMD Components -->
        <rect x="40" y="40" width="3" height="1.5" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="45" y="40" width="3" height="1.5" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="50" y="40" width="3" height="1.5" fill="#333" stroke="#000" stroke-width="0.1" />
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('air-humidity-sensor-element', AirHumiditySensorElement);
