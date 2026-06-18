# BFarm Sensor Snippets

This file extracts practical Arduino-style snippets from the BFarm zip plugins so we can test `#block -> code -> #circuit` flows without implementing the Blockly UI first.

## How to Read the Plugin Files

- `blocks_*.js`: block labels, inputs, and field names
- `generators_*.js`: emitted code templates and expressions

For `#circuit`, the second file matters most because it shows the code shape the parser/emulator will likely receive.

## Common RS485 Pattern

Most RS485 plugins follow this structure:

```cpp
#include <ModbusMaster.h>

ModbusMaster sensor;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  sensor.begin(1, Serial2);
}
```

Then either:

- read registers inline with a lambda expression, or
- read once in loop/setup helpers and access `getResponseBuffer(...)`

## 7in1Soil MultiRead

Fields from `blocks_7in1SoilMuti.js`:

- `ID`

Exposed readings:

- moisture
- temperature
- EC
- pH
- nitrogen
- phosphorus
- potassium

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster rs485_npk;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
}

float readSoilMoisture() {
  rs485_npk.begin(1, Serial2);
  delay(50);
  if (rs485_npk.readHoldingRegisters(0, 10) == rs485_npk.ku8MBSuccess) {
    return rs485_npk.getResponseBuffer(0) / 10.0f;
  }
  return 0.0f;
}

float readSoilTemperature() {
  rs485_npk.begin(1, Serial2);
  delay(50);
  if (rs485_npk.readHoldingRegisters(0, 10) == rs485_npk.ku8MBSuccess) {
    return rs485_npk.getResponseBuffer(1) / 10.0f;
  }
  return 0.0f;
}

float readSoilEC() {
  rs485_npk.begin(1, Serial2);
  delay(50);
  if (rs485_npk.readHoldingRegisters(0, 10) == rs485_npk.ku8MBSuccess) {
    return rs485_npk.getResponseBuffer(2);
  }
  return 0.0f;
}

float readSoilPh() {
  rs485_npk.begin(1, Serial2);
  delay(50);
  if (rs485_npk.readHoldingRegisters(0, 10) == rs485_npk.ku8MBSuccess) {
    return rs485_npk.getResponseBuffer(3) / 10.0f;
  }
  return 0.0f;
}

float readSoilNitrogen() {
  rs485_npk.begin(1, Serial2);
  delay(50);
  if (rs485_npk.readHoldingRegisters(0, 10) == rs485_npk.ku8MBSuccess) {
    return rs485_npk.getResponseBuffer(4);
  }
  return 0.0f;
}

float readSoilPhosphorus() {
  rs485_npk.begin(1, Serial2);
  delay(50);
  if (rs485_npk.readHoldingRegisters(0, 10) == rs485_npk.ku8MBSuccess) {
    return rs485_npk.getResponseBuffer(5);
  }
  return 0.0f;
}

float readSoilPotassium() {
  rs485_npk.begin(1, Serial2);
  delay(50);
  if (rs485_npk.readHoldingRegisters(0, 10) == rs485_npk.ku8MBSuccess) {
    return rs485_npk.getResponseBuffer(6);
  }
  return 0.0f;
}

void loop() {
  if (rs485_npk.readHoldingRegisters(0, 10) == rs485_npk.ku8MBSuccess) {
    Serial.print("moisture=");
    Serial.print(rs485_npk.getResponseBuffer(0) / 10.0f, 1);
    Serial.print(",temp=");
    Serial.print(rs485_npk.getResponseBuffer(1) / 10.0f, 1);
    Serial.print(",ec=");
    Serial.print(rs485_npk.getResponseBuffer(2));
    Serial.print(",ph=");
    Serial.print(rs485_npk.getResponseBuffer(3) / 10.0f, 1);
    Serial.print(",n=");
    Serial.print(rs485_npk.getResponseBuffer(4));
    Serial.print(",p=");
    Serial.print(rs485_npk.getResponseBuffer(5));
    Serial.print(",k=");
    Serial.println(rs485_npk.getResponseBuffer(6));
  }
}
```

Suggested Circuit component:

- `7-in-1 Soil Sensor (RS485)`

## Air Velocity Sensor (SM3789)

Fields:

- `ID`

Exposed readings:

- air velocity

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster AirVelocityRs485;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
}

float readAirVelocity() {
  AirVelocityRs485.begin(1, Serial2);
  delay(50);
  if (AirVelocityRs485.readHoldingRegisters(0, 1) == AirVelocityRs485.ku8MBSuccess) {
    return AirVelocityRs485.getResponseBuffer(0);
  }
  return 0.0f;
}
```

