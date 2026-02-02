import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

/**
 * pH Sensor Element for Smart Farm
 *
 * Analog pH sensor module for measuring soil/water acidity.
 * Output range: 0-14 pH scale
 *
 * Pin configuration:
 * - VCC: Power supply (3.3V or 5V)
 * - GND: Ground
 * - AO: Analog output (0-3.3V proportional to pH)
 */

export class PhSensorElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 60, y: 12, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 60, y: 22, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'AO', x: 60, y: 32, signals: [], number: 3 },
  ];

  // pH value (0-14), default neutral
  value = 7.0;
  // Power LED state
  ledPower = false;

  private svgContent() {
    return svg`
      <svg
        width="17mm"
        height="26mm"
        version="1.1"
        viewBox="0 0 65 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="ph-pin-pattern" width="2.5" height="2.5" patternUnits="userSpaceOnUse">
            <circle cx="1.25" cy="1.25" r=".8" fill="#e8e8e8" />
          </pattern>
          <filter id="phLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Main PCB Board - Blue -->
        <rect x="0" y="0" width="65" height="100" fill="#1565c0" rx="2" ry="2" stroke="#0d47a1" stroke-width="0.5" />

        <!-- Mounting holes -->
        <circle cx="5" cy="5" r="2" fill="#333" stroke="#000" stroke-width="0.3" />
        <circle cx="60" cy="5" r="2" fill="#333" stroke="#000" stroke-width="0.3" />
        <circle cx="5" cy="95" r="2" fill="#333" stroke="#000" stroke-width="0.3" />
        <circle cx="60" cy="95" r="2" fill="#333" stroke="#000" stroke-width="0.3" />

        <!-- BNC Connector (top) -->
        <circle cx="32.5" cy="20" r="10" fill="#c0c0c0" stroke="#666" stroke-width="0.5" />
        <circle cx="32.5" cy="20" r="7" fill="#999" stroke="#666" stroke-width="0.3" />
        <circle cx="32.5" cy="20" r="3" fill="#333" />
        <text x="32.5" y="35" fill="#fff" font-family="Arial" font-size="4" text-anchor="middle">BNC</text>

        <!-- pH Label -->
        <text x="32.5" y="48" fill="#fff" font-family="Arial" font-size="8" text-anchor="middle" font-weight="bold">pH</text>
        <text x="32.5" y="56" fill="#ccc" font-family="Arial" font-size="3.5" text-anchor="middle">SENSOR</text>

        <!-- Op-Amp IC Chip -->
        <rect x="10" y="62" width="16" height="10" fill="#1a1a1a" stroke="#333" stroke-width="0.3" />
        <text x="18" y="69" fill="#999" font-family="Arial" font-size="2.5" text-anchor="middle">LM358</text>

        <!-- Potentiometer (calibration) -->
        <circle cx="42" cy="67" r="5" fill="#333" stroke="#000" stroke-width="0.3" />
        <line x1="42" y1="62" x2="42" y2="67" stroke="#fff" stroke-width="0.8" />
        <text x="42" y="78" fill="#ccc" font-family="Arial" font-size="2.5" text-anchor="middle">CAL</text>

        <!-- Power LED -->
        <circle cx="15" cy="82" r="2" fill="#00ff00" opacity="${this.ledPower ? 1 : 0.2}" filter="url(#phLedGlow)" />
        <text x="15" y="89" fill="#ccc" font-family="Arial" font-size="2.5" text-anchor="middle">PWR</text>

        <!-- Pin Header (right side) -->
        <rect x="55" y="8" width="8" height="28" fill="#1a1a1a" stroke="#000" stroke-width="0.3" />
        <circle cx="60" cy="12" r="1.5" fill="#e8e8e8" />
        <circle cx="60" cy="22" r="1.5" fill="#e8e8e8" />
        <circle cx="60" cy="32" r="1.5" fill="#e8e8e8" />

        <!-- Pin Labels -->
        <text x="52" y="13" fill="#fff" font-family="Arial" font-size="3" text-anchor="end">VCC</text>
        <text x="52" y="23" fill="#fff" font-family="Arial" font-size="3" text-anchor="end">GND</text>
        <text x="52" y="33" fill="#fff" font-family="Arial" font-size="3" text-anchor="end">AO</text>

        <!-- SMD Components -->
        <rect x="10" y="50" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.2" />
        <rect x="17" y="50" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.2" />
        <rect x="24" y="50" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.2" />
        <rect x="35" y="50" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.2" />
        <rect x="42" y="50" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.2" />

        <!-- Capacitors -->
        <rect x="30" y="62" width="3" height="5" fill="#996633" stroke="#000" stroke-width="0.2" />
        <rect x="50" y="80" width="3" height="5" fill="#996633" stroke="#000" stroke-width="0.2" />
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('ph-sensor-element', PhSensorElement);
