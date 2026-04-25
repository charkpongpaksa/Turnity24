import { createBrowserRouter } from "react-router";
import { StudentDashboard } from "./pages/StudentDashboard";
import { InstructorDashboard } from "./pages/InstructorDashboard";
import { ClassroomPage } from "./pages/ClassroomPage";
import { AssignmentDetail } from "./pages/AssignmentDetail";
import { InstructorAssignmentDetail } from "./pages/InstructorAssignmentDetail";
import { AssignmentSubmission } from "./pages/AssignmentSubmission";
import { SubmissionTracking } from "./pages/SubmissionTracking";
import { AllCourses } from "./pages/AllCourses";
import { NotificationsPage } from "./pages/NotificationsPage";
import { RootLayout } from "./layouts/RootLayout";
import { NotFound } from "./pages/NotFound";
import { UpcomingDeadlinesPage } from "./pages/UpcomingDeadlinesPage";
import { SearchResultsPage } from "./pages/SearchResultsPage";
import { HomeRedirect } from "@/features/auth/HomeRedirect";
import { LoginPage } from "@/features/auth/LoginPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: RootLayout,
        children: [
          { index: true, Component: HomeRedirect },
          {
            element: <ProtectedRoute allowedRoles={["student"]} />,
            children: [
              { path: "student", Component: StudentDashboard },
              { path: "courses", Component: AllCourses },
              { path: "search", Component: SearchResultsPage },
              { path: "deadlines", Component: UpcomingDeadlinesPage },
              { path: "notifications", Component: NotificationsPage },
              { path: "course/:courseId", Component: ClassroomPage },
              { path: "course/:courseId/assignment/:assignmentId", Component: AssignmentDetail },
              { path: "course/:courseId/assignment/:assignmentId/submit", Component: AssignmentSubmission },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={["instructor"]} />,
            children: [
              { path: "instructor", Component: InstructorDashboard },
              { path: "instructor/courses", Component: AllCourses },
              { path: "instructor/search", Component: SearchResultsPage },
              { path: "instructor/deadlines", Component: UpcomingDeadlinesPage },
              { path: "instructor/notifications", Component: NotificationsPage },
              { path: "instructor/course/:courseId", Component: ClassroomPage },
              { path: "instructor/course/:courseId/assignment/:assignmentId", Component: InstructorAssignmentDetail },
              { path: "instructor/course/:courseId/assignment/:assignmentId/tracking", Component: SubmissionTracking },
            ],
          },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);
