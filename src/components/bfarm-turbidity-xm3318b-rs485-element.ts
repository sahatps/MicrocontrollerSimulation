import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmTurbidityXm3318bRs485Element extends LitElement {
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
          <linearGradient id="xm3318bWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#b9eff4"/>
            <stop offset="1" stop-color="#2a9daa"/>
          </linearGradient>
          <filter id="xm3318bGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#11383b"
              stroke="${this.isOn ? '#63e6d8' : '#53797b'}"
              stroke-width="${this.isOn ? '2' : '0.7'}"/>
        <rect x="5" y="6" width="53" height="43" rx="3" fill="#e9f2ed" stroke="#7d9790"/>
        <text x="31.5" y="12" fill="#153f42" font-family="Arial" font-size="3.8"
              font-weight="bold" text-anchor="middle">XM3318B</text>

        <rect x="9" y="17" width="45" height="27" rx="2" fill="url(#xm3318bWater)" stroke="#287b84"/>
        <path d="M9 28 C16 24, 22 32, 29 28 S42 24, 54 28 V44 H9 Z"
              fill="#287f8b" opacity="0.65"/>
        <circle cx="17" cy="34" r="2.4" fill="#d4c5a5" opacity="0.85"/>
        <circle cx="25" cy="30" r="1.7" fill="#e2d6b9" opacity="0.8"/>
        <circle cx="38" cy="36" r="2.8" fill="#c6b48e" opacity="0.85"/>
        <circle cx="47" cy="31" r="1.9" fill="#ebdfc6" opacity="0.8"/>
        <path d="M15 20 H48" stroke="${this.isOn ? '#b9fff6' : '#cfe7e5'}"
              stroke-width="1.4" stroke-linecap="round"
              filter="${this.isOn ? 'url(#xm3318bGlow)' : 'none'}"/>
        <text x="31.5" y="48" fill="#153f42" font-family="Arial" font-size="2.6"
              text-anchor="middle">TURBIDITY / RS485</text>

        <circle cx="61" cy="48" r="2"
                fill="${this.isOn ? '#63e6d8' : '#789493'}"
                filter="${this.isOn ? 'url(#xm3318bGlow)' : 'none'}"/>

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

customElements.define('bfarm-turbidity-xm3318b-rs485-element', BfarmTurbidityXm3318bRs485Element);
