#ifndef MCP23008_H
#define MCP23008_H

#include "Arduino.h"

// MCP23008 mock — maps I2C expander GPIO to ESP32 relay pins
// GP0=IO25(R1), GP1=IO4(R2), GP2=IO12(R3), GP3=IO13(R4)
class MCP23008 {
private:
    static constexpr int _RELAY_PINS[] = {25, 4, 12, 13};
    static constexpr int _NUM_PINS = 4;
    uint8_t _addr;
public:
    MCP23008(uint8_t addr = 0x24) : _addr(addr) {}
    void begin() {}
    void pinMode8(uint8_t mode) {}
    void digitalWrite(uint8_t pin, uint8_t val) {
        if (pin < _NUM_PINS) {
            ::digitalWrite(_RELAY_PINS[pin], val);
        }
    }
    uint8_t digitalRead(uint8_t pin) {
        if (pin < _NUM_PINS) {
            return ::digitalRead(_RELAY_PINS[pin]);
        }
        return 0;
    }
    void write(uint8_t pin, uint8_t val) { digitalWrite(pin, val); }
};

#endif
