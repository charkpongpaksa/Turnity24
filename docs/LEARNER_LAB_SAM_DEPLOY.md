# Learner Lab SAM Deploy Guide

This guide explains how to deploy the Turnity backend scaffold from your local project to AWS using SAM in Learner Lab.

## 1. Prerequisites

Install these on your machine:

- AWS CLI
- AWS SAM CLI
- Docker

Docker is needed if you want to use `sam local`.

## 2. Get Learner Lab credentials

In Learner Lab:

1. open the AWS session
2. find the temporary credentials
3. copy:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_SESSION_TOKEN`

In your terminal:

```bash
export AWS_ACCESS_KEY_ID=YOUR_KEY
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET
export AWS_SESSION_TOKEN=YOUR_SESSION_TOKEN
export AWS_DEFAULT_REGION=us-east-1
```

You can verify access with:

```bash
aws sts get-caller-identity
```

## 3. Prepare backend folder

Go to the backend folder:

```bash
cd backend
```

Optional:

```bash
cp samconfig.example.toml samconfig.toml
```

## 4. Local testing

Run the local API:

```bash
sam local start-api --env-vars env.json.example
```

Then test:

- `POST http://127.0.0.1:3000/auth/login`
- `GET http://127.0.0.1:3000/courses`

You can also invoke single handlers:

```bash
sam local invoke AuthLoginFunction --event events/auth-login.json --env-vars env.json.example
sam local invoke CoursesCreateFunction --event events/courses-create.json --env-vars env.json.example
```

## 5. Build and deploy

First deployment:

```bash
sam build
sam deploy --guided
```

Recommended answers:

- Stack Name: `turnity-backend-dev`
- AWS Region: `us-east-1`
- Confirm changes before deploy: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Save arguments to configuration file: `Y`

Important parameters to provide during `sam deploy --guided`:

- `CorsOrigin`
  Suggested local/dev value: `http://localhost:5173`
- `AuthTokenSecret`
  Use a long random string
- `LocalAuthSalt`
  Use another long random string
- `TuApiApplicationKey`
  Leave blank only if you are testing local accounts first

After the first guided deploy:

```bash
sam build
sam deploy
```

## 6. Get the API URL

After deploy, SAM prints outputs such as:

- `ApiBaseUrl`
- `TableName`

Use the API base URL in frontend `.env.local`:

```env
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com
```

Then restart the frontend dev server.

## 7. Current scaffold behavior

Current backend scaffold:

- `auth-login` supports 2 login sources:
  - local database accounts
  - real TU API login when `TU_API_APPLICATION_KEY` is set
- successful TU student login automatically creates or updates the student profile in DynamoDB
- instructor can add a student to a course even before that student logs in
- if the student record does not exist yet, the backend creates a placeholder student first
- course, announcement, discussion, notification, and submission handlers are wired to DynamoDB

Built-in local test accounts:

- student: `student.demo@turnity.local` / `1234`
- instructor: `lecturer.demo@turnity.local` / `1234`

## 8. Best next step

After successful deploy, continue in this order:

1. set `TU_API_APPLICATION_KEY` in Lambda environment
2. test `/auth/login` with a real TU student account
3. test instructor create course + add placeholder student flow
4. connect the frontend to API mode end-to-end
5. add stronger authorization checks and production token handling

## 9. Regression checklist

Before demo or API-mode testing, run through:

- [Regression Checklist](./REGRESSION_CHECKLIST.md)
