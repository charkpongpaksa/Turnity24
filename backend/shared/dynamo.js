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

// Submission operations
export async function createSubmission(assignmentId, studentId, input) {
  const now = new Date().toISOString();

  const item = {
    PK: `ASS#${assignmentId}`,
    SK: `SUBMISSION#${studentId}`,
    id: input.id || createId("submission"),
    assignmentId,
    studentId,
    text: input.text || "",
    fileUrl: input.fileUrl || null,
    fileName: input.fileName || null,
    score: input.score ?? null,
    feedback: input.feedback || "",
    status: input.status || "submitted",
    submittedAt: input.submittedAt || now,
    createdAt: now,
    updatedAt: now,
  };

  await client.send(new PutCommand({
    TableName: tableName,
    Item: item,
  }));

  return mapSubmission(item);
}

export async function listSubmissions(assignmentId) {
  const response = await client.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `ASS#${assignmentId}`,
      ":sk": "SUBMISSION#",
    },
  }));

  return (response.Items || []).map(mapSubmission);
}

export async function gradeSubmission(assignmentId, studentId, input) {
  const response = await client.send(new UpdateCommand({
    TableName: tableName,
    Key: {
      PK: `ASS#${assignmentId}`,
      SK: `SUBMISSION#${studentId}`,
    },
    UpdateExpression: "SET score = :score, feedback = :feedback, #status = :status, updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":score": input.score,
      ":feedback": input.feedback || "",
      ":status": "graded",
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW",
  }));

  return mapSubmission(response.Attributes);
}

function mapSubmission(item) {
  return {
    id: item.id,
    assignmentId: item.assignmentId || item.PK.replace("ASS#", ""),
    studentId: item.studentId || item.SK.replace("SUBMISSION#", ""),
    text: item.text || "",
    fileUrl: item.fileUrl || null,
    fileName: item.fileName || null,
    score: item.score ?? null,
    feedback: item.feedback || "",
    status: item.status || "submitted",
    submittedAt: item.submittedAt,
  };
}

// Discussion operations
export async function createDiscussion(courseId, input) {
  const discussionId = createId("discussion");
  const now = new Date().toISOString();

  const item = {
    PK: `COURSE#${courseId}`,
    SK: `DISC#${discussionId}`,
    id: discussionId,
    courseId,
    author: input.author,
    authorAvatar: input.authorAvatar || null,
    title: input.title,
    content: input.content,
    timestamp: input.timestamp || now,
    replies: 0,
    likes: 0,
    authorId: input.authorId,
    authorRole: input.authorRole || "student",
    likedBy: [],
    createdAt: now,
    updatedAt: now,
  };

  await client.send(new PutCommand({
    TableName: tableName,
    Item: item,
  }));

  return {
    ...mapDiscussion(item),
    comments: [],
  };
}

export async function listDiscussions(courseId) {
  const response = await client.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `COURSE#${courseId}`,
      ":sk": "DISC#",
    },
  }));

  return Promise.all((response.Items || []).map(async (item) => {
    const discussion = mapDiscussion(item);
    const comments = await listComments(discussion.id);

    return {
      ...discussion,
      replies: comments.length,
      comments,
    };
  }));
}

export async function updateDiscussion(courseId, discussionId, input) {
  const response = await client.send(new UpdateCommand({
    TableName: tableName,
    Key: {
      PK: `COURSE#${courseId}`,
      SK: `DISC#${discussionId}`,
    },
    UpdateExpression: "SET content = :content, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":content": input.content,
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW",
  }));

  const comments = await listComments(discussionId);
  return {
    ...mapDiscussion(response.Attributes),
    replies: comments.length,
    comments,
  };
}

export async function deleteDiscussion(courseId, discussionId) {
  await client.send(new DeleteCommand({
    TableName: tableName,
    Key: {
      PK: `COURSE#${courseId}`,
      SK: `DISC#${discussionId}`,
    },
  }));

  return {};
}

export async function likeDiscussion(courseId, discussionId, userId) {
  const current = await client.send(new GetCommand({
    TableName: tableName,
    Key: {
      PK: `COURSE#${courseId}`,
      SK: `DISC#${discussionId}`,
    },
  }));

  if (!current.Item) return null;

  const likedBy = current.Item.likedBy || [];
  const nextLikedBy = likedBy.includes(userId) ? likedBy : [...likedBy, userId];

  const response = await client.send(new UpdateCommand({
    TableName: tableName,
    Key: {
      PK: `COURSE#${courseId}`,
      SK: `DISC#${discussionId}`,
    },
    UpdateExpression: "SET likedBy = :likedBy, likes = :likes, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":likedBy": nextLikedBy,
      ":likes": nextLikedBy.length,
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW",
  }));

  const comments = await listComments(discussionId);
  return {
    ...mapDiscussion(response.Attributes),
    replies: comments.length,
    comments,
  };
}

