import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmSen55AirI2cElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 75, y: 15, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 75, y: 25, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'SDA', x: 75, y: 35, signals: [{ type: 'i2c', signal: 'SDA', bus: 0 }], number: 3 },
    { name: 'SCL', x: 75, y: 45, signals: [{ type: 'i2c', signal: 'SCL', bus: 0 }], number: 4 },
  ];

  isOn = false;

  private svgContent() {
    return svg`
      <svg width="22mm" height="15mm" version="1.1" viewBox="0 0 80 55"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="sen55LedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="2" fill="#e8ece9"
              stroke="${this.isOn ? '#00a86b' : '#78909c'}"
              stroke-width="${this.isOn ? '2' : '0.7'}"/>
        <rect x="5" y="7" width="51" height="41" rx="4" fill="#f7f9f8" stroke="#90a4ae"/>
        <path d="M10 14h39M10 19h39M10 24h39M10 29h39M10 34h39M10 39h39"
              stroke="#b0bec5" stroke-width="1.5"/>
        <circle cx="18" cy="28" r="7.5" fill="#dce5e1" stroke="#78909c"/>
        <path d="M18 22v12M12 28h12M14 24l8 8M22 24l-8 8"
              stroke="#607d8b" stroke-width="1"/>

        <text x="40" y="13" fill="#173a31" font-family="Arial" font-size="4"
              font-weight="bold" text-anchor="middle">SEN55</text>
        <text x="40" y="44" fill="#45635b" font-family="Arial" font-size="2.4"
              text-anchor="middle">PM / RH / TEMP / VOC / NOx</text>

        <circle cx="60" cy="49" r="2"
                fill="${this.isOn ? '#00e676' : '#90a4ae'}"
                filter="${this.isOn ? 'url(#sen55LedGlow)' : 'none'}"/>

        <rect x="67" y="8" width="10" height="40" fill="#263238" stroke="#000" stroke-width="0.3"/>
        <circle cx="75" cy="15" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="25" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="35" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="45" r="1.5" fill="#e8e8e8"/>
        <text x="65" y="16" fill="#263238" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="65" y="26" fill="#263238" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="65" y="36" fill="#263238" font-family="Arial" font-size="2.5" text-anchor="end">SDA</text>
        <text x="65" y="46" fill="#263238" font-family="Arial" font-size="2.5" text-anchor="end">SCL</text>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('bfarm-sen55-air-i2c-element', BfarmSen55AirI2cElement);
