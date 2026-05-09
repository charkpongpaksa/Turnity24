import { ApiError, api } from "@/lib/apiClient";
import {
  ANALYTICS,
  ANNOUNCEMENTS,
  ASSIGNMENTS,
  AUTH,
  COURSES,
  DISCUSSIONS,
  FILES,
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
  CreateAssignmentRequest,
  CreateCourseRequest,
  CreateDiscussionCommentRequest,
  CreateDiscussionRequest,
  DiscussionsListResponse,
  NotificationsListResponse,
  SubmissionsListResponse,
  UpdateAnnouncementRequest,
  UpdateAssignmentRequest,
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

const API_SUBMISSION_CACHE_KEY = "turnity_api_submission_cache";

function loadCachedSubmissions(): SubmissionRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(API_SUBMISSION_CACHE_KEY);
    return raw ? JSON.parse(raw) as SubmissionRecord[] : [];
  } catch {
    localStorage.removeItem(API_SUBMISSION_CACHE_KEY);
    return [];
  }
}

function cacheSubmission(submission: SubmissionRecord): void {
  if (typeof window === "undefined") return;

  const next = [
    submission,
    ...loadCachedSubmissions().filter(
      (item) =>
        !(item.assignmentId === submission.assignmentId && item.studentId === submission.studentId)
    ),
  ].slice(0, 50);
  localStorage.setItem(API_SUBMISSION_CACHE_KEY, JSON.stringify(next));
}

function mergeSubmissionRecords(
  assignment: Assignment,
  submissions: SubmissionRecord[]
): Assignment {
  if (submissions.length === 0) return assignment;

  const latestSubmission = submissions
    .filter((submission) => submission.submittedAt)
    .sort(
      (a, b) =>
        new Date(b.submittedAt ?? 0).getTime() -
        new Date(a.submittedAt ?? 0).getTime()
    )[0];

  return {
    ...assignment,
    status: latestSubmission?.status ?? assignment.status,
    submissions: submissions
      .filter((submission) => submission.submittedAt)
      .map((submission) => {
        const displayFileName =
          submission.fileName ??
          (submission.fileUrl ? submission.fileUrl.split("/").pop() : undefined);

        return {
          submittedAt: submission.submittedAt ?? new Date().toISOString(),
          files: displayFileName ? [displayFileName] : [],
          fileUrl: submission.fileUrl ?? null,
          fileName: displayFileName ?? null,
          text: submission.text ?? "",
          feedback: submission.feedback || "Pending review",
          score: submission.score,
        };
      }),
  };
}

function mergeCachedSubmissions(assignments: Assignment[]): Assignment[] {
  const cachedSubmissions = loadCachedSubmissions();
  if (cachedSubmissions.length === 0) return assignments;

  return assignments.map((assignment) =>
    mergeSubmissionRecords(
      assignment,
      cachedSubmissions.filter(
        (submission) => submission.assignmentId === assignment.id
      )
    )
  );
}

async function mergeApiSubmissions(assignments: Assignment[]): Promise<Assignment[]> {
  const session = authSessionStore.get();
  if (assignments.length === 0 || session?.activeRole !== "student") {
    return mergeCachedSubmissions(assignments);
  }

  const merged = await Promise.all(
    assignments.map(async (assignment) => {
      let submissions: SubmissionsListResponse = [];

      try {
        submissions = await api.get<SubmissionsListResponse>(
          buildPath(SUBMISSIONS.LIST, {
            courseId: assignment.courseId,
            assignmentId: assignment.id,
          })
        );
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 403)) {
          throw error;
        }
      }

      const cachedSubmissions = loadCachedSubmissions().filter(
        (submission) => submission.assignmentId === assignment.id
      );
      return mergeSubmissionRecords(assignment, [
        ...cachedSubmissions,
        ...submissions,
      ]);
    })
  );

  return merged;
}

async function getAssignmentWithSubmissions(
  courseId: string,
  assignmentId: string
): Promise<Assignment> {
  const assignment = await api.get<Assignment>(
    buildPath(ASSIGNMENTS.DETAIL, { courseId, assignmentId })
  );
  let submissions: SubmissionsListResponse = [];

  try {
    submissions = await api.get<SubmissionsListResponse>(
      buildPath(SUBMISSIONS.LIST, { courseId, assignmentId })
    );
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 403)) {
      throw error;
    }
  }

  const cachedSubmissions = loadCachedSubmissions().filter(
    (submission) => submission.assignmentId === assignmentId
  );

  return mergeSubmissionRecords(assignment, [...cachedSubmissions, ...submissions]);
}

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

export function deleteCourse(courseId: string): Promise<boolean> {
  return withDataSource(
    () => api.delete<void>(buildPath(COURSES.DELETE, { courseId })).then(() => true),
    () => mockRepository.deleteCourse(courseId)
  );
}

export function enrollInCourse(courseId: string): Promise<boolean> {
  return withDataSource(
    () => api.post<void>(buildPath(COURSES.ENROLL, { courseId }), {}).then(() => true),
    () => mockRepository.enrollInCourse(courseId)
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
        return mergeApiSubmissions(assignments.flat());
      },
      () => mockRepository.listAssignments()
    );
  }

  return withDataSource(
    async () =>
      mergeApiSubmissions(
        await api.get<AssignmentsListResponse>(
          buildPath(ASSIGNMENTS.LIST, { courseId })
        )
      ),
    () => mockRepository.listAssignments(courseId)
  );
}

export function getAssignmentById(
  courseId: string,
  assignmentId: string
): Promise<Assignment | null> {
  return withDataSource(
    () => getAssignmentWithSubmissions(courseId, assignmentId),
    () => mockRepository.getAssignmentById(assignmentId)
  );
}

