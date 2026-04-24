import { describe, expect, it } from "vitest";
import { resolveNotificationLink } from "./notifications";

describe("resolveNotificationLink", () => {
  it("keeps student links unchanged", () => {
    expect(resolveNotificationLink("/course/1/assignment/1", "student")).toBe(
      "/course/1/assignment/1"
    );
  });

  it("prefixes course links for instructor view", () => {
    expect(resolveNotificationLink("/course/1/assignment/1", "instructor")).toBe(
      "/instructor/course/1/assignment/1"
    );
  });

  it("maps notifications center link for instructor view", () => {
    expect(resolveNotificationLink("/notifications", "instructor")).toBe(
      "/instructor/notifications"
    );
  });
});
