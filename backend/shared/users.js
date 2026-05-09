import crypto from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const baseClient = new DynamoDBClient({});
const client = DynamoDBDocumentClient.from(baseClient);
const tableName = process.env.DDB_TABLE_NAME || "TurnityTable";
const passwordSalt = process.env.LOCAL_AUTH_SALT || "turnity-local-auth-salt";

const LOCAL_TEST_ACCOUNTS = [
  {
    userId: "student-demo",
    username: "student-demo",
    email: "student.demo@turnity.local",
    password: "1234",
    role: "student",
    tuType: "student",
    accountType: "local",
    nameTh: "นักศึกษา ทดสอบ",
    nameEn: "Student Demo",
    department: "Computer Science",
    facultyOrOrganization: "Faculty of Science and Technology",
    status: "active",
  },
  {
    userId: "instructor-demo",
    username: "instructor-demo",
    email: "lecturer.demo@turnity.local",
    password: "1234",
    role: "instructor",
    tuType: "employee",
    accountType: "local",
    nameTh: "อาจารย์ ทดสอบ",
    nameEn: "Lecturer Demo",
    department: "Computer Science",
    facultyOrOrganization: "Thammasat University",
    status: "active",
  },
];

function hashPassword(password) {
  return crypto
    .scryptSync(password, passwordSalt, 64)
    .toString("hex");
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function now() {
  return new Date().toISOString();
}

function mapDbUser(item) {
  if (!item) return null;

  return {
    userId: item.userId,
    username: item.username,
    email: item.email,
    passwordHash: item.passwordHash,
    role: item.role,
    tuType: item.tuType,
    accountType: item.accountType,
    nameTh: item.nameTh,
    nameEn: item.nameEn,
    department: item.department,
    facultyOrOrganization: item.facultyOrOrganization,
    status: item.status || "active",
    avatar: item.avatar || "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lastLoginAt: item.lastLoginAt,
  };
}

function buildUserPutItem(user) {
  return {
    PK: `USER#${user.userId}`,
    SK: "PROFILE",
    GSI1PK: `LOGIN#${normalize(user.username)}`,
    GSI1SK: "PROFILE",
    GSI2PK: `ROLE#${user.role}`,
    GSI2SK: `USER#${user.userId}`,
    userId: user.userId,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    tuType: user.tuType,
    accountType: user.accountType,
    nameTh: user.nameTh,
    nameEn: user.nameEn,
    department: user.department,
    facultyOrOrganization: user.facultyOrOrganization,
    status: user.status || "active",
    avatar: user.avatar || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || null,
  };
}

async function saveUser(user) {
  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: buildUserPutItem(user),
    })
  );

  return user;
}

export async function ensureLocalAccountsSeeded() {
  await Promise.all(
    LOCAL_TEST_ACCOUNTS.map(async (account) => {
      const existing = await getUserById(account.userId);
      if (existing) return existing;

      const timestamp = now();
      return saveUser({
        ...account,
        passwordHash: hashPassword(account.password),
        createdAt: timestamp,
        updatedAt: timestamp,
        lastLoginAt: null,
      });
    })
  );
}

export async function getUserById(userId) {
  if (!userId) return null;

  const response = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: "PROFILE",
      },
    })
  );

  return mapDbUser(response.Item);
}

export async function getUserByUsername(loginValue) {
  const normalized = normalize(loginValue);
  if (!normalized) return null;

  const byUsername = await client.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
      ExpressionAttributeValues: {
        ":pk": `LOGIN#${normalized}`,
        ":sk": "PROFILE",
      },
      Limit: 1,
    })
  );

  const usernameHit = byUsername.Items?.[0];
  if (usernameHit) {
    return mapDbUser(usernameHit);
  }

  const byEmail = await client.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: "SK = :sk AND email = :email",
      ExpressionAttributeValues: {
        ":sk": "PROFILE",
        ":email": normalized,
      },
    })
  );

  return mapDbUser(byEmail.Items?.[0]);
}

