import {AVRRunner} from "./avr-runner";
import {CompileResult, compileToHex} from "./compiler";
import {HackCable} from "../main";
import {MicroPythonRunner} from "./micropython-runner";

export class EmulatorManager{

    private readonly hackcable: HackCable;
    constructor(hackcable: HackCable) {
        this.hackcable = hackcable;
    }

    private runner: AVRRunner | undefined;
    private loadingRunner: AVRRunner | undefined;
    private micropythonRunner: MicroPythonRunner | undefined;
    private boardType: 'arduino' | 'esp32' = 'arduino';

    // Context for C++ to Python conversion
    private currentConversionContext: {
        constants: Map<string, number>;
        outputPins: Map<number, string>;
        inputPins: Map<number, string>;
        analogPins: Map<number, string>;
        pinNameToNum: Map<string, number>;
        constantNames: Map<string, number>;
    } | null = null;


    static async compileCode(code: string): Promise<CompileResult>{
        return compileToHex(code);
    }

    setBoardType(type: 'arduino' | 'esp32') {
        this.boardType = type;
        console.log('[EmulatorManager] Board type set to:', type);
    }

    async compileAndLoadCode(code: string): Promise<CompileResult>{
        if (this.boardType === 'esp32') {
            // For ESP32, we don't compile - we run MicroPython directly
            console.log('[EmulatorManager] Loading MicroPython code for ESP32');
            return { hex: '', stdout: '', stderr: '' };
        } else {
            const data = await compileToHex(code);
            console.log(data)
            this.loadCode(data.hex);
            return data;
        }
    }

    loadCode(hexCode: string){
        this.loadingRunner = new AVRRunner(hexCode.replace(/\n\n/g, "\n"));
    }

    async run(code?: string){
        console.log('[EmulatorManager] Starting execution...');
        console.log('[EmulatorManager] Board type:', this.boardType);

        if (this.boardType === 'esp32') {
            // Run MicroPython for ESP32
            if (!this.micropythonRunner) {
                this.micropythonRunner = new MicroPythonRunner();
                await this.micropythonRunner.initialize();
            }

            if (code) {
                console.log('[EmulatorManager] Running MicroPython code...');
                this.setupESP32Hardware();

                // Convert Arduino-style code to MicroPython if needed
                const pythonCode = this.convertToPython(code);
                console.log('[EmulatorManager] Converted code:', pythonCode);

                try {
                    await this.micropythonRunner.runCode(pythonCode);
                    console.log('[EmulatorManager] MicroPython execution started');
                } catch (error) {
                    console.error('[EmulatorManager] MicroPython error:', error);
                }
            }
        } else {
            // Run AVR for Arduino
            this.stop();
            this.runner = this.loadingRunner;
            console.log('[EmulatorManager] Runner loaded:', this.runner ? 'YES' : 'NO');
            this.setupHardware();
            // Callback called every 500 000 cpu cycles
            this.runner?.execute(() => {});
            console.log('[EmulatorManager] Execution started');
        }
    }

