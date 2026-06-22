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

export const HANDYSENSE_REAL_BOARD_CONTROL_EVENT = 'handysense-real-board-control';
const HANDYSENSE_REAL_OVERLAY_Z_INDEX = '950';
const HANDYSENSE_REAL_OVERLAY_BUTTON_Z_INDEX = '951';
const HANDYSENSE_REAL_FACE_TOGGLE_Z_INDEX = '960';

export type HandysenseRealBoardControlName =
  | 'reset'
  | 'boot'
  | 'button0'
  | 'button1'
  | 'button2'
  | 'button3';

export interface HandysenseRealBoardControlDetail {
  control: HandysenseRealBoardControlName;
  pressed: boolean;
}

type HandysenseRealMomentaryControlName = Exclude<HandysenseRealBoardControlName, 'reset'>;

function connectorSignals(names: string[]): any[][] {
  return names.map((name) => {
    if (
      name.endsWith('_VCC')
      || name.endsWith('_24V')
      || name === 'PWR24_VIN'
      || name === 'RELAY5V_VIN'
      || name === 'LEDR_VCC'
      || name === 'LED_VCC_A'
      || name === 'LED_VCC_B'
      || name === 'SPI_3V3'
    ) {
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

const HANDYSENSE_REAL_PIN_INFO: ElementPin[] = [
  ...terminalGroupHorizontal(['RS485_B', 'RS485_A', 'RS485_GND', 'RS485_24V'], 22.8, 10.4),

  ...terminalGroupHorizontal(['I2C1_SCL', 'I2C1_SDA', 'I2C1_GND', 'I2C1_VCC'], 55.1, 10.5),
  ...terminalGroupHorizontal(['I2C2_SCL', 'I2C2_SDA', 'I2C2_GND', 'I2C2_VCC'], 90, 10.5),
  ...terminalGroupHorizontal(['I2C3_SCL', 'I2C3_SDA', 'I2C3_GND', 'I2C3_VCC'], 90, 43.9),

  ...terminalGroupVertical(['A05_1_VCC', 'A05_1_GND', 'A05_1_SIG'], 9.8, 30.5),
  ...terminalGroupVertical(['A05_2_VCC', 'A05_2_GND', 'A05_2_SIG'], 9.8, 59.2),
  ...terminalGroupVertical(['A420_1_VCC', 'A420_1_GND', 'A420_1_SIG'], 9.8, 85.8),
  ...terminalGroupVertical(['A420_2_VCC', 'A420_2_GND', 'A420_2_SIG'], 9.8, 113.8),

  ...terminalGroupHorizontal(['LED_VCC_A', 'LEDS_0', 'LEDS_1', 'LEDS_2', 'LEDS_3'], 132, 149.5),
  ...terminalGroupHorizontal(['LED_VCC_B', 'LEDS_4', 'LEDS_5', 'LEDS_6', 'LEDS_7'], 174, 149.5),

  ...terminalGroupVertical(['SPI_CLK', 'SPI_MISO', 'SPI_MOSI', 'SPI_CS', 'SPI_GND', 'SPI_3V3'], 229.2, 91.5),
  ...terminalGroupVertical(['BTN_GND', 'BTN_3', 'BTN_2', 'BTN_1', 'BTN_0'], 229.2, 136),
  ...terminalGroupVertical(['LEDR_3', 'LEDR_2', 'LEDR_1', 'LEDR_0', 'LEDR_VCC'], 229.2, 177),

  ...terminalGroupVertical(['PWR24_VIN', 'PWR24_GND'], 9.6, 252),
  ...terminalGroupHorizontal(['RELAY5V_VIN', 'RELAY5V_GND'], 63.5, 270),

  ...terminalGroupHorizontal(['R1_NC', 'R1_COM', 'R1_NO'], 90.5, 270),
  ...terminalGroupHorizontal(['R2_NC', 'R2_COM', 'R2_NO'], 125.5, 270),
  ...terminalGroupHorizontal(['R3_NC', 'R3_COM', 'R3_NO'], 161.5, 270),
  ...terminalGroupHorizontal(['R4_NC', 'R4_COM', 'R4_NO'], 198.5, 270),
];

const HANDYSENSE_REAL_PIN_LABELS: Partial<Record<string, string>> = {
  // Display labels only. Pin names above stay unchanged for wiring and signals.
  A05_1_VCC: '+5V',
  A05_1_GND: 'GND',
  A05_1_SIG: 'ANN',
  A05_2_VCC: '+5V',
  A05_2_GND: 'GND',
  A05_2_SIG: 'ANN',
  A420_1_VCC: 'VIN',
  A420_1_GND: 'GND',
  A420_1_SIG: 'ANN',
  A420_2_VCC: 'VIN',
  A420_2_GND: 'GND',
  A420_2_SIG: 'ANN',
  RS485_B: 'B',
  RS485_A: 'A',
  RS485_GND: 'GND',
  RS485_24V: 'VIN',
  I2C1_SCL: 'SDC',
  I2C1_SDA: 'SDA',
  I2C1_GND: 'GND',
  I2C1_VCC: '+5V',
  I2C2_SCL: 'SDC',
  I2C2_SDA: 'SDA',
  I2C2_GND: 'GND',
  I2C2_VCC: '+5V',
  I2C3_SCL: 'SDC',
  I2C3_SDA: 'SDA',
  I2C3_GND: 'GND',
  I2C3_VCC: '+5V',
  LED_VCC_A: '+5V',
  LEDS_0: 'LED0',
  LEDS_1: 'LED1',
  LEDS_2: 'LED2',
  LEDS_3: 'LED3',
  LED_VCC_B: '+5V',
  LEDS_4: 'LED4',
  LEDS_5: 'LED5',
  LEDS_6: 'LED6',
  LEDS_7: 'LED7',
  SPI_CLK: 'CLK',
  SPI_MISO: 'MISO',
  SPI_MOSI: 'MOSI',
  SPI_CS: 'CS1',
  SPI_GND: 'GND',
  SPI_3V3: '+3.3V',
  BTN_GND: 'GND',
  BTN_3: 'BUTTON3',
  BTN_2: 'BUTTON2',
  BTN_1: 'BUTTON1',
  BTN_0: 'BUTTON0',
  LEDR_3: 'RELAY3',
  LEDR_2: 'RELAY2',
  LEDR_1: 'RELAY1',
  LEDR_0: 'RELAY0',
  LEDR_VCC: '+5V RELAY',
  RELAY5V_VIN: '+5V',
  RELAY5V_GND: 'GND',
  R1_NC: 'NC0',
  R1_COM: 'COM0',
  R1_NO: 'NO0',
  R2_NC: 'NC1',
  R2_COM: 'COM1',
  R2_NO: 'NO1',
  R3_NC: 'NC2',
  R3_COM: 'COM2',
  R3_NO: 'NO2',
  R4_NC: 'NC3',
  R4_COM: 'COM3',
  R4_NO: 'NO3',
  // RS485_B: 'B',
  // RS485_A: 'A',
  // RS485_GND: 'GND',
  // RS485_24V: '+24V',
};

function pinDisplayLabel(name: string): string {
  return HANDYSENSE_REAL_PIN_LABELS[name] ?? name;
}

type BoardFaceMode = 'photo' | 'svg';

const HANDYSENSE_REAL_CONTROL_GEOMETRY: Record<HandysenseRealBoardControlName, { x: number; y: number; radius: number }> = {
  reset: { x: 141, y: 74, radius: 9 },
  boot: { x: 170, y: 74, radius: 9 },
  button0: { x: 115, y: 172, radius: 9 },
  button1: { x: 142, y: 172, radius: 9 },
  button2: { x: 168, y: 172, radius: 9 },
  button3: { x: 196, y: 172, radius: 9 },
};

const HANDYSENSE_REAL_CONTROL_LABELS: Record<HandysenseRealBoardControlName, string> = {
  reset: 'RESET',
  boot: 'BOOT',
  button0: 'Button 0',
  button1: 'Button 1',
  button2: 'Button 2',
  button3: 'Button 3',
};

const HANDYSENSE_REAL_LED_GEOMETRY: Array<{ x: number; y: number; label: string }> = [
  { x: 134, y: 128, label: 'LED0' },
  { x: 144, y: 128, label: 'LED1' },
  { x: 154, y: 128, label: 'LED2' },
  { x: 164, y: 128, label: 'LED3' },
  { x: 174, y: 128, label: 'LED4' },
  { x: 184, y: 128, label: 'LED5' },
  { x: 190, y: 128, label: 'LED6' },
  { x: 198, y: 128, label: 'LED7' },
];

type PinLabelAnchor = 'start' | 'end';
type PinLabelOrientation = 'horizontal' | 'vertical';

const PIN_LABEL_TEXT_SIZE = 2.8;
const PIN_LABEL_PADDING_X = 1.6;
const PIN_LABEL_HEIGHT = 5.3;
const PIN_LABEL_VERTICAL_WIDTH = 5.8;

function labelPos(pin: ElementPin): { anchor: PinLabelAnchor; x: number; y: number; orientation: PinLabelOrientation; rotation: number } {
  const anchor: PinLabelAnchor = pin.x > 198 ? 'end' : 'start';
  let x = pin.x + (anchor === 'end' ? -6 : 6);
  let orientation: PinLabelOrientation = 'horizontal';
  let rotation = 0;

  let y = pin.y + 0.9;
  if (
    pin.name.startsWith('I2C3_')
    || pin.name.startsWith('LEDS_')
    || pin.name.startsWith('LED_VCC_')
  ) {
    x = pin.x + (anchor === 'end' ? -0.8 : 0.8);
    y = pin.y + 10;
    orientation = 'vertical';
    rotation = -90;
  }
  if (pin.y < 18) {
    y = pin.y + 10;
    x = pin.x + (anchor === 'end' ? -0.8 : 0.8);
    orientation = 'vertical';
    rotation = 90;
  } else if (pin.y > 262) {
    y = pin.y - 8;
    x = pin.x + (anchor === 'end' ? -1 : 1);
    orientation = 'vertical';
    rotation = -90;
  }

  return { anchor, x, y, orientation, rotation };
}

function pinLabelWidth(name: string, isVertical = false): number {
  if (isVertical) {
    return Math.max(6.5, (name.length * 1.55) + 2);
  }
  return Math.max(16, (name.length * 1.75) + (PIN_LABEL_PADDING_X * 2));
}

function pinLabelGroupKey(name: string): string {
  if (name.startsWith('BTN_')) {
    return 'BTN';
  }
  if (name.startsWith('LEDR_')) {
    return 'LEDR';
  }
  if (name.startsWith('LEDS_') || name.startsWith('LED_VCC_')) {
    return 'LEDS';
  }
  const parts = name.split('_');
  if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
    return `${parts[0]}_${parts[1]}`;
  }
  return parts[0];
}

function standaloneOverlayLabelBoxes() {
  const boxes = [
    { y: 28.2, label: 'ANN3' },
    { y: 56.9, label: 'ANN2' },
    { y: 83.5, label: 'ANN1' },
    { y: 111.5, label: 'ANN0' },
  ];
  return boxes.map(({ y, label }) => {
    const textX = 34.7;
    const textY = y + 11.3;
    return svg`
      <g pointer-events="none" aria-hidden="true">
        <rect
          x="31.3"
          y="${y}"
          width="6.8"
          height="22.6"
          rx="1.4"
          ry="1.4"
          fill="#000"
        />
        <text
          x="${textX}"
          y="${textY}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="2.8"
          font-family="Arial, sans-serif"
          font-weight="700"
          fill="#fff"
          transform="rotate(90 ${textX} ${textY})"
        >${label}</text>
      </g>
    `;
  });
}

function standaloneConnectorNameBoxes() {
  const boxes = [
    { x: 20.1, y: 24.2, width: 31.2, label: 'RS485' },
    { x: 52.5, y: 24.2, width: 31.2, label: 'I2C' },
    { x: 87.4, y: 24.2, width: 31.2, label: 'I2C' },
    { x: 87.4, y: 57.7, width: 31.2, label: 'I2C' },
  ];
  return boxes.map(({ x, y, width, label }) => svg`
    <g pointer-events="none" aria-hidden="true">
      <rect
        x="${x}"
        y="${y}"
        width="${width}"
        height="7"
        rx="1.1"
        ry="1.1"
        fill="#fff2df"
        stroke="#e0c39f"
        stroke-width="0.35"
      />
      <text
        x="${x + (width / 2)}"
        y="${y + 3.65}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="3.3"
        font-family="Arial, sans-serif"
        font-weight="700"
        fill="#0b5f9f"
      >${label}</text>
    </g>
  `);
}

function standaloneRelayNameBoxes() {
  const boxes: Array<{ x: number; y: number; width: number; label: string; fontSize?: number }> = [
    { x: 52.2, y: 251.7, width: 26, label: 'VIN RELAY +5V' },
    { x: 88.2, y: 251.7, width: 26, label: 'RELAY0' },
    { x: 123.2, y: 251.7, width: 26, label: 'RELAY1' },
    { x: 159.2, y: 251.7, width: 26, label: 'RELAY2' },
    { x: 196.2, y: 251.7, width: 26, label: 'RELAY3' },
  ];
  return boxes.map(({ x, y, width, label, fontSize = 3.1 }) => svg`
    <g pointer-events="none" aria-hidden="true">
      <rect
        x="${x}"
        y="${y}"
        width="${width}"
        height="7"
        rx="1.1"
        ry="1.1"
        fill="#fff2df"
        stroke="#e0c39f"
        stroke-width="0.35"
      />
      <text
        x="${x + (width / 2)}"
        y="${y + 3.65}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${fontSize}"
        font-family="Arial, sans-serif"
        font-weight="700"
        fill="#0b5f9f"
      >${label}</text>
    </g>
  `);
}

export class HandysenseRealBoardElement extends HandysenseProBoardElement {
  readonly pinInfo: ElementPin[] = HANDYSENSE_REAL_PIN_INFO;
  private boardFaceMode: BoardFaceMode = 'photo';
  private faceToggleElement: HTMLDivElement | null = null;
  private controlOverlayElement: HTMLDivElement | null = null;
  private readonly controlButtonElements = new Map<HandysenseRealBoardControlName, HTMLButtonElement>();
  private hostStyleObserver: MutationObserver | null = null;
  private overlayStyleObserver: MutationObserver | null = null;
  private readonly syncFaceTogglePositionBound = () => this.syncFaceTogglePosition();
  private readonly controlPressedState: Record<HandysenseRealBoardControlName, boolean> = {
    reset: false,
    boot: false,
    button0: false,
    button1: false,
    button2: false,
    button3: false,
  };
  private readonly ledState = new Array<boolean>(8).fill(false);

  setLedState(index: number, on: boolean) {
    if (index < 0 || index >= this.ledState.length) {
      return;
    }
    if (this.ledState[index] === on) {
      return;
    }
    this.ledState[index] = on;
    this.requestUpdate();
  }

  private consumePointer(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  private consumeControlInteraction(event: Event) {
    this.consumePointer(event);
  }

  private dispatchBoardControl(control: HandysenseRealBoardControlName, pressed: boolean) {
    this.dispatchEvent(new CustomEvent<HandysenseRealBoardControlDetail>(HANDYSENSE_REAL_BOARD_CONTROL_EVENT, {
      bubbles: true,
      composed: true,
      detail: { control, pressed },
    }));
  }

  private setControlPressed(control: HandysenseRealBoardControlName, pressed: boolean) {
    if (this.controlPressedState[control] === pressed) {
      return;
    }
    this.controlPressedState[control] = pressed;
    this.syncControlOverlayState();
  }

  private releaseMomentaryControl(control: HandysenseRealMomentaryControlName) {
    if (!this.controlPressedState[control]) {
      return;
    }
    this.setControlPressed(control, false);
    this.dispatchBoardControl(control, false);
  }

  private handleResetPointerDown(event: PointerEvent) {
    this.consumePointer(event);
    this.setControlPressed('reset', true);
    this.dispatchBoardControl('reset', true);
    window.setTimeout(() => this.setControlPressed('reset', false), 120);
  }

  private handleMomentaryControlPointerDown(control: HandysenseRealMomentaryControlName, event: PointerEvent, target?: HTMLElement | null) {
    this.consumePointer(event);
    target?.setPointerCapture?.(event.pointerId);
    this.setControlPressed(control, true);
    this.dispatchBoardControl(control, true);
  }

  private handleMomentaryControlPointerUp(control: HandysenseRealMomentaryControlName, event: PointerEvent, target?: HTMLElement | null) {
    this.consumePointer(event);
    if (target?.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    this.releaseMomentaryControl(control);
  }

  private handleMomentaryControlPointerCancel(control: HandysenseRealMomentaryControlName, event: PointerEvent) {
    this.consumePointer(event);
    this.releaseMomentaryControl(control);
  }

  private ensureControlOverlay() {
    if (this.controlOverlayElement) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'handysense-real-board-controls';
    overlay.setAttribute('aria-hidden', 'false');
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = HANDYSENSE_REAL_OVERLAY_Z_INDEX;

    const controls: HandysenseRealBoardControlName[] = ['reset', 'boot', 'button0', 'button1', 'button2', 'button3'];
    controls.forEach((control) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `handysense-real-board-control handysense-real-board-control--${control === 'reset' ? 'reset' : 'momentary'}`;
      button.textContent = HANDYSENSE_REAL_CONTROL_LABELS[control];
      button.dataset.control = control;
      button.setAttribute('aria-label', HANDYSENSE_REAL_CONTROL_LABELS[control]);
      button.style.position = 'fixed';
      button.style.pointerEvents = 'auto';
      button.style.zIndex = HANDYSENSE_REAL_OVERLAY_BUTTON_Z_INDEX;
      button.style.touchAction = 'none';
      button.addEventListener('pointerdown', (event) => {
        this.consumeControlInteraction(event);
        if (control === 'reset') {
          this.handleResetPointerDown(event);
          return;
        }
        this.handleMomentaryControlPointerDown(control, event, button);
      });
      button.addEventListener('pointerup', (event) => {
        this.consumeControlInteraction(event);
        if (control === 'reset') {
          return;
        }
        this.handleMomentaryControlPointerUp(control, event, button);
      });
      button.addEventListener('pointercancel', (event) => {
        this.consumeControlInteraction(event);
        if (control === 'reset') {
          return;
        }
        this.handleMomentaryControlPointerCancel(control, event);
      });
      button.addEventListener('lostpointercapture', (event) => {
        this.consumeControlInteraction(event);
        if (control === 'reset') {
          return;
        }
        this.releaseMomentaryControl(control);
      });
      button.addEventListener('click', (event) => this.consumeControlInteraction(event));
      button.addEventListener('mousedown', (event) => this.consumeControlInteraction(event));
      button.addEventListener('mouseup', (event) => this.consumeControlInteraction(event));
      button.addEventListener('touchstart', (event) => this.consumeControlInteraction(event));
      button.addEventListener('touchend', (event) => this.consumeControlInteraction(event));
      overlay.appendChild(button);
      this.controlButtonElements.set(control, button);
    });

    document.body.appendChild(overlay);
    this.controlOverlayElement = overlay;
    this.syncControlOverlayPosition();
    this.syncControlOverlayState();
  }

  private syncControlOverlayPosition() {
    if (!this.controlOverlayElement) {
      return;
    }

    const rect = this.getBoundingClientRect();
    const scaleX = rect.width / 240;
    const scaleY = rect.height / 280;

    this.controlButtonElements.forEach((button, control) => {
      const { x, y, radius } = HANDYSENSE_REAL_CONTROL_GEOMETRY[control];
      const diameter = Math.max(radius * 2 * Math.min(scaleX, scaleY), 18);
      const left = rect.left + (x * scaleX) - (diameter / 2);
      const top = rect.top + (y * scaleY) - (diameter / 2);
      button.style.left = `${left}px`;
      button.style.top = `${top}px`;
      button.style.width = `${diameter}px`;
      button.style.height = `${diameter}px`;
      button.style.fontSize = `${Math.max(diameter * (control === 'boot' ? 0.2 : 0.24), 8)}px`;
    });
  }

  private syncControlOverlayState() {
    this.controlButtonElements.forEach((button, control) => {
      const pressed = this.controlPressedState[control];
      button.classList.toggle('pressed', pressed);
      button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    });
  }

  private handleBoardFaceToggle(mode: BoardFaceMode, event: Event) {
    this.consumePointer(event);
    this.setBoardFace(mode);
  }

  private setBoardFace(mode: BoardFaceMode) {
    if (this.boardFaceMode !== mode) {
      this.boardFaceMode = mode;
      this.syncFaceToggleState();
      this.requestUpdate();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    queueMicrotask(() => {
      this.ensureFaceToggle();
      this.ensureControlOverlay();
      this.syncFaceTogglePosition();
      this.syncControlOverlayPosition();
      this.syncFaceToggleState();
      this.syncControlOverlayState();
      this.observeHostStyle();
    });
  }

  disconnectedCallback() {
    this.hostStyleObserver?.disconnect();
    this.hostStyleObserver = null;
    this.overlayStyleObserver?.disconnect();
    this.overlayStyleObserver = null;
    window.removeEventListener('resize', this.syncFaceTogglePositionBound);
    window.removeEventListener('scroll', this.syncFaceTogglePositionBound, true);
    this.faceToggleElement?.remove();
    this.faceToggleElement = null;
    this.controlOverlayElement?.remove();
    this.controlOverlayElement = null;
    this.controlButtonElements.clear();
    super.disconnectedCallback();
  }

  private ensureFaceToggle() {
    if (this.faceToggleElement) {
      return;
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.display = 'none';
    container.style.gap = '4px';
    container.style.padding = '4px';
    container.style.borderRadius = '10px';
    container.style.background = 'rgba(15,44,23,0.92)';
    container.style.border = '1px solid #b8dcbf';
    container.style.zIndex = HANDYSENSE_REAL_FACE_TOGGLE_Z_INDEX;
    container.style.pointerEvents = 'none';
    container.setAttribute('aria-hidden', 'true');

    const createButton = (label: string, mode: BoardFaceMode) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.mode = mode;
      button.style.borderRadius = '999px';
      button.style.padding = '2px 9px';
      button.style.font = '700 11px Arial';
      button.style.cursor = 'pointer';
      button.style.pointerEvents = 'auto';
      button.addEventListener('pointerdown', (event) => this.consumePointer(event));
      button.addEventListener('mousedown', (event) => this.consumePointer(event));
      button.addEventListener('touchstart', (event) => this.consumePointer(event));
      button.addEventListener('click', (event) => this.handleBoardFaceToggle(mode, event));
      return button;
    };

    container.append(createButton('PHOTO', 'photo'), createButton('SVG', 'svg'));
    document.body.appendChild(container);
    this.faceToggleElement = container;
    window.addEventListener('resize', this.syncFaceTogglePositionBound);
    window.addEventListener('scroll', this.syncFaceTogglePositionBound, true);
  }

  private observeHostStyle() {
    if (this.hostStyleObserver) {
      return;
    }

    this.hostStyleObserver = new MutationObserver(() => this.syncFaceTogglePosition());
    this.hostStyleObserver.observe(this, { attributes: true, attributeFilter: ['style'] });

    const overlayContainer = this.parentElement;
    if (overlayContainer && !this.overlayStyleObserver) {
      this.overlayStyleObserver = new MutationObserver(() => this.syncFaceTogglePosition());
      this.overlayStyleObserver.observe(overlayContainer, { attributes: true, attributeFilter: ['style'] });
    }
  }

  private syncFaceTogglePosition() {
    if (!this.faceToggleElement) {
      return;
    }

    const rect = this.getBoundingClientRect();
    const top = rect.top - 28;
    const left = rect.left + Math.max(rect.width - this.faceToggleElement.offsetWidth, 0);

    this.faceToggleElement.style.top = `${top}px`;
    this.faceToggleElement.style.left = `${left}px`;
    this.syncControlOverlayPosition();
  }

  private syncFaceToggleState() {
    if (!this.faceToggleElement) {
      return;
    }

    const buttons = Array.from(this.faceToggleElement.querySelectorAll('button'));
    buttons.forEach((button) => {
      const active = button.dataset.mode === this.boardFaceMode;
      button.style.border = `1px solid ${active ? '#ffffff' : '#9fd0a6'}`;
      button.style.background = active ? '#f2f8f2' : '#2f6d3d';
      button.style.color = active ? '#184b28' : '#eef7ee';
    });
  }

  render() {
    const boardFaceHref = this.boardFaceMode === 'photo'
      ? './assets/handysense-real-board.png'
      : './assets/handysense-real-board-alt.svg';

    queueMicrotask(() => {
      this.ensureFaceToggle();
      this.ensureControlOverlay();
      this.syncFaceTogglePosition();
      this.syncControlOverlayPosition();
      this.syncFaceToggleState();
      this.syncControlOverlayState();
    });

    return html`${svg`
      <svg width="63mm" height="74mm" version="1.1" viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg">
        <image
          href="${boardFaceHref}"
          x="0"
          y="0"
          width="240"
          height="280"
          preserveAspectRatio="none"
        />
        ${HANDYSENSE_REAL_LED_GEOMETRY.map((led, index) => {
          const isOn = this.ledState[index];
          return svg`
            <g pointer-events="none" aria-label="${led.label}">
              <circle
                cx="${led.x}"
                cy="${led.y}"
                r="3.2"
                fill="${isOn ? '#fff06a' : '#38443a'}"
                stroke="${isOn ? '#ffde38' : '#80907f'}"
                stroke-width="0.8"
                opacity="${isOn ? '1' : '0.78'}"
              />
              <circle
                cx="${led.x}"
                cy="${led.y}"
                r="${isOn ? 5.8 : 4.7}"
                fill="${isOn ? '#fff06a' : '#263529'}"
                opacity="${isOn ? '0.34' : '0.22'}"
              />
              <text
                x="${led.x}"
                y="${led.y - 5.8}"
                text-anchor="middle"
                font-size="3.2"
                font-family="Arial, sans-serif"
                font-weight="700"
                fill="${isOn ? '#fff8a8' : '#c8d2c6'}"
                paint-order="stroke"
                stroke="#122016"
                stroke-width="0.7"
              >${index}</text>
            </g>
          `;
        })}
        ${(() => {
          const labels = HANDYSENSE_REAL_PIN_INFO.map((pin) => {
          const displayLabel = pinDisplayLabel(pin.name);
          const placement = labelPos(pin);
          const isVertical = placement.orientation === 'vertical';
          const horizontalWidth = pinLabelWidth(displayLabel, isVertical);
          const rectWidth = isVertical ? PIN_LABEL_VERTICAL_WIDTH : horizontalWidth;
          const rectHeight = isVertical ? horizontalWidth : PIN_LABEL_HEIGHT;
          const rectX = isVertical
            ? placement.x - (rectWidth / 2)
            : placement.anchor === 'start'
              ? placement.x - PIN_LABEL_PADDING_X
              : placement.x - horizontalWidth + PIN_LABEL_PADDING_X;
          const rectY = isVertical
            ? placement.y - (rectHeight / 2)
            : placement.y - 2.1;
          const textAnchor = isVertical
            ? 'middle'
            : (placement.anchor === 'start' ? 'start' : 'end');
          const textTransform = isVertical
            ? `rotate(${placement.rotation} ${placement.x} ${placement.y})`
            : undefined;
          return { pin, displayLabel, placement, rectX, rectY, rectWidth, rectHeight, textAnchor, textTransform };
          });

          const groupBounds = new Map<string, { minX: number; minY: number; maxX: number; maxY: number }>();
          for (const label of labels) {
            const key = pinLabelGroupKey(label.pin.name);
            const current = groupBounds.get(key);
            const minX = label.rectX;
            const minY = label.rectY;
            const maxX = label.rectX + label.rectWidth;
            const maxY = label.rectY + label.rectHeight;
            if (!current) {
              groupBounds.set(key, { minX, minY, maxX, maxY });
            } else {
              current.minX = Math.min(current.minX, minX);
              current.minY = Math.min(current.minY, minY);
              current.maxX = Math.max(current.maxX, maxX);
              current.maxY = Math.max(current.maxY, maxY);
            }
          }

          const groupBoxes = Array.from(groupBounds.values()).map((bounds) => {
            const padding = 0.45;
            return svg`
              <rect
                x="${bounds.minX - padding}"
                y="${bounds.minY - padding}"
                width="${(bounds.maxX - bounds.minX) + (padding * 2)}"
                height="${(bounds.maxY - bounds.minY) + (padding * 2)}"
                rx="1.4"
                ry="1.4"
                fill="#000"
              />
            `;
          });

          const texts = labels.map((label) => svg`
            <text
              x="${label.placement.x}"
              y="${label.placement.y}"
              text-anchor="${label.textAnchor}"
              dominant-baseline="middle"
              font-size="${PIN_LABEL_TEXT_SIZE}"
              font-family="Arial, sans-serif"
              font-weight="700"
              fill="#fff"
              transform="${label.textTransform || ''}"
            >${label.displayLabel}</text>
          `);

          return svg`
            <g pointer-events="none" aria-hidden="true">
              ${groupBoxes}
              ${texts}
              ${standaloneOverlayLabelBoxes()}
              ${standaloneConnectorNameBoxes()}
              ${standaloneRelayNameBoxes()}
            </g>
          `;
        })()}
      </svg>
    `}`;
  }
}

customElements.define('handysense-real-board', HandysenseRealBoardElement);