Suggested Circuit component:

- `Air Velocity Sensor (SM3789)`

Implemented Circuit integration:

| Item | Value |
| --- | --- |
| Component id | `64` |
| Class | `BfarmAirVelocitySensorSm3789Element` |
| Pins | `VCC`, `GND`, `A+`, `B-` |
| Example key | `handysense_real_bfarm_air_velocity_sensor_sm3789_test` |
| Mock profile | `bfarm-air-velocity-sm3789` |
| Slave ID | `1` |
| Register | Holding register `0` |
| Mock key | `air_velocity` |

## Ammonia RS485

Fields:

- `ID`

Exposed readings:

- ammonia
- pH
- temperature

Register map from `generators_ANSRs485.js`:

| Start register | Buffer index | Field | Mock key | Raw scale | Code conversion | Unit | Default |
| ---: | ---: | --- | --- | ---: | --- | --- | ---: |
| `0` | `0` | ammonia | `ammonia` | `x100` | `/100.0f` | mg/L | `2.5` |
| `0` | `1` | pH | `ph` | `x100` | `/100.0f` | pH | `7.0` |
| `0` | `2` | temperature | `temperature` | `x10` | `/10.0f` | C | `25.0` |

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster ANS_rs485;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  ANS_rs485.begin(1, Serial2);
}

void loop() {
  uint8_t result_ANSrs485 = ANS_rs485.readHoldingRegisters(0, 3);
  float ammonia = ANS_rs485.getResponseBuffer(0) / 100.0f;
  float ph = ANS_rs485.getResponseBuffer(1) / 100.0f;
  float temperature = ANS_rs485.getResponseBuffer(2) / 10.0f;
}
```

Suggested Circuit component:

- `Ammonia Sensor (RS485)`

Implemented Circuit integration:

- Component id: `53`
- Class: `BfarmAmmoniaRs485Element`
- Example key: `handysense_real_bfarm_ammonia_rs485_test`
- Mock profile: `bfarm-ammonia-rs485`

## SoilTemp MultiRead RS485

Fields:

- `ID`

Exposed readings:

- soil moisture
- soil temperature

Register map from `generators_SoilTemp_RS485.js`:

| Start register | Buffer index | Field | Mock key | Raw scale | Code conversion | Unit | Default |
| ---: | ---: | --- | --- | ---: | --- | --- | ---: |
| `0` | `0` | soil moisture | `soil_moisture` (fallback: `soil`) | `x10` | `/10.0f` | %RH | `50.0` |
| `0` | `1` | soil temperature | `soil_temp` (fallback: `temperature`) | `x10` | `/10.0f` | C | `25.0` |

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster soilt_rs485;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  soilt_rs485.begin(1, Serial2);
}

void loop() {
  if (soilt_rs485.readHoldingRegisters(0, 2) == soilt_rs485.ku8MBSuccess) {
    float soilMoisture = soilt_rs485.getResponseBuffer(0) / 10.0f;
    float soilTemperature = soilt_rs485.getResponseBuffer(1) / 10.0f;
  }
}
```

Suggested Circuit component:

- `Soil Temp/Moisture Sensor (RS485)`

Implemented Circuit integration:

- Component id: `54`
- Class: `BfarmSoilTempMultireadRs485Element`
- Example key: `handysense_real_bfarm_soil_temp_multiread_rs485_test`
- Mock profile: `bfarm-soil-temp-multiread-rs485`

## Lux120k RS485

Fields:

- `ID`

Exposed readings:

- lux

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster lux120k_rs485;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  lux120k_rs485.begin(1, Serial2);
}

int readLux120k() {
  uint8_t result_lux120k = lux120k_rs485.readHoldingRegisters(0, 5);
  return lux120k_rs485.getResponseBuffer(3);
}
```

Implemented Circuit integration:

| Item | Value |
| --- | --- |
| Component id | `65` |
| Class | `BfarmLux120kRs485Element` |
| Display name | `Lux120k rs485` |
| Pins | `VCC`, `GND`, `A+`, `B-` |
| Example key | `handysense_real_bfarm_lux120k_rs485_test` |
| Mock profile | `bfarm-lux120k-rs485` |
| Slave ID | `1` |
| Register | Holding register `3` |
| Mock key | `lux` |

## SEN55 I2C

Exposed readings:

- PM1.0
- PM2.5
- PM4.0
- PM10.0
- humidity
- temperature
- VOC index
- NOx index

Reference snippet:

```cpp
#include <SensirionI2CSen5x.h>

SensirionI2CSen5x sen5x;
float pm1p0, pm2p5, pm4p0, pm10p0;
float ambientHumidity, ambientTemperature, vocIndex, noxIndex;

void setup() {
  Wire.begin();
  sen5x.begin(Wire);
  sen5x.startMeasurement();
}

void loop() {
  uint16_t sen55 = sen5x.readMeasuredValues(
    pm1p0, pm2p5, pm4p0, pm10p0,
    ambientHumidity, ambientTemperature, vocIndex, noxIndex
  );
}
```

Suggested Circuit component:

- `SEN55 Air Sensor (I2C)`

Circuit implementation:

- Component id: `55`
- Class: `BfarmSen55AirI2cElement`
- Pins: `VCC`, `GND`, `SDA`, `SCL`
- Example key: `handysense_real_bfarm_sen55_air_i2c_test`

Mock bridge map:

| Value index | Generator variable | Mock key | Default |
| ---: | --- | --- | ---: |
| `0` | `pm1p0` | `pm1` | `8` |
| `1` | `pm2p5` | `pm25` | `12` |
| `2` | `pm4p0` | `pm4` | `15` |
| `3` | `pm10p0` | `pm10` | `20` |
| `4` | `ambientHumidity` | `humidity` | `60` |
| `5` | `ambientTemperature` | `temperature` | `25` |
| `6` | `vocIndex` | `voc` | `100` |
| `7` | `noxIndex` | `nox` | `10` |

Circuit match today:

- `SEN55 Air Sensor (I2C)`

## TMEC Sensor

Fields:

- `ch`
- `valueMin`
- `valueMax`
- `OutMin`
- `OutMax`

Generated expression pattern:

```cpp
ReadAnalog_from_MPC3424(ch, valueMin, valueMax, outMin, outMax)
```

Reference snippet:

```cpp
float tensio = ReadAnalog_from_MPC3424(1, 0, 5000, 0, 100);
float pressure = ReadAnalog_from_MPC3424(2, 0, 5000, 0, 300);
float lightKlux = ReadAnalog_from_MPC3424(3, 0, 5000, 0, 120);
```

Suggested Circuit component:

- `TMEC Analog Sensor`

Implemented Circuit integration:

- Component id: `61`
- Class: `BfarmTmecAnalogElement`
- Pins: `VCC`, `GND`, `SIG`
- Handysense real wiring:
  - `VCC` -> `A420_1_VCC`
  - `GND` -> `A420_1_GND`
  - `SIG` -> `A420_1_SIG`
- Example key: `handysense_real_bfarm_tmec_analog_test`
- Mock key: `tmec_analog_uv`

The plugin supports MCP3424 channels `1` through `4`. The saved test uses channel `1` and maps the raw input from `0..5000 uV` to `0..100`:

```cpp
int rawUv = ReadAnalog_MPC3424(1);
float tmecValue = ReadAnalog_from_MPC3424(1, 0, 5000, 0, 100);
```

Mock/Serial rule:

| MCP3424 channel | Mock key | Default raw value | Code mapping | Expected output |
| ---: | --- | ---: | --- | ---: |
| `1` | `tmec_analog_uv` | `2500 uV` | `0..5000` -> `0..100` | `50` |

Default Serial output:

```text
tmec_analog_uv=2500,tmec_value=50.00
```

Note: the plugin generator spells the helper `MPC3424`, so Circuit examples keep that exact function name for compatibility.

## TMEC-NITRATE-ISFET PLATFORM

Fields:

- `ID`

Exposed readings:

- Vout
- Vout temperature
- sample value
- temperature
- error
- R-square
- sensitivity
- STD1 50ppm
- STD2 100ppm
- STD3 300ppm

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster nitrate_isfet_rs485;

void setup() {
  Wire.begin();
  Serial2.begin(115200);
  nitrate_isfet_rs485.begin(1, Serial2);
}

void loop() {
  uint8_t result_nitrate_isfet_rs485 = nitrate_isfet_rs485.readHoldingRegisters(0, 10);
  float sampleValue = nitrate_isfet_rs485.getResponseBuffer(2) / 10.0f;
  float temperature = nitrate_isfet_rs485.getResponseBuffer(3) / 10.0f;
  float sensitivity = nitrate_isfet_rs485.getResponseBuffer(6) / 10.0f;
}
```

