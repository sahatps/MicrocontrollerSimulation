import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmNitrateIsfetRs485Element extends LitElement {
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
          <linearGradient id="nitratePanel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#eef8d8"/>
            <stop offset="0.55" stop-color="#a9d56e"/>
            <stop offset="1" stop-color="#4f862f"/>
          </linearGradient>
          <filter id="nitrateGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#17251c"
              stroke="${this.isOn ? '#b7f34a' : '#647367'}"
              stroke-width="${this.isOn ? '2' : '0.7'}"/>
        <rect x="5" y="6" width="53" height="43" rx="3" fill="#f1f0df" stroke="#87907a"/>
        <text x="31.5" y="12" fill="#253d28" font-family="Arial" font-size="3.8"
              font-weight="bold" text-anchor="middle">NITRATE ISFET</text>

        <rect x="9" y="16" width="45" height="28" rx="2" fill="url(#nitratePanel)" stroke="#507735"/>
        <path d="M15 21 H48 M15 27 H48 M15 33 H48 M15 39 H48"
              stroke="#f5ffe7" stroke-width="0.7" opacity="0.65"/>
        <path d="M18 40 C22 35, 25 26, 31 25 C37 24, 40 32, 47 20"
              fill="none" stroke="${this.isOn ? '#efffc1' : '#315b2b'}"
              stroke-width="2" stroke-linecap="round"
              filter="${this.isOn ? 'url(#nitrateGlow)' : 'none'}"/>
        <circle cx="47" cy="20" r="2.2" fill="${this.isOn ? '#f4ff72' : '#5d873d'}"/>
        <text x="31.5" y="48" fill="#253d28" font-family="Arial" font-size="2.6"
              text-anchor="middle">NO3 / RS485 / 115200</text>

        <circle cx="61" cy="48" r="2"
                fill="${this.isOn ? '#b7f34a' : '#748274'}"
                filter="${this.isOn ? 'url(#nitrateGlow)' : 'none'}"/>

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

customElements.define('bfarm-nitrate-isfet-rs485-element', BfarmNitrateIsfetRs485Element);
