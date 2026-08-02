#ifndef ADAFRUIT_NEOPIXEL_H
#define ADAFRUIT_NEOPIXEL_H

#include "Arduino.h"

// Adafruit NeoPixel stub for Emscripten compilation
// Routes first-pixel on/off state to the data GPIO pin for basic simulation

#define NEO_RGB     0x06
#define NEO_GRB     0x52
#define NEO_BRG     0x61
#define NEO_KHZ800  0x0000
#define NEO_KHZ400  0x0100

class Adafruit_NeoPixel {
    int _pin;
    int _numPixels;
public:
    Adafruit_NeoPixel(int numPixels, int pin, int type = NEO_GRB + NEO_KHZ800)
        : _pin(pin), _numPixels(numPixels) {}

    void begin()                    { pinMode(_pin, OUTPUT); }
    void show()                     {}
    void setBrightness(uint8_t b)   {}
    void clear()                    { digitalWrite(_pin, LOW); }

    void setPixelColor(int n, uint32_t c) {
        if (n == 0) digitalWrite(_pin, c != 0 ? HIGH : LOW);
    }
    void setPixelColor(int n, uint8_t r, uint8_t g, uint8_t b) {
        if (n == 0) digitalWrite(_pin, (r | g | b) != 0 ? HIGH : LOW);
    }

    static uint32_t Color(uint8_t r, uint8_t g, uint8_t b) {
        return ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
    }
    static uint32_t Color(uint8_t r, uint8_t g, uint8_t b, uint8_t w) {
        return ((uint32_t)w << 24) | ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
    }

    uint32_t getPixelColor(int n) const { return 0; }
    int      numPixels()          const { return _numPixels; }
};

#endif