export function createAssignment(
  courseId: string,
  input: CreateAssignmentRequest
): Promise<Assignment> {
  return withDataSource(
    () => api.post<Assignment>(buildPath(ASSIGNMENTS.CREATE, { courseId }), input),
    () => mockRepository.createAssignment(courseId, input)
  );
}

export function updateAssignment(
  courseId: string,
  assignmentId: string,
  input: UpdateAssignmentRequest
): Promise<Assignment | null> {
  return withDataSource(
    () =>
      api.put<Assignment>(
        buildPath(ASSIGNMENTS.UPDATE, { courseId, assignmentId }),
        input
      ),
    () => mockRepository.updateAssignment(courseId, assignmentId, input)
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

export function deleteAnnouncement(
  courseId: string,
  announcementId: string
): Promise<boolean> {
  return withDataSource(
    () =>
      api.delete<void>(
        buildPath(ANNOUNCEMENTS.DELETE, { courseId, announcementId })
      ).then(() => true),
    () => mockRepository.deleteAnnouncement(courseId, announcementId)
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

export function markNotificationRead(
  notificationId: string
): Promise<Notification | null> {
  return withDataSource(
    async () => {
      await api.put<void>(buildPath(NOTIFICATIONS.MARK_READ, { notificationId }));
      const notifications = await listNotifications();
      return notifications.find((notification) => notification.id === notificationId) ?? null;
    },
    () => mockRepository.markNotificationRead(notificationId)
  );
}

export function markAllNotificationsRead(): Promise<Notification[]> {
  return withDataSource(
    async () => {
      await api.put<void>(NOTIFICATIONS.MARK_ALL);
      return listNotifications();
    },
    () => mockRepository.markAllNotificationsRead()
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

export function getDiscussionDetail(
  courseId: string,
  discussionId: string
): Promise<Discussion | null> {
  return withDataSource(
    () => api.get<Discussion>(buildPath(DISCUSSIONS.DETAIL, { courseId, discussionId })),
    () => mockRepository.getDiscussionDetail(courseId, discussionId)
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

export function gradeSubmission(
  courseId: string,
  assignmentId: string,
  submissionId: string,
  score: number,
  feedback = ""
): Promise<SubmissionRecord | null> {
  return withDataSource(
    () =>
      api.put<SubmissionRecord>(
        buildPath(SUBMISSIONS.GRADE, { courseId, assignmentId, submissionId }),
        { score, feedback }
      ),
    () => mockRepository.gradeSubmission(assignmentId, submissionId, score)
  );
}

export function requestPresignedUpload(
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
  return withDataSource(
    () =>
      api.post<{ uploadUrl: string; fileKey: string; publicUrl: string }>(
        FILES.PRESIGNED_UPLOAD,
        { fileName, contentType }
      ),
    async () => ({
      uploadUrl: "",
      fileKey: `mock/${Date.now()}-${fileName}`,
      publicUrl: "",
    })
  );
}

export function requestPresignedDownload(
  fileKey: string
): Promise<{ downloadUrl: string }> {
  return withDataSource(
    () => api.post<{ downloadUrl: string }>(FILES.PRESIGNED_DOWNLOAD, { fileKey }),
    async () => ({ downloadUrl: fileKey })
  );
}

export function deleteFile(fileKey: string): Promise<boolean> {
  return withDataSource(
    () => api.delete<void>(buildPath(FILES.DELETE, { fileKey })).then(() => true),
    async () => true
  );
}

export function createSubmission(
  courseId: string,
  assignmentId: string,
  input: { text?: string; fileUrl?: string; fileName?: string }
): Promise<SubmissionRecord> {
  return withDataSource(
    async () => {
      const submission = await api.post<SubmissionRecord>(
        buildPath(SUBMISSIONS.CREATE, { courseId, assignmentId }),
        input
      );
      cacheSubmission(submission);
      return submission;
    },
    () => mockRepository.createSubmission(assignmentId, input)
  );
}

export function getCurrentUser(): Promise<CurrentUser> {
  return withDataSource(
    () => api.get<CurrentUser>(AUTH.ME),
    () => mockRepository.getCurrentUser()
  );
}

export function getProfile(): Promise<CurrentUser> {
  return withDataSource(
    () => api.get<CurrentUser>(USERS.PROFILE),
    () => mockRepository.getProfile()
  );
}

export function updateProfile(input: Partial<CurrentUser>): Promise<CurrentUser> {
  return withDataSource(
    () => api.put<CurrentUser>(USERS.PROFILE, input),
    () => mockRepository.updateProfile(input)
  );
}

export function uploadAvatar(
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; fileKey: string; avatarUrl: string }> {
  return withDataSource(
    () => api.post(USERS.PROFILE_AVATAR, { fileName, contentType }),
    async () => ({
      uploadUrl: "",
      fileKey: "mock-avatar-key",
      avatarUrl: "https://via.placeholder.com/150",
    })
  );
}

export function getCourseAnalytics(courseId: string): Promise<any> {
  return withDataSource(
    () => api.get(buildPath(ANALYTICS.COURSE, { courseId })),
    () => mockRepository.getCourseAnalytics(courseId)
  );
}

export function getAssignmentAnalytics(
  courseId: string,
  assignmentId: string
): Promise<any> {
  return withDataSource(
    () => api.get(buildPath(ANALYTICS.ASSIGNMENT, { courseId, assignmentId })),
    () => mockRepository.getAssignmentAnalytics(courseId, assignmentId)
  );
}

