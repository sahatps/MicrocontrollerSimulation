import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmAmmoniaRs485Element extends LitElement {
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
          <filter id="ammoniaLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="80" height="55" fill="#124559" rx="2" ry="2"
              stroke="${this.isOn ? '#4dd0e1' : 'none'}" stroke-width="${this.isOn ? '2' : '0'}"/>
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="4" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="76" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="76" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>

        <text x="31" y="11" fill="#fff" font-family="Arial" font-size="4.4"
              font-weight="bold" text-anchor="middle">AMMONIA</text>
        <text x="31" y="18" fill="#d9f3f5" font-family="Arial" font-size="3.2"
              text-anchor="middle">RS485 / MODBUS</text>

        <rect x="6" y="24" width="18" height="18" fill="#d7eef2" stroke="#7eb4bd"
              stroke-width="0.6" rx="2"/>
        <path d="M10 37 C13 28, 17 28, 20 37 Z" fill="#4dd0e1" opacity="0.8"/>
        <text x="15" y="33" fill="#124559" font-family="Arial" font-size="3.8"
              font-weight="bold" text-anchor="middle">NH3</text>

        <rect x="29" y="24" width="26" height="12" fill="#102a33" stroke="#477987"
              stroke-width="0.4" rx="1"/>
        <text x="42" y="29.5" fill="#b2ebf2" font-family="Arial" font-size="2.5"
              text-anchor="middle">NH3  pH  TEMP</text>
        <text x="42" y="33.5" fill="#80deea" font-family="Arial" font-size="2.1"
              text-anchor="middle">3 REGISTER</text>

        <circle cx="42" cy="45.5" r="2"
                fill="${this.isOn ? '#4dd0e1' : '#b0bec5'}"
                opacity="${this.isOn ? '1' : '0.55'}"
                filter="${this.isOn ? 'url(#ammoniaLedGlow)' : 'none'}"/>
        <text x="42" y="51" fill="#d9f3f5" font-family="Arial" font-size="2"
              text-anchor="middle">ACTIVE</text>

        <rect x="67" y="8" width="10" height="40" fill="#1a1a1a" stroke="#000" stroke-width="0.3"/>
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

customElements.define('bfarm-ammonia-rs485-element', BfarmAmmoniaRs485Element);
