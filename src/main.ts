import "./ui/css.styl"
import * as avr8js from 'avr8js';
import '@wokwi/elements';
import {LEDElement, ArduinoUnoElement, ESP32DevkitV1Element} from "@wokwi/elements";
import {Catalog} from "./panels/catalog";
import {EmulatorManager} from "./emulator/emulator-manager";
import {MistingPumpElement} from "./components/misting-pump-element";
import {WaterPumpElement} from "./components/water-pump-element";
import {FanElement} from "./components/fan-element";
import {RelayElement} from "./components/relay-element";
import {FourChannelRelayElement} from "./components/four-channel-relay-element";
import {CustomESP32BoardElement} from "./components/custom-esp32-board";
import {resolveHandysensePinNumber} from "./components/handysense-board";
import {HandysenseRealBoardElement} from "./components/handysense-real-board";
import {HandysenseProBoardElement} from "./components/handysense-pro-board";
import {Sht31SensorElement} from "./components/sht31-sensor-element";
import {Bh1750SensorElement} from "./components/bh1750-sensor-element";
import {SoilMoistureSensorElement} from "./components/soil-moisture-sensor-element";
import {Rs485PhSensorElement} from "./components/rs485-ph-sensor-element";
import {Rs485LightSensorElement} from "./components/rs485-light-sensor-element";
import {Rs485RainSensorElement} from "./components/rs485-rain-sensor-element";
import {Rs485WindSpeedSensorElement} from "./components/rs485-wind-speed-sensor-element";
import {Rs485ParSensorElement} from "./components/rs485-par-sensor-element";
import {WeatherSensorHtco2plxElement} from "./components/weather-sensor-htco2plx-element";
import {CurrentLoop420mAElement} from "./components/current-loop-420ma-element";
import {FertilizerPhSensorElement} from "./components/fertilizer-ph-sensor-element";
import {EcSensorElement} from "./components/ec-sensor-element";
import {FertilizerTempSensorElement} from "./components/fertilizer-temp-sensor-element";
import {FourChannelButtonElement} from "./components/four-channel-button-element";

export {AVRRunner} from "./emulator/avr-runner";
export {EmulatorManager} from './emulator/emulator-manager';
import * as compiler from './emulator/compiler';
import {Editor} from "./editor/editor";
import i18next, {TFunction} from "i18next";
import {loadTranslations} from "./ui/i18n/i18n-loader";
export type CompileResult = compiler.CompileResult;

// Draw2D deps
require('webpack-jquery-ui');
require('webpack-jquery-ui/draggable');

export class HackCable {

    public debug: boolean = process.env.NODE_ENV === "development";

    private readonly _emulatorManager: EmulatorManager;
    private readonly _catalog: Catalog;
    private readonly _editor: Editor;
    private readonly HANDYSENSE_RELAY_CONTROL_PINS = [25, 4, 12, 13];
    private readonly esp32PinStates = new Map<number, boolean>();

    constructor(mountDiv: HTMLElement, language = 'en_us'){
        console.log("Mounting HackCable...");

        // Initialize i18n synchronously
        i18next.init({
            lng: language,
            fallbackLng: ['en', 'th'],
            defaultNS: 'common',
            debug: this.debug,
            resources: {}
        });
        loadTranslations();

        // Expose i18next globally for translations
        (window as any).i18next = i18next;

        // Load HTML
        mountDiv.innerHTML = require('./ui/ui.html').default
        mountDiv.classList.add("hackCable-root");

        // Init classes
        this._catalog = new Catalog()
        this._emulatorManager = new EmulatorManager(this);
        this._editor = new Editor();

        // Connect catalog to canvas for click-to-add functionality
        this._catalog.setCanvas(this._editor.canvas);

        // Initialize sidebar toggle functionality
        this.initializeSidebarToggle();

        console.log(i18next.t('wokwiComponents.arduinoUno.description'))
    }
    public changeLanguage(language: string): Promise<TFunction>{
        return i18next.changeLanguage(language)
    }
    public getLanguage() {
        return i18next.language;
    }

