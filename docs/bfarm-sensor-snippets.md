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

- `Air Velocity Sensor (RS485)`

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

Circuit match today:

- `Light Sensor (RS485)`

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

Circuit match today:

- `Weather Station (HTCO2PLX)`

## Notes and Caveats

- Several zip plugins emit repeated `begin(...)` calls inside lambda expressions. That is valid as a generator output reference, but we may want cleaner code when hand-writing Circuit examples.
- A few generator files look inconsistent or buggy:
  - `Turbidity XM8518 RS485` references `Turbidity_XM3318_Rs485` in one line.
  - `Ultrasonic rs485` reads `getResponseBuffer(256)`, which may not match typical Modbus buffer indexing.
  - `Water Quality` mixes multiple independent sensor objects in one plugin.
- For parser/emulator tests, preserving the original code shape from `generators_*.js` is more important than making every snippet perfectly idiomatic.
