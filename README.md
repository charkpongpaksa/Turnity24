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

```text
src/
  app/
    components/
    layouts/
    pages/
    routes.tsx
  features/
  auth/
      AuthProvider.tsx
      ProtectedRoute.tsx
      LoginPage.tsx
      auth.service.ts
      auth.storage.ts
      auth.types.ts
      auth.utils.ts
  lib/
    apiClient.ts
    contracts/
    apiEndpoints.ts
    config/
    data/
    hooks/
    mocks/
    types/
  test/
    setup.ts
backend/
  template.yaml
  functions/
  shared/
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
