import {ComponentFigure} from "./component-figure";
import {Canvas} from "./canvas";

export class CodeGenerator {

    private canvas: Canvas;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
    }

    /**
     * Generate Arduino code based on the current circuit on the canvas
     */
    public generateCode(): string {
        const figures = this.canvas.getFigures();
        const connections = this.canvas.getLines();

        // Analyze components and connections
        const components = this.analyzeComponents(figures);
        const wiring = this.analyzeConnections(connections, components);

        // Generate code sections
        const defines = this.generateDefines(wiring);
        const setup = this.generateSetup(wiring);
        const loop = this.generateLoop(wiring);

        return this.assembleCode(defines, setup, loop);
    }

    private analyzeComponents(figures: any): Map<string, ComponentInfo> {
        const components = new Map<string, ComponentInfo>();

        figures.each((_index: number, figure: any) => {
            if (figure instanceof ComponentFigure) {
                const element = figure.componentElement;
                const elementName = element.constructor.name;

                let componentInfo: ComponentInfo = {
                    id: figure.getId(),
                    type: elementName,
                    ports: this.getPortNames(figure),
                    connections: []
                };

                components.set(figure.getId(), componentInfo);
            }
        });

        return components;
    }

    private getPortNames(figure: ComponentFigure): string[] {
        const ports: string[] = [];
        figure.getPorts().each((_index: number, port: any) => {
            ports.push(port.getName());
        });
        return ports;
    }

    private analyzeConnections(connections: any, components: Map<string, ComponentInfo>): WiringInfo {
        const wiring: WiringInfo = {
            leds: [],
            buttons: [],
            other: []
        };

        connections.each((_index: number, connection: any) => {
            const source = connection.getSource();
            const target = connection.getTarget();

            if (!source || !target) return;

            const sourceFigure = source.getParent();
            const targetFigure = target.getParent();

            if (!sourceFigure || !targetFigure) return;

            const sourceComp = components.get(sourceFigure.getId());
            const targetComp = components.get(targetFigure.getId());

            if (!sourceComp || !targetComp) return;

            // Determine which is Arduino and which is component
            let arduinoPort = '';
            let componentType = '';
            let componentPort = '';

            if (sourceComp.type === 'ArduinoUnoElement') {
                arduinoPort = source.getName();
                componentType = targetComp.type;
                componentPort = target.getName();
            } else if (targetComp.type === 'ArduinoUnoElement') {
                arduinoPort = target.getName();
                componentType = sourceComp.type;
                componentPort = source.getName();
            }

            if (arduinoPort && componentType) {
                const pinNumber = this.extractPinNumber(arduinoPort);

                if (componentType === 'LEDElement') {
                    // Check if this LED is already tracked
                    let led = wiring.leds.find(l => l.anode === pinNumber || l.cathode === pinNumber);
                    if (!led) {
                        led = { anode: -1, cathode: -1, pin: -1 };
                        wiring.leds.push(led);
                    }

                    if (componentPort === 'A') {
                        led.anode = pinNumber;
                        led.pin = pinNumber;
                    } else if (componentPort === 'C') {
                        led.cathode = pinNumber;
                    }
                } else if (componentType === 'PushbuttonElement') {
                    const button = wiring.buttons.find(b => b.pin === pinNumber);
                    if (!button && pinNumber >= 0) {
                        wiring.buttons.push({ pin: pinNumber });
                    }
                }
            }
        });

        // Filter out incomplete LEDs
        wiring.leds = wiring.leds.filter(led => led.pin >= 0);

        return wiring;
    }

    private extractPinNumber(portName: string): number {
        // Extract pin number from port name (e.g., "13" from "13", "A0" from "A0")
        const match = portName.match(/(\d+)/);
        if (match) {
            return parseInt(match[1]);
        }
        // Handle analog pins
        if (portName.startsWith('A')) {
            const analogNum = portName.match(/A(\d+)/);
            if (analogNum) {
                return 14 + parseInt(analogNum[1]); // A0 = 14, A1 = 15, etc.
            }
        }
        return -1;
    }

    private generateDefines(wiring: WiringInfo): string {
        let code = '';

        wiring.leds.forEach((led, index) => {
            code += `#define LED_PIN_${index + 1} ${led.pin}\n`;
        });

        wiring.buttons.forEach((button, index) => {
            code += `#define BUTTON_PIN_${index + 1} ${button.pin}\n`;
        });

        return code;
    }

    private generateSetup(wiring: WiringInfo): string {
        let code = '  // Initialize serial communication\n';
        code += '  Serial.begin(9600);\n\n';

        if (wiring.leds.length > 0) {
            code += '  // Setup LED pins as outputs\n';
            wiring.leds.forEach((_led, index) => {
                code += `  pinMode(LED_PIN_${index + 1}, OUTPUT);\n`;
            });
            code += '\n';
        }

        if (wiring.buttons.length > 0) {
            code += '  // Setup button pins as inputs with pullup\n';
            wiring.buttons.forEach((_button, index) => {
                code += `  pinMode(BUTTON_PIN_${index + 1}, INPUT_PULLUP);\n`;
            });
            code += '\n';
        }

        return code;
    }

    private generateLoop(wiring: WiringInfo): string {
        let code = '';

        if (wiring.leds.length > 0) {
            code += '  // Blink LED example\n';
            wiring.leds.forEach((_led, index) => {
                code += `  digitalWrite(LED_PIN_${index + 1}, HIGH);\n`;
            });
            code += '  delay(1000);\n';
            wiring.leds.forEach((_led, index) => {
                code += `  digitalWrite(LED_PIN_${index + 1}, LOW);\n`;
            });
            code += '  delay(1000);\n\n';
        }

        if (wiring.buttons.length > 0) {
            code += '  // Read button states\n';
            wiring.buttons.forEach((_button, index) => {
                code += `  int button${index + 1}State = digitalRead(BUTTON_PIN_${index + 1});\n`;
                code += `  if (button${index + 1}State == LOW) {\n`;
                code += `    Serial.println("Button ${index + 1} pressed!");\n`;
                code += `  }\n`;
            });
            code += '\n';
        }

        return code;
    }

    private assembleCode(defines: string, setup: string, loop: string): string {
        let code = '// Auto-generated code based on circuit design\n';
        code += '// Modify as needed for your specific application\n\n';

        if (defines) {
            code += '// Pin definitions\n';
            code += defines + '\n';
        }

        code += 'void setup() {\n';
        code += setup;
        code += '}\n\n';

        code += 'void loop() {\n';
        code += loop;
        code += '}\n';

        return code;
    }
}

interface ComponentInfo {
    id: string;
    type: string;
    ports: string[];
    connections: any[];
}

interface WiringInfo {
    leds: Array<{ anode: number, cathode: number, pin: number }>;
    buttons: Array<{ pin: number }>;
    other: any[];
}
