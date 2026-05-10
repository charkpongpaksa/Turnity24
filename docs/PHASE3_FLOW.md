# Turnity Phase 3 Flow

This note documents the Phase 3 changes and the expected end-to-end behavior.

## What Changed

- Removed unused `backend/functions/discussions-*` folders. The active discussion handlers use the singular `discussion-*` directories referenced by `backend/template.yaml`.
- Added private file download support through `POST /files/presigned-download`.
- Added assignment updates through `PUT /courses/{courseId}/assignments/{assignmentId}`.
- Added token refresh through `POST /auth/refresh` and frontend retry-on-401 behavior.
- Added CSV export and a real download action in the instructor submission tracking dialog.
- Marked "Grade All Submissions" as coming soon so the UI no longer implies a working bulk-grade action.

## Student Submission Flow

1. Student opens an assignment and chooses file, text, or link submission.
2. File submissions call `POST /files/presigned-upload` to receive an S3 upload URL.
3. Browser uploads the file directly to S3.
4. Frontend calls `POST /courses/{courseId}/assignments/{assignmentId}/submissions` with text and/or file metadata.
5. Student returns to assignment detail.
6. In API mode, assignment detail fetches the assignment and the submissions list, then merges them so the UI shows `Submitted` and the submission history.

## Instructor Review Flow

1. Instructor opens the assignment tracking page.
2. Frontend loads students and submissions.
3. Instructor can filter/search submissions, view one submission, download attached files, enter grades, and export the visible table as CSV.
4. Download uses `POST /files/presigned-download` with the stored `fileKey`.
5. The backend returns a short-lived S3 presigned URL; the browser opens it in a new tab.

## Assignment Update Flow

1. Instructor opens assignment detail.
2. Edit Assignment submits title, description, due date/time, type, points, late policy, and attachments.
3. Frontend calls `PUT /courses/{courseId}/assignments/{assignmentId}`.
4. Backend updates the DynamoDB assignment item and returns the updated assignment.
5. Frontend updates the local page state immediately.

## Auth Refresh Flow

1. Login returns `accessToken`, `refreshToken`, and `expiresAt`.
2. Frontend stores the full auth session and keeps `accessToken` in `turnity_token`.
3. If an API request returns 401, `apiClient` calls `POST /auth/refresh`.
4. If refresh succeeds, frontend updates local session/token storage and retries the original request once.
5. If refresh fails, the original API request still fails with 401 and the app can fall back to normal logout/login behavior.

## Flow Sanity Check

The plan is reasonable for the current architecture, with two caveats:

- The refresh token is currently a simple `refresh-{userId}` token for Learner Lab/demo use. Before production, replace it with a signed, expiring refresh token or server-side refresh-token table.
- CORS still contains a placeholder production origin. Replace `https://your-production-domain.com` with the deployed frontend domain before production.

## Verification

Run these checks after changes:

```bash
npm.cmd run typecheck
npm.cmd test
cd backend
sam validate
sam build --cached --parallel
```

Manual flow:

1. Login as instructor and create or edit an assignment.
2. Login as student and submit a file.
3. Login as instructor, open tracking, download the submitted file, grade it, and export CSV.
