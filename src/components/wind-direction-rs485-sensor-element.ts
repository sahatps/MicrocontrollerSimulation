import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class WindDirectionRs485SensorElement extends LitElement {
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
        <rect width="80" height="55" rx="3" fill="#24527a"
              stroke="${this.isOn ? '#00e676' : '#587d9d'}" stroke-width="${this.isOn ? '2' : '0.8'}"/>
        <circle cx="29" cy="29" r="18" fill="#e3f2fd" stroke="#90a4ae"/>
        <text x="29" y="15" fill="#37474f" font-family="Arial" font-size="4" font-weight="bold" text-anchor="middle">N</text>
        <text x="29" y="47" fill="#37474f" font-family="Arial" font-size="4" font-weight="bold" text-anchor="middle">S</text>
        <text x="12" y="31" fill="#37474f" font-family="Arial" font-size="4" font-weight="bold" text-anchor="middle">W</text>
        <text x="46" y="31" fill="#37474f" font-family="Arial" font-size="4" font-weight="bold" text-anchor="middle">E</text>
        <path d="M29 17l5 13-5 11-5-11z" fill="#ef5350" stroke="#37474f" stroke-width="0.7"/>
        <circle cx="29" cy="29" r="2" fill="#263238"/>
        <text x="57" y="9" fill="#fff" font-family="Arial" font-size="3" font-weight="bold" text-anchor="middle">WIND DIR</text>
        <circle cx="60" cy="49" r="2" fill="${this.isOn ? '#00e676' : '#90a4ae'}"/>
        <rect x="67" y="8" width="10" height="40" fill="#10202d" stroke="#000" stroke-width="0.3"/>
        ${['15', '25', '35', '45'].map(y => svg`<circle cx="75" cy="${y}" r="1.5" fill="#e8e8e8"/>`)}
        <text x="65" y="16" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="65" y="26" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="65" y="36" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">A+</text>
        <text x="65" y="46" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">B-</text>
      </svg>`;
  }

  render() { return html`${this.svgContent()}`; }
}

customElements.define('wind-direction-rs485-sensor-element', WindDirectionRs485SensorElement);
