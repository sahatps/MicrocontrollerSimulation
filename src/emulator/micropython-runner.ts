// MicroPython is loaded dynamically from /micropython.mjs to avoid webpack bundling issues
// import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { MicroTaskScheduler } from "./micro-task-scheduler";

export interface PinState {
    mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';
    value: boolean;
}

export class MicroPythonRunner {
    private mp: any;
    private taskScheduler = new MicroTaskScheduler();
    public pins: Map<number, PinState> = new Map();
    private pinCallbacks: Map<number, (value: boolean) => void> = new Map();

    // ESP32 common GPIO pins
    private readonly availablePins = [2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];

    constructor() {
        // Initialize all pins as INPUT
        this.availablePins.forEach(pin => {
            this.pins.set(pin, { mode: 'INPUT', value: false });
        });
    }

    async initialize(): Promise<void> {
        console.log('[MicroPython] Loading MicroPython module dynamically...');

        try {
            // Load the MicroPython .mjs file dynamically as a module script
            // This avoids webpack bundling which breaks WASM path resolution
            await this.loadMicroPythonScript();

            // Get the loadMicroPython function from the global scope
            const loadMicroPython = (globalThis as any).loadMicroPython;

            if (!loadMicroPython) {
                throw new Error('loadMicroPython function not found. Make sure micropython.mjs loaded correctly.');
            }

            // Configure MicroPython with custom stdout
            const config = {
                stdout: (text: string) => {
                    console.log('[MicroPython]:', text);
                }
            };

            console.log('[MicroPython] Initializing MicroPython...');

            // Load MicroPython - WASM file will be automatically loaded from the same directory
            this.mp = await loadMicroPython(config);

            console.log('[MicroPython] Successfully loaded!');

            // Inject custom machine module for GPIO simulation
            this.injectMachineModule();
        } catch (error) {
            console.error('[MicroPython] Failed to load MicroPython:', error);
            throw error;
        }
    }

    private loadMicroPythonScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if ((globalThis as any).loadMicroPython) {
                resolve();
                return;
            }

            // Create a script element to load the MicroPython module
            const script = document.createElement('script');
            script.type = 'module';
            script.src = '/micropython.mjs';

            script.onload = () => {
                console.log('[MicroPython] micropython.mjs loaded successfully');
                // The module needs a moment to execute and expose loadMicroPython
                setTimeout(() => resolve(), 100);
            };

            script.onerror = () => {
                reject(new Error('Failed to load micropython.mjs'));
            };

