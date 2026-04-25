import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Clock, CalendarDays } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { PageBackButton } from "../components/PageBackButton";
import { cn } from "../components/ui/utils";
import { listAssignments, listCourses } from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import { useAuth } from "@/features/auth/AuthProvider";

export function UpcomingDeadlinesPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: assignmentsData, loading: assignmentsLoading } = useAsyncData(
    () => listAssignments(),
    []
  );
  const { data: coursesData, loading: coursesLoading } = useAsyncData(
    () => listCourses(),
    []
  );

  const assignments = assignmentsData ?? [];
  const courses = coursesData ?? [];
  const isInstructor = session?.user.role === "instructor";

  const sortedAssignments = useMemo(
    () =>
      assignments
        .map((assignment) => ({
          ...assignment,
          course: courses.find((course) => course.id === assignment.courseId),
        }))
        .sort(
          (left, right) =>
            new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()
        ),
    [assignments, courses]
  );

  const getDeadlineLabel = (dueDate: string) => {
    const diffDays = Math.ceil(
      (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  const getDeadlineTone = (dueDate: string) => {
    const diffDays = Math.ceil(
      (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "text-red-600";
    if (diffDays <= 2) return "text-orange-600";
    return "text-gray-600";
  };

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-6">
      <PageBackButton
        to={isInstructor ? "/instructor" : "/student"}
        label="Back to Dashboard"
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Deadlines</h1>
          <p className="mt-1 text-gray-600">
            Track every assignment deadline in one place.
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {sortedAssignments.length} assignments
        </Badge>
      </div>

      {assignmentsLoading || coursesLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            Loading deadlines...
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {sortedAssignments.map((assignment) => (
          <Card
            key={assignment.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() =>
              navigate(
                isInstructor
                  ? `/instructor/course/${assignment.courseId}/assignment/${assignment.id}`
                  : `/course/${assignment.courseId}/assignment/${assignment.id}`
              )
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{assignment.title}</CardTitle>
                  <p className="mt-1 text-sm text-gray-600">
                    {assignment.course?.name ?? "Unknown course"}
                  </p>
                </div>
                <Badge variant="outline">{assignment.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className={cn("flex items-center gap-2", getDeadlineTone(assignment.dueDate))}>
                  <Clock className="h-4 w-4" />
                  <span>{getDeadlineLabel(assignment.dueDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarDays className="h-4 w-4" />
                  <span>{new Date(assignment.dueDate).toLocaleString()}</span>
                </div>
                <span className="text-gray-500">{assignment.points} points</span>
              </div>
              <p className="line-clamp-2 text-sm text-gray-600">
                {assignment.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
