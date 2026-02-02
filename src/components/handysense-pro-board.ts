import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

/**
 * Handysense Pro Custom ESP32 Board Element
 *
 * This represents the Handysense Pro board with ESP32-WROOM-32D,
 * based on actual Gerber files (PCB-HandySense-Version-3.0.0)
 * Board dimensions: 120mm × 140mm
 *
 * Pin mapping based on actual drill file and schematic.
 */

export class HandysenseProBoardElement extends LitElement {
  // Pin information based on actual Gerber drill file
  // Coordinates scaled from 120mm×140mm to SVG viewBox 240×280 (2:1 scale)
  readonly pinInfo: ElementPin[] = [
    // Left side pins (aligned 1:1 with SVG circles at X=10, terminal block center)
    { name: '3V3_1', x: 10, y: 25, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'IO33', x: 10, y: 32, signals: [{ type: 'pwm' }] },
    { name: 'GND_1', x: 10, y: 39, signals: [{ type: 'power', signal: 'GND' }] },
    { name: 'IO15', x: 10, y: 46, signals: [{ type: 'pwm' }] },

    { name: '3V3_2', x: 10, y: 60, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'IO36', x: 10, y: 67, signals: [] },
    { name: 'GND_2', x: 10, y: 74, signals: [{ type: 'power', signal: 'GND' }] },

    { name: '3V3_3', x: 10, y: 87, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'IO39', x: 10, y: 94, signals: [] },
    { name: 'GND_3', x: 10, y: 101, signals: [{ type: 'power', signal: 'GND' }] },

    { name: '3V3_4', x: 10, y: 117, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'IO32', x: 10, y: 124, signals: [{ type: 'pwm' }] },
    { name: 'GND_4', x: 10, y: 131, signals: [{ type: 'power', signal: 'GND' }] },

    { name: 'VIN_1', x: 10, y: 148, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'GND_5', x: 10, y: 155, signals: [{ type: 'power', signal: 'GND' }] },
    { name: 'VIN_2', x: 10, y: 162, signals: [{ type: 'power', signal: 'VCC' }] },
    { name: 'GND_6', x: 10, y: 169, signals: [{ type: 'power', signal: 'GND' }] },

    // Right side pins (aligned 1:1 with SVG circles/rectangles at X=230, terminal block center)
    { name: 'SCL_1', x: 230, y: 25, signals: [{ type: 'i2c', signal: 'SCL', bus: 0 }] },
    { name: 'SDA_1', x: 230, y: 32, signals: [{ type: 'i2c', signal: 'SDA', bus: 0 }] },
    { name: 'GND_R1', x: 230, y: 39, signals: [{ type: 'power', signal: 'GND' }] },
    { name: '3V3_R1', x: 230, y: 46, signals: [{ type: 'power', signal: 'VCC' }] },

    { name: 'SCL_2', x: 230, y: 60, signals: [{ type: 'i2c', signal: 'SCL', bus: 0 }] },
    { name: 'SDA_2', x: 230, y: 67, signals: [{ type: 'i2c', signal: 'SDA', bus: 0 }] },
    { name: 'GND_R2', x: 230, y: 74, signals: [{ type: 'power', signal: 'GND' }] },
    { name: '3V3_R2', x: 230, y: 81, signals: [{ type: 'power', signal: 'VCC' }] },

    { name: 'TX2', x: 230, y: 102, signals: [] },
    { name: 'RX2', x: 230, y: 109, signals: [] },
    { name: 'SCL_3', x: 230, y: 116, signals: [{ type: 'i2c', signal: 'SCL', bus: 0 }] },
    { name: 'SDA_3', x: 230, y: 123, signals: [{ type: 'i2c', signal: 'SDA', bus: 0 }] },
    { name: 'MOSI', x: 230, y: 130, signals: [{ type: 'spi', signal: 'MOSI', bus: 0 }] },
    { name: 'MISO', x: 230, y: 137, signals: [{ type: 'spi', signal: 'MISO', bus: 0 }] },
    { name: 'CLK', x: 230, y: 144, signals: [{ type: 'spi', signal: 'SCK', bus: 0 }] },
    { name: 'CS', x: 230, y: 151, signals: [{ type: 'spi', signal: 'SS', bus: 0 }] },
    { name: 'GND_R3', x: 230, y: 158, signals: [{ type: 'power', signal: 'GND' }] },
    { name: '3V3_R3', x: 230, y: 165, signals: [{ type: 'power', signal: 'VCC' }] },
  ];

