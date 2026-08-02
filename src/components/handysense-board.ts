import { html, svg } from 'lit';
import type { ElementPin } from '@wokwi/elements';
import { HandysenseProBoardElement } from './handysense-pro-board';

const VCC_SIGNAL = [{ type: 'power', signal: 'VCC' }];
const GND_SIGNAL = [{ type: 'power', signal: 'GND' }];
const I2C_SCL_SIGNAL = [{ type: 'i2c', signal: 'SCL', bus: 0 }];
const I2C_SDA_SIGNAL = [{ type: 'i2c', signal: 'SDA', bus: 0 }];
const SPI_MOSI_SIGNAL = [{ type: 'spi', signal: 'MOSI', bus: 0 }];
const SPI_MISO_SIGNAL = [{ type: 'spi', signal: 'MISO', bus: 0 }];
const SPI_CLK_SIGNAL = [{ type: 'spi', signal: 'SCK', bus: 0 }];
const SPI_CS_SIGNAL = [{ type: 'spi', signal: 'SS', bus: 0 }];

const HANDYSENSE_PIN_MAP: Record<string, number> = {
  A05_1_SIG: 36,
  A05_2_SIG: 39,
  A420_1_SIG: 32,
  A420_2_SIG: 33,
  BTN_0: 32,
  BTN_1: 33,
  BTN_2: 15,
  BTN_3: 39,
  I2C1_SDA: 21,
  I2C1_SCL: 22,
  I2C2_SDA: 21,
  I2C2_SCL: 22,
  I2C3_SDA: 21,
  I2C3_SCL: 22,
  SPI_MOSI: 23,
  SPI_MISO: 19,
  SPI_CLK: 18,
  SPI_CS: 5,
  RS485_A: 17,
  RS485_B: 16,
  LEDR_0: 25,
  LEDR_1: 4,
  LEDR_2: 12,
  LEDR_3: 13,
  LEDS_0: 2,
  LEDS_1: 5,
  LEDS_2: 18,
  LEDS_3: 19,
  LEDS_4: 21,
  LEDS_5: 22,
  LEDS_6: 23,
  LEDS_7: 27,
};

export function resolveHandysensePinNumber(pinName: string): number | null {
  return HANDYSENSE_PIN_MAP[pinName] ?? null;
}

function connectorSignals(names: string[]): any[][] {
  return names.map((name) => {
    if (name.endsWith('_VCC') || name.endsWith('_24V') || name === 'PWR24_VIN' || name === 'RELAY5V_VIN' || name === 'LEDR_VCC' || name === 'LED_VCC_A' || name === 'LED_VCC_B') {
      return VCC_SIGNAL;
    }
    if (name.endsWith('_GND') || name === 'PWR24_GND' || name === 'RELAY5V_GND') {
      return GND_SIGNAL;
    }
    switch (name) {
      case 'I2C1_SCL':
      case 'I2C2_SCL':
      case 'I2C3_SCL':
        return I2C_SCL_SIGNAL;
      case 'I2C1_SDA':
      case 'I2C2_SDA':
      case 'I2C3_SDA':
        return I2C_SDA_SIGNAL;
      case 'SPI_MOSI':
        return SPI_MOSI_SIGNAL;
      case 'SPI_MISO':
        return SPI_MISO_SIGNAL;
      case 'SPI_CLK':
        return SPI_CLK_SIGNAL;
      case 'SPI_CS':
        return SPI_CS_SIGNAL;
      default:
        return [];
    }
  });
}

function terminalGroupHorizontal(names: string[], x: number, y: number, step = 8): ElementPin[] {
  const signals = connectorSignals(names);
  return names.map((name, index) => ({
    name,
    x: x + (index * step),
    y,
    signals: signals[index],
  }));
}

function terminalGroupVertical(names: string[], x: number, y: number, step = 8): ElementPin[] {
  const signals = connectorSignals(names);
  return names.map((name, index) => ({
    name,
    x,
    y: y + (index * step),
    signals: signals[index],
  }));
}

