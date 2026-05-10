import type {
  AppRole,
  AuthSession,
  AuthUser,
  TuApiProfile,
} from "./auth.types";

export function mapTuTypeToRole(type: TuApiProfile["type"]): AppRole {
  return type === "employee" ? "instructor" : "student";
}

export function mapTuProfileToAuthUser(profile: TuApiProfile): AuthUser {
  return {
    id: profile.username,
    username: profile.username,
    nameTh: profile.displayname_th,
    nameEn: profile.displayname_en,
    email: profile.email,
    role: mapTuTypeToRole(profile.type),
    tuType: profile.type,
    department: profile.department,
    facultyOrOrganization:
      profile.type === "student" ? profile.faculty : profile.organization,
  };
}

export function buildAuthSession(input: {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  profile: TuApiProfile;
}): AuthSession {
  const user = mapTuProfileToAuthUser(input.profile);
  return {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt: input.expiresAt,
    user,
    activeRole: user.role,
  };
}

export function getDefaultRouteForRole(role: AppRole): string {
  return role === "instructor" ? "/instructor" : "/student";
}