  led1 = false;
  led2 = false;

  // SVG content - Handysense Pro Board Design from Gerber files
  private svgContent() {
    return svg`
      <svg
        width="63mm"
        height="74mm"
        version="1.1"
        viewBox="0 0 240 280"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="handysense-pro-pin" width="2.5" height="2.5" patternUnits="userSpaceOnUse">
            <circle cx="1.25" cy="1.25" r=".8" fill="#e8e8e8" />
          </pattern>
          <!-- PCB copper texture -->
          <filter id="pcb-texture">
            <feTurbulence baseFrequency="0.05" numOctaves="3" type="fractalNoise" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0 0.05" />
            </feComponentTransfer>
          </filter>
        </defs>

        <!-- Main PCB Board - Red FR4 -->
        <rect x="0" y="0" width="240" height="280" fill="#c41e3a" rx="4" ry="4" stroke="#000" stroke-width=".5" />
        <rect x="0" y="0" width="240" height="280" fill="url(#pcb-texture)" opacity="0.3" />

        <!-- USB Connector Cutout (top center) - from GKO file -->
        <rect x="133.8" y="0" width="38.4" height="13.3" fill="#c41e3a" stroke="#000" stroke-width="0.3" />
        <rect x="135" y="1" width="36" height="12" fill="#e8e8e8" stroke="#666" stroke-width="0.3" />
        <text x="153" y="8.5" fill="#333" font-family="Arial" font-size="4" text-anchor="middle" font-weight="bold">USB</text>

        <!-- Mounting holes (4mm diameter from T8 drill) at corners -->
        <circle cx="8" cy="8" r="4" fill="#000" stroke="#666" stroke-width="0.4" />
        <circle cx="232" cy="8" r="4" fill="#000" stroke="#666" stroke-width="0.4" />
        <circle cx="8" cy="272" r="4" fill="#000" stroke="#666" stroke-width="0.4" />
        <circle cx="232" cy="272" r="4" fill="#000" stroke="#666" stroke-width="0.4" />

        <!-- ESP32-WROOM-32D Module (centered upper area) -->
        <rect x="85" y="30" width="70" height="50" fill="#c0c0c0" stroke="#000" stroke-width="0.5" rx="1" />
        <rect x="88" y="33" width="64" height="44" fill="#1a1a1a" />
        <text x="120" y="52" fill="#fff" font-family="Arial" font-size="8" text-anchor="middle" font-weight="bold">ESP32</text>
        <text x="120" y="62" fill="#ccc" font-family="Arial" font-size="5" text-anchor="middle">WROOM-32D</text>

        <!-- ESP32 antenna pattern -->
        <g stroke="#999" stroke-width="0.3" fill="none">
          <path d="M 145 35 L 150 35 L 150 75 L 145 75" />
          <line x1="147" y1="40" x2="147" y2="70" />
        </g>

        <!-- HandySense Pro Logo -->
        <text x="120" y="95" fill="#fff" font-family="Arial" font-size="12" text-anchor="middle" font-weight="bold">HandySense</text>
        <text x="120" y="107" fill="#ffcc00" font-family="Arial" font-size="18" text-anchor="middle" font-weight="bold">PRO</text>
        <text x="120" y="115" fill="#fff" font-family="Arial" font-size="5" text-anchor="middle">Version 3.0.0</text>

        <!-- RESET and BOOT Buttons -->
        <g id="buttons">
          <rect x="170" y="35" width="14" height="14" fill="#1a1a1a" stroke="#333" stroke-width="0.4" rx="2" />
          <circle cx="177" cy="42" r="5" fill="#333" stroke="#555" stroke-width="0.3" />
          <text x="177" y="60" fill="#fff" font-family="Arial" font-size="3.5" text-anchor="middle">RST</text>

          <rect x="170" y="55" width="14" height="14" fill="#1a1a1a" stroke="#333" stroke-width="0.4" rx="2" />
          <circle cx="177" cy="62" r="5" fill="#333" stroke="#555" stroke-width="0.3" />
          <text x="177" y="78" fill="#fff" font-family="Arial" font-size="3.5" text-anchor="middle">BOOT</text>
        </g>

        <!-- Status LEDs (multiple) -->
        <g id="status-leds">
          <ellipse cx="60" cy="40" rx="2" ry="2" fill="#00ff00" opacity="${this.led1 ? 1 : 0.25}" />
          <text x="60" y="48" fill="#fff" font-family="Arial" font-size="3" text-anchor="middle">PWR</text>

          <ellipse cx="72" cy="40" rx="2" ry="2" fill="#0080ff" opacity="${this.led2 ? 1 : 0.25}" />
          <text x="72" y="48" fill="#fff" font-family="Arial" font-size="3" text-anchor="middle">STAT</text>
        </g>

        <!-- RTC CR2032 Battery Holder -->
        <circle cx="50" cy="150" r="18" fill="#c0c0c0" stroke="#666" stroke-width="0.5" />
        <circle cx="50" cy="150" r="15" fill="#999" />
        <text x="50" y="148" fill="#333" font-family="Arial" font-size="5" text-anchor="middle" font-weight="bold">CR2032</text>
        <text x="50" y="155" fill="#333" font-family="Arial" font-size="4" text-anchor="middle">RTC</text>

        <!-- RTC Chip (DS1307 or similar) -->
        <rect x="72" y="142" width="16" height="16" fill="#1a1a1a" stroke="#666" stroke-width="0.4" />
        <text x="80" y="152" fill="#999" font-family="Arial" font-size="3.5" text-anchor="middle">DS1307</text>

        <!-- Crystal 32.768kHz -->
        <rect x="38" y="168" width="10" height="12" fill="#c0c0c0" stroke="#666" stroke-width="0.3" />
        <text x="43" y="177" fill="#333" font-family="Arial" font-size="2.5" text-anchor="middle">32k</text>

        <!-- 4 Relay Modules (bottom section) -->
        <g id="relays">
          <!-- Relay 1 - IO25 -->
          <rect x="18" y="190" width="40" height="50" fill="#0a0a0a" stroke="#000" stroke-width="0.5" rx="2" />
          <rect x="22" y="194" width="32" height="28" fill="#222" stroke="#444" stroke-width="0.3" />
          <rect x="27" y="226" width="22" height="8" fill="#ffcc00" stroke="#000" stroke-width="0.3" />
          <text x="38" y="232" fill="#000" font-family="Arial" font-size="5" text-anchor="middle" font-weight="bold">IO25</text>
          <circle cx="30" cy="208" r="2" fill="#c41e3a" opacity="0.4" />
          <text x="38" y="250" fill="#00ff00" font-family="Arial" font-size="6" text-anchor="middle" font-weight="bold">R1</text>

          <!-- Relay 2 - IO4 -->
          <rect x="68" y="190" width="40" height="50" fill="#0a0a0a" stroke="#000" stroke-width="0.5" rx="2" />
          <rect x="72" y="194" width="32" height="28" fill="#222" stroke="#444" stroke-width="0.3" />
          <rect x="77" y="226" width="22" height="8" fill="#ffcc00" stroke="#000" stroke-width="0.3" />
          <text x="88" y="232" fill="#000" font-family="Arial" font-size="5" text-anchor="middle" font-weight="bold">IO4</text>
          <circle cx="80" cy="208" r="2" fill="#c41e3a" opacity="0.4" />
          <text x="88" y="250" fill="#00ff00" font-family="Arial" font-size="6" text-anchor="middle" font-weight="bold">R2</text>

          <!-- Relay 3 - IO12 -->
          <rect x="118" y="190" width="40" height="50" fill="#0a0a0a" stroke="#000" stroke-width="0.5" rx="2" />
          <rect x="122" y="194" width="32" height="28" fill="#222" stroke="#444" stroke-width="0.3" />
          <rect x="127" y="226" width="22" height="8" fill="#ffcc00" stroke="#000" stroke-width="0.3" />
          <text x="138" y="232" fill="#000" font-family="Arial" font-size="5" text-anchor="middle" font-weight="bold">IO12</text>
          <circle cx="130" cy="208" r="2" fill="#c41e3a" opacity="0.4" />
          <text x="138" y="250" fill="#00ff00" font-family="Arial" font-size="6" text-anchor="middle" font-weight="bold">R3</text>

          <!-- Relay 4 - IO13 -->
          <rect x="168" y="190" width="40" height="50" fill="#0a0a0a" stroke="#000" stroke-width="0.5" rx="2" />
          <rect x="172" y="194" width="32" height="28" fill="#222" stroke="#444" stroke-width="0.3" />
          <rect x="177" y="226" width="22" height="8" fill="#ffcc00" stroke="#000" stroke-width="0.3" />
          <text x="188" y="232" fill="#000" font-family="Arial" font-size="5" text-anchor="middle" font-weight="bold">IO13</text>
          <circle cx="180" cy="208" r="2" fill="#c41e3a" opacity="0.4" />
          <text x="188" y="250" fill="#00ff00" font-family="Arial" font-size="6" text-anchor="middle" font-weight="bold">R4</text>
        </g>

        <!-- Bottom Terminal Blocks (green screw terminals for relay outputs) -->
        <g id="bottom-relay-terminals">
          ${[0,1,2,3].map(i => svg`
            <rect x="${18 + i*50}" y="255" width="40" height="20" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.4" />
            ${[0,1,2].map(j => svg`
              <circle cx="${26 + i*50 + j*12}" cy="265" r="3.5" fill="#333" stroke="#000" stroke-width="0.3" />
            `)}
            <text x="${38 + i*50}" y="262" fill="#fff" font-family="Arial" font-size="3.5" text-anchor="middle" font-weight="bold">COM  NC  NO</text>
          `)}
        </g>

        <!-- Left side terminal blocks (green screw terminals) -->
        <g id="left-terminals">
          <!-- Terminal block 1 (top) - 4 pins -->
          <rect x="4" y="20" width="12" height="32" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.4" />
          ${[0,1,2,3].map(i => svg`
            <circle cx="10" cy="${25 + i*7}" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
          `)}

          <!-- Terminal block 2 - 3 pins -->
          <rect x="4" y="56" width="12" height="24" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.4" />
          ${[0,1,2].map(i => svg`
            <circle cx="10" cy="${60 + i*7}" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
          `)}

          <!-- Terminal block 3 - 3 pins -->
          <rect x="4" y="83" width="12" height="24" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.4" />
          ${[0,1,2].map(i => svg`
            <circle cx="10" cy="${87 + i*7}" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
          `)}

          <!-- Terminal block 4 - 3 pins -->
          <rect x="4" y="113" width="12" height="24" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.4" />
          ${[0,1,2].map(i => svg`
            <circle cx="10" cy="${117 + i*7}" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
          `)}

          <!-- Terminal block 5 (bottom) - 4 pins -->
          <rect x="4" y="143" width="12" height="32" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.4" />
          ${[0,1,2,3].map(i => svg`
            <circle cx="10" cy="${148 + i*7}" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
          `)}
        </g>

        <!-- Right side terminal blocks (green screw terminals) -->
        <g id="right-terminals">
          <!-- Terminal block 1 (top) - 4 pins -->
          <rect x="224" y="20" width="12" height="32" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.4" />
          ${[0,1,2,3].map(i => svg`
            <circle cx="230" cy="${25 + i*7}" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
          `)}

          <!-- Terminal block 2 - 4 pins -->
          <rect x="224" y="56" width="12" height="32" fill="#5cb85c" stroke="#2d6d2d" stroke-width="0.4" />
          ${[0,1,2,3].map(i => svg`
            <circle cx="230" cy="${60 + i*7}" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
          `)}
        </g>

        <!-- Right side header (black pin header for SPI/Serial) -->
        <rect x="224" y="95" width="12" height="77" fill="#1a1a1a" stroke="#000" stroke-width="0.4" />
        ${[0,1,2,3,4,5,6,7,8,9].map(i => svg`
          <circle cx="230" cy="${102 + i*7}" r="2.5" fill="#333" stroke="#000" stroke-width="0.3" />
        `)}

        <!-- Small SMD components (resistors, capacitors) -->
        ${[
          {x: 95, y: 85, w: 8, h: 4, label: 'R1'},
          {x: 107, y: 85, w: 8, h: 4, label: 'R2'},
          {x: 119, y: 85, w: 8, h: 4, label: 'R3'},
          {x: 131, y: 85, w: 8, h: 4, label: 'R4'},
          {x: 95, y: 125, w: 4, h: 8, label: 'C1'},
          {x: 103, y: 125, w: 4, h: 8, label: 'C2'},
          {x: 111, y: 125, w: 4, h: 8, label: 'C3'},
          {x: 119, y: 125, w: 4, h: 8, label: 'C4'},
        ].map(comp => svg`
          <rect x="${comp.x}" y="${comp.y}" width="${comp.w}" height="${comp.h}" fill="#1a1a1a" stroke="#000" stroke-width="0.2" />
          <text x="${comp.x + comp.w/2}" y="${comp.y + comp.h/2 + 1.5}" fill="#ccc" font-family="Arial" font-size="2.5" text-anchor="middle">${comp.label}</text>
        `)}

        <!-- Voltage regulator ICs -->
        <g id="voltage-regulators">
          <rect x="195" y="125" width="18" height="14" fill="#1a1a1a" stroke="#666" stroke-width="0.4" />
          <text x="204" y="134" fill="#999" font-family="Arial" font-size="3.5" text-anchor="middle">AMS1117</text>
          <text x="204" y="138" fill="#999" font-family="Arial" font-size="2.5" text-anchor="middle">3.3V</text>

          <rect x="195" y="145" width="18" height="14" fill="#1a1a1a" stroke="#666" stroke-width="0.4" />
          <text x="204" y="154" fill="#999" font-family="Arial" font-size="3.5" text-anchor="middle">AMS1117</text>
          <text x="204" y="158" fill="#999" font-family="Arial" font-size="2.5" text-anchor="middle">5V</text>
        </g>

        <!-- Pin labels on left side -->
        <g id="left-labels" fill="#fff" font-family="Arial" font-size="3.5">
          <text x="18" y="27">3V3</text>
          <text x="18" y="34">IO33</text>
          <text x="18" y="41">GND</text>
          <text x="18" y="48">IO15</text>

          <text x="18" y="62">3V3</text>
          <text x="18" y="69">IO36</text>
          <text x="18" y="76">GND</text>

          <text x="18" y="89">3V3</text>
          <text x="18" y="96">IO39</text>
          <text x="18" y="103">GND</text>

          <text x="18" y="119">3V3</text>
          <text x="18" y="126">IO32</text>
          <text x="18" y="133">GND</text>

          <text x="18" y="150">VIN</text>
          <text x="18" y="157">GND</text>
          <text x="18" y="164">VIN</text>
          <text x="18" y="171">GND</text>
        </g>

        <!-- Pin labels on right side -->
        <g id="right-labels" fill="#fff" font-family="Arial" font-size="3.5" text-anchor="end">
          <text x="222" y="27">SCL</text>
          <text x="222" y="34">SDA</text>
          <text x="222" y="41">GND</text>
          <text x="222" y="48">3V3</text>

          <text x="222" y="62">SCL</text>
          <text x="222" y="69">SDA</text>
          <text x="222" y="76">GND</text>
          <text x="222" y="83">3V3</text>

          <text x="222" y="104">TX2</text>
          <text x="222" y="111">RX2</text>
          <text x="222" y="118">SCL</text>
          <text x="222" y="125">SDA</text>
          <text x="222" y="132">MOSI</text>
          <text x="222" y="139">MISO</text>
          <text x="222" y="146">CLK</text>
          <text x="222" y="153">CS</text>
          <text x="222" y="160">GND</text>
          <text x="222" y="167">3V3</text>
        </g>

        <!-- Board identification text -->
        <text x="120" y="275" fill="#fff" font-family="Arial" font-size="4" text-anchor="middle" opacity="0.6">PCB-HandySense-Version-3.0.0</text>

      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('handysense-pro-board', HandysenseProBoardElement);
