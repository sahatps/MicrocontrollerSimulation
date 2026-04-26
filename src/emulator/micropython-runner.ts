// MicroPython is loaded dynamically from /micropython.mjs to avoid webpack bundling issues
// import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { MicroTaskScheduler } from "./micro-task-scheduler";

export interface PinState {
    mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';
    value: boolean;
}

export interface SimulatedHttpResponse {
    id: number;
    path: string;
    status: number;
    contentType: string;
    body: string;
}

interface PendingHttpRequest {
    id: number;
    path: string;
    query: Record<string, string>;
}

interface PendingHttpResolver {
    path: string;
    resolve: (value: SimulatedHttpResponse) => void;
    timer: ReturnType<typeof setTimeout>;
}

export class MicroPythonRunner {
    private mp: any;
    private taskScheduler = new MicroTaskScheduler();
    public pins: Map<number, PinState> = new Map();
    private pinCallbacks: Map<number, (value: boolean) => void> = new Map();
    public onSerialData: ((data: string) => void) | null = null;
    public onSensorActivate: ((busType: string, pin1: number, pin2: number) => void) | null = null;
    private httpRequestQueue: PendingHttpRequest[] = [];
    private pendingHttpResolvers: Map<number, PendingHttpResolver> = new Map();
    private nextHttpRequestId = 1;
    private supportedPins: Set<number>;
    private unsupportedWriteWarnings: Set<number> = new Set();
    private resumeLoopScheduler: (() => void) | null = null;

    // ESP32 common GPIO pins
    private readonly availablePins = [2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];

    constructor() {
        this.supportedPins = new Set(this.availablePins);
        // Initialize all pins as INPUT
        this.availablePins.forEach(pin => {
            this.pins.set(pin, { mode: 'INPUT', value: false });
        });
    }

    private ensurePinState(pin: number): PinState {
        let pinState = this.pins.get(pin);
        if (!pinState) {
            pinState = { mode: 'INPUT', value: false };
            this.pins.set(pin, pinState);
        }
        return pinState;
    }

    private warnUnsupportedPinWrite(pin: number): void {
        if (this.supportedPins.size === 0 || this.supportedPins.has(pin) || this.unsupportedWriteWarnings.has(pin)) {
            return;
        }
        this.unsupportedWriteWarnings.add(pin);
        const msg = `[Wiring Warning] GPIO${pin} is not a supported pin on the selected board.`;
        console.warn(`[MicroPython] ${msg}`);
        if (this.onSerialData) this.onSerialData(`${msg}\n`);
    }

    private parseHttpPath(rawPath: string): { path: string; query: Record<string, string> } {
        const pathText = (rawPath || '').trim();
        const withSlash = pathText.length === 0 ? '/' : (pathText.startsWith('/') ? pathText : `/${pathText}`);
        const qIdx = withSlash.indexOf('?');
        const path = qIdx >= 0 ? withSlash.slice(0, qIdx) : withSlash;
        const queryPart = qIdx >= 0 ? withSlash.slice(qIdx + 1) : '';
        const query: Record<string, string> = {};
        if (queryPart) {
            for (const token of queryPart.split('&')) {
                if (!token) continue;
                const eqIdx = token.indexOf('=');
                const rawKey = eqIdx >= 0 ? token.slice(0, eqIdx) : token;
                const rawValue = eqIdx >= 0 ? token.slice(eqIdx + 1) : '';
                const decode = (v: string): string => {
                    try {
                        return decodeURIComponent(v.replace(/\+/g, ' '));
                    } catch {
                        return v;
                    }
                };
                const key = decode(rawKey);
                if (!key) continue;
                query[key] = decode(rawValue);
            }
        }
        return { path, query };
    }

    private resetHttpBridge(resolvePending = false): void {
        this.httpRequestQueue = [];
        if (!resolvePending) return;
        for (const [id, pending] of this.pendingHttpResolvers.entries()) {
            clearTimeout(pending.timer);
            pending.resolve({
                id,
                path: pending.path,
                status: 499,
                contentType: 'text/plain',
                body: 'Request cancelled',
            });
        }
        this.pendingHttpResolvers.clear();
    }

