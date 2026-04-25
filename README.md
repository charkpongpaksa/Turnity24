# Turnity Frontend

Turnity is a Vite + React + TypeScript frontend for assignment tracking, classroom discussion, and deadline notifications.

## Current direction

This frontend is now structured so it can run in two modes:

- `mock` mode for UI development without a backend
- `api` mode for connecting to your AWS/API Gateway backend later

The app also now has a real auth shell:

- login page
- auth session provider
- protected routes
- role-based routing for `student` and `instructor`

## Important TU API note

Do not call the TU API directly from the browser.

The TU API requires an `Application-Key`, and that key would be exposed if you put it in frontend code or in `VITE_` environment variables.

Use this flow instead:

```text
Frontend -> Your backend /auth/login -> TU API
```

Recommended backend login flow:

1. Frontend sends `username` and `password` to your own backend
2. Backend calls:
   - `POST https://restapi.tu.ac.th/api/v1/auth/Ad/verify`
   - or `POST https://restapi.tu.ac.th/api/v1/auth/Ad/verify2`
3. Backend reads TU response
4. Backend maps:
   - `type: student` -> app role `student`
   - `type: employee` -> app role `instructor`
5. Backend returns your own app session/token to the frontend

The frontend in this repo already assumes that role mapping.

## Project structure

```
/
├── .env.example                 # Environment variables template
├── .env.local                   # Local environment variables
├── .gitignore                   # Git ignore rules
├── ATTRIBUTIONS.md              # Attributions for assets
├── README.md                    # This file
├── index.html                   # Main HTML entry point
├── package.json                 # Node.js dependencies and scripts
├── package-lock.json            # Lockfile for dependencies
├── postcss.config.mjs           # PostCSS configuration
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite build configuration
├── backend/                     # AWS SAM backend scaffold
│   ├── env.json.example         # Backend environment template
│   ├── README.md                # Backend documentation
│   ├── samconfig.example.toml   # SAM deployment config
│   ├── template.yaml            # SAM infrastructure definition
│   ├── events/                  # Test event files
│   │   ├── auth-login.json
│   │   └── courses-create.json
│   ├── functions/               # Lambda function handlers
│   │   ├── auth-login/
│   │   │   └── index.js
│   │   ├── course-detail/
│   │   │   └── index.js
│   │   ├── course-students/
│   │   │   └── index.js
│   │   ├── courses/
│   │   │   ├── create/
│   │   │   ├── detail/
│   │   │   ├── list/
│   │   │   └── students/
│   │   ├── courses-create/
│   │   │   └── index.js
│   │   └── courses-list/
│   │       └── index.js
│   └── shared/                  # Shared utilities for Lambda
│       ├── auth.js
│       ├── course-store.js
│       ├── http.js
│       └── mock-data.js
├── dist/                        # Build output (generated)
├── docs/                        # Documentation
│   ├── BACKEND_API_CONTRACT.md
│   └── LEARNER_LAB_SAM_DEPLOY.md
├── guidelines/                  # Project guidelines
│   └── Guidelines.md
├── node_modules/                # Dependencies (generated)
└── src/                         # Frontend source code
    ├── main.tsx                 # Application entry point
    ├── app/                     # Main application code
    │   ├── App.tsx              # Root component
    │   ├── routes.tsx           # Route definitions
    │   ├── components/          # Reusable UI components
    │   │   ├── PageBackButton.tsx
    │   │   ├── figma/           # Figma-related components
    │   │   │   └── ImageWithFallback.tsx
    │   │   ├── navigation/      # Navigation components
    │   │   └── ui/              # UI library components
    │   ├── layouts/             # Layout components
    │   │   └── RootLayout.tsx
    │   └── pages/               # Page components
    │       ├── AllCourses.tsx
    │       ├── AssignmentDetail.tsx
    │       ├── AssignmentSubmission.tsx
    │       ├── ClassroomPage.tsx
    │       ├── InstructorAssignmentDetail.tsx
    │       ├── InstructorDashboard.tsx
    │       ├── NotFound.tsx
    │       ├── NotificationsPage.tsx
    │       ├── SearchResultsPage.tsx
    │       ├── StudentDashboard.tsx
    │       ├── SubmissionTracking.tsx
    │       ├── UpcomingDeadlinesPage.tsx
    │       ├── assignments/      # Assignment-related pages
    │       ├── courses/          # Course-related pages
    │       ├── dashboard/        # Dashboard pages
    │       └── system/           # System pages
    ├── features/                 # Feature-specific code
    │   └── auth/                 # Authentication feature
    │       ├── auth.service.test.ts
    │       ├── auth.service.ts
    │       ├── auth.storage.ts
    │       ├── auth.types.ts
    │       ├── auth.utils.test.ts
    │       ├── auth.utils.ts
    │       ├── AuthProvider.tsx
    │       ├── HomeRedirect.tsx
    │       ├── LoginPage.tsx
    │       └── ProtectedRoute.tsx
    ├── lib/                      # Shared libraries and utilities
    │   ├── apiClient.ts
    │   ├── apiEndpoints.test.ts
    │   ├── apiEndpoints.ts
    │   ├── notifications.test.ts
    │   ├── notifications.ts
    │   ├── config/
    │   │   └── env.ts
    │   ├── contracts/
    │   │   └── api.ts
    │   ├── data/
    │   │   ├── mockRepository.test.ts
    │   │   ├── mockRepository.ts
    │   │   └── repository.ts
    │   ├── hooks/
    │   │   └── useAsyncData.ts
    │   ├── mocks/
    │   │   └── mockData.ts
    │   └── types/
    │       └── models.ts
    ├── styles/                   # Stylesheets
    │   ├── fonts.css
    │   ├── index.css
    │   ├── tailwind.css
    │   └── theme.css
    ├── test/                     # Test configuration
    │   └── setup.ts
    └── types/                    # TypeScript type definitions
        └── react-dom-client.d.ts
```

