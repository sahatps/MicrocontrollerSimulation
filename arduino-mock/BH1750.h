#ifndef BH1750_H
#define BH1750_H

#include "Arduino.h"

// BH1750 mock for Emscripten compilation
// Bridges I2C light-level reads to JS via window.hackcable_bh1750_lux

EM_JS(double, _bh1750_get_lux, (), {
    if (typeof window.hackcable_bh1750_lux === 'function')
        return window.hackcable_bh1750_lux();
    return 500.0;
});

class BH1750 {
public:
    enum Mode {
        CONTINUOUS_HIGH_RES_MODE   = 0x10,
        CONTINUOUS_HIGH_RES_MODE_2 = 0x11,
        CONTINUOUS_LOW_RES_MODE    = 0x13,
        ONE_TIME_HIGH_RES_MODE     = 0x20,
        ONE_TIME_HIGH_RES_MODE_2   = 0x21,
        ONE_TIME_LOW_RES_MODE      = 0x23,
    };

    bool  begin(uint8_t addr = 0x23)    { return true; }
    bool  begin(Mode mode, uint8_t addr = 0x23) { return true; }
    float readLightLevel()              { return (float)_bh1750_get_lux(); }
    float measureHighRes()              { return readLightLevel(); }
    float measureHighRes2()             { return readLightLevel(); }
    float measureLowRes()               { return readLightLevel(); }
    float luminance()                   { return readLightLevel(); }
};

#endif
