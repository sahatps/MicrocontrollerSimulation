---
id: mock-sensors
title: Mock Sensors / การทดสอบค่าเซ็นเซอร์
sidebar_position: 4
---

`Mock Sensors` ใช้สำหรับใส่ค่าจำลองให้ sensor เพื่อทดสอบว่าโค้ดและ logic ของระบบตอบสนองถูกหรือไม่

## 1. เปิดแท็บ Mock Sensors

หลังเลือก example และ compile แล้ว ให้เปิดแท็บ `Mock Sensors`

![แท็บ Mock Sensors](/img/simulation/mock-sensors-panel.png)

## 2. แก้ค่าในโหมด Text

โหมด `Text` เหมาะกับการแก้ค่าทีละหลายตัวแบบเร็ว  
แก้ตัวเลขหลังเครื่องหมาย `=` ได้ตรง ๆ

ตัวอย่างค่าที่พบได้บ่อย

- `humidity`
- `temperature`
- `ph`
- `lux`
- `soil`
- `ec`
- `nitrogen`
- `phosphorus`
- `potassium`

![ค่าจำลองในโหมด Text](/img/simulation/mock-sensors-text-values.png)

## 3. ใช้ Timeline เมื่อต้องการจำลองค่าที่เปลี่ยนตามเวลา

ถ้าต้องการทดสอบค่าขึ้นลงต่อเนื่อง ให้ใช้โหมด `Timeline`

- ตั้งช่วงเวลา `Duration`
- เลือก sensor ที่ต้องการ
- กำหนดช่วงค่า `Y Min` และ `Y Max`

![โหมด Timeline](/img/simulation/mock-sensors-timeline.png)

## 4. ดูผลหลังเปลี่ยนค่า

เมื่อเปลี่ยนค่าใน `Mock Sensors` แล้ว ให้กลับไปดูผลที่

- `Serial Monitor`
- `Serial Plotter`
- พฤติกรรมของ actuator ใน simulation

![Mock Sensors และผลลัพธ์](/img/simulation/mock-sensors-output-relation.png)

## วิธีทดสอบแบบสั้น

1. เปิด `Mock Sensors`
2. เปลี่ยนค่าที่อยากทดสอบ เช่น `humidity = 90`
3. Run simulation
4. ดูว่า output หรืออุปกรณ์ตอบสนองตามที่คาดไหม
