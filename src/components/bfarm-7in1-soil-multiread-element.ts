import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class Bfarm7in1SoilMultireadElement extends LitElement {
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
          <filter id="soil7in1LedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="80" height="55" fill="#1f5f3b" rx="2" ry="2"
              stroke="${this.isOn ? '#00e676' : 'none'}" stroke-width="${this.isOn ? '2' : '0'}"/>
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="4" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="76" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="76" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>

        <text x="30" y="11" fill="#fff" font-family="Arial" font-size="4.4" font-weight="bold" text-anchor="middle">RS485 SOIL</text>
        <text x="30" y="18" fill="#d8f3dc" font-family="Arial" font-size="3.2" text-anchor="middle">7in1 MultiRead</text>

        <rect x="5" y="23" width="14" height="19" fill="#5d4037" stroke="#3e2723" stroke-width="0.4" rx="1.5"/>
        <path d="M10 22 L10 14 M14 22 L14 14" stroke="#c8a46b" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="12" cy="31" r="4.2" fill="#8bc34a" stroke="#558b2f" stroke-width="0.6"/>
        <text x="12" y="32.5" fill="#16351d" font-family="Arial" font-size="2.2" font-weight="bold" text-anchor="middle">NPK</text>

        <rect x="24" y="24" width="18" height="12" fill="#1a1a1a" stroke="#444" stroke-width="0.3" rx="1"/>
        <text x="33" y="31.5" fill="#7dbd87" font-family="Arial" font-size="2.4" text-anchor="middle">MODBUS</text>

        <rect x="24" y="41" width="5" height="2.5" fill="#2f2f2f"/>
        <rect x="31" y="41" width="5" height="2.5" fill="#2f2f2f"/>
        <rect x="38" y="41" width="5" height="2.5" fill="#2f2f2f"/>

        <text x="49" y="23" fill="#dcedc8" font-family="Arial" font-size="2.4">M</text>
        <text x="54" y="23" fill="#dcedc8" font-family="Arial" font-size="2.4">T</text>
        <text x="59" y="23" fill="#dcedc8" font-family="Arial" font-size="2.4">EC</text>
        <text x="49" y="29" fill="#dcedc8" font-family="Arial" font-size="2.4">pH</text>
        <text x="57" y="29" fill="#dcedc8" font-family="Arial" font-size="2.4">NPK</text>

        <circle cx="52" cy="46.5" r="2"
                fill="${this.isOn ? '#00e676' : '#b0bec5'}"
                opacity="${this.isOn ? '1' : '0.55'}"
                filter="${this.isOn ? 'url(#soil7in1LedGlow)' : 'none'}"/>
        <text x="52" y="52" fill="#d8f3dc" font-family="Arial" font-size="2" text-anchor="middle">PWR</text>

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

customElements.define('bfarm-7in1-soil-multiread-element', Bfarm7in1SoilMultireadElement);
