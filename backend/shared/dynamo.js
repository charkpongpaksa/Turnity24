import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ensureLocalAccountsSeeded,
  ensurePlaceholderStudent,
  getUserById,
  listStudentUsers,
} from "./users.js";

const baseClient = new DynamoDBClient({});
const client = DynamoDBDocumentClient.from(baseClient);
const tableName = process.env.DDB_TABLE_NAME || "TurnityTable";
let bootstrapPromise = null;

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function mapCourse(item) {
  return {
    id: item.id || item.PK.replace("COURSE#", ""),
    name: item.name,
    code: item.code,
    instructor: item.instructor,
    progress: item.progress || 0,
    color: item.color || "bg-slate-600",
    students: item.students || 0,
    nextDeadline: item.nextDeadline || today(),
  };
}

function mapAnnouncement(item) {
  return {
    id: item.id || item.SK.replace("ANN#", ""),
    courseId: item.courseId || item.PK.replace("COURSE#", ""),
    title: item.title,
    content: item.content,
    author: item.author,
    timestamp: item.timestamp || item.createdAt,
    pinned: Boolean(item.pinned),
  };
}

function mapAssignment(item) {
  return {
    id: item.id || item.SK.replace("ASS#", ""),
    courseId: item.courseId || item.PK.replace("COURSE#", ""),
    title: item.title,
    description: item.description,
    dueDate: item.dueDate,
    status: item.status || "not_submitted",
    type: item.type || "file",
    points: item.points ?? 100,
    latePolicy: item.latePolicy || "",
    attachments: item.attachments || [],
    submissions: item.submissions || [],
  };
}

function mapSubmission(item) {
  return {
    id: item.id,
    assignmentId: item.assignmentId || item.PK.replace("ASS#", ""),
    studentId: item.studentId || item.SK.replace("SUBMISSION#", ""),
    status: item.status || "submitted",
    submittedAt: item.submittedAt || null,
    score: item.score ?? null,
    feedback: item.feedback || "",
    text: item.text || "",
    fileUrl: item.fileUrl || null,
    fileName: item.fileName || null,
  };
}

function mapDiscussion(item) {
  return {
    id: item.id || item.SK.replace("DISC#", ""),
    courseId: item.courseId || item.PK.replace("COURSE#", ""),
    author: item.author,
    authorAvatar: item.authorAvatar || "",
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

function mapNotification(item) {
  return {
    id: item.id,
    type: item.type || "general",
    title: item.title,
    message: item.message,
    timestamp: item.timestamp || item.createdAt,
    urgent: Boolean(item.urgent),
    read: Boolean(item.read),
    link: item.link || "",
  };
}

async function ensureBootstrapData() {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    await ensureLocalAccountsSeeded();

    const seedCourseId = "seed-course-1";
    const seedStudentId = "student-demo";
    const seedInstructorId = "instructor-demo";

    const existingCourse = await client.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          PK: `COURSE#${seedCourseId}`,
          SK: "META#course",
        },
      })
    );

    if (existingCourse.Item) return;

    const timestamp = now();

    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: `COURSE#${seedCourseId}`,
          SK: "META#course",
          GSI1PK: `COURSE#${seedCourseId}`,
          GSI1SK: "META#course",
          id: seedCourseId,
          name: "Cloud Systems Design",
          code: "CS440",
          instructor: "Lecturer Demo",
          progress: 0,
          color: "bg-slate-600",
          students: 1,
          nextDeadline: today(),
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      })
    );

    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: `COURSE#${seedCourseId}`,
          SK: `STUDENT#${seedStudentId}`,
          GSI1PK: `STUDENT#${seedStudentId}`,
          GSI1SK: `COURSE#${seedCourseId}`,
          studentId: seedStudentId,
          name: "Student Demo",
          email: "student.demo@turnity.local",
          role: "student",
          joinedAt: timestamp,
        },
      })
    );

    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: `COURSE#${seedCourseId}`,
          SK: "ANN#seed-ann-1",
          id: "seed-ann-1",
          courseId: seedCourseId,
          title: "Welcome to Turnity",
          content: "This is the starter announcement for your demo course.",
          author: "Lecturer Demo",
          pinned: true,
          timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      })
    );

    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: `COURSE#${seedCourseId}`,
          SK: "ASS#seed-assignment-1",
          id: "seed-assignment-1",
          courseId: seedCourseId,
          title: "Architecture Proposal",
          description: "Submit your initial cloud architecture proposal.",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          status: "not_submitted",
          type: "file",
          points: 100,
          latePolicy: "10% deduction per day late",
          attachments: [],
          submissions: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      })
    );

    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: `COURSE#${seedCourseId}`,
          SK: "DISC#seed-discussion-1",
          id: "seed-discussion-1",
          courseId: seedCourseId,
          author: "Lecturer Demo",
          authorAvatar: "",
          title: "Course kickoff",
          content: "Introduce yourself and share what you want from this course.",
          timestamp,
          likes: 0,
          replies: 0,
          authorId: seedInstructorId,
          authorRole: "instructor",
          likedBy: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      })
    );

    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: `USER#${seedStudentId}`,
          SK: `NOTIFY#${timestamp}`,
          GSI1PK: "NOTIFICATION#seed-notify-1",
          GSI1SK: `USER#${seedStudentId}`,
          id: "seed-notify-1",
          studentId: seedStudentId,
          type: "reminder",
          title: "Upcoming assignment",
          message: "Architecture Proposal is due in 7 days.",
          timestamp,
          urgent: false,
          read: false,
          link: `/course/${seedCourseId}/assignment/seed-assignment-1`,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      })
    );
  })();

  return bootstrapPromise;
}

