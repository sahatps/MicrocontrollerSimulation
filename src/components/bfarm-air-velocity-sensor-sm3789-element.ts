import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmAirVelocitySensorSm3789Element extends LitElement {
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
          <filter id="sm3789Glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#d8e6df"
              stroke="${this.isOn ? '#24b36b' : '#71867b'}"
              stroke-width="${this.isOn ? '2' : '0.8'}"/>
        <rect x="5" y="6" width="53" height="43" rx="4" fill="#f4f7f5" stroke="#83978d"/>
        <circle cx="20" cy="29" r="12" fill="#33443c" stroke="#70827a"/>
        <circle cx="20" cy="29" r="3" fill="#b7c7bf"/>
        <path d="M20 26c1-8 8-8 9-4 1 4-4 7-7 8M22 30c7 4 4 10 0 10-4 0-5-6-3-9M18 31c-7 4-11-2-8-6 3-3 8 0 9 3"
              fill="${this.isOn ? '#45d483' : '#8fa59a'}"
              filter="${this.isOn ? 'url(#sm3789Glow)' : 'none'}"/>
        <path d="M37 23h14M34 29h19M38 35h12"
              stroke="${this.isOn ? '#24b36b' : '#71867b'}"
              stroke-width="1.5" stroke-linecap="round"/>
        <text x="40" y="12" fill="#274137" font-family="Arial" font-size="4"
              font-weight="bold" text-anchor="middle">SM3789</text>
        <text x="40" y="45" fill="#52695f" font-family="Arial" font-size="2.8"
              text-anchor="middle">AIR VELOCITY / RS485</text>

        <rect x="67" y="8" width="10" height="40" fill="#18221e" stroke="#000" stroke-width="0.3"/>
        <circle cx="75" cy="15" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="25" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="35" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="45" r="1.5" fill="#e8e8e8"/>
        <text x="65" y="16" fill="#263b32" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="65" y="26" fill="#263b32" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="65" y="36" fill="#263b32" font-family="Arial" font-size="2.5" text-anchor="end">A+</text>
        <text x="65" y="46" fill="#263b32" font-family="Arial" font-size="2.5" text-anchor="end">B-</text>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('bfarm-air-velocity-sensor-sm3789-element', BfarmAirVelocitySensorSm3789Element);
