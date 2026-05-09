import {
  mockAnnouncements,
  mockAssignments,
  mockCourses,
  mockDiscussions,
  mockNotifications,
  mockStudents,
  mockSubmissions,
} from "@/lib/mocks/mockData";
import type {
  Announcement,
  Assignment,
  Course,
  CurrentUser,
  Discussion,
  DiscussionComment,
  Notification,
  Student,
  SubmissionRecord,
} from "@/lib/types/models";

const STORAGE_KEYS = {
  COURSES: "turnity_mock_courses",
  ASSIGNMENTS: "turnity_mock_assignments",
  ANNOUNCEMENTS: "turnity_mock_announcements",
  DISCUSSIONS: "turnity_mock_discussions",
  NOTIFICATIONS: "turnity_mock_notifications",
  SUBMISSIONS: "turnity_mock_submissions",
  ENROLLMENTS: "turnity_mock_enrollments",
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

let courseState = loadFromStorage(STORAGE_KEYS.COURSES, mockCourses) as Course[];
let assignmentState = loadFromStorage(STORAGE_KEYS.ASSIGNMENTS, mockAssignments) as Assignment[];
let announcementState = loadFromStorage(STORAGE_KEYS.ANNOUNCEMENTS, mockAnnouncements) as Announcement[];
let discussionState = loadFromStorage(STORAGE_KEYS.DISCUSSIONS, mockDiscussions) as Discussion[];
let notificationState = loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, mockNotifications) as Notification[];
let submissionState = loadFromStorage(STORAGE_KEYS.SUBMISSIONS, mockSubmissions) as SubmissionRecord[];
const studentState = structuredClone(mockStudents) as Student[];

const defaultEnrollments = [
  ["1", ["1", "2", "3", "4"]],
  ["2", ["2", "3", "5", "6"]],
  ["3", ["1", "4", "5"]],
  ["4", ["2", "5", "6"]],
];

const storedEnrollments = loadFromStorage(STORAGE_KEYS.ENROLLMENTS, defaultEnrollments);
const courseEnrollments = new Map<string, string[]>(
  storedEnrollments.map(([courseId, studentIds]) => [courseId, [...studentIds]]) as [string, string[]][]
);

function persistAll() {
  saveToStorage(STORAGE_KEYS.COURSES, courseState);
  saveToStorage(STORAGE_KEYS.ASSIGNMENTS, assignmentState);
  saveToStorage(STORAGE_KEYS.ANNOUNCEMENTS, announcementState);
  saveToStorage(STORAGE_KEYS.DISCUSSIONS, discussionState);
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notificationState);
  saveToStorage(STORAGE_KEYS.SUBMISSIONS, submissionState);
  saveToStorage(STORAGE_KEYS.ENROLLMENTS, Array.from(courseEnrollments.entries()));
}

const currentUser: CurrentUser = {
  id: "user-demo",
  name: "John Doe",
  initials: "JD",
  avatarUrl:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
  activeRole: "student",
};

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureCourseEnrollment(courseId: string): string[] {
  const existing = courseEnrollments.get(courseId);
  if (existing) return existing;

  courseEnrollments.set(courseId, []);
  return courseEnrollments.get(courseId) ?? [];
}

function syncCourseStudentCount(courseId: string): void {
  const studentIds = ensureCourseEnrollment(courseId);
  courseState = courseState.map((course) =>
    course.id === courseId
      ? { ...course, students: studentIds.length }
      : course
  );
}

export async function listCourses(): Promise<Course[]> {
  return clone(courseState);
}

export async function getCourseById(id: string): Promise<Course | null> {
  return ((courseState.find((course) => course.id === id) as Course | undefined) ??
    null);
}

export async function createCourse(input: {
  name: string;
  code: string;
  instructor: string;
}): Promise<Course> {
  const createdCourse: Course = {
    id: createId("course"),
    name: input.name,
    code: input.code,
    instructor: input.instructor,
    progress: 0,
    color: "bg-slate-600",
    students: 0,
    nextDeadline: new Date().toISOString().split("T")[0],
  };

  courseState = [createdCourse, ...courseState];
  courseEnrollments.set(createdCourse.id, []);
  persistAll();
  return clone(createdCourse);
}

