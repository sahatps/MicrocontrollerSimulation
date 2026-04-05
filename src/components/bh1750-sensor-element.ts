import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class Bh1750SensorElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 66, y: 12, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 66, y: 22, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'SDA', x: 66, y: 32, signals: [{ type: 'i2c', signal: 'SDA', bus: 0 }],   number: 3 },
    { name: 'SCL', x: 66, y: 42, signals: [{ type: 'i2c', signal: 'SCL', bus: 0 }],   number: 4 },
  ];

  value = 0.0;
  isOn = false;

  private svgContent() {
    return svg`
      <svg width="19mm" height="14mm" version="1.1" viewBox="0 0 70 50"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="bh1750LedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- PCB -->
        <rect x="0" y="0" width="70" height="50" fill="#1565c0" rx="2" ry="2"
              stroke="${this.isOn ? '#00e676' : 'none'}" stroke-width="${this.isOn ? '2' : '0'}"/>
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="4" cy="46" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="66" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="66" cy="46" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>

        <!-- Labels -->
        <text x="28" y="11" fill="#fff" font-family="Arial" font-size="4" font-weight="bold" text-anchor="middle">I2C</text>
        <text x="28" y="18" fill="#ccc" font-family="Arial" font-size="3.5" text-anchor="middle">Light Intensity</text>

        <!-- BH1750 IC chip -->
        <rect x="10" y="20" width="28" height="14" fill="#1a1a1a" stroke="#444" stroke-width="0.3" rx="1"/>
        <text x="24" y="29" fill="#fff" font-family="Arial" font-size="4" font-weight="bold" text-anchor="middle">BH1750</text>
        <!-- IC pin stubs left -->
        <line x1="10" y1="23" x2="7" y2="23" stroke="#c8a020" stroke-width="0.8"/>
        <line x1="10" y1="27" x2="7" y2="27" stroke="#c8a020" stroke-width="0.8"/>
        <line x1="10" y1="31" x2="7" y2="31" stroke="#c8a020" stroke-width="0.8"/>
        <!-- IC pin stubs right -->
        <line x1="38" y1="23" x2="41" y2="23" stroke="#c8a020" stroke-width="0.8"/>
        <line x1="38" y1="27" x2="41" y2="27" stroke="#c8a020" stroke-width="0.8"/>
        <line x1="38" y1="31" x2="41" y2="31" stroke="#c8a020" stroke-width="0.8"/>

        <!-- Sun icon (light sensor) -->
        <circle cx="18" cy="42" r="3.5" fill="#fff176" stroke="#f9a825" stroke-width="0.4"/>
        <line x1="18" y1="36" x2="18" y2="35" stroke="#f9a825" stroke-width="0.8"/>
        <line x1="18" y1="48" x2="18" y2="49" stroke="#f9a825" stroke-width="0.8"/>
        <line x1="12" y1="42" x2="11" y2="42" stroke="#f9a825" stroke-width="0.8"/>
        <line x1="24" y1="42" x2="25" y2="42" stroke="#f9a825" stroke-width="0.8"/>
        <line x1="14" y1="38" x2="13" y2="37" stroke="#f9a825" stroke-width="0.8"/>
        <line x1="22" y1="38" x2="23" y2="37" stroke="#f9a825" stroke-width="0.8"/>

        <!-- SMD decoupling caps -->
        <rect x="44" y="22" width="3" height="5" fill="#8d6e63" stroke="#000" stroke-width="0.1"/>
        <rect x="44" y="30" width="3" height="5" fill="#8d6e63" stroke="#000" stroke-width="0.1"/>

        <!-- Power LED -->
        <circle cx="50" cy="43" r="2"
                fill="${this.isOn ? '#00e676' : '#004d00'}"
                filter="${this.isOn ? 'url(#bh1750LedGlow)' : 'none'}"/>

        <!-- Right 4-pin header -->
        <rect x="59" y="5" width="9" height="40" fill="#1a1a1a" stroke="#000" stroke-width="0.3"/>
        <circle cx="66" cy="12" r="1.5" fill="#e8e8e8"/>
        <circle cx="66" cy="22" r="1.5" fill="#e8e8e8"/>
        <circle cx="66" cy="32" r="1.5" fill="#e8e8e8"/>
        <circle cx="66" cy="42" r="1.5" fill="#e8e8e8"/>
        <text x="57" y="13" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="57" y="23" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="57" y="33" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">SDA</text>
        <text x="57" y="43" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">SCL</text>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('bh1750-sensor-element', Bh1750SensorElement);
