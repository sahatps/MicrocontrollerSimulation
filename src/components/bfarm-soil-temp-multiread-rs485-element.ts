import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmSoilTempMultireadRs485Element extends LitElement {
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
          <filter id="soilTempLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="80" height="55" fill="#5b3a29" rx="2" ry="2"
              stroke="${this.isOn ? '#ffca28' : 'none'}" stroke-width="${this.isOn ? '2' : '0'}"/>
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="4" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="76" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="76" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>

        <text x="32" y="10" fill="#fff8e1" font-family="Arial" font-size="4"
              font-weight="bold" text-anchor="middle">SOIL TEMP</text>
        <text x="32" y="16" fill="#ffe0b2" font-family="Arial" font-size="2.8"
              text-anchor="middle">MOISTURE / RS485</text>

        <rect x="6" y="22" width="15" height="21" fill="#795548" stroke="#3e2723"
              stroke-width="0.6" rx="1.5"/>
        <path d="M10 22 L10 14 M17 22 L17 14" stroke="#c8a46b" stroke-width="1.2"
              stroke-linecap="round"/>
        <path d="M8 33 Q13.5 26 19 33 Q13.5 40 8 33 Z" fill="#42a5f5" opacity="0.9"/>
        <circle cx="13.5" cy="33" r="1.6" fill="#bbdefb"/>

        <rect x="26" y="22" width="29" height="14" fill="#2f211b" stroke="#8d6e63"
              stroke-width="0.5" rx="1"/>
        <text x="40.5" y="27.5" fill="#90caf9" font-family="Arial" font-size="2.6"
              text-anchor="middle">MOIST  50.0%</text>
        <text x="40.5" y="33" fill="#ffcc80" font-family="Arial" font-size="2.6"
              text-anchor="middle">TEMP   25.0 C</text>

        <circle cx="40.5" cy="45.5" r="2"
                fill="${this.isOn ? '#ffca28' : '#b0bec5'}"
                opacity="${this.isOn ? '1' : '0.55'}"
                filter="${this.isOn ? 'url(#soilTempLedGlow)' : 'none'}"/>
        <text x="40.5" y="51" fill="#ffe0b2" font-family="Arial" font-size="2"
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

customElements.define('bfarm-soil-temp-multiread-rs485-element', BfarmSoilTempMultireadRs485Element);