function mapDiscussion(item) {
  return {
    id: item.id || item.SK.replace("DISC#", ""),
    courseId: item.courseId || item.PK.replace("COURSE#", ""),
    author: item.author || item.authorName || item.authorId,
    authorAvatar: item.authorAvatar || null,
    title: item.title,
    content: item.content,
    timestamp: item.timestamp || item.createdAt,
    replies: item.replies || 0,
    likes: item.likes || 0,
    authorId: item.authorId,
    authorRole: item.authorRole || "student",
    likedBy: item.likedBy || [],
  };
}

// Comment/reply operations
export async function createComment(discussionId, input) {
  const commentId = createId("comment");
  const now = new Date().toISOString();

  const item = {
    PK: `DISC#${discussionId}`,
    SK: `COMMENT#${commentId}`,
    id: commentId,
    discussionId,
    authorId: input.authorId,
    authorName: input.authorName || input.authorId,
    authorRole: input.authorRole || "student",
    content: input.content,
    createdAt: input.createdAt || now,
    updatedAt: now,
  };

  await client.send(new PutCommand({
    TableName: tableName,
    Item: item,
  }));

  return mapComment(item);
}

export async function listComments(discussionId) {
  const response = await client.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `DISC#${discussionId}`,
      ":sk": "COMMENT#",
    },
  }));

  return (response.Items || []).map(mapComment);
}

function mapComment(item) {
  return {
    id: item.id || item.SK.replace("COMMENT#", ""),
    authorId: item.authorId,
    authorName: item.authorName,
    authorRole: item.authorRole || "student",
    content: item.content,
    createdAt: item.createdAt,
  };
}

// Notification operations
export async function createNotification(studentId, input) {
  const notificationId = input.id || createId("notification");
  const now = new Date().toISOString();
  const timestamp = input.timestamp || now;

  const item = {
    PK: `STUDENT#${studentId}`,
    SK: `NOTIFY#${timestamp}`,
    GSI1PK: `NOTIFICATION#${notificationId}`,
    GSI1SK: `STUDENT#${studentId}`,
    id: notificationId,
    studentId,
    type: input.type || "general",
    title: input.title,
    message: input.message,
    timestamp,
    urgent: input.urgent || false,
    read: input.read || false,
    link: input.link || null,
    createdAt: now,
    updatedAt: now,
  };

  await client.send(new PutCommand({
    TableName: tableName,
    Item: item,
  }));

  return mapNotification(item);
}

export async function listNotifications(studentId) {
  const command = studentId ? new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `STUDENT#${studentId}`,
      ":sk": "NOTIFY#",
    },
  }) : new ScanCommand({
    TableName: tableName,
    FilterExpression: "begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":sk": "NOTIFY#",
    },
  });

  const response = await client.send(command);
  return (response.Items || []).map(mapNotification);
}

export async function markNotificationReadById(notificationId) {
  const found = await client.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: "id = :id AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":id": notificationId,
      ":sk": "NOTIFY#",
    },
  }));

  const item = (found.Items || [])[0];
  if (!item) return null;

  await client.send(new UpdateCommand({
    TableName: tableName,
    Key: {
      PK: item.PK,
      SK: item.SK,
    },
    UpdateExpression: "SET #read = :read, updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#read": "read",
    },
    ExpressionAttributeValues: {
      ":read": true,
      ":updatedAt": new Date().toISOString(),
    },
  }));

  return {};
}

export async function markAllNotificationsRead(studentId) {
  const notifications = await listNotifications(studentId);
  await Promise.all(notifications.map((notification) => markNotificationReadById(notification.id)));
  return {};
}

function mapNotification(item) {
  return {
    id: item.id,
    type: item.type || "general",
    title: item.title,
    message: item.message,
    timestamp: item.timestamp || item.createdAt || item.SK.replace("NOTIFY#", ""),
    urgent: item.urgent || false,
    read: item.read || false,
    link: item.link || null,
  };
}