const HANDYSENSE_PIN_INFO: ElementPin[] = [
  ...terminalGroupHorizontal(['RS485_B', 'RS485_A', 'RS485_GND', 'RS485_24V'], 21.66667, 10),

  ...terminalGroupHorizontal(['I2C1_SCL', 'I2C1_SDA', 'I2C1_GND', 'I2C1_VCC'], 57, 10.66667),
  ...terminalGroupHorizontal(['I2C2_SCL', 'I2C2_SDA', 'I2C2_GND', 'I2C2_VCC'], 103, 10.66667),
  ...terminalGroupHorizontal(['I2C3_SCL', 'I2C3_SDA', 'I2C3_GND', 'I2C3_VCC'], 94, 43.66667),

  ...terminalGroupVertical(['A05_1_VCC', 'A05_1_SIG', 'A05_1_GND'], 10, 59),
  ...terminalGroupVertical(['A05_2_VCC', 'A05_2_SIG', 'A05_2_GND'], 10, 88),
  ...terminalGroupVertical(['A420_1_VCC', 'A420_1_SIG', 'A420_1_GND'], 10, 121),
  ...terminalGroupVertical(['A420_2_VCC', 'A420_2_SIG', 'A420_2_GND'], 10, 150),

  ...terminalGroupHorizontal(['LEDS_0', 'LEDS_1', 'LEDS_2', 'LEDS_3', 'LED_VCC_A'], 148, 155),
  ...terminalGroupHorizontal(['LEDS_4', 'LEDS_5', 'LEDS_6', 'LEDS_7', 'LED_VCC_B'], 182, 155),

  ...terminalGroupVertical(['SPI_MOSI', 'SPI_MISO', 'SPI_CLK', 'SPI_CS', 'SPI_GND'], 230, 96),
  ...terminalGroupVertical(['BTN_0', 'BTN_1', 'BTN_2', 'BTN_3', 'BTN_GND'], 230, 145),
  ...terminalGroupVertical(['LEDR_0', 'LEDR_1', 'LEDR_2', 'LEDR_3', 'LEDR_VCC'], 230, 194),

  ...terminalGroupVertical(['PWR24_VIN', 'PWR24_GND'], 10, 255),
  ...terminalGroupHorizontal(['RELAY5V_VIN', 'RELAY5V_GND'], 78, 264),

  ...terminalGroupHorizontal(['R1_COM', 'R1_NC', 'R1_NO'], 112, 264),
  ...terminalGroupHorizontal(['R2_COM', 'R2_NC', 'R2_NO'], 144, 264),
  ...terminalGroupHorizontal(['R3_COM', 'R3_NC', 'R3_NO'], 176, 264),
  ...terminalGroupHorizontal(['R4_COM', 'R4_NC', 'R4_NO'], 208, 264),
];

export class HandysenseBoardElement extends HandysenseProBoardElement {
  readonly pinInfo: ElementPin[] = HANDYSENSE_PIN_INFO;

  private silk(
    x: number,
    y: number,
    text: string,
    size = 3.1,
    anchor: 'start' | 'middle' | 'end' = 'start',
    fill = '#eef7ee',
    weight = 'normal'
  ) {
    return svg`<text x="${x}" y="${y}" fill="${fill}" font-family="Arial" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${text}</text>`;
  }

  private terminalBody(x: number, y: number, width: number, height: number) {
    return svg`
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="2.4" ry="2.4" fill="#67bd56" stroke="#2c6630" stroke-width="0.45" />
      <rect x="${x + 1.5}" y="${y + 1.4}" width="${width - 3}" height="${height - 2.8}" rx="1.6" ry="1.6" fill="rgba(255,255,255,0.08)" />
    `;
  }

