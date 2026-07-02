---
id: components
title: Components
sidebar_position: 4
---

หน้านี้รวม component หลักที่ใช้บ่อยในหน้า Simulation โดยแยกเป็น `Sensor` และ `Actuator`

![รายการอุปกรณ์ทางซ้าย](/img/simulation/screen-components-panel.png)

## Sensor

- `DHT22` วัดอุณหภูมิและความชื้น
- `HCSR04` วัดระยะหรือระดับวัตถุด้านหน้า
- `Temperature Sensor` วัดอุณหภูมิแบบพื้นฐาน
- `Photoresistor` วัดความสว่าง
- `Small Sound Sensor` ตรวจจับเสียงระดับต่ำ
- `Big Sound Sensor` ตรวจจับเสียงระดับสูง
- `pH Sensor` วัดค่าความเป็นกรด-ด่าง
- `Air Humidity Sensor` วัดความชื้นอากาศ
- `Soil Moisture Sensor` วัดความชื้นในดิน

## Actuator

- `LED` ไฟแสดงสถานะพื้นฐาน
- `RGB LED` ไฟแสดงผลหลายสี
- `LED Bar` แสดงผลเป็นแถบระดับ
- `Pixel / NeoPixel` ไฟดิจิทัลที่ควบคุมสีได้
- `Buzzer` ส่งเสียงเตือน
- `Servo` หมุนตามมุมที่กำหนด
- `Fan` จำลองพัดลมหรือการระบายอากาศ
- `Misting Pump` จำลองปั๊มพ่นหมอก
- `Water Pump` จำลองปั๊มน้ำ
- `Relay` ใช้สั่งเปิด-ปิดโหลด
- `Four Channel Relay` ควบคุมโหลดได้หลายช่องพร้อมกัน

## ใช้ยังไงแบบสั้น

1. เลือก `board`
2. เพิ่ม `sensor` ที่ต้องการอ่านค่า
3. เพิ่ม `actuator` ที่ต้องการควบคุม
4. ต่อ `VCC`, `GND` และขาสัญญาณให้ตรงกับโค้ด
