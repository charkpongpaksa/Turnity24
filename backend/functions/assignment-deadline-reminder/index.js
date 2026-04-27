import {
  getCourseById,
  listAssignmentsDueForReminder,
  markAssignmentDeadlineReminderSent,
} from "../../shared/dynamo.js";
import { notifyAssignmentDeadline } from "../../shared/notifications.js";

function hoursUntil(dueDate, now) {
  return (new Date(dueDate).getTime() - now.getTime()) / (60 * 60 * 1000);
}

export async function handler() {
  const now = new Date();
  const assignments = await listAssignmentsDueForReminder(now, 24);
  const results = [];

  for (const assignment of assignments) {
    try {
      const course = await getCourseById(assignment.courseId);
      const notification = await notifyAssignmentDeadline(course, assignment, hoursUntil(assignment.dueDate, now));
      await markAssignmentDeadlineReminderSent(assignment.courseId, assignment.id, now.toISOString());

      results.push({
        assignmentId: assignment.id,
        courseId: assignment.courseId,
        notification,
      });
    } catch (error) {
      results.push({
        assignmentId: assignment.id,
        courseId: assignment.courseId,
        error: error instanceof Error ? error.message : "Failed to send deadline reminder",
      });
    }
  }

  return {
    checkedAt: now.toISOString(),
    matched: assignments.length,
    results,
  };
}
