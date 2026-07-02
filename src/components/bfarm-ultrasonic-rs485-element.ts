import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmUltrasonicRs485Element extends LitElement {
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
          <filter id="ultrasonicRs485Glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#17324d"
              stroke="${this.isOn ? '#36d7ff' : '#58738d'}"
              stroke-width="${this.isOn ? '2' : '0.7'}"/>
        <rect x="5" y="7" width="51" height="41" rx="3" fill="#dce8ef" stroke="#78909c"/>
        <circle cx="19" cy="27" r="10" fill="#263b4b" stroke="#91a9b8" stroke-width="1.2"/>
        <circle cx="19" cy="27" r="6.5" fill="#101d27" stroke="#607d8b"/>
        <path d="M31 18 Q43 27 31 36 M35 14 Q52 27 35 40"
              fill="none" stroke="${this.isOn ? '#00b8e6' : '#78909c'}"
              stroke-width="1.6" stroke-linecap="round"
              filter="${this.isOn ? 'url(#ultrasonicRs485Glow)' : 'none'}"/>

        <text x="30" y="11" fill="#17324d" font-family="Arial" font-size="3.7"
              font-weight="bold" text-anchor="middle">ULTRASONIC</text>
        <text x="37" y="46" fill="#35556c" font-family="Arial" font-size="2.7"
              text-anchor="middle">RS485 / DISTANCE</text>

        <circle cx="60" cy="49" r="2"
                fill="${this.isOn ? '#36d7ff' : '#78909c'}"
                filter="${this.isOn ? 'url(#ultrasonicRs485Glow)' : 'none'}"/>

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

customElements.define('bfarm-ultrasonic-rs485-element', BfarmUltrasonicRs485Element);
