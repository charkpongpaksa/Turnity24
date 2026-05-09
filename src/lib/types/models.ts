export type Course = {
  id: string;
  name: string;
  code: string;
  instructor: string;
  progress: number;
  color: string;
  students: number;
  nextDeadline: string;
};

export type AssignmentStatus =
  | "not_submitted"
  | "submitted"
  | "late"
  | "missing";

export type AssignmentAttachment = {
  name: string;
  url: string;
};

export type Submission = {
  submittedAt: string;
  files: string[];
  fileUrl?: string | null;
  fileName?: string | null;
  text?: string;
  feedback: string;
  score: number | null;
};

export type Assignment = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
  type: string;
  points: number;
  latePolicy: string;
  attachments: AssignmentAttachment[];
  submissions: Submission[];
};

export type Announcement = {
  id: string;
  courseId: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  pinned: boolean;
};

export type Discussion = {
  id: string;
  courseId: string;
  author: string;
  authorAvatar: string;
  title: string;
  content: string;
  timestamp: string;
  replies: number;
  likes: number;
  authorId?: string;
  authorRole?: "student" | "instructor";
  likedBy?: string[];
  comments?: DiscussionComment[];
};

export type DiscussionComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: "student" | "instructor";
  content: string;
  createdAt: string;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

export type SubmissionRecord = {
  id?: string;
  studentId: string;
  assignmentId: string;
  status: "submitted" | "late" | "missing";
  submittedAt: string | null;
  score: number | null;
  feedback?: string;
  text?: string;
  fileUrl?: string | null;
  fileName?: string | null;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  urgent: boolean;
  read: boolean;
  link: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  activeRole: "student" | "instructor";
};
