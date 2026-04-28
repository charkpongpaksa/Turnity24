# Backend API Contract

This document defines the recommended backend contract for the current frontend.

The frontend already supports:

- auth with TU-backed login via your backend
- local instructor/student test accounts stored in DynamoDB
- courses and enrollments
- assignments and submissions
- announcements
- discussions, comments, and likes
- notifications

## Auth

The backend should support both:

- local database accounts for testing
- TU API login for real university accounts

When a TU login succeeds, the backend should upsert that user into DynamoDB immediately.

### `POST /auth/login`

Request:

```json
{
  "username": "65070001",
  "password": "secret"
}
```

Response:

```json
{
  "accessToken": "app-jwt-token",
  "refreshToken": "optional-refresh-token",
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

### `POST /auth/logout`

Response:

```json
{}
```

### `GET /auth/me`

Response:

```json
{
  "id": "65070001",
  "name": "Student Demo",
  "initials": "SD",
  "activeRole": "student"
}
```

## Courses

### `GET /courses`

Response:

```json
[
  {
    "id": "1",
    "name": "Advanced Web Development",
    "code": "CS401",
    "instructor": "Dr. Sarah Johnson",
    "progress": 75,
    "color": "bg-blue-500",
    "students": 45,
    "nextDeadline": "2026-03-28"
  }
]
```

### `POST /courses`

Request:

```json
{
  "name": "Cloud Systems Design",
  "code": "CS440",
  "instructor": "Lecturer Demo"
}
```

Response:

```json
{
  "id": "course-1",
  "name": "Cloud Systems Design",
  "code": "CS440",
  "instructor": "Lecturer Demo",
  "progress": 0,
  "color": "bg-slate-600",
  "students": 0,
  "nextDeadline": "2026-04-25"
}
```

### `PUT /courses/{courseId}`

Request:

```json
{
  "name": "Cloud Systems Design Lab",
  "code": "CS440",
  "instructor": "Lecturer Demo"
}
```

Response:

```json
{
  "id": "course-1",
  "name": "Cloud Systems Design Lab",
  "code": "CS440",
  "instructor": "Lecturer Demo",
  "progress": 0,
  "color": "bg-slate-600",
  "students": 12,
  "nextDeadline": "2026-04-25"
}
```

### `GET /courses/{courseId}/students`

Response:

```json
[
  {
    "id": "1",
    "name": "Alice Johnson",
    "email": "alice.j@university.edu",
    "avatar": "https://example.com/avatar.png"
  }
]
```

### `POST /courses/{courseId}/students`

Request:

```json
{
  "studentId": "5"
}
```

Response:

```json
[
  {
    "id": "1",
    "name": "Alice Johnson",
    "email": "alice.j@university.edu",
    "avatar": "https://example.com/avatar.png"
  },
  {
    "id": "5",
    "name": "Emma Davis",
    "email": "emma.d@university.edu",
    "avatar": "https://example.com/avatar-2.png"
  }
]
```

### `DELETE /courses/{courseId}/students/{studentId}`

Response:

```json
[
  {
    "id": "1",
    "name": "Alice Johnson",
    "email": "alice.j@university.edu",
    "avatar": "https://example.com/avatar.png"
  }
]
```

## Assignments

### `GET /courses/{courseId}/assignments`

Response:

```json
[
  {
    "id": "1",
    "courseId": "1",
    "title": "React Component Architecture",
    "description": "Build a scalable React architecture.",
    "dueDate": "2026-03-28T23:59:00Z",
    "status": "not_submitted",
    "type": "file",
    "points": 100,
    "latePolicy": "10% deduction per day late",
    "attachments": [],
    "submissions": []
  }
]
```

### `GET /courses/{courseId}/assignments/{assignmentId}`

Response:

```json
{
  "id": "1",
  "courseId": "1",
  "title": "React Component Architecture",
  "description": "Build a scalable React architecture.",
  "dueDate": "2026-03-28T23:59:00Z",
  "status": "not_submitted",
  "type": "file",
  "points": 100,
  "latePolicy": "10% deduction per day late",
  "attachments": [],
  "submissions": []
}
```

### `DELETE /courses/{courseId}/assignments/{assignmentId}`

Response:

```json
{}
```

## Announcements

### `GET /courses/{courseId}/announcements`

Response:

```json
[
  {
    "id": "ann-1",
    "courseId": "1",
    "title": "Midterm Exam Schedule",
    "content": "The midterm exam will be held on April 5th.",
    "author": "Dr. Sarah Johnson",
    "timestamp": "2026-03-23T10:00:00Z",
    "pinned": true
  }
]
```

### `POST /courses/{courseId}/announcements`

Request:

```json
{
  "title": "Class reminder",
  "content": "Please prepare your project slides.",
  "author": "Lecturer Demo",
  "pinned": false
}
```

### `PUT /courses/{courseId}/announcements/{announcementId}`

Request:

```json
{
  "title": "Updated class reminder",
  "content": "Please prepare your project slides and demo.",
  "pinned": true
}
```

## Discussions

### `GET /courses/{courseId}/discussions`

Response:

```json
[
  {
    "id": "discussion-1",
    "courseId": "1",
    "author": "Student Demo",
    "authorAvatar": "https://example.com/avatar.png",
    "title": "Need help with deployment",
    "content": "Which AWS service should trigger reminders?",
    "timestamp": "2026-04-25T10:00:00Z",
    "replies": 1,
    "likes": 2,
    "authorId": "65070001",
    "authorRole": "student",
    "likedBy": ["65070001", "teacher01"],
    "comments": [
      {
        "id": "comment-1",
        "authorId": "teacher01",
        "authorName": "Lecturer Demo",
        "authorRole": "instructor",
        "content": "Start with EventBridge Scheduler.",
        "createdAt": "2026-04-25T10:30:00Z"
      }
    ]
  }
]
```

### `POST /courses/{courseId}/discussions`

Request:

```json
{
  "title": "Need help with deployment",
  "content": "Which AWS service should trigger reminders?",
  "author": "Student Demo",
  "authorAvatar": "https://example.com/avatar.png",
  "authorId": "65070001",
  "authorRole": "student"
}
```

### `PUT /courses/{courseId}/discussions/{discussionId}`

Request:

```json
{
  "content": "Which AWS service should trigger deadline reminders?"
}
```

### `DELETE /courses/{courseId}/discussions/{discussionId}`

Response:

```json
{}
```

### `POST /courses/{courseId}/discussions/{discussionId}/replies`

Request:

```json
{
  "authorId": "teacher01",
  "authorName": "Lecturer Demo",
  "authorRole": "instructor",
  "content": "Start with EventBridge Scheduler."
}
```

### `POST /courses/{courseId}/discussions/{discussionId}/like`

Request:

```json
{
  "userId": "65070001"
}
```

## Notifications

### `GET /notifications`

Response:

```json
[
  {
    "id": "1",
    "type": "deadline",
    "title": "Assignment Due Soon",
    "message": "React Component Architecture is due in 4 days",
    "timestamp": "2026-03-24T09:00:00Z",
    "urgent": false,
    "read": false,
    "link": "/course/1/assignment/1"
  }
]
```

### `PUT /notifications/{notificationId}/read`

Response:

```json
{}
```

### `PUT /notifications/read-all`

Response:

```json
{}
```

## Suggested build order

1. `POST /auth/login`
2. `GET /courses`
3. `GET /courses/{courseId}`
4. `GET /courses/{courseId}/students`
5. `POST /courses`
6. `PUT /courses/{courseId}`
7. `POST /courses/{courseId}/students`
8. `DELETE /courses/{courseId}/students/{studentId}`
9. `GET /courses/{courseId}/announcements`
10. `POST /courses/{courseId}/announcements`
11. `PUT /courses/{courseId}/announcements/{announcementId}`
12. `GET /courses/{courseId}/discussions`
13. `POST /courses/{courseId}/discussions`
14. `PUT /courses/{courseId}/discussions/{discussionId}`
15. `POST /courses/{courseId}/discussions/{discussionId}/replies`
16. `POST /courses/{courseId}/discussions/{discussionId}/like`
17. `GET /notifications`

This order matches the current frontend maturity and gives the fastest path to replacing mock mode with real API mode.
