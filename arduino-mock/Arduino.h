#ifndef ARDUINO_H
#define ARDUINO_H

#include <emscripten.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

typedef unsigned char byte;
typedef bool boolean;

#define HIGH 1
#define LOW  0
#define INPUT     0
#define OUTPUT    1
#define INPUT_PULLUP 2

EM_JS(void, pinMode, (int pin, int mode), {
    if (typeof window.hackcable_pin_mode === 'function')
        window.hackcable_pin_mode(pin, mode);
});

EM_JS(void, digitalWrite, (int pin, int val), {
    if (typeof window.hackcable_update_pin === 'function')
        window.hackcable_update_pin(pin, val !== 0);
});

EM_JS(int, digitalRead, (int pin), {
    if (typeof window.hackcable_read_pin === 'function')
        return window.hackcable_read_pin(pin) ? 1 : 0;
    return 0;
});

EM_JS(int, analogRead, (int pin), {
    if (typeof window.hackcable_analog_read === 'function')
        return window.hackcable_analog_read(pin) | 0;
    return 0;
});

EM_JS(void, analogWrite, (int pin, int val), {
    if (typeof window.hackcable_update_pin === 'function')
        window.hackcable_update_pin(pin, val > 127);
});

// delay() suspends WASM via Asyncify — MUST be in ASYNCIFY_IMPORTS
EM_JS(void, delay, (int ms), {
    Asyncify.handleAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, ms));
    });
});

EM_JS(long, millis, (), { return Date.now() | 0; });

// Serial (EM_JS cannot be overloaded, so separate C functions + C++ class wrapper)
EM_JS(void, _serial_begin, (int baud), {
    if (typeof window.hackcable_serial_begin === 'function')
        window.hackcable_serial_begin(baud);
});
EM_JS(void, _serial_print_int, (int v, int nl), {
    var t = v.toString() + (nl ? "\n" : "");
    if (typeof window.hackcable_serial_data === "function") window.hackcable_serial_data(t);
});
EM_JS(void, _serial_print_dbl, (double v, int nl), {
    var t = v.toFixed(2) + (nl ? "\n" : "");
    if (typeof window.hackcable_serial_data === "function") window.hackcable_serial_data(t);
});
EM_JS(void, _serial_print_str, (const char* p, int nl), {
    var t = UTF8ToString(p) + (nl ? "\n" : "");
    if (typeof window.hackcable_serial_data === "function") window.hackcable_serial_data(t);
});

// ── Arduino String class ──────────────────────────────────────────────────────
class String {
    char _buf[512];
public:
    String()                    { _buf[0] = '\0'; }
    String(const char* s)       { strncpy(_buf, s ? s : "", 511); _buf[511] = '\0'; }
    String(int v, int base = 10){ snprintf(_buf, sizeof(_buf), "%d", v); }
    String(long v)              { snprintf(_buf, sizeof(_buf), "%ld", v); }
    String(unsigned int v)      { snprintf(_buf, sizeof(_buf), "%u", v); }
    String(float v, int dec = 2){
        char fmt[12]; snprintf(fmt, sizeof(fmt), "%%.%df", dec);
        snprintf(_buf, sizeof(_buf), fmt, (double)v);
    }
    String(double v, int dec = 2){
        char fmt[12]; snprintf(fmt, sizeof(fmt), "%%.%df", dec);
        snprintf(_buf, sizeof(_buf), fmt, v);
    }
    String(bool v)              { strcpy(_buf, v ? "1" : "0"); }

    const char* c_str()  const { return _buf; }
    int         length() const { return (int)strlen(_buf); }

    String operator+(const String& o) const {
        String r(*this);
        strncat(r._buf, o._buf, 511 - strlen(r._buf));
        r._buf[511] = '\0';
        return r;
    }
    String operator+(const char* s) const {
        String r(*this);
        strncat(r._buf, s, 511 - strlen(r._buf));
        r._buf[511] = '\0';
        return r;
    }
    String& operator+=(const String& o) {
        strncat(_buf, o._buf, 511 - strlen(_buf));
        _buf[511] = '\0';
        return *this;
    }
    String& operator+=(const char* s) {
        strncat(_buf, s, 511 - strlen(_buf));
        _buf[511] = '\0';
        return *this;
    }
    operator const char*() const { return _buf; }
    bool operator==(const char* s) const { return strcmp(_buf, s) == 0; }
};

inline String operator+(const char* a, const String& b) {
    return String(a) + b;
}
// ─────────────────────────────────────────────────────────────────────────────

class HackCableSerial {
public:
    void begin(int b)               { _serial_begin(b); }
    void print(int v)               { _serial_print_int(v, 0); }
    void print(double v)            { _serial_print_dbl(v, 0); }
    void print(const char* s)       { _serial_print_str(s, 0); }
    void print(const String& s)     { _serial_print_str(s.c_str(), 0); }
    void println(int v)             { _serial_print_int(v, 1); }
    void println(double v)          { _serial_print_dbl(v, 1); }
    void println(const char* s)     { _serial_print_str(s, 1); }
    void println(const String& s)   { _serial_print_str(s.c_str(), 1); }
    void println()                  { _serial_print_str("", 1); }

    template<typename... Args>
    void printf(const char* fmt, Args... args) {
        char buf[512];
        snprintf(buf, sizeof(buf), fmt, args...);
        _serial_print_str(buf, 0);
    }
};
HackCableSerial Serial;

#define SERIAL_8N1 ((uint32_t)0x800001c)

// HardwareSerial mock (Serial2 used with RS485/ModbusMaster)
class HardwareSerial {
public:
    void begin(int baud) {}
    void begin(int baud, uint32_t config, int rx, int tx) {}
    int available() { return 0; }
    int read() { return -1; }
    void write(uint8_t b) {}
    void flush() {}
};
static HardwareSerial Serial2;

// configTime stub (NTP sync — no-op in Emscripten)
inline void configTime(long gmtOffset_sec, int daylightOffset_sec, const char* server1,
                       const char* server2 = nullptr, const char* server3 = nullptr) {}

#endif
