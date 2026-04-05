import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class CurrentLoop420mAElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC',  x: 85, y: 10, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND',  x: 85, y: 18, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'SDA',  x: 85, y: 26, signals: [{ type: 'i2c', signal: 'SDA', bus: 0 }],   number: 3 },
    { name: 'SCL',  x: 85, y: 34, signals: [{ type: 'i2c', signal: 'SCL', bus: 0 }],   number: 4 },
    { name: 'AIN+', x: 85, y: 42, signals: [], number: 5 },
    { name: 'AIN-', x: 85, y: 50, signals: [], number: 6 },
  ];

  value = 4.0;

  private svgContent() {
    return svg`
      <svg width="24mm" height="16mm" version="1.1" viewBox="0 0 90 60"
           xmlns="http://www.w3.org/2000/svg">
        <!-- PCB -->
        <rect x="0" y="0" width="90" height="60" fill="#1565c0" rx="2" ry="2"/>
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="4" cy="56" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="86" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="86" cy="56" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>

        <!-- Labels -->
        <text x="52" y="11" fill="#fff" font-family="Arial" font-size="5" font-weight="bold" text-anchor="middle">4-20mA</text>
        <text x="52" y="19" fill="#ccc" font-family="Arial" font-size="3.5" text-anchor="middle">CURRENT LOOP</text>

        <!-- Left green screw terminal (AIN+ / AIN-) -->
        <rect x="0" y="33" width="14" height="20" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.4" rx="1"/>
        <circle cx="7" cy="39" r="3.5" fill="#333" stroke="#000" stroke-width="0.3"/>
        <line x1="3.5" y1="39" x2="10.5" y2="39" stroke="#555" stroke-width="1"/>
        <circle cx="7" cy="49" r="3.5" fill="#333" stroke="#000" stroke-width="0.3"/>
        <line x1="3.5" y1="49" x2="10.5" y2="49" stroke="#555" stroke-width="1"/>
        <text x="7" y="37" fill="#fff" font-family="Arial" font-size="2" text-anchor="middle">AIN+</text>
        <text x="7" y="47" fill="#fff" font-family="Arial" font-size="2" text-anchor="middle">AIN-</text>

        <!-- MCP3424 ADC chip -->
        <rect x="18" y="24" width="22" height="16" fill="#1a1a1a" stroke="#444" stroke-width="0.3" rx="1"/>
        <text x="29" y="34" fill="#fff" font-family="Arial" font-size="3.5" font-weight="bold" text-anchor="middle">MCP3424</text>
        <!-- Pin stubs -->
        <line x1="18" y1="27" x2="15" y2="27" stroke="#c8a020" stroke-width="0.8"/>
        <line x1="18" y1="31" x2="15" y2="31" stroke="#c8a020" stroke-width="0.8"/>
        <line x1="18" y1="35" x2="15" y2="35" stroke="#c8a020" stroke-width="0.8"/>
        <line x1="40" y1="27" x2="43" y2="27" stroke="#c8a020" stroke-width="0.8"/>
        <line x1="40" y1="31" x2="43" y2="31" stroke="#c8a020" stroke-width="0.8"/>
        <line x1="40" y1="35" x2="43" y2="35" stroke="#c8a020" stroke-width="0.8"/>

        <!-- SMD components -->
        <rect x="46" y="24" width="4" height="6" fill="#8d6e63" stroke="#000" stroke-width="0.1"/>
        <rect x="46" y="34" width="4" height="6" fill="#8d6e63" stroke="#000" stroke-width="0.1"/>
        <rect x="18" y="45" width="5" height="2.5" fill="#333"/>
        <rect x="26" y="45" width="5" height="2.5" fill="#333"/>
        <rect x="34" y="45" width="5" height="2.5" fill="#333"/>

        <!-- Power LED -->
        <circle cx="55" cy="52" r="2" fill="#ff9800" opacity="0.5"/>

        <!-- Right 6-pin header -->
        <rect x="77" y="4" width="10" height="52" fill="#1a1a1a" stroke="#000" stroke-width="0.3"/>
        <circle cx="85" cy="10" r="1.5" fill="#e8e8e8"/>
        <circle cx="85" cy="18" r="1.5" fill="#e8e8e8"/>
        <circle cx="85" cy="26" r="1.5" fill="#e8e8e8"/>
        <circle cx="85" cy="34" r="1.5" fill="#e8e8e8"/>
        <circle cx="85" cy="42" r="1.5" fill="#e8e8e8"/>
        <circle cx="85" cy="50" r="1.5" fill="#e8e8e8"/>
        <text x="75" y="11" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="75" y="19" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="75" y="27" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">SDA</text>
        <text x="75" y="35" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">SCL</text>
        <text x="75" y="43" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">AIN+</text>
        <text x="75" y="51" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">AIN-</text>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('current-loop-420ma-element', CurrentLoop420mAElement);
