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
#define Number(x) (x)
#define SERIAL_8N1 0x800001c
#define WIFI_STA 1
#define WL_CONNECTED 3
#define HTTP_GET 0
#define HTTP_POST 1
#define LSBFIRST 0
#define MSBFIRST 1

typedef bool boolean;
typedef uint8_t byte;
typedef unsigned int word;
typedef void* TaskHandle_t;

class String {
private:
    const char* _value;
public:
    String() : _value("") {}
    String(const char* value) : _value(value ? value : "") {}
    String(char* value) : _value(value ? value : "") {}
    String(char value) : _value("") { (void)value; }
    String(int value, int base = 10) : _value("") { (void)value; (void)base; }
    String(unsigned int value, int base = 10) : _value("") { (void)value; (void)base; }
    String(long value, int base = 10) : _value("") { (void)value; (void)base; }
    String(unsigned long value, int base = 10) : _value("") { (void)value; (void)base; }
    String(float value, int decimals = 2) : _value("") { (void)value; (void)decimals; }
    String(double value, int decimals = 2) : _value("") { (void)value; (void)decimals; }
    const char* c_str() const { return _value; }
    int length() const { return (int)strlen(_value); }
    int toInt() const { return 0; }
    float toFloat() const { return 0.0f; }
    String substring(int /*from*/) const { return String(""); }
    String substring(int /*from*/, int /*to*/) const { return String(""); }
    void toCharArray(char* buffer, unsigned int len) const {
        if (!buffer || len == 0) return;
        size_t copyLen = strlen(_value);
        if (copyLen >= len) copyLen = len - 1;
        memcpy(buffer, _value, copyLen);
        buffer[copyLen] = '\\0';
    }
    operator const char*() const { return _value; }
    String& operator=(const char* value) { _value = value ? value : ""; return *this; }
    String& operator+=(const String& /*other*/) { return *this; }
    String& operator+=(const char* /*other*/) { return *this; }
    String& operator+=(char /*other*/) { return *this; }
    bool operator==(const char* other) const { return strcmp(_value, other ? other : "") == 0; }
    bool operator!=(const char* other) const { return !(*this == other); }
};
inline String operator+(const String& lhs, const String& rhs) { (void)lhs; (void)rhs; return String(""); }
inline String operator+(const String& lhs, const char* rhs) { (void)lhs; (void)rhs; return String(""); }
inline String operator+(const char* lhs, const String& rhs) { (void)lhs; (void)rhs; return String(""); }
inline String operator+(const String& lhs, char rhs) { (void)lhs; (void)rhs; return String(""); }
inline bool operator==(const char* lhs, const String& rhs) { return rhs == lhs; }
inline bool operator!=(const char* lhs, const String& rhs) { return !(rhs == lhs); }

struct _ESPClass {
    uint64_t getEfuseMac() const { return 0x123456789ABCULL; }
};
static _ESPClass ESP;

inline void vTaskDelete(void* /*task*/) {}

inline int sprintf(char* buffer, const char* format, ...) {
    (void)format;
    if (buffer) buffer[0] = '\\0';
    return 0;
}

extern "C" {
    // Digital I/O
    void          pinMode(int pin, int mode);
    void          digitalWrite(int pin, int value);
    int           digitalRead(int pin);

    // Analog I/O
    int           analogRead(int pin);
    void          analogWrite(int pin, int value);
    void          dacWrite(int pin, int value);
    void          analogReadResolution(int bits);
    void          analogWriteResolution(int bits);

    // Timing
    void          delay(unsigned long ms);
    unsigned long millis();
    unsigned long micros();
    void          delayMicroseconds(unsigned long us);
    unsigned long pulseIn(int pin, int value, unsigned long timeout = 1000000UL);

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
    float hackcable_sen55_value(int index);
    int   hackcable_modbus_read(int slaveId, int regAddr);
}

