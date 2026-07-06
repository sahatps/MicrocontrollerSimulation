#ifndef MCP23008_H
#define MCP23008_H

#include "Arduino.h"

// MCP23008 mock — maps GP0..GP7 to HandySense real status LEDs
// and mirrors GP0..GP3 to the onboard relay control GPIOs.
class MCP23008 {
private:
    static constexpr int _LED_PINS[] = {2, 5, 18, 19, 21, 22, 23, 27};
    static constexpr int _RELAY_PINS[] = {25, 4, 12, 13};
    static constexpr int _NUM_LED_PINS = 8;
    static constexpr int _NUM_RELAY_PINS = 4;
    uint8_t _addr;
public:
    MCP23008(uint8_t addr = 0x24) : _addr(addr) {}
    void begin() {}
    void pinMode8(uint8_t mode) {}
    void digitalWrite(uint8_t pin, uint8_t val) {
        if (pin < _NUM_LED_PINS) {
            ::digitalWrite(_LED_PINS[pin], val);
        }
        if (pin < _NUM_RELAY_PINS) {
            ::digitalWrite(_RELAY_PINS[pin], val);
        }
    }
    uint8_t digitalRead(uint8_t pin) {
        if (pin < _NUM_LED_PINS) {
            return ::digitalRead(_LED_PINS[pin]);
        }
        return 0;
    }
    void write(uint8_t pin, uint8_t val) { digitalWrite(pin, val); }
};

#endif
