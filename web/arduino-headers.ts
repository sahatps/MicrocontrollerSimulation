/**
 * Virtual Arduino/ESP32 headers for Clang/LLVM WASM compilation.
 * These are injected into the in-browser Clang's MEMFS as virtual files.
 *
 * Design: All C++ class methods (Serial.println, Wire.write, etc.) delegate
 * to `extern "C"` functions so Clang produces predictable, unmangled import
 * names that the ArduinoWasmShim can supply as WebAssembly imports.
 */

export const ARDUINO_H = `
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <math.h>

#define HIGH 1
#define LOW  0
#define OUTPUT 1
#define INPUT  0
#define INPUT_PULLUP 2
#define LED_BUILTIN 2
#define PI 3.14159265358979323846
#define DEG_TO_RAD (PI / 180.0)
#define RAD_TO_DEG (180.0 / PI)
#define min(a,b) ((a)<(b)?(a):(b))
#define max(a,b) ((a)>(b)?(a):(b))
#define abs(x) ((x)>0?(x):-(x))
#define constrain(x,a,b) ((x)<(a)?(a):((x)>(b)?(b):(x)))
#define map(v,fl,fh,tl,th) ((v-fl)*(th-tl)/(fh-fl)+tl)
#define sq(x) ((x)*(x))
#define bitRead(v,b) (((v)>>(b))&0x01)
#define bitSet(v,b) ((v)|=(1UL<<(b)))
#define bitClear(v,b) ((v)&=~(1UL<<(b)))
#define bitWrite(v,b,x) ((x)?bitSet(v,b):bitClear(v,b))
#define bit(b) (1UL<<(b))
#define PROGMEM
#define pgm_read_byte(p) (*((const uint8_t*)(p)))
#define F(s) (s)

typedef bool boolean;
typedef uint8_t byte;
typedef unsigned int word;

extern "C" {
    // Digital I/O
    void          pinMode(int pin, int mode);
    void          digitalWrite(int pin, int value);
    int           digitalRead(int pin);

    // Analog I/O
    int           analogRead(int pin);
    void          analogWrite(int pin, int value);
    void          analogReadResolution(int bits);
    void          analogWriteResolution(int bits);

    // Timing
    void          delay(unsigned long ms);
    unsigned long millis();
    unsigned long micros();
    void          delayMicroseconds(unsigned long us);

    // Serial shim (extern "C" so names are unmangled)
    void Serial_begin(int baud);
    void Serial_print_str(const char* s, int len);
    void Serial_println_str(const char* s, int len);
    void Serial_print_int(int v);
    void Serial_println_int(int v);
    void Serial_print_long(long v);
    void Serial_println_long(long v);
    void Serial_print_float(float v);
    void Serial_println_float(float v);
    void Serial_print_char(char c);
    void Serial_println_char(char c);
    void Serial_println_empty();
    int  Serial_available();
    int  Serial_read();
    void Serial_flush();

    // Wire (I2C) shim
    void Wire_begin_master();
    void Wire_begin_slave(int addr);
    void Wire_beginTransmission(int addr);
    int  Wire_endTransmission();
    int  Wire_endTransmission_stop(int stop);
    int  Wire_requestFrom(int addr, int quantity);
    void Wire_write_byte(int b);
    void Wire_write_buf(const uint8_t* buf, int len);
    int  Wire_read();
    int  Wire_available();
    void Wire_setClock(unsigned long freq);

    // HackCable sensor bridge functions (called from sensor library stubs)
    float hackcable_sht31_temp();
    float hackcable_sht31_humidity();
    float hackcable_bh1750_lux();
    int   hackcable_modbus_read(int slaveId, int regAddr);
}

// ---- Serial class ----
struct _SerialClass {
    void begin(int baud) { Serial_begin(baud); }
    void begin(int baud, int /*config*/) { Serial_begin(baud); }

    void print(const char* s)  { if(s) Serial_print_str(s, (int)strlen(s)); }
    void println(const char* s){ if(s) Serial_println_str(s, (int)strlen(s)); else Serial_println_empty(); }
    void print(char c)         { Serial_print_char(c); }
    void println(char c)       { Serial_println_char(c); }
    void print(int v)          { Serial_print_int(v); }
    void println(int v)        { Serial_println_int(v); }
    void print(unsigned int v) { Serial_print_int((int)v); }
    void println(unsigned int v){ Serial_println_int((int)v); }
    void print(long v)         { Serial_print_long(v); }
    void println(long v)       { Serial_println_long(v); }
    void print(unsigned long v){ Serial_print_long((long)v); }
    void println(unsigned long v){ Serial_println_long((long)v); }
    void print(float v)        { Serial_print_float(v); }
    void println(float v)      { Serial_println_float(v); }
    void print(double v)       { Serial_print_float((float)v); }
    void println(double v)     { Serial_println_float((float)v); }
    void println()             { Serial_println_empty(); }
    void flush()               { Serial_flush(); }
    int  available()           { return Serial_available(); }
    int  read()                { return Serial_read(); }
    operator bool() const      { return true; }
};
extern _SerialClass Serial;
extern _SerialClass Serial1;

// Force setup() and loop() to have C linkage so wasm-ld can export them
// as unmangled 'setup' and 'loop' symbols (not C++ mangled _Z5setupv etc.).
extern "C" {
    void setup();
    void loop();
}

// ---- Wire (I2C) class ----
struct _WireClass {
    void begin()                     { Wire_begin_master(); }
    void begin(int addr)             { Wire_begin_slave(addr); }
    void setClock(unsigned long f)   { Wire_setClock(f); }
    void beginTransmission(int addr) { Wire_beginTransmission(addr); }
    void beginTransmission(uint8_t addr){ Wire_beginTransmission((int)addr); }
    int  endTransmission()           { return Wire_endTransmission(); }
    int  endTransmission(bool stop)  { return Wire_endTransmission_stop((int)stop); }
    int  requestFrom(int addr, int qty){ return Wire_requestFrom(addr, qty); }
    int  requestFrom(uint8_t a, uint8_t q){ return Wire_requestFrom((int)a,(int)q); }
    void write(uint8_t b)            { Wire_write_byte((int)b); }
    void write(int b)                { Wire_write_byte(b); }
    void write(const uint8_t* buf, int len){ Wire_write_buf(buf, len); }
    int  read()                      { return Wire_read(); }
    int  available()                 { return Wire_available(); }
};
extern _WireClass Wire;
`;

