import type { AppRole } from "@/features/auth/auth.types";

export function resolveNotificationLink(
  link: string,
  role: AppRole | null | undefined
): string {
  if (role !== "instructor") {
    return link;
  }

  if (link.startsWith("/course/")) {
    return `/instructor${link}`;
  }

  if (link === "/notifications") {
    return "/instructor/notifications";
  }

  return link;
}
