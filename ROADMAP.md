# 🚩 Roadmap & Future Features (สิ่งที่ต้องทำต่อ)

เอกสารนี้รวบรวมฟีเจอร์ทั้งหมดที่ยังขาดหายไปในระบบ Turnity พร้อมด้วย **แนวทางการพัฒนา (Implementation Guide)** อย่างละเอียด เพื่อแนะนำให้นักพัฒนาคนต่อไปสามารถสานต่อได้ทันที

---

## 1. ระบบจัดการการลงทะเบียนเรียน (Enrollment System) 🚩 **(High Priority)**

**ปัญหาปัจจุบัน**: ในโหมด API เมื่อนักศึกษาเข้าสู่ระบบ ฟังก์ชัน `listCourses` ดึงข้อมูลวิชา "ทั้งหมด" ในฐานข้อมูลมาแสดง โดยไม่ได้กรองว่านักศึกษาคนนั้นลงทะเบียนเรียนวิชานั้นหรือไม่

**☑️ สิ่งที่ต้องพัฒนา:**
1.  **Backend: ปรับปรุง `listCourses` API**
    *   **ไฟล์**: `backend/shared/dynamo.js` และ `backend/functions/courses-list/index.js`
    *   **แนวทาง**: ปรับให้ API รับ query parameter `role` และ `userId`
    *   **Logic**:
        *   ถ้า `role === 'instructor'`: ดึงวิชาทั้งหมดที่อาจารย์คนนั้นสอน (หรือดึงทั้งหมดแบบเดิม)
        *   ถ้า `role === 'student'`: ให้ Query ไปที่ **GSI1** (Global Secondary Index) ของตาราง DynamoDB โดยใช้ `PK = STUDENT#<userId>` และใช้ `begins_with(SK, "COURSE#")` เพื่อหาว่าเด็กคนนี้ลงวิชาอะไรบ้าง จากนั้นค่อยไปดึงรายละเอียดวิชาแต่ละตัว
2.  **Frontend & Backend: ระบบเพิ่มนักศึกษาเข้าคอร์ส**
    *   **UI**: สร้างหน้าต่าง (Modal) ในหน้ารายละเอียดวิชา (ของฝั่งอาจารย์) เพื่อกรอกรหัสนักศึกษา / อีเมล และกด "Add Student"
    *   **Backend API**: สร้าง Lambda function ใหม่ (เช่น `CourseEnrollFunction`) ที่รับ `courseId` และ `studentId` และเรียกใช้ฟังก์ชัน `addStudentToCourse` ใน `dynamo.js` ที่มีโครงสร้างอยู่แล้ว

---

## 2. ระบบมอบหมายและส่งงาน (Assignment & Submission)

ปัจจุบันสามารถสร้าง Assignment ได้แล้ว แต่ฝั่งนักศึกษายัง **ส่งงานไม่ได้** และอาจารย์ยัง **ตรวจงานไม่ได้**

**☑️ สิ่งที่ต้องพัฒนา:**
1.  **Backend & AWS: อัปโหลดไฟล์งานลง S3 (Student)**
    *   **AWS Setup**: สร้าง S3 Bucket ใหม่ใน AWS Console สำหรับเก็บไฟล์เอกสาร (เช่น PDF, Word)
    *   **Backend API (Presigned URL)**: ท่าที่ปลอดภัยที่สุดคือ ให้ Frontend ขอ Presigned URL จาก Backend Lambda จากนั้นให้ Frontend อัปโหลดไฟล์ตรงเข้า S3 ผ่าน URL นั้น (ลดภาระ Lambda)
2.  **Backend: บันทึกสถานะการส่งงานลง Database (Student)**
    *   **DynamoDB Schema**: สร้าง Item ใหม่ เช่น `PK = ASS#<assignmentId>`, `SK = SUBMISSION#<studentId>` รวมถึงเก็บ Timestamp, S3 File Path, และเนื้อหาข้อความเพิ่มเติม
    *   **Lambda**: สร้างฟังก์ชัน `SubmissionsCreateFunction` มารับ Request การส่งงาน
3.  **UI: หน้าจอส่งงาน (Student)**
    *   **ไฟล์**: `src/app/pages/AssignmentSubmission.tsx`
    *   **ฟีเจอร์**: ฟอร์มสำหรับอัปโหลดไฟล์ / พิมพ์ข้อความ / แสดงหน้าต่าง Loading / ตรวจสอบเวลา Late