export const SHT31_H = `
#pragma once
#include <Arduino.h>

class SHT31 {
public:
    bool begin(uint8_t /*addr*/ = 0x44) { return true; }
    float readTemperature() { return hackcable_sht31_temp(); }
    float readHumidity()    { return hackcable_sht31_humidity(); }
    bool heater(bool /*on*/) { return true; }
    bool isHeaterEnabled() { return false; }
};
`;

export const BH1750_H = `
#pragma once
#include <Arduino.h>

#define BH1750_CONTINUOUS_HIGH_RES_MODE 0x10
#define BH1750_ONE_TIME_HIGH_RES_MODE   0x20

class BH1750 {
public:
    BH1750(uint8_t /*addr*/ = 0x23) {}
    bool begin(uint8_t /*mode*/ = BH1750_CONTINUOUS_HIGH_RES_MODE,
               uint8_t /*addr*/ = 0x23) { return true; }
    void configure(uint8_t /*mode*/) {}
    float readLightLevel() { return hackcable_bh1750_lux(); }
    bool measurementReady(bool /*maxWait*/ = false) { return true; }
};
`;

export const MODBUS_MASTER_H = `
#pragma once
#include <Arduino.h>

#define ku8MBSuccess 0
#define ku8MBResponseTimedOut 0xE2
#define ku8MBInvalidSlaveID   0xE0

class ModbusMaster {
private:
    uint8_t _slaveId = 1;
    uint16_t _responseBuffer[64];
public:
    ModbusMaster() {}
    void begin(uint8_t slaveId, /*Stream&*/ int /*serial*/) { _slaveId = slaveId; }
    void begin(uint8_t slaveId) { _slaveId = slaveId; }

    uint8_t readHoldingRegisters(uint16_t regAddr, uint16_t qty) {
        for (uint16_t i = 0; i < qty && i < 64; i++) {
            _responseBuffer[i] = (uint16_t)hackcable_modbus_read((int)_slaveId, (int)(regAddr + i));
        }
        return ku8MBSuccess;
    }
    uint8_t readInputRegisters(uint16_t regAddr, uint16_t qty) {
        return readHoldingRegisters(regAddr, qty);
    }
    uint16_t getResponseBuffer(uint8_t idx) {
        return (idx < 64) ? _responseBuffer[idx] : 0;
    }
    void clearResponseBuffer() {}
    void clearTransmitBuffer() {}
    uint8_t writeSingleRegister(uint16_t /*addr*/, uint16_t /*val*/) { return ku8MBSuccess; }
    uint8_t writeMultipleRegisters(uint16_t /*addr*/, uint16_t /*qty*/) { return ku8MBSuccess; }
};
`;

