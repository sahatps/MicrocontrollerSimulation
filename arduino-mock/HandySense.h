#ifndef HANDYSENSE_H
#define HANDYSENSE_H

#include "Arduino.h"

// HandySense library mock for Emscripten compilation
// Stubs for pin configuration functions used by HandySense examples

inline void setPin_Relay(int r1, int r2, int r3, int r4) {
    pinMode(r1, OUTPUT);
    pinMode(r2, OUTPUT);
    pinMode(r3, OUTPUT);
    pinMode(r4, OUTPUT);
}

inline void setPin_SW(int s1, int s2, int s3, int s4) {
    pinMode(s1, INPUT);
    pinMode(s2, INPUT);
    pinMode(s3, INPUT);
    pinMode(s4, INPUT);
}

inline void setPin_ErrorSensor(int e1, int e2, int e3) {
    pinMode(e1, OUTPUT);
    pinMode(e2, OUTPUT);
    pinMode(e3, OUTPUT);
}

#endif
