import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

/**
 * Water Pump Element for Smart Farm
 *
 * Submersible or peristaltic water pump for irrigation systems.
 * Used for watering plants and managing water flow in smart farms.
 *
 * Pin configuration:
 * - VCC: Power supply (5V or 12V depending on pump)
 * - GND: Ground
 * - SIG: Digital signal input (HIGH = ON, LOW = OFF)
 */

export class WaterPumpElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 65, y: 15, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 65, y: 25, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'SIG', x: 65, y: 35, signals: [], number: 3 },
  ];

  // Pump state (on/off)
  isOn = false;
  // Power LED state
  ledPower = false;

  private svgContent() {
    return svg`
      <svg
        width="18mm"
        height="16mm"
        version="1.1"
        viewBox="0 0 70 60"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="pumpGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="pumpLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Main PCB Board - Blue -->
        <rect x="0" y="0" width="70" height="60" fill="#1565c0" rx="2" ry="2" stroke="#0d47a1" stroke-width="0.5" />

        <!-- Mounting holes -->
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />
        <circle cx="4" cy="56" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />

        <!-- Pump Motor Housing (larger) -->
        <rect x="5" y="12" width="38" height="36" fill="#2e7d32" rx="4" ry="4"
              stroke="#1b5e20" stroke-width="0.5"
              opacity="${this.isOn ? 1 : 0.7}"
              filter="${this.isOn ? 'url(#pumpGlow)' : 'none'}" />

        <!-- Pump Body -->
        <circle cx="24" cy="30" r="14" fill="#1b5e20" stroke="#0d3d10" stroke-width="0.5" />
        <circle cx="24" cy="30" r="9" fill="#2d2d2d" stroke="#1a1a1a" stroke-width="0.5" />

        <!-- Impeller Blades -->
        <g transform="translate(24,30)" opacity="${this.isOn ? 0.6 : 1}">
          <rect x="-1.5" y="-7" width="3" height="14" fill="#555" rx="0.5" />
          <rect x="-7" y="-1.5" width="14" height="3" fill="#555" rx="0.5" />
          <rect x="-5" y="-5" width="10" height="10" fill="none" stroke="#666" stroke-width="0.5" transform="rotate(45)" />
        </g>

        <!-- Motor Center Hub -->
        <circle cx="24" cy="30" r="3" fill="#444" stroke="#333" stroke-width="0.3" />

        <!-- Water inlet pipe -->
        <rect x="38" y="18" width="6" height="6" fill="#666" stroke="#444" stroke-width="0.3" rx="1" />
        <text x="41" y="16" fill="#ccc" font-family="Arial" font-size="2" text-anchor="middle">IN</text>

        <!-- Water outlet pipe -->
        <rect x="38" y="36" width="6" height="6" fill="#666" stroke="#444" stroke-width="0.3" rx="1" />
        <text x="41" y="46" fill="#ccc" font-family="Arial" font-size="2" text-anchor="middle">OUT</text>

        <!-- Water Flow Arrow (visible when on) -->
        <g opacity="${this.isOn ? 1 : 0}">
          <path d="M 8 52 L 16 52 L 16 49 L 24 54 L 16 59 L 16 56 L 8 56 Z" fill="#2196f3" stroke="#1976d2" stroke-width="0.3" />
          <circle cx="28" cy="54" r="1.5" fill="#64b5f6" opacity="0.8" />
          <circle cx="33" cy="53" r="1" fill="#64b5f6" opacity="0.6" />
          <circle cx="37" cy="55" r="1.2" fill="#64b5f6" opacity="0.7" />
        </g>

        <!-- Label -->
        <text x="24" y="8" fill="#fff" font-family="Arial" font-size="3.5" text-anchor="middle" font-weight="bold">WATER PUMP</text>

        <!-- Power LED -->
        <circle cx="52" cy="18" r="2" fill="${this.isOn ? '#00ff00' : '#004400'}"
                filter="${this.isOn ? 'url(#pumpLedGlow)' : 'none'}" />
        <text x="52" y="25" fill="#ccc" font-family="Arial" font-size="2.5" text-anchor="middle">PWR</text>

        <!-- Status indicator -->
        <rect x="47" y="30" width="10" height="6" fill="#1a1a1a" stroke="#333" stroke-width="0.3" rx="1" />
        <circle cx="52" cy="33" r="1.5" fill="${this.isOn ? '#4caf50' : '#1b5e20'}"
                filter="${this.isOn ? 'url(#pumpLedGlow)' : 'none'}" />

        <!-- Pin Header (right side) -->
        <rect x="60" y="10" width="8" height="30" fill="#1a1a1a" stroke="#000" stroke-width="0.3" />
        <circle cx="65" cy="15" r="1.3" fill="#e8e8e8" />
        <circle cx="65" cy="25" r="1.3" fill="#e8e8e8" />
        <circle cx="65" cy="35" r="1.3" fill="#e8e8e8" />

        <!-- Pin Labels -->
        <text x="57" y="16" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="57" y="26" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="57" y="36" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">SIG</text>

        <!-- SMD Components -->
        <rect x="47" y="42" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="53" y="42" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="47" y="48" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="53" y="48" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('water-pump-element', WaterPumpElement);
