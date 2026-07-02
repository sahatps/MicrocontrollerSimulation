import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmTmecTensioRs485Element extends LitElement {
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
          <linearGradient id="tensioSoil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#d9bf83"/>
            <stop offset="0.55" stop-color="#96643c"/>
            <stop offset="1" stop-color="#50331f"/>
          </linearGradient>
          <filter id="tensioGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#17272a"
              stroke="${this.isOn ? '#65d6d0' : '#63777a'}"
              stroke-width="${this.isOn ? '2' : '0.7'}"/>
        <rect x="5" y="6" width="53" height="43" rx="3" fill="#eef1e9" stroke="#82928c"/>
        <text x="31.5" y="12" fill="#173d46" font-family="Arial" font-size="4"
              font-weight="bold" text-anchor="middle">TMEC TENSIO</text>

        <rect x="9" y="17" width="45" height="27" rx="2" fill="url(#tensioSoil)" stroke="#68442b"/>
        <path d="M9 24 C17 20, 24 27, 32 23 S46 21, 54 25" fill="none"
              stroke="#ead8a8" stroke-width="1.2" opacity="0.8"/>
        <rect x="27" y="15" width="8" height="24" rx="2" fill="#d8e5e3" stroke="#315e66"/>
        <circle cx="31" cy="20" r="2.3" fill="${this.isOn ? '#63e6df' : '#74999b'}"
                filter="${this.isOn ? 'url(#tensioGlow)' : 'none'}"/>
        <path d="M31 22 V34 M28.5 35 H33.5" stroke="#315e66" stroke-width="1.3"
              stroke-linecap="round"/>
        <circle cx="15" cy="35" r="1.2" fill="#d4b177"/>
        <circle cx="45" cy="32" r="1.6" fill="#c89c61"/>
        <text x="31.5" y="48" fill="#173d46" font-family="Arial" font-size="2.6"
              text-anchor="middle">T / RH / LUX / VOLT</text>

        <circle cx="61" cy="48" r="2"
                fill="${this.isOn ? '#65d6d0' : '#789493'}"
                filter="${this.isOn ? 'url(#tensioGlow)' : 'none'}"/>

        <rect x="67" y="8" width="10" height="40" fill="#101820" stroke="#000" stroke-width="0.3"/>
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

customElements.define('bfarm-tmec-tensio-rs485-element', BfarmTmecTensioRs485Element);
