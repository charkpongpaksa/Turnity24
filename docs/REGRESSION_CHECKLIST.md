# Turnity Regression Checklist

Use this checklist before switching the frontend to `VITE_DATA_SOURCE=api` or before a demo.

## 1. Login and session

- Login with local student account: `student.demo@turnity.local / 1234`
- Login with local instructor account: `lecturer.demo@turnity.local / 1234`
- If TU API is configured, login with a real TU student account
- Refresh the browser and confirm the session is restored
- Logout and confirm the app returns to `/login`
- If a token expires, confirm the refresh flow returns the user to the requested page or redirects cleanly to `/login`

## 2. Student flows

- Open dashboard and confirm notifications, deadlines, and courses load
- Open a course from `/courses`
- Open an assignment from the course page
- Submit a text assignment
- Submit a link assignment
- Submit a file assignment if S3 presigned upload is configured
- Open discussion detail, add a comment, and toggle like

## 3. Instructor flows

- Open dashboard and navigate to `/instructor/courses`
- Create a course
- Edit a course
- Delete a course
- Open a course and create an announcement
- Edit and delete an announcement
- Create an assignment
- Edit assignment details
- Edit assignment deadline
- Delete an assignment
- Open submission tracking and save a grade
- Open analytics from the instructor sidebar and confirm it redirects to a valid course analytics page

## 4. Course membership

- Instructor adds an existing student into a course
- Instructor removes a student from a course
- Student enrolls through the course flow if self-enroll is enabled
- Placeholder student flow:
  - instructor adds a student ID that has never logged in
  - student later logs in through TU API
  - confirm the placeholder record is updated rather than duplicated

## 5. Notifications

- Open notification center from the bell icon
- Mark one notification as read
- Mark all notifications as read
- Click a notification and confirm it resolves to the correct route for the current role

## 6. Files

- Instructor uploads an attachment to an assignment
- Student downloads the assignment attachment
- Student uploads a submission file
- Instructor downloads the submitted file
- Delete an uploaded file if the flow is enabled

## 7. Deploy checks

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `sam validate --template-file backend/template.yaml`
- `sam build --template-file backend/template.yaml`
- Confirm SAM parameters are set:
  - `CorsOrigin`
  - `AuthTokenSecret`
  - `LocalAuthSalt`
  - `TuApiApplicationKey`

## 8. Known follow-up items

- The old `backend/functions/*/shared` folders are now unused and should be deleted in a cleanup pass
- `backend/.aws-sam/` should remain untracked
- File upload and download flows depend on valid S3 bucket permissions and runtime AWS credentials
