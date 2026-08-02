import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class SoilMoistureSensorElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 60, y: 14, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 60, y: 24, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'AO',  x: 60, y: 34, signals: [], number: 3 },
  ];

  value = 0;
  isOn = false;

  private svgContent() {
    return svg`
      <svg width="17mm" height="21mm" version="1.1" viewBox="0 0 65 80"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="soilLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- PCB board -->
        <rect x="0" y="0" width="65" height="58" fill="#1565c0" rx="2" ry="2"
              stroke="${this.isOn ? '#00e676' : 'none'}" stroke-width="${this.isOn ? '2' : '0'}"/>
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="4" cy="54" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="61" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="61" cy="54" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>

        <!-- Labels -->
        <text x="28" y="12" fill="#fff" font-family="Arial" font-size="4.5" font-weight="bold" text-anchor="middle">SOIL</text>
        <text x="28" y="20" fill="#ccc" font-family="Arial" font-size="3.5" text-anchor="middle">MOISTURE</text>

        <!-- Capacitive sensing area (comb pattern) -->
        <rect x="8" y="26" width="44" height="20" fill="#0d47a1" stroke="#1565c0" stroke-width="0.5" rx="1"/>
        <!-- Comb electrodes -->
        <line x1="14" y1="28" x2="14" y2="44" stroke="#c8a020" stroke-width="1"/>
        <line x1="18" y1="28" x2="18" y2="44" stroke="#c8a020" stroke-width="1"/>
        <line x1="22" y1="28" x2="22" y2="44" stroke="#c8a020" stroke-width="1"/>
        <line x1="26" y1="28" x2="26" y2="44" stroke="#c8a020" stroke-width="1"/>
        <line x1="30" y1="28" x2="30" y2="44" stroke="#1565c0" stroke-width="1"/>
        <line x1="34" y1="28" x2="34" y2="44" stroke="#1565c0" stroke-width="1"/>
        <line x1="38" y1="28" x2="38" y2="44" stroke="#1565c0" stroke-width="1"/>
        <line x1="42" y1="28" x2="42" y2="44" stroke="#1565c0" stroke-width="1"/>
        <line x1="46" y1="28" x2="46" y2="44" stroke="#c8a020" stroke-width="1"/>

        <!-- Power LED -->
        <circle cx="16" cy="52" r="2"
                fill="${this.isOn ? '#00e676' : '#004d00'}"
                filter="${this.isOn ? 'url(#soilLedGlow)' : 'none'}"/>
        <text x="16" y="57" fill="#ccc" font-family="Arial" font-size="2" text-anchor="middle">PWR</text>

        <!-- Right 3-pin header -->
        <rect x="53" y="7" width="9" height="30" fill="#1a1a1a" stroke="#000" stroke-width="0.3"/>
        <circle cx="60" cy="14" r="1.5" fill="#e8e8e8"/>
        <circle cx="60" cy="24" r="1.5" fill="#e8e8e8"/>
        <circle cx="60" cy="34" r="1.5" fill="#e8e8e8"/>
        <text x="51" y="15" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="51" y="25" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="51" y="35" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">AO</text>

        <!-- Metal probe prongs below PCB -->
        <rect x="18" y="58" width="5" height="20" fill="#aaa" stroke="#888" stroke-width="0.4" rx="1"/>
        <rect x="34" y="58" width="5" height="20" fill="#aaa" stroke="#888" stroke-width="0.4" rx="1"/>
        <!-- Prong tips -->
        <rect x="18" y="76" width="5" height="4" fill="#ccc" rx="1"/>
        <rect x="34" y="76" width="5" height="4" fill="#ccc" rx="1"/>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('soil-moisture-sensor-element', SoilMoistureSensorElement);
