#pragma once

// Mock Constants
#define OUTPUT 1
#define HIGH 1
#define LOW 0

// Mock Functions (Signatures only)
void pinMode(int pin, int mode);
void digitalWrite(int pin, int val);
void delay(int ms);

// Mock Serial Class
class MockSerial {
public:
    void begin(int baudRate);
    void println(const char* msg);
};
extern MockSerial Serial;
