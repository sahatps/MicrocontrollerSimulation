import "./ui/css.styl"
import * as avr8js from 'avr8js';
import '@wokwi/elements';
import {LEDElement} from "@wokwi/elements";
import {Catalog} from "./panels/catalog";
import {EmulatorManager} from "./emulator/emulator-manager";
import {MistingPumpElement} from "./components/misting-pump-element";
import {WaterPumpElement} from "./components/water-pump-element";
import {FanElement} from "./components/fan-element";

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
                            if (otherElement?.constructor.name === 'ArduinoUnoElement' ||
                                otherElement?.constructor.name === 'ESP32DevkitV1Element' ||
                                otherElement?.constructor.name === 'CustomESP32BoardElement' ||
                                otherElement?.constructor.name === 'HandysenseProBoardElement') {
                                const pinName = otherPort.getLocator().portId;
                                const boardType = (otherElement?.constructor.name === 'ESP32DevkitV1Element' ||
                                                   otherElement?.constructor.name === 'CustomESP32BoardElement' ||
                                                   otherElement?.constructor.name === 'HandysenseProBoardElement') ? 'ESP32' : 'Arduino';
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

        figures.forEach(figure => {
            const element = figure.componentElement;

            // Check if this is an LED element
            if (element instanceof LEDElement) {
                console.log('[esp32PinUpdate] Found LED element');
                // Find which ESP32 pin this LED is connected to
                const connections = figure.getPorts().data;

                connections.forEach((figurePort: any) => {
                    const portConnections = figurePort.getConnections().data;

                    portConnections.forEach((connection: any) => {
                        const otherPort = connection.sourcePort === figurePort ? connection.targetPort : connection.sourcePort;
                        const otherFigure = otherPort?.getParent();

                        if (otherFigure) {
                            const otherElement = otherFigure.componentElement;

                            // Check if connected to ESP32
                            if (otherElement?.constructor.name === 'ESP32DevkitV1Element' ||
                                otherElement?.constructor.name === 'CustomESP32BoardElement' ||
                                otherElement?.constructor.name === 'HandysenseProBoardElement') {
                                const pinName = otherPort.getLocator().portId;
                                console.log(`[esp32PinUpdate] LED connected to ESP32 pin ${pinName}`);

                                // Convert D-format pins to numbers (e.g., "D2" -> 2)
                                let pinNumber = -1;
                                if (pinName.startsWith('D')) {
                                    pinNumber = parseInt(pinName.substring(1));
                                } else if (!isNaN(parseInt(pinName))) {
                                    pinNumber = parseInt(pinName);
                                }

                                console.log(`[esp32PinUpdate] Comparing pin ${pinNumber} with ${pin}`);

                                // Check if this is the pin that changed
                                if (pinNumber === pin) {
                                    console.log(`[esp32PinUpdate] Updating LED on pin ${pin} to ${value}`);
                                    element.value = value;
                                    element.requestUpdate();
                                }
                            }
                        }
                    });
                });
            }

            // Check if this is an actuator element (Misting Pump, Water Pump, or Fan)
            if (element instanceof MistingPumpElement ||
                element instanceof WaterPumpElement ||
                element instanceof FanElement) {
                const actuatorType = element.constructor.name;
                console.log(`[esp32PinUpdate] Found ${actuatorType}`);

                // Find which ESP32 pin this actuator is connected to
                const connections = figure.getPorts().data;

                connections.forEach((figurePort: any) => {
                    const portConnections = figurePort.getConnections().data;

                    portConnections.forEach((connection: any) => {
                        const otherPort = connection.sourcePort === figurePort ? connection.targetPort : connection.sourcePort;
                        const otherFigure = otherPort?.getParent();

                        if (otherFigure) {
                            const otherElement = otherFigure.componentElement;

                            // Check if connected to ESP32
                            if (otherElement?.constructor.name === 'ESP32DevkitV1Element' ||
                                otherElement?.constructor.name === 'CustomESP32BoardElement' ||
                                otherElement?.constructor.name === 'HandysenseProBoardElement') {
                                const pinName = otherPort.getLocator().portId;
                                console.log(`[esp32PinUpdate] ${actuatorType} connected to ESP32 pin ${pinName}`);

                                // Convert pin formats to numbers
                                let pinNumber = -1;
                                if (pinName.startsWith('D')) {
                                    pinNumber = parseInt(pinName.substring(1));
                                } else if (pinName.startsWith('IO')) {
                                    pinNumber = parseInt(pinName.substring(2));
                                } else if (!isNaN(parseInt(pinName))) {
                                    pinNumber = parseInt(pinName);
                                }

                                console.log(`[esp32PinUpdate] Comparing pin ${pinNumber} with ${pin}`);

                                // Check if this is the pin that changed
                                if (pinNumber === pin) {
                                    console.log(`[esp32PinUpdate] Updating ${actuatorType} on pin ${pin} to ${value}`);
                                    element.isOn = value;
                                    element.ledPower = value;
                                    element.requestUpdate();
                                }
                            }
                        }
                    });
                });
            }
        });
    }

    private initializeSidebarToggle() {
        const sideBar = document.querySelector('.hackCable-sideBar') as HTMLElement;
        const toggleBtn = document.querySelector('.hackCable-toggle-sidebar') as HTMLButtonElement;

        if (!sideBar || !toggleBtn) {
            console.warn('[HackCable] Unable to find sidebar or toggle button');
            return;
        }

        // Load saved state from localStorage
        const isSideBarHidden = localStorage.getItem('hackCable-sidebar-hidden') === 'true';
        if (isSideBarHidden) {
            sideBar.classList.add('hidden');
            toggleBtn.classList.add('sidebar-hidden');
        }

        // Handle toggle button click
        toggleBtn.addEventListener('click', () => {
            sideBar.classList.toggle('hidden');
            toggleBtn.classList.toggle('sidebar-hidden');

            // Save state to localStorage
            const isNowHidden = sideBar.classList.contains('hidden');
            localStorage.setItem('hackCable-sidebar-hidden', isNowHidden.toString());
        });
    }
}
