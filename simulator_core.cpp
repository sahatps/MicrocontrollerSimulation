#include <Arduino.h>
#include <HandySense.h>
#include <Wire.h>

// Instantiate Mock Objects
MockSerial Serial;
MockWire Wire;

// 1. Declare JavaScript imports (The Bridge)
extern "C" {
    void js_digitalWrite(int pin, int val);
    void js_console_log(const char* msg);
}

// 2. Implement Mock Functions (Route them to JS)
void pinMode(int pin, int mode) { /* Handle in JS if needed */ }
void digitalWrite(int pin, int val) { js_digitalWrite(pin, val); }
void delay(int ms) { /* Delay is usually handled by JS event loop in Wasm */ }

void MockSerial::begin(int baudRate) {}
void MockSerial::println(const char* msg) { js_console_log(msg); }

void setPin_Relay(int p1, int p2, int p3, int p4) {}
void setPin_SW(int p1, int p2, int p3, int p4) {}
void setPin_ErrorSensor(int p1, int p2, int p3) {}
void MockWire::begin() {}

// 3. Forward declarations for the user's setup() and loop()
extern void setup();
extern void loop();

// 4. Export standard entry points for JavaScript to call
extern "C" void sim_run_setup() {
    setup();
}

extern "C" void sim_run_loop() {
    loop();
}