    public get emulatorManager(){
        return this._emulatorManager;
    }
    public get catalog(){
        return this._catalog;
    }
    public get editor(){
        return this._editor;
    }

    public serialDataCallback: ((data: string) => void) | null = null;
    public serialDataReceived(data: string) {
        if (this.serialDataCallback) {
            this.serialDataCallback(data);
            return;
        }
        // Fallback bridge for environments where callback wiring is temporarily missing.
        const fallback = (globalThis as any).hackcable_serial_data;
        if (typeof fallback === "function") {
            fallback(data);
        }
    }

    public async simulatedHttpGet(path: string) {
        return this._emulatorManager.httpGet(path);
    }

    private isESP32BoardElement(element: any): boolean {
        return element instanceof ESP32DevkitV1Element
            || element instanceof CustomESP32BoardElement
            || element instanceof HandysenseProBoardElement;
    }

    private parseBoardPinNumber(pinName: string): number | null {
        const handysensePin = resolveHandysensePinNumber(pinName);
        if (handysensePin !== null) return handysensePin;

        const ioMatch = /^IO(\d+)$/.exec(pinName);
        if (ioMatch) return parseInt(ioMatch[1], 10);

        const dMatch = /^D(\d+)$/.exec(pinName);
        if (dMatch) return parseInt(dMatch[1], 10);

        const nMatch = /^(\d+)$/.exec(pinName);
        if (nMatch) return parseInt(nMatch[1], 10);

        return null;
    }

    private getBoardPinConnectedToPort(port: any): number | null {
        const connections = port?.getConnections?.().data ?? [];
        for (const connection of connections) {
            const otherPort = connection.sourcePort === port ? connection.targetPort : connection.sourcePort;
            const otherFigure = otherPort?.getParent();
            const otherElement = otherFigure?.componentElement;
            if (!otherElement || !this.isESP32BoardElement(otherElement)) continue;

            const pinName = otherPort?.getLocator?.().portId ?? '';
            const pinNumber = this.parseBoardPinNumber(pinName);
            if (pinNumber !== null) return pinNumber;
        }
        return null;
    }

    private isActuatorControlPort(element: any, portId: string): boolean {
        if (element instanceof MistingPumpElement ||
            element instanceof WaterPumpElement ||
            element instanceof FanElement) {
            return portId === 'SIG';
        }
        if (element instanceof RelayElement) {
            return portId === 'IN';
        }
        if (element instanceof FourChannelRelayElement) {
            return /^IN[1-4]$/.test(portId);
        }
        return false;
    }

    public getSupportedBoardPins(): number[] {
        const pins = new Set<number>();
        const figures = this._editor.canvas.getAllFigures();
        figures.forEach((figure: any) => {
            const el = figure.componentElement;
            if (!this.isESP32BoardElement(el)) return;
            const pinInfo: any[] = el?.pinInfo || [];
            pinInfo.forEach((pin) => {
                const pinNumber = this.parseBoardPinNumber(pin?.name ?? '');
                if (pinNumber !== null) pins.add(pinNumber);
            });
        });
        return Array.from(pins).sort((a, b) => a - b);
    }

    public getConnectedActuatorControlPins(): number[] {
        const pins = new Set<number>();
        const figures = this._editor.canvas.getAllFigures();
        figures.forEach((figure: any) => {
            const element = figure.componentElement;
            if (!element) return;

            const ports = figure.getPorts().data;
            ports.forEach((figurePort: any) => {
                const portId = figurePort.getLocator()?.portId ?? '';
                if (!this.isActuatorControlPort(element, portId)) return;
                const pinNumber = this.getBoardPinConnectedToPort(figurePort);
                if (pinNumber !== null) pins.add(pinNumber);
            });
        });
        this.getHandySenseRelayLoadPins().forEach((pin) => pins.add(pin));
        return Array.from(pins).sort((a, b) => a - b);
    }

