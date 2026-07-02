import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class Weight3kgRs485SensorElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 75, y: 15, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 75, y: 25, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'A+', x: 75, y: 35, signals: [], number: 3 },
    { name: 'B-', x: 75, y: 45, signals: [], number: 4 },
  ];

  isOn = false;

  private svgContent() {
    return svg`
      <svg width="22mm" height="15mm" viewBox="0 0 80 55" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="55" rx="3" fill="#5d4037"
              stroke="${this.isOn ? '#00e676' : '#8d6e63'}" stroke-width="${this.isOn ? '2' : '0.8'}"/>
        <rect x="7" y="7" width="48" height="41" rx="4" fill="#cfd8dc" stroke="#78909c"/>
        <path d="M15 35h32l-4 9H19z" fill="#90a4ae" stroke="#546e7a"/>
        <rect x="19" y="15" width="24" height="17" rx="2" fill="#263238"/>
        <text x="31" y="26" fill="#80ff80" font-family="monospace" font-size="7" text-anchor="middle">3.000</text>
        <text x="49" y="27" fill="#37474f" font-family="Arial" font-size="3" font-weight="bold">kg</text>
        <text x="31" y="12" fill="#37474f" font-family="Arial" font-size="3.5" font-weight="bold" text-anchor="middle">WEIGHT RS485</text>
        <circle cx="60" cy="49" r="2" fill="${this.isOn ? '#00e676' : '#9e9e9e'}"/>
        <rect x="67" y="8" width="10" height="40" fill="#201713" stroke="#000" stroke-width="0.3"/>
        ${['15', '25', '35', '45'].map(y => svg`<circle cx="75" cy="${y}" r="1.5" fill="#e8e8e8"/>`)}
        <text x="65" y="16" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="65" y="26" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="65" y="36" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">A+</text>
        <text x="65" y="46" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">B-</text>
      </svg>`;
  }

  render() { return html`${this.svgContent()}`; }
}

customElements.define('weight-3kg-rs485-sensor-element', Weight3kgRs485SensorElement);