Suggested Circuit component:

- `Nitrate ISFET Sensor (RS485)`

Implemented Circuit integration:

| Item | Value |
| --- | --- |
| Component ID | `59` |
| Class | `BfarmNitrateIsfetRs485Element` |
| Protocol | Modbus RS485, `115200` baud |
| Slave ID | `1` in the saved test example |
| Read | holding register start `0`, quantity `10` |
| Example key | `handysense_real_bfarm_nitrate_isfet_rs485_test` |
| Mock profile | `bfarm-nitrate-isfet-rs485` |

Register and mock map from `generators_NITRATE_ISFET_PLATFORM.js`:

| Register | Field | Mock key | Raw scale | Code conversion | Default |
| ---: | --- | --- | ---: | --- | ---: |
| `0` | Vout | `nitrate_vout` | `x10` | `/10.0f` | `315.0` |
| `1` | Vout temperature | `nitrate_vout_temp` | `x10` | `/10.0f` | `298.0` |
| `2` | Sample value | `nitrate_sample` | `x10` | `/10.0f` | `125.0` |
| `3` | Temperature | `temperature` | `x10` | `/10.0f` | `25.0` |
| `4` | Error | `nitrate_error` | `x100` | `/100.0f` | `1.25` |
| `5` | R-square | `nitrate_r_square` | `x1000` | `/1000.0f` | `0.998` |
| `6` | Sensitivity | `nitrate_sensitivity` | `x10` | `/10.0f` | `58.5` |
| `7` | STD1 50ppm | `nitrate_std1` | `x100` | `/100.0f` | `50.0` |
| `8` | STD2 100ppm | `nitrate_std2` | `x100` | `/100.0f` | `100.0` |
| `9` | STD3 300ppm | `nitrate_std3` | `x100` | `/100.0f` | `300.0` |

Default Serial Monitor output:

```text
vout=315.0,vout_temp=298.0,sample=125.0,temp=25.0,error=1.25,r_square=0.998,sensitivity=58.5,std1=50.00,std2=100.00,std3=300.00
```

## TMEC-Tensio RS485

Fields:

- `ID`

Exposed readings:

- temperature
- humidity
- light
- voltage

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster TMEC_Tensio_rs485;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  TMEC_Tensio_rs485.begin(1, Serial2);
}

