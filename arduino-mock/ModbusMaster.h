#ifndef MODBUSMASTER_H
#define MODBUSMASTER_H

#include "Arduino.h"

// ModbusMaster mock for Emscripten compilation
// Bridges RS485/Modbus register reads to JS via window.hackcable_modbus_read

EM_JS(int, _modbus_read_register, (int slaveId, int regAddr), {
    if (typeof window.hackcable_modbus_read === 'function')
        return window.hackcable_modbus_read(slaveId, regAddr) | 0;
    return 0;
});

class ModbusMaster {
public:
    static const uint8_t ku8MBSuccess = 0;

    ModbusMaster() : _slaveId(1), _lastRegAddr(0) {}

    // Accept any Stream-like type (Serial2, HardwareSerial, etc.)
    template<typename T>
    void begin(uint8_t slaveId, T &serial) { _slaveId = slaveId; }

    uint8_t readHoldingRegisters(uint16_t regAddr, uint16_t qty) {
        _lastRegAddr = regAddr;
        return ku8MBSuccess;
    }

    uint16_t getResponseBuffer(uint8_t idx) {
        return (uint16_t)_modbus_read_register((int)_slaveId, (int)(_lastRegAddr + idx));
    }

private:
    uint8_t  _slaveId;
    uint16_t _lastRegAddr;
};

#endif