  private chip(x: number, y: number, width: number, height: number, label?: string, labelSize = 3.3) {
    return svg`
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="1.2" ry="1.2" fill="#1f2430" stroke="#0f151d" stroke-width="0.45" />
      ${label ? this.silk(x + (width / 2), y + (height / 2) + 1.1, label, labelSize, 'middle', '#d9dee5', 'bold') : ''}
    `;
  }

  private relayContact(baseX: number, relayOn: boolean) {
    return svg`
      <line
        x1="${baseX + 5}"
        y1="264"
        x2="${relayOn ? baseX + 20 : baseX + 12}"
        y2="264"
        stroke="${relayOn ? '#efb225' : '#f0f1f2'}"
        stroke-width="1.2"
        stroke-linecap="round"
      />
    `;
  }

  render() {
    return html`${svg`
      <svg width="63mm" height="74mm" version="1.1" viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="handysense-board-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#229650" />
            <stop offset="55%" stop-color="#137c42" />
            <stop offset="100%" stop-color="#0d6838" />
          </linearGradient>
          <filter id="handysense-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.2" dy="1.1" stdDeviation="0.9" flood-color="#0a331c" flood-opacity="0.3" />
          </filter>
        </defs>

        <rect x="0" y="0" width="240" height="280" rx="5" ry="5" fill="url(#handysense-board-fill)" stroke="#084a28" stroke-width="0.75" />

        <circle cx="8" cy="8" r="4.1" fill="#ececeb" stroke="#7d848a" stroke-width="0.4" />
        <circle cx="232" cy="8" r="4.1" fill="#ececeb" stroke="#7d848a" stroke-width="0.4" />
        <circle cx="8" cy="272" r="4.1" fill="#ececeb" stroke="#7d848a" stroke-width="0.4" />
        <circle cx="232" cy="272" r="4.1" fill="#ececeb" stroke="#7d848a" stroke-width="0.4" />

        <g transform="matrix(1 0 0 1 -9.33333 -10)">
          ${this.terminalBody(25, 12, 30, 16)}
          ${this.silk(40, 9, 'B A GND +24V', 2.6, 'middle')}
          ${this.silk(40, 6, 'RS485', 3.2, 'middle', '#f3fbf3', 'bold')}
        </g>

        <g transform="translate(-32 -9.33333)">
          ${this.terminalBody(83, 12, 30, 16)}
          ${this.terminalBody(115.6666669845581, 11.333333373069763, 30, 16)}
          ${this.terminalBody(116, 46.333333253860474, 30, 16)}
          ${this.silk(120, 6, 'I2C', 3.2, 'middle', '#f3fbf3', 'bold')}
          ${this.silk(120, 10, 'SCL SDA GND +5V', 2.6, 'middle')}
          ${this.chip(74, 29.666666746139526, 17, 14)}
          ${this.chip(95.33333337306976, 30.333333492279053, 17, 14)}
          ${this.chip(118.00000047683716, 30.333333373069763, 17, 14)}
          ${this.chip(53.4938850402832, 29.67165756225586, 17, 14)}
        </g>

        <g filter="url(#handysense-shadow)">
          <rect x="153" y="12" width="44" height="60" rx="3.6" ry="3.6" fill="#2a2f3b" stroke="#b5bec8" stroke-width="0.5" />
          <rect x="160" y="21" width="30" height="30" fill="#aeb3b7" stroke="#6a717a" stroke-width="0.3" />
          <rect x="163" y="24" width="24" height="24" fill="#494d55" />
          <path d="M 178 12 h 16 v 18 h -16" fill="none" stroke="#e1ba4a" stroke-width="1.5" />
          <path d="M 181 20 h 10 M 181 25 h 10 M 181 30 h 10" fill="none" stroke="#e1ba4a" stroke-width="0.95" />
          ${this.silk(175, 39, 'ESP32', 5.2, 'middle', '#ffffff', 'bold')}
        </g>

        ${this.silk(168, 81, 'RESET', 2.7, 'middle')}
        ${this.silk(185, 81, 'BOOT', 2.7, 'middle')}
        <circle cx="160" cy="82" r="4.5" fill="#20252f" stroke="#cbd1d6" stroke-width="0.32" />
        <circle cx="177" cy="82" r="4.5" fill="#20252f" stroke="#cbd1d6" stroke-width="0.32" />
        ${this.silk(146, 95, 'U15', 2.2)}
        ${this.chip(140, 98, 20, 16)}
        ${this.chip(165, 101, 18, 12)}
        ${this.chip(132, 118, 34, 16)}

        ${this.silk(207, 6, 'Programming', 3.1, 'middle', '#f3fbf3', 'bold')}
        ${this.silk(207, 10, 'TX RX GND +5V', 2.5, 'middle')}
        <rect x="198" y="18" width="25" height="26" rx="3" ry="3" fill="#eef2f6" stroke="#919ba7" stroke-width="0.42" />
        <rect x="204" y="26" width="13" height="9" rx="1.3" ry="1.3" fill="#dde3ea" stroke="#7d8791" stroke-width="0.22" />
        ${this.silk(210, 48, 'Micro USB', 2.2, 'middle', '#d9eddc')}

        <rect x="195" y="56" width="31" height="49" rx="3.1" ry="3.1" fill="#d9dde6" stroke="#818a96" stroke-width="0.45" />
        <rect x="200" y="67" width="20" height="17" rx="1.2" ry="1.2" fill="#f4f5f7" stroke="#98a1ab" stroke-width="0.24" />
        <line x1="220" y1="64" x2="220" y2="99" stroke="#8a94a0" stroke-width="0.8" />
        ${this.silk(210, 109, 'MicroSD', 2.5, 'middle', '#eef7ee', 'bold')}

        ${this.terminalBody(4, 52, 12, 24)}
        ${this.terminalBody(4, 81, 12, 24)}
        ${this.silk(19, 58, 'Analog 0-5V', 3.1, 'start', '#f3fbf3', 'bold')}
        ${this.silk(19, 63, 'V SIG GND', 2.4)}
        ${this.silk(19, 70, 'A1 / A2 / A3', 2.3)}

        ${this.terminalBody(4, 114, 12, 24)}
        ${this.terminalBody(4, 143, 12, 24)}
        ${this.silk(19, 120, 'Analog 4-20mA', 3.1, 'start', '#f3fbf3', 'bold')}
        ${this.silk(19, 125, 'V SIG GND', 2.4)}
        ${this.silk(19, 132, 'I1 / I2 / I3', 2.3)}

        ${this.chip(35, 58, 12, 18)}
        ${this.chip(34, 113, 12, 18)}
        ${this.chip(52, 103, 19, 12)}
        ${this.chip(74, 104, 14, 14)}

        <circle cx="108" cy="110" r="15.5" fill="#d7dce3" stroke="#7b8390" stroke-width="0.52" />
        <circle cx="101" cy="104" r="1.8" fill="#9aa2ad" />
        <circle cx="115" cy="118" r="1.8" fill="#9aa2ad" />
        ${this.silk(108, 114, 'Buzzer', 3.8, 'middle', '#4b5561', 'bold')}
        ${this.silk(95, 95, 'LS1', 2.2)}

        <circle cx="79" cy="146" r="13" fill="#d2d6dc" stroke="#7b8390" stroke-width="0.52" />
        <circle cx="79" cy="146" r="10" fill="#bcc2ca" />
        ${this.silk(79, 144, 'RTC', 3.6, 'middle', '#4b5561', 'bold')}
        ${this.silk(79, 150, 'CR1220', 2.5, 'middle', '#58626f')}
        ${this.silk(79, 159, 'Battery Holder for CR1220', 2.1, 'middle', '#d7ecda')}

        ${this.silk(96, 152, 'POWER', 2.2, 'middle')}
        ${this.silk(110, 152, 'STATUS', 2.2, 'middle')}
        <circle cx="96" cy="157" r="1.8" fill="#72ff73" opacity="0.9" />
        <circle cx="110" cy="157" r="1.8" fill="#6eacf8" opacity="0.86" />
        ${this.silk(106, 150, 'HandySense', 6.1, 'start', '#edf7ee', 'bold')}
        ${this.silk(134, 156, 'Version 3.0.0', 2.6, 'middle', '#d7ecda')}

        ${this.terminalBody(144, 148, 40, 12)}
        ${this.terminalBody(178, 148, 40, 12)}
        ${this.silk(164, 144, '+5V LED Status 0-3', 2.5, 'middle')}
        ${this.silk(198, 144, '+5V LED Status 4-7', 2.5, 'middle')}

        ${this.silk(104, 171, 'Button0', 2.2, 'middle')}
        ${this.silk(129, 171, 'Button1', 2.2, 'middle')}
        ${this.silk(154, 171, 'Button2', 2.2, 'middle')}
        ${this.silk(179, 171, 'Button3', 2.2, 'middle')}
        ${[104, 129, 154, 179].map((x) => svg`<circle cx="${x}" cy="177" r="5" fill="#1f2430" stroke="#ced5dc" stroke-width="0.34" />`)}
        ${[98, 123, 148, 173].map((x) => this.chip(x, 187, 12, 10))}

        ${this.terminalBody(224, 90, 12, 40)}
        ${this.silk(208, 87, 'SPI', 3.6, 'end', '#f3fbf3', 'bold')}
        ${this.silk(208, 92, 'MOSI MISO CLK CS GND', 2.3, 'end')}

        ${this.terminalBody(224, 139, 12, 40)}
        ${this.silk(208, 159, 'Button', 3.6, 'end', '#f3fbf3', 'bold')}
        ${this.silk(208, 164, 'B0 B1 B2 B3 GND', 2.3, 'end')}

        ${this.terminalBody(224, 188, 12, 40)}
        ${this.silk(208, 208, 'LED Relay', 3.6, 'end', '#f3fbf3', 'bold')}
        ${this.silk(208, 213, 'R1 R2 R3 R4 +5V', 2.3, 'end')}

        ${this.chip(18, 225, 16, 16)}
        ${this.chip(38, 225, 16, 16)}
        <circle cx="26" cy="208" r="7.3" fill="#6c89d8" stroke="#39558f" stroke-width="0.42" />
        <circle cx="49" cy="208" r="7.3" fill="#9aa7b3" stroke="#56606e" stroke-width="0.42" />
        <circle cx="16" cy="238" r="4.8" fill="#e2e4e6" stroke="#838b95" stroke-width="0.34" />

        ${this.terminalBody(4, 245, 12, 24)}
        ${this.silk(5, 240, 'POWER', 2.1)}
        ${this.silk(5, 243, 'SUPPLY', 2.1)}
        ${this.silk(4, 276, 'VIN 24VDC', 2.4)}

        ${this.terminalBody(71, 257, 20, 14)}
        ${this.silk(81, 255, 'VIN RELAY 5VDC', 2.3, 'middle')}

        ${[98, 130, 162, 194].map((x, index) => svg`
          <g filter="url(#handysense-shadow)">
            <rect x="${x}" y="206" width="26" height="35" rx="1.9" ry="1.9" fill="#11171d" stroke="#000" stroke-width="0.42" />
            <rect x="${x + 3}" y="209" width="20" height="18" fill="#222c38" stroke="#465261" stroke-width="0.28" />
            ${this.silk(x + 13, 220, `K${index + 1}`, 4.6, 'middle', '#e6e9ed', 'bold')}
          </g>
        `)}

        ${[98, 130, 162, 194].map((x, index) => svg`
          ${this.terminalBody(x, 254, 24, 16)}
          ${this.relayContact(x, [this.relay1On, this.relay2On, this.relay3On, this.relay4On][index])}
          ${this.silk(x + 12, 251, 'NO COM NC', 2.2, 'middle')}
        `)}
      </svg>
    `}`;
  }
}

customElements.define('handysense-board', HandysenseBoardElement);