void loop() {
  uint8_t result_TMEC_Tensio_rs485 = TMEC_Tensio_rs485.readInputRegisters(0, 6);
  float temperature = TMEC_Tensio_rs485.getResponseBuffer(1) / 10.0f;
  float humidity = TMEC_Tensio_rs485.getResponseBuffer(2) / 10.0f;
  float light = TMEC_Tensio_rs485.getResponseBuffer(3);
  float voltage = TMEC_Tensio_rs485.getResponseBuffer(5) / 1000.0f;
}
```

Suggested Circuit component:

- `TMEC Tensio Sensor (RS485)`

Implemented Circuit integration:

| Item | Value |
| --- | --- |
| Component ID | `60` |
| Class | `BfarmTmecTensioRs485Element` |
| Protocol | Modbus RS485, `9600` baud |
| Slave ID | `1` in the saved test example |
| Read | input register start `0`, quantity `6` |
| Example key | `handysense_real_bfarm_tmec_tensio_rs485_test` |
| Mock profile | `bfarm-tmec-tensio-rs485` |

Register and mock map from `generators_Tensio_Rs485.js`:

| Register | Field | Mock key | Raw scale | Code conversion | Default |
| ---: | --- | --- | ---: | --- | ---: |
| `0` | Unused | - | - | - | `0` |
| `1` | Temperature | `temperature` | `x10` | `/10.0f` | `25.0` |
| `2` | Humidity | `humidity` | `x10` | `/10.0f` | `60.0` |
| `3` | Light | `lux` | `x1` | direct | `500` |
| `4` | Unused | - | - | - | `0` |
| `5` | Voltage | `voltage` | `x1000` | `/1000.0f` | `12.0` |

Default Serial Monitor output:

```text
temperature=25.0,humidity=60.0,light=500,voltage=12.000
```

## Tubular Soil Moisture Sensor

Fields:

- `ID`

Exposed readings:

- moisture and temperature at 10, 20, 30, 40, 50 cm

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster TubularSoilRs485;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  TubularSoilRs485.begin(1, Serial2);
}

void loop() {
  uint8_t result_TubularSoilRs485 = TubularSoilRs485.readHoldingRegisters(0, 10);
  float moisture10 = TubularSoilRs485.getResponseBuffer(0) / 10.0f;
  float temp10 = TubularSoilRs485.getResponseBuffer(1) / 10.0f;
  float moisture50 = TubularSoilRs485.getResponseBuffer(8) / 10.0f;
  float temp50 = TubularSoilRs485.getResponseBuffer(9) / 10.0f;
}
```

Suggested Circuit component:

- `Tubular Soil Probe (RS485)`

Implemented Circuit integration:

| Item | Value |
| --- | --- |
| Component ID | `63` |
| Class | `BfarmTubularSoilProbeRs485Element` |
| Protocol | Modbus RS485, `9600` baud |
| Pins | `VCC`, `GND`, `A+`, `B-` |
| Example key | `handysense_real_bfarm_tubular_soil_probe_rs485_test` |
| Mock profile | `bfarm-tubular-soil-probe-rs485` |
| Test slave ID | `1` |

Mock/register mapping:

| Register | Depth | Field | Mock key | Raw format |
| ---: | ---: | --- | --- | --- |
| `0` | 10 cm | moisture | `tubular_moisture_10` | `x10`, then `/10.0f` |
| `1` | 10 cm | temperature | `tubular_temperature_10` | `x10`, then `/10.0f` |
| `2` | 20 cm | moisture | `tubular_moisture_20` | `x10`, then `/10.0f` |
| `3` | 20 cm | temperature | `tubular_temperature_20` | `x10`, then `/10.0f` |
| `4` | 30 cm | moisture | `tubular_moisture_30` | `x10`, then `/10.0f` |
| `5` | 30 cm | temperature | `tubular_temperature_30` | `x10`, then `/10.0f` |
| `6` | 40 cm | moisture | `tubular_moisture_40` | `x10`, then `/10.0f` |
| `7` | 40 cm | temperature | `tubular_temperature_40` | `x10`, then `/10.0f` |
| `8` | 50 cm | moisture | `tubular_moisture_50` | `x10`, then `/10.0f` |
| `9` | 50 cm | temperature | `tubular_temperature_50` | `x10`, then `/10.0f` |

