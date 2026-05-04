import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class FourChannelRelayElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'VCC', x: 116, y: 12, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
    { name: 'GND', x: 116, y: 20, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
    { name: 'IN1', x: 116, y: 28, signals: [], number: 3 },
    { name: 'IN2', x: 116, y: 36, signals: [], number: 4 },
    { name: 'IN3', x: 116, y: 44, signals: [], number: 5 },
    { name: 'IN4', x: 116, y: 52, signals: [], number: 6 },
    { name: 'R1_COM', x: 12, y: 78, signals: [], number: 7 },
    { name: 'R1_NC', x: 19, y: 78, signals: [], number: 8 },
    { name: 'R1_NO', x: 26, y: 78, signals: [], number: 9 },
    { name: 'R2_COM', x: 38, y: 78, signals: [], number: 10 },
    { name: 'R2_NC', x: 45, y: 78, signals: [], number: 11 },
    { name: 'R2_NO', x: 52, y: 78, signals: [], number: 12 },
    { name: 'R3_COM', x: 64, y: 78, signals: [], number: 13 },
    { name: 'R3_NC', x: 71, y: 78, signals: [], number: 14 },
    { name: 'R3_NO', x: 78, y: 78, signals: [], number: 15 },
    { name: 'R4_COM', x: 90, y: 78, signals: [], number: 16 },
    { name: 'R4_NC', x: 97, y: 78, signals: [], number: 17 },
    { name: 'R4_NO', x: 104, y: 78, signals: [], number: 18 },
  ];

  ch1 = false;
  ch2 = false;
  ch3 = false;
  ch4 = false;

  private svgContent() {
    const channels = [this.ch1, this.ch2, this.ch3, this.ch4];
    const relayX = [8, 34, 60, 86];
    const labels = ['RL1', 'RL2', 'RL3', 'RL4'];

    return svg`
      <svg width="32mm" height="24mm" version="1.1" viewBox="0 0 120 90"
           xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="r4LedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- PCB -->
        <rect x="0" y="0" width="120" height="75" fill="#1565c0" rx="2" ry="2"/>
        <circle cx="4" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="4" cy="71" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="116" cy="4" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>
        <circle cx="116" cy="71" r="1.5" fill="#333" stroke="#000" stroke-width="0.2"/>

        <!-- Board label -->
        <text x="55" y="9" fill="#fff" font-family="Arial" font-size="4" font-weight="bold" text-anchor="middle">4-CHANNEL RELAY</text>

        <!-- 4 Relay housings -->
        ${relayX.map((rx, i) => svg`
          <rect x="${rx}" y="12" width="22" height="42" fill="#1a1a1a" stroke="#000" stroke-width="0.5" rx="2"/>
          <!-- Relay label -->
          <text x="${rx + 11}" y="20" fill="#777" font-family="Arial" font-size="3" text-anchor="middle">${labels[i]}</text>
          <!-- Coil lines -->
          <line x1="${rx + 3}" y1="24" x2="${rx + 19}" y2="24" stroke="#888" stroke-width="0.8"/>
          <line x1="${rx + 3}" y1="27" x2="${rx + 19}" y2="27" stroke="#666" stroke-width="0.5"/>
          <line x1="${rx + 3}" y1="30" x2="${rx + 19}" y2="30" stroke="#888" stroke-width="0.8"/>
          <line x1="${rx + 3}" y1="33" x2="${rx + 19}" y2="33" stroke="#666" stroke-width="0.5"/>
          <!-- NC/NO contacts -->
          <circle cx="${rx + 11}" cy="40" r="2" fill="${channels[i] ? '#c8a020' : '#444'}"/>
          <circle cx="${rx + 11}" cy="47" r="2" fill="${channels[i] ? '#444' : '#c8a020'}"/>
        `)}

        <!-- LED indicators under relays -->
        ${relayX.map((rx, i) => svg`
          <circle cx="${rx + 11}" cy="62"
                  r="2.5"
                  fill="${channels[i] ? '#ff2200' : '#550000'}"
                  filter="${channels[i] ? 'url(#r4LedGlow)' : 'none'}"/>
        `)}

        <!-- Bottom output terminals -->
        ${relayX.map((rx, i) => svg`
          <rect x="${rx}" y="70" width="22" height="16" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.35" rx="1"/>
          <line x1="${rx + 4}" y1="78" x2="${channels[i] ? rx + 18 : rx + 11}" y2="78"
                stroke="${channels[i] ? '#ff9800' : '#ddd'}" stroke-width="1.1" stroke-linecap="round"/>
          <circle cx="${rx + 4}" cy="78" r="3" fill="#e8e8e8" stroke="#999" stroke-width="0.5"/>
          <circle cx="${rx + 11}" cy="78" r="3" fill="#e8e8e8" stroke="#999" stroke-width="0.5"/>
          <circle cx="${rx + 18}" cy="78" r="3" fill="#e8e8e8" stroke="#999" stroke-width="0.5"/>
          <text x="${rx + 11}" y="74" fill="#fff" font-family="Arial" font-size="2.2" text-anchor="middle" font-weight="bold">COM NC NO</text>
        `)}

        <!-- Right 6-pin header -->
        <rect x="108" y="5" width="10" height="55" fill="#1a1a1a" stroke="#000" stroke-width="0.3"/>
        <circle cx="116" cy="12" r="1.5" fill="#e8e8e8"/>
        <circle cx="116" cy="20" r="1.5" fill="#e8e8e8"/>
        <circle cx="116" cy="28" r="1.5" fill="#e8e8e8"/>
        <circle cx="116" cy="36" r="1.5" fill="#e8e8e8"/>
        <circle cx="116" cy="44" r="1.5" fill="#e8e8e8"/>
        <circle cx="116" cy="52" r="1.5" fill="#e8e8e8"/>
        <text x="106" y="13" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">VCC</text>
        <text x="106" y="21" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">GND</text>
        <text x="106" y="29" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">IN1</text>
        <text x="106" y="37" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">IN2</text>
        <text x="106" y="45" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">IN3</text>
        <text x="106" y="53" fill="#fff" font-family="Arial" font-size="2.5" text-anchor="end">IN4</text>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('four-channel-relay-element', FourChannelRelayElement);