## Key files

- [`src/features/auth/LoginPage.tsx`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/features/auth/LoginPage.tsx)
  Handles frontend sign-in UI
- [`src/features/auth/AuthProvider.tsx`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/features/auth/AuthProvider.tsx)
  Stores and restores the authenticated session
- [`src/features/auth/auth.service.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/features/auth/auth.service.ts)
  Calls backend auth in `api` mode and mock auth in `mock` mode
- [`src/features/auth/auth.utils.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/features/auth/auth.utils.ts)
  Maps TU account types to app roles
- [`src/lib/data/repository.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/lib/data/repository.ts)
  Central data access layer for the app
- [`src/lib/contracts/api.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/lib/contracts/api.ts)
  Shared request and response types for the backend contract
- [`src/lib/hooks/useAsyncData.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/lib/hooks/useAsyncData.ts)
  Shared async loading hook used across pages and layouts
- [`src/lib/mocks/mockData.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/lib/mocks/mockData.ts)
  Centralized mock dataset for local UI development
- [`src/lib/config/env.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/lib/config/env.ts)
  Centralized environment configuration
- [`backend/template.yaml`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/backend/template.yaml)
  AWS SAM infrastructure definition for the backend scaffold
- [`backend/README.md`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/backend/README.md)
  Explains how the backend scaffold maps local files to AWS Lambda/API Gateway

## Run locally

1. Install dependencies

```bash
npm install
```

2. Copy environment values

```bash
cp .env.example .env.local
```

3. Start development mode

```bash
npm run dev
```

## Mock login

When `VITE_DATA_SOURCE=mock`, the login screen uses mock auth logic:

- usernames like `student01` behave as students
- usernames like `teacher01`, `emp01`, or `staff01` behave as instructors

Any password with at least 4 characters works in mock mode.

## Scripts

- `npm run dev` starts the Vite dev server
- `npm run build` builds production assets
- `npm run preview` previews the build locally
- `npm run typecheck` runs TypeScript checks
- `npm run test` runs the Vitest suite
- `npm run test:watch` runs tests in watch mode

## Tests

Current tests cover:

- TU response to app role mapping
- mock auth session creation
- API path building

Test files:

- [`src/features/auth/auth.utils.test.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/features/auth/auth.utils.test.ts)
- [`src/features/auth/auth.service.test.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/features/auth/auth.service.test.ts)
- [`src/lib/apiEndpoints.test.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/lib/apiEndpoints.test.ts)

## Backend contract for `/auth/login`

Suggested request body from frontend:

```json
{
  "username": "65070001",
  "password": "secret"
}
```

Suggested backend response:

```json
{
  "accessToken": "app-jwt-token",
  "expiresAt": "2026-05-01T10:00:00.000Z",
  "profile": {
    "status": true,
    "message": "Success",
    "type": "student",
    "username": "65070001",
    "tu_status": "ปกติ",
    "statusid": "10",
    "displayname_th": "นักศึกษา ทดสอบ",
    "displayname_en": "Student Demo",
    "email": "student@dome.tu.ac.th",
    "department": "Computer Science",
    "faculty": "Faculty of Science and Technology"
  }
}
```

The frontend then maps that TU profile into the internal user/session model.

## Full backend contract

The current recommended API contract for the whole app is documented in:

- [`docs/BACKEND_API_CONTRACT.md`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/docs/BACKEND_API_CONTRACT.md)

The matching TypeScript contract types live in:

- [`src/lib/contracts/api.ts`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/src/lib/contracts/api.ts)

## Backend scaffold

This repo now also includes a starter AWS SAM backend scaffold in:

- [`backend/`](/Users/chakphongpaksa/Documents/CSTU/CS332/Turnity24_7/Turnity_NEW/backend)

It includes starter Lambda handlers for:

- `/auth/login`
- `GET /courses`
- `POST /courses`
- `GET /courses/{courseId}`
- `GET/POST/DELETE /courses/{courseId}/students`

These handlers are currently scaffolded to make local development and AWS deployment easier. They are the next place to continue backend implementation.

## Next recommended step

The next best improvement is to build the real backend endpoints in this order:

1. `/auth/login`
2. `/courses`
3. `/courses/{courseId}`
4. `/courses/{courseId}/students`
5. `/courses/{courseId}/announcements`
6. `/courses/{courseId}/discussions`
7. `/notifications`