The saved test reads all ten holding registers and prints all five moisture/temperature pairs, so each mock value can be verified independently in Serial Monitor.

## Turbidity XM3318B RS485

Fields:

- `ID`

Exposed readings:

- turbidity

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster Turbidity_XM3318B_Rs485;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  Turbidity_XM3318B_Rs485.begin(1, Serial2);
}

int readTurbidityXM3318B() {
  uint8_t result = Turbidity_XM3318B_Rs485.readHoldingRegisters(0, 1);
  return Turbidity_XM3318B_Rs485.getResponseBuffer(0);
}
```

Suggested Circuit component:

- `Turbidity Sensor XM3318B (RS485)`

Implemented Circuit integration:

| Item | Value |
| --- | --- |
| Component ID | `57` |
| Class | `BfarmTurbidityXm3318bRs485Element` |
| Protocol | Modbus RS485, `9600` baud |
| Slave ID | `1` in the saved test example |
| Read | holding register start `0`, quantity `1` |
| Turbidity raw register | `0` |
| Mock key | `turbidity` |
| Raw scale | none |
| Example key | `handysense_real_bfarm_turbidity_xm3318b_rs485_test` |

Mock and Serial Monitor behavior:

- The plugin returns `getResponseBuffer(0)` directly, so the saved example prints `turbidity_raw` without applying an unverified scale.
- The mock bridge supplies the `turbidity` value at Modbus register `0`.
- For example, `turbidity = 725` produces `turbidity_raw=725` in Serial Monitor.
- Default mock output is `turbidity_raw=250`.

## Turbidity XM8518 RS485

Fields:

- `ID`

Exposed readings:

- turbidity

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster Turbidity_XM8518_Rs485;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  Turbidity_XM8518_Rs485.begin(1, Serial2);
}

int readTurbidityXM8518() {
  uint8_t result = Turbidity_XM8518_Rs485.readHoldingRegisters(0, 1);
  return Turbidity_XM8518_Rs485.getResponseBuffer(0);
}
```

Suggested Circuit component:

- `Turbidity Sensor XM8518 (RS485)`

Implemented Circuit integration:

| Item | Value |
| --- | --- |
| Component ID | `58` |
| Class | `BfarmTurbidityXm8518Rs485Element` |
| Protocol | Modbus RS485, `9600` baud |
| Slave ID | `1` in the saved test example |
| Read | holding register start `0`, quantity `1` |
| Turbidity raw register | `0` |
| Mock key | `turbidity` |
| Raw scale | none |
| Example key | `handysense_real_bfarm_turbidity_xm8518_rs485_test` |

Mock and Serial Monitor behavior:

- The zip generator's `readHoldingRegisters` line incorrectly references `Turbidity_XM3318_Rs485`; the saved example corrects this to `Turbidity_XM8518_Rs485`.
- The plugin returns `getResponseBuffer(0)` directly, so the saved example prints `turbidity_raw` without applying an unverified scale.
- The mock bridge supplies the `turbidity` value at Modbus register `0`.
- For example, `turbidity = 851` produces `turbidity_raw=851` in Serial Monitor.
- Default mock output is `turbidity_raw=250`.

## Ultrasonic RS485

Fields:

- `ID`

Exposed readings:

- distance

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster Ultrars485;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  Ultrars485.begin(1, Serial2);
}

