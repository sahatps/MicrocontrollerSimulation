#ifndef WIRE_H
#define WIRE_H

#include <stdint.h>

// Wire (I2C) mock for Emscripten compilation
class TwoWire {
public:
    void begin() {}
    void begin(uint8_t addr) {}
    void setClock(uint32_t freq) {}
    void beginTransmission(uint8_t addr) {}
    uint8_t endTransmission() { return 0; }
    uint8_t requestFrom(uint8_t addr, uint8_t qty) { return 0; }
    void write(uint8_t val) {}
    int read() { return 0; }
    int available() { return 0; }
};

static TwoWire Wire;

#endif
