import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class Rs485LightSensorElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 75, y: 15, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 75, y: 25, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'A+',  x: 75, y: 35, signals: [], number: 3 },
    { name: 'B-',  x: 75, y: 45, signals: [], number: 4 },
  ];

  value = 0.0;
  isOn = false;

  private svgContent() {
    return svg`
      <svg width="22mm" height="15mm" version="1.1" viewBox="0 0 80 55"
           xmlns="http://www.w3.org/2000/svg">
        <!-- PCB -->
        <rect x="0" y="0" width="80" height="55" fill="#1565c0" rx="2" ry="2"
              stroke="${this.isOn ? '#00e676' : 'none'}" stroke-width="${this.isOn ? '2' : '0'}"/>
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="4" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="76" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="76" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>

        <text x="30" y="12" fill="#fff" font-family="Arial" font-size="5" font-weight="bold" text-anchor="middle">RS485</text>
        <text x="30" y="20" fill="#ccc" font-family="Arial" font-size="3.5" text-anchor="middle">JXBS-3001-LYCS</text>

        <!-- Sun icon (light sensor) -->
        <circle cx="10" cy="34" r="5" fill="#f9a825" stroke="#f57f17" stroke-width="0.5"/>
        <line x1="10" y1="24" x2="10" y2="22" stroke="#f9a825" stroke-width="1" stroke-linecap="round"/>
        <line x1="10" y1="44" x2="10" y2="46" stroke="#f9a825" stroke-width="1" stroke-linecap="round"/>
        <line x1="0" y1="34" x2="-2" y2="34" stroke="#f9a825" stroke-width="1" stroke-linecap="round"/>
        <line x1="20" y1="34" x2="22" y2="34" stroke="#f9a825" stroke-width="1" stroke-linecap="round"/>
        <line x1="3" y1="27" x2="2" y2="26" stroke="#f9a825" stroke-width="1" stroke-linecap="round"/>
        <line x1="17" y1="27" x2="18" y2="26" stroke="#f9a825" stroke-width="1" stroke-linecap="round"/>
        <line x1="3" y1="41" x2="2" y2="42" stroke="#f9a825" stroke-width="1" stroke-linecap="round"/>
        <line x1="17" y1="41" x2="18" y2="42" stroke="#f9a825" stroke-width="1" stroke-linecap="round"/>

        <!-- MAX485 chip -->
        <rect x="22" y="26" width="16" height="10" fill="#1a1a1a" stroke="#444" stroke-width="0.3" rx="1"/>
        <text x="30" y="33" fill="#777" font-family="Arial" font-size="2.5" text-anchor="middle">MAX485</text>

        <rect x="22" y="42" width="5" height="2.5" fill="#333"/>
        <rect x="30" y="42" width="5" height="2.5" fill="#333"/>
        <rect x="38" y="42" width="5" height="2.5" fill="#333"/>

        <circle cx="52" cy="47" r="2"
                fill="${this.isOn ? '#00e676' : '#ffeb3b'}"
                opacity="${this.isOn ? '1' : '0.5'}"/>

        <!-- Right 4-pin header -->
        <rect x="67" y="8" width="10" height="40" fill="#1a1a1a" stroke="#000" stroke-width="0.3"/>
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

customElements.define('rs485-light-sensor-element', Rs485LightSensorElement);