float readUltrasonicDistance() {
  uint8_t result = Ultrars485.readHoldingRegisters(256, 2);
  return Ultrars485.getResponseBuffer(256) / 10.0f;
}
```

Suggested Circuit component:

- `Ultrasonic Sensor (RS485)`

Implemented Circuit integration:

| Item | Value |
| --- | --- |
| Component ID | `56` |
| Class | `BfarmUltrasonicRs485Element` |
| Protocol | Modbus RS485, `9600` baud |
| Slave ID | `1` in the saved test example |
| Read | holding registers start `256`, quantity `2` |
| Distance raw register | `256` |
| Mock key | `distance` |
| Raw scale | mock value `x10` |
| Code conversion | `/10.0f` |
| Example key | `handysense_real_bfarm_ultrasonic_rs485_test` |

Generator compatibility note:

- The plugin emits `getResponseBuffer(256)`.
- The bundled `ModbusMaster` signature accepts a `uint8_t` buffer index, so `256` wraps to buffer index `0`.
- The saved Circuit example fixes this plugin bug by reading `getResponseBuffer(0)` while preserving `readHoldingRegisters(256, 2)`.
- The mock bridge supplies the distance at Modbus register `256`; the Modbus shim stores it in response buffer index `0`.
- Default mock output is `distance=150.0 cm`.

## Water Quality

Fields:

- `ID`

Sub-groups in the plugin:

- water level
- pH
- water temperature
- dissolved oxygen
- DO temperature
- EC
- ammonia
- ammonia pH
- ammonia temperature

Reference snippet:

```cpp
#include <ModbusMaster.h>

float wordsToFloat_BE(uint16_t hi, uint16_t lo) {
  uint32_t u = ((uint32_t)hi << 16) | lo;
  float f;
  memcpy(&f, &u, sizeof(f));
  return f;
}

ModbusMaster Levelrs485;
ModbusMaster PHrs485;
ModbusMaster DOrs485;
ModbusMaster ECrs485;
ModbusMaster ANSrs485;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  Levelrs485.begin(1, Serial2);
  PHrs485.begin(1, Serial2);
  ECrs485.begin(1, Serial2);
  ANSrs485.begin(1, Serial2);
}

void loop() {
  uint8_t result_level_water = Levelrs485.readHoldingRegisters(0, 5);
  uint8_t result_PH = PHrs485.readHoldingRegisters(0, 2);
  uint8_t result_DO = DOrs485.readHoldingRegisters(0, 5);
  uint8_t result_EC = ECrs485.readHoldingRegisters(0, 2);
  uint8_t result_ANSrs485 = ANSrs485.readHoldingRegisters(0, 3);

  float waterLevel = Levelrs485.getResponseBuffer(4);
  float ph = PHrs485.getResponseBuffer(1) / 10.0f;
  float waterTemp = PHrs485.getResponseBuffer(0) / 10.0f;
  float dissolvedOxygen = wordsToFloat_BE(DOrs485.getResponseBuffer(2), DOrs485.getResponseBuffer(3));
  float ec = ECrs485.getResponseBuffer(1) / 10.0f;
  float ammonia = ANSrs485.getResponseBuffer(0) / 100.0f;
}
```

Suggested Circuit component:

- `Water Quality Suite (RS485)`

Implemented Circuit integration:

| Item | Value |
| --- | --- |
| Component ID | `62` |
| Class | `BfarmWaterQualitySuiteRs485Element` |
| Protocol | Modbus RS485, `9600` baud |
| Pins | `VCC`, `GND`, `A+`, `B-` |
| Example key | `handysense_real_bfarm_water_quality_suite_rs485_test` |
| Mock profile | `bfarm-water-quality-suite-rs485` |
| Test slave IDs | level `1`, pH `2`, DO `3`, EC `4`, ANS `5` |

Mock/register mapping:

| Slave ID | Register | Field | Mock key | Raw format |
| ---: | ---: | --- | --- | --- |
| `1` | `4` | water level | `water_level` | integer, `/1.0f` |
| `2` | `0` | water temperature | `water_temperature` | `x10`, then `/10.0f` |
| `2` | `1` | pH | `ph` | `x10`, then `/10.0f` |
| `3` | `2-3` | dissolved oxygen | `dissolved_oxygen` | IEEE-754 float, big-endian words |
| `3` | `4-5` | DO temperature | `do_temperature` | IEEE-754 float, big-endian words |
| `4` | `1` | EC | `ec` | `x10`, then `/10.0f` |
| `5` | `0` | ammonia | `ammonia` | `x100`, then `/100.0f` |
| `5` | `1` | ANS pH | `ph` | `x100`, then `/100.0f` |
| `5` | `2` | ANS temperature | `ammonia_temperature` | `x10`, then `/10.0f` |

Generator compatibility notes:

- The plugin lets every sub-sensor choose an `ID`. The saved test uses IDs `1..5` so overlapping register addresses can be mocked independently on one RS485 bus.
- The plugin requests `DOrs485.readHoldingRegisters(0, 5)` but later reads response buffer index `5`. The saved Circuit example requests `6` registers to include indexes `0..5`.
- The component represents the complete suite as one Circuit device with one shared RS485 connection.
- Default mock output includes water level, pH/water temperature, DO/DO temperature, EC, ammonia/ANS pH/ANS temperature.

## Weather Sensor

Fields:

- `ID`

Exposed readings:

- humidity
- temperature
- noise
- CO2
- pressure
- lux

Reference snippet:

```cpp
#include <ModbusMaster.h>

