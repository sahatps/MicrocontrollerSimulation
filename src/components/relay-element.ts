import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

/**
 * Relay Element for Smart Farm
 *
 * Single-channel relay module for switching high-voltage/high-current loads.
 * Used for controlling pumps, fans, lights, and other actuators.
 *
 * Pin configuration (Control side - right):
 * - VCC: Power supply (5V)
 * - GND: Ground
 * - IN:  Signal input (HIGH = ON, LOW = OFF)
 *
 * Terminal configuration (Output side - left):
 * - COM: Common terminal
 * - NC:  Normally Closed (connected to COM when relay is OFF)
 * - NO:  Normally Open   (connected to COM when relay is ON)
 */

export class RelayElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 85, y: 20, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 85, y: 30, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'IN',  x: 85, y: 40, signals: [], number: 3 },
    { name: 'COM', x: 7,  y: 20, signals: [], number: 4 },
    { name: 'NC',  x: 7,  y: 32, signals: [], number: 5 },
    { name: 'NO',  x: 7,  y: 44, signals: [], number: 6 },
  ];

  // Relay state (on/off)
  isOn = false;

  private svgContent() {
    return svg`
      <svg
        width="24mm"
        height="18mm"
        version="1.1"
        viewBox="0 0 90 68"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="relayLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Main PCB Board - Blue -->
        <rect x="0" y="0" width="90" height="68" fill="#1565c0" rx="2" ry="2"
              stroke="${this.isOn ? '#ff4400' : 'none'}" stroke-width="${this.isOn ? '2' : '0'}" />

        <!-- Mounting holes -->
        <circle cx="4"  cy="4"  r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />
        <circle cx="4"  cy="64" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />
        <circle cx="86" cy="4"  r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />
        <circle cx="86" cy="64" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />

        <!-- Left Output Terminal Block (green screw terminals) -->
        <rect x="0" y="12" width="14" height="44" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.4" rx="1" />
        <!-- Terminal screw holes -->
        <circle cx="7" cy="20" r="3" fill="#e8e8e8" stroke="#999" stroke-width="0.5" />
        <circle cx="7" cy="32" r="3" fill="#e8e8e8" stroke="#999" stroke-width="0.5" />
        <circle cx="7" cy="44" r="3" fill="#e8e8e8" stroke="#999" stroke-width="0.5" />
        <!-- Screw slots -->
        <line x1="3.5" y1="20" x2="10.5" y2="20" stroke="#555" stroke-width="1" />
        <line x1="3.5" y1="32" x2="10.5" y2="32" stroke="#555" stroke-width="1" />
        <line x1="3.5" y1="44" x2="10.5" y2="44" stroke="#555" stroke-width="1" />
        <!-- Terminal labels -->
        <text x="7" y="27"   fill="#fff" font-family="Arial" font-size="2.5" text-anchor="middle">COM</text>
        <text x="7" y="39"   fill="#fff" font-family="Arial" font-size="2.5" text-anchor="middle">NC</text>
        <text x="7" y="51"   fill="#fff" font-family="Arial" font-size="2.5" text-anchor="middle">NO</text>

        <!-- Main Relay Housing (black body) -->
        <rect x="18" y="8" width="54" height="46" fill="#1a1a1a" stroke="#000" stroke-width="0.5" rx="2" />

        <!-- Relay model label -->
        <text x="45" y="15.5" fill="#777" font-family="Arial" font-size="2.8" text-anchor="middle">SRD-05VDC-SL-C</text>

        <!-- Coil area (left inside housing) -->
        <rect x="22" y="18" width="28" height="28" fill="#2d2d2d" stroke="#444" stroke-width="0.3" rx="1" />
        <!-- Coil winding lines -->
        <line x1="25" y1="22" x2="47" y2="22" stroke="#888" stroke-width="0.8" />
        <line x1="25" y1="25" x2="47" y2="25" stroke="#666" stroke-width="0.5" />
        <line x1="25" y1="28" x2="47" y2="28" stroke="#888" stroke-width="0.8" />
        <line x1="25" y1="31" x2="47" y2="31" stroke="#666" stroke-width="0.5" />
        <line x1="25" y1="34" x2="47" y2="34" stroke="#888" stroke-width="0.8" />
        <line x1="25" y1="37" x2="47" y2="37" stroke="#666" stroke-width="0.5" />
        <line x1="25" y1="40" x2="47" y2="40" stroke="#888" stroke-width="0.8" />
        <!-- Coil terminal dots -->
        <circle cx="27" cy="20" r="1.2" fill="#c8a020" />
        <circle cx="45" cy="20" r="1.2" fill="#c8a020" />
        <circle cx="27" cy="42" r="1.2" fill="#c8a020" />
        <circle cx="45" cy="42" r="1.2" fill="#c8a020" />

        <!-- Contact switch area (right inside housing) -->
        <rect x="54" y="18" width="14" height="28" fill="#222" stroke="#555" stroke-width="0.3" rx="1" />
        <!-- NC contact (top) - lit when OFF -->
        <circle cx="61" cy="23" r="2.2" fill="${this.isOn ? '#444' : '#c8a020'}" />
        <text x="61" y="28.5" fill="#888" font-family="Arial" font-size="2.5" text-anchor="middle">NC</text>
        <!-- NO contact (bottom) - lit when ON -->
        <circle cx="61" cy="39" r="2.2" fill="${this.isOn ? '#c8a020' : '#444'}" />
        <text x="61" y="44.5" fill="#888" font-family="Arial" font-size="2.5" text-anchor="middle">NO</text>
        <!-- Switch arm (pivoting) -->
        <line x1="61" y1="${this.isOn ? '32' : '26'}"
              x2="61" y2="${this.isOn ? '39' : '33'}"
              stroke="${this.isOn ? '#ff9800' : '#aaa'}" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="61" cy="32" r="1.5" fill="${this.isOn ? '#ff9800' : '#888'}" />

        <!-- LED indicator -->
        <circle cx="40" cy="58" r="3"
                fill="${this.isOn ? '#ff2200' : '#550000'}"
                filter="${this.isOn ? 'url(#relayLedGlow)' : 'none'}" />
        <text x="40" y="65" fill="#ccc" font-family="Arial" font-size="2.5" text-anchor="middle">LED</text>

        <!-- RELAY Label -->
        <text x="59" y="61" fill="#fff" font-family="Arial" font-size="5" text-anchor="middle" font-weight="bold">RELAY</text>

        <!-- Right Pin Header (control side) -->
        <rect x="78" y="14" width="10" height="32" fill="#1a1a1a" stroke="#000" stroke-width="0.3" />
        <circle cx="85" cy="20" r="1.5" fill="#e8e8e8" />
        <circle cx="85" cy="30" r="1.5" fill="#e8e8e8" />
        <circle cx="85" cy="40" r="1.5" fill="#e8e8e8" />
        <!-- Pin Labels -->
        <text x="77" y="21" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="77" y="31" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="77" y="41" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">IN</text>

        <!-- SMD Components (transistor/optocoupler/diode) -->
        <rect x="68" y="15" width="5" height="3" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="68" y="22" width="5" height="3" fill="#222" stroke="#000" stroke-width="0.1" />
        <rect x="68" y="42" width="5" height="3" fill="#333" stroke="#000" stroke-width="0.1" />
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('relay-element', RelayElement);
