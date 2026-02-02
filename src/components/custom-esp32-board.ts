import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

/**
 * Handy Sense v1.0.2 Custom ESP32 Board Element
 *
 * This represents the Handy Sense board with ESP32-WROOM-32D,
 * 4 relay modules, terminal blocks, and various I/O connections.
 *
 * Pin mapping based on actual board schematic.
 */

export class CustomESP32BoardElement extends LitElement {
  // Pin information based on Handy Sense board layout
  // Left side terminal blocks (top to bottom)
  readonly pinInfo: ElementPin[] = [
    // Left top terminal block
    { name: 'IO33', x: 6, y: 25, signals: [{ type: 'pwm' }] },
    { name: 'GND', x: 6, y: 35, signals: [{ type: 'power', signal: 'GND' }] },
    { name: 'IO15', x: 6, y: 45, signals: [{ type: 'pwm' }] },
    { name: 'GND2', x: 6, y: 55, signals: [{ type: 'power', signal: 'GND' }] },

    // Left middle terminal block
    { name: '3V3', x: 6, y: 75, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'IO36', x: 6, y: 85, signals: [] },
    { name: 'GND3', x: 6, y: 95, signals: [{ type: 'power', signal: 'GND' }] },

    // Left lower middle terminal block
    { name: '3V3_2', x: 6, y: 115, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'IO39', x: 6, y: 125, signals: [] },
    { name: 'GND4', x: 6, y: 135, signals: [{ type: 'power', signal: 'GND' }] },

    // Left bottom terminal block
    { name: '3V3_3', x: 6, y: 155, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'IO32', x: 6, y: 165, signals: [{ type: 'pwm' }] },
    { name: 'GND5', x: 6, y: 175, signals: [{ type: 'power', signal: 'GND' }] },
    { name: 'VIN', x: 6, y: 185, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'GND6', x: 6, y: 195, signals: [{ type: 'power', signal: 'GND' }] },
    { name: 'VIN2', x: 6, y: 205, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'GND7', x: 6, y: 215, signals: [{ type: 'power', signal: 'GND' }] },

    // Right side terminal blocks (top to bottom)
    { name: 'SCL', x: 144, y: 25, signals: [{ type: 'i2c', signal: 'SCL', bus: 0 }] },
    { name: 'SDA', x: 144, y: 35, signals: [{ type: 'i2c', signal: 'SDA', bus: 0 }] },
    { name: 'GND_R1', x: 144, y: 45, signals: [{ type: 'power', signal: 'GND' }] },
    { name: '3V3_R1', x: 144, y: 55, signals: [{ type: 'power', signal: 'VCC' }] },

    { name: 'SCL_2', x: 144, y: 75, signals: [{ type: 'i2c', signal: 'SCL', bus: 0 }] },
    { name: 'SDA_2', x: 144, y: 85, signals: [{ type: 'i2c', signal: 'SDA', bus: 0 }] },
    { name: 'GND_R2', x: 144, y: 95, signals: [{ type: 'power', signal: 'GND' }] },
    { name: '3V3_R2', x: 144, y: 105, signals: [{ type: 'power', signal: 'VCC' }] },

    // Right side header (SPI/Serial)
    { name: 'TX2', x: 144, y: 135, signals: [] },
    { name: 'RX2', x: 144, y: 145, signals: [] },
    { name: 'SCL_3', x: 144, y: 155, signals: [{ type: 'i2c', signal: 'SCL', bus: 0 }] },
    { name: 'SDA_3', x: 144, y: 165, signals: [{ type: 'i2c', signal: 'SDA', bus: 0 }] },
    { name: 'MOSI', x: 144, y: 175, signals: [{ type: 'spi', signal: 'MOSI', bus: 0 }] },
    { name: 'MISO', x: 144, y: 185, signals: [{ type: 'spi', signal: 'MISO', bus: 0 }] },
    { name: 'CLK', x: 144, y: 195, signals: [{ type: 'spi', signal: 'SCK', bus: 0 }] },
    { name: 'CS', x: 144, y: 205, signals: [{ type: 'spi', signal: 'SS', bus: 0 }] },
    { name: 'GND_R3', x: 144, y: 215, signals: [{ type: 'power', signal: 'GND' }] },
    { name: '3V3_R3', x: 144, y: 225, signals: [{ type: 'power', signal: 'VCC' }] },
  ];

  led1 = false;
  led2 = false;

