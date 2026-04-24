import { api } from "@/lib/apiClient";
import {
  ANNOUNCEMENTS,
  ASSIGNMENTS,
  AUTH,
  COURSES,
  DISCUSSIONS,
  NOTIFICATIONS,
  SUBMISSIONS,
  buildPath,
} from "@/lib/apiEndpoints";
import { appConfig, assertApiConfigured } from "@/lib/config/env";
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
import * as mockRepository from "./mockRepository";

export type CreateCourseInput = {
  name: string;
  code: string;
  instructor: string;
};

export type UpdateCourseInput = Partial<
  Pick<Course, "name" | "code" | "instructor">
>;

export type CreateAnnouncementInput = Pick<
  Announcement,
  "title" | "content" | "author" | "pinned"
>;

export type UpdateAnnouncementInput = Partial<
  Pick<Announcement, "title" | "content" | "pinned">
>;

export type CreateDiscussionInput = Pick<
  Discussion,
  "title" | "content" | "author" | "authorAvatar" | "authorId" | "authorRole"
>;

export type UpdateDiscussionInput = Partial<
  Pick<Discussion, "title" | "content">
>;

export type CreateDiscussionCommentInput = Omit<
  DiscussionComment,
  "id" | "createdAt"
>;

async function withDataSource<T>(
  apiLoader: () => Promise<T>,
  mockLoader: () => Promise<T>
): Promise<T> {
  if (appConfig.dataSource === "api") {
    assertApiConfigured();
    return apiLoader();
  }

  return mockLoader();
}

export function listCourses(): Promise<Course[]> {
  return withDataSource(
    () => api.get<Course[]>(COURSES.LIST),
    () => mockRepository.listCourses()
  );
}

export function getCourseById(id: string): Promise<Course | null> {
  return withDataSource(
    () => api.get<Course>(buildPath(COURSES.DETAIL, { courseId: id })),
    () => mockRepository.getCourseById(id)
  );
}

export function createCourse(input: CreateCourseInput): Promise<Course> {
  return withDataSource(
    () => api.post<Course>(COURSES.CREATE, input),
    () => mockRepository.createCourse(input)
  );
}

export function updateCourse(
  courseId: string,
  input: UpdateCourseInput
): Promise<Course | null> {
  return withDataSource(
    () => api.put<Course>(buildPath(COURSES.UPDATE, { courseId }), input),
    () => mockRepository.updateCourse(courseId, input)
  );
}

export function listAssignments(courseId?: string): Promise<Assignment[]> {
  if (!courseId) {
    return withDataSource(
      async () => {
        const courses = await listCourses();
        const assignments = await Promise.all(
          courses.map((course) =>
            api.get<Assignment[]>(
              buildPath(ASSIGNMENTS.LIST, { courseId: course.id })
            )
          )
        );
        return assignments.flat();
      },
      () => mockRepository.listAssignments()
    );
  }

  return withDataSource(
    () => api.get<Assignment[]>(buildPath(ASSIGNMENTS.LIST, { courseId })),
    () => mockRepository.listAssignments(courseId)
  );
}

export function getAssignmentById(
  courseId: string,
  assignmentId: string
): Promise<Assignment | null> {
  return withDataSource(
    () =>
      api.get<Assignment>(
        buildPath(ASSIGNMENTS.DETAIL, { courseId, assignmentId })
      ),
    () => mockRepository.getAssignmentById(assignmentId)
  );
}

export function deleteAssignment(
  courseId: string,
  assignmentId: string
): Promise<boolean> {
  return withDataSource(
    () =>
      api.delete<void>(
        buildPath(ASSIGNMENTS.DELETE, { courseId, assignmentId })
      ).then(() => true),
    () => mockRepository.deleteAssignment(courseId, assignmentId)
  );
}

export function listAnnouncements(courseId?: string): Promise<Announcement[]> {
  if (!courseId) {
    return withDataSource(
      async () => {
        const courses = await listCourses();
        const announcements = await Promise.all(
          courses.map((course) =>
            api.get<Announcement[]>(
              buildPath(ANNOUNCEMENTS.LIST, { courseId: course.id })
            )
          )
        );
        return announcements.flat();
      },
      () => mockRepository.listAnnouncements()
    );
  }

  return withDataSource(
    () => api.get<Announcement[]>(buildPath(ANNOUNCEMENTS.LIST, { courseId })),
    () => mockRepository.listAnnouncements(courseId)
  );
}

export function createAnnouncement(
  courseId: string,
  input: CreateAnnouncementInput
): Promise<Announcement> {
  return withDataSource(
    () =>
      api.post<Announcement>(buildPath(ANNOUNCEMENTS.CREATE, { courseId }), input),
    () => mockRepository.createAnnouncement(courseId, input)
  );
}

