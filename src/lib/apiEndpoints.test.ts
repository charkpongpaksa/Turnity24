import { describe, expect, it } from "vitest";
import { ASSIGNMENTS, buildPath } from "./apiEndpoints";

describe("buildPath", () => {
  it("replaces dynamic route params", () => {
    expect(
      buildPath(ASSIGNMENTS.DETAIL, {
        courseId: "cs332",
        assignmentId: "a1",
      })
    ).toBe("/courses/cs332/assignments/a1");
  });
});