async function updateCourseStudentCount(courseId) {
  const students = await listCourseStudents(courseId);
  await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `COURSE#${courseId}`,
        SK: "META#course",
      },
      UpdateExpression: "SET students = :students, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":students": students.length,
        ":updatedAt": now(),
      },
    })
  );
}

export async function listCourses() {
  await ensureBootstrapData();
  const response = await client.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: "SK = :sk",
      ExpressionAttributeValues: {
        ":sk": "META#course",
      },
    })
  );

  return (response.Items || []).map(mapCourse);
}

export async function listCoursesByStudent(studentId) {
  await ensureBootstrapData();
  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `STUDENT#${studentId}`,
        ":sk": "COURSE#",
      },
    })
  );

  const enrollments = response.Items || [];
  const courses = await Promise.all(
    enrollments.map((item) =>
      getCourseById(String(item.GSI1SK).replace("COURSE#", ""))
    )
  );

  return courses.filter(Boolean);
}

export async function getCourseById(courseId) {
  if (!courseId) return null;

  const response = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `COURSE#${courseId}`,
        SK: "META#course",
      },
    })
  );

  return response.Item ? mapCourse(response.Item) : null;
}

export async function createCourse(input) {
  const courseId = createId("course");
  const timestamp = now();
  const item = {
    PK: `COURSE#${courseId}`,
    SK: "META#course",
    GSI1PK: `COURSE#${courseId}`,
    GSI1SK: "META#course",
    id: courseId,
    name: input.name,
    code: input.code,
    instructor: input.instructor,
    progress: 0,
    color: "bg-slate-600",
    students: 0,
    nextDeadline: today(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  return mapCourse(item);
}

export async function updateCourse(courseId, input) {
  const current = await getCourseById(courseId);
  if (!current) return null;

  const nextCourse = {
    ...current,
    name: input.name ?? current.name,
    code: input.code ?? current.code,
    instructor: input.instructor ?? current.instructor,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        PK: `COURSE#${courseId}`,
        SK: "META#course",
        GSI1PK: `COURSE#${courseId}`,
        GSI1SK: "META#course",
        ...nextCourse,
        updatedAt: now(),
      },
    })
  );

  return nextCourse;
}

export async function listCourseStudents(courseId) {
  await ensureBootstrapData();
  await ensureLocalAccountsSeeded();

  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `COURSE#${courseId}`,
        ":sk": "STUDENT#",
      },
    })
  );

  const students = await Promise.all(
    (response.Items || []).map(async (item) => {
      const studentId = item.studentId || String(item.SK).replace("STUDENT#", "");
      const user = await getUserById(studentId);
      return {
        id: studentId,
        name: user?.nameEn || item.name || studentId,
        email: user?.email || item.email || "",
        avatar: user?.avatar || "",
      };
    })
  );

  return students;
}

export async function addStudentToCourse(courseId, studentId) {
  const student = await ensurePlaceholderStudent(studentId);

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        PK: `COURSE#${courseId}`,
        SK: `STUDENT#${student.userId}`,
        GSI1PK: `STUDENT#${student.userId}`,
        GSI1SK: `COURSE#${courseId}`,
        studentId: student.userId,
        name: student.nameEn,
        email: student.email,
        role: "student",
        joinedAt: now(),
      },
    })
  );

  await updateCourseStudentCount(courseId);
  return listCourseStudents(courseId);
}

export async function removeStudentFromCourse(courseId, studentId) {
  await client.send(
    new DeleteCommand({
      TableName: tableName,
      Key: {
        PK: `COURSE#${courseId}`,
        SK: `STUDENT#${studentId}`,
      },
    })
  );

  await updateCourseStudentCount(courseId);
  return listCourseStudents(courseId);
}

export async function listStudents() {
  await ensureBootstrapData();
  return listStudentUsers();
}