export async function updateCourse(
  courseId: string,
  input: Partial<Pick<Course, "name" | "code" | "instructor">>
): Promise<Course | null> {
  const existing = courseState.find((course) => course.id === courseId);
  if (!existing) return null;

  const updated = { ...existing, ...input };
  courseState = courseState.map((course) =>
    course.id === courseId ? updated : course
  );
  persistAll();
  return clone(updated);
}

export async function listAssignments(courseId?: string): Promise<Assignment[]> {
  const assignments = courseId
    ? assignmentState.filter((assignment) => assignment.courseId === courseId)
    : assignmentState;

  return clone(assignments);
}

export async function getAssignmentById(
  assignmentId: string
): Promise<Assignment | null> {
  return ((assignmentState.find(
    (assignment) => assignment.id === assignmentId
  ) as Assignment | undefined) ?? null);
}

export async function createAssignment(
  courseId: string,
  input: Pick<
    Assignment,
    "title" | "description" | "dueDate" | "type" | "points" | "latePolicy" | "attachments"
  > & { status?: Assignment["status"] }
): Promise<Assignment> {
  const created: Assignment = {
    id: createId("assignment"),
    courseId,
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    status: input.status ?? "not_submitted",
    type: input.type,
    points: input.points,
    latePolicy: input.latePolicy,
    attachments: input.attachments,
    submissions: [],
  };

  assignmentState = [created, ...assignmentState];
  persistAll();
  return clone(created);
}

export async function updateAssignment(
  courseId: string,
  assignmentId: string,
  input: Partial<Pick<Assignment, "title" | "description" | "dueDate" | "status" | "points">>
): Promise<Assignment | null> {
  const existing = assignmentState.find(
    (assignment) => assignment.id === assignmentId && assignment.courseId === courseId
  );
  if (!existing) return null;

  const updated = { ...existing, ...input };
  assignmentState = assignmentState.map((assignment) =>
    assignment.id === assignmentId ? updated : assignment
  );
  persistAll();
  return clone(updated);
}

export async function deleteAssignment(
  courseId: string,
  assignmentId: string
): Promise<boolean> {
  const nextAssignments = assignmentState.filter(
    (assignment) =>
      !(assignment.id === assignmentId && assignment.courseId === courseId)
  );
  const deleted = nextAssignments.length !== assignmentState.length;
  assignmentState = nextAssignments;
  persistAll();
  return deleted;
}

export async function listAnnouncements(
  courseId?: string
): Promise<Announcement[]> {
  const announcements = courseId
    ? announcementState.filter((announcement) => announcement.courseId === courseId)
    : announcementState;

  return clone(announcements);
}

export async function createAnnouncement(
  courseId: string,
  input: Pick<Announcement, "title" | "content" | "author" | "pinned">
): Promise<Announcement> {
  const created: Announcement = {
    id: createId("ann"),
    courseId,
    title: input.title,
    content: input.content,
    author: input.author,
    pinned: input.pinned,
    timestamp: new Date().toISOString(),
  };

  announcementState = [created, ...announcementState];
  persistAll();
  return clone(created);
}

export async function updateAnnouncement(
  courseId: string,
  announcementId: string,
  input: Partial<Pick<Announcement, "title" | "content" | "pinned">>
): Promise<Announcement | null> {
  const existing = announcementState.find(
    (announcement) =>
      announcement.id === announcementId && announcement.courseId === courseId
  );
  if (!existing) return null;

  const updated = { ...existing, ...input };
  announcementState = announcementState.map((announcement) =>
    announcement.id === announcementId ? updated : announcement
  );
  persistAll();
  return clone(updated);
}

export async function listNotifications(): Promise<Notification[]> {
  return clone(notificationState);
}

export async function markNotificationRead(
  notificationId: string
): Promise<Notification | null> {
  const existing = notificationState.find((notification) => notification.id === notificationId);
  if (!existing) return null;

  const updated = { ...existing, read: true };
  notificationState = notificationState.map((notification) =>
    notification.id === notificationId ? updated : notification
  );
  persistAll();
  return clone(updated);
}

export async function markAllNotificationsRead(): Promise<Notification[]> {
  notificationState = notificationState.map((notification) => ({
    ...notification,
    read: true,
  }));
  persistAll();
  return clone(notificationState);
}

