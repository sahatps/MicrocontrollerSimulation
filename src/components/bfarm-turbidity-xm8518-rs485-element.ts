import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmTurbidityXm8518Rs485Element extends LitElement {
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
          <linearGradient id="xm8518Water" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#d8f6f0"/>
            <stop offset="0.55" stop-color="#58b9b0"/>
            <stop offset="1" stop-color="#136b72"/>
          </linearGradient>
          <filter id="xm8518Glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#172e35"
              stroke="${this.isOn ? '#ffd166' : '#60777c'}"
              stroke-width="${this.isOn ? '2' : '0.7'}"/>
        <rect x="5" y="6" width="53" height="43" rx="3" fill="#edf4ef" stroke="#7e9691"/>
        <text x="31.5" y="12" fill="#173c43" font-family="Arial" font-size="3.8"
              font-weight="bold" text-anchor="middle">XM8518</text>

        <rect x="9" y="17" width="45" height="27" rx="2" fill="url(#xm8518Water)" stroke="#216f75"/>
        <path d="M9 29 C16 25, 22 33, 30 28 S44 24, 54 29 V44 H9 Z"
              fill="#246f78" opacity="0.72"/>
        <path d="M13 22 L50 39 M17 19 L54 35" stroke="#d9c49a" stroke-width="1.1" opacity="0.62"/>
        <circle cx="18" cy="35" r="2.1" fill="#d6c5a0"/>
        <circle cx="31" cy="32" r="2.7" fill="#b9a77f"/>
        <circle cx="45" cy="36" r="1.8" fill="#eadcbc"/>
        <path d="M14 20 H49" stroke="${this.isOn ? '#fff1b5' : '#cce8e3'}"
              stroke-width="1.5" stroke-linecap="round"
              filter="${this.isOn ? 'url(#xm8518Glow)' : 'none'}"/>
        <text x="31.5" y="48" fill="#173c43" font-family="Arial" font-size="2.6"
              text-anchor="middle">TURBIDITY / RS485</text>

        <circle cx="61" cy="48" r="2"
                fill="${this.isOn ? '#ffd166' : '#789493'}"
                filter="${this.isOn ? 'url(#xm8518Glow)' : 'none'}"/>

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

customElements.define('bfarm-turbidity-xm8518-rs485-element', BfarmTurbidityXm8518Rs485Element);
