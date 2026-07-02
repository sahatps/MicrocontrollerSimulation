import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class DtPar485SensorElement extends LitElement {
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
        <rect width="80" height="55" rx="3" fill="#4a3f78"
              stroke="${this.isOn ? '#00e676' : '#756aa0'}" stroke-width="${this.isOn ? '2' : '0.8'}"/>
        <rect x="7" y="8" width="49" height="39" rx="4" fill="#ede7f6" stroke="#9575cd"/>
        <circle cx="23" cy="28" r="11" fill="#fff8e1" stroke="#f9a825"/>
        <circle cx="23" cy="28" r="5" fill="#fdd835"/>
        <path d="M23 12v6M23 38v6M7 28h6M33 28h6M12 17l5 5M29 34l5 5M12 39l5-5M29 22l5-5" stroke="#f9a825" stroke-width="1.5"/>
        <text x="43" y="20" fill="#4527a0" font-family="Arial" font-size="4" font-weight="bold" text-anchor="middle">DT-PAR485</text>
        <text x="43" y="27" fill="#5e35b1" font-family="Arial" font-size="3" text-anchor="middle">PAR</text>
        <text x="43" y="42" fill="#4527a0" font-family="Arial" font-size="2.5" text-anchor="middle">RS485 MODBUS</text>
        <circle cx="60" cy="49" r="2" fill="${this.isOn ? '#00e676' : '#b39ddb'}"/>
        <rect x="67" y="8" width="10" height="40" fill="#1d1731" stroke="#000" stroke-width="0.3"/>
        ${['15', '25', '35', '45'].map(y => svg`<circle cx="75" cy="${y}" r="1.5" fill="#e8e8e8"/>`)}
        <text x="65" y="16" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="65" y="26" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="65" y="36" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">A+</text>
        <text x="65" y="46" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">B-</text>
      </svg>`;
  }

  render() { return html`${this.svgContent()}`; }
}

customElements.define('dt-par485-sensor-element', DtPar485SensorElement);