    public hasActuatorControlPin(pin: number): boolean {
        return this.getConnectedActuatorControlPins().includes(pin);
    }

    private readonly HANDYSENSE_REAL_LED_PINS = [2, 5, 18, 19, 21, 22, 23, 27];

    private getPortName(port: any): string {
        return port?.getLocator?.().portId ?? '';
    }

    private getPortParentFigure(port: any): any {
        return port?.getParent?.() ?? null;
    }

    private getPortPinInfo(port: any): any | null {
        const figure = this.getPortParentFigure(port);
        const pinName = this.getPortName(port);
        const pinInfo = figure?.componentElement?.pinInfo;
        if (!Array.isArray(pinInfo)) return null;
        return pinInfo.find((entry: any) => entry?.name === pinName) ?? null;
    }

    private isBoardPowerPort(port: any, signal: 'VCC' | 'GND'): boolean {
        const figure = this.getPortParentFigure(port);
        const element = figure?.componentElement;
        if (!element || !this.isESP32BoardElement(element)) return false;
        const pinInfo = this.getPortPinInfo(port);
        if (!pinInfo || !Array.isArray(pinInfo.signals)) return false;
        return pinInfo.signals.some((entry: any) => entry?.type === 'power' && entry?.signal === signal);
    }

    private isBoardHighSourcePort(port: any): boolean {
        const figure = this.getPortParentFigure(port);
        const element = figure?.componentElement;
        if (!element || !this.isESP32BoardElement(element)) return false;

        const pinNumber = this.parseBoardPinNumber(this.getPortName(port));
        if (pinNumber === null) return false;
        return this.esp32PinStates.get(pinNumber) === true;
    }

    private getPortKey(port: any): string {
        const figure = this.getPortParentFigure(port);
        const figureId = figure?.getId?.() ?? 'unknown';
        return `${figureId}:${this.getPortName(port)}`;
    }

    private getWireNeighbors(port: any): any[] {
        return (port?.getConnections?.().data ?? [])
            .map((connection: any) => connection.sourcePort === port ? connection.targetPort : connection.sourcePort)
            .filter((neighbor: any) => !!neighbor);
    }

    private getSwitchedRelayNeighbors(port: any): any[] {
        const figure = this.getPortParentFigure(port);
        const element = figure?.componentElement;

        if (element instanceof HandysenseProBoardElement) {
            const match = /^R([1-4])_(COM|NC|NO)$/.exec(this.getPortName(port));
            if (!match) return [];

            const relayIndex = parseInt(match[1], 10) - 1;
            const relayPin = this.HANDYSENSE_RELAY_CONTROL_PINS[relayIndex];
            const relayOn = this.esp32PinStates.get(relayPin) === true;
            const suffix = match[2];
            const linkedPortName = relayOn
                ? (suffix === 'COM' ? `R${relayIndex + 1}_NO` : suffix === 'NO' ? `R${relayIndex + 1}_COM` : '')
                : (suffix === 'COM' ? `R${relayIndex + 1}_NC` : suffix === 'NC' ? `R${relayIndex + 1}_COM` : '');

            if (!linkedPortName) return [];
            const linkedPort = figure.getPortByName?.(linkedPortName);
            return linkedPort ? [linkedPort] : [];
        }

        if (element instanceof RelayElement) {
            const suffix = this.getPortName(port);
            if (!['COM', 'NC', 'NO'].includes(suffix)) return [];

            const relayOn = element.isOn === true;
            const linkedPortName = relayOn
                ? (suffix === 'COM' ? 'NO' : suffix === 'NO' ? 'COM' : '')
                : (suffix === 'COM' ? 'NC' : suffix === 'NC' ? 'COM' : '');

            if (!linkedPortName) return [];
            const linkedPort = figure.getPortByName?.(linkedPortName);
            return linkedPort ? [linkedPort] : [];
        }

        if (element instanceof FourChannelRelayElement) {
            const match = /^R([1-4])_(COM|NC|NO)$/.exec(this.getPortName(port));
            if (!match) return [];

            const relayIndex = parseInt(match[1], 10);
            const relayOn = relayIndex === 1 ? element.ch1
                : relayIndex === 2 ? element.ch2
                : relayIndex === 3 ? element.ch3
                : element.ch4;
            const suffix = match[2];
            const linkedPortName = relayOn
                ? (suffix === 'COM' ? `R${relayIndex}_NO` : suffix === 'NO' ? `R${relayIndex}_COM` : '')
                : (suffix === 'COM' ? `R${relayIndex}_NC` : suffix === 'NC' ? `R${relayIndex}_COM` : '');

            if (!linkedPortName) return [];
            const linkedPort = figure.getPortByName?.(linkedPortName);
            return linkedPort ? [linkedPort] : [];
        }

        return [];
    }

