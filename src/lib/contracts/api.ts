import type {
  Announcement,
  Assignment,
  Course,
  Discussion,
  DiscussionComment,
  Notification,
  Student,
  SubmissionRecord,
} from "@/lib/types/models";
import type { TuApiProfile } from "@/features/auth/auth.types";

export type AuthLoginRequest = {
  username: string;
  password: string;
};

export type AuthLoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  profile: TuApiProfile;
};

export type CreateCourseRequest = {
  name: string;
  code: string;
  instructor: string;
};

export type UpdateCourseRequest = Partial<
  Pick<Course, "name" | "code" | "instructor">
>;

export type CreateAnnouncementRequest = Pick<
  Announcement,
  "title" | "content" | "author" | "pinned"
>;

export type UpdateAnnouncementRequest = Partial<
  Pick<Announcement, "title" | "content" | "pinned">
>;

export type CreateDiscussionRequest = Pick<
  Discussion,
  "title" | "content" | "author" | "authorAvatar" | "authorId" | "authorRole"
>;

export type UpdateDiscussionRequest = Partial<
  Pick<Discussion, "title" | "content">
>;

export type CreateDiscussionCommentRequest = Omit<
  DiscussionComment,
  "id" | "createdAt"
>;

export type AddStudentToCourseRequest = {
  studentId: string;
};

export type CourseStudentsResponse = Student[];

export type CoursesListResponse = Course[];
export type AssignmentsListResponse = Assignment[];
export type AnnouncementsListResponse = Announcement[];
export type DiscussionsListResponse = Discussion[];
export type NotificationsListResponse = Notification[];
export type SubmissionsListResponse = SubmissionRecord[];
