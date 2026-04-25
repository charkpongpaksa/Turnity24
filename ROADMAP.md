# 🚩 Roadmap & Future Features (สิ่งที่ต้องทำต่อ)

รายการฟีเจอร์และส่วนที่ต้องพัฒนาต่อเพื่อให้โปรเจกต์ Turnity สมบูรณ์ 100%

---

## 1. ฟีเจอร์ที่ต้องพัฒนาต่อ (Feature Development)

- [ ] **ระบบกระดานสนทนา (Discussions)**: 
    - พัฒนา Backend Lambda สำหรับ CRUD กระดานสนทนา
    - เชื่อมต่อหน้าจอ Discussion ในหน้าคอร์สเรียน
- [ ] **ระบบแจ้งเตือน (Notifications)**: 
    - พัฒนาการดึงข้อมูลแจ้งเตือน (เช่น มีงานใหม่, มีประกาศใหม่) จาก DynamoDB
- [ ] **การส่งงาน (Assignments Submission)**:
    - เพิ่มระบบอัปโหลดไฟล์จริงขึ้น **AWS S3**
    - บันทึกประวัติการส่งงานลง DynamoDB
- [ ] **ระบบจัดการคะแนน (Grading)**:
    - หน้าจอให้อาจารย์ตรวจงานและให้คะแนน

---

## 2. การเพิ่มประสิทธิภาพและความปลอดภัย (Security & Ops)

- [ ] **TU API Integration**: 
    - นำ `Application-Key` จริงมาใส่ใน Environment Variables เพื่อยกเลิกโหมด Mock สำหรับนักศึกษา
- [ ] **Frontend Hosting**: 
    - ตั้งค่าการ Deploy อัตโนมัติ (CI/CD) ผ่าน GitHub Actions ไปยัง **Vercel** หรือ **Netlify**
- [ ] **Authentication Persistence**: 
    - ตรวจสอบความปลอดภัยของ Token และการทำ Refresh Token บน Backend
- [ ] **Unit Tests**: 
    - เพิ่มการทดสอบ (Vitest) สำหรับฟังก์ชันสำคัญทั้ง Frontend และ Backend

---

## 3. สิ่งที่ควรปรับปรุง (Technical Debt)

- **Single Table Design**: ในอนาคตหากข้อมูลมีปริมาณมาก ควรออกแบบ GSI (Global Secondary Index) เพิ่มเติมเพื่อความรวดเร็วในการ Query
- **UI Consistency**: เก็บรายละเอียด UI ในส่วนของ Dark Mode และ Mobile Responsive ในบางหน้าที่ยังไม่สมบูรณ์