    private collectElectricallyConnectedPorts(startPort: any): any[] {
        if (!startPort) return [];

        const visited = new Set<string>();
        const queue: any[] = [startPort];
        const connected: any[] = [];

        while (queue.length > 0) {
            const port = queue.shift();
            if (!port) continue;

            const key = this.getPortKey(port);
            if (visited.has(key)) continue;
            visited.add(key);
            connected.push(port);

            const neighbors = [
                ...this.getWireNeighbors(port),
                ...this.getSwitchedRelayNeighbors(port),
            ];
            neighbors.forEach((neighbor) => {
                const neighborKey = this.getPortKey(neighbor);
                if (!visited.has(neighborKey)) queue.push(neighbor);
            });
        }

        return connected;
    }

    private portHasActiveSource(port: any): boolean {
        return this.collectElectricallyConnectedPorts(port).some((candidate) => {
            return this.isBoardPowerPort(candidate, 'VCC') || this.isBoardHighSourcePort(candidate);
        });
    }

    private portHasGround(port: any): boolean {
        return this.collectElectricallyConnectedPorts(port).some((candidate) => {
            return this.isBoardPowerPort(candidate, 'GND');
        });
    }

    private getHandySenseRelayLoadPins(): number[] {
        const pins = new Set<number>();
        const figures = this._editor.canvas.getAllFigures();

        figures.forEach((figure: any) => {
            const element = figure.componentElement;
            if (!(element instanceof HandysenseProBoardElement)) return;

            this.HANDYSENSE_RELAY_CONTROL_PINS.forEach((pin, index) => {
                const relayPorts = ['COM', 'NC', 'NO']
                    .map((suffix) => figure.getPortByName?.(`R${index + 1}_${suffix}`))
                    .filter((port: any) => !!port);

                if (relayPorts.some((port: any) => (port.getConnections?.().data ?? []).length > 0)) {
                    pins.add(pin);
                }
            });
        });

        return Array.from(pins);
    }

    private syncHandySenseRelayVisuals(): void {
        const figures = this._editor.canvas.getAllFigures();
        figures.forEach((figure: any) => {
            const element = figure.componentElement;
            if (!(element instanceof HandysenseProBoardElement)) return;

            element.relay1On = this.esp32PinStates.get(25) === true;
            element.relay2On = this.esp32PinStates.get(4) === true;
            element.relay3On = this.esp32PinStates.get(12) === true;
            element.relay4On = this.esp32PinStates.get(13) === true;
            element.requestUpdate();
        });
    }

    private syncHandySenseRealLedVisuals(): void {
        const figures = this._editor.canvas.getAllFigures();
        figures.forEach((figure: any) => {
            const element = figure.componentElement;
            if (!(element instanceof HandysenseRealBoardElement)) return;

            this.HANDYSENSE_REAL_LED_PINS.forEach((pin, index) => {
                element.setLedState(index, this.esp32PinStates.get(pin) === true);
            });
        });
    }