  // SVG content - Handy Sense v1.0.2 Board Design
  private svgContent() {
    return svg`
      <svg
        width="39mm"
        height="63mm"
        version="1.1"
        viewBox="0 0 150 240"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="handy-sense-pin" width="2.5" height="2.5" patternUnits="userSpaceOnUse">
            <circle cx="1.25" cy="1.25" r=".8" fill="#e8e8e8" />
          </pattern>
        </defs>

        <!-- Main PCB - Red board -->
        <rect x="0" y="0" width="150" height="240" fill="#cc1e1e" rx="3" ry="3" stroke="#000" stroke-width=".3" />

        <!-- Mounting holes -->
        <circle cx="7" cy="7" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
        <circle cx="143" cy="7" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
        <circle cx="7" cy="233" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
        <circle cx="143" cy="233" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />

        <!-- Top header connector (6-pin) -->
        <rect x="40" y="2" width="30" height="8" fill="#1a1a1a" stroke="#000" stroke-width="0.2" />
        <g fill="#333">
          ${[0,1,2,3,4,5].map(i => svg`<rect x="${42 + i*4.5}" y="3" width="3.5" height="6" />`)}
        </g>

        <!-- ESP32-WROOM-32D Module -->
        <rect x="50" y="18" width="50" height="35" fill="#c0c0c0" stroke="#000" stroke-width="0.4" />
        <rect x="53" y="21" width="44" height="29" fill="#1a1a1a" />
        <text x="75" y="38" fill="#fff" font-family="Arial" font-size="6" text-anchor="middle" font-weight="bold">ESP32</text>
        <text x="75" y="45" fill="#ccc" font-family="Arial" font-size="3.5" text-anchor="middle">WROOM-32D</text>

        <!-- Large HS Logo in center -->
        <text x="75" y="95" fill="#fff" font-family="Arial" font-size="32" text-anchor="middle" font-weight="bold" opacity="0.3">HS</text>

        <!-- RESET and FLASH Buttons -->
        <g>
          <rect x="115" y="30" width="10" height="10" fill="#1a1a1a" stroke="#333" stroke-width="0.3" rx="1" />
          <text x="120" y="37" fill="#999" font-family="Arial" font-size="2.5" text-anchor="middle">RST</text>
        </g>
        <g>
          <rect x="115" y="45" width="10" height="10" fill="#1a1a1a" stroke="#333" stroke-width="0.3" rx="1" />
          <text x="120" y="52" fill="#999" font-family="Arial" font-size="2.5" text-anchor="middle">BOOT</text>
        </g>

        <!-- Status LEDs (top center area) -->
        <ellipse cx="60" cy="60" rx="1.5" ry="1.5" fill="#00ff00" opacity="${this.led1 ? 1 : 0.2}" />
        <ellipse cx="66" cy="60" rx="1.5" ry="1.5" fill="#0080ff" opacity="${this.led2 ? 1 : 0.2}" />
        <ellipse cx="72" cy="60" rx="1.5" ry="1.5" fill="#ff0000" opacity="0.3" />
        <ellipse cx="78" cy="60" rx="1.5" ry="1.5" fill="#ff0000" opacity="0.3" />

        <!-- CR2032 Battery Holder (center) -->
        <circle cx="75" cy="115" r="15" fill="#c0c0c0" stroke="#666" stroke-width="0.4" />
        <circle cx="75" cy="115" r="12" fill="#999" />
        <text x="75" y="113" fill="#333" font-family="Arial" font-size="4" text-anchor="middle">CR2032</text>
        <text x="75" y="119" fill="#333" font-family="Arial" font-size="3" text-anchor="middle">3V</text>

        <!-- RTC Chip (near battery) -->
        <rect x="95" cy="108" width="12" height="12" fill="#1a1a1a" stroke="#666" stroke-width="0.3" />
        <text x="101" y="116" fill="#999" font-family="Arial" font-size="2.5" text-anchor="middle">RTC</text>

        <!-- Crystal (32.768kHz) -->
        <rect x="48" y="110" width="8" height="10" fill="#c0c0c0" stroke="#666" stroke-width="0.3" />

        <!-- 4 Relay Modules at bottom -->
        <g id="relay-section">
          <!-- Relay 1 - IO25 -->
          <rect x="10" y="150" width="25" height="35" fill="#1a1a1a" stroke="#000" stroke-width="0.4" rx="1" />
          <rect x="12" y="152" width="21" height="20" fill="#333" />
          <rect x="15" y="177" width="15" height="6" fill="#ffcc00" stroke="#000" stroke-width="0.2" />
          <text x="22.5" y="190" fill="#ffcc00" font-family="Arial" font-size="5" text-anchor="middle" font-weight="bold">IO25</text>

          <!-- Relay 2 - IO4 -->
          <rect x="42" y="150" width="25" height="35" fill="#1a1a1a" stroke="#000" stroke-width="0.4" rx="1" />
          <rect x="44" y="152" width="21" height="20" fill="#333" />
          <rect x="47" y="177" width="15" height="6" fill="#ffcc00" stroke="#000" stroke-width="0.2" />
          <text x="54.5" y="190" fill="#ffcc00" font-family="Arial" font-size="5" text-anchor="middle" font-weight="bold">IO4</text>

          <!-- Relay 3 - IO12 -->
          <rect x="74" y="150" width="25" height="35" fill="#1a1a1a" stroke="#000" stroke-width="0.4" rx="1" />
          <rect x="76" y="152" width="21" height="20" fill="#333" />
          <rect x="79" y="177" width="15" height="6" fill="#ffcc00" stroke="#000" stroke-width="0.2" />
          <text x="86.5" y="190" fill="#ffcc00" font-family="Arial" font-size="5" text-anchor="middle" font-weight="bold">IO12</text>

          <!-- Relay 4 - IO13 -->
          <rect x="106" y="150" width="25" height="35" fill="#1a1a1a" stroke="#000" stroke-width="0.4" rx="1" />
          <rect x="108" y="152" width="21" height="20" fill="#333" />
          <rect x="111" y="177" width="15" height="6" fill="#ffcc00" stroke="#000" stroke-width="0.2" />
          <text x="118.5" y="190" fill="#ffcc00" font-family="Arial" font-size="5" text-anchor="middle" font-weight="bold">IO13</text>
        </g>

        <!-- Bottom Terminal Blocks (green) - COM, NC, NO labels -->
        <g id="bottom-terminals">
          ${[0,1,2,3].map(i => svg`
            <rect x="${10 + i*32}" y="200" width="25" height="35" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.3" />
            ${[0,1,2].map(j => svg`
              <circle cx="${15 + i*32 + j*7}" cy="217" r="2.5" fill="#333" stroke="#000" stroke-width="0.2" />
            `)}
            <text x="${22.5 + i*32}" y="210" fill="#fff" font-family="Arial" font-size="3" text-anchor="middle">COM NC NO</text>
          `)}
        </g>

        <!-- Left side terminal blocks (green) -->
        <g id="left-terminals">
          <!-- Terminal block 1 (top) -->
          <rect x="2" y="18" width="8" height="45" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.3" />
          ${[0,1,2,3].map(i => svg`
            <circle cx="6" cy="${25 + i*10}" r="1.8" fill="#333" stroke="#000" stroke-width="0.2" />
          `)}

          <!-- Terminal block 2 -->
          <rect x="2" y="68" width="8" height="32" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.3" />
          ${[0,1,2].map(i => svg`
            <circle cx="6" cy="${75 + i*10}" r="1.8" fill="#333" stroke="#000" stroke-width="0.2" />
          `)}

          <!-- Terminal block 3 -->
          <rect x="2" y="105" width="8" height="32" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.3" />
          ${[0,1,2].map(i => svg`
            <circle cx="6" cy="${115 + i*10}" r="1.8" fill="#333" stroke="#000" stroke-width="0.2" />
          `)}

          <!-- Terminal block 4 (bottom) -->
          <rect x="2" y="145" width="8" height="75" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.3" />
          ${[0,1,2,3,4,5,6].map(i => svg`
            <circle cx="6" cy="${155 + i*10}" r="1.8" fill="#333" stroke="#000" stroke-width="0.2" />
          `)}
        </g>

        <!-- Right side terminal blocks (green) -->
        <g id="right-terminals">
          <!-- Terminal block 1 (top) -->
          <rect x="140" y="18" width="8" height="45" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.3" />
          ${[0,1,2,3].map(i => svg`
            <circle cx="144" cy="${25 + i*10}" r="1.8" fill="#333" stroke="#000" stroke-width="0.2" />
          `)}

          <!-- Terminal block 2 -->
          <rect x="140" y="68" width="8" height="45" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.3" />
          ${[0,1,2,3].map(i => svg`
            <circle cx="144" cy="${75 + i*10}" r="1.8" fill="#333" stroke="#000" stroke-width="0.2" />
          `)}
        </g>

        <!-- Right side header (black, 10-pin) -->
        <rect x="140" y="125" width="8" height="105" fill="#1a1a1a" stroke="#000" stroke-width="0.3" />
        ${[0,1,2,3,4,5,6,7,8,9].map(i => svg`
          <circle cx="144" cy="${135 + i*10}" r="1.8" fill="#333" stroke="#000" stroke-width="0.2" />
        `)}

        <!-- Small components (resistors, capacitors, ICs) scattered -->
        ${[
          {x: 25, y: 70, w: 6, h: 3},
          {x: 35, y: 72, w: 6, h: 3},
          {x: 25, y: 80, w: 6, h: 3},
          {x: 35, y: 82, w: 6, h: 3},
        ].map(comp => svg`
          <rect x="${comp.x}" y="${comp.y}" width="${comp.w}" height="${comp.h}" fill="#333" stroke="#000" stroke-width="0.2" />
        `)}

        <!-- Small IC chips -->
        <rect x="30" y="95" width="10" height="10" fill="#1a1a1a" stroke="#666" stroke-width="0.3" />
        <rect x="110" y="95" width="10" height="10" fill="#1a1a1a" stroke="#666" stroke-width="0.3" />

      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('custom-esp32-board', CustomESP32BoardElement);
