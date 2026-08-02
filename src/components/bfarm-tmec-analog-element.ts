import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmTmecAnalogElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 75, y: 17, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 75, y: 29, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'SIG', x: 75, y: 41, signals: [], number: 3 },
  ];

  isOn = false;

  private svgContent() {
    return svg`
      <svg width="22mm" height="15mm" version="1.1" viewBox="0 0 80 55"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tmecAnalogBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#f6e6b7"/>
            <stop offset="1" stop-color="#c58b3b"/>
          </linearGradient>
          <filter id="tmecAnalogGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#16282b"
              stroke="${this.isOn ? '#ffd166' : '#60777a'}"
              stroke-width="${this.isOn ? '2' : '0.7'}"/>
        <rect x="5" y="6" width="54" height="43" rx="3" fill="url(#tmecAnalogBody)"
              stroke="#815923" stroke-width="0.7"/>
        <text x="32" y="14" fill="#352510" font-family="Arial" font-size="4.5"
              font-weight="bold" text-anchor="middle">TMEC ANALOG</text>

        <rect x="11" y="19" width="42" height="19" rx="2" fill="#1d2f32" stroke="#0d1719"/>
        <path d="M15 32 C20 32, 21 24, 26 24 S32 34, 37 34 S42 22, 49 22"
              fill="none" stroke="${this.isOn ? '#ffd166' : '#7e9697'}"
              stroke-width="1.8" stroke-linecap="round"
              filter="${this.isOn ? 'url(#tmecAnalogGlow)' : 'none'}"/>
        <circle cx="15" cy="32" r="1.5" fill="#d9e5e5"/>
        <circle cx="49" cy="22" r="1.5" fill="#d9e5e5"/>
        <text x="32" y="44" fill="#352510" font-family="Arial" font-size="3"
              font-weight="bold" text-anchor="middle">MCP3424 AIN</text>

        <circle cx="62" cy="46" r="2.2"
                fill="${this.isOn ? '#ffd166' : '#7c8d88'}"
                filter="${this.isOn ? 'url(#tmecAnalogGlow)' : 'none'}"/>

        <rect x="67" y="10" width="10" height="36" fill="#101820" stroke="#000" stroke-width="0.3"/>
        <circle cx="75" cy="17" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="29" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="41" r="1.5" fill="#e8e8e8"/>
        <text x="65" y="18" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="65" y="30" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="65" y="42" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">SIG</text>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('bfarm-tmec-analog-element', BfarmTmecAnalogElement);
