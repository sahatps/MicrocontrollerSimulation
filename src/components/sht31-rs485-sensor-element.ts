import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class Sht31Rs485SensorElement extends LitElement {
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
        <rect width="80" height="55" rx="3" fill="#145a64"
              stroke="${this.isOn ? '#00e676' : '#477d83'}" stroke-width="${this.isOn ? '2' : '0.8'}"/>
        <rect x="7" y="8" width="47" height="39" rx="3" fill="#d8eef0" stroke="#86aeb2"/>
        <circle cx="20" cy="28" r="9" fill="#fff" stroke="#4f7e83"/>
        <path d="M20 19v12a5 5 0 1 0 4 4V19a4 4 0 0 0-8 0v16" fill="none" stroke="#e65100" stroke-width="2"/>
        <path d="M33 22c6-7 12-2 12 4 0 7-6 11-12 15-6-4-12-8-12-15" fill="none" stroke="#0288d1" stroke-width="1.5"/>
        <text x="38" y="15" fill="#17464b" font-family="Arial" font-size="4" font-weight="bold" text-anchor="middle">SHT31</text>
        <text x="38" y="46" fill="#17464b" font-family="Arial" font-size="3" text-anchor="middle">TEMP + RH · RS485</text>
        <circle cx="60" cy="49" r="2" fill="${this.isOn ? '#00e676' : '#78909c'}"/>
        <rect x="67" y="8" width="10" height="40" fill="#10272a" stroke="#000" stroke-width="0.3"/>
        ${['15', '25', '35', '45'].map(y => svg`<circle cx="75" cy="${y}" r="1.5" fill="#e8e8e8"/>`)}
        <text x="65" y="16" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="65" y="26" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="65" y="36" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">A+</text>
        <text x="65" y="46" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">B-</text>
      </svg>`;
  }

  render() { return html`${this.svgContent()}`; }
}

customElements.define('sht31-rs485-sensor-element', Sht31Rs485SensorElement);
