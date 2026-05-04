from __future__ import annotations

from pathlib import Path
import sys


SVG_WIDTH = 240
SVG_HEIGHT = 280


def silk(
    x: float,
    y: float,
    text: str,
    size: float = 3.1,
    anchor: str = "start",
    fill: str = "#eef7ee",
    weight: str = "normal",
) -> str:
    return (
        f'<text x="{x}" y="{y}" fill="{fill}" font-family="Arial" '
        f'font-size="{size}" text-anchor="{anchor}" font-weight="{weight}">{text}</text>'
    )


def terminal_body(x: float, y: float, width: float, height: float) -> str:
    return "\n".join(
        [
            f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="2.4" ry="2.4" fill="#67bd56" stroke="#2c6630" stroke-width="0.45" />',
            f'<rect x="{x + 1.5}" y="{y + 1.4}" width="{width - 3}" height="{height - 2.8}" rx="1.6" ry="1.6" fill="rgba(255,255,255,0.08)" />',
        ]
    )


def chip(x: float, y: float, width: float, height: float, label: str | None = None, label_size: float = 3.3) -> str:
    parts = [
        f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="1.2" ry="1.2" fill="#1f2430" stroke="#0f151d" stroke-width="0.45" />'
    ]
    if label:
        parts.append(silk(x + (width / 2), y + (height / 2) + 1.1, label, label_size, "middle", "#d9dee5", "bold"))
    return "\n".join(parts)


def relay_contact(base_x: float, relay_on: bool = False) -> str:
    x2 = base_x + 20 if relay_on else base_x + 12
    stroke = "#efb225" if relay_on else "#f0f1f2"
    return (
        f'<line x1="{base_x + 5}" y1="264" x2="{x2}" y2="264" '
        f'stroke="{stroke}" stroke-width="1.2" stroke-linecap="round" />'
    )


def group(group_id: str, *parts: str) -> str:
    inner = "\n".join(part for part in parts if part)
    return f'<g id="{group_id}">\n{inner}\n</g>'


def relay_block(x: float, index: int) -> str:
    return group(
        f"relay_{index + 1}",
        '<g filter="url(#handysense-shadow)">',
        f'<rect x="{x}" y="206" width="26" height="35" rx="1.9" ry="1.9" fill="#11171d" stroke="#000" stroke-width="0.42" />',
        f'<rect x="{x + 3}" y="209" width="20" height="18" fill="#222c38" stroke="#465261" stroke-width="0.28" />',
        silk(x + 13, 220, f"K{index + 1}", 4.6, "middle", "#e6e9ed", "bold"),
        "</g>",
    )


def relay_terminal(x: float, index: int) -> str:
    return group(
        f"relay_terminal_{index + 1}",
        terminal_body(x, 254, 24, 16),
        relay_contact(x),
        silk(x + 12, 251, "NO COM NC", 2.2, "middle"),
    )


def button_circle(x: float, y: float) -> str:
    return f'<circle cx="{x}" cy="{y}" r="5" fill="#1f2430" stroke="#ced5dc" stroke-width="0.34" />'