export const PREFERENCES_H = `
#pragma once
// Stub for ESP32 Preferences library
class Preferences {
public:
    bool begin(const char* /*ns*/, bool /*readOnly*/ = false) { return true; }
    void end() {}
    float getFloat(const char* /*key*/, float def = 0.0f) { return def; }
    int   getInt(const char* /*key*/, int def = 0) { return def; }
    bool  putFloat(const char* /*key*/, float /*val*/) { return true; }
    bool  putInt(const char* /*key*/, int /*val*/) { return true; }
    bool  isKey(const char* /*key*/) { return false; }
};
`;

export const WIRE_H = `
#pragma once
#include <Arduino.h>
// Wire class (_WireClass) and Wire object are defined in Arduino.h
`;

export const HANDYSENSE_H = `
#pragma once
#include <Arduino.h>

inline void setPin_Relay(int r1, int r2, int r3, int r4) {
    pinMode(r1, OUTPUT); pinMode(r2, OUTPUT);
    pinMode(r3, OUTPUT); pinMode(r4, OUTPUT);
}
inline void setPin_SW(int s1, int s2, int s3, int s4) {
    pinMode(s1, INPUT); pinMode(s2, INPUT);
    pinMode(s3, INPUT); pinMode(s4, INPUT);
}
inline void setPin_ErrorSensor(int e1, int e2, int e3) {
    pinMode(e1, OUTPUT); pinMode(e2, OUTPUT); pinMode(e3, OUTPUT);
}
`;

export const MCP23008_H = `
#pragma once
#include <Arduino.h>

class MCP23008 {
private:
    static const int _RELAY_PINS[4];
    uint8_t _addr;
public:
    MCP23008(uint8_t addr = 0x24) : _addr(addr) {}
    void begin() {}
    void pinMode8(uint8_t /*mode*/) {}
    void digitalWrite(uint8_t pin, uint8_t val) {
        if (pin < 4) ::digitalWrite(_RELAY_PINS[pin], val);
    }
    uint8_t digitalRead(uint8_t pin) {
        return (pin < 4) ? (uint8_t)::digitalRead(_RELAY_PINS[pin]) : 0;
    }
    void write(uint8_t pin, uint8_t val) { digitalWrite(pin, val); }
};
const int MCP23008::_RELAY_PINS[4] = {25, 4, 12, 13};
`;

/** Returns the full virtual filesystem for Clang's MEMFS */
export function getArduinoHeaders(): Record<string, string> {
    return {
        'Arduino.h':       ARDUINO_H,
        'Wire.h':          WIRE_H,
        'SHT31.h':         SHT31_H,
        'BH1750.h':        BH1750_H,
        'ModbusMaster.h':  MODBUS_MASTER_H,
        'Preferences.h':   PREFERENCES_H,
        'HandySense.h':    HANDYSENSE_H,
        'MCP23008.h':      MCP23008_H,
    };
}