    private updateRelayComponentStates(): void {
        const figures = this._editor.canvas.getAllFigures();
        figures.forEach((figure: any) => {
            const element = figure.componentElement;
            if (!element) return;

            if (element instanceof RelayElement) {
                const inPort = figure.getPortByName?.('IN');
                const nextValue = Boolean(inPort && this.portHasActiveSource(inPort));
                if (element.isOn !== nextValue) {
                    element.isOn = nextValue;
                    element.requestUpdate();
                }
                return;
            }

            if (element instanceof FourChannelRelayElement) {
                const nextCh1 = Boolean(figure.getPortByName?.('IN1') && this.portHasActiveSource(figure.getPortByName('IN1')));
                const nextCh2 = Boolean(figure.getPortByName?.('IN2') && this.portHasActiveSource(figure.getPortByName('IN2')));
                const nextCh3 = Boolean(figure.getPortByName?.('IN3') && this.portHasActiveSource(figure.getPortByName('IN3')));
                const nextCh4 = Boolean(figure.getPortByName?.('IN4') && this.portHasActiveSource(figure.getPortByName('IN4')));

                if (element.ch1 !== nextCh1 || element.ch2 !== nextCh2 || element.ch3 !== nextCh3 || element.ch4 !== nextCh4) {
                    element.ch1 = nextCh1;
                    element.ch2 = nextCh2;
                    element.ch3 = nextCh3;
                    element.ch4 = nextCh4;
                    element.requestUpdate();
                }
            }
        });
    }

    private recomputeESP32DrivenComponents(): void {
        this.syncHandySenseRelayVisuals();
        this.syncHandySenseRealLedVisuals();
        this.updateRelayComponentStates();

        const figures = this._editor.canvas.getAllFigures();
        figures.forEach((figure: any) => {
            const element = figure.componentElement;
            if (!element) return;

            if (element instanceof LEDElement) {
                const anodePort = figure.getPortByName?.('A');
                const cathodePort = figure.getPortByName?.('C');
                const nextValue = Boolean(
                    (anodePort && this.portHasActiveSource(anodePort) && (!cathodePort || this.portHasGround(cathodePort))) ||
                    (anodePort && this.isBoardHighSourcePort(anodePort)) ||
                    (cathodePort && this.isBoardHighSourcePort(cathodePort))
                );

                if (element.value !== nextValue) {
                    element.value = nextValue;
                    element.requestUpdate();
                }
                return;
            }

            if (element instanceof MistingPumpElement ||
                element instanceof WaterPumpElement ||
                element instanceof FanElement) {
                const sigPort = figure.getPortByName?.('SIG');
                const nextValue = Boolean(sigPort && this.portHasActiveSource(sigPort));
                if (element.isOn !== nextValue || element.ledPower !== nextValue) {
                    element.isOn = nextValue;
                    element.ledPower = nextValue;
                    element.requestUpdate();
                }
                return;
            }
        });
    }

