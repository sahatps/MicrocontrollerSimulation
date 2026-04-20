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
        return Array.from(pins).sort((a, b) => a - b);
    }

    public hasActuatorControlPin(pin: number): boolean {
        return this.getConnectedActuatorControlPins().includes(pin);
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

        // Update all LED elements on the canvas based on ESP32 pin states
        const figures = this._editor.canvas.getAllFigures();
        console.log(`[esp32PinUpdate] Found ${figures.length} figures on canvas`);

        figures.forEach((figure: any) => {
            const element = figure.componentElement;
            if (!element) return;

            // LEDs: any board pin match can drive state.
            if (element instanceof LEDElement) {
                const ports = figure.getPorts().data;
                ports.forEach((figurePort: any) => {
                    const pinNumber = this.getBoardPinConnectedToPort(figurePort);
                    if (pinNumber === pin) {
                        element.value = value;
                        element.requestUpdate();
                    }
                });
            }

            // Actuators: strict control-port matching only.
            if (element instanceof MistingPumpElement ||
                element instanceof WaterPumpElement ||
                element instanceof FanElement) {
                const ports = figure.getPorts().data;
                ports.forEach((figurePort: any) => {
                    const portId = figurePort.getLocator()?.portId ?? '';
                    if (portId !== 'SIG') return;
                    const pinNumber = this.getBoardPinConnectedToPort(figurePort);
                    if (pinNumber === pin) {
                        element.isOn = value;
                        element.ledPower = value;
                        element.requestUpdate();
                    }
                });
            }

            if (element instanceof FourChannelRelayElement) {
                const ports = figure.getPorts().data;
                ports.forEach((figurePort: any) => {
                    const portId = figurePort.getLocator()?.portId ?? '';
                    if (!/^IN[1-4]$/.test(portId)) return;
                    const pinNumber = this.getBoardPinConnectedToPort(figurePort);
                    if (pinNumber !== pin) return;

                    if (portId === 'IN1') element.ch1 = value;
                    else if (portId === 'IN2') element.ch2 = value;
                    else if (portId === 'IN3') element.ch3 = value;
                    else if (portId === 'IN4') element.ch4 = value;
                    element.requestUpdate();
                });
            }

            if (element instanceof RelayElement) {
                const ports = figure.getPorts().data;
                ports.forEach((figurePort: any) => {
                    const portId = figurePort.getLocator()?.portId ?? '';
                    if (portId !== 'IN') return;
                    const pinNumber = this.getBoardPinConnectedToPort(figurePort);
                    if (pinNumber === pin) {
                        element.isOn = value;
                        element.requestUpdate();
                    }
                });
            }
        });
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
                    let pinNumber = -1;
                    if (pinName.startsWith('IO')) pinNumber = parseInt(pinName.substring(2));
                    else if (pinName.startsWith('D')) pinNumber = parseInt(pinName.substring(1));
                    else if (!isNaN(parseInt(pinName))) pinNumber = parseInt(pinName);
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
