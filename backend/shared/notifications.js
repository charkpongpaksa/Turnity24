import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({});
const topicArn = process.env.NOTIFICATIONS_TOPIC_ARN;

function compact(value, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

async function publishNotification(subject, message) {
  if (!topicArn) {
    return { skipped: true, reason: "NOTIFICATIONS_TOPIC_ARN is not configured" };
  }

  const response = await sns.send(
    new PublishCommand({
      TopicArn: topicArn,
      Subject: subject.slice(0, 100),
      Message: message,
    }),
  );

  return { skipped: false, messageId: response.MessageId };
}

export async function notifyAssignmentCreated(course, assignment) {
  const courseName = compact(course?.name || assignment.courseId);
  const subject = `New assignment: ${compact(assignment.title)}`;
  const message = [
    "New assignment has been posted.",
    "",
    `Course: ${courseName}`,
    `Assignment: ${compact(assignment.title)}`,
    `Description: ${compact(assignment.description)}`,
    `Due date: ${compact(assignment.dueDate)}`,
    "",
    "Please review the assignment and submit it before the deadline.",
  ].join("\n");

  return publishNotification(subject, message);
}

export async function notifyAnnouncementCreated(course, announcement) {
  const courseName = compact(course?.name || announcement.courseId);
  const subject = `Course announcement: ${compact(announcement.title)}`;
  const message = [
    "A new course announcement has been posted.",
    "",
    `Course: ${courseName}`,
    `Title: ${compact(announcement.title)}`,
    `Author: ${compact(announcement.author)}`,
    "",
    compact(announcement.content),
  ].join("\n");

  return publishNotification(subject, message);
}

export async function notifyAssignmentDeadline(course, assignment, hoursLeft) {
  const courseName = compact(course?.name || assignment.courseId);
  const roundedHours = Math.max(0, Math.ceil(hoursLeft));
  const subject = `Deadline reminder: ${compact(assignment.title)}`;
  const message = [
    "Assignment deadline reminder.",
    "",
    `Course: ${courseName}`,
    `Assignment: ${compact(assignment.title)}`,
    `Due date: ${compact(assignment.dueDate)}`,
    `Time left: about ${roundedHours} hour(s)`,
    "",
    "Please submit your work before the deadline.",
  ].join("\n");

  return publishNotification(subject, message);
}
