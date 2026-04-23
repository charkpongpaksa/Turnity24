import { createBrowserRouter } from "react-router";
import { StudentDashboard } from "./pages/StudentDashboard";
import { InstructorDashboard } from "./pages/InstructorDashboard";
import { ClassroomPage } from "./pages/ClassroomPage";
import { AssignmentDetail } from "./pages/AssignmentDetail";
import { InstructorAssignmentDetail } from "./pages/InstructorAssignmentDetail";
import { AssignmentSubmission } from "./pages/AssignmentSubmission";
import { SubmissionTracking } from "./pages/SubmissionTracking";
import { MessagesPage } from "./pages/MessagesPage";
import { AllCourses } from "./pages/AllCourses";
import { RootLayout } from "./layouts/RootLayout";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: StudentDashboard },
      { path: "student", Component: StudentDashboard },
      { path: "instructor", Component: InstructorDashboard },
      { path: "courses", Component: AllCourses },
      { path: "instructor/courses", Component: AllCourses },
      { path: "course/:courseId", Component: ClassroomPage },
      { path: "instructor/course/:courseId", Component: ClassroomPage },
      { path: "course/:courseId/assignment/:assignmentId", Component: AssignmentDetail },
      { path: "instructor/course/:courseId/assignment/:assignmentId", Component: InstructorAssignmentDetail },
      { path: "course/:courseId/assignment/:assignmentId/submit", Component: AssignmentSubmission },
      { path: "instructor/course/:courseId/assignment/:assignmentId/tracking", Component: SubmissionTracking },
      { path: "messages", Component: MessagesPage },
      { path: "*", Component: NotFound },
    ],
  },
]);