import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmLux120kRs485Element extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 75, y: 15, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 75, y: 25, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'A+', x: 75, y: 35, signals: [], number: 3 },
    { name: 'B-', x: 75, y: 45, signals: [], number: 4 },
  ];

  isOn = false;

  private svgContent() {
    return svg`
      <svg width="22mm" height="15mm" version="1.1" viewBox="0 0 80 55"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="lux120kLens" cx="42%" cy="35%">
            <stop offset="0%" stop-color="#fff9c4"/>
            <stop offset="50%" stop-color="#fbc02d"/>
            <stop offset="100%" stop-color="#8d6e00"/>
          </radialGradient>
          <filter id="lux120kGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#25291f"
              stroke="${this.isOn ? '#ffd740' : '#747866'}"
              stroke-width="${this.isOn ? '2' : '0.8'}"/>
        <rect x="5" y="6" width="53" height="43" rx="4" fill="#43483a" stroke="#737966"/>
        <circle cx="20" cy="28" r="12" fill="#11140f" stroke="#8d927f"/>
        <circle cx="20" cy="28" r="8" fill="url(#lux120kLens)"
                filter="${this.isOn ? 'url(#lux120kGlow)' : 'none'}"/>
        <path d="M20 12v-4M20 48v-4M4 28H1M39 28h4M9 17l-3-3M31 39l3 3M31 17l3-3M9 39l-3 3"
              stroke="${this.isOn ? '#ffd740' : '#858a75'}"
              stroke-width="1.2" stroke-linecap="round"/>
        <text x="42" y="15" fill="#fff4b5" font-family="Arial" font-size="4"
              font-weight="bold" text-anchor="middle">LUX120K</text>
        <text x="42" y="24" fill="#d6d2a3" font-family="Arial" font-size="3"
              text-anchor="middle">0 - 120,000 lx</text>
        <text x="42" y="43" fill="#b9b79b" font-family="Arial" font-size="2.8"
              text-anchor="middle">MODBUS RS485</text>

        <rect x="67" y="8" width="10" height="40" fill="#11130f" stroke="#000" stroke-width="0.3"/>
        <circle cx="75" cy="15" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="25" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="35" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="45" r="1.5" fill="#e8e8e8"/>
        <text x="65" y="16" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="65" y="26" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="65" y="36" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">A+</text>
        <text x="65" y="46" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">B-</text>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('bfarm-lux120k-rs485-element', BfarmLux120kRs485Element);
