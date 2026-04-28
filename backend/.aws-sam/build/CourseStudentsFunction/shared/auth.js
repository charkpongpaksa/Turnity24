import {
  buildTuProfileFromUser,
  ensureLocalAccountsSeeded,
  getUserById,
  touchUserLogin,
  upsertUserFromTuProfile,
  verifyLocalCredentials,
} from "./users.js";

const TOKEN_PREFIX = "turnity";

function normalize(value) {
  return String(value || "").trim();
}

export function createAccessToken(userId) {
  const issuedAt = Date.now();
  return `${TOKEN_PREFIX}:${userId}:${issuedAt}`;
}

export function parseAccessToken(token) {
  const raw = String(token || "").trim();
  if (!raw) return null;

  const [prefix, userId] = raw.split(":");
  if (prefix !== TOKEN_PREFIX || !userId) return null;

  return { userId };
}

export function getBearerToken(event) {
  const header =
    event?.headers?.authorization ?? event?.headers?.Authorization ?? "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export async function getCurrentUserFromEvent(event) {
  const token = getBearerToken(event);
  const parsed = parseAccessToken(token);
  if (!parsed?.userId) return null;

  return getUserById(parsed.userId);
}

async function verifyWithTuApi({ username, password }) {
  const tuApiKey = process.env.TU_API_APPLICATION_KEY;
  const baseUrl = process.env.TU_API_BASE_URL;

  if (!tuApiKey || !baseUrl) {
    throw new Error(
      "TU API is not configured. Set TU_API_APPLICATION_KEY and TU_API_BASE_URL."
    );
  }

  const response = await fetch(`${baseUrl}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Application-Key": tuApiKey,
    },
    body: JSON.stringify({
      UserName: username,
      PassWord: password,
    }),
  });

  if (!response.ok) {
    throw new Error(`TU API request failed with status ${response.status}`);
  }

  const profile = await response.json();
  if (!profile?.status) {
    throw new Error(profile?.message ?? "TU authentication failed");
  }

  return profile;
}

export async function authenticateUser({ username, password }) {
  const normalizedUsername = normalize(username);
  const normalizedPassword = normalize(password);

  if (!normalizedUsername || !normalizedPassword) {
    throw new Error("Username and password are required.");
  }

  await ensureLocalAccountsSeeded();

  const localUser = await verifyLocalCredentials(
    normalizedUsername,
    normalizedPassword
  );
  if (localUser) {
    await touchUserLogin(localUser.userId);
    return {
      profile: buildTuProfileFromUser(localUser),
      user: localUser,
      source: "local",
    };
  }

  const tuProfile = await verifyWithTuApi({
    username: normalizedUsername,
    password: normalizedPassword,
  });
  const user = await upsertUserFromTuProfile(tuProfile);
  return {
    profile: tuProfile,
    user,
    source: "tu",
  };
}