export async function listDiscussions(courseId?: string): Promise<Discussion[]> {
  const discussions = courseId
    ? discussionState.filter((discussion) => discussion.courseId === courseId)
    : discussionState;

  return clone(discussions);
}

export async function createDiscussion(
  courseId: string,
  input: Pick<
    Discussion,
    "title" | "content" | "author" | "authorAvatar" | "authorId" | "authorRole"
  >
): Promise<Discussion> {
  const created: Discussion = {
    id: createId("discussion"),
    courseId,
    title: input.title,
    content: input.content,
    author: input.author,
    authorAvatar: input.authorAvatar,
    timestamp: new Date().toISOString(),
    replies: 0,
    likes: 0,
    authorId: input.authorId,
    authorRole: input.authorRole,
    likedBy: [],
    comments: [],
  };

  discussionState = [created, ...discussionState];
  persistAll();
  return clone(created);
}

export async function updateDiscussion(
  courseId: string,
  discussionId: string,
  input: Partial<Pick<Discussion, "title" | "content">>
): Promise<Discussion | null> {
  const existing = discussionState.find(
    (discussion) => discussion.id === discussionId && discussion.courseId === courseId
  );
  if (!existing) return null;

  const updated = { ...existing, ...input };
  discussionState = discussionState.map((discussion) =>
    discussion.id === discussionId ? updated : discussion
  );
  persistAll();
  return clone(updated);
}

export async function deleteDiscussion(
  courseId: string,
  discussionId: string
): Promise<boolean> {
  const nextState = discussionState.filter(
    (discussion) =>
      !(discussion.id === discussionId && discussion.courseId === courseId)
  );
  const deleted = nextState.length !== discussionState.length;
  discussionState = nextState;
  persistAll();
  return deleted;
}

export async function addDiscussionComment(
  courseId: string,
  discussionId: string,
  input: Omit<DiscussionComment, "id" | "createdAt">
): Promise<Discussion | null> {
  const existing = discussionState.find(
    (discussion) => discussion.id === discussionId && discussion.courseId === courseId
  );
  if (!existing) return null;

  const comments = [
    ...(existing.comments ?? []),
    {
      id: createId("comment"),
      createdAt: new Date().toISOString(),
      ...input,
    },
  ];

  const updated: Discussion = {
    ...existing,
    comments,
    replies: comments.length,
  };

  discussionState = discussionState.map((discussion) =>
    discussion.id === discussionId ? updated : discussion
  );
  persistAll();
  return clone(updated);
}

export async function toggleDiscussionLike(
  courseId: string,
  discussionId: string,
  userId: string
): Promise<Discussion | null> {
  const existing = discussionState.find(
    (discussion) => discussion.id === discussionId && discussion.courseId === courseId
  );
  if (!existing) return null;

  const likedBy = existing.likedBy ?? [];
  const alreadyLiked = likedBy.includes(userId);
  const nextLikedBy = alreadyLiked
    ? likedBy.filter((id) => id !== userId)
    : [...likedBy, userId];

  const updated: Discussion = {
    ...existing,
    likedBy: nextLikedBy,
    likes: nextLikedBy.length,
  };

  discussionState = discussionState.map((discussion) =>
    discussion.id === discussionId ? updated : discussion
  );
  persistAll();
  return clone(updated);
}

export async function listStudents(): Promise<Student[]> {
  return clone(studentState);
}

export async function listCourseStudents(courseId: string): Promise<Student[]> {
  const studentIds = ensureCourseEnrollment(courseId);
  return clone(
    studentState.filter((student) => studentIds.includes(student.id))
  );
}

export async function addStudentToCourse(
  courseId: string,
  studentId: string
): Promise<Student[]> {
  const student = studentState.find((item) => item.id === studentId);
  if (!student) {
    throw new Error("Student not found.");
  }

  const studentIds = ensureCourseEnrollment(courseId);
  if (!studentIds.includes(studentId)) {
    courseEnrollments.set(courseId, [...studentIds, studentId]);
    syncCourseStudentCount(courseId);
    persistAll();
  }

  return listCourseStudents(courseId);
}