export async function verifyLocalCredentials(loginValue, password) {
  await ensureLocalAccountsSeeded();

  const user = await getUserByUsername(loginValue);
  if (!user || user.accountType !== "local") return null;

  const passwordHash = hashPassword(password);
  if (user.passwordHash !== passwordHash) return null;

  return user;
}

export async function upsertUserFromTuProfile(profile) {
  const userId = String(profile.username).trim();
  const existing = await getUserById(userId);
  const timestamp = now();

  const nextUser = {
    userId,
    username: userId,
    email: String(profile.email || "").trim().toLowerCase(),
    passwordHash: existing?.passwordHash,
    role: profile.type === "employee" ? "instructor" : "student",
    tuType: profile.type,
    accountType: "tu",
    nameTh: profile.displayname_th,
    nameEn: profile.displayname_en,
    department: profile.department || "",
    facultyOrOrganization:
      profile.type === "student" ? profile.faculty || "" : profile.organization || "",
    status: "active",
    avatar: existing?.avatar || "",
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
    lastLoginAt: timestamp,
  };

  await saveUser(nextUser);
  return nextUser;
}

export async function ensurePlaceholderStudent(studentId) {
  const normalized = String(studentId || "").trim();
  if (!normalized) {
    throw new Error("studentId is required");
  }

  const existing = await getUserById(normalized);
  if (existing) return existing;

  const timestamp = now();
  const placeholder = {
    userId: normalized,
    username: normalized,
    email: `${normalize(normalized)}@pending.tu.ac.th`,
    passwordHash: null,
    role: "student",
    tuType: "student",
    accountType: "placeholder",
    nameTh: `นักศึกษา ${normalized}`,
    nameEn: `Student ${normalized}`,
    department: "",
    facultyOrOrganization: "",
    status: "pending",
    avatar: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: null,
  };

  await saveUser(placeholder);
  return placeholder;
}

export async function touchUserLogin(userId) {
  if (!userId) return;

  await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: "PROFILE",
      },
      UpdateExpression: "SET lastLoginAt = :lastLoginAt, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":lastLoginAt": now(),
        ":updatedAt": now(),
      },
    })
  );
}

export async function listStudentUsers() {
  await ensureLocalAccountsSeeded();

  const response = await client.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk AND begins_with(GSI2SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": "ROLE#student",
        ":sk": "USER#",
      },
    })
  );

  return (response.Items || []).map((item) => ({
    id: item.userId,
    name: item.nameEn || item.username,
    email: item.email || "",
    avatar: item.avatar || "",
  }));
}

export async function updateUserProfile(userId, input) {
  const existing = await getUserById(userId);
  if (!existing) {
    throw new Error("User not found");
  }

  const nextUser = {
    ...existing,
    nameEn:
      typeof input.name === "string" && input.name.trim()
        ? input.name.trim()
        : typeof input.nameEn === "string" && input.nameEn.trim()
          ? input.nameEn.trim()
          : existing.nameEn,
    nameTh:
      typeof input.nameTh === "string" && input.nameTh.trim()
        ? input.nameTh.trim()
        : existing.nameTh,
    avatar:
      typeof input.avatarUrl === "string"
        ? input.avatarUrl
        : typeof input.avatar === "string"
          ? input.avatar
          : existing.avatar,
    updatedAt: now(),
  };

  await saveUser(nextUser);
  return nextUser;
}

export function buildTuProfileFromUser(user) {
  if (user.tuType === "employee") {
    return {
      status: true,
      message: "Success",
      type: "employee",
      username: user.username,
      displayname_th: user.nameTh,
      displayname_en: user.nameEn,
      StatusWork: "1",
      StatusEmp: user.status === "active" ? "ปกติ" : user.status,
      email: user.email,
      department: user.department,
      organization: user.facultyOrOrganization,
    };
  }

  return {
    status: true,
    message: "Success",
    type: "student",
    username: user.username,
    tu_status: user.status === "pending" ? "รอยืนยันตัวตน" : "ปกติ",
    statusid: user.status === "pending" ? "00" : "10",
    displayname_th: user.nameTh,
    displayname_en: user.nameEn,
    email: user.email,
    department: user.department,
    faculty: user.facultyOrOrganization,
  };
}