4.  **UI: หน้าจอติดตามและตรวจงาน (Instructor)**
    *   **ไฟล์**: `src/app/pages/SubmissionTracking.tsx`
    *   **ฟีเจอร์**: ลิสต์รายชื่อนักศึกษา แยกตามสถานะ (Submitted, Missing, Late) พร้อมปุ่มดาวน์โหลดไฟล์งาน และช่องกรอกคะแนน (Grading)

---

## 3. ระบบกระดานสนทนาถามตอบ (Discussion Board)

ระบบเว็บบอร์ดประจำวิชาสำหรับถาม-ตอบเนื้อหา

**☑️ สิ่งที่ต้องพัฒนา:**
1.  **Backend: ชุด API สำหรับ Discussions**
    *   สร้าง Lambda functions 4 ตัว: `DiscussionsList`, `DiscussionsCreate`, `DiscussionsReact` (กด Like), `DiscussionsComment` (ตอบปัญหากัน)
    *   **DynamoDB Schema**: 
        *   กระทู้: `PK = COURSE#<courseId>`, `SK = DISC#<discussionId>`
        *   คอมเมนต์: `PK = DISC#<discussionId>`, `SK = COMMENT#<commentId>`
2.  **Frontend: เชื่อมต่อ UI กับ API**
    *   UI เตรียมไว้บ้างแล้ว ให้ปรับ Data Fetching จากปัจจุบันที่ดึงจาก mock ให้ไปยิง API แทน

---

## 4. ระบบการแจ้งเตือนและการสื่อสาร (Notifications & Real-time)

**☑️ สิ่งที่ต้องพัฒนา:**
1.  **Backend: Event Trigger**
    *   เมื่อมีการประกาศใหม่ (Announcement) หรือมีการสั่งงานใหม่ (Assignment) ให้ระบบเพิ่ม Item แจ้งเตือนลงในตาราง DynamoDB หรือส่งข้าม AWS SNS / SQS เพื่อแจ้งเตือนนักศึกษา
2.  **Frontend: Polling / WebSocket**
    *   ปรับไอคอนกระดิ่งมุมขวาบนให้ดึงข้อมูลจาก API ใหม่ `/notifications` เป็นระยะๆ (Polling) หรือทำ WebSockets ถ้ารองรับ

---

## 5. การปรับปรุงแวดล้อมสถาปัตยกรรม (Infrastructure & Security)

**☑️ สิ่งที่ต้องพัฒนา:**
1.  **Frontend Hosting (Public URL)**
    *   AWS Learner Lab บล็อกการใช้งาน CloudFront และให้โควต้า S3 จำกัด
    *   **ทางแก้**: วางโค้ด Frontend บน GitHub และตั้งค่าคู่กับ **Vercel** หรือ **Netlify** (ซึ่งใช้ฟรีและตั้งค่าง่าย) โดยตั้งค่า Environment Variable `VITE_API_BASE_URL` ใน Vercel ให้ชี้ไปยัง AWS API Gateway ที่เราเปิดใช้งานไว้
2.  **Authentication & Security**
    *   **TU API**: ตอนนี้ตั้งให้ Student ที่ขึ้นต้นด้วย `student` ข้ามการยืนยันตัวตน ก่อนขึ้น Production ต้องลบข้อเสนอนี้ใน `auth.js` และใส่ `TU_API_APPLICATION_KEY` ใน Environment Variable ให้เรียบร้อย
    *   **Authorization JWT**: ปัจจุบัน API คืนค่า `dev-token-xxx` แบบง่ายหลอกเอาไว้ ควรเชื่อมต่อ JWT Authentication ของจริงบน Backend (เช่น AWS Cognito หรือเขียน Middleware ควบคุมใน API Gateway) เพื่อความปลอดภัย ไม่ให้ส่ง Request ข้ามสิทธิ์กันได้

---

## 6. โครงสร้างฐานข้อมูลที่จะต้องทำเพิ่ม (DynamoDB Schema Reference)
สำหรับนักพัฒนาระบบหลังบ้าน นี่คือตัวอย่างโครงสร้างที่ต้องสร้างเพิ่มในอนาคต:

| Partition Key (PK) | Sort Key (SK) | ประเภทข้อมูลที่เก็บ |
|---|---|---|
| `ASS#<assignmentId>` | `SUBMISSION#<studentId>` | ข้อมูลการส่งงานของนักศึกษา, คะแนน |
| `COURSE#<courseId>` | `DISC#<discussionId>` | หัวข้อกระทู้ถาม-ตอบ |
| `DISC#<discussionId>` | `COMMENT#<commentId>` | ความคิดเห็นในกระทู้ |
| `STUDENT#<studentId>`| `NOTIFY#<timestamp>` | ข้อความแจ้งเตือนต่างๆ |
