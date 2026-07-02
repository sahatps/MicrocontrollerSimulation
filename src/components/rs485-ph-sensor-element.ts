import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class Rs485PhSensorElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 75, y: 15, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 75, y: 25, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'A+',  x: 75, y: 35, signals: [], number: 3 },
    { name: 'B-',  x: 75, y: 45, signals: [], number: 4 },
  ];

  value = 7.0;
  isOn = false;

  private svgContent() {
    return svg`
      <svg width="22mm" height="15mm" version="1.1" viewBox="0 0 80 55"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="rs485PhLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- PCB -->
        <rect x="0" y="0" width="80" height="55" fill="#1565c0" rx="2" ry="2"
              stroke="${this.isOn ? '#00e676' : 'none'}" stroke-width="${this.isOn ? '2' : '0'}"/>
        <!-- Mounting holes -->
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="4" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="76" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="76" cy="51" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>

        <!-- RS485 label -->
        <text x="30" y="12" fill="#fff" font-family="Arial" font-size="5" font-weight="bold" text-anchor="middle">RS485</text>
        <!-- Model name -->
        <text x="30" y="20" fill="#ccc" font-family="Arial" font-size="3.5" text-anchor="middle">pH-4502C</text>

        <!-- Sensor probe icon (left) -->
        <rect x="3" y="22" width="8" height="18" fill="#888" stroke="#666" stroke-width="0.5" rx="1"/>
        <polygon points="7,40 3,48 11,48" fill="#888"/>
        <text x="7" y="35" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="middle">pH</text>

        <!-- MAX485 chip -->
        <rect x="18" y="26" width="16" height="10" fill="#1a1a1a" stroke="#444" stroke-width="0.3" rx="1"/>
        <text x="26" y="33" fill="#777" font-family="Arial" font-size="2.5" text-anchor="middle">MAX485</text>

        <!-- SMD resistors -->
        <rect x="18" y="42" width="5" height="2.5" fill="#333" stroke="#000" stroke-width="0.1"/>
        <rect x="26" y="42" width="5" height="2.5" fill="#333" stroke="#000" stroke-width="0.1"/>
        <rect x="34" y="42" width="5" height="2.5" fill="#333" stroke="#000" stroke-width="0.1"/>

        <!-- Power LED -->
        <circle cx="50" cy="47" r="2"
                fill="${this.isOn ? '#00e676' : '#ff9800'}"
                opacity="${this.isOn ? '1' : '0.5'}"
                filter="url(#rs485PhLedGlow)"/>
        <text x="50" y="52" fill="#ccc" font-family="Arial" font-size="2" text-anchor="middle">PWR</text>

        <!-- Right 4-pin header -->
        <rect x="67" y="8" width="10" height="40" fill="#1a1a1a" stroke="#000" stroke-width="0.3"/>
        <circle cx="75" cy="15" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="25" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="35" r="1.5" fill="#e8e8e8"/>
        <circle cx="75" cy="45" r="1.5" fill="#e8e8e8"/>
        <!-- Pin labels -->
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

customElements.define('rs485-ph-sensor-element', Rs485PhSensorElement);
