# Turnity (Thailand) - Project Setup & Developer Guide 🚀

Turnity คือแอปพลิเคชันจัดการการเรียนการสอน (Learning Management System) ที่ออกแบบมาเพื่อความเร็วและความง่ายในการใช้งาน พัฒนาด้วย **Vite + React** สำหรับ Frontend และ **AWS SAM (Serverless)** สำหรับ Backend

---

## 🛠 Tech Stack

- **Frontend**: Vite, React, Tailwind CSS, Radix UI, Lucide Icons
- **Backend**: AWS Lambda (Node.js 20.x), AWS Gateway (HTTP API), DynamoDB (Single Table Design)
- **Deployment**: AWS SAM CLI

---

## 📋 สิ่งที่ต้องติดตั้งก่อนเริ่ม (Prerequisites)

### 1. Node.js & NPM
- แนะนำให้ใช้ **Node.js v20.x** (LTS)
- [ดาวน์โหลด Node.js](https://nodejs.org/)

### 2. AWS CLI
- เพื่อจัดการ Credentials และการเชื่อมต่อกับ AWS
- **Mac**: `brew install awscli`
- **Windows**: [ดาวน์โหลดตัวติดตั้ง MSI](https://aws.amazon.com/cli/)

### 3. AWS SAM CLI
- สำหรับ Build และ Deploy Backend
- **Mac**: `brew tap aws/tap && brew install aws-sam-cli`
- **Windows**: [ดาวน์โหลดตัวติดตั้ง MSI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

---

## 🚀 ขั้นตอนการตั้งค่าโปรเจกต์ (Project Setup)

### 1. การ Clone และติดตั้ง Dependencies

เปิด Terminal หรือ PowerShell แล้วรันคำสั่ง:

```bash
# Clone โปรเจกต์
git clone <your-repo-url>
cd Turnity_NEW

# ติดตั้ง Dependencies สำหรับ Frontend
npm install

# ติดตั้ง Dependencies สำหรับ Backend
cd backend
npm install
cd ..
```

### 2. การตั้งค่า Environment Variables (.env)

สร้างไฟล์ชื่อ `.env.local` ไว้ที่โฟลเดอร์หลัก (Root) โดยก๊อปปี้จาก `.env.example`:

```bash
cp .env.example .env.local
```

**สิ่งที่ต้องแก้ไขใน `.env.local`:**
- `VITE_DATA_SOURCE`: ตั้งเป็น `api` เพื่อเชื่อมต่อกับ AWS จริง หรือ `mock` เพื่อทดสอบภายในเครื่อง
- `VITE_API_BASE_URL`: ใส่ URL ของ API Gateway ที่ได้จากการ Deploy (เช่น `https://xxxx.execute-api.us-east-1.amazonaws.com`)

---

## 💻 การรันโปรเจกต์ (Local Development)

### Frontend (Vite)
รันที่โฟลเดอร์นอกสุด:
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ `http://localhost:5173`

### Backend (Local Test)
รันที่โฟลเดอร์ `backend`:
```bash
cd backend
npm run local
```

---

## ☁️ การ Deploy ขึ้น AWS (Deployment)

เราใช้ AWS SAM ในการจัดการ Infrastructure

### 1. การตั้งค่า Credentials (สำหรับ Learner Lab)
ก๊อปปี้ข้อมูลจากหน้า Vocareum (เมนู AWS Details > CLI Credentials) แล้วตั้งค่า Environment Variables ใน Terminal:
```bash
export AWS_ACCESS_KEY_ID="YOUR_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
export AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"
export AWS_DEFAULT_REGION="us-east-1"
```

> **สำคัญมาก**: ในไฟล์ `backend/template.yaml` บรรทัดที่มี `Role: arn:aws:iam::028800569612:role/LabRole` คุณจะต้องเปลี่ยนตัวเลข **028800569612** ให้เป็น **AWS Account ID** ของคุณเอง (ดูได้บรรทัดที่มีข้อความ `export AWS_SESSION_TOKEN` หรือดูใน Console) เพื่อให้มีสิทธิ์ในการสร้างทรัพยากร


### 2. การ Deploy Backend
รันในโฟลเดอร์ `backend`:
```bash
cd backend
npm run build
npm run deploy
```
*Note: หลัง Deploy เสร็จ ตรวจสอบ **ApiBaseUrl** ในส่วนของ Outputs เพื่อนำมาใส่ใน `.env.local`*

---

## 🔑 แผนผังการใช้งาน (Mock vs API Mode)

โปรเจกต์นี้รองรับการทำงาน 2 โหมดหลัก คุณสามารถสลับได้ที่ไฟล์ `.env.local`

### 1. โหมด Mock (สำหรับการพัฒนา UI/UX)
- **การตั้งค่า**: `VITE_DATA_SOURCE=mock`
- **การเก็บข้อมูล**: ข้อมูลถูกเก็บไว้ใน **Browser (LocalStorage)** เท่านั้น (ปิดบราวเซอร์แล้วเปิดใหม่ข้อมูลยังอยู่ แต่ถ้าล้าง Cache ข้อมูลจะหาย)
- **บัญชีสำหรับทดสอบ**:
  - 🎓 **Student**: User: `student1` / Pass: `1234`
  - 👨‍🏫 **Teacher**: User: `teacher1` / Pass: `1234`
- **เหมาะสำหรับ**: นักพัฒนา Frontend ที่ไม่อยากวุ่นวายกับการรัน Backend หรือ AWS

### 2. โหมด API (สำหรับการทดสอบระบบจริง/Production)
- **การตั้งค่า**: `VITE_DATA_SOURCE=api`
- **การเก็บข้อมูล**: ข้อมูลถูกเก็บไว้ใน **AWS DynamoDB** จริงๆ ข้อมูลจะเชื่อมกันหมดทุกเครื่อง
- **บัญชีสำหรับทดสอบ**:
  - 👨‍🏫 **Instructor local account**: `lecturer.demo@turnity.local` / `1234`
  - 🎓 **Student local account**: `student.demo@turnity.local` / `1234`
  - 🎓 **TU student account**: ใช้ TU username/password จริงผ่าน backend ได้เลย ถ้า `TU_API_APPLICATION_KEY` ถูกตั้งค่า
- **เหมาะสำหรับ**: การทดสอบ End-to-End, การจัดการข้อมูลจริง และการ Deploy ขึ้นใช้งานจริง

### การทำงานของระบบ Login ใน API mode

ระบบรองรับ 2 รูปแบบ:

1. **Local database accounts**
   - สำหรับ instructor และ student ที่ใช้ทดสอบระบบ
   - password ถูกเก็บแบบ hash ใน DynamoDB

2. **TU API login**
   - backend เป็นคนเรียก TU API
   - ถ้า login ผ่านและยังไม่มี user ในระบบ
   - ระบบจะสร้างหรืออัปเดต user ใน DynamoDB อัตโนมัติ

### การเพิ่มนักศึกษาเข้า course (Plan B)

ถ้า instructor เพิ่ม `studentId` เข้า course แต่ student คนนั้นยังไม่เคย login:

- ระบบจะสร้าง placeholder student ใน DynamoDB ก่อน
- พอ student login ผ่าน TU API ครั้งแรก
- ระบบจะเติมข้อมูลจริงจาก TU ลง record เดิมให้อัตโนมัติ

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
Turnity_NEW/
├── backend/                # ส่วนของ AWS Serverless (Backend)
│   ├── functions/          # Lambda handlers แยกตาม API endpoint
│   │   ├── auth-login/     # ระบบยืนยันตัวตน
│   │   ├── courses-list/   # ดึงรายการวิชาทั้งหมด
│   │   ├── announcements/  # จัดการประกาศ
│   │   └── assignments/    # จัดการงานที่มอบหมาย
│   ├── shared/             # โค้ดที่ใช้ร่วมกันใน Lambda
│   │   ├── dynamo.js       # Logic การอ่าน/เขียน DynamoDB (SDK v3)
│   │   └── http.js         # Helper สำหรับสร้าง JSON Response
│   └── template.yaml       # AWS CloudFormation/SAM Infrastructure
├── src/                    # ส่วนของ React (Frontend)
│   ├── app/                # ส่วนควบคุมหลักของแอป
│   │   ├── components/     # Common UI Components (Button, Input, etc.)
│   │   ├── layouts/        # โครงสร้างหน้า Dashboard
│   │   ├── pages/          # หน้าหลักแต่ละหน้า (Student, Instructor, Classroom)
│   │   └── routes.tsx      # ระบบจัดการเส้นทาง (React Router)
│   ├── features/           # ระบบฟีเจอร์แยกตามโมดูล
│   │   └── auth/           # ระบบ Login และ ProtectedRoute
│   ├── lib/                # Library และ Utility ต่างๆ
│   │   ├── data/           # Repository Pattern (สลับ API/Mock ได้ที่นี่)
│   │   └── utils/          # ฟังก์ชันอำนวยความสะดวกทั่วไป
│   ├── types/              # TypeScript Interfaces/Types ทั้งหมด
│   └── main.tsx            # จุดเริ่มต้นของแอปพลิเคชัน
├── docs/                   # เอกสารประกอบการพัฒนา (API Contract, Guides)
├── .env.local              # ไฟล์ตั้งค่าตัวแปรสภาพแวดล้อม (ห้ามแชร์ขึ้น Git)
├── package.json            # ไฟล์จัดการ Dependencies และ Scripts
└── tsconfig.json           # การตั้งค่า TypeScript
```

---

## 📝 ข้อควรระวัง (Troubleshooting)

- **Internal Server Error**: ตรวจสอบว่าใน Lambda มีการใส่ `await` ครบถ้วนหรือไม่ (โดยเฉพาะที่ `dynamo.js`)
- **CORS Error**: ตรวจสอบ `CORS_ORIGIN` ใน `template.yaml` ว่าตรงกับ URL ที่เรียกใช้งานหรือไม่
- **AWS Permissions**: หากใช้ Learner Lab ระวังเรื่องสิทธิ์การสร้าง CloudFront (อาจจะโดนบล็อก)

---

## 👥 ผู้จัดทำ
ทีมพัฒนา Turnity 24/7 (CS332 - TU)
