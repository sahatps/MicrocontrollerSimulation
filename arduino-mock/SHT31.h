#ifndef SHT31_H
#define SHT31_H

#include "Arduino.h"

// SHT31 / Adafruit_SHT31 mock for Emscripten compilation
// Bridges I2C temperature & humidity reads to JS via window.hackcable_sht31_*

EM_JS(double, _sht31_get_temperature, (), {
    if (typeof window.hackcable_sht31_temp === 'function')
        return window.hackcable_sht31_temp();
    return 25.0;
});

EM_JS(double, _sht31_get_humidity, (), {
    if (typeof window.hackcable_sht31_humidity === 'function')
        return window.hackcable_sht31_humidity();
    return 60.0;
});

class SHT31 {
public:
    bool begin(uint8_t addr = 0x44) { return true; }
    bool read()                     { return true; }
    float getTemperature()          { return (float)_sht31_get_temperature(); }
    float getHumidity()             { return (float)_sht31_get_humidity(); }
    float temperature()             { return getTemperature(); }
    float humidity()                { return getHumidity(); }
};

// Adafruit_SHT31 alias (same API surface)
typedef SHT31 Adafruit_SHT31;

#endif
