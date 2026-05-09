import crypto from "node:crypto";
import {
  buildTuProfileFromUser,
  ensureLocalAccountsSeeded,
  getUserById,
  touchUserLogin,
  upsertUserFromTuProfile,
  verifyLocalCredentials,
} from "./users.js";

const signingSecret =
  process.env.AUTH_TOKEN_SECRET || "turnity-dev-signing-secret-change-me";
const tokenLifetimeSeconds = Number(process.env.AUTH_TOKEN_TTL_SECONDS || 28800);
const refreshLifetimeSeconds = Number(
  process.env.REFRESH_TOKEN_TTL_SECONDS || 2592000
);

function normalize(value) {
  return String(value || "").trim();
}

function base64urlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function sign(value) {
  return crypto
    .createHmac("sha256", signingSecret)
    .update(value)
    .digest("base64url");
}

export function createAccessToken(userId, role = "student") {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    role,
    type: "access",
    iat: nowSeconds,
    exp: nowSeconds + tokenLifetimeSeconds,
  };

  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function createRefreshToken(userId) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    type: "refresh",
    iat: nowSeconds,
    exp: nowSeconds + refreshLifetimeSeconds,
  };

  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseToken(token, expectedType = "access") {
  const raw = String(token || "").trim();
  if (!raw || !raw.includes(".")) return null;

  const [encodedPayload, signature] = raw.split(".");
  if (!encodedPayload || !signature) return null;
  if (sign(encodedPayload) !== signature) return null;

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (!payload?.sub || !payload?.exp) return null;
    if (payload.type && payload.type !== expectedType) return null;
    if (!payload.type && expectedType !== "access") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseAccessToken(token) {
  return parseToken(token, "access");
}

export function parseRefreshToken(token) {
  return parseToken(token, "refresh");
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
  if (!parsed?.sub) return null;

  return getUserById(parsed.sub);
}

export async function requireAuthenticatedUser(event) {
  const user = await getCurrentUserFromEvent(event);
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireRole(event, roles) {
  const user = await requireAuthenticatedUser(event);
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
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