    private updateLEDs(port: avr8js.AVRIOPort, pinMap: {[key: string]: number}) {
        // Update all LED elements on the canvas based on pin states
        const figures = this._editor.canvas.getAllFigures();
        console.log(`[updateLEDs] Found ${figures.length} figures on canvas`);

        figures.forEach(figure => {
            const element = figure.componentElement;

            // Check if this is an LED element
            if (element instanceof LEDElement) {
                console.log('[updateLEDs] Found LED element');
                // Find which Arduino pin this LED is connected to
                const connections = figure.getPorts().data;

                connections.forEach((figurePort: any) => {
                    const portConnections = figurePort.getConnections().data;

                    portConnections.forEach((connection: any) => {
                        const otherPort = connection.sourcePort === figurePort ? connection.targetPort : connection.sourcePort;
                        const otherFigure = otherPort?.getParent();

                        if (otherFigure) {
                            const otherElement = otherFigure.componentElement;

                            // Check if connected to Arduino or ESP32
                            if (otherElement instanceof ArduinoUnoElement ||
                                otherElement instanceof ESP32DevkitV1Element ||
                                otherElement instanceof CustomESP32BoardElement ||
                                otherElement instanceof HandysenseProBoardElement) {
                                const pinName = otherPort.getLocator().portId;
                                const boardType = (otherElement instanceof ESP32DevkitV1Element ||
                                                   otherElement instanceof CustomESP32BoardElement ||
                                                   otherElement instanceof HandysenseProBoardElement) ? 'ESP32' : 'Arduino';
                                console.log(`[updateLEDs] LED connected to ${boardType} pin ${pinName}`);

                                // For ESP32, convert D-format pins to numbers (e.g., "D2" -> "2")
                                let mappedPinName = pinName;
                                if (boardType === 'ESP32' && pinName.startsWith('D')) {
                                    mappedPinName = pinName.substring(1); // "D2" -> "2"
                                    console.log(`[updateLEDs] ESP32 pin ${pinName} mapped to ${mappedPinName}`);
                                }

                                // Check if this pin is in our pin map
                                if (pinMap[mappedPinName] !== undefined) {
                                    const pinState = port.pinState(pinMap[mappedPinName]);
                                    const isHigh = pinState === avr8js.PinState.High;
                                    console.log(`[updateLEDs] Pin ${mappedPinName} state: ${pinState} (${isHigh ? 'HIGH' : 'LOW'}), setting LED to ${isHigh}`);
                                    element.value = isHigh;
                                }
                            }
                        }
                    });
                });
            }
        });
    }

    public portBUpdate(portB: avr8js.AVRIOPort) {
        console.log('[portBUpdate] Port B update triggered');
        // Port B pin mapping for Arduino Uno
        // Pin 8 = PB0, Pin 9 = PB1, Pin 10 = PB2, Pin 11 = PB3, Pin 12 = PB4, Pin 13 = PB5
        const pinMap: {[key: string]: number} = {
            '8': 0,
            '9': 1,
            '10': 2,
            '11': 3,
            '12': 4,
            '13': 5
        };
        this.updateLEDs(portB, pinMap);
    }

    public portCUpdate(portC: avr8js.AVRIOPort) {
        console.log('[portCUpdate] Port C update triggered');
        // Port C pin mapping for Arduino Uno (Analog pins A0-A5)
        // A0 = PC0, A1 = PC1, A2 = PC2, A3 = PC3, A4 = PC4, A5 = PC5
        const pinMap: {[key: string]: number} = {
            'A0': 0,
            'A1': 1,
            'A2': 2,
            'A3': 3,
            'A4': 4,
            'A5': 5
        };
        this.updateLEDs(portC, pinMap);
    }

    public portDUpdate(portD: avr8js.AVRIOPort) {
        console.log('[portDUpdate] Port D update triggered');
        // Port D pin mapping for Arduino Uno
        // Pin 0 = PD0, Pin 1 = PD1, Pin 2 = PD2, Pin 3 = PD3, Pin 4 = PD4, Pin 5 = PD5, Pin 6 = PD6, Pin 7 = PD7
        const pinMap: {[key: string]: number} = {
            '0': 0,
            '1': 1,
            '2': 2,
            '3': 3,
            '4': 4,
            '5': 5,
            '6': 6,
            '7': 7
        };
        this.updateLEDs(portD, pinMap);
    }

    public esp32PinUpdate(pin: number, value: boolean) {
        console.log(`[esp32PinUpdate] ESP32 Pin ${pin} update triggered, value: ${value}`);
        this.esp32PinStates.set(pin, value);
        this.recomputeESP32DrivenComponents();
    }

    private readonly BFARM_SENSOR_TYPES = [
        Sht31SensorElement, Bh1750SensorElement, SoilMoistureSensorElement,
        Rs485PhSensorElement, Rs485LightSensorElement, Rs485RainSensorElement,
        Rs485WindSpeedSensorElement, Rs485ParSensorElement,
        WeatherSensorHtco2plxElement, CurrentLoop420mAElement,
        FertilizerPhSensorElement, EcSensorElement,
        FertilizerTempSensorElement, FourChannelButtonElement,
    ];