export async function listAnnouncements(courseId) {
  await ensureBootstrapData();
  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `COURSE#${courseId}`,
        ":sk": "ANN#",
      },
    })
  );

  return (response.Items || []).map(mapAnnouncement);
}

export async function createAnnouncement(courseId, input) {
  const announcementId = createId("ann");
  const timestamp = now();
  const item = {
    PK: `COURSE#${courseId}`,
    SK: `ANN#${announcementId}`,
    id: announcementId,
    courseId,
    title: input.title,
    content: input.content,
    author: input.author,
    pinned: Boolean(input.pinned),
    timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  return mapAnnouncement(item);
}

export async function updateAnnouncement(courseId, announcementId, input) {
  const currentResponse = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `COURSE#${courseId}`,
        SK: `ANN#${announcementId}`,
      },
    })
  );

  if (!currentResponse.Item) return null;

  const current = currentResponse.Item;
  const nextItem = {
    ...current,
    title: input.title ?? current.title,
    content: input.content ?? current.content,
    pinned: input.pinned ?? current.pinned,
    updatedAt: now(),
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: nextItem,
    })
  );

  return mapAnnouncement(nextItem);
}

export async function listAssignments(courseId) {
  await ensureBootstrapData();
  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `COURSE#${courseId}`,
        ":sk": "ASS#",
      },
    })
  );

  return (response.Items || []).map(mapAssignment);
}

export async function getAssignmentById(courseId, assignmentId) {
  const response = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `COURSE#${courseId}`,
        SK: `ASS#${assignmentId}`,
      },
    })
  );

  return response.Item ? mapAssignment(response.Item) : null;
}

export async function createAssignment(courseId, input) {
  const assignmentId = createId("ass");
  const timestamp = now();
  const item = {
    PK: `COURSE#${courseId}`,
    SK: `ASS#${assignmentId}`,
    id: assignmentId,
    courseId,
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    status: input.status || "not_submitted",
    type: input.type || "file",
    points: input.points ?? 100,
    latePolicy: input.latePolicy || "",
    attachments: input.attachments || [],
    submissions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  return mapAssignment(item);
}

export async function updateAssignment(courseId, assignmentId, input) {
  const existing = await getAssignmentById(courseId, assignmentId);
  if (!existing) return null;

  const nextItem = {
    PK: `COURSE#${courseId}`,
    SK: `ASS#${assignmentId}`,
    ...existing,
    id: assignmentId,
    courseId,
    title: normalizeString(input.title, existing.title),
    description: normalizeString(input.description, existing.description),
    dueDate: normalizeString(input.dueDate, existing.dueDate),
    status: input.status || existing.status,
    type: normalizeString(input.type, existing.type),
    points: input.points ?? existing.points,
    latePolicy: normalizeString(input.latePolicy, existing.latePolicy),
    attachments: input.attachments ?? existing.attachments,
    submissions: existing.submissions || [],
    updatedAt: now(),
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: nextItem,
    })
  );

  return mapAssignment(nextItem);
}

export async function deleteAssignment(courseId, assignmentId) {
  await client.send(
    new DeleteCommand({
      TableName: tableName,
      Key: {
        PK: `COURSE#${courseId}`,
        SK: `ASS#${assignmentId}`,
      },
    })
  );

  return {};
}

export async function createSubmission(assignmentId, studentId, input) {
  const submissionId = input.id || createId("submission");
  const timestamp = now();
  const item = {
    PK: `ASS#${assignmentId}`,
    SK: `SUBMISSION#${submissionId}`,
    id: submissionId,
    assignmentId,
    studentId,
    text: normalizeString(input.text),
    fileUrl: input.fileUrl || null,
    fileName: input.fileName || null,
    score: input.score ?? null,
    feedback: normalizeString(input.feedback),
    status: input.status || "submitted",
    submittedAt: input.submittedAt || timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  return mapSubmission(item);
}

export async function listSubmissions(assignmentId) {
  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `ASS#${assignmentId}`,
        ":sk": "SUBMISSION#",
      },
    })
  );

  return (response.Items || []).map(mapSubmission);
}

export async function gradeSubmissionBySubmissionId(
  assignmentId,
  submissionId,
  input
) {
  const response = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `ASS#${assignmentId}`,
        SK: `SUBMISSION#${submissionId}`,
      },
      UpdateExpression:
        "SET score = :score, feedback = :feedback, #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":score": input.score,
        ":feedback": input.feedback || "",
        ":status": "graded",
        ":updatedAt": now(),
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return response.Attributes ? mapSubmission(response.Attributes) : null;
}