def build_svg(variant: str = "handysense") -> str:
    is_real = variant == "handysense-real"
    led_status_y = 147 if is_real else 148
    led_status_left_x = 145 if is_real else 144
    led_status_right_x = 179 if is_real else 178
    led_status_left_label_x = 165 if is_real else 164
    led_status_right_label_x = 199 if is_real else 198
    led_status_label_y = 143 if is_real else 144
    button_label_y = 172 if is_real else 171
    button_circle_y = 178 if is_real else 177
    button_chip_y = 188 if is_real else 187
    spi_block_y = 86 if is_real else 90
    spi_label_y = 83 if is_real else 87
    spi_text_y = 88 if is_real else 92
    button_block_y = 135 if is_real else 139
    button_block_label_y = 155 if is_real else 159
    button_block_text_y = 160 if is_real else 164
    led_relay_block_y = 184 if is_real else 188
    led_relay_label_y = 204 if is_real else 208
    led_relay_text_y = 209 if is_real else 213

    parts: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="63mm" height="74mm" version="1.1" viewBox="0 0 {SVG_WIDTH} {SVG_HEIGHT}">',
        "<defs>",
        '<linearGradient id="handysense-board-fill" x1="0%" y1="0%" x2="100%" y2="100%">',
        '<stop offset="0%" stop-color="#229650" />',
        '<stop offset="55%" stop-color="#137c42" />',
        '<stop offset="100%" stop-color="#0d6838" />',
        "</linearGradient>",
        '<filter id="handysense-shadow" x="-20%" y="-20%" width="140%" height="140%">',
        '<feDropShadow dx="0.2" dy="1.1" stdDeviation="0.9" flood-color="#0a331c" flood-opacity="0.3" />',
        "</filter>",
        "</defs>",
        group(
            "board_base",
            f'<rect x="0" y="0" width="{SVG_WIDTH}" height="{SVG_HEIGHT}" rx="5" ry="5" fill="url(#handysense-board-fill)" stroke="#084a28" stroke-width="0.75" />',
            '<circle cx="8" cy="8" r="4.1" fill="#ececeb" stroke="#7d848a" stroke-width="0.4" />',
            '<circle cx="232" cy="8" r="4.1" fill="#ececeb" stroke="#7d848a" stroke-width="0.4" />',
            '<circle cx="8" cy="272" r="4.1" fill="#ececeb" stroke="#7d848a" stroke-width="0.4" />',
            '<circle cx="232" cy="272" r="4.1" fill="#ececeb" stroke="#7d848a" stroke-width="0.4" />',
        ),
        group(
            "rs485",
            '<g transform="matrix(1 0 0 1 -9.33333 -10)">',
            terminal_body(25, 12, 30, 16),
            silk(40, 9, "B A GND +24V", 2.6, "middle"),
            silk(40, 6, "RS485", 3.2, "middle", "#f3fbf3", "bold"),
            "</g>",
        ),
        group(
            "i2c_top",
            '<g transform="translate(-32 -9.33333)">',
            terminal_body(83, 12, 30, 16),
            terminal_body(115.6666669845581, 11.333333373069763, 30, 16),
            terminal_body(116, 46.333333253860474, 30, 16),
            silk(120, 6, "I2C", 3.2, "middle", "#f3fbf3", "bold"),
            silk(120, 10, "SCL SDA GND +5V", 2.6, "middle"),
            chip(74, 29.666666746139526, 17, 14),
            chip(95.33333337306976, 30.333333492279053, 17, 14),
            chip(118.00000047683716, 30.333333373069763, 17, 14),
            chip(53.4938850402832, 29.67165756225586, 17, 14),
            "</g>",
        ),
        group(
            "esp32_module",
            '<g filter="url(#handysense-shadow)">',
            '<rect x="153" y="12" width="44" height="60" rx="3.6" ry="3.6" fill="#2a2f3b" stroke="#b5bec8" stroke-width="0.5" />',
            '<rect x="160" y="21" width="30" height="30" fill="#aeb3b7" stroke="#6a717a" stroke-width="0.3" />',
            '<rect x="163" y="24" width="24" height="24" fill="#494d55" />',
            '<path d="M 178 12 h 16 v 18 h -16" fill="none" stroke="#e1ba4a" stroke-width="1.5" />',
            '<path d="M 181 20 h 10 M 181 25 h 10 M 181 30 h 10" fill="none" stroke="#e1ba4a" stroke-width="0.95" />',
            silk(175, 39, "ESP32", 5.2, "middle", "#ffffff", "bold"),
            "</g>",
            silk(168, 81, "RESET", 2.7, "middle"),
            silk(185, 81, "BOOT", 2.7, "middle"),
            '<circle cx="160" cy="82" r="4.5" fill="#20252f" stroke="#cbd1d6" stroke-width="0.32" />',
            '<circle cx="177" cy="82" r="4.5" fill="#20252f" stroke="#cbd1d6" stroke-width="0.32" />',
            silk(146, 95, "U15", 2.2),
            chip(140, 98, 20, 16),
            chip(165, 101, 18, 12),
            chip(132, 118, 34, 16),
        ),
        group(
            "programming_port",
            silk(207, 6, "Programming", 3.1, "middle", "#f3fbf3", "bold"),
            silk(207, 10, "TX RX GND +5V", 2.5, "middle"),
            '<rect x="198" y="18" width="25" height="26" rx="3" ry="3" fill="#eef2f6" stroke="#919ba7" stroke-width="0.42" />',
            '<rect x="204" y="26" width="13" height="9" rx="1.3" ry="1.3" fill="#dde3ea" stroke="#7d8791" stroke-width="0.22" />',
            silk(210, 48, "Micro USB", 2.2, "middle", "#d9eddc"),
        ),
        group(
            "microsd",
            '<rect x="195" y="56" width="31" height="49" rx="3.1" ry="3.1" fill="#d9dde6" stroke="#818a96" stroke-width="0.45" />',
            '<rect x="200" y="67" width="20" height="17" rx="1.2" ry="1.2" fill="#f4f5f7" stroke="#98a1ab" stroke-width="0.24" />',
            '<line x1="220" y1="64" x2="220" y2="99" stroke="#8a94a0" stroke-width="0.8" />',
            silk(210, 109, "MicroSD", 2.5, "middle", "#eef7ee", "bold"),
        ),
        group(
            "analog_0_5v",
            terminal_body(4, 52, 12, 24),
            terminal_body(4, 81, 12, 24),
            silk(19, 58, "Analog 0-5V", 3.1, "start", "#f3fbf3", "bold"),
            silk(19, 63, "V SIG GND", 2.4),
            silk(19, 70, "A1 / A2 / A3", 2.3),
        ),
        group(
            "analog_4_20ma",
            terminal_body(4, 114, 12, 24),
            terminal_body(4, 143, 12, 24),
            silk(19, 120, "Analog 4-20mA", 3.1, "start", "#f3fbf3", "bold"),
            silk(19, 125, "V SIG GND", 2.4),
            silk(19, 132, "I1 / I2 / I3", 2.3),
        ),
        group(
            "mid_left_chips",
            chip(35, 58, 12, 18),
            chip(34, 113, 12, 18),
            chip(52, 103, 19, 12),
            chip(74, 104, 14, 14),
        ),
        group(
            "buzzer",
            '<circle cx="108" cy="110" r="15.5" fill="#d7dce3" stroke="#7b8390" stroke-width="0.52" />',
            '<circle cx="101" cy="104" r="1.8" fill="#9aa2ad" />',
            '<circle cx="115" cy="118" r="1.8" fill="#9aa2ad" />',
            silk(108, 114, "Buzzer", 3.8, "middle", "#4b5561", "bold"),
            silk(95, 95, "LS1", 2.2),
        ),
        group(
            "rtc",
            '<circle cx="79" cy="146" r="13" fill="#d2d6dc" stroke="#7b8390" stroke-width="0.52" />',
            '<circle cx="79" cy="146" r="10" fill="#bcc2ca" />',
            silk(79, 144, "RTC", 3.6, "middle", "#4b5561", "bold"),
            silk(79, 150, "CR1220", 2.5, "middle", "#58626f"),
            silk(79, 159, "Battery Holder for CR1220", 2.1, "middle", "#d7ecda"),
        ),
        group(
            "board_markings",
            silk(96, 152, "POWER", 2.2, "middle"),
            silk(110, 152, "STATUS", 2.2, "middle"),
            '<circle cx="96" cy="157" r="1.8" fill="#72ff73" opacity="0.9" />',
            '<circle cx="110" cy="157" r="1.8" fill="#6eacf8" opacity="0.86" />',
            silk(106, 150, "HandySense", 6.1, "start", "#edf7ee", "bold"),
            silk(134, 156, "Version 3.0.0", 2.6, "middle", "#d7ecda"),
        ),
        group(
            "led_status",
            terminal_body(led_status_left_x, led_status_y, 40, 12),
            terminal_body(led_status_right_x, led_status_y, 40, 12),
            silk(led_status_left_label_x, led_status_label_y, "+5V LED Status 0-3", 2.5, "middle"),
            silk(led_status_right_label_x, led_status_label_y, "+5V LED Status 4-7", 2.5, "middle"),
        ),
        group(
            "local_buttons",
            silk(104, button_label_y, "Button0", 2.2, "middle"),
            silk(129, button_label_y, "Button1", 2.2, "middle"),
            silk(154, button_label_y, "Button2", 2.2, "middle"),
            silk(179, button_label_y, "Button3", 2.2, "middle"),
            button_circle(104, button_circle_y),
            button_circle(129, button_circle_y),
            button_circle(154, button_circle_y),
            button_circle(179, button_circle_y),
            chip(98, button_chip_y, 12, 10),
            chip(123, button_chip_y, 12, 10),
            chip(148, button_chip_y, 12, 10),
            chip(173, button_chip_y, 12, 10),
        ),
        group(
            "spi_block",
            terminal_body(224, spi_block_y, 12, 40),
            silk(208, spi_label_y, "SPI", 3.6, "end", "#f3fbf3", "bold"),
            silk(208, spi_text_y, "MOSI MISO CLK CS GND", 2.3, "end"),
        ),
        group(
            "button_block",
            terminal_body(224, button_block_y, 12, 40),
            silk(208, button_block_label_y, "Button", 3.6, "end", "#f3fbf3", "bold"),
            silk(208, button_block_text_y, "B0 B1 B2 B3 GND", 2.3, "end"),
        ),
        group(
            "led_relay_block",
            terminal_body(224, led_relay_block_y, 12, 40),
            silk(208, led_relay_label_y, "LED Relay", 3.6, "end", "#f3fbf3", "bold"),
            silk(208, led_relay_text_y, "R1 R2 R3 R4 +5V", 2.3, "end"),
        ),
        group(
            "power_area",
            chip(18, 225, 16, 16),
            chip(38, 225, 16, 16),
            '<circle cx="26" cy="208" r="7.3" fill="#6c89d8" stroke="#39558f" stroke-width="0.42" />',
            '<circle cx="49" cy="208" r="7.3" fill="#9aa7b3" stroke="#56606e" stroke-width="0.42" />',
            '<circle cx="16" cy="238" r="4.8" fill="#e2e4e6" stroke="#838b95" stroke-width="0.34" />',
        ),
        group(
            "power_supply",
            terminal_body(4, 245, 12, 24),
            silk(5, 240, "POWER", 2.1),
            silk(5, 243, "SUPPLY", 2.1),
            silk(4, 276, "VIN 24VDC", 2.4),
        ),
        group(
            "power_relay",
            terminal_body(71, 257, 20, 14),
            silk(81, 255, "VIN RELAY 5VDC", 2.3, "middle"),
        ),
    ]

    for relay_index, relay_x in enumerate([98, 130, 162, 194]):
        parts.append(relay_block(relay_x, relay_index))

    for relay_index, relay_x in enumerate([98, 130, 162, 194]):
        parts.append(relay_terminal(relay_x, relay_index))

    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def main() -> None:
    docs_dir = Path(__file__).resolve().parent
    variant_arg = sys.argv[1].strip().lower() if len(sys.argv) > 1 else "handysense"
    variant = "handysense-real" if variant_arg in {"real", "handysense-real"} else "handysense"
    output_name = "handysense-real-board-plain.svg" if variant == "handysense-real" else "handysense-board-plain.svg"
    output_path = docs_dir / output_name
    output_path.write_text(build_svg(variant), encoding="utf-8")
    print(f"Wrote {output_path.name}")


if __name__ == "__main__":
    main()