    async httpGet(path: string): Promise<SimulatedHttpResponse> {
        const parsed = this.parseHttpPath(path);
        const id = this.nextHttpRequestId++;
        return new Promise<SimulatedHttpResponse>((resolve) => {
            const timer = setTimeout(() => {
                const pending = this.pendingHttpResolvers.get(id);
                if (!pending) return;
                this.pendingHttpResolvers.delete(id);
                resolve({
                    id,
                    path: parsed.path,
                    status: 504,
                    contentType: 'text/plain',
                    body: 'Simulated HTTP timeout',
                });
            }, 5000);
            this.pendingHttpResolvers.set(id, { path: parsed.path, resolve, timer });
            this.httpRequestQueue.push({ id, path: parsed.path, query: parsed.query });
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
                    if (this.onSerialData) this.onSerialData(text + '\n');
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
            script.src = './micropython.mjs';

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

class I2C:
    def __init__(self, id=0, scl=None, sda=None, freq=400000):
        self._scl = scl.pin_num if hasattr(scl, 'pin_num') else scl
        self._sda = sda.pin_num if hasattr(sda, 'pin_num') else sda
        js._micropython_i2c_activate(self._sda if self._sda is not None else -1, self._scl if self._scl is not None else -1)

    def readfrom_mem(self, addr, reg, nbytes):
        return bytes(nbytes)

    def writeto_mem(self, addr, reg, buf):
        pass

    def readfrom(self, addr, nbytes, stop=True):
        return bytes(nbytes)

    def writeto(self, addr, buf, stop=True):
        pass

    def scan(self):
        return []

class UART:
    def __init__(self, id=1, baudrate=9600, tx=None, rx=None, **kw):
        self._tx = tx.pin_num if hasattr(tx, 'pin_num') else tx
        self._rx = rx.pin_num if hasattr(rx, 'pin_num') else rx
        js._micropython_uart_activate(self._tx if self._tx is not None else -1, self._rx if self._rx is not None else -1)

    def write(self, data):
        pass

    def read(self, nbytes=None):
        return b''

    def readline(self):
        return b''

    def any(self):
        return 0

# Simulated sensor libraries
class SHT31:
    def __init__(self, i2c, addr=0x44):
        self._i2c = i2c

    # Arduino SHT31 libraries often require an explicit .read() call before accessing
    # temperature/humidity. In this simulator we compute values on-demand, so read() is a no-op.
    def read(self):
        return True

    def temperature(self):
        try:
            return float(js._micropython_sht31_temp())
        except Exception:
            return round(25.0 + (js._micropython_adc_read(0) / 4095.0) * 5.0, 1)

    def humidity(self):
        try:
            return float(js._micropython_sht31_humidity())
        except Exception:
            return round(60.0 + (js._micropython_adc_read(0) / 4095.0) * 20.0, 1)

class BH1750:
    CONT_HRES_MODE = 0x10

    def __init__(self, i2c, addr=0x23):
        self._i2c = i2c

    def luminance(self, mode=None):
        try:
            return float(js._micropython_bh1750_lux())
        except Exception:
            return round(200.0 + (js._micropython_adc_read(0) / 4095.0) * 800.0, 1)

    def measurement(self, mode=None):
        return self.luminance(mode)

class RS485Sensor:
    def __init__(self, uart, slave_id=1, name='RS485'):
        self._uart = uart
        self._slave_id = slave_id
        self._name = name

    def read_register(self, reg=0):
        try:
            return float(js._micropython_modbus_read(self._slave_id, reg))
        except Exception:
            return round((js._micropython_adc_read(0) / 4095.0) * 14.0, 2)

# Create module objects using simple classes
import sys

class MachineModule:
    Pin = Pin
    PWM = PWM
    ADC = ADC
    I2C = I2C
    UART = UART

class TimeModule:
    @staticmethod
    def time():
        # Provide Unix time (seconds) for Arduino-style millis() helpers.
        try:
            return js.Date.now() / 1000.0
        except Exception:
            return 0.0

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

# Arduino-style global compatibility helpers (function-only API)
def pinMode(pin, mode):
    p = Pin(pin, mode)
    return p

def digitalWrite(pin, value):
    js._micropython_set_pin_value(pin, 1 if value else 0)

def digitalRead(pin):
    return 1 if js._micropython_get_pin_value(pin) else 0

def analogRead(pin):
    return js._micropython_adc_read(pin)

def analogWrite(pin, value):
    # Arduino PWM range is typically 0-255. Map to simulator duty 0-1023.
    v = int(value)
    if v < 0:
        v = 0
    if v > 255:
        v = 255
    duty = int((v / 255.0) * 1023)
    js._micropython_pwm_duty(pin, duty)

def delay(ms):
    # Non-blocking in this simulator environment (no-op placeholder)
    pass

# Make globals available using builtins as early as possible
import builtins
builtins.Serial = Serial
builtins.RS485Sensor = RS485Sensor
builtins.pinMode = pinMode
builtins.digitalWrite = digitalWrite
builtins.digitalRead = digitalRead
builtins.analogRead = analogRead
builtins.analogWrite = analogWrite
builtins.delay = delay
builtins.SHT31 = SHT31
builtins.BH1750 = BH1750

# Register simulated sensor libraries (best-effort, never fail injection)
try:
    class SHT31Module:
        pass
    _sht31_mod = SHT31Module()
    _sht31_mod.SHT31 = SHT31
    sys.modules['sht31'] = _sht31_mod
except Exception:
    pass

try:
    class BH1750Module:
        pass
    _bh1750_mod = BH1750Module()
    _bh1750_mod.BH1750 = BH1750
    sys.modules['bh1750'] = _bh1750_mod
except Exception:
    pass
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

        this.unsupportedWriteWarnings.clear();

        // Clear any existing loop
        if (this.loopIntervalId) {
            clearTimeout(this.loopIntervalId);
            this.loopIntervalId = null;
        }
        this.resumeLoopScheduler = null;
        this.resetHttpBridge(true);

        try {
            // Expose pin control functions to Python
            (globalThis as any)._micropython_set_pin_mode = (pin: number, mode: number, pull: number) => {
                const pinState = this.ensurePinState(pin);
                pinState.mode = mode === 1 ? 'OUTPUT' : (pull === 2 ? 'INPUT_PULLUP' : 'INPUT');
                console.log(`[MicroPython] Pin ${pin} mode set to ${pinState.mode}`);
            };

            (globalThis as any)._micropython_get_pin_value = (pin: number): number => {
                const pinState = this.ensurePinState(pin);
                return pinState.value ? 1 : 0;
            };

            (globalThis as any)._micropython_set_pin_value = (pin: number, value: number) => {
                const pinState = this.ensurePinState(pin);
                this.warnUnsupportedPinWrite(pin);
                pinState.value = value !== 0;
                console.log(`[MicroPython] Pin ${pin} set to ${value ? 'HIGH' : 'LOW'}`);
                // Notify any listeners
                const callback = this.pinCallbacks.get(pin);
                if (callback) {
                    callback(pinState.value);
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
                const pinState = this.ensurePinState(pin);
                this.warnUnsupportedPinWrite(pin);
                pinState.value = duty > 512;
                const callback = this.pinCallbacks.get(pin);
                if (callback) {
                    callback(pinState.value);
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
                try {
                    const hook = (globalThis as any).hackcable_analog_read;
                    if (typeof hook === 'function') {
                        const v = Number(hook(pin));
                        const clamped = Math.max(0, Math.min(4095, Math.floor(isNaN(v) ? 0 : v)));
                        console.log(`[MicroPython] ADC read pin ${pin}: ${clamped} (from mock)`);
                        return clamped;
                    }
                } catch {}
                // Fallback: random value
                const value = Math.floor(Math.random() * 4096);
                console.log(`[MicroPython] ADC read pin ${pin}: ${value} (random)`);
                return value;
            };

            // I2C / UART sensor activation callbacks
            (globalThis as any)._micropython_i2c_activate = (sda: number, scl: number) => {
                console.log(`[MicroPython] I2C activated sda=${sda} scl=${scl}`);
                if (this.onSensorActivate) this.onSensorActivate('i2c', sda, scl);
            };

            (globalThis as any)._micropython_uart_activate = (tx: number, rx: number) => {
                console.log(`[MicroPython] UART activated tx=${tx} rx=${rx}`);
                if (this.onSensorActivate) this.onSensorActivate('uart', tx, rx);
            };

            // Serial communication callbacks
            (globalThis as any)._micropython_serial_begin = (baud: number) => {
                console.log(`[MicroPython] Serial.begin(${baud})`);
            };

            (globalThis as any)._micropython_serial_print = (text: string, newline: boolean) => {
                const output = newline ? text + '\n' : text;
                if (this.onSerialData) this.onSerialData(output);
                console.log(`[Serial] ${text}`);
            };

            // Sensor mock bridge callbacks (align with Emscripten bridges if present)
            (globalThis as any)._micropython_sht31_temp = (): number => {
                const hook = (globalThis as any).hackcable_sht31_temp;
                if (typeof hook === 'function') return Number(hook());
                // Derive from ADC as a loose fallback
                return 25.0 + ((globalThis as any)._micropython_adc_read(0) / 4095.0) * 5.0;
            };
            (globalThis as any)._micropython_sht31_humidity = (): number => {
                const hook = (globalThis as any).hackcable_sht31_humidity;
                if (typeof hook === 'function') return Number(hook());
                return 60.0 + ((globalThis as any)._micropython_adc_read(0) / 4095.0) * 20.0;
            };
            (globalThis as any)._micropython_bh1750_lux = (): number => {
                const hook = (globalThis as any).hackcable_bh1750_lux;
                if (typeof hook === 'function') return Number(hook());
                return 200.0 + ((globalThis as any)._micropython_adc_read(0) / 4095.0) * 800.0;
            };
            (globalThis as any)._micropython_modbus_read = (slaveId: number, regAddr: number): number => {
                const hook = (globalThis as any).hackcable_modbus_read;
                if (typeof hook === 'function') return Number(hook(slaveId, regAddr));
                // Weather-ish fallback mapping
                if (regAddr === 0) return 25.0;
                if (regAddr === 1) return 60.0;
                if (regAddr === 2) return 400.0;
                if (regAddr === 3) return 1013.0;
                return 7.0;
            };

            // Virtual HTTP bridge callbacks for simulated WebServer.
            (globalThis as any)._micropython_http_poll = (): string => {
                const req = this.httpRequestQueue.shift();
                if (!req) return '';
                return JSON.stringify(req);
            };
            (globalThis as any)._micropython_http_respond = (reqId: number, status: number, contentType: string, body: string): void => {
                const id = Number(reqId);
                const pending = this.pendingHttpResolvers.get(id);
                if (!pending) return;
                clearTimeout(pending.timer);
                this.pendingHttpResolvers.delete(id);
                pending.resolve({
                    id,
                    path: pending.path,
                    status: Number(status) || 200,
                    contentType: String(contentType ?? 'text/plain'),
                    body: String(body ?? ''),
                });
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

                    if (statements.length === 0) {
                        const msg = '[MicroPython Warning] Converted loop has no executable statements.';
                        console.warn(msg);
                        if (this.onSerialData) this.onSerialData(msg + '\n');
                        return;
                    }

                    console.log('[MicroPython] Parsed', statements.length, 'loop statements:');
                    statements.forEach((stmt, idx) => {
                        console.log(`[MicroPython] Statement ${idx}:`, stmt.replace(/\n/g, '\\n'));
                    });

                    // Execute statements with real-time catch-up so background-tab timer throttling
                    // does not permanently slow the simulated loop.
                    let statementIndex = 0;
                    const reportedLoopErrors = new Set<string>();
                    const MAX_STATEMENTS_PER_SLICE = 320;
                    const DEFAULT_STEP_DELAY_MS = 10;
                    const ERROR_STEP_DELAY_MS = 100;
                    let nextDueAtMs = performance.now();

                    const executeOneStatement = (): number => {
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
                                return Math.max(0, delay);
                            } else if (simpleSleepSecMatch) {
                                const delay = Math.floor(parseFloat(simpleSleepSecMatch[1]) * 1000);
                                console.log(`[MicroPython] Sleeping for ${delay}ms`);
                                statementIndex = (statementIndex + 1) % statements.length;
                                return Math.max(0, delay);
                            } else {
                                // Execute the statement/block
                                console.log(`[MicroPython] Running block:\n${statement}`);
                                this.mp.runPython(statement);
                                statementIndex = (statementIndex + 1) % statements.length;
                                return DEFAULT_STEP_DELAY_MS;
                            }
                        } catch (error) {
                            console.error('[MicroPython] Statement execution error:', error);
                            console.error('[MicroPython] Problematic statement:', statement);
                            const message = error instanceof Error ? error.message : String(error);
                            const key = `${message} | ${statement}`;
                            if (!reportedLoopErrors.has(key)) {
                                reportedLoopErrors.add(key);
                                const compactStatement = String(statement || '').replace(/\s+/g, ' ').trim();
                                const stmtPreview = compactStatement.length > 180
                                    ? compactStatement.slice(0, 180) + '...'
                                    : compactStatement;
                                if (this.onSerialData) {
                                    this.onSerialData(
                                        `[MicroPython Loop Error] ${message}\n` +
                                        `[MicroPython Loop Error] statement: ${stmtPreview}\n`
                                    );
                                }
                            }
                            statementIndex = (statementIndex + 1) % statements.length;
                            return ERROR_STEP_DELAY_MS;
                        }
                    };

                    const scheduleFromDueTime = () => {
                        if (this.taskScheduler.stopped) return;
                        const waitMs = Math.max(0, Math.floor(nextDueAtMs - performance.now()));
                        this.loopIntervalId = setTimeout(executeDueStatements, waitMs);
                    };

                    const executeDueStatements = () => {
                        if (this.taskScheduler.stopped) {
                            return;
                        }

                        let executed = 0;
                        const now = performance.now();
                        if (nextDueAtMs < now - 60000) {
                            // Avoid unbounded catch-up after very long suspension.
                            nextDueAtMs = now;
                        }

                        while (!this.taskScheduler.stopped && executed < MAX_STATEMENTS_PER_SLICE && performance.now() >= nextDueAtMs) {
                            const stepDelayMs = executeOneStatement();
                            nextDueAtMs += Math.max(0, stepDelayMs);
                            executed++;
                        }

                        if (this.taskScheduler.stopped) return;

                        if (executed >= MAX_STATEMENTS_PER_SLICE && performance.now() >= nextDueAtMs) {
                            this.loopIntervalId = setTimeout(executeDueStatements, 0);
                            return;
                        }
                        scheduleFromDueTime();
                    };

                    this.taskScheduler.start();
                    console.log('[MicroPython] Loop execution started');
                    nextDueAtMs = performance.now();
                    this.resumeLoopScheduler = () => {
                        if (!this.loopIntervalId && !this.taskScheduler.stopped) {
                            scheduleFromDueTime();
                        }
                    };
                    scheduleFromDueTime();
                } else {
                    const msg = '[MicroPython] Could not parse while True loop body; running code directly.';
                    console.warn(msg);
                    if (this.onSerialData) this.onSerialData(msg + '\n');
                    this.mp.runPython(code);
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
        this.ensurePinState(pin);
        this.pinCallbacks.set(pin, callback);
    }

    setSupportedPins(pins: number[]): void {
        this.supportedPins = pins.length > 0 ? new Set(pins) : new Set(this.availablePins);
        this.unsupportedWriteWarnings.clear();
        this.supportedPins.forEach(pin => this.ensurePinState(pin));
    }

    setInputPin(pin: number, value: boolean): void {
        const pinState = this.ensurePinState(pin);
        if (pinState.mode !== 'OUTPUT') {
            pinState.value = value;
        }
    }

    set pause(pause: boolean) {
        if (pause && !this.pause) {
            this.taskScheduler.stop();
            if (this.loopIntervalId) {
                clearTimeout(this.loopIntervalId);
                this.loopIntervalId = null;
            }
        } else if (!pause && this.pause) {
            this.taskScheduler.start();
            if (this.resumeLoopScheduler) this.resumeLoopScheduler();
        }
    }

    get pause(): boolean {
        return this.taskScheduler.stopped;
    }

    stop(): void {
        this.taskScheduler.stop();
        this.resetHttpBridge(true);
        if (this.loopIntervalId) {
            clearTimeout(this.loopIntervalId);
            this.loopIntervalId = null;
        }
        this.resumeLoopScheduler = null;
        console.log('[MicroPython] Stopped');
    }
}
