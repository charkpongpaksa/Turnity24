import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Search, BookOpen, FileText, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { PageBackButton } from "../components/PageBackButton";
import { listAnnouncements, listAssignments, listCourses } from "@/lib/data/repository";
import { useAsyncData } from "@/lib/hooks/useAsyncData";
import { useAuth } from "@/features/auth/AuthProvider";

function includesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRole } = useAuth();
  const query = searchParams.get("q")?.trim() ?? "";
  const isInstructor = currentRole === "instructor";

  const { data: coursesData, loading: coursesLoading } = useAsyncData(
    () => listCourses(),
    []
  );
  const { data: assignmentsData, loading: assignmentsLoading } = useAsyncData(
    () => listAssignments(),
    []
  );
  const { data: announcementsData, loading: announcementsLoading } = useAsyncData(
    () => listAnnouncements(),
    []
  );

  const courses = coursesData ?? [];
  const assignments = assignmentsData ?? [];
  const announcements = announcementsData ?? [];
  const isLoading = coursesLoading || assignmentsLoading || announcementsLoading;

  const results = useMemo(() => {
    if (!query) {
      return {
        courses: [],
        assignments: [],
        announcements: [],
      };
    }

    return {
      courses: courses.filter(
        (course) =>
          includesQuery(course.name, query) ||
          includesQuery(course.code, query) ||
          includesQuery(course.instructor, query)
      ),
      assignments: assignments.filter((assignment) => {
        const course = courses.find((item) => item.id === assignment.courseId);
        return (
          includesQuery(assignment.title, query) ||
          includesQuery(assignment.description, query) ||
          includesQuery(assignment.type, query) ||
          includesQuery(course?.name ?? "", query)
        );
      }),
      announcements: announcements.filter((announcement) => {
        const course = courses.find((item) => item.id === announcement.courseId);
        return (
          includesQuery(announcement.title, query) ||
          includesQuery(announcement.content, query) ||
          includesQuery(announcement.author, query) ||
          includesQuery(course?.name ?? "", query)
        );
      }),
    };
  }, [announcements, assignments, courses, query]);

  const totalResults =
    results.courses.length +
    results.assignments.length +
    results.announcements.length;

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-6">
      <PageBackButton
        to={isInstructor ? "/instructor" : "/student"}
        label="Back to Dashboard"
      />

      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search</h1>
          <p className="mt-1 text-gray-600">
            Search across courses, assignments, and announcements.
          </p>
        </div>

        <form
          className="flex gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const nextQuery = String(form.get("q") ?? "").trim();
            setSearchParams(nextQuery ? { q: nextQuery } : {});
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search courses, assignments, announcements..."
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            Loading search data...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !query ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            Enter a keyword to search the system.
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && query ? (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {totalResults} result{totalResults === 1 ? "" : "s"} for{" "}
            <span className="font-medium text-gray-900">"{query}"</span>
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Courses
              <Badge variant="outline">{results.courses.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.courses.length === 0 ? (
              <p className="text-sm text-gray-500">No matching courses.</p>
            ) : (
              results.courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-gray-50"
                  onClick={() =>
                    navigate(
                      isInstructor
                        ? `/instructor/course/${course.id}`
                        : `/course/${course.id}`
                    )
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{course.name}</p>
                      <p className="text-sm text-gray-600">
                        {course.code} · {course.instructor}
                      </p>
                    </div>
                    <Badge variant="outline">{course.students} students</Badge>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-green-600" />
              Assignments
              <Badge variant="outline">{results.assignments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.assignments.length === 0 ? (
              <p className="text-sm text-gray-500">No matching assignments.</p>
            ) : (
              results.assignments.map((assignment) => (
                <button
                  key={assignment.id}
                  type="button"
                  className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-gray-50"
                  onClick={() =>
                    navigate(
                      isInstructor
                        ? `/instructor/course/${assignment.courseId}/assignment/${assignment.id}`
                        : `/course/${assignment.courseId}/assignment/${assignment.id}`
                    )
                  }
                >
                  <p className="font-medium text-gray-900">{assignment.title}</p>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {assignment.description}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5 text-orange-600" />
              Announcements
              <Badge variant="outline">{results.announcements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.announcements.length === 0 ? (
              <p className="text-sm text-gray-500">No matching announcements.</p>
            ) : (
              results.announcements.map((announcement) => (
                <button
                  key={announcement.id}
                  type="button"
                  className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-gray-50"
                  onClick={() =>
                    navigate(
                      isInstructor
                        ? `/instructor/course/${announcement.courseId}`
                        : `/course/${announcement.courseId}`
                    )
                  }
                >
                  <p className="font-medium text-gray-900">{announcement.title}</p>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {announcement.content}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
