import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmTubularSoilProbeRs485Element extends LitElement {
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
          <linearGradient id="tubularSoilBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#aeb9b4"/>
            <stop offset="0.45" stop-color="#f2f5f1"/>
            <stop offset="1" stop-color="#667670"/>
          </linearGradient>
          <linearGradient id="tubularGround" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#c99a61"/>
            <stop offset="1" stop-color="#5a3825"/>
          </linearGradient>
          <filter id="tubularGlow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="1.1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#182522"
              stroke="${this.isOn ? '#8bea63' : '#687872'}"
              stroke-width="${this.isOn ? '2' : '0.7'}"/>
        <rect x="5" y="6" width="53" height="43" rx="3" fill="#edf2e8" stroke="#829087"/>
        <text x="31.5" y="12" fill="#24402e" font-family="Arial" font-size="3.7"
              font-weight="bold" text-anchor="middle">TUBULAR SOIL</text>

        <path d="M8 23 C16 20, 25 25, 34 22 S47 20, 55 23 V45 H8 Z"
              fill="url(#tubularGround)" stroke="#67452c"/>
        <rect x="28" y="14" width="7" height="31" rx="2" fill="url(#tubularSoilBody)"
              stroke="#4a5d56"/>
        <path d="M28 45 L31.5 49 L35 45 Z" fill="#53645e" stroke="#33433e"/>

        ${[20, 26, 32, 38, 44].map((y, index) => svg`
          <circle cx="31.5" cy="${y}" r="1.45"
                  fill="${this.isOn ? '#9aff72' : '#779480'}"
                  filter="${this.isOn ? 'url(#tubularGlow)' : 'none'}"/>
          <path d="M36 ${y} H48" stroke="#e9d1a6" stroke-width="0.65"/>
          <text x="49" y="${y + 1}" fill="#f8ead0" font-family="Arial" font-size="2.3">
            ${(index + 1) * 10}cm
          </text>
        `)}

        <text x="17" y="18" fill="#416348" font-family="Arial" font-size="2.5"
              text-anchor="middle">RH + TEMP</text>
        <circle cx="61" cy="48" r="2"
                fill="${this.isOn ? '#8bea63' : '#789493'}"
                filter="${this.isOn ? 'url(#tubularGlow)' : 'none'}"/>

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

customElements.define('bfarm-tubular-soil-probe-rs485-element', BfarmTubularSoilProbeRs485Element);
