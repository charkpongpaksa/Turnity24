/**
 * apiEndpoints.ts
 * ─────────────────────────────────────────────────────────────────
 * Central registry of every API path the frontend uses.
 *
 * How this maps to AWS:
 *   API Gateway base URL  →  VITE_API_BASE_URL  (in .env)
 *   Each Lambda function  →  one or more paths below
 *
 * Naming convention:
 *   RESOURCE_ACTION (e.g. COURSE_LIST, ASSIGNMENT_CREATE)
 *
 * Dynamic segments use {param} syntax matching API Gateway path params.
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Auth ─────────────────────────────────────────────────────────
export const AUTH = {
  LOGIN:    "/auth/login",         // POST   → Lambda: auth-login
  LOGOUT:   "/auth/logout",        // POST   → Lambda: auth-logout
  ME:       "/auth/me",            // GET    → Lambda: auth-me (verify token)
  REFRESH:  "/auth/refresh",       // POST   → Lambda: auth-refresh
} as const;

// ─── Users / Profiles ─────────────────────────────────────────────
export const USERS = {
  PROFILE:        "/users/profile",            // GET / PUT  → Lambda: users-profile
  PROFILE_AVATAR: "/users/profile/avatar",     // POST       → Lambda: users-avatar (upload to S3)
  STUDENTS:       "/users/students",           // GET       → Lambda: users-students
} as const;

// ─── Courses ──────────────────────────────────────────────────────
export const COURSES = {
  LIST:       "/courses",                      // GET        → Lambda: courses-list
  CREATE:     "/courses",                      // POST       → Lambda: courses-create  (instructor)
  DETAIL:     "/courses/{courseId}",           // GET        → Lambda: courses-detail
  UPDATE:     "/courses/{courseId}",           // PUT        → Lambda: courses-update  (instructor)
  DELETE:     "/courses/{courseId}",           // DELETE     → Lambda: courses-delete  (instructor)
  STUDENTS:   "/courses/{courseId}/students",  // GET        → Lambda: courses-students-list
  ADD_STUDENT:"/courses/{courseId}/students",  // POST       → Lambda: courses-students-add
  REMOVE_STUDENT: "/courses/{courseId}/students/{studentId}", // DELETE → Lambda: courses-students-remove
  ENROLL:     "/courses/{courseId}/enroll",    // POST       → Lambda: courses-enroll  (student)
} as const;

// ─── Assignments ──────────────────────────────────────────────────
export const ASSIGNMENTS = {
  LIST:       "/courses/{courseId}/assignments",                         // GET    → Lambda: assignments-list
  CREATE:     "/courses/{courseId}/assignments",                         // POST   → Lambda: assignments-create  (instructor)
  DETAIL:     "/courses/{courseId}/assignments/{assignmentId}",          // GET    → Lambda: assignments-detail
  UPDATE:     "/courses/{courseId}/assignments/{assignmentId}",          // PUT    → Lambda: assignments-update  (instructor)
  DELETE:     "/courses/{courseId}/assignments/{assignmentId}",          // DELETE → Lambda: assignments-delete  (instructor)
} as const;

// ─── Submissions ──────────────────────────────────────────────────
export const SUBMISSIONS = {
  /** Student submits work */
  CREATE:     "/courses/{courseId}/assignments/{assignmentId}/submissions",                  // POST   → Lambda: submissions-create

  /** Instructor lists all submissions for an assignment */
  LIST:       "/courses/{courseId}/assignments/{assignmentId}/submissions",                  // GET    → Lambda: submissions-list

  /** Get a specific submission */
  DETAIL:     "/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}",   // GET    → Lambda: submissions-detail

  /** Instructor grades a submission */
  GRADE:      "/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}/grade", // PUT → Lambda: submissions-grade
} as const;

// ─── Attachments / File Upload ─────────────────────────────────────
export const FILES = {
  /**
   * Request a pre-signed S3 URL to upload a file directly from the browser.
   * Body: { filename, contentType, context: "assignment" | "submission" }
   * Response: { uploadUrl, fileKey, publicUrl }
   */
  PRESIGNED_UPLOAD: "/files/presigned-upload",   // POST   → Lambda: files-presigned-upload

  /**
   * Request a pre-signed S3 URL to download a file.
   */
  PRESIGNED_DOWNLOAD: "/files/presigned-download", // GET → Lambda: files-presigned-download

  /** Delete a previously uploaded file */
  DELETE:           "/files/{fileKey}",           // DELETE → Lambda: files-delete
} as const;

// ─── Announcements ────────────────────────────────────────────────
export const ANNOUNCEMENTS = {
  LIST:       "/courses/{courseId}/announcements",                          // GET    → Lambda: announcements-list
  CREATE:     "/courses/{courseId}/announcements",                          // POST   → Lambda: announcements-create  (instructor)
  UPDATE:     "/courses/{courseId}/announcements/{announcementId}",         // PUT    → Lambda: announcements-update  (instructor)
  DELETE:     "/courses/{courseId}/announcements/{announcementId}",         // DELETE → Lambda: announcements-delete  (instructor)
} as const;

// ─── Discussions ──────────────────────────────────────────────────
export const DISCUSSIONS = {
  LIST:       "/courses/{courseId}/discussions",                                          // GET  → Lambda: discussions-list
  CREATE:     "/courses/{courseId}/discussions",                                          // POST → Lambda: discussions-create
  DETAIL:     "/courses/{courseId}/discussions/{discussionId}",                           // GET  → Lambda: discussions-detail
  UPDATE:     "/courses/{courseId}/discussions/{discussionId}",                           // PUT  → Lambda: discussions-update
  DELETE:     "/courses/{courseId}/discussions/{discussionId}",                           // DELETE → Lambda: discussions-delete (instructor)
  REPLY:      "/courses/{courseId}/discussions/{discussionId}/replies",                   // POST → Lambda: discussions-reply
  LIKE:       "/courses/{courseId}/discussions/{discussionId}/like",                      // POST → Lambda: discussions-like
} as const;

// ─── Notifications ────────────────────────────────────────────────
export const NOTIFICATIONS = {
  LIST:       "/notifications",                          // GET   → Lambda: notifications-list
  MARK_READ:  "/notifications/{notificationId}/read",   // PUT   → Lambda: notifications-mark-read
  MARK_ALL:   "/notifications/read-all",                // PUT   → Lambda: notifications-read-all
} as const;

// ─── Analytics (Instructor only) ──────────────────────────────────
export const ANALYTICS = {
  COURSE:       "/courses/{courseId}/analytics",               // GET → Lambda: analytics-course
  ASSIGNMENT:   "/courses/{courseId}/analytics/assignments/{assignmentId}",   // GET → Lambda: analytics-assignments
} as const;

// ─── Helper: build a path by substituting {param} placeholders ────
/**
 * Usage:
 *   buildPath(ASSIGNMENTS.DETAIL, { courseId: "1", assignmentId: "2" })
 *   → "/courses/1/assignments/2"
 */
export function buildPath(
  template: string,
  params: Record<string, string | number>
): string {
  return Object.entries(params).reduce<string>(
    (path, [key, val]) => path.replace(`{${key}}`, String(val)),
    template
  );
}
