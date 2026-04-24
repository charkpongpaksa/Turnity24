import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadMockRepository() {
  vi.resetModules();
  return import("./mockRepository");
}

describe("mockRepository", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates and updates courses", async () => {
    const repository = await loadMockRepository();

    const created = await repository.createCourse({
      name: "Cloud Systems Design",
      code: "CS440",
      instructor: "Lecturer Demo",
    });

    expect(created.name).toBe("Cloud Systems Design");

    const updated = await repository.updateCourse(created.id, {
      name: "Cloud Systems Design Lab",
    });

    expect(updated?.name).toBe("Cloud Systems Design Lab");

    const courses = await repository.listCourses();
    expect(courses.some((course) => course.id === created.id)).toBe(true);
  });

  it("adds and removes students from a course while syncing the count", async () => {
    const repository = await loadMockRepository();

    const beforeStudents = await repository.listCourseStudents("1");
    const addedStudents = await repository.addStudentToCourse("1", "5");

    expect(addedStudents).toHaveLength(beforeStudents.length + 1);
    expect(addedStudents.some((student) => student.id === "5")).toBe(true);

    const courseAfterAdd = await repository.getCourseById("1");
    expect(courseAfterAdd?.students).toBe(addedStudents.length);

    const removedStudents = await repository.removeStudentFromCourse("1", "5");
    expect(removedStudents).toHaveLength(beforeStudents.length);

    const courseAfterRemove = await repository.getCourseById("1");
    expect(courseAfterRemove?.students).toBe(removedStudents.length);
  });

  it("updates announcements", async () => {
    const repository = await loadMockRepository();
    const [announcement] = await repository.listAnnouncements("1");

    const updated = await repository.updateAnnouncement("1", announcement.id, {
      title: "Updated announcement",
      pinned: !announcement.pinned,
    });

    expect(updated?.title).toBe("Updated announcement");
    expect(updated?.pinned).toBe(!announcement.pinned);
  });

  it("supports discussion create, comment, like, update, and delete flows", async () => {
    const repository = await loadMockRepository();

    const created = await repository.createDiscussion("1", {
      title: "Need help with deployment",
      content: "Which AWS service should trigger reminders?",
      author: "Student Demo",
      authorAvatar: "https://example.com/avatar.png",
      authorId: "student-1",
      authorRole: "student",
    });

    const commented = await repository.addDiscussionComment("1", created.id, {
      authorId: "instructor-1",
      authorName: "Lecturer Demo",
      authorRole: "instructor",
      content: "Start with EventBridge Scheduler.",
    });
    expect(commented?.comments).toHaveLength(1);
    expect(commented?.replies).toBe(1);

    const liked = await repository.toggleDiscussionLike("1", created.id, "student-2");
    expect(liked?.likes).toBe(1);
    expect(liked?.likedBy).toEqual(["student-2"]);

    const updated = await repository.updateDiscussion("1", created.id, {
      content: "Which AWS service should trigger deadline reminders?",
    });
    expect(updated?.content).toContain("deadline reminders");

    const deleted = await repository.deleteDiscussion("1", created.id);
    expect(deleted).toBe(true);

    const discussions = await repository.listDiscussions("1");
    expect(discussions.some((discussion) => discussion.id === created.id)).toBe(false);
  });
});
