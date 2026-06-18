# คู่มือเพิ่ม BFarm Sensor Component ใน Circuit

## Goal

เอกสารนี้สรุปขั้นตอนทั้งหมดที่ใช้สร้าง `7in1Soil MultiRead` ฝั่ง `#circuit` และใช้เป็นแม่แบบสำหรับเพิ่ม sensor ที่เหลืออีก 13 ตัวจาก BFarm zip plugin

ขอบเขตของคู่มือนี้คือ circuit component, code example, mock sensor และ runtime visualization เท่านั้น ไม่รวมการสร้างหรือแก้ block ในฝั่ง `#blocks`

ภาพรวมของข้อมูลและการทำงาน:

```text
zip plugin blocks.js / generators.js
  -> docs/bfarm-sensor-snippets.md
  -> Circuit component
  -> Component registry
  -> BFarm Sensors catalog
  -> Runtime activation
  -> Example code + saved wiring
  -> Mock register mapping
  -> Compile / Execute / Serial Monitor test
```

แหล่งข้อมูลหลักสำหรับ sensor แต่ละตัว:

- `blocks*.js` บอกชื่อ block, input, field และค่าที่ผู้ใช้เลือกได้
- `generators*.js` บอก C++ ที่ block สร้างจริง เช่น library, object, slave ID, register address, buffer index และ scale
- `docs/bfarm-sensor-snippets.md` เป็นสรุป code shape ที่ฝั่ง Circuit ควรรองรับ
- `docs/bfarm-circuit-zip-mapping.md` ใช้ตรวจว่า component ใดสร้างแล้วหรือยัง และชื่อ Circuit ที่แนะนำ

เมื่อข้อมูลไม่ตรงกัน ให้ยึด code ที่ออกจาก `generators*.js` เป็นหลัก เพราะเป็น code ที่ฝั่ง `#circuit` จะได้รับจริง

## What Was Built For 7in1

### 1. Circuit component

สร้างไฟล์:

```text
src/components/bfarm-7in1-soil-multiread-element.ts
```

ค่าหลักที่ใช้:

| รายการ | ค่า |
| --- | --- |
| Class | `Bfarm7in1SoilMultireadElement` |
| Custom element | `bfarm-7in1-soil-multiread-element` |
| Component ID | `52` |
| Category | `ComponentType.BFARM_SENSOR` |
| Pins | `VCC`, `GND`, `A+`, `B-` |
| Active state | `isOn` |
| Active color | `#00e676` |

ตัว component extends `LitElement` และประกาศ `pinInfo` เพื่อให้ Circuit สร้าง port สำหรับลากสายได้:

```ts
readonly pinInfo: ElementPin[] = [
  { name: 'VCC', x: 75, y: 15, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
  { name: 'GND', x: 75, y: 25, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
  { name: 'A+', x: 75, y: 35, signals: [], number: 3 },
  { name: 'B-', x: 75, y: 45, signals: [], number: 4 },
];
```

ตัว SVG ใช้ `isOn` เปลี่ยนสีขอบและไฟสถานะ เมื่อ runtime ตรวจพบว่า code ใช้งาน bus ที่ sensor ต่ออยู่

### 2. Component registry และ catalog

ใน `src/panels/component.ts` มีการ:

- import `Bfarm7in1SoilMultireadElement`
- เพิ่ม class ลงใน `WokwiComponent`
- เพิ่ม class ลงใน `wokwiComponentClasses`
- เพิ่ม `ComponentType.BFARM_SENSOR`
- register component id `52`
- ใช้ i18n keys:
  - `wokwiComponents.bfarm7in1SoilMultiread.name`
  - `wokwiComponents.bfarm7in1SoilMultiread.description`

ใน `src/panels/catalog.ts` มี dropdown `BFarm Sensors` ซึ่ง filter เฉพาะ `ComponentType.BFARM_SENSOR`

กฎของ catalog:

- Sensor เดิมในระบบใช้ `ComponentType.BFARM` และอยู่ใน dropdown `Sensor`
- Sensor ที่สร้างจาก zip plugin ชุดนี้ใช้ `ComponentType.BFARM_SENSOR` และอยู่ใน dropdown `BFarm Sensors`
- `All` ต้องรวมทั้ง actuator, sensor เดิม และ BFarm plugin sensor
- ยังไม่ควร register sensor ที่มีเพียงชื่อหรือ placeholder แต่ยังไม่มี component/runtime test ที่ใช้งานได้

