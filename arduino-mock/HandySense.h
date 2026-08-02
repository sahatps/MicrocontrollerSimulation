#ifndef HANDYSENSE_H
#define HANDYSENSE_H

#include "Arduino.h"

#define OPEN 1
#define CLOSE 0
#define cannotConnect 0
#define wifiConnected 1
#define serverConnected 2
#define editDeviceWifi 3

static int type_RTC = 1;
static int relay_pin[4] = {0, 0, 0, 0};
static int switch_pin[4] = {0, 0, 0, 0};
static int ErrorSensor_pin[4] = {0, 0, 0, 0};
static int RelayStatus[4] = {0, 0, 0, 0};
static int ErrorSensor_Status[4] = {0, 0, 0, 0};
static int sw_onboard[4] = {36, 39, 34, 35};
static int const_relay_pin[4] = {32, 33, 25, 26};
static int LED_WIFI = 2;
static int LED_SERVER = 12;
static unsigned long eventInterval = 2UL * 1000UL;
static unsigned long eventInterval_brightness = 2UL * 1000UL;
static unsigned long eventInterval_publishData = 60UL * 1000UL;
static int check_sendData_status = 0;
static int connectWifiStatus = cannotConnect;
static float temp_from_Sensor = 0.0f;
static float humidity_from_Sensor = 0.0f;
static float lux_from_Sensor = 0.0f;
static float soil_from_Sensor = 0.0f;

inline void setPin_Relay(int r1, int r2, int r3, int r4) {
    relay_pin[0] = r1;
    relay_pin[1] = r2;
    relay_pin[2] = r3;
    relay_pin[3] = r4;
    for (int i = 0; i < 4; ++i) {
        pinMode(relay_pin[i], OUTPUT);
        digitalWrite(relay_pin[i], LOW);
    }
}

inline void setPin_SW(int s1, int s2, int s3, int s4) {
    switch_pin[0] = s1;
    switch_pin[1] = s2;
    switch_pin[2] = s3;
    switch_pin[3] = s4;
    for (int i = 0; i < 4; ++i) {
        pinMode(switch_pin[i], INPUT);
        digitalWrite(switch_pin[i], HIGH);
    }
}

inline void setPin_ErrorSensor(int e1, int e2, int e3) {
    ErrorSensor_pin[0] = e1;
    ErrorSensor_pin[1] = e2;
    ErrorSensor_pin[2] = e3;
    for (int i = 0; i < 3; ++i) {
        pinMode(ErrorSensor_pin[i], OUTPUT);
    }
}

inline void setup_HandySense() {}

inline void loop_HandySense(int soil, int light, int temp, int hum) {
    soil_from_Sensor = (float)soil;
    lux_from_Sensor = (float)light;
    temp_from_Sensor = (float)temp;
    humidity_from_Sensor = (float)hum;
}

inline int analog_to_percent(int raw) {
    return map(raw, 0, 4095, 0, 100);
}

inline void Open_relay(int channel) {
    if (channel >= 0 && channel < 4) {
        RelayStatus[channel] = OPEN;
        const int pin = relay_pin[channel] != 0 ? relay_pin[channel] : const_relay_pin[channel];
        digitalWrite(pin, HIGH);
        check_sendData_status = 1;
    }
}

inline void Close_relay(int channel) {
    if (channel >= 0 && channel < 4) {
        RelayStatus[channel] = CLOSE;
        const int pin = relay_pin[channel] != 0 ? relay_pin[channel] : const_relay_pin[channel];
        digitalWrite(pin, LOW);
        check_sendData_status = 1;
    }
}

#endif