export function updateAnnouncement(
  courseId: string,
  announcementId: string,
  input: UpdateAnnouncementInput
): Promise<Announcement | null> {
  return withDataSource(
    () =>
      api.put<Announcement>(
        buildPath(ANNOUNCEMENTS.UPDATE, { courseId, announcementId }),
        input
      ),
    () => mockRepository.updateAnnouncement(courseId, announcementId, input)
  );
}

export function listNotifications(): Promise<Notification[]> {
  return withDataSource(
    () => api.get<Notification[]>(NOTIFICATIONS.LIST),
    () => mockRepository.listNotifications()
  );
}

export function listDiscussions(courseId?: string): Promise<Discussion[]> {
  return withDataSource(
    async () => {
      if (!courseId) return [];
      return api.get<Discussion[]>(buildPath(DISCUSSIONS.LIST, { courseId }));
    },
    () => mockRepository.listDiscussions(courseId)
  );
}

export function createDiscussion(
  courseId: string,
  input: CreateDiscussionInput
): Promise<Discussion> {
  return withDataSource(
    () => api.post<Discussion>(buildPath(DISCUSSIONS.CREATE, { courseId }), input),
    () => mockRepository.createDiscussion(courseId, input)
  );
}

export function updateDiscussion(
  courseId: string,
  discussionId: string,
  input: UpdateDiscussionInput
): Promise<Discussion | null> {
  return withDataSource(
    () =>
      api.put<Discussion>(
        buildPath(DISCUSSIONS.UPDATE, { courseId, discussionId }),
        input
      ),
    () => mockRepository.updateDiscussion(courseId, discussionId, input)
  );
}

export function deleteDiscussion(
  courseId: string,
  discussionId: string
): Promise<boolean> {
  return withDataSource(
    () =>
      api.delete<void>(
        buildPath(DISCUSSIONS.DELETE, { courseId, discussionId })
      ).then(() => true),
    () => mockRepository.deleteDiscussion(courseId, discussionId)
  );
}

export function addDiscussionComment(
  courseId: string,
  discussionId: string,
  input: CreateDiscussionCommentInput
): Promise<Discussion | null> {
  return withDataSource(
    () =>
      api.post<Discussion>(
        buildPath(DISCUSSIONS.REPLY, { courseId, discussionId }),
        input
      ),
    () => mockRepository.addDiscussionComment(courseId, discussionId, input)
  );
}

export function toggleDiscussionLike(
  courseId: string,
  discussionId: string,
  userId: string
): Promise<Discussion | null> {
  return withDataSource(
    () =>
      api.post<Discussion>(
        buildPath(DISCUSSIONS.LIKE, { courseId, discussionId }),
        { userId }
      ),
    () => mockRepository.toggleDiscussionLike(courseId, discussionId, userId)
  );
}

export function listStudents(): Promise<Student[]> {
  return withDataSource(
    async () => [],
    () => mockRepository.listStudents()
  );
}

export function listCourseStudents(courseId: string): Promise<Student[]> {
  return withDataSource(
    () => api.get<Student[]>(buildPath(COURSES.STUDENTS, { courseId })),
    () => mockRepository.listCourseStudents(courseId)
  );
}

export function addStudentToCourse(
  courseId: string,
  studentId: string
): Promise<Student[]> {
  return withDataSource(
    () =>
      api.post<Student[]>(buildPath(COURSES.ADD_STUDENT, { courseId }), {
        studentId,
      }),
    () => mockRepository.addStudentToCourse(courseId, studentId)
  );
}

export function removeStudentFromCourse(
  courseId: string,
  studentId: string
): Promise<Student[]> {
  return withDataSource(
    () =>
      api.delete<Student[]>(
        buildPath(COURSES.REMOVE_STUDENT, { courseId, studentId })
      ),
    () => mockRepository.removeStudentFromCourse(courseId, studentId)
  );
}

export function listSubmissions(input?: {
  courseId?: string;
  assignmentId?: string;
}): Promise<SubmissionRecord[]> {
  return withDataSource(
    async () => {
      if (!input?.courseId || !input.assignmentId) return [];
      return api.get<SubmissionRecord[]>(
        buildPath(SUBMISSIONS.LIST, {
          courseId: input.courseId,
          assignmentId: input.assignmentId,
        })
      );
    },
    () => mockRepository.listSubmissions(input?.assignmentId)
  );
}

export function getCurrentUser(): Promise<CurrentUser> {
  return withDataSource(
    () => api.get<CurrentUser>(AUTH.ME),
    () => mockRepository.getCurrentUser()
  );
}