    public activateSensorComponent(busType: string, pin1: number, pin2: number) {
        console.log(`[activateSensorComponent] busType=${busType} pin1=${pin1} pin2=${pin2}`);
        const figures = this._editor.canvas.getAllFigures();
        figures.forEach(figure => {
            const element = figure.componentElement;
            const isSensor = this.BFARM_SENSOR_TYPES.some(T => element instanceof T);
            if (!isSensor) return;

            // Check if any port on this sensor connects to the board on a matching pin
            const ports = figure.getPorts().data;
            let matched = false;
            ports.forEach((figurePort: any) => {
                figurePort.getConnections().data.forEach((conn: any) => {
                    const otherPort = conn.sourcePort === figurePort ? conn.targetPort : conn.sourcePort;
                    const otherFigure = otherPort?.getParent();
                    if (!otherFigure) return;
                    const otherEl = otherFigure.componentElement;
                    if (!(otherEl instanceof ESP32DevkitV1Element ||
                          otherEl instanceof CustomESP32BoardElement ||
                          otherEl instanceof HandysenseProBoardElement)) return;
                    const pinName: string = otherPort.getLocator().portId;
                    const pinNumber = this.parseBoardPinNumber(pinName) ?? -1;
                    if (pinNumber === pin1 || pinNumber === pin2) matched = true;
                });
            });

            if (matched) {
                (element as any).isOn = true;
                element.requestUpdate();
                console.log(`[activateSensorComponent] Activated ${element.constructor.name}`);
            }
        });
    }

    public deactivateAllSensors() {
        const figures = this._editor.canvas.getAllFigures();
        figures.forEach(figure => {
            const element = figure.componentElement;
            const isSensor = this.BFARM_SENSOR_TYPES.some(T => element instanceof T);
            if (isSensor && (element as any).isOn !== undefined) {
                (element as any).isOn = false;
                element.requestUpdate();
            }
        });
    }

    public deactivateAllActuators() {
        this.esp32PinStates.clear();
        const figures = this._editor.canvas.getAllFigures();
        figures.forEach((figure: any) => {
            const element = figure.componentElement;
            if (!element) return;

            if (element instanceof MistingPumpElement ||
                element instanceof WaterPumpElement ||
                element instanceof FanElement) {
                element.isOn = false;
                element.ledPower = false;
                element.requestUpdate();
                return;
            }

            if (element instanceof RelayElement) {
                element.isOn = false;
                element.requestUpdate();
                return;
            }

            if (element instanceof FourChannelRelayElement) {
                element.ch1 = false;
                element.ch2 = false;
                element.ch3 = false;
                element.ch4 = false;
                element.requestUpdate();
                return;
            }

            if (element instanceof HandysenseProBoardElement) {
                element.relay1On = false;
                element.relay2On = false;
                element.relay3On = false;
                element.relay4On = false;
                if (element instanceof HandysenseRealBoardElement) {
                    this.HANDYSENSE_REAL_LED_PINS.forEach((_pin, index) => element.setLedState(index, false));
                }
                element.requestUpdate();
            }
        });
    }

    private initializeSidebarToggle() {
        const bar = document.querySelector('.hackCable-catalog-bar') as HTMLElement;
        const toggleBtn = document.querySelector('.hackCable-toggle-catalog') as HTMLButtonElement;

        if (!bar || !toggleBtn) {
            console.warn('[HackCable] Unable to find catalog bar or toggle button');
            return;
        }

        // Always start with catalog visible by default.
        bar.classList.remove('hidden');
        toggleBtn.classList.add('active');
        localStorage.setItem('hackCable-catalog-visible', 'true');

        // Handle toggle button click
        toggleBtn.addEventListener('click', () => {
            const isNowHidden = bar.classList.toggle('hidden');
            toggleBtn.classList.toggle('active', !isNowHidden);
            localStorage.setItem('hackCable-catalog-visible', (!isNowHidden).toString());
        });
    }
}
