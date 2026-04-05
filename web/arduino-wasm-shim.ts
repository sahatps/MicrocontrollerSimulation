/**
 * ArduinoWasmShim — provides the full Arduino/ESP32 API as WebAssembly imports.
 *
 * When Clang compiles C++ with --target=wasm32-unknown-unknown -nostdlib, every
 * unresolved external symbol becomes a WASM import in the "env" namespace.
 * This shim supplies all those imports as JavaScript functions so the compiled
 * WASM can simulate running on real hardware.
 */

export type PinChangeCallback = (pin: number, value: boolean) => void;
export type SerialCallback = (text: string) => void;
export type ModbusReadCallback = (slaveId: number, regAddr: number) => number;
export type SensorCallback = () => number;

export class ArduinoWasmShim {
    private pinStates   = new Map<number, boolean>();
    private pinModes    = new Map<number, number>();
    private analogValues = new Map<number, number>();
    private wasmMemory: WebAssembly.Memory | null = null;
    private startTimeMs = performance.now();

    constructor(
        private onPinChange:   PinChangeCallback,
        private onSerial:      SerialCallback,
        private onModbusRead:  ModbusReadCallback,
        private onSht31Temp:   SensorCallback,
        private onSht31Hum:    SensorCallback,
        private onBh1750Lux:   SensorCallback,
    ) {}

    /** Must be called after WebAssembly.instantiate() to enable string reads */
    setWasmMemory(mem: WebAssembly.Memory) {
        this.wasmMemory = mem;
    }

    /** Inject a simulated digital input value */
    setInputPin(pin: number, value: boolean) {
        this.pinStates.set(pin, value);
    }

    /** Inject a simulated analog input value (0–4095 for ESP32 12-bit ADC) */
    setAnalogPin(pin: number, value: number) {
        this.analogValues.set(pin, value);
    }

    buildImports(): WebAssembly.Imports {
        const self = this;

        // Shared linear memory — exported by the compiled WASM and also provided here
        // so the shim has access before instantiation completes.
        const sharedMemory = new WebAssembly.Memory({ initial: 256, maximum: 512 });

        return {
            env: {
                // ---- Memory (shared with compiled WASM) ----
                memory: sharedMemory,

                // ---- Required wasm32 ABI globals ----
                __stack_pointer: new WebAssembly.Global({ value: 'i32', mutable: true }, 65536 * 4),
                __memory_base:   new WebAssembly.Global({ value: 'i32', mutable: false }, 0),
                __table_base:    new WebAssembly.Global({ value: 'i32', mutable: false }, 0),

                // ---- Digital I/O ----
                pinMode(pin: number, mode: number) {
                    self.pinModes.set(pin, mode);
                },
                digitalWrite(pin: number, value: number) {
                    const b = value !== 0;
                    self.pinStates.set(pin, b);
                    self.onPinChange(pin, b);
                },
                digitalRead(pin: number): number {
                    return self.pinStates.get(pin) ? 1 : 0;
                },

                // ---- Analog I/O ----
                analogRead(pin: number): number {
                    return self.analogValues.get(pin) ?? 0;
                },
                analogWrite(pin: number, value: number) {
                    self.onPinChange(pin, value > 0);
                },
                analogReadResolution(_bits: number) {},
                analogWriteResolution(_bits: number) {},

                // ---- Timing ----
                // delay() cannot block the browser main thread — it is a no-op.
                // millis() / micros() return real elapsed time so timing-based
                // code (e.g. reading millis() to pace a loop) still works correctly.
                delay(_ms: number) {},
                millis(): number {
                    return Math.floor(performance.now() - self.startTimeMs);
                },
                micros(): number {
                    return Math.floor((performance.now() - self.startTimeMs) * 1000);
                },
                delayMicroseconds(_us: number) {},

                // ---- Serial ----
                Serial_begin(_baud: number) {},
                Serial_print_str(ptr: number, len: number) {
                    self.onSerial(self.readStr(ptr, len));
                },
                Serial_println_str(ptr: number, len: number) {
                    self.onSerial(self.readStr(ptr, len) + '\n');
                },
                Serial_print_int(v: number) {
                    self.onSerial(String(v));
                },
                Serial_println_int(v: number) {
                    self.onSerial(String(v) + '\n');
                },
                Serial_print_long(v: number) {
                    self.onSerial(String(v));
                },
                Serial_println_long(v: number) {
                    self.onSerial(String(v) + '\n');
                },
                Serial_print_float(v: number) {
                    self.onSerial(v.toFixed(2));
                },
                Serial_println_float(v: number) {
                    self.onSerial(v.toFixed(2) + '\n');
                },
                Serial_print_char(c: number) {
                    self.onSerial(String.fromCharCode(c));
                },
                Serial_println_char(c: number) {
                    self.onSerial(String.fromCharCode(c) + '\n');
                },
                Serial_println_empty() {
                    self.onSerial('\n');
                },
                Serial_available(): number { return 0; },
                Serial_read(): number { return -1; },
                Serial_flush() {},

                // ---- Wire (I2C) — stubs; HackCable uses sensor callback bridges ----
                Wire_begin_master() {},
                Wire_begin_slave(_addr: number) {},
                Wire_setClock(_freq: number) {},
                Wire_beginTransmission(_addr: number) {},
                Wire_endTransmission(): number { return 0; },
                Wire_endTransmission_stop(_stop: number): number { return 0; },
                Wire_requestFrom(_addr: number, _qty: number): number { return 0; },
                Wire_write_byte(_b: number) {},
                Wire_write_buf(_ptr: number, _len: number) {},
                Wire_read(): number { return 0; },
                Wire_available(): number { return 0; },

                // ---- Native Clang WASM bridge (simulator_core.cpp imports) ----
                js_digitalWrite(pin: number, val: number) {
                    const b = val !== 0;
                    self.pinStates.set(pin, b);
                    self.onPinChange(pin, b);
                },
                js_console_log(msgPtr: number) {
                    self.onSerial(self.readCString(msgPtr) + '\n');
                },

                // ---- HackCable sensor bridge ----
                hackcable_sht31_temp():     number { return self.onSht31Temp(); },
                hackcable_sht31_humidity(): number { return self.onSht31Hum(); },
                hackcable_bh1750_lux():     number { return self.onBh1750Lux(); },
                hackcable_modbus_read(slaveId: number, regAddr: number): number {
                    return self.onModbusRead(slaveId, regAddr);
                },
            }
        };
    }

    private readStr(ptr: number, len: number): string {
        if (!this.wasmMemory || len <= 0) return '';
        try {
            return new TextDecoder().decode(
                new Uint8Array(this.wasmMemory.buffer, ptr, len)
            );
        } catch {
            return '';
        }
    }

    /** Read a null-terminated C string from WASM linear memory */
    private readCString(ptr: number): string {
        if (!this.wasmMemory || ptr <= 0) return '';
        try {
            const mem = new Uint8Array(this.wasmMemory.buffer);
            let end = ptr;
            while (end < mem.length && mem[end] !== 0) end++;
            return new TextDecoder().decode(mem.subarray(ptr, end));
        } catch {
            return '';
        }
    }
}
