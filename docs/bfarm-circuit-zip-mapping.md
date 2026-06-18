# BFarm Circuit to Zip Plugin Mapping

This note maps the current `#circuit` sensor components to the sensor plugins found in `bfarm_plugin80669.zip`.

## Current Circuit Components

Source references:

- [src/panels/component.ts](/e:/สวทช/mini2/package/user_input_files/HackCable-main/src/panels/component.ts:271)
- [src/main.ts](/e:/สวทช/mini2/package/user_input_files/HackCable-main/src/main.ts:589)
- [src/ui/i18n/en_us.json](/e:/สวทช/mini2/package/user_input_files/HackCable-main/src/ui/i18n/en_us.json:60)

| Circuit component | Zip plugin | Match status | Notes |
| --- | --- | --- | --- |
| `pH Sensor` | None | No direct match | Generic analog pH component exists in Circuit, but no same-named plugin in the zip. |
| `Air Humidity Sensor` | `Weather sensor`, `SEN55 I2C` | Partial | Zip plugins expose humidity, but as part of multi-sensor modules. |
| `pH Sensor (RS485)` | None | No direct match | Could be added as a dedicated RS485 pH plugin later. |
| `Light Sensor (RS485)` | `Lux120k rs485` | Strong | Same measurement domain and same RS485/Modbus style. |
| `Rain Sensor (RS485)` | None | No direct match | No rain-specific plugin found in the zip. |
| `Wind Speed Sensor (RS485)` | `Air Velocity Sensor (SM3789)` | Strong | Same category and RS485 register-read pattern. |
| `PAR Sensor (RS485)` | None | No direct match | No PAR-specific plugin found in the zip. |
| `Weather Station (HTCO2PLX)` | `Weather sensor` | Strong | Very close: weather plugin exposes humidity, temperature, noise, CO2, pressure, lux. |
| `SHT31 Sensor (I2C)` | `SEN55 I2C` | Partial | Both are I2C environmental sensors, but different chip families and outputs. |
| `BH1750 Sensor (I2C)` | `Lux120k rs485` | Partial | Same light/lux domain, but different hardware bus. |
| `Current Loop 4-20mA` | `TMEC Sensor` | Partial | TMEC plugin uses `ReadAnalog_from_MPC3424(...)`, which is closer to ADC/current-loop style input than RS485 sensors. |
| `Soil Moisture Sensor` | `Tubular Soil Moisture Sensor` | Strong | Same domain, but zip plugin is a multi-depth RS485 probe. |
| `Fertilizer pH Sensor (RS485)` | `Water Quality` | Partial | `Water Quality` plugin includes a pH RS485 path, but it is embedded in a larger suite. |
| `EC Sensor (RS485)` | `7in1Soil MultiRead`, `Water Quality` | Partial | Both zip plugins expose EC values, but not as dedicated EC-only components. |
| `Fertilizer Temp Sensor (RS485)` | `SoilTemp MultiRead RS485`, `Water Quality` | Partial | Both expose temperature data, but not fertilizer-specific naming. |
| `Ammonia Sensor (RS485)` | `Ammonia RS485` | Match | Dedicated BFarm component id 53 with Handysense real example and Modbus mock profile. |
| `Soil Temp/Moisture Sensor (RS485)` | `SoilTemp MultiRead RS485` | Match | Dedicated BFarm component id 54 with Handysense real example and two-register Modbus mock profile. |
| `SEN55 Air Sensor (I2C)` | `SEN55 I2C` | Match | Dedicated BFarm component id 55 with Handysense real I2C example and eight-value mock bridge. |
| `Ultrasonic Sensor (RS485)` | `Ultrasonic rs485` | Match | Dedicated BFarm component id 56 with Handysense real example and distance mock at Modbus register 256. |
| `Turbidity Sensor XM3318B (RS485)` | `Turbidity XM3318B RS485` | Match | Dedicated BFarm component id 57 with Handysense real example and raw turbidity mock at Modbus register 0. |
| `Turbidity Sensor XM8518 (RS485)` | `Turbidity XM8518 RS485` | Match | Dedicated BFarm component id 58 with Handysense real example and raw turbidity mock at Modbus register 0. |

## Zip Plugins Not Yet Represented as Dedicated Circuit Components

These are the clearest candidates if the goal is "cover the zip catalog directly":

| Zip plugin | Suggested Circuit component name | Why add it |
| --- | --- | --- |
| `TMEC Sensor` | `TMEC Analog Sensor` | Current Circuit lacks a generic TMEC/MCP3424-style analog mapping component. |
| `TMEC-NITRATE-ISFET PLATFORM` | `Nitrate ISFET Sensor (RS485)` | Unique nitrate-specific sensor. |
| `TMEC-Tensio Rs485` | `TMEC Tensio Sensor (RS485)` | Distinct telemetry set and register mode. |
| `Tubular Soil Moisture Sensor` | `Tubular Soil Probe (RS485)` | Existing soil moisture component is much more generic. |
| `Water Quality` | `Water Quality Suite (RS485)` | Bundles water level, pH, DO, EC, and ammonia-related reads. |

## Recommended Build Order

If we scaffold in phases, this order gives the best coverage first:

1. `Nitrate ISFET Sensor (RS485)`
2. `TMEC Tensio Sensor (RS485)`
3. `TMEC Analog Sensor`
4. `Water Quality Suite (RS485)`
5. `Tubular Soil Probe (RS485)`

## Notes on Block Files

- `blocks_*.js` defines the Blockly block shape and user inputs.
- `generators_*.js` defines the emitted Arduino/C++ code template.
- For `#circuit` testing without implementing `#blocks`, `generators_*.js` is the primary source for realistic code snippets.