ModbusMaster rs485_Weather_HTCo2PLx;

void setup() {
  Wire.begin();
  Serial2.begin(9600);
  rs485_Weather_HTCo2PLx.begin(1, Serial2);
}

void loop() {
  uint8_t result = rs485_Weather_HTCo2PLx.readHoldingRegisters(500, 10);
  float humidity = rs485_Weather_HTCo2PLx.getResponseBuffer(0) / 10.0f;
  float temperature = rs485_Weather_HTCo2PLx.getResponseBuffer(1) / 10.0f;
  float noise = rs485_Weather_HTCo2PLx.getResponseBuffer(2) / 10.0f;
  float co2 = rs485_Weather_HTCo2PLx.getResponseBuffer(3);
  float pressure = rs485_Weather_HTCo2PLx.getResponseBuffer(5);
  float lux = rs485_Weather_HTCo2PLx.getResponseBuffer(7);
}
```

Implemented Circuit integration:

| Item | Value |
| --- | --- |
| Component id | `66` |
| Class | `BfarmWeatherSensorRs485Element` |
| Display name | `Weather sensor` |
| Pins | `VCC`, `GND`, `A+`, `B-` |
| Example key | `handysense_real_bfarm_weather_sensor_test` |
| Mock profile | `bfarm-weather-sensor-rs485` |
| Slave ID | `1` |

Weather register map:

| Register | Buffer index | Field | Mock key | Raw scale | Code conversion |
| ---: | ---: | --- | --- | ---: | --- |
| `500` | `0` | humidity | `humidity` | `x10` | `/10.0f` |
| `501` | `1` | temperature | `temperature` | `x10` | `/10.0f` |
| `502` | `2` | noise | `noise` | `x10` | `/10.0f` |
| `503` | `3` | CO2 | `co2` | `x1` | none |
| `505` | `5` | pressure | `pressure` | `x1` | none |
| `507` | `7` | lux | `lux` | `x1` | none |

## Notes and Caveats

- Several zip plugins emit repeated `begin(...)` calls inside lambda expressions. That is valid as a generator output reference, but we may want cleaner code when hand-writing Circuit examples.
- A few generator files look inconsistent or buggy:
  - `Turbidity XM8518 RS485` references `Turbidity_XM3318_Rs485` in one line.
  - `Ultrasonic rs485` reads `getResponseBuffer(256)`, which may not match typical Modbus buffer indexing.
  - `Water Quality` mixes multiple independent sensor objects in one plugin.
- For parser/emulator tests, preserving the original code shape from `generators_*.js` is more important than making every snippet perfectly idiomatic.
