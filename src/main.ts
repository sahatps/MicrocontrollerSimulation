import "./ui/css.styl"
import * as avr8js from 'avr8js';
import '@wokwi/elements';
import {LEDElement} from "@wokwi/elements";
import {Catalog} from "./panels/catalog";
import {EmulatorManager} from "./emulator/emulator-manager";

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

                            // Check if connected to Arduino
                            if (otherElement?.constructor.name === 'ArduinoUnoElement') {
                                const pinName = otherPort.getLocator().portId;
                                console.log(`[updateLEDs] LED connected to Arduino pin ${pinName}`);

                                // Check if this pin is in our pin map
                                if (pinMap[pinName] !== undefined) {
                                    const pinState = port.pinState(pinMap[pinName]);
                                    const isHigh = pinState === avr8js.PinState.High;
                                    console.log(`[updateLEDs] Pin ${pinName} state: ${pinState} (${isHigh ? 'HIGH' : 'LOW'}), setting LED to ${isHigh}`);
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
}
