import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

/**
 * Buzzer Element for Smart Farm
 *
 * Active buzzer module for alarms and status notifications.
 *
 * Pin configuration:
 * - VCC: Power supply
 * - GND: Ground
 * - SIG: Digital signal input (HIGH = ON, LOW = OFF)
 */

export class BuzzerElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 66, y: 14, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 66, y: 24, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'SIG', x: 66, y: 34, signals: [], number: 3 },
  ];

  isOn = false;
  ledPower = false;

  private svgContent() {
    return svg`
      <svg
        width="18mm"
        height="15mm"
        version="1.1"
        viewBox="0 0 72 58"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="buzzerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="buzzerLedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="72" height="58" fill="#1565c0" rx="2" ry="2"
              stroke="${this.isOn ? '#ffd54f' : 'none'}" stroke-width="${this.isOn ? '2.5' : '0'}" />

        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />
        <circle cx="4" cy="54" r="1.5" fill="#333" stroke="#000" stroke-width="0.2" />

        <circle cx="26" cy="24" r="16" fill="#1f1f1f" stroke="#050505" stroke-width="0.8"
                filter="${this.isOn ? 'url(#buzzerGlow)' : 'none'}" />
        <circle cx="26" cy="24" r="12" fill="#2c2c2c" stroke="#3b3b3b" stroke-width="0.4" />
        <circle cx="26" cy="24" r="8" fill="#111" />
        <circle cx="26" cy="24" r="2.6" fill="${this.isOn ? '#ffca28' : '#555'}" />

        <g opacity="${this.isOn ? 0.95 : 0.25}">
          <path d="M40 18 Q45 21 45 24 Q45 27 40 30" fill="none" stroke="#ffe082" stroke-width="1.5" stroke-linecap="round" />
          <path d="M44 14 Q52 19 52 24 Q52 29 44 34" fill="none" stroke="#ffecb3" stroke-width="1.3" stroke-linecap="round" />
          <path d="M48 10 Q58 16 58 24 Q58 32 48 38" fill="none" stroke="#fff8e1" stroke-width="1.1" stroke-linecap="round" />
        </g>

        <text x="26" y="48" fill="#fff" font-family="Arial" font-size="4" text-anchor="middle" font-weight="bold">BUZZER</text>

        <circle cx="50" cy="14" r="2.2" fill="${this.isOn ? '#00e676' : '#004d40'}"
                filter="${this.isOn ? 'url(#buzzerLedGlow)' : 'none'}" />
        <text x="50" y="21" fill="#d7dde4" font-family="Arial" font-size="2.4" text-anchor="middle">PWR</text>

        <rect x="46" y="27" width="10" height="6" fill="#1a1a1a" stroke="#333" stroke-width="0.3" rx="1" />
        <circle cx="51" cy="30" r="1.5" fill="${this.isOn ? '#ffb300' : '#5d4037'}"
                filter="${this.isOn ? 'url(#buzzerLedGlow)' : 'none'}" />

        <rect x="61" y="9" width="8" height="30" fill="#1a1a1a" stroke="#000" stroke-width="0.3" />
        <circle cx="66" cy="14" r="1.3" fill="#e8e8e8" />
        <circle cx="66" cy="24" r="1.3" fill="#e8e8e8" />
        <circle cx="66" cy="34" r="1.3" fill="#e8e8e8" />

        <text x="58" y="15" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="58" y="25" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="58" y="35" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">SIG</text>

        <rect x="45" y="38" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="51" y="38" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
        <rect x="45" y="43" width="4" height="2" fill="#333" stroke="#000" stroke-width="0.1" />
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('buzzer-element', BuzzerElement);
