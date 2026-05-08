import { mockCourses, mockCourseStudents, mockStudents } from "./mock-data.js";

let courseState = structuredClone(mockCourses);
const courseStudentsState = structuredClone(mockCourseStudents);

function clone(value) {
  return structuredClone(value);
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listCourses() {
  return clone(courseState);
}

export function getCourseById(courseId) {
  return clone(courseState.find((course) => course.id === courseId) ?? null);
}

export function createCourse(input) {
  const created = {
    id: createId("course"),
    name: input.name,
    code: input.code,
    instructor: input.instructor,
    progress: 0,
    color: "bg-slate-600",
    students: 0,
    nextDeadline: new Date().toISOString().slice(0, 10),
  };

  courseState = [created, ...courseState];
  courseStudentsState[created.id] = [];
  return clone(created);
}

export function listCourseStudents(courseId) {
  const studentIds = courseStudentsState[courseId] ?? [];
  return clone(mockStudents.filter((student) => studentIds.includes(student.id)));
}

export function addStudentToCourse(courseId, studentId) {
  const current = courseStudentsState[courseId] ?? [];
  if (!current.includes(studentId)) {
    courseStudentsState[courseId] = [...current, studentId];
    syncStudentCount(courseId);
  }
  return listCourseStudents(courseId);
}

export function removeStudentFromCourse(courseId, studentId) {
  const current = courseStudentsState[courseId] ?? [];
  courseStudentsState[courseId] = current.filter((id) => id !== studentId);
  syncStudentCount(courseId);
  return listCourseStudents(courseId);
}

function syncStudentCount(courseId) {
  const studentCount = (courseStudentsState[courseId] ?? []).length;
  courseState = courseState.map((course) =>
    course.id === courseId ? { ...course, students: studentCount } : course
  );
}
