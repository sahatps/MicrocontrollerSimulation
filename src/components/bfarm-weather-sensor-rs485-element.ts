import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class BfarmWeatherSensorRs485Element extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 75, y: 15, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 75, y: 25, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'A+', x: 75, y: 35, signals: [], number: 3 },
    { name: 'B-', x: 75, y: 45, signals: [], number: 4 },
  ];

  isOn = false;

  private svgContent() {
    return svg`
      <svg width="22mm" height="15mm" version="1.1" viewBox="0 0 80 55"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="weatherBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#dcebf3"/>
            <stop offset="100%" stop-color="#8ba9b7"/>
          </linearGradient>
          <filter id="weatherGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect width="80" height="55" rx="3" fill="#14364a"
              stroke="${this.isOn ? '#43d9ff' : '#587786'}"
              stroke-width="${this.isOn ? '2' : '0.8'}"/>
        <rect x="6" y="5" width="51" height="45" rx="5" fill="url(#weatherBody)" stroke="#6f8d9b"/>
        <path d="M11 13h41M11 18h41M11 23h41M11 28h41M11 33h41M11 38h41"
              stroke="#718e9c" stroke-width="1.4"/>
        <circle cx="17" cy="43" r="5" fill="#f5c242" stroke="#9b7a1d"/>
        <path d="M29 44c0-4 3-7 7-7 3 0 5 1 6 4 4-1 7 1 7 4H29z"
              fill="#eef6f8" stroke="#718e9c"/>
        <text x="35" y="12" fill="#183f53" font-family="Arial" font-size="4"
              font-weight="bold" text-anchor="middle">WEATHER</text>
        <text x="38" y="48" fill="#244d60" font-family="Arial" font-size="2.5"
              text-anchor="middle">RH / T / dB / CO2 / hPa / lx</text>
        <circle cx="61" cy="49" r="2"
                fill="${this.isOn ? '#43d9ff' : '#78909c'}"
                filter="${this.isOn ? 'url(#weatherGlow)' : 'none'}"/>

        <rect x="67" y="8" width="10" height="40" fill="#0d202b" stroke="#000" stroke-width="0.3"/>
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

customElements.define('bfarm-weather-sensor-rs485-element', BfarmWeatherSensorRs485Element);
