import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const baseClient = new DynamoDBClient({});
const client = DynamoDBDocumentClient.from(baseClient);
const tableName = process.env.DDB_TABLE_NAME || "TurnityTable";

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Course operations
export async function listCourses() {
  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: "SK = :sk",
    ExpressionAttributeValues: {
      ":sk": "META#course",
    },
  });

  const response = await client.send(command);
  return (response.Items || []).map((item) => ({
    id: item.PK.replace("COURSE#", ""),
    name: item.name,
    code: item.code,
    instructor: item.instructor,
    progress: item.progress || 0,
    color: item.color || "bg-slate-600",
    students: item.students || 0,
    nextDeadline: item.nextDeadline,
  }));
}

export async function listCoursesByStudent(studentId) {
  const enrollmentQuery = new QueryCommand({
    TableName: tableName,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `STUDENT#${studentId}`,
      ":sk": "COURSE#",
    },
  });

  const enrollments = await client.send(enrollmentQuery);
  if (!enrollments.Items || enrollments.Items.length === 0) return [];

  const courseIds = enrollments.Items.map((item) => item.GSI1SK.replace("COURSE#", ""));
  const courses = await Promise.all(courseIds.map((id) => getCourseById(id)));
  return courses.filter(Boolean);
}

export async function getCourseById(courseId) {
  const command = new GetCommand({
    TableName: tableName,
    Key: {
      PK: `COURSE#${courseId}`,
      SK: `META#course`,
    },
  });

  const response = await client.send(command);
  if (!response.Item) return null;

  const item = response.Item;
  return {
    id: courseId,
    name: item.name,
    code: item.code,
    instructor: item.instructor,
    progress: item.progress || 0,
    color: item.color || "bg-slate-600",
    students: item.students || 0,
    nextDeadline: item.nextDeadline,
  };
}

export async function createCourse(input) {
  const courseId = createId("course");
  const now = new Date().toISOString();

  const item = {
    PK: `COURSE#${courseId}`,
    SK: `META#course`,
    GSI1PK: `COURSE#${courseId}`,
    GSI1SK: `META#course`,
    id: courseId,
    name: input.name,
    code: input.code,
    instructor: input.instructor,
    progress: 0,
    color: "bg-slate-600",
    students: 0,
    nextDeadline: new Date().toISOString().slice(0, 10),
    createdAt: now,
    updatedAt: now,
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });

  await client.send(command);
  return {
    id: courseId,
    name: input.name,
    code: input.code,
    instructor: input.instructor,
    progress: 0,
    color: "bg-slate-600",
    students: 0,
    nextDeadline: item.nextDeadline,
  };
}

// Enrollment operations
export async function listCourseStudents(courseId) {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `COURSE#${courseId}`,
      ":sk": "STUDENT#",
    },
  });

  const response = await client.send(command);
  return (response.Items || []).map((item) => ({
    id: item.studentId,
    name: item.name,
    email: item.email,
    role: item.role || "student",
  }));
}

export async function addStudentToCourse(courseId, studentId) {
  const studentData = {
    name: `Student ${studentId}`,
    email: `${studentId}@tu.ac.th`,
    role: "student",
  };

  const item = {
    PK: `COURSE#${courseId}`,
    SK: `STUDENT#${studentId}`,
    GSI1PK: `STUDENT#${studentId}`,
    GSI1SK: `COURSE#${courseId}`,
    studentId,
    name: studentData.name,
    email: studentData.email,
    role: studentData.role,
    joinedAt: new Date().toISOString(),
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });

  await client.send(command);

  // Update student count in course
  await updateStudentCount(courseId);

  return listCourseStudents(courseId);
}

export async function removeStudentFromCourse(courseId, studentId) {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: {
      PK: `COURSE#${courseId}`,
      SK: `STUDENT#${studentId}`,
    },
  });

  await client.send(command);

  // Update student count
  await updateStudentCount(courseId);

  return listCourseStudents(courseId);
}

async function updateStudentCount(courseId) {
  const students = await listCourseStudents(courseId);
  const count = students.length;

  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      PK: `COURSE#${courseId}`,
      SK: `META#course`,
    },
    UpdateExpression: "SET students = :count, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":count": count,
      ":updatedAt": new Date().toISOString(),
    },
  });

  await client.send(command);
}

// Announcement operations
export async function listAnnouncements(courseId) {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `COURSE#${courseId}`,
      ":sk": "ANN#",
    },
  });

  const response = await client.send(command);
  return (response.Items || []).map((item) => ({
    id: item.SK.replace("ANN#", ""),
    courseId: item.PK.replace("COURSE#", ""),
    title: item.title,
    content: item.content,
    author: item.author,
    timestamp: item.timestamp,
    pinned: item.pinned || false,
  }));
}

export async function createAnnouncement(courseId, input) {
  const announcementId = createId("ann");
  const now = new Date().toISOString();

  const item = {
    PK: `COURSE#${courseId}`,
    SK: `ANN#${announcementId}`,
    id: announcementId,
    courseId,
    title: input.title,
    content: input.content,
    author: input.author,
    timestamp: now,
    pinned: input.pinned || false,
    createdAt: now,
    updatedAt: now,
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });

  await client.send(command);
  return {
    id: announcementId,
    courseId,
    title: input.title,
    content: input.content,
    author: input.author,
    timestamp: now,
    pinned: input.pinned || false,
  };
}

// Assignment operations
export async function listAssignments(courseId) {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `COURSE#${courseId}`,
      ":sk": "ASS#",
    },
  });

  const response = await client.send(command);
  return (response.Items || []).map((item) => ({
    id: item.SK.replace("ASS#", ""),
    courseId: item.PK.replace("COURSE#", ""),
    title: item.title,
    description: item.description,
    points: item.points,
    type: item.type,
    dueDate: item.dueDate,
    status: item.status || "not_submitted",
  }));
}

export async function createAssignment(courseId, input) {
  const assignmentId = createId("ass");
  const now = new Date().toISOString();

  const item = {
    PK: `COURSE#${courseId}`,
    SK: `ASS#${assignmentId}`,
    id: assignmentId,
    courseId,
    title: input.title,
    description: input.description,
    points: input.points,
    type: input.type,
    dueDate: input.dueDate,
    status: "not_submitted",
    createdAt: now,
    updatedAt: now,
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });

  await client.send(command);
  return {
    id: assignmentId,
    courseId,
    title: input.title,
    description: input.description,
    points: input.points,
    type: input.type,
    dueDate: input.dueDate,
    status: "not_submitted",
  };
}