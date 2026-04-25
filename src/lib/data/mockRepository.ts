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

let courseState = structuredClone(mockCourses) as Course[];
let assignmentState = structuredClone(mockAssignments) as Assignment[];
let announcementState = structuredClone(mockAnnouncements) as Announcement[];
let discussionState = structuredClone(mockDiscussions) as Discussion[];
const studentState = structuredClone(mockStudents) as Student[];

const defaultEnrollments = new Map<string, string[]>([
  ["1", ["1", "2", "3", "4"]],
  ["2", ["2", "3", "5", "6"]],
  ["3", ["1", "4", "5"]],
  ["4", ["2", "5", "6"]],
]);

const courseEnrollments = new Map(
  Array.from(defaultEnrollments.entries(), ([courseId, studentIds]) => [
    courseId,
    [...studentIds],
  ])
);

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
  return clone(updated);
}

export async function listNotifications(): Promise<Notification[]> {
  return structuredClone(mockNotifications) as Notification[];
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
  return listCourseStudents(courseId);
}

export async function listSubmissions(
  assignmentId?: string
): Promise<SubmissionRecord[]> {
  const submissions = assignmentId
    ? mockSubmissions.filter((submission) => submission.assignmentId === assignmentId)
    : mockSubmissions;

  return structuredClone(submissions) as SubmissionRecord[];
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return currentUser;
}
