import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

/**
 * Misting Pump Element for Smart Farm
 *
 * Water misting pump for humidity control in greenhouse/farm environments.
 * Creates fine water mist for maintaining optimal humidity levels.
 *
 * Pin configuration:
 * - VCC: Power supply (5V or 12V depending on pump)
 * - GND: Ground
 * - SIG: Digital signal input (HIGH = ON, LOW = OFF)
 */

export class MistingPumpElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 60, y: 12, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 60, y: 22, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'SIG', x: 60, y: 32, signals: [], number: 3 },
  ];

  // Pump state (on/off)
  isOn = false;
  // Power LED state
  ledPower = false;

  private svgContent() {
    return svg`
      <svg
        width="17mm"
        height="14mm"
        version="1.1"
        viewBox="0 0 65 55"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="mistingGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="mistLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Main PCB Board - Blue -->
        <rect x="0" y="0" width="65" height="55" fill="#1565c0" rx="2" ry="2" stroke="#0d47a1" stroke-width="0.5" />

        <!-- Mounting holes -->
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />
        <circle cx="4" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />

        <!-- Pump Motor Housing -->
        <rect x="6" y="10" width="32" height="32" fill="#2d2d2d" rx="3" ry="3"
              stroke="#1a1a1a" stroke-width="0.5"
              opacity="${this.isOn ? 1 : 0.7}"
              filter="${this.isOn ? 'url(#mistingGlow)' : 'none'}" />

        <!-- Motor Core -->
        <circle cx="22" cy="26" r="11" fill="#404040" stroke="#333" stroke-width="0.5" />
        <circle cx="22" cy="26" r="7" fill="#555" />
        <circle cx="22" cy="26" r="3" fill="#333" />

        <!-- Pump outlet pipe -->
        <rect x="34" y="22" width="8" height="8" fill="#666" stroke="#444" stroke-width="0.3" rx="1" />
        <circle cx="38" cy="26" r="2" fill="#444" />

        <!-- Mist Droplets (visible when on) -->
        <g opacity="${this.isOn ? 1 : 0}">
          <circle cx="8" cy="6" r="1.2" fill="#64b5f6" opacity="0.8" />
          <circle cx="14" cy="4" r="0.9" fill="#64b5f6" opacity="0.7" />
          <circle cx="20" cy="5" r="1.1" fill="#64b5f6" opacity="0.9" />
          <circle cx="26" cy="3" r="0.7" fill="#64b5f6" opacity="0.6" />
          <circle cx="32" cy="5" r="1.0" fill="#64b5f6" opacity="0.8" />
          <circle cx="38" cy="4" r="0.8" fill="#64b5f6" opacity="0.7" />
        </g>

        <!-- Water drop icon -->
        <path d="M22 20 Q22 17 22 17 Q25 21 25 24 Q25 27 22 27 Q19 27 19 24 Q19 21 22 20 Z"
              fill="${this.isOn ? '#2196f3' : '#1565c0'}" opacity="0.6" stroke="#0d47a1" stroke-width="0.3" />

        <!-- Label -->
        <text x="22" y="48" fill="#fff" font-family="Arial" font-size="3.5" text-anchor="middle" font-weight="bold">MIST PUMP</text>

        <!-- Power LED -->
        <circle cx="46" cy="15" r="2" fill="${this.isOn ? '#00ff00' : '#004400'}"
                filter="${this.isOn ? 'url(#mistLedGlow)' : 'none'}" />
        <text x="46" y="22" fill="#ccc" font-family="Arial" font-size="2.5" text-anchor="middle">PWR</text>

        <!-- Status indicator -->
        <rect x="42" y="28" width="10" height="6" fill="#1a1a1a" stroke="#333" stroke-width="0.3" rx="1" />
        <circle cx="47" cy="31" r="1.5" fill="${this.isOn ? '#00bcd4' : '#004d56'}"
                filter="${this.isOn ? 'url(#mistLedGlow)' : 'none'}" />

        <!-- Pin Header (right side) -->
        <rect x="55" y="8" width="8" height="28" fill="#1a1a1a" stroke="#000" stroke-width="0.3" />
        <circle cx="60" cy="12" r="1.3" fill="#e8e8e8" />
        <circle cx="60" cy="22" r="1.3" fill="#e8e8e8" />
        <circle cx="60" cy="32" r="1.3" fill="#e8e8e8" />

        <!-- Pin Labels -->
        <text x="52" y="13" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="52" y="23" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="52" y="33" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">SIG</text>

        <!-- SMD Components -->
        <rect x="42" y="40" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="48" y="40" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="42" y="45" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('misting-pump-element', MistingPumpElement);
