---
id: simulation-workflow
title: วิธีใช้งาน Simulation
sidebar_position: 3
---

หน้านี้สรุปลำดับใช้งาน Simulation แบบสั้น ๆ ตั้งแต่เลือกตัวอย่างจนถึงดูผลและปรับค่าเซ็นเซอร์จำลอง

## 1. เลือก board และ example

เริ่มจากเลือก board ที่ต้องการ แล้วเลือก example ให้ตรงกับงานที่อยากทดลอง

![เลือก board และ example](/img/simulation/workflow-select-example.png)

## 2. กด Compile

เมื่อเลือก example แล้ว ให้กด `Compile` เพื่อตรวจและเตรียมโค้ดก่อนรัน

- ถ้า compile ผ่าน จะกด `Run` ได้
- ถ้าไม่ผ่าน ให้ดูข้อความในแผงผลลัพธ์ด้านล่าง

## 3. กด Run / Stop / Pause

หลัง compile ผ่าน ให้กด `Run` เพื่อเริ่มจำลอง  
ระหว่างรันสามารถใช้ `Pause` หรือ `Stop` ได้ตามต้องการ

![ปุ่มควบคุมการจำลอง](/img/simulation/workflow-run-controls.png)

## 4. ดูโค้ดและผลลัพธ์

ใช้แถบด้านขวาเพื่อตรวจโค้ดและดูผลการทำงาน

- `Code` สำหรับดูหรือแก้โค้ด
- `Compiled` สำหรับดูผล compile
- `Serial Monitor` สำหรับข้อความที่โปรแกรมพิมพ์ออกมา
- `Serial Plotter` สำหรับดูค่าที่เปลี่ยนเป็นกราฟ

![แผงผลลัพธ์](/img/simulation/workflow-output-panel.png)

## 5. ทดลองค่าด้วย Mock Sensors

ถ้าตัวอย่างมี sensor สามารถเปิด `Mock Sensors` แล้วปรับค่าจำลองเพื่อดูผลตอบสนองของระบบได้ทันที

![แผง Mock Sensors](/img/simulation/workflow-mock-sensors.png)

## ลำดับสั้นที่สุด

1. เลือก board และ example
2. กด `Compile`
3. กด `Run`
4. ดูผลใน `Compiled` หรือ `Serial Monitor`
5. ปรับค่าใน `Mock Sensors` แล้วดูผลที่เปลี่ยน