inline int Read4_20mA_MPC3424(int ch) { return analogRead(ch); }
inline int Read4_20mA_MPC3424_map(int ch, int inMin, int inMax, int outMin, int outMax) {
    return map(Read4_20mA_MPC3424(ch), inMin, inMax, outMin, outMax);
}
inline int ReadAnalog_MPC3424(int ch) { return analogRead(ch); }
inline int ReadAnalog_from_MPC3424(int ch, int inMin, int inMax, int outMin, int outMax) {
    return map(ReadAnalog_MPC3424(ch), inMin, inMax, outMin, outMax);
}
inline void publishMessage(const char* /*payload*/) {}
inline byte shiftIn(int /*dataPin*/, int /*clockPin*/, int /*bitOrder*/) { return 0; }
inline void shiftOut(int /*dataPin*/, int /*clockPin*/, int /*bitOrder*/, byte /*value*/) {}

// ---- Serial class ----
struct _SerialClass {
    void begin(int baud) { Serial_begin(baud); }
    void begin(int baud, int /*config*/) { Serial_begin(baud); }
    void begin(int baud, int /*config*/, int /*rx*/, int /*tx*/) { Serial_begin(baud); }

    void print(const char* s)  { if(s) Serial_print_str(s, (int)strlen(s)); }
    void println(const char* s){ if(s) Serial_println_str(s, (int)strlen(s)); else Serial_println_empty(); }
    void print(const String& s) { Serial_print_str(s.c_str(), (int)strlen(s.c_str())); }
    void println(const String& s) { Serial_println_str(s.c_str(), (int)strlen(s.c_str())); }
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
    void print(float v, int /*digits*/) { Serial_print_float(v); }
    void println(float v)      { Serial_println_float(v); }
    void println(float v, int /*digits*/) { Serial_println_float(v); }
    void print(double v)       { Serial_print_float((float)v); }
    void print(double v, int /*digits*/) { Serial_print_float((float)v); }
    void println(double v)     { Serial_println_float((float)v); }
    void println(double v, int /*digits*/) { Serial_println_float((float)v); }
    void println()             { Serial_println_empty(); }
    void flush()               { Serial_flush(); }
    int  available()           { return Serial_available(); }
    int  read()                { return Serial_read(); }
    template<typename... Args> int printf(const char* /*fmt*/, Args... /*args*/) { return 0; }
    template<typename T> void print(const T& /*value*/) {}
    template<typename T> void println(const T& /*value*/) { Serial_println_empty(); }
    operator bool() const      { return true; }
};
static _SerialClass Serial;
static _SerialClass Serial1;
static _SerialClass Serial2;

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
static _WireClass Wire;
`;

export const SHT31_H = `
#pragma once
#include <Arduino.h>

class SHT31 {
public:
    bool begin(uint8_t /*addr*/ = 0x44) { return true; }
    bool read() { return true; }
    float readTemperature() { return hackcable_sht31_temp(); }
    float readHumidity()    { return hackcable_sht31_humidity(); }
    float getTemperature()  { return hackcable_sht31_temp(); }
    float getHumidity()     { return hackcable_sht31_humidity(); }
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
    static const uint8_t CONTINUOUS_HIGH_RES_MODE = BH1750_CONTINUOUS_HIGH_RES_MODE;
    static const uint8_t ONE_TIME_HIGH_RES_MODE = BH1750_ONE_TIME_HIGH_RES_MODE;
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

class ModbusMaster {
private:
    uint8_t _slaveId = 1;
    uint16_t _responseBuffer[64];
public:
    static const uint8_t ku8MBSuccess = 0;
    static const uint8_t ku8MBResponseTimedOut = 0xE2;
    static const uint8_t ku8MBInvalidSlaveID = 0xE0;
    ModbusMaster() {}
    template<typename T> void begin(uint8_t slaveId, T& /*serial*/) { _slaveId = slaveId; }
    void begin(uint8_t slaveId) { _slaveId = slaveId; }

