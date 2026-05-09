# Turnity — Learning Management System 🎓

Turnity คือระบบจัดการการเรียนการสอน (LMS) ที่ออกแบบมาสำหรับมหาวิทยาลัยธรรมศาสตร์  
พัฒนาด้วย **React + Vite** (Frontend) และ **AWS SAM Serverless** (Backend)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS 4, Radix UI, Recharts, Lucide Icons |
| **Backend** | AWS Lambda (Node.js 22.x), API Gateway (HTTP API), DynamoDB (Single-Table) |
| **Storage** | S3 (file uploads), CloudFront (CDN/SPA hosting) |
| **Auth** | HMAC-signed access + refresh tokens, TU API integration |
| **IaC** | AWS SAM / CloudFormation |

---

## 📋 Prerequisites (สิ่งที่ต้องติดตั้ง)

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | ≥ 22.x | [nodejs.org](https://nodejs.org/) |
| **npm** | ≥ 10 | มาพร้อม Node.js |
| **AWS CLI** | v2 | `brew install awscli` (Mac) / [MSI Installer](https://aws.amazon.com/cli/) (Windows) |
| **AWS SAM CLI** | ≥ 1.158 | `brew tap aws/tap && brew install aws-sam-cli` (Mac) / [MSI Installer](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) (Windows) |

---

## 🚀 Quick Start (เริ่มต้นอย่างรวดเร็ว)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd Turnity_NEW

# ติดตั้ง Frontend dependencies
npm install
```

### 2. ตั้งค่า Environment Variables

```bash
cp .env.example .env.local
```

แก้ไขไฟล์ `.env.local`:

| Variable | ค่า | คำอธิบาย |
|----------|-----|---------|
| `VITE_DATA_SOURCE` | `mock` หรือ `api` | `mock` = ข้อมูลจำลองในเครื่อง, `api` = เชื่อมต่อ AWS จริง |
| `VITE_API_BASE_URL` | `https://xxxx.execute-api.us-east-1.amazonaws.com` | URL ของ API Gateway (ใช้เฉพาะ mode `api`) |
| `VITE_CDN_BASE_URL` | `https://xxxx.cloudfront.net` | CloudFront URL สำหรับไฟล์อัปโหลด |
| `VITE_APP_ENV` | `development` / `production` | สภาพแวดล้อม |

### 3. รัน Frontend (Development)

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:5173**

---

## 🔑 ระบบ Login (Mock vs API Mode)

### โหมด Mock (`VITE_DATA_SOURCE=mock`)

ข้อมูลถูกเก็บใน Browser (LocalStorage) เหมาะสำหรับพัฒนา UI

| Role | Username | Password |
|------|----------|----------|
| 🎓 Student | `student1` | `1234` |
| 👨‍🏫 Instructor | `teacher1` | `1234` |

### โหมด API (`VITE_DATA_SOURCE=api`)

ข้อมูลเก็บใน AWS DynamoDB จริง

| Role | Username | Password |
|------|----------|----------|
| 👨‍🏫 Instructor | `lecturer.demo@turnity.local` | `1234` |
| 🎓 Student | `student.demo@turnity.local` | `1234` |
| 🎓 TU Student | ใช้ TU username/password จริง | ผ่าน TU API |

**การทำงานของระบบ Login (API Mode):**
1. **Local accounts** — password ถูก hash เก็บใน DynamoDB
2. **TU API login** — Backend เรียก TU REST API เพื่อ verify แล้วสร้าง/อัปเดต user ใน DynamoDB อัตโนมัติ
3. **Auto-refresh** — เมื่อ access token หมดอายุ (8 ชั่วโมง) ระบบจะ refresh อัตโนมัติโดยไม่ต้อง login ใหม่

---

## ☁️ การ Deploy ขึ้น AWS

### 1. ตั้งค่า AWS Credentials

ก๊อปปี้ข้อมูลจาก Vocareum (AWS Details → CLI Credentials):

```bash
export AWS_ACCESS_KEY_ID="YOUR_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
export AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"
export AWS_DEFAULT_REGION="us-east-1"
```

### 2. แก้ AWS Account ID

ในไฟล์ `backend/template.yaml` ทุกที่ที่มี:
```yaml
Role: !Sub "arn:aws:iam::${AWS::AccountId}:role/LabRole"
```
> ⚠️ ตัว `${AWS::AccountId}` จะถูกแทนที่อัตโนมัติตอน Deploy แต่ถ้า Learner Lab ไม่รองรับ `!Sub` ให้เปลี่ยนเป็นเลข Account ID ของคุณเอง

### 3. Deploy ทั้ง Backend + Frontend (แบบง่าย)

```bash
# รันครั้งเดียว ระบบจะ Build + Deploy + Upload ให้ทั้งหมด
./deploy.sh
```

หรือ ถ้าอยาก Deploy แยกทีละขั้น:

```bash
# Build Backend
cd backend
sam build

# Deploy (ครั้งแรกใช้ --guided)
sam deploy --guided

# กลับ root และ Build Frontend
cd ..
npm run build

# Upload Frontend ไป S3 (ใช้ชื่อ Bucket จาก Stack Output)
aws s3 sync dist/ s3://<FrontendBucketName> --delete
```

### 4. หลัง Deploy สำเร็จ

1. ดู **Outputs** จาก `sam deploy`:
   - `ApiBaseUrl` → ใส่ใน `.env.local` → `VITE_API_BASE_URL`
   - `FrontendUrl` → URL สำหรับเข้าเว็บ (CloudFront)
   - `FrontendBucketName` → S3 Bucket ที่เก็บไฟล์ frontend
2. อัปเดต `VITE_CDN_BASE_URL` ใน `.env.local` ให้ตรงกับ CloudFront URL
3. `npm run build` อีกครั้งแล้ว sync ขึ้น S3

คู่มือเสริม:
- [`docs/LEARNER_LAB_SAM_DEPLOY.md`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/docs/LEARNER_LAB_SAM_DEPLOY.md)
- [`docs/REGRESSION_CHECKLIST.md`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/docs/REGRESSION_CHECKLIST.md)

---

## 🔐 Security Notes (สิ่งสำคัญ)

| รายการ | สถานะ | คำแนะนำ |
|--------|-------|---------|
| `AUTH_TOKEN_SECRET` | ⚠️ Placeholder | เปลี่ยนใน AWS Lambda Console หรือ SSM Parameter Store |
| `LOCAL_AUTH_SALT` | ⚠️ Placeholder | เปลี่ยนใน AWS Lambda Console หรือ SSM Parameter Store |
| `TU_API_APPLICATION_KEY` | ❌ ว่าง | ใส่ค่าจริงใน Lambda Console เพื่อเปิดใช้ TU Login |
| CORS Origins | ✅ ตั้งค่าแล้ว | เปลี่ยน `https://turnity.tu.ac.th` เป็น domain จริงใน `template.yaml` |

ตอน deploy ด้วย SAM ควรส่งค่าพวกนี้ผ่าน parameter เช่น:

```bash
sam deploy --guided
```

แล้วกำหนดค่า:
- `CorsOrigin`
- `AuthTokenSecret`
- `LocalAuthSalt`
- `TuApiApplicationKey`

---

## 📁 โครงสร้างโปรเจกต์

```
Turnity_NEW/
├── backend/                        # AWS Serverless Backend
│   ├── functions/                  # Lambda handlers (36 functions)
│   │   ├── auth-login/             # POST /auth/login
│   │   ├── auth-logout/            # POST /auth/logout
│   │   ├── auth-me/                # GET  /auth/me
│   │   ├── auth-refresh/           # POST /auth/refresh
│   │   ├── courses-list/           # GET  /courses
│   │   ├── courses-create/         # POST /courses
│   │   ├── assignments-*/          # CRUD assignments
│   │   ├── submissions-*/          # CRUD submissions + grading
│   │   ├── announcements-*/        # CRUD announcements
│   │   ├── discussion-*/           # CRUD discussions + replies + likes
│   │   ├── notifications-*/        # List, read, read-all
│   │   ├── files-download/         # POST /files/presigned-download
│   │   ├── uploads-presign/        # POST /files/presigned-upload
│   │   └── users-students/         # GET  /users/students
│   └── template.yaml               # SAM/CloudFormation Infrastructure
│
├── src/                            # React Frontend
│   ├── app/
│   │   ├── components/             # Shared UI components (shadcn/ui)
│   │   ├── layouts/                # Dashboard layouts
│   │   ├── pages/                  # 12 page components
│   │   └── routes.tsx              # React Router config
│   ├── features/
│   │   └── auth/                   # Login, session, protected routes
│   ├── lib/
│   │   ├── apiClient.ts            # HTTP client + token refresh
│   │   ├── apiEndpoints.ts         # API path registry (36 endpoints)
│   │   ├── config/env.ts           # Environment config reader
│   │   ├── contracts/api.ts        # Request/Response TypeScript types
│   │   ├── data/
│   │   │   ├── repository.ts       # Repository pattern (API/Mock switch)
│   │   │   └── mockRepository.ts   # In-memory mock data store
│   │   ├── types/models.ts         # Domain models
│   │   └── hooks/                  # Custom React hooks
│   └── main.tsx                    # App entry point
│
├── deploy.sh                       # One-command deployment script
├── .env.example                    # Environment template
├── .env.local                      # Local environment (gitignored)
├── package.json                    # Frontend dependencies
├── vite.config.ts                  # Build config + vendor splitting
└── tsconfig.json                   # TypeScript config
```

---

## 🧩 API Endpoints

### Auth
| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| POST | `/auth/login` | auth-login | Login (local + TU API) |
| POST | `/auth/logout` | auth-logout | Logout |
| GET | `/auth/me` | auth-me | Get current user |
| POST | `/auth/refresh` | auth-refresh | Refresh access token |

### Courses
| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses` | List courses |
| POST | `/courses` | Create course (instructor) |
| GET | `/courses/{courseId}` | Course detail |
| PUT | `/courses/{courseId}` | Update course |
| GET | `/courses/{courseId}/students` | List enrolled students |
| POST | `/courses/{courseId}/students` | Add student |
| DELETE | `/courses/{courseId}/students/{studentId}` | Remove student |

### Assignments
| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses/{courseId}/assignments` | List assignments |
| POST | `/courses/{courseId}/assignments` | Create assignment |
| GET | `/courses/{courseId}/assignments/{assignmentId}` | Assignment detail |
| PUT | `/courses/{courseId}/assignments/{assignmentId}` | Update assignment |
| DELETE | `/courses/{courseId}/assignments/{assignmentId}` | Delete assignment |

### Submissions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses/{courseId}/assignments/{assignmentId}/submissions` | List submissions |
| POST | `/courses/{courseId}/assignments/{assignmentId}/submissions` | Submit work |
| PUT | `.../submissions/{submissionId}/grade` | Grade submission |

### Files
| Method | Path | Description |
|--------|------|-------------|
| POST | `/files/presigned-upload` | Get S3 upload URL |
| POST | `/files/presigned-download` | Get S3 download URL |

### Announcements, Discussions, Notifications
ดูรายละเอียดเพิ่มเติมในไฟล์ `src/lib/apiEndpoints.ts`

---

## ⚙️ NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server |
| `dev:mock` | `npm run dev:mock` | Start with mock data |
| `build` | `npm run build` | Production build → `dist/` |
| `preview` | `npm run preview` | Preview production build |
| `typecheck` | `npm run typecheck` | TypeScript type checking |
| `test` | `npm run test` | Run tests (Vitest) |
| `deploy-frontend` | `npm run deploy-frontend` | Build + sync to S3 |

---

## 📝 Troubleshooting

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|--------|
| **Internal Server Error** | Lambda handler ขาด `await` | ตรวจสอบ `dynamo.js` ว่ามี `await` ครบ |
| **CORS Error** | Origin ไม่ตรง | ตรวจสอบ `AllowOrigins` ใน `template.yaml` |
| **S3 Upload Error** | Bucket CORS ไม่ตรง | ตรวจ `CorsConfiguration` ใน `UploadsBucket` |
| **Login ไม่ได้** | Credentials หมดอายุ | Set AWS env vars ใหม่จาก Vocareum |
| **CloudFront 403** | ไม่มีไฟล์ใน S3 | รัน `aws s3 sync dist/ s3://<bucket> --delete` |
| **Token Expired** | Token หมดอายุ | ระบบ refresh อัตโนมัติ หรือ login ใหม่ |

---

## 📐 Architecture Diagram

```
┌──────────────┐     HTTPS      ┌────────────────┐
│   Browser    │ ──────────────→│  CloudFront    │
│  (React SPA) │                │  (CDN + SPA)   │
└──────┬───────┘                └───────┬────────┘
       │                                │
       │  API calls                     │ Static files
       ▼                                ▼
┌──────────────┐                ┌────────────────┐
│ API Gateway  │                │   S3 Bucket    │
│  (HTTP API)  │                │  (Frontend)    │
└──────┬───────┘                └────────────────┘
       │
       ▼
┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│   Lambda     │───→│   DynamoDB    │    │  S3 Bucket   │
│  (36 funcs)  │    │ (Single Table)│    │  (Uploads)   │
└──────────────┘    └───────────────┘    └──────────────┘
```

---

## 👥 ผู้จัดทำ

ทีมพัฒนา **Turnity 24/7** — CS332, มหาวิทยาลัยธรรมศาสตร์
