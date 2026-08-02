import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmWaterQualitySuiteRs485Element extends LitElement {
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
          <linearGradient id="waterSuiteBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ddf8f2"/>
            <stop offset="0.5" stop-color="#57c5bb"/>
            <stop offset="1" stop-color="#075c72"/>
          </linearGradient>
          <filter id="waterSuiteGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#102b35"
              stroke="${this.isOn ? '#52f2d0' : '#60777c'}"
              stroke-width="${this.isOn ? '2' : '0.7'}"/>
        <rect x="5" y="6" width="53" height="43" rx="3" fill="#edf6f1" stroke="#789590"/>
        <text x="31.5" y="12" fill="#123e48" font-family="Arial" font-size="3.5"
              font-weight="bold" text-anchor="middle">WATER QUALITY</text>

        <rect x="9" y="16" width="45" height="28" rx="3" fill="url(#waterSuiteBody)" stroke="#167582"/>
        <path d="M9 29 C16 24, 23 34, 31 28 S46 24, 54 30 V44 H9 Z"
              fill="#16738a" opacity="0.72"/>
        <path d="M12 25 C18 20, 25 30, 32 24 S46 21, 52 26"
              fill="none" stroke="${this.isOn ? '#b9fff0' : '#d1eee8'}"
              stroke-width="1.4" filter="${this.isOn ? 'url(#waterSuiteGlow)' : 'none'}"/>

        <circle cx="17" cy="34" r="5" fill="#f6fffd" stroke="#2b7b83"/>
        <text x="17" y="35.3" fill="#165660" font-family="Arial" font-size="3.4"
              font-weight="bold" text-anchor="middle">pH</text>
        <circle cx="31.5" cy="34" r="5" fill="#f6fffd" stroke="#2b7b83"/>
        <text x="31.5" y="35.3" fill="#165660" font-family="Arial" font-size="3.2"
              font-weight="bold" text-anchor="middle">DO</text>
        <circle cx="46" cy="34" r="5" fill="#f6fffd" stroke="#2b7b83"/>
        <text x="46" y="35.3" fill="#165660" font-family="Arial" font-size="3.2"
              font-weight="bold" text-anchor="middle">EC</text>

        <text x="31.5" y="48" fill="#173f47" font-family="Arial" font-size="2.5"
              text-anchor="middle">LEVEL / pH / DO / EC / NH3</text>
        <circle cx="61" cy="48" r="2"
                fill="${this.isOn ? '#52f2d0' : '#789493'}"
                filter="${this.isOn ? 'url(#waterSuiteGlow)' : 'none'}"/>

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

customElements.define('bfarm-water-quality-suite-rs485-element', BfarmWaterQualitySuiteRs485Element);
