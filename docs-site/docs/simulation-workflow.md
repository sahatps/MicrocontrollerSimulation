---
id: simulation-workflow
title: วิธีใช้งาน Simulation
sidebar_position: 3
---

หน้านี้สรุปลำดับใช้งาน Simulation แบบสั้น ๆ ตั้งแต่เลือกอุปกรณ์ ต่อสาย จนถึงดูผลและปรับค่าเซ็นเซอร์จำลอง

## 1. เลือก board หรือ example

ถ้าต้องการเริ่มเร็ว ให้เลือก `example` ก่อน  
ถ้าต้องการวางวงจรเอง ให้เลือก `board` ที่ต้องการแล้วค่อยเพิ่มอุปกรณ์ทีหลัง

![เลือก board และ example](/img/simulation/workflow-select-example.png)

## 2. เลือก component จากแถบซ้าย

ค้นหาหรือเลือกอุปกรณ์จากหมวดที่ต้องการ แล้วลากลงพื้นที่วางวงจรตรงกลาง

- เริ่มจาก `board`
- แล้วค่อยเพิ่ม `sensor`
- ปิดท้ายด้วย `actuator`

![รายการอุปกรณ์ทางซ้าย](/img/simulation/screen-components-panel.png)

## 3. ต่อสายเข้าบอร์ด

ต่อสายจากขาของอุปกรณ์ไปยังขาที่ตรงบนบอร์ด เช่น

- `VCC` ไปไฟเลี้ยง
- `GND` ไปกราวด์
- `SIG`, `AO`, `DO`, `SDA`, `SCL` ไปขาสัญญาณที่โค้ดใช้งาน

แนะนำให้ต่อไฟเลี้ยงก่อน แล้วค่อยต่อสายสัญญาณ จะเช็กง่ายกว่า

## 4. กด Compile

เมื่อเลือก example หรือจัดวงจรแล้ว ให้กด `Compile` เพื่อตรวจและเตรียมโค้ดก่อนรัน

- ถ้า compile ผ่าน จะกด `Run` ได้
- ถ้าไม่ผ่าน ให้ดูข้อความในแผงผลลัพธ์ด้านล่าง

## 5. กด Run / Stop / Pause

หลัง compile ผ่าน ให้กด `Run` เพื่อเริ่มจำลอง  
ระหว่างรันสามารถใช้ `Pause` หรือ `Stop` ได้ตามต้องการ

![ปุ่มควบคุมการจำลอง](/img/simulation/workflow-run-controls.png)

## 6. ดูโค้ดและผลลัพธ์

ใช้แถบด้านขวาเพื่อตรวจโค้ดและดูผลการทำงาน

- `Code` สำหรับดูหรือแก้โค้ด
- `Compiled` สำหรับดูผล compile
- `Serial Monitor` สำหรับข้อความที่โปรแกรมพิมพ์ออกมา
- `Serial Plotter` สำหรับดูค่าที่เปลี่ยนเป็นกราฟ

![แผงผลลัพธ์](/img/simulation/workflow-output-panel.png)

## 7. ทดลองค่าด้วย Mock Sensors

ถ้าตัวอย่างมี sensor สามารถเปิด `Mock Sensors` แล้วปรับค่าจำลองเพื่อดูผลตอบสนองของระบบได้ทันที

![แผง Mock Sensors](/img/simulation/workflow-mock-sensors.png)

## ลำดับสั้นที่สุด

1. เลือก board หรือ example
2. เพิ่ม component ที่ต้องใช้
3. ต่อสายเข้าบอร์ด
4. กด `Compile`
5. กด `Run`
6. ดูผลใน `Compiled` หรือ `Serial Monitor`
7. ปรับค่าใน `Mock Sensors` แล้วดูผลที่เปลี่ยน
