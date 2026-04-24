import { describe, expect, it } from "vitest";
import {
  buildAuthSession,
  getDefaultRouteForRole,
  mapTuProfileToAuthUser,
  mapTuTypeToRole,
} from "./auth.utils";

describe("auth.utils", () => {
  it("maps student TU accounts to the student role", () => {
    expect(mapTuTypeToRole("student")).toBe("student");
  });

  it("maps employee TU accounts to the instructor role", () => {
    expect(mapTuTypeToRole("employee")).toBe("instructor");
  });

  it("normalizes student profile data into the app user shape", () => {
    const user = mapTuProfileToAuthUser({
      status: true,
      message: "Success",
      type: "student",
      username: "65070001",
      tu_status: "ปกติ",
      statusid: "10",
      displayname_th: "นักศึกษา ทดสอบ",
      displayname_en: "Student Demo",
      email: "student@dome.tu.ac.th",
      department: "Computer Science",
      faculty: "Science",
    });

    expect(user).toMatchObject({
      username: "65070001",
      role: "student",
      facultyOrOrganization: "Science",
    });
  });

  it("creates an auth session and computes the correct home route", () => {
    const session = buildAuthSession({
      accessToken: "token-1",
      expiresAt: "2026-01-01T00:00:00.000Z",
      profile: {
        status: true,
        message: "Success",
        type: "employee",
        username: "teacher01",
        displayname_th: "อาจารย์ ทดสอบ",
        displayname_en: "Lecturer Demo",
        StatusWork: "1",
        StatusEmp: "ปกติ",
        email: "teacher@tu.ac.th",
        department: "Computer Science",
        organization: "Thammasat University",
      },
    });

    expect(session.user.role).toBe("instructor");
    expect(getDefaultRouteForRole(session.user.role)).toBe("/instructor");
  });
});