export async function createDiscussion(courseId, input) {
  const discussionId = createId("discussion");
  const timestamp = now();
  const item = {
    PK: `COURSE#${courseId}`,
    SK: `DISC#${discussionId}`,
    id: discussionId,
    courseId,
    author: input.author,
    authorAvatar: input.authorAvatar || "",
    title: input.title,
    content: input.content,
    timestamp,
    likes: 0,
    replies: 0,
    authorId: input.authorId,
    authorRole: input.authorRole || "student",
    likedBy: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  return {
    ...mapDiscussion(item),
    comments: [],
  };
}

export async function listDiscussions(courseId) {
  await ensureBootstrapData();
  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `COURSE#${courseId}`,
        ":sk": "DISC#",
      },
    })
  );

  return Promise.all(
    (response.Items || []).map(async (item) => {
      const comments = await listComments(item.id);
      return {
        ...mapDiscussion(item),
        replies: comments.length,
        comments,
      };
    })
  );
}

export async function getDiscussionById(courseId, discussionId) {
  const response = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `COURSE#${courseId}`,
        SK: `DISC#${discussionId}`,
      },
    })
  );

  if (!response.Item) return null;

  const comments = await listComments(discussionId);
  return {
    ...mapDiscussion(response.Item),
    replies: comments.length,
    comments,
  };
}

export async function updateDiscussion(courseId, discussionId, input) {
  const current = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `COURSE#${courseId}`,
        SK: `DISC#${discussionId}`,
      },
    })
  );

  if (!current.Item) return null;

  const nextItem = {
    ...current.Item,
    title: input.title ?? current.Item.title,
    content: input.content ?? current.Item.content,
    updatedAt: now(),
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: nextItem,
    })
  );

  const comments = await listComments(discussionId);
  return {
    ...mapDiscussion(nextItem),
    replies: comments.length,
    comments,
  };
}

export async function deleteDiscussion(courseId, discussionId) {
  await client.send(
    new DeleteCommand({
      TableName: tableName,
      Key: {
        PK: `COURSE#${courseId}`,
        SK: `DISC#${discussionId}`,
      },
    })
  );

  return {};
}

export async function likeDiscussion(courseId, discussionId, userId) {
  const current = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `COURSE#${courseId}`,
        SK: `DISC#${discussionId}`,
      },
    })
  );

  if (!current.Item) return null;

  const likedBy = current.Item.likedBy || [];
  const nextLikedBy = likedBy.includes(userId)
    ? likedBy.filter((id) => id !== userId)
    : [...likedBy, userId];

  const nextItem = {
    ...current.Item,
    likedBy: nextLikedBy,
    likes: nextLikedBy.length,
    updatedAt: now(),
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: nextItem,
    })
  );

  const comments = await listComments(discussionId);
  return {
    ...mapDiscussion(nextItem),
    replies: comments.length,
    comments,
  };
}

export async function createComment(discussionId, input) {
  const commentId = createId("comment");
  const timestamp = now();
  const item = {
    PK: `DISC#${discussionId}`,
    SK: `COMMENT#${commentId}`,
    id: commentId,
    discussionId,
    authorId: input.authorId,
    authorName: input.authorName || input.authorId,
    authorRole: input.authorRole || "student",
    content: input.content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  return mapComment(item);
}

export async function listComments(discussionId) {
  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `DISC#${discussionId}`,
        ":sk": "COMMENT#",
      },
    })
  );

  return (response.Items || []).map(mapComment);
}

export async function createNotification(studentId, input) {
  const notificationId = input.id || createId("notification");
  const timestamp = input.timestamp || now();
  const item = {
    PK: `USER#${studentId}`,
    SK: `NOTIFY#${timestamp}`,
    GSI1PK: `NOTIFICATION#${notificationId}`,
    GSI1SK: `USER#${studentId}`,
    id: notificationId,
    studentId,
    type: input.type || "general",
    title: input.title,
    message: input.message,
    timestamp,
    urgent: Boolean(input.urgent),
    read: Boolean(input.read),
    link: input.link || "",
    createdAt: now(),
    updatedAt: now(),
  };

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  return mapNotification(item);
}

export async function listNotifications(studentId) {
  await ensureBootstrapData();
  const command = studentId
    ? new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${studentId}`,
          ":sk": "NOTIFY#",
        },
      })
    : new ScanCommand({
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
  const response = await client.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: "id = :id AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":id": notificationId,
        ":sk": "NOTIFY#",
      },
    })
  );

  const item = response.Items?.[0];
  if (!item) return null;

  await client.send(
    new UpdateCommand({
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
        ":updatedAt": now(),
      },
    })
  );

  return {};
}

export async function markAllNotificationsRead(studentId) {
  const notifications = await listNotifications(studentId);
  await Promise.all(
    notifications.map((notification) => markNotificationReadById(notification.id))
  );
  return {};
}
