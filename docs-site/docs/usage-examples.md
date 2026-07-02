---
id: usage-examples
title: ตัวอย่างการใช้งาน
sidebar_position: 6
---

หน้านี้รวม example ที่เหมาะกับการลองระบบเร็ว ๆ โดยเลือกจากรายการ example แล้วทดลองปรับค่าจำลองใน `Mock Sensors`

## 1. SHT31 + Fan

เหมาะสำหรับทดสอบระบบที่ใช้ค่าอุณหภูมิและความชื้นเพื่อสั่งพัดลม

- ลองปรับ `temperature`
- ลองปรับ `humidity`
- ดูว่าพัดลมหรือ output ตอบสนองตามเงื่อนไขหรือไม่

![เลือก example](/img/simulation/workflow-select-example.png)

## 2. Soil Moisture + Water Pump

เหมาะสำหรับทดสอบระบบรดน้ำอัตโนมัติ

- ลองลดค่า `soil`
- สังเกตว่า water pump เริ่มทำงานหรือไม่
- ดูผลใน `Serial Monitor` เพิ่มเติมได้

![ดูผลลัพธ์จาก simulation](/img/simulation/workflow-output-panel.png)

## 3. pH + Misting Pump

เหมาะสำหรับทดสอบระบบที่อิงค่ากรด-ด่างและการสั่งอุปกรณ์ทำงานต่อเนื่อง

- ลองปรับ `ph`
- ถ้ามี logic เพิ่มเติม ให้ดูผลร่วมกับ output หรือ monitor
- ใช้ทดสอบการตอบสนองของอุปกรณ์แบบเร็วได้ดี

## 4. ทดลองหลายค่าใน Mock Sensors

ถ้าต้องการดูผลกระทบจากหลายตัวแปรพร้อมกัน ให้แก้หลายค่าใน `Mock Sensors` แล้วรันซ้ำ

ตัวอย่างเช่น

- เพิ่ม `temperature`
- ลด `soil`
- เปลี่ยน `ph`

![ทดลองค่าจำลอง](/img/simulation/mock-sensors-panel.png)

## เลือก example แบบเร็ว

- ถ้าอยากลองพัดลม: `BFARM SHT31 + Fan`
- ถ้าอยากลองปั๊มน้ำ: `BFARM Soil Moisture + Water Pump`
- ถ้าอยากลองค่า pH: `BFARM RS485 pH + Misting Pump`