    uint8_t readHoldingRegisters(uint16_t regAddr, uint16_t qty) {
        for (uint16_t i = 0; i < qty && i < 64; i++) {
            _responseBuffer[i] = (uint16_t)hackcable_modbus_read((int)_slaveId, (int)(regAddr + i));
        }
        return ModbusMaster::ku8MBSuccess;
    }
    uint8_t readInputRegisters(uint16_t regAddr, uint16_t qty) {
        return readHoldingRegisters(regAddr, qty);
    }
    uint16_t getResponseBuffer(uint8_t idx) {
        return (idx < 64) ? _responseBuffer[idx] : 0;
    }
    void clearResponseBuffer() {}
    void clearTransmitBuffer() {}
    uint8_t writeSingleRegister(uint16_t /*addr*/, uint16_t /*val*/) { return ModbusMaster::ku8MBSuccess; }
    uint8_t writeMultipleRegisters(uint16_t /*addr*/, uint16_t /*qty*/) { return ModbusMaster::ku8MBSuccess; }
};
`;

export const SENSIRION_I2C_SEN5X_H = `
#pragma once
#include <Arduino.h>
#include <Wire.h>

class SensirionI2CSen5x {
public:
    void begin(_WireClass& /*wire*/) {}
    uint16_t startMeasurement() { return 0; }
    uint16_t readMeasuredValues(
        float& pm1p0,
        float& pm2p5,
        float& pm4p0,
        float& pm10p0,
        float& ambientHumidity,
        float& ambientTemperature,
        float& vocIndex,
        float& noxIndex
    ) {
        pm1p0 = hackcable_sen55_value(0);
        pm2p5 = hackcable_sen55_value(1);
        pm4p0 = hackcable_sen55_value(2);
        pm10p0 = hackcable_sen55_value(3);
        ambientHumidity = hackcable_sen55_value(4);
        ambientTemperature = hackcable_sen55_value(5);
        vocIndex = hackcable_sen55_value(6);
        noxIndex = hackcable_sen55_value(7);
        return 0;
    }
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
#include <RTClib.h>

#define OPEN 1
#define CLOSE 0
#define cannotConnect 0
#define wifiConnected 1
#define serverConnected 2
#define editDeviceWifi 3

static int type_RTC = 1;
static int state_fristTime = 0;
static RTC_DS1307 rtc_HandySense;
static RTC_DS1307 rtc;
static DateTime _now;
static int curentTimer = 0;
static int dayofweek = 0;

static int RelayStatus[4] = {0, 0, 0, 0};
static int ErrorSensor_Status[4] = {0, 0, 0, 0};
static int relay_pin[4] = {0, 0, 0, 0};
static int switch_pin[4] = {0, 0, 0, 0};
static int ErrorSensor_pin[4] = {0, 0, 0, 0};
static int sw_onboard[4] = {36, 39, 34, 35};
static int const_relay_pin[4] = {32, 33, 25, 26};

static int LED_WIFI = 2;
static int LED_SERVER = 12;
static unsigned long eventInterval = 2UL * 1000UL;
static unsigned long eventInterval_brightness = 2UL * 1000UL;
static unsigned long eventInterval_publishData = 60UL * 1000UL;
static int check_sendData_status = 0;
static int check_sendData_toWeb = 0;
static int check_sendData_SoilMinMax = 0;
static int check_sendData_tempMinMax = 0;
static int tpye_lux = 0;
static int buff_count_LED_serverConnected = 0;
static int connectWifiStatus = cannotConnect;
static int check_SetThreshold = 200;
static int ActivethresholdRalay[2] = {0, 1};
static int dayofweekformblock[8] = {0, 1, 2, 3, 4, 5, 6, 7};
static int old_time = 0;

static float temp_from_Sensor = 0.0f;
static float humidity_from_Sensor = 0.0f;
static float lux_from_Sensor = 0.0f;
static float soil_from_Sensor = 0.0f;
static float Max_Soil[4] = {0.0f, 0.0f, 0.0f, 0.0f};
static float Min_Soil[4] = {0.0f, 0.0f, 0.0f, 0.0f};
static float Max_Temp[4] = {0.0f, 0.0f, 0.0f, 0.0f};
static float Min_Temp[4] = {0.0f, 0.0f, 0.0f, 0.0f};

static unsigned int time_open[4][7][3] = {{{0}}};
static unsigned int time_close[4][7][3] = {{{0}}};
static unsigned int statusTimer_open[4] = {1, 1, 1, 1};
static unsigned int statusTimer_close[4] = {1, 1, 1, 1};
static unsigned int status_manual[4] = {0, 0, 0, 0};
static unsigned int statusSoil[4] = {0, 0, 0, 0};
static unsigned int statusTemp[4] = {0, 0, 0, 0};

inline void setPin_Relay(int r1, int r2, int r3, int r4) {
    relay_pin[0] = r1; relay_pin[1] = r2; relay_pin[2] = r3; relay_pin[3] = r4;
    for (int i = 0; i < 4; ++i) {
        pinMode(relay_pin[i], OUTPUT);
        digitalWrite(relay_pin[i], LOW);
    }
}
inline void setPin_SW(int s1, int s2, int s3, int s4) {
    switch_pin[0] = s1; switch_pin[1] = s2; switch_pin[2] = s3; switch_pin[3] = s4;
    for (int i = 0; i < 4; ++i) {
        pinMode(switch_pin[i], INPUT);
    }
}
inline void setPin_ErrorSensor(int e1, int e2, int e3) {
    ErrorSensor_pin[0] = e1; ErrorSensor_pin[1] = e2; ErrorSensor_pin[2] = e3;
    for (int i = 0; i < 3; ++i) {
        pinMode(ErrorSensor_pin[i], OUTPUT);
    }
}
inline void setup_HandySense() {
    rtc.begin();
    rtc_HandySense.begin();
}
inline void loop_HandySense(int soil, int light, int temp, int hum) {
    soil_from_Sensor = (float)soil;
    lux_from_Sensor = (float)light;
    temp_from_Sensor = (float)temp;
    humidity_from_Sensor = (float)hum;
}
inline void read_RTC(int /*RTC_ch*/) {
    _now = rtc.now();
    curentTimer = (_now.hour() * 60) + _now.minute();
    dayofweek = _now.dayOfTheWeek() - 1;
    if (dayofweek < 0) dayofweek = 0;
}
inline int get_curentTimer() {
    read_RTC(type_RTC);
    return curentTimer;
}
inline int analog_to_percent(int raw) { return map(raw, 0, 4095, 0, 100); }
inline void sent_dataTimer(String /*topic*/, String /*message*/) {}
inline void UpdateData_To_Server() {}
inline void sendStatus_RelaytoWeb() {}
inline void send_soilMinMax() {}
inline void send_tempMinMax() {}
inline void Open_relay(int ch) {
    if (ch >= 0 && ch < 4) {
        RelayStatus[ch] = OPEN;
        const int pin = relay_pin[ch] != 0 ? relay_pin[ch] : const_relay_pin[ch];
        digitalWrite(pin, HIGH);
        check_sendData_status = 1;
    }
}
inline void Close_relay(int ch) {
    if (ch >= 0 && ch < 4) {
        RelayStatus[ch] = CLOSE;
        const int pin = relay_pin[ch] != 0 ? relay_pin[ch] : const_relay_pin[ch];
        digitalWrite(pin, LOW);
        check_sendData_status = 1;
    }
}
`;

export const MCP23008_H = `
#pragma once
#include <Arduino.h>

class MCP23008 {
private:
    static const int _LED_PINS[8];
    static const int _RELAY_PINS[4];
    uint8_t _addr;
public:
    MCP23008(uint8_t addr = 0x24) : _addr(addr) {}
    void begin() {}
    void pinMode8(uint8_t /*mode*/) {}
    void digitalWrite(uint8_t pin, uint8_t val) {
        if (pin < 8) ::digitalWrite(_LED_PINS[pin], val);
        if (pin < 4) ::digitalWrite(_RELAY_PINS[pin], val);
    }
    uint8_t digitalRead(uint8_t pin) {
        return (pin < 8) ? (uint8_t)::digitalRead(_LED_PINS[pin]) : 0;
    }
    void write(uint8_t pin, uint8_t val) { digitalWrite(pin, val); }
};
const int MCP23008::_LED_PINS[8] = {2, 5, 18, 19, 21, 22, 23, 27};
const int MCP23008::_RELAY_PINS[4] = {25, 4, 12, 13};
`;

export const SERVO_H = `
#pragma once
#include <Arduino.h>

class Servo {
public:
    Servo() {}
    uint8_t attach(int /*pin*/) { return 1; }
    void write(int /*angle*/) {}
};
`;

export const GROVE_LED_BAR_H = `
#pragma once
#include <Arduino.h>

class Grove_LED_Bar {
public:
    Grove_LED_Bar(int /*clk*/, int /*dio*/, int /*orientation*/ = 0) {}
    void begin() {}
    void setLevel(int /*level*/) {}
};
`;

export const TM1637DISPLAY_H = `
#pragma once
#include <Arduino.h>

class TM1637Display {
public:
    TM1637Display(int /*clk*/, int /*dio*/) {}
    void setBrightness(uint8_t /*brightness*/, bool /*on*/ = true) {}
    void showNumberDec(int /*num*/, bool /*leadingZero*/ = false, uint8_t /*length*/ = 4, uint8_t /*pos*/ = 0) {}
};
`;

export const LIQUID_CRYSTAL_I2C_H = `
#pragma once
#include <Arduino.h>

class LiquidCrystal_I2C {
public:
    LiquidCrystal_I2C(uint8_t /*addr*/, uint8_t /*cols*/, uint8_t /*rows*/) {}
    void init() {}
    void begin(uint8_t /*cols*/ = 16, uint8_t /*rows*/ = 2) {}
    void backlight() {}
    void clear() {}
    void setCursor(uint8_t /*col*/, uint8_t /*row*/) {}
    void print(const char* value) { Serial.print(value); }
    void print(const String& value) { Serial.print(value); }
    void print(int value) { Serial.print(value); }
    void print(float value) { Serial.print(value); }
    template<typename T> void print(const T& /*value*/) {}
};
`;

export const RTCLIB_H = `
#pragma once
#include <Arduino.h>

class DateTime {
public:
    DateTime() {}
    DateTime(int /*year*/, int /*month*/, int /*day*/, int /*hour*/ = 0, int /*minute*/ = 0, int /*second*/ = 0) {}
    int second() const { return 0; }
    int minute() const { return 0; }
    int hour() const { return 0; }
    int day() const { return 1; }
    int month() const { return 1; }
    int year() const { return 2026; }
    int dayOfTheWeek() const { return 1; }
};

class RTC_DS1307 {
public:
    bool begin() { return true; }
    DateTime now() const { return DateTime(); }
    void adjust(const DateTime& /*dt*/) {}
};
class RTC_DS3231 : public RTC_DS1307 {};
class RTC_DS1388 : public RTC_DS1307 {};
`;

export const WIFI_H = `
#pragma once
#include <Arduino.h>

class IPAddress {
public:
    String toString() const { return String("0.0.0.0"); }
};

class WiFiClass {
public:
    void mode(int /*mode*/) {}
    void begin(const char* /*ssid*/, const char* /*pass*/ = "") {}
    bool softAP(const char* /*ssid*/, const char* /*pass*/ = "") { return true; }
    int status() { return WL_CONNECTED; }
    IPAddress localIP() { return IPAddress(); }
    IPAddress softAPIP() { return IPAddress(); }
};

static WiFiClass WiFi;
`;

export const WIFI_CLIENT_H = `
#pragma once
#include <Arduino.h>
class WiFiClient {};
`;

export const WEB_SERVER_H = `
#pragma once
#include <Arduino.h>

class WebServer {
public:
    WebServer(int /*port*/ = 80) {}
    template<typename Handler> void on(const char* /*path*/, Handler /*handler*/) {}
    template<typename Handler> void on(const char* /*path*/, int /*method*/, Handler /*handler*/) {}
    void begin() {}
    void handleClient() {}
    int args() { return 0; }
    String argName(int /*index*/) { return String(""); }
    String arg(int /*index*/) { return String(""); }
    String arg(const String& /*name*/) { return String(""); }
    void send(int /*code*/, const char* /*type*/, const char* /*body*/) {}
    void send(int /*code*/, const char* /*type*/, const String& /*body*/) {}
};
`;

export const ADAFRUIT_NEOPIXEL_H = `
#pragma once
#include <Arduino.h>

#define NEO_GRB 0x01
#define NEO_KHZ800 0x02

class Adafruit_NeoPixel {
public:
    Adafruit_NeoPixel(int /*count*/, int /*pin*/, int /*flags*/ = NEO_GRB + NEO_KHZ800) {}
    void begin() {}
    void show() {}
    void clear() {}
    void setBrightness(uint8_t /*brightness*/) {}
    uint32_t Color(uint8_t r, uint8_t g, uint8_t b) { return ((uint32_t)r << 16) | ((uint32_t)g << 8) | b; }
    void setPixelColor(int /*index*/, uint32_t /*color*/) {}
};
`;

export const BLUETOOTH_SERIAL_H = `
#pragma once
#include <Arduino.h>

class BluetoothSerial {
public:
    bool begin(const char* /*name*/) { return true; }
    int available() { return 0; }
    int read() { return -1; }
    String readStringUntil(char /*terminator*/) { return String(""); }
    void print(const String& value) { Serial.print(value); }
    void print(const char* value) { Serial.print(value); }
    void println(const String& value) { Serial.println(value); }
    void println(const char* value) { Serial.println(value); }
};
`;

export const BFARM_TIME_H = `
#pragma once
#include <Arduino.h>

class BFarmTime {
public:
    void sync() {}
    int getYear() { return 2026; }
    int getMonth() { return 1; }
    int getDayOfMonth() { return 1; }
    int getDayOfWeek() { return 1; }
    int getHour() { return 0; }
    int getMinute() { return 0; }
    int getSecond() { return 0; }
};
`;

export const BFARM_EVENT_H = `
#pragma once
#include <Arduino.h>

struct BFarmEventType {
    static const int EVERY = 1;
    static const int ONCE = 2;
    static const int TASK = 3;
    static const int RISING = 4;
    static const int FALLING = 5;
    static const int CHANGE = 6;
};

class BFarmEvent {
public:
    template<typename Handler>
    void attach(const char* /*name*/, int /*type*/, Handler /*handler*/, unsigned long /*interval*/, int /*stack*/ = 0) {}
    template<typename Handler>
    void attach(const char* /*name*/, int /*type*/, Handler /*handler*/, int /*pin*/, int /*stack*/) {}
    void detach(const char* /*name*/) {}
    void detach(int /*pin*/) {}
};
`;

export const CJOB_H = `
#pragma once
#include <Arduino.h>

typedef int CronID_t;

class _CronClass {
public:
    CronID_t create(const char* /*expr*/, void (*/*callback*/)(), bool /*runNow*/ = false) { return 1; }
    template<typename Handler> CronID_t create(const char* /*expr*/, Handler /*callback*/, bool /*runNow*/ = false) { return 1; }
    void enable(CronID_t /*id*/) {}
    void disable(CronID_t /*id*/) {}
    void free(CronID_t /*id*/) {}
    void delay() {}
};

static _CronClass Cron;
`;

export const MQTT_CLIENT_H = `
#pragma once
#include <Arduino.h>

class _NetpieClient {
public:
    void setServer(const char* /*server*/, int /*port*/) {}
    template<typename Handler> void setCallback(Handler /*handler*/) {}
    bool connected() { return true; }
    bool connect(const char* /*clientId*/) { return true; }
    bool connect(const char* /*clientId*/, const char* /*username*/, const char* /*password*/) { return true; }
    bool subscribe(const char* /*topic*/) { return true; }
    int state() { return 0; }
    void loop() {}
};

static _NetpieClient Netpieclient;
static _NetpieClient client;
inline void setupMQTT() {}
`;

export const PUB_TOPIC_H = `
#pragma once
#include <Arduino.h>

inline void pub_topic(const char* /*topic*/, float /*value*/) {}
inline void pub_topic(const char* /*topic*/, int /*value*/) {}
inline void pub_topic(const char* /*topic*/, const char* /*value*/) {}
inline void pub_topic(const char* /*topic*/, const String& /*value*/) {}
`;

export const THINGSPEAK_WRITER_H = `
#pragma once
#include <Arduino.h>
class ThingSpeakWriter_asukiaaa {
public:
    ThingSpeakWriter_asukiaaa(const char* /*apiKey*/ = "") {}
    void setField(int /*field*/, const String& /*value*/) {}
    void setField(int /*field*/, const char* /*value*/) {}
    void setField(int /*field*/, float /*value*/) {}
    int writeFields() { return 200; }
};
`;

export const FERTILIZER_H = `
#pragma once
#include <Arduino.h>
#include <Preferences.h>

static Preferences preferences;
static float calTemp = 25;
static float calPH4 = 1500;
static float calPH7 = 2000;
static float calPH10 = 2500;
static float PHthresh_min = 5.8;
static float PHthresh_max = 6.6;
static int calEC0 = 100;
static int calEC1413 = 1300;
static int ECthresh_min = 900;
static int PHdura_value = 0;
static int ECdura_value = 0;

inline void load_preferences() {}
inline void set_preferences() {}
inline void clear_preferences() {}
inline void print_config() {}
inline float PHcompute(int adc) { return adc / 1000.0f; }
inline float Tempcompute(int adc) { return adc / 100.0f; }
inline int ECcompute(int adc, int /*tempAdc*/) { return adc; }
inline void control_pH(float /*ph*/) {}
inline void control_EC(int /*ec*/) {}
`;

export const GETCHIP_H = `
#pragma once
#include <Arduino.h>
extern uint32_t chip_id;
inline void setup_chipid() {}
inline void setup_chipid(const char* /*owner*/) {}
inline void loop_chipid() {}
inline void loop_chipid(const char* /*owner*/) {}
`;

export const TIME_UTILITY_H = `
#pragma once
#include <RTClib.h>
inline void set_system_time(int /*year*/, int /*month*/, int /*day*/, int /*hour*/, int /*minute*/, int /*second*/) {}
`;

export const RTC_DS1388_H = `
#pragma once
#include <RTClib.h>
inline int get_rtc_weekday() { return 1; }
`;

export const RTC2_H = `
#pragma once
#include <RTClib.h>
`;

export const MAGELLAN_WIFI_SETTING_H = `
#pragma once
#include <Arduino.h>
struct MagellanWiFiSetting {
    String SSID;
    String PASS;
};
static MagellanWiFiSetting WiFiSetting;
template<typename Setting> inline void connectWiFi(Setting& /*setting*/) {}
template<typename Magellan> inline void reconnectWiFi(Magellan& /*magellan*/) {}
`;

export const MAGELLAN_MQTT_H = `
#pragma once
#include <Arduino.h>
#include <WiFiClient.h>

#define PLAINTEXT 0
#define RESP_REPORT_JSON 0
static const int defaultOTABuffer = 1024;

struct EVENTS {
    int CODE;
    String RESP;
};

struct MagellanSetting {
    String endpoint;
    String ThingIdentifier;
    String ThingSecret;
    int clientBufferSize;
};
static MagellanSetting setting;

class _MagellanValueBag {
public:
    void add(const char* /*key*/, const char* /*value*/) {}
    void add(const char* /*key*/, const String& /*value*/) {}
    void add(const char* /*key*/, int /*value*/) {}
    void add(const char* /*key*/, float /*value*/) {}
    void add(const char* /*key*/, bool /*value*/) {}
    void report() {}
    void save() {}
};

class _MagellanSubscribeReport {
public:
    void response() {}
};

class _MagellanSubscribe {
public:
    _MagellanSubscribeReport report;
    void serverConfig(int /*mode*/) {}
    void control(int /*mode*/) {}
};

class _MagellanControl {
public:
    void ACK(const String& /*key*/, const String& /*value*/) {}
    void request(const char* /*key*/) {}
};

class _MagellanServerConfig {
public:
    void request(const char* /*key*/) {}
};

class _MagellanOTA {
public:
    void autoUpdate(bool /*enabled*/) {}
    bool getAutoUpdate() { return false; }
    void checkUpdate() {}
    void executeUpdate() {}
};

class MAGELLAN_MQTT {
public:
    _MagellanValueBag sensor;
    _MagellanValueBag clientConfig;
    _MagellanSubscribe subscribe;
    _MagellanControl control;
    _MagellanServerConfig serverConfig;
    _MagellanOTA OTA;

