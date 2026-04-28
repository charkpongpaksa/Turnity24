import { api } from "@/lib/apiClient";
import {
  ANNOUNCEMENTS,
  ASSIGNMENTS,
  AUTH,
  COURSES,
  DISCUSSIONS,
  NOTIFICATIONS,
  SUBMISSIONS,
  USERS,
  buildPath,
} from "@/lib/apiEndpoints";
import { authSessionStore } from "@/features/auth/auth.storage";
import { appConfig, assertApiConfigured } from "@/lib/config/env";
import type {
  AddStudentToCourseRequest,
  AnnouncementsListResponse,
  AssignmentsListResponse,
  CourseStudentsResponse,
  CoursesListResponse,
  CreateAnnouncementRequest,
  CreateCourseRequest,
  CreateDiscussionCommentRequest,
  CreateDiscussionRequest,
  DiscussionsListResponse,
  NotificationsListResponse,
  SubmissionsListResponse,
  UpdateAnnouncementRequest,
  UpdateCourseRequest,
  UpdateDiscussionRequest,
} from "@/lib/contracts/api";
import type {
  Announcement,
  Assignment,
  Course,
  CurrentUser,
  Discussion,
  Notification,
  Student,
  SubmissionRecord,
} from "@/lib/types/models";
import * as mockRepository from "./mockRepository";

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
    () => {
      const session = authSessionStore.get();
      const role = session?.activeRole;
      const userId = session?.user?.id;
      const params = role === "student" && userId
        ? `?role=student&userId=${encodeURIComponent(userId)}`
        : "";
      return api.get<CoursesListResponse>(`${COURSES.LIST}${params}`);
    },
    () => mockRepository.listCourses()
  );
}

export function getCourseById(id: string): Promise<Course | null> {
  return withDataSource(
    () => api.get<Course>(buildPath(COURSES.DETAIL, { courseId: id })),
    () => mockRepository.getCourseById(id)
  );
}

export function createCourse(input: CreateCourseRequest): Promise<Course> {
  return withDataSource(
    () => api.post<Course>(COURSES.CREATE, input),
    () => mockRepository.createCourse(input)
  );
}

export function updateCourse(
  courseId: string,
  input: UpdateCourseRequest
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
            api.get<AssignmentsListResponse>(
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
    () => api.get<AssignmentsListResponse>(buildPath(ASSIGNMENTS.LIST, { courseId })),
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
            api.get<AnnouncementsListResponse>(
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
    () => api.get<AnnouncementsListResponse>(buildPath(ANNOUNCEMENTS.LIST, { courseId })),
    () => mockRepository.listAnnouncements(courseId)
  );
}

export function createAnnouncement(
  courseId: string,
  input: CreateAnnouncementRequest
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
  input: UpdateAnnouncementRequest
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
    () => {
      const session = authSessionStore.get();
      const userId = session?.user.id;
      const query = userId ? `?studentId=${encodeURIComponent(userId)}` : "";
      return api.get<NotificationsListResponse>(`${NOTIFICATIONS.LIST}${query}`);
    },
    () => mockRepository.listNotifications()
  );
}

export function listDiscussions(courseId?: string): Promise<Discussion[]> {
  return withDataSource(
    async () => {
      if (!courseId) return [];
      return api.get<DiscussionsListResponse>(buildPath(DISCUSSIONS.LIST, { courseId }));
    },
    () => mockRepository.listDiscussions(courseId)
  );
}

export function createDiscussion(
  courseId: string,
  input: CreateDiscussionRequest
): Promise<Discussion> {
  return withDataSource(
    () => api.post<Discussion>(buildPath(DISCUSSIONS.CREATE, { courseId }), input),
    () => mockRepository.createDiscussion(courseId, input)
  );
}

export function updateDiscussion(
  courseId: string,
  discussionId: string,
  input: UpdateDiscussionRequest
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
  input: CreateDiscussionCommentRequest
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
    () => api.get<Student[]>(USERS.STUDENTS),
    () => mockRepository.listStudents()
  );
}

export function listCourseStudents(courseId: string): Promise<Student[]> {
  return withDataSource(
    () => api.get<CourseStudentsResponse>(buildPath(COURSES.STUDENTS, { courseId })),
    () => mockRepository.listCourseStudents(courseId)
  );
}

export function addStudentToCourse(
  courseId: string,
  studentId: string
): Promise<Student[]> {
  return withDataSource(
    () =>
      api.post<CourseStudentsResponse>(buildPath(COURSES.ADD_STUDENT, { courseId }), {
        studentId,
      } satisfies AddStudentToCourseRequest),
    () => mockRepository.addStudentToCourse(courseId, studentId)
  );
}

export function removeStudentFromCourse(
  courseId: string,
  studentId: string
): Promise<Student[]> {
  return withDataSource(
    () =>
      api.delete<CourseStudentsResponse>(
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
      return api.get<SubmissionsListResponse>(
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