export async function removeStudentFromCourse(
  courseId: string,
  studentId: string
): Promise<Student[]> {
  const studentIds = ensureCourseEnrollment(courseId);
  courseEnrollments.set(
    courseId,
    studentIds.filter((id) => id !== studentId)
  );
  syncCourseStudentCount(courseId);
  persistAll();
  return listCourseStudents(courseId);
}

export async function listSubmissions(
  assignmentId?: string
): Promise<SubmissionRecord[]> {
  const submissions = assignmentId
    ? submissionState.filter((submission) => submission.assignmentId === assignmentId)
    : submissionState;

  return structuredClone(submissions) as SubmissionRecord[];
}

export async function createSubmission(
  assignmentId: string,
  input: { text?: string; fileUrl?: string; fileName?: string }
): Promise<SubmissionRecord> {
  const submittedAt = new Date().toISOString();
  const assignment = assignmentState.find((item) => item.id === assignmentId);
  const isLate = assignment ? new Date(submittedAt) > new Date(assignment.dueDate) : false;
  const fileName = input.fileName || input.fileUrl || undefined;

  const created: SubmissionRecord = {
    id: createId("mock-sub"),
    assignmentId,
    studentId: currentUser.id,
    status: isLate ? "late" : "submitted",
    submittedAt,
    score: null,
    feedback: "Pending review",
    text: input.text ?? "",
    fileUrl: input.fileUrl ?? null,
    fileName: input.fileName ?? null,
  };

  submissionState = [
    created,
    ...submissionState.filter(
      (submission) =>
        !(submission.assignmentId === assignmentId && submission.studentId === currentUser.id)
    ),
  ];

  assignmentState = assignmentState.map((item) =>
    item.id === assignmentId
      ? {
          ...item,
          status: created.status,
          submissions: [
            {
              submittedAt,
              files: fileName ? [fileName] : [],
              feedback: "Pending review",
              score: null,
            },
          ],
        }
      : item
  );

  persistAll();
  return clone(created);
}

export async function gradeSubmission(
  assignmentId: string,
  studentId: string,
  score: number
): Promise<SubmissionRecord | null> {
  const existing = submissionState.find(
    (submission) =>
      submission.assignmentId === assignmentId && submission.studentId === studentId
  );

  if (!existing) return null;

  const updated = {
    ...existing,
    score,
  } as SubmissionRecord;

  submissionState = submissionState.map((submission) =>
    submission.assignmentId === assignmentId && submission.studentId === studentId
      ? updated
      : submission
  );
  persistAll();
  return clone(updated);
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return currentUser;
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  courseState = courseState.filter((c) => c.id !== courseId);
  courseEnrollments.delete(courseId);
  persistAll();
  return true;
}

export async function enrollInCourse(courseId: string): Promise<boolean> {
  const studentIds = ensureCourseEnrollment(courseId);
  if (!studentIds.includes(currentUser.id)) {
    courseEnrollments.set(courseId, [...studentIds, currentUser.id]);
    syncCourseStudentCount(courseId);
    persistAll();
  }
  return true;
}

export async function deleteAnnouncement(
  courseId: string,
  announcementId: string
): Promise<boolean> {
  announcementState = announcementState.filter(
    (a) => !(a.id === announcementId && a.courseId === courseId)
  );
  persistAll();
  return true;
}

export async function getProfile(): Promise<CurrentUser> {
  return clone(currentUser);
}

export async function updateProfile(input: Partial<CurrentUser>): Promise<CurrentUser> {
  Object.assign(currentUser, input);
  return clone(currentUser);
}

export async function getCourseAnalytics(courseId: string): Promise<any> {
  const students = await listCourseStudents(courseId);
  const assignments = await listAssignments(courseId);
  return {
    studentCount: students.length,
    assignmentCount: assignments.length,
    submissionCount: 15,
    averageScore: 82.5,
    completionRate: 94,
  };
}

export async function getAssignmentAnalytics(
  courseId: string,
  assignmentId: string
): Promise<any> {
  return {
    submissionCount: 28,
    gradedCount: 25,
    averageScore: 84.2,
    highestScore: 100,
    lowestScore: 65,
    completionRate: 92.8,
  };
}

export async function getDiscussionDetail(
  courseId: string,
  discussionId: string
): Promise<Discussion | null> {
  return discussionState.find(d => d.id === discussionId) ?? null;
}