    MAGELLAN_MQTT(WiFiClient& /*client*/) {}
    void begin(const MagellanSetting& /*setting*/) {}
    void loop() {}
    bool isConnected() { return true; }
    void reconnect() {}
    template<typename Handler> void subscribes(Handler handler) { handler(); }
    template<typename Handler> void interval(unsigned long /*ms*/, Handler handler) { handler(); }
    template<typename Handler> void getControl(Handler handler) { handler(String(""), String("")); }
    template<typename Handler> void getServerConfig(Handler handler) { handler(String(""), String("")); }
    template<typename Handler> void getResponse(int /*type*/, Handler handler) { handler(EVENTS()); }
};
`;

export const TIME_H = `
#pragma once
typedef long long time_t;
struct tm {
    int tm_sec;
    int tm_min;
    int tm_hour;
    int tm_mday;
    int tm_mon;
    int tm_year;
    int tm_wday;
};
inline void configTime(long /*gmtOffset*/, int /*dstOffset*/, const char* /*server1*/, const char* /*server2*/ = 0) {}
inline bool getLocalTime(struct tm* info) {
    if (!info) return false;
    info->tm_sec = 0;
    info->tm_min = 0;
    info->tm_hour = 0;
    info->tm_mday = 1;
    info->tm_mon = 0;
    info->tm_year = 126;
    info->tm_wday = 1;
    return true;
}
`;

export const SOC_H = `
#pragma once
#define WRITE_PERI_REG(reg, value) do { (void)(reg); (void)(value); } while (0)
`;

export const SOC_RTC_CNTL_REG_H = `
#pragma once
#define RTC_CNTL_BROWN_OUT_REG 0
`;

/** Returns the full virtual filesystem for Clang's MEMFS */
export function getArduinoHeaders(): Record<string, string> {
    return {
        'Arduino.h':       ARDUINO_H,
        'Wire.h':          WIRE_H,
        'SHT31.h':         SHT31_H,
        'BH1750.h':        BH1750_H,
        'SensirionI2CSen5x.h': SENSIRION_I2C_SEN5X_H,
        'ModbusMaster.h':  MODBUS_MASTER_H,
        'Preferences.h':   PREFERENCES_H,
        'HandySense.h':    HANDYSENSE_H,
        'MCP23008.h':      MCP23008_H,
        'Servo.h':         SERVO_H,
        'Grove_LED_Bar.h': GROVE_LED_BAR_H,
        'TM1637Display.h': TM1637DISPLAY_H,
        'LiquidCrystal_I2C.h': LIQUID_CRYSTAL_I2C_H,
        'RTClib.h':        RTCLIB_H,
        'WiFi.h':          WIFI_H,
        'WiFiClient.h':    WIFI_CLIENT_H,
        'WebServer.h':     WEB_SERVER_H,
        'Adafruit_NeoPixel.h': ADAFRUIT_NEOPIXEL_H,
        'BluetoothSerial.h': BLUETOOTH_SERIAL_H,
        'BFarmTime.h':     BFARM_TIME_H,
        'BFarmEvent.h':    BFARM_EVENT_H,
        'cjob.h':          CJOB_H,
        'mqtt_client.h':   MQTT_CLIENT_H,
        'pub_topic.h':     PUB_TOPIC_H,
        'ThingSpeakWriter_asukiaaa.h': THINGSPEAK_WRITER_H,
        'fertilizer.h':    FERTILIZER_H,
        'getchip.h':       GETCHIP_H,
        'time_utility.h':  TIME_UTILITY_H,
        'rtc_ds1388.h':    RTC_DS1388_H,
        'RTC2.h':          RTC2_H,
        'MAGELLAN_MQTT.h': MAGELLAN_MQTT_H,
        'MAGELLAN_WiFi_SETTING.h': MAGELLAN_WIFI_SETTING_H,
        'time.h':          TIME_H,
        'soc/soc.h':       SOC_H,
        'soc/rtc_cntl_reg.h': SOC_RTC_CNTL_REG_H,
    };
}
