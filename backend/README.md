# Turnity Backend Scaffold

This folder contains a starter AWS SAM backend scaffold for Turnity.

You do **not** write Lambda code directly in the AWS console.

Recommended workflow:

1. write Lambda handlers here in your local project
2. test and refine them locally
3. deploy them to AWS using SAM

## What is included

Current scaffold:

- `template.yaml`
- `functions/auth-login`
- `functions/courses-list`
- `functions/courses-create`
- `functions/course-detail`
- `functions/course-students`
- `shared/` helpers for HTTP responses, auth, and a mock course store

## Current implementation status

This is a **starter scaffold**, not the final production backend yet.

Current handlers:

- return mock-backed data locally
- are shaped like real Lambda handlers
- already match the frontend contract
- can later be upgraded to DynamoDB and TU API integrations

## Folder structure

```text
backend/
  template.yaml
  functions/
    auth-login/
      index.js
    courses-list/
      index.js
    courses-create/
      index.js
    course-detail/
      index.js
    course-students/
      index.js
  shared/
    auth.js
    course-store.js
    http.js
    mock-data.js
```

## Deploy model

SAM maps your local files to AWS resources.

Example:

- `functions/auth-login/index.js` -> AWS Lambda for `POST /auth/login`
- `functions/courses-list/index.js` -> AWS Lambda for `GET /courses`

The API routes are declared in `template.yaml`.

## Environment variables

Important environment variables:

- `CORS_ORIGIN`
- `TU_API_BASE_URL`
- `TU_API_APPLICATION_KEY`
- `DDB_TABLE_NAME`

Notes:

- if `TU_API_APPLICATION_KEY` is missing, the auth login handler falls back to a local mock profile
- this makes the scaffold easier to develop before real AWS secrets are wired up

## Suggested next backend steps

1. replace `shared/course-store.js` with DynamoDB access
2. connect `auth-login` to the real TU API through `TU_API_APPLICATION_KEY`
3. add `/courses/{courseId}/announcements`
4. add `/courses/{courseId}/discussions`
5. add `/notifications`
6. add JWT validation middleware / authorizer integration

## Example SAM commands

If AWS SAM CLI is installed:

```bash
cd backend
sam build
sam deploy --guided
```

For local API testing:

```bash
cd backend
sam local start-api
```

## Frontend integration

When your backend is deployed:

1. copy the API base URL
2. put it into frontend `.env.local` as `VITE_API_BASE_URL`
3. set `VITE_DATA_SOURCE=api`

Then the frontend repository layer can start calling these real endpoints.