    private convertToPython(code: string): string {
        // Line-by-line C++ to MicroPython converter with brace tracking for nested blocks

        // Check if it's already Python code
        if (code.includes('from machine import') || code.includes('import machine')) {
            return code;
        }

        // Try to extract setup and loop sections
        const setupMatch = code.match(/void\s+setup\s*\(\s*\)\s*\{([\s\S]*?)\n\}/);
        const loopMatch = code.match(/void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)\n\}/);

        if (!setupMatch && !loopMatch) {
            // Not Arduino code, return as-is
            return code;
        }

        // Extract all constant definitions: const int NAME = value; or #define NAME value
        const constants = new Map<string, number>();

        // Match #define statements
        const defineMatches = code.matchAll(/#define\s+([A-Z_][A-Z0-9_]*)\s+(\d+)/g);
        for (const match of defineMatches) {
            constants.set(match[1], parseInt(match[2]));
        }

        // Match const int/float declarations
        const constMatches = code.matchAll(/const\s+(?:int|float|double)\s+([A-Z_][A-Z0-9_]*)\s*=\s*([\d.]+)/g);
        for (const match of constMatches) {
            constants.set(match[1], parseFloat(match[2]));
        }

        // Check if code uses analogRead (need ADC import)
        const usesAnalog = code.includes('analogRead');

        let pythonCode = usesAnalog
            ? 'from machine import Pin, ADC\nimport time\n\n'
            : 'from machine import Pin\nimport time\n\n';

        // Add Python constants for thresholds and other values
        constants.forEach((value, name) => {
            // Skip pin definitions - they'll be used directly
            if (!name.endsWith('_PIN')) {
                pythonCode += `${name} = ${value}\n`;
            }
        });
        if (constants.size > 0) {
            pythonCode += '\n';
        }

        // Extract OUTPUT pinMode calls (for LEDs, actuators, relays)
        // Match both named constants and numeric values
        const outputPinMatches = code.matchAll(/pinMode\s*\(\s*([A-Z_][A-Z0-9_]*|\d+)\s*,\s*OUTPUT\s*\)/g);
        const outputPins: Array<{name: string, num: number}> = [];
        for (const match of outputPinMatches) {
            const pinRef = match[1];
            if (/^\d+$/.test(pinRef)) {
                outputPins.push({name: `pin${pinRef}`, num: parseInt(pinRef)});
            } else {
                const pinNum = constants.get(pinRef);
                if (pinNum !== undefined) {
                    // Convert PIN_NAME to pythonic name: MIST_PUMP_PIN -> mist_pump
                    const pyName = pinRef.replace(/_PIN$/, '').toLowerCase();
                    outputPins.push({name: pyName, num: pinNum});
                }
            }
        }

        // Extract INPUT_PULLUP pinMode calls (for buttons)
        const inputPinMatches = code.matchAll(/pinMode\s*\(\s*([A-Z_][A-Z0-9_]*|\d+)\s*,\s*INPUT_PULLUP\s*\)/g);
        const inputPins: Array<{name: string, num: number}> = [];
        for (const match of inputPinMatches) {
            const pinRef = match[1];
            if (/^\d+$/.test(pinRef)) {
                inputPins.push({name: `pin${pinRef}`, num: parseInt(pinRef)});
            } else {
                const pinNum = constants.get(pinRef);
                if (pinNum !== undefined) {
                    const pyName = pinRef.replace(/_PIN$/, '').toLowerCase();
                    inputPins.push({name: pyName, num: pinNum});
                }
            }
        }

        // Extract analogRead pins
        const analogPinMatches = code.matchAll(/analogRead\s*\(\s*([A-Z_][A-Z0-9_]*|\d+)\s*\)/g);
        const analogPins: Array<{name: string, num: number}> = [];
        const seenAnalogPins = new Set<string>();
        for (const match of analogPinMatches) {
            const pinRef = match[1];
            if (seenAnalogPins.has(pinRef)) continue;
            seenAnalogPins.add(pinRef);

            if (/^\d+$/.test(pinRef)) {
                analogPins.push({name: `adc${pinRef}`, num: parseInt(pinRef)});
            } else {
                const pinNum = constants.get(pinRef);
                if (pinNum !== undefined) {
                    const pyName = 'adc_' + pinRef.replace(/_PIN$/, '').toLowerCase();
                    analogPins.push({name: pyName, num: pinNum});
                }
            }
        }

        // Create Pin objects for outputs
        outputPins.forEach(pin => {
            pythonCode += `${pin.name} = Pin(${pin.num}, Pin.OUT)\n`;
        });

        // Create Pin objects for inputs
        inputPins.forEach(pin => {
            pythonCode += `${pin.name} = Pin(${pin.num}, Pin.IN, Pin.PULL_UP)\n`;
        });

        // Create ADC objects for analog inputs
        analogPins.forEach(pin => {
            pythonCode += `${pin.name} = ADC(Pin(${pin.num}))\n`;
            pythonCode += `${pin.name}.atten(ADC.ATTN_11DB)  # Full range 0-3.3V\n`;
        });

        if (outputPins.length > 0 || inputPins.length > 0 || analogPins.length > 0) {
            pythonCode += '\n';
        }

        // Store pin mappings for line conversion
        this.currentConversionContext = {
            constants,
            outputPins: new Map(outputPins.map(p => [p.num, p.name])),
            inputPins: new Map(inputPins.map(p => [p.num, p.name])),
            analogPins: new Map(analogPins.map(p => [p.num, p.name])),
            pinNameToNum: new Map([...outputPins, ...inputPins, ...analogPins].map(p => [p.name, p.num])),
            constantNames: new Map([...constants.entries()].filter(([k]) => k.endsWith('_PIN')).map(([k, v]) => [k, v]))
        };

        // Convert loop content line-by-line with brace tracking
        if (loopMatch) {
            pythonCode += 'while True:\n';
            const loopContent = loopMatch[1];
            const lines = loopContent.split('\n');

            let braceDepth = 0;
            let hasContent = false;

            for (const line of lines) {
                // Count braces BEFORE processing to handle closing brace indentation
                const closeBraces = (line.match(/\}/g) || []).length;
                const openBraces = (line.match(/\{/g) || []).length;

                // Decrease depth for closing braces first
                braceDepth -= closeBraces;
                if (braceDepth < 0) braceDepth = 0;

                // Convert the line
                const converted = this.convertLine(line);

                // Add line with proper indentation (skip empty lines)
                if (converted.trim()) {
                    const indent = '    '.repeat(braceDepth + 1);
                    pythonCode += indent + converted + '\n';
                    hasContent = true;
                }

                // Increase depth for opening braces after
                braceDepth += openBraces;
            }

            // If no content, add pass statement
            if (!hasContent) {
                pythonCode += '    pass\n';
            }
        }

        return pythonCode;
    }

    private convertLine(line: string): string {
        let result = line;
        const ctx = this.currentConversionContext;

        // Remove C++ style comments
        result = result.replace(/\/\/.*$/g, '');
        result = result.replace(/\/\*.*?\*\//g, '');

        // Variable declarations: "int x = " → "x = "
        result = result.replace(/\b(int|float|double|bool|boolean|char|String|long|unsigned)\s+(\w+)\s*=/g, '$2 =');

        // analogRead with named constant → adc_name.read()
        result = result.replace(/analogRead\s*\(\s*([A-Z_][A-Z0-9_]*)\s*\)/g, (_match, pinName) => {
            if (ctx && ctx.constantNames.has(pinName)) {
                const pyName = 'adc_' + pinName.replace(/_PIN$/, '').toLowerCase();
                return `${pyName}.read()`;
            }
            return `adc_${pinName.toLowerCase()}.read()`;
        });
        // analogRead with plain number → adcN.read()
        result = result.replace(/analogRead\s*\(\s*(\d+)\s*\)/g, 'adc$1.read()');

        // digitalWrite with named constant → name.value()
        result = result.replace(/digitalWrite\s*\(\s*([A-Z_][A-Z0-9_]*)\s*,\s*(HIGH|LOW|1|0)\s*\)/g,
            (_match, pinName, state) => {
                const pyName = pinName.replace(/_PIN$/, '').toLowerCase();
                return `${pyName}.value(${state === 'HIGH' || state === '1' ? '1' : '0'})`;
            });
        // digitalWrite with LED_PIN_N → ledN.value()
        result = result.replace(/digitalWrite\s*\(\s*LED_PIN_(\d+)\s*,\s*(HIGH|LOW|1|0)\s*\)/g,
            (_match, pin, state) => `led${pin}.value(${state === 'HIGH' || state === '1' ? '1' : '0'})`);
        // digitalWrite with plain number → pinN.value()
        result = result.replace(/digitalWrite\s*\(\s*(\d+)\s*,\s*(HIGH|LOW|1|0)\s*\)/g,
            (_match, pin, state) => `pin${pin}.value(${state === 'HIGH' || state === '1' ? '1' : '0'})`);

        // digitalRead with named constant → name.value()
        result = result.replace(/digitalRead\s*\(\s*([A-Z_][A-Z0-9_]*)\s*\)/g, (_match, pinName) => {
            const pyName = pinName.replace(/_PIN$/, '').toLowerCase();
            return `${pyName}.value()`;
        });
        // digitalRead with BUTTON_PIN_N → buttonN.value()
        result = result.replace(/digitalRead\s*\(\s*BUTTON_PIN_(\d+)\s*\)/g, 'button$1.value()');
        // digitalRead with plain number → pinN.value()
        result = result.replace(/digitalRead\s*\(\s*(\d+)\s*\)/g, 'pin$1.value()');

        // Serial.println → print
        result = result.replace(/Serial\.println\s*\(\s*([^)]+)\s*\)/g, 'print($1)');
        result = result.replace(/Serial\.print\s*\(\s*([^)]+)\s*\)/g, 'print($1, end="")');

        // delay → time.sleep_ms
        result = result.replace(/delay\s*\(\s*(\d+)\s*\)/g, 'time.sleep_ms($1)');

        // Convert LOW/HIGH to 0/1
        result = result.replace(/\bLOW\b/g, '0');
        result = result.replace(/\bHIGH\b/g, '1');

        // else if: "} else if (condition) {" → "elif condition:"
        result = result.replace(/\}?\s*else\s+if\s*\(\s*(.+?)\s*\)\s*\{?/g, 'elif $1:');

        // else: "} else {" → "else:"
        result = result.replace(/\}?\s*else\s*\{?/g, 'else:');

        // if statement: "if (condition) {" → "if condition:"
        result = result.replace(/if\s*\(\s*(.+?)\s*\)\s*\{?/g, 'if $1:');

        // while statement: "while (condition) {" → "while condition:"
        result = result.replace(/while\s*\(\s*(.+?)\s*\)\s*\{?/g, 'while $1:');

        // Remove semicolons
        result = result.replace(/;/g, '');

        // Remove standalone braces
        result = result.replace(/^\s*[\{\}]\s*$/g, '');

        // Clean up any remaining braces in the line
        result = result.replace(/[\{\}]/g, '');

        return result.trim();
    }

    private setupESP32Hardware() {
        if (!this.micropythonRunner) return;

        console.log('[EmulatorManager] Setting up ESP32 hardware listeners...');

        // Set up pin listeners for common LED pins
        const commonPins = [2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27];
        commonPins.forEach(pin => {
            this.micropythonRunner!.setPinListener(pin, (value: boolean) => {
                console.log(`[EmulatorManager] ESP32 Pin ${pin} changed to: ${value}`);
                this.hackcable.esp32PinUpdate(pin, value);
            });
        });

        console.log('[EmulatorManager] ESP32 hardware listeners configured');
    }


    setPaused(pause: boolean){
        if (this.boardType === 'esp32') {
            if(this.micropythonRunner) this.micropythonRunner.pause = pause;
        } else {
            if(this.runner) this.runner.pause = pause;
        }
    }

    isPosed(){
        if (this.boardType === 'esp32') {
            if(this.micropythonRunner) return this.micropythonRunner.pause;
            return true;
        } else {
            if(this.runner) return this.runner.pause;
            return true;
        }
    }

    stop(){
        if(this.runner) this.runner.stop();
        if(this.micropythonRunner) this.micropythonRunner.stop();
    }


    private setupHardware(){
        if(!this.runner) throw new Error("Runner mustn't be null!")
        console.log('[EmulatorManager] Setting up hardware listeners...');
        this.runner.portB.addListener(() => {
            if(this.runner) this.hackcable.portBUpdate(this.runner.portB)
        });
        this.runner.portC.addListener(() => {
            if(this.runner) this.hackcable.portCUpdate(this.runner.portC)
        });
        this.runner.portD.addListener(() => {
            if(this.runner) this.hackcable.portDUpdate(this.runner.portD)
        });
        console.log('[EmulatorManager] Hardware listeners configured');
    }
}