            document.head.appendChild(script);
        });
    }

    private injectMachineModule(): void {
        // Create a Python module that simulates ESP32 machine.Pin
        const machineModuleCode = `
import js

class Pin:
    IN = 0
    OUT = 1
    PULL_UP = 2

    def __init__(self, pin_num, mode=IN, pull=None):
        self.pin_num = pin_num
        self.mode = mode
        self.pull = pull
        # Notify JavaScript about pin mode change
        js._micropython_set_pin_mode(pin_num, mode, pull if pull is not None else -1)

    def value(self, val=None):
        if val is None:
            # Read pin value from JavaScript
            return js._micropython_get_pin_value(self.pin_num)
        else:
            # Write pin value to JavaScript
            js._micropython_set_pin_value(self.pin_num, 1 if val else 0)

    def on(self):
        self.value(1)

    def off(self):
        self.value(0)

class PWM:
    def __init__(self, pin, freq=1000, duty=512):
        self.pin = pin if isinstance(pin, int) else pin.pin_num
        self._freq = freq
        self._duty = duty
        js._micropython_pwm_init(self.pin, freq, duty)

    def freq(self, val=None):
        if val is None:
            return self._freq
        self._freq = val
        js._micropython_pwm_freq(self.pin, val)

    def duty(self, val=None):
        if val is None:
            return self._duty
        self._duty = val
        js._micropython_pwm_duty(self.pin, val)

    def deinit(self):
        js._micropython_pwm_deinit(self.pin)

class ADC:
    # Attenuation constants for ESP32
    ATTN_0DB = 0     # 0-1.0V range
    ATTN_2_5DB = 1   # 0-1.34V range
    ATTN_6DB = 2     # 0-2.0V range
    ATTN_11DB = 3    # 0-3.3V range (full range)

    def __init__(self, pin):
        self.pin = pin if isinstance(pin, int) else pin.pin_num
        self._atten = ADC.ATTN_0DB
        self._width = 12  # 12-bit resolution (0-4095)
        js._micropython_adc_init(self.pin)

    def atten(self, atten):
        self._atten = atten
        js._micropython_adc_atten(self.pin, atten)

    def width(self, bits):
        self._width = bits

    def read(self):
        # Read analog value from JavaScript (returns 0-4095)
        return js._micropython_adc_read(self.pin)

    def read_u16(self):
        # Read as 16-bit value (0-65535)
        return int(self.read() * 16)

# Create module objects using simple classes
import sys

class MachineModule:
    Pin = Pin
    PWM = PWM
    ADC = ADC

class TimeModule:
    @staticmethod
    def sleep_ms(ms):
        # Sleep is handled by the JavaScript execution engine
        # This function is a no-op placeholder
        pass

    @staticmethod
    def sleep(seconds):
        # Sleep is handled by the JavaScript execution engine
        # This function is a no-op placeholder
        pass

# Arduino-compatible Serial class
class SerialClass:
    def __init__(self):
        self._baud = 9600

    def begin(self, baud=9600):
        self._baud = baud
        js._micropython_serial_begin(baud)

    def print(self, *args):
        text = ' '.join(str(a) for a in args)
        js._micropython_serial_print(text, False)

    def println(self, *args):
        text = ' '.join(str(a) for a in args) if args else ''
        js._micropython_serial_print(text, True)

    def write(self, data):
        js._micropython_serial_print(str(data), False)

    def available(self):
        return 0  # No input available in simulator

    def read(self):
        return -1  # No data to read

# Create Serial instance and make it truly global
Serial = SerialClass()

# Register modules in sys.modules
sys.modules['machine'] = MachineModule()
sys.modules['time'] = TimeModule()

# Make Serial available globally using builtins
import builtins
builtins.Serial = Serial
`;

        try {
            this.mp.runPython(machineModuleCode);
            console.log('[MicroPython] machine and time modules injected successfully');
        } catch (error) {
            console.error('Failed to inject machine module:', error);
        }
    }

    private loopIntervalId: any = null;

    async runCode(code: string): Promise<void> {
        if (!this.mp) {
            await this.initialize();
        }

        // Clear any existing loop
        if (this.loopIntervalId) {
            clearInterval(this.loopIntervalId);
            this.loopIntervalId = null;
        }

        try {
            // Expose pin control functions to Python
            (globalThis as any)._micropython_set_pin_mode = (pin: number, mode: number, pull: number) => {
                const pinState = this.pins.get(pin);
                if (pinState) {
                    pinState.mode = mode === 1 ? 'OUTPUT' : (pull === 2 ? 'INPUT_PULLUP' : 'INPUT');
                }
                console.log(`[MicroPython] Pin ${pin} mode set to ${pinState?.mode}`);
            };

            (globalThis as any)._micropython_get_pin_value = (pin: number): number => {
                const pinState = this.pins.get(pin);
                return pinState ? (pinState.value ? 1 : 0) : 0;
            };

            (globalThis as any)._micropython_set_pin_value = (pin: number, value: number) => {
                const pinState = this.pins.get(pin);
                if (pinState) {
                    pinState.value = value !== 0;
                    console.log(`[MicroPython] Pin ${pin} set to ${value ? 'HIGH' : 'LOW'}`);
                    // Notify any listeners
                    const callback = this.pinCallbacks.get(pin);
                    if (callback) {
                        callback(pinState.value);
                    }
                }
            };

            (globalThis as any)._micropython_pwm_init = (pin: number, freq: number, duty: number) => {
                console.log(`PWM initialized on pin ${pin}: freq=${freq}, duty=${duty}`);
            };

            (globalThis as any)._micropython_pwm_freq = (pin: number, freq: number) => {
                console.log(`PWM freq on pin ${pin}: ${freq}`);
            };

            (globalThis as any)._micropython_pwm_duty = (pin: number, duty: number) => {
                console.log(`PWM duty on pin ${pin}: ${duty}`);
                // Convert duty cycle (0-1023) to boolean for LED
                const pinState = this.pins.get(pin);
                if (pinState) {
                    pinState.value = duty > 512;
                    const callback = this.pinCallbacks.get(pin);
                    if (callback) {
                        callback(pinState.value);
                    }
                }
            };

            (globalThis as any)._micropython_pwm_deinit = (pin: number) => {
                console.log(`PWM deinit on pin ${pin}`);
            };

            // ADC (Analog-to-Digital Converter) callbacks
            (globalThis as any)._micropython_adc_init = (pin: number) => {
                console.log(`[MicroPython] ADC initialized on pin ${pin}`);
            };

            (globalThis as any)._micropython_adc_atten = (pin: number, atten: number) => {
                const attenNames = ['0dB (0-1V)', '2.5dB (0-1.34V)', '6dB (0-2V)', '11dB (0-3.3V)'];
                console.log(`[MicroPython] ADC pin ${pin} attenuation: ${attenNames[atten] || atten}`);
            };

            (globalThis as any)._micropython_adc_read = (pin: number): number => {
                // Simulate analog reading - return random value for now
                // In a real implementation, this would come from a sensor simulation
                const value = Math.floor(Math.random() * 4096); // 0-4095 for 12-bit ADC
                console.log(`[MicroPython] ADC read pin ${pin}: ${value}`);
                return value;
            };

            // Serial communication callbacks
            (globalThis as any)._micropython_serial_begin = (baud: number) => {
                console.log(`[MicroPython] Serial.begin(${baud})`);
            };

            (globalThis as any)._micropython_serial_print = (text: string, newline: boolean) => {
                if (newline) {
                    console.log(`[Serial] ${text}`);
                } else {
                    console.log(`[Serial] ${text}`);
                }
            };

            // Check if code has a "while True:" loop
            if (code.includes('while True:')) {
                console.log('[MicroPython] Detected infinite loop, setting up step-by-step execution');

                // Extract the loop body
                const loopMatch = code.match(/while True:\s*((?:\n\s+.*)+)/);
                if (loopMatch) {
                    const loopBody = loopMatch[1];

                    // Create a function that executes one iteration of the loop
                    const setupCode = code.substring(0, code.indexOf('while True:'));

                    // Run setup code once
                    console.log('[MicroPython] Running setup code:', setupCode);
                    this.mp.runPython(setupCode);

                    // Parse loop body into individual statements, handling multi-line blocks
                    const statements: string[] = [];
                    const lines = loopBody.split('\n');

                    // Find the base indentation level of the loop body
                    let baseIndent = Infinity;
                    for (const line of lines) {
                        if (line.trim().length > 0) {
                            const indent = line.search(/\S/);
                            if (indent >= 0 && indent < baseIndent) {
                                baseIndent = indent;
                            }
                        }
                    }
                    if (baseIndent === Infinity) baseIndent = 0;

                    // Group lines into complete statements
                    // Important: elif/else must stay with their if block!
                    let currentBlock = '';
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        const trimmed = line.trim();

                        if (trimmed.length === 0) continue;

                        const lineIndent = line.search(/\S/);
                        const relativeIndent = lineIndent - baseIndent;

                        // Check if this line is elif/else - these MUST continue the previous if block
                        const isElif = trimmed.startsWith('elif ') || trimmed.startsWith('elif:');
                        const isElse = trimmed === 'else:' || trimmed.startsWith('else:');

                        // Check if this line starts a new top-level statement
                        if (relativeIndent === 0 && !isElif && !isElse) {
                            // Save previous block if any
                            if (currentBlock.trim()) {
                                statements.push(currentBlock);
                            }
                            // Start new block - remove base indentation
                            currentBlock = line.substring(baseIndent);
                        } else if (relativeIndent === 0 && (isElif || isElse)) {
                            // elif/else at base indentation - append to current block
                            currentBlock += '\n' + line.substring(baseIndent);
                        } else if (relativeIndent > 0 && currentBlock) {
                            // This is a continuation of the current block (indented)
                            currentBlock += '\n' + line.substring(baseIndent);
                        }
                    }

                    // Don't forget the last block
                    if (currentBlock.trim()) {
                        statements.push(currentBlock);
                    }

                    console.log('[MicroPython] Parsed', statements.length, 'loop statements:');
                    statements.forEach((stmt, idx) => {
                        console.log(`[MicroPython] Statement ${idx}:`, stmt.replace(/\n/g, '\\n'));
                    });

                    // Execute statements one at a time with proper delays
                    let statementIndex = 0;
                    const executeNextStatement = () => {
                        if (this.taskScheduler.stopped) {
                            return;
                        }

                        const statement = statements[statementIndex];
                        console.log(`[MicroPython] Executing statement ${statementIndex}: ${statement}`);

                        try {
                            // Check if this is a simple sleep statement on its own line
                            const simpleSleepMatch = statement.match(/^time\.sleep_ms\((\d+)\)$/);
                            const simpleSleepSecMatch = statement.match(/^time\.sleep\(([\d.]+)\)$/);

                            if (simpleSleepMatch) {
                                const delay = parseInt(simpleSleepMatch[1]);
                                console.log(`[MicroPython] Sleeping for ${delay}ms`);
                                statementIndex = (statementIndex + 1) % statements.length;
                                setTimeout(executeNextStatement, delay);
                            } else if (simpleSleepSecMatch) {
                                const delay = Math.floor(parseFloat(simpleSleepSecMatch[1]) * 1000);
                                console.log(`[MicroPython] Sleeping for ${delay}ms`);
                                statementIndex = (statementIndex + 1) % statements.length;
                                setTimeout(executeNextStatement, delay);
                            } else {
                                // Execute the statement/block
                                console.log(`[MicroPython] Running block:\n${statement}`);
                                this.mp.runPython(statement);
                                statementIndex = (statementIndex + 1) % statements.length;
                                // Small delay to allow UI updates
                                setTimeout(executeNextStatement, 10);
                            }
                        } catch (error) {
                            console.error('[MicroPython] Statement execution error:', error);
                            console.error('[MicroPython] Problematic statement:', statement);
                            statementIndex = (statementIndex + 1) % statements.length;
                            setTimeout(executeNextStatement, 100);
                        }
                    };

                    this.taskScheduler.start();
                    console.log('[MicroPython] Loop execution started');
                    executeNextStatement();
                }
            } else {
                // No loop, just run once
                console.log('[MicroPython] Running code once (no loop detected)');
                this.mp.runPython(code);
            }
        } catch (error) {
            console.error('MicroPython execution error:', error);
            throw error;
        }
    }

    setPinListener(pin: number, callback: (value: boolean) => void): void {
        this.pinCallbacks.set(pin, callback);
    }

    setInputPin(pin: number, value: boolean): void {
        const pinState = this.pins.get(pin);
        if (pinState && pinState.mode !== 'OUTPUT') {
            pinState.value = value;
        }
    }

    set pause(pause: boolean) {
        if (pause && !this.pause) {
            this.taskScheduler.stop();
        } else if (!pause && this.pause) {
            this.taskScheduler.start();
        }
    }

    get pause(): boolean {
        return this.taskScheduler.stopped;
    }

    stop(): void {
        this.taskScheduler.stop();
        if (this.loopIntervalId) {
            clearInterval(this.loopIntervalId);
            this.loopIntervalId = null;
        }
        console.log('[MicroPython] Stopped');
    }
}