### 3. Runtime activation

ใน `src/main.ts` มีการ:

- import class ของ sensor
- เพิ่ม class ลงใน `BFARM_SENSOR_TYPES`
- ใช้ `isOn` และ `requestUpdate()` เพื่อแสดง active state
- ปิดสถานะ sensor ทั้งหมดเมื่อหยุด execution ผ่าน `deactivateAllSensors()`

sensor ใหม่ทุกตัวที่ต้อง highlight เมื่อ code ใช้งาน ต้องอยู่ใน `BFARM_SENSOR_TYPES`

### 4. i18n

เพิ่มชื่อและ description ใน:

- `src/ui/i18n/en_us.json`
- `src/ui/i18n/th_th.json`
- `src/ui/i18n/fr_fr.json`

สำหรับ 7in1 มี mock keys เพิ่มเติม:

- `ui.mock.sensor.ec`
- `ui.mock.sensor.nitrogen`
- `ui.mock.sensor.phosphorus`
- `ui.mock.sensor.potassium`

ถ้า sensor ใหม่ใช้ค่าที่ไม่มีใน `SensorKey` ต้องเพิ่ม key, default range, label และคำแปลก่อน จึงจะเลือกค่านั้นใน Timeline/Graph mock editor ได้

### 5. Example code และ circuit wiring

ใน `web/index.html` เพิ่ม group:

```html
<optgroup label="BFarm sensor TEST">
  <option value="handysense_real_bfarm_7in1_soil_multiread_test">
    7in1Soil MultiRead Test
  </option>
</optgroup>
```

ใน `web/index.ts` เพิ่ม:

- code example key `handysense_real_bfarm_7in1_soil_multiread_test`
- switch case สำหรับเรียก circuit setup
- function `setupHandysenseRealBfarm7in1SoilMultireadTestCircuit()`
- board component id `51`
- sensor component id `52`
- wiring ครบ 4 เส้น

example code อ่าน Modbus registers และพิมพ์:

```text
moisture,temp,ec,ph,n,p,k
```

### 6. Mock Modbus register map

7in1 ใช้ profile `bfarm-7in1-soil` ใน `web/index.ts`

| Buffer/Register index | Mock key | Default | Raw scale | ค่าที่ code ใช้ |
| --- | --- | ---: | ---: | --- |
| `0` | `soil` | `50` | `x10` | moisture `/10.0` |
| `1` | `temperature` | `25` | `x10` | temperature `/10.0` |
| `2` | `ec` | `1200` | `x1` | EC raw |
| `3` | `ph` | `7.0` | `x10` | pH `/10.0` |
| `4` | `nitrogen` | `120` | `x1` | N raw |
| `5` | `phosphorus` | `60` | `x1` | P raw |
| `6` | `potassium` | `180` | `x1` | K raw |

ผล Serial Monitor ที่ตรวจแล้ว:

```text
moisture=50.00,temp=25.00,ec=1200.00,ph=7.00,n=120.00,p=60.00,k=180.00
```

## Repeatable Steps For The Next 13 Sensors

### Step 1: อ่าน plugin และทำ register specification

ตรวจ `blocks*.js` และ `generators*.js` ของ sensor ก่อนเขียน component

บันทึกข้อมูลต่อไปนี้ลง `docs/bfarm-sensor-snippets.md`:

- protocol: RS485, I2C, analog หรือ protocol อื่น
- library และ include
- object/class ที่ generator สร้าง
- baud rate หรือ I2C address
- Modbus slave ID
- start register และจำนวน register
- `getResponseBuffer()` index
- scale เช่น `/10`, `/100`, `x10`
- output fields และหน่วย
- code shape จริงที่ generator ส่งออก

สร้าง register table ก่อนเริ่ม mock:

| Buffer index | Field | Mock key | Raw scale | Unit | Default |
| --- | --- | --- | ---: | --- | ---: |
| `0` | `<field>` | `<mock-key>` | `x1` | `<unit>` | `<value>` |

ห้ามเดา register จากชื่อ sensor เพราะ sensor คนละรุ่นอาจใช้ register หรือ scale ต่างกัน แม้วัดค่าเดียวกัน

### Step 2: สร้าง component file

ตั้งชื่อไฟล์:

```text
src/components/bfarm-<sensor-slug>-element.ts
```

รูปแบบชื่อ:

| รายการ | Pattern | ตัวอย่าง |
| --- | --- | --- |
| File | `bfarm-<sensor-slug>-element.ts` | `bfarm-ammonia-rs485-element.ts` |
| Class | `Bfarm<SensorPascalCase>Element` | `BfarmAmmoniaRs485Element` |
| Custom element | `bfarm-<sensor-slug>-element` | `bfarm-ammonia-rs485-element` |
| i18n prefix | `wokwiComponents.bfarm<SensorCamelCase>` | `wokwiComponents.bfarmAmmoniaRs485` |

สำหรับ RS485 ให้เริ่มด้วย pins:

```ts
readonly pinInfo: ElementPin[] = [
  { name: 'VCC', x: 75, y: 15, signals: [{ type: 'power', signal: 'VCC' }], number: 1 },
  { name: 'GND', x: 75, y: 25, signals: [{ type: 'power', signal: 'GND' }], number: 2 },
  { name: 'A+', x: 75, y: 35, signals: [], number: 3 },
  { name: 'B-', x: 75, y: 45, signals: [], number: 4 },
];
```

สำหรับ I2C หรือ analog ให้ใช้ pin names และ signals ตาม hardware จริง ไม่ต้องฝืนใช้ RS485 template

component ที่ต้องมี runtime highlight ให้ประกาศ:

```ts
isOn = false;
```

และใช้ `this.isOn` เปลี่ยน visual state อย่างน้อยหนึ่งจุด เช่นขอบหรือ LED

### Step 3: Register component

แก้ `src/panels/component.ts`:

1. import class ใหม่
2. เพิ่ม class ใน `WokwiComponent`
3. เพิ่ม class ใน `wokwiComponentClasses`
4. เพิ่ม object ใน `wokwiComponents()`
5. ใช้ component id ถัดไปที่ยังไม่ถูกใช้
6. กำหนด `type: ComponentType.BFARM_SENSOR`

template:

```ts
{
  id: <NEXT_ID>,
  clasz: Bfarm<SensorPascalCase>Element,
  name: i18next.t("wokwiComponents.bfarm<SensorCamelCase>.name"),
  description: i18next.t("wokwiComponents.bfarm<SensorCamelCase>.description"),
  type: ComponentType.BFARM_SENSOR
}
```

อย่าใช้ id ซ้ำ ตรวจด้วย:

```powershell
rg -n "id: " src/panels/component.ts
```

### Step 4: เพิ่ม i18n

เพิ่ม name และ description ในทุก locale ที่ repo ใช้:

```json
"wokwiComponents.bfarm<SensorCamelCase>.name": "<Display Name>",
"wokwiComponents.bfarm<SensorCamelCase>.description": "<Protocol and measured values>"
```

ถ้ามี mock field ใหม่ ให้แก้ `SensorKey`, `SENSOR_KEYS`, `SENSOR_DEFAULT_RANGES`, `SENSOR_LABEL_KEYS` ใน `web/index.ts` และเพิ่ม `ui.mock.sensor.<key>` ใน i18n

### Step 5: เพิ่ม runtime activation

แก้ `src/main.ts`:

1. import component class
2. เพิ่ม class ลง `BFARM_SENSOR_TYPES`
3. ตรวจว่า component มี `isOn`
4. ตรวจว่า bus/pins ที่ runtime ส่งมา match กับสายที่ต่อจริง

การอยู่ใน catalog อย่างเดียวไม่ทำให้ sensor highlight ต้อง register runtime class ด้วย

### Step 6: เพิ่ม test example

เพิ่ม option ใต้ group `BFarm sensor TEST` ใน `web/index.html`

example key pattern:

```text
handysense_real_bfarm_<sensor_slug>_test
```

example display name pattern:

```text
<Sensor Display Name> Test
```

ใน `web/index.ts` เพิ่ม:

- entry ใน `codeExamples`
- switch case ของ example key
- setup function ชื่อ `setupHandysenseRealBfarm<SensorPascalCase>TestCircuit`
- board figure id `51`
- sensor figure id ใหม่
- `connectPorts()` ตาม protocol

code example ต้องใกล้เคียง output จาก generator เพื่อทดสอบ parser/runtime ด้วย code shape ที่จะได้รับจริง

### Step 7: เพิ่ม mock bridge

สำหรับ Modbus ให้เพิ่ม sensor profile หรือ register map ที่ `hackcable_modbus_read`

profile ควรเลือกจาก:

- selected example key หรือ
- component id ที่มีอยู่บน canvas

ทุก field ต้องกำหนด:

- mock key
- default value
- raw scale ที่ส่งเข้า response buffer
- buffer/register index

ตัวอย่าง:

```ts
const registers: Record<number, number> = {
  0: getScaledMockRegisterValue('<mock-key>', <default>, <scale>),
};
```

ถ้า generator อ่าน `getResponseBuffer(0) / 10.0f` mock bridge ต้องคืนค่า mock คูณ `10` ก่อน

ถ้า sensor ใช้ start register ที่ไม่ใช่ `0` ให้ตรวจ implementation ของ Modbus shim ด้วย เพราะ bridge จะได้รับ address ที่คำนวณจาก `start register + buffer index`

### Step 8: ทดสอบ end to end

1. เลือก example จาก `BFarm sensor TEST`
2. ตรวจว่า board เป็น `Handysense real`
3. ตรวจว่า component ถูกวางบน canvas
4. ตรวจจำนวนสายและชื่อ pin
5. เปิด `Mock Sensors` และตั้งค่าที่แยกแยะได้ง่าย
6. กด Compile
7. กด Execute
8. ตรวจ sensor เปลี่ยน `isOn=false` เป็น `isOn=true`
9. ตรวจ Serial Monitor ตรงกับ mock หลังคิด scale
10. กด Stop และตรวจว่า active state ถูกปิด

## Code/Runtime Integration Points

| ไฟล์ | หน้าที่ | ต้องแก้เมื่อใด |
| --- | --- | --- |
| `src/components/bfarm-*-element.ts` | รูปร่าง, pins, `isOn` | ทุก sensor |
| `src/panels/component.ts` | class union, class list, id, name, category | ทุก sensor |
| `src/panels/catalog.ts` | dropdown/filter `BFarm Sensors` | ปกติไม่ต้องแก้อีก ถ้าใช้ `BFARM_SENSOR` |
| `src/main.ts` | runtime activation/highlight | ทุก sensor ที่มี active state |
| `src/ui/i18n/*.json` | name, description, mock labels | ทุก sensor |
| `web/index.html` | example option และ default text mock | ทุก test example หรือ mock key ใหม่ |
| `web/index.ts` | example code, wiring, mock keys/register profiles | ทุก sensor |
| `docs/bfarm-sensor-snippets.md` | generator-derived snippet/register reference | ทุก sensor |

## Mock And Serial Monitor Rules

Serial Monitor ไม่ได้อ่านค่าจาก mock panel โดยตรง แต่แสดงเฉพาะสิ่งที่ example code เรียก `Serial.print()` หลังผ่าน library shim และ register conversion แล้ว

data flow ของ Modbus:

```text
Mock Sensors value
  -> hackcable_modbus_read(slaveId, registerAddress)
  -> ModbusMaster response buffer
  -> getResponseBuffer(index)
  -> scale ใน C++ example
  -> Serial.print()
```

ดังนั้นค่าจะตรงกันเมื่อทั้งสามส่วนตรงกัน:

1. mock register address/index
2. raw scale ใน bridge
3. division/multiplication ใน generated C++

ตัวอย่างที่ถูก:

```text
mock temperature = 25
bridge returns 250
code reads buffer / 10.0
serial prints 25.0
```

ตัวอย่างที่ผิด:

```text
mock temperature = 25
bridge returns 25
code reads buffer / 10.0
serial prints 2.5
```

อย่าใช้ generic weather register map กับ sensor ใหม่โดยไม่ตรวจ generator เพราะ index เดียวกันอาจหมายถึงคนละ field

## Handysense Real Wiring Test

RS485 wiring มาตรฐาน:

| Sensor pin | Handysense real pin |
| --- | --- |
| `VCC` | `RS485_24V` |
| `GND` | `RS485_GND` |
| `A+` | `RS485_A` |
| `B-` | `RS485_B` |

code example ใช้:

```cpp
const int RXD = 16;
const int TXD = 17;

Serial2.begin(9600, SERIAL_8N1, RXD, TXD);
sensor.begin(<SLAVE_ID>, Serial2);
```

สำหรับ sensor ที่ใช้ baud rate, slave ID หรือ wiring ต่างจากนี้ ให้ใช้ค่าจาก generator/plugin และระบุไว้ใน example comment

## Acceptance Checklist

ใช้ checklist นี้กับ sensor ใหม่ทุกตัว:

- [ ] มีข้อมูลจาก `blocks*.js` และ `generators*.js`
- [ ] มี register/field/scale table ใน `docs/bfarm-sensor-snippets.md`
- [ ] มี component class และ custom element ที่ชื่อไม่ชนกัน
- [ ] pins ตรงกับ protocol จริง
- [ ] มี `isOn` และ active visual state ถ้าต้องการ runtime highlight
- [ ] component id ไม่ซ้ำ
- [ ] class อยู่ใน `WokwiComponent` และ `wokwiComponentClasses`
- [ ] registry ใช้ `ComponentType.BFARM_SENSOR`
- [ ] component ปรากฏใต้ dropdown `BFarm Sensors`
- [ ] มี name/description ครบทุก i18n locale
- [ ] class อยู่ใน `BFARM_SENSOR_TYPES`
- [ ] มี example ใต้ `BFarm sensor TEST`
- [ ] example code ใกล้เคียง generator output
- [ ] setup function วาง board, sensor และต่อสายครบ
- [ ] mock keys และ ranges ครบทุก output ที่ต้องทดสอบ
- [ ] mock register map ตรงกับ register index และ scale
- [ ] Compile และ Execute ผ่าน
- [ ] Serial Monitor ตรงกับ mock
- [ ] sensor highlight ตอนทำงานและดับเมื่อ Stop
- [ ] `npm run type-check` ผ่าน
- [ ] `npm run build:web:core` ผ่าน

## Sensor Template

กรอกตารางนี้ก่อนเริ่ม sensor ตัวถัดไป:

| รายการ | ค่า |
| --- | --- |
| Zip plugin name | `<PLUGIN_NAME>` |
| Circuit display name | `<DISPLAY_NAME>` |
| Slug | `<sensor-slug>` |
| Class | `Bfarm<SensorPascalCase>Element` |
| Custom element | `bfarm-<sensor-slug>-element` |
| Component ID | `<NEXT_UNUSED_ID>` |
| Protocol | `<RS485 / I2C / analog>` |
| Pins | `<PIN_LIST>` |
| Library | `<LIBRARY>` |
| Bus settings | `<BAUD / ADDRESS>` |
| Slave ID | `<SLAVE_ID or N/A>` |
| Example key | `handysense_real_bfarm_<sensor_slug>_test` |
| Mock profile | `bfarm-<sensor-slug>` |
| Output fields | `<FIELD_LIST>` |

register template:

| Start register | Buffer index | Field | Mock key | Raw scale | Code conversion | Unit | Default |
| ---: | ---: | --- | --- | ---: | --- | --- | ---: |
| `<start>` | `<index>` | `<field>` | `<key>` | `<scale>` | `/<scale>` | `<unit>` | `<default>` |

component registry template:

```ts
{
  id: <NEXT_UNUSED_ID>,
  clasz: Bfarm<SensorPascalCase>Element,
  name: i18next.t("wokwiComponents.bfarm<SensorCamelCase>.name"),
  description: i18next.t("wokwiComponents.bfarm<SensorCamelCase>.description"),
  type: ComponentType.BFARM_SENSOR
}
```

example wiring template:

```ts
function setupHandysenseRealBfarm<SensorPascalCase>TestCircuit() {
  selectBoardForExample('handysense-real');
  hackCable.editor.canvas.clear();

  const boardFigure = new ComponentFigure(wokwiComponentById[51]);
  hackCable.editor.canvas.add(boardFigure.setX(900).setY(600));

  const sensorFigure = new ComponentFigure(wokwiComponentById[<SENSOR_ID>]);
  hackCable.editor.canvas.add(sensorFigure.setX(500).setY(60));

  setTimeout(() => {
    connectPorts(sensorFigure, 'VCC', boardFigure, 'RS485_24V');
    connectPorts(sensorFigure, 'GND', boardFigure, 'RS485_GND');
    connectPorts(sensorFigure, 'A+', boardFigure, 'RS485_A');
    connectPorts(sensorFigure, 'B-', boardFigure, 'RS485_B');
  }, 500);
}
```

คำสั่งตรวจขั้นสุดท้าย:

```powershell
npm run type-check
npm run build:web:core
```

หลังสองคำสั่งผ่าน ต้องทดสอบหน้าเว็บจริงอีกครั้ง เพราะ type-check/build ไม่สามารถยืนยัน wiring, highlight, mock mapping หรือ Serial Monitor ได้
