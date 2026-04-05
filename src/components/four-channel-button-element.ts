import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class FourChannelButtonElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 96, y: 12, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 96, y: 20, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'B1',  x: 96, y: 28, signals: [], number: 3 },
    { name: 'B2',  x: 96, y: 36, signals: [], number: 4 },
    { name: 'B3',  x: 96, y: 44, signals: [], number: 5 },
    { name: 'B4',  x: 96, y: 52, signals: [], number: 6 },
  ];

  b1 = false;
  b2 = false;
  b3 = false;
  b4 = false;

  private svgContent() {
    const pressed = [this.b1, this.b2, this.b3, this.b4];
    const btnX = [15, 35, 55, 75];
    const labels = ['B1', 'B2', 'B3', 'B4'];

    return svg`
      <svg width="27mm" height="17mm" version="1.1" viewBox="0 0 100 65"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="btn4PressGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- PCB -->
        <rect x="0" y="0" width="100" height="65" fill="#1565c0" rx="2" ry="2"/>
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="4" cy="61" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="96" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="96" cy="61" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>

        <!-- Board label -->
        <text x="45" y="9" fill="#fff" font-family="Arial" font-size="4" font-weight="bold" text-anchor="middle">4-CHANNEL BUTTON</text>

        <!-- 4 push buttons -->
        ${btnX.map((bx, i) => svg`
          <!-- Button outer ring -->
          <circle cx="${bx}" cy="30" r="10"
                  fill="${pressed[i] ? '#4caf50' : '#e0e0e0'}"
                  stroke="${pressed[i] ? '#2e7d32' : '#bdbdbd'}"
                  stroke-width="1"
                  filter="${pressed[i] ? 'url(#btn4PressGlow)' : 'none'}"/>
          <!-- Button inner cap -->
          <circle cx="${bx}" cy="30" r="7"
                  fill="${pressed[i] ? '#66bb6a' : '#f5f5f5'}"
                  stroke="${pressed[i] ? '#388e3c' : '#9e9e9e'}"
                  stroke-width="0.5"/>
          <!-- Center dot -->
          <circle cx="${bx}" cy="30" r="1.5"
                  fill="${pressed[i] ? '#1b5e20' : '#757575'}"/>
          <!-- Button label below -->
          <text x="${bx}" y="47" fill="#fff" font-family="Arial" font-size="3" font-weight="bold" text-anchor="middle">${labels[i]}</text>
        `)}

        <!-- PCB traces -->
        <line x1="15" y1="40" x2="15" y2="55" stroke="#c8a020" stroke-width="0.4"/>
        <line x1="35" y1="40" x2="35" y2="55" stroke="#c8a020" stroke-width="0.4"/>
        <line x1="55" y1="40" x2="55" y2="55" stroke="#c8a020" stroke-width="0.4"/>
        <line x1="75" y1="40" x2="75" y2="55" stroke="#c8a020" stroke-width="0.4"/>

        <!-- Right 6-pin header -->
        <rect x="88" y="5" width="10" height="55" fill="#1a1a1a" stroke="#000" stroke-width="0.3"/>
        <circle cx="96" cy="12" r="1.5" fill="#e8e8e8"/>
        <circle cx="96" cy="20" r="1.5" fill="#e8e8e8"/>
        <circle cx="96" cy="28" r="1.5" fill="#e8e8e8"/>
        <circle cx="96" cy="36" r="1.5" fill="#e8e8e8"/>
        <circle cx="96" cy="44" r="1.5" fill="#e8e8e8"/>
        <circle cx="96" cy="52" r="1.5" fill="#e8e8e8"/>
        <text x="86" y="13" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="86" y="21" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="86" y="29" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">B1</text>
        <text x="86" y="37" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">B2</text>
        <text x="86" y="45" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">B3</text>
        <text x="86" y="53" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">B4</text>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('four-channel-button-element', FourChannelButtonElement);
